/* Documentação: comportamento e integrações específicas desta página. */
/* Loja Guia Panorama — primeira versão de teste com carrinho e envio NextGo Orders. */
const CONFIG = {
  cartId: 24140,
  cardRenderId: 38761,
  nextGoOrdersId: "115674d4-bb45-4ad9-95d6-7383fe19cecb",
  nextGoId: "DB56XKV",
  apiUrl: "https://api.nextgocard.com.br",
  orderApiUrl: "https://api.nextgoorders.com",
  statusUrl: "https://novo.nextgoorders.com/history-status/",
  productIds: {
    "Cardápio Digital": 1548725,
    "Catálogo Digital": 1548653,
    "Cartão de Visitas Digital": 1494441,
    SmallBio: 1494440,
    "Convite Digital": 1494444,
    "Sistema NextGo": 1886447,
    "Digisat Conecta": 1883932,
    "Digisat Web": 1883933,
    "Digisat G6 Full": 1883931,
    "Digisat G6 Pré-Pago": 1886080,
    "Digisat SaaS": 1886077,
    "Digisat Pedir Menu": 1883934,
    "Migração Digisat G6 Full": 1886078,
    "Renovação Digisat G6 Full": 1886079,
  },
  freight: { id: 5036, type: "free", price: 0 },
  // Cupons ativos copiados do catálogo legado; datas vazias indicam validade contínua.
  coupons: [
    {
      code: "PROMOPIX",
      paymentTypes: ["Pix", "Boleto"],
      defaultPaymentType: "Pix",
      enabled: true,
      type: "percentage",
      value: 40,
      minimum: 2000,
      validFrom: null,
      validUntil: null,
      productIds: [
        1548725, 1548653, 1494441, 1494440, 1494444, 1886447, 1883932,
        1883933, 1883931, 1886080, 1886077, 1883934, 1886078, 1886079,
      ],
      maxDiscount: null,
    },
    {
      code: "PROMO12X",
      paymentTypes: ["Cartão de Crédito"],
      defaultPaymentType: "Cartão de Crédito",
      enabled: true,
      type: "percentage",
      value: 20,
      minimum: 1200,
      validFrom: null,
      validUntil: null,
      productIds: [
        1548725, 1548653, 1494441, 1494440, 1494444, 1886447, 1883932,
        1883933, 1883931, 1886080, 1886077, 1883934, 1886078, 1886079,
      ],
      maxDiscount: null,
    },
    {
      code: "PROMO60",
      suggestInCart: false,
      enabled: true,
      type: "percentage",
      value: 60,
      minimum: 499,
      validFrom: null,
      validUntil: null,
      productIds: [1548725, 1548653],
      maxDiscount: null,
    },
    {
      code: "50OFF",
      suggestInCart: false,
      enabled: true,
      type: "percentage",
      value: 50,
      minimum: 149,
      validFrom: null,
      validUntil: null,
      productIds: [1548725, 1548653, 1494441, 1494440, 1494444, 1886447],
      maxDiscount: null,
    },
    {
      code: "MF8BN2",
      paymentTypes: ["Pix", "Boleto"],
      defaultPaymentType: "Pix",
      enabled: true,
      type: "fixed",
      value: 50,
      minimum: 350,
      validFrom: null,
      validUntil: null,
      productIds: [1494444],
      maxDiscount: null,
    },
    {
      code: "X5TNRI",
      paymentTypes: ["Pix", "Boleto"],
      defaultPaymentType: "Pix",
      enabled: true,
      type: "fixed",
      value: 79,
      minimum: 499.9,
      validFrom: null,
      validUntil: null,
      productIds: [1494441, 1494440],
      maxDiscount: null,
    },
    {
      code: "5UH5TY",
      paymentTypes: ["Pix", "Boleto"],
      defaultPaymentType: "Pix",
      enabled: true,
      type: "fixed",
      value: 50,
      minimum: 350,
      validFrom: null,
      validUntil: null,
      productIds: [1494440, 1494441],
      maxDiscount: null,
    },
    {
      code: "K71ZOK",
      paymentTypes: ["Pix", "Boleto"],
      defaultPaymentType: "Pix",
      enabled: true,
      type: "fixed",
      value: 100,
      minimum: 499,
      validFrom: null,
      validUntil: null,
      productIds: [1548653, 1548725],
      maxDiscount: null,
    },
  ],
  whatsappBusiness: "5518991938657",
};
const money = (v) =>
  Number(v || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
const stripHtml = (s) =>
  String(s || "")
    .replace(/<[^>]*>/g, "")
    .trim();
const catalog = window.NEXTGO_PRODUCTS || [];
const cart = [];
let activeCoupon = null;
let activeDiscount = 0;
const byId = (id) => catalog.find((p) => p.id === id);
const SAAS_PRODUCT_ID = 1886077;
const SAAS_BILLING_STEP_IDS = new Set([222799, 222800, 222801]);
const DIGISAT_CONECTA_PRODUCT_ID = 1883932;
const DIGISAT_CONECTA_STEP_ID = 222163;
const DIGISAT_CONECTA_PACKAGE_STEP_ID = 223920;
const DIGISAT_CONECTA_MONTHLY_COMPLEMENT_IDS = new Set([1420673, 1420674]);
const DIGISAT_CONECTA_PLAN_DURATIONS = new Map([
  [1420674, 12],
  [1420673, 12],
  [1420668, 12],
  [1420667, 12],
  [1420669, 6],
  [1420670, 6],
  [1420671, 3],
  [1420672, 3],
]);

function getDigisatConectaPlanId(product, selectedIds = []) {
  if (Number(product?.id) !== DIGISAT_CONECTA_PRODUCT_ID) return null;
  const planStep = product.complementSteps?.find(
    (step) => Number(step.id) === DIGISAT_CONECTA_STEP_ID,
  );
  return planStep?.complements.find((complement) =>
    selectedIds.includes(complement.id),
  )?.id;
}

function complementBillingMultiplier(product, step, complement, planId) {
  const isSaasMonthlyPrice =
    Number(product?.id) === SAAS_PRODUCT_ID &&
    SAAS_BILLING_STEP_IDS.has(Number(step?.id));
  if (
    Number(product?.id) === DIGISAT_CONECTA_PRODUCT_ID &&
    Number(step?.id) === DIGISAT_CONECTA_PACKAGE_STEP_ID
  ) {
    return DIGISAT_CONECTA_PLAN_DURATIONS.get(Number(planId)) || 1;
  }
  const isConectaMonthlyPrice =
    Number(product?.id) === DIGISAT_CONECTA_PRODUCT_ID &&
    Number(step?.id) === DIGISAT_CONECTA_STEP_ID &&
    DIGISAT_CONECTA_MONTHLY_COMPLEMENT_IDS.has(Number(complement?.id));
  return isSaasMonthlyPrice || isConectaMonthlyPrice ? 12 : 1;
}
const DIGISAT_PRODUCT_IDS = new Set([1883931, SAAS_PRODUCT_ID]);
const DIGISAT_SYSTEM_STEP_IDS = new Set([222159, 222799]);
const DIGISAT_MODULE_STEP_IDS = new Set([222160, 222800]);
const DIGISAT_USER_STEP_IDS = new Set([222161, 222801]);

function normalizeProductText(value) {
  return stripHtml(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function getDigisatSystemType(complement) {
  const title = normalizeProductText(complement?.title);
  if (title.includes("administrador")) return "administrador";
  if (title.includes("gerencial")) return "gerencial";
  if (title.includes("comercial")) return "comercial";
  if (title.includes("mei")) return "mei";
  if (title.includes("digisat web")) return "web";
  if (title.includes("pedir menu")) return "menu";
  return null;
}

function getDigisatSystemSelection(product, selected) {
  const systemStep = product.complementSteps?.find((step) =>
    DIGISAT_SYSTEM_STEP_IDS.has(Number(step.id)),
  );
  const selectedSystemId = selected[0]?.[0];
  return systemStep?.complements.find(
    (complement) => complement.id === selectedSystemId,
  );
}

function isDigisatComplementAvailable(product, step, complement, selected) {
  if (!DIGISAT_PRODUCT_IDS.has(Number(product?.id))) return true;
  const system = getDigisatSystemSelection(product, selected);
  if (!system || DIGISAT_SYSTEM_STEP_IDS.has(Number(step.id))) return true;

  const systemType = getDigisatSystemType(system);
  if (DIGISAT_MODULE_STEP_IDS.has(Number(step.id))) {
    const title = normalizeProductText(complement.title);
    if (["web", "menu"].includes(systemType)) return false;
    if (systemType === "administrador") {
      return /pdv off.?line|power b\.?i\.?|tunel/.test(title);
    }
    if (/power b\.?i\.?/.test(title)) {
      return ["mei", "comercial", "gerencial"].includes(systemType);
    }
    const matches = title.match(/\(([^)]*)\)/g) || [];
    const eligibleTypes = matches.flatMap((group) =>
      group
        .slice(1, -1)
        .split("/")
        .map((name) => normalizeProductText(name).trim()),
    );
    if (eligibleTypes.includes("todos os sistemas")) {
      return ["mei", "comercial", "gerencial"].includes(systemType);
    }
    return eligibleTypes.includes(systemType);
  }

  if (DIGISAT_USER_STEP_IDS.has(Number(step.id))) {
    const title = normalizeProductText(complement.title);
    if (title.includes("administrador")) return systemType === "administrador";
    if (title.includes("gerencial")) return systemType === "gerencial";
    if (title.includes("digisat web")) return systemType === "web";
    return false;
  }
  return true;
}

function getVisibleProductComplements(product, step, selected) {
  return (step.complements || []).filter(
    (complement) =>
      (!complement.supply_control || Number(complement.supply) > 0) &&
      isDigisatComplementAvailable(product, step, complement, selected),
  );
}

function getVisibleWizardStepIndexes(product, steps, selected) {
  return steps.reduce((visibleIndexes, step, index) => {
    if (
      index === 0 ||
      getVisibleProductComplements(product, step, selected).length > 0
    ) {
      visibleIndexes.push(index);
    }
    return visibleIndexes;
  }, []);
}

let productWizard = null;
function createProductWizard() {
  const overlay = document.createElement("div");
  overlay.className = "gp-config-modal";
  overlay.setAttribute("aria-hidden", "true");
  overlay.innerHTML = `
    <div class="gp-config-backdrop" data-wizard-close></div>
    <section class="gp-config-panel" role="dialog" aria-modal="true" aria-labelledby="gpConfigTitle">
      <button type="button" class="gp-config-close" aria-label="Fechar" data-wizard-close>×</button>
      <p class="gp-config-progress" id="gpConfigProgress"></p>
      <h2 id="gpConfigTitle"></h2>
      <p class="gp-config-question" id="gpConfigQuestion"></p>
      <div class="gp-config-choices" id="gpConfigChoices"></div>
      <p class="gp-config-total" id="gpConfigTotal" aria-live="polite"></p>
      <p class="gp-config-error" id="gpConfigError" role="alert" hidden></p>
      <div class="gp-config-actions">
        <button type="button" class="btn-gp btn-gp-outline" id="gpConfigBack">Cancelar</button>
        <button type="button" class="btn-gp" id="gpConfigNext">Continuar</button>
      </div>
    </section>`;
  document.body.append(overlay);
  overlay.querySelectorAll("[data-wizard-close]").forEach((node) =>
    node.addEventListener("click", closeProductWizard),
  );
  overlay.querySelector("#gpConfigBack").addEventListener("click", () => {
    const visibleIndexes = getVisibleWizardStepIndexes(
      productWizard.product,
      productWizard.steps,
      productWizard.selected,
    );
    const previousIndexes = visibleIndexes.filter(
      (index) => index < productWizard.step,
    );
    const previousIndex = previousIndexes[previousIndexes.length - 1];
    if (previousIndex !== undefined) {
      productWizard.step = previousIndex;
      renderProductWizard();
    } else closeProductWizard();
  });
  overlay.querySelector("#gpConfigNext").addEventListener("click", () => {
    const current = productWizard?.steps[productWizard.step];
    const chosen = productWizard?.selected[productWizard.step] || [];
    if (chosen.filter((id) => id > 0).length < Number(current?.minAmount || 0)) {
      productWizard.validationVisible = true;
      renderProductWizard();
      return;
    }
    const nextIndex = getVisibleWizardStepIndexes(
      productWizard.product,
      productWizard.steps,
      productWizard.selected,
    ).find((index) => index > productWizard.step);
    if (nextIndex !== undefined) {
      productWizard.step = nextIndex;
      renderProductWizard();
      return;
    }
    const { button, selected } = productWizard;
    closeProductWizard();
    addConfiguredProduct(button, selected);
  });
  overlay.querySelector("#gpConfigChoices").addEventListener("change", (event) => {
    const step = productWizard.steps[productWizard.step];
    const currentSelection = productWizard.selected[productWizard.step] || [];
    if (event.target.type === "radio") {
      productWizard.selected[productWizard.step] = [Number(event.target.value)];
      if (
        DIGISAT_PRODUCT_IDS.has(Number(productWizard.product.id)) &&
        DIGISAT_SYSTEM_STEP_IDS.has(Number(step.id))
      ) {
        productWizard.steps.forEach((laterStep, index) => {
          if (index <= productWizard.step) return;
          const availableIds = getVisibleProductComplements(
            productWizard.product,
            laterStep,
            productWizard.selected,
          ).map((complement) => complement.id);
          productWizard.selected[index] = (
            productWizard.selected[index] || []
          ).filter((id) => availableIds.includes(id));
        });
      }
    } else {
      const selectedId = Number(event.target.value);
      const nextSelection = event.target.checked
        ? [...currentSelection, selectedId]
        : currentSelection.filter((id) => id !== selectedId);
      const maxAmount = Number(step.maxAmount || 0);
      if (maxAmount > 0 && nextSelection.length > maxAmount) {
        event.target.checked = false;
      } else {
        productWizard.selected[productWizard.step] = nextSelection;
      }
    }
    productWizard.validationVisible = false;
    renderProductWizard();
    overlay.querySelector("#gpConfigChoices input:checked")?.focus();
  });
  return overlay;
}
function closeProductWizard() {
  if (!productWizard) return;
  const overlay = document.querySelector(".gp-config-modal");
  overlay?.classList.remove("is-open");
  overlay?.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gp-modal-open");
  productWizard = null;
}
function renderProductWizard() {
  if (!productWizard) return;
  const { product, steps, step, selected } = productWizard;
  const overlay = document.querySelector(".gp-config-modal");
  const current = steps[step];
  const visibleIndexes = getVisibleWizardStepIndexes(product, steps, selected);
  const visibleStepNumber = visibleIndexes.indexOf(step) + 1;
  overlay.querySelector("#gpConfigTitle").textContent = stripHtml(product.title);
  overlay.querySelector("#gpConfigProgress").textContent = `Etapa ${visibleStepNumber} de ${visibleIndexes.length}`;
  overlay.querySelector("#gpConfigQuestion").textContent = current.title;
  const choices = overlay.querySelector("#gpConfigChoices");
  choices.replaceChildren();
  const minAmount = Number(current.minAmount || 0);
  const maxAmount = Number(current.maxAmount || 0);
  const singleChoice = maxAmount === 1;
  if (minAmount === 0 && singleChoice) {
    const label = document.createElement("label");
    label.className = "gp-config-choice";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "gpProductComplement";
    input.value = -1;
    input.checked = (selected[step] || []).includes(-1);
    const details = document.createElement("span");
    const name = document.createElement("strong");
    name.textContent = /vender|carrinho/i.test(current.title)
      ? "Sem carrinho ou sistema adicional"
      : "Sem sistema adicional";
    details.append(name);
    const price = document.createElement("b");
    price.textContent = money(0);
    label.append(input, details, price);
    choices.append(label);
  }
  getVisibleProductComplements(product, current, selected)
    .forEach((complement) => {
      const label = document.createElement("label");
      label.className = "gp-config-choice";
      const input = document.createElement("input");
      input.type = singleChoice ? "radio" : "checkbox";
      input.name = "gpProductComplement";
      input.value = complement.id;
      input.checked = (selected[step] || []).includes(complement.id);
      const details = document.createElement("span");
      const name = document.createElement("strong");
      name.textContent = stripHtml(complement.title);
      details.append(name);
      if (complement.description) {
        const description = document.createElement("small");
        description.textContent = stripHtml(complement.description);
        details.append(description);
      }
      const price = document.createElement("b");
      const selectedPlanId = getDigisatConectaPlanId(product, selected.flat());
      const multiplier = complementBillingMultiplier(
        product,
        current,
        complement,
        selectedPlanId,
      );
      price.textContent =
        multiplier === 12
          ? `${money(complement.price)} / mês`
          : money(complement.price);
      label.append(input, details, price);
      choices.append(label);
    });
  const base = Number(String(product.price || 0).replace(",", ".")) || 0;
  const selectedComplementTotal = selected.reduce((total, ids, index) => {
    const selectedStep = steps[index];
    const selectedPlanId = getDigisatConectaPlanId(product, selected.flat());
    const selectedPrices = (ids || [])
      .filter((id) =>
        getVisibleProductComplements(product, selectedStep, selected).some(
          (complement) => complement.id === id,
        ),
      )
      .map((id) => {
        const complement = selectedStep.complements.find(
          (item) => item.id === id,
        );
        return (
          (Number(complement?.price) || 0) *
          complementBillingMultiplier(
            product,
            selectedStep,
            complement,
            selectedPlanId,
          )
        );
      });
    return (
      total +
      selectedPrices.reduce((sum, price) => sum + price, 0)
    );
  }, 0);
  const total = base + selectedComplementTotal;
  const hasConectaMonthlyComplement = selected.some((ids) =>
    (ids || []).some((id) =>
      DIGISAT_CONECTA_MONTHLY_COMPLEMENT_IDS.has(Number(id)),
    ),
  );
  const conectaPlanDuration = DIGISAT_CONECTA_PLAN_DURATIONS.get(
    Number(getDigisatConectaPlanId(product, selected.flat())),
  );
  overlay.querySelector("#gpConfigTotal").textContent =
    `Total da configuração${Number(product.id) === SAAS_PRODUCT_ID || hasConectaMonthlyComplement || conectaPlanDuration ? ` (${conectaPlanDuration || 12} meses)` : ""}: ${money(total)}`;
  const next = overlay.querySelector("#gpConfigNext");
  const isLastVisibleStep = visibleIndexes[visibleIndexes.length - 1] === step;
  next.textContent =
    isLastVisibleStep ? "Adicionar ao carrinho" : "Continuar";
  const back = overlay.querySelector("#gpConfigBack");
  back.textContent = visibleStepNumber === 1 ? "Cancelar" : "Voltar";
  const error = overlay.querySelector("#gpConfigError");
  error.hidden =
    !productWizard.validationVisible ||
    (selected[step] || []).filter((id) => id > 0).length >= minAmount;
  error.textContent = error.hidden ? "" : "Escolha uma opção para continuar.";
}
function openProductWizard(button, product) {
  const steps = (product.complementSteps || []).filter(
    (step) => step.complements?.length,
  );
  if (!steps.length) return false;
  if (!document.querySelector(".gp-config-modal")) createProductWizard();
  productWizard = {
    button,
    product,
    steps,
    step: 0,
    selected: Array.from({ length: steps.length }, () => []),
    validationVisible: false,
  };
  renderProductWizard();
  const overlay = document.querySelector(".gp-config-modal");
  overlay.classList.add("is-open");
  overlay.setAttribute("aria-hidden", "false");
  document.body.classList.add("gp-modal-open");
  overlay.querySelector(".gp-config-close").focus();
  return true;
}
// Monta um item de pedido com produto, opções e complementos selecionados.
function makeItem(productName, options = {}) {
  const product = byId(options.productId || CONFIG.productIds[productName]);
  if (!product)
    throw new Error(
      `Não foi possível localizar o produto original: ${productName}`,
    );
  const quantity = options.quantity || 1;
  const selectedIds = options.complementIds || [];
  const selectedPlanId = getDigisatConectaPlanId(product, selectedIds);
  const steps = (product.complementSteps || []).filter(
    (step) => step.complements?.length,
  );
  const selectedComplementSteps = steps.reduce(
    (steps, step, index) => {
      const complements = (step.complements || [])
        .filter((complement) => selectedIds.includes(complement.id))
        .map((complement) => ({
          id: complement.id,
          price:
            Number(complement.price || 0) *
            complementBillingMultiplier(
              product,
              step,
              complement,
              selectedPlanId,
            ),
          amount: 1,
          title: stripHtml(complement.title),
        }));
      if (complements.length) {
        steps.push({ title: step.title, page: index + 1, complements });
      }
      return steps;
    },
    [],
  );
  const complements = selectedComplementSteps.flatMap((step) => step.complements);
  const basePrice = Number(String(product.price || 0).replace(",", ".")) || 0;
  const price =
    basePrice +
    complements.reduce(
      (sum, complement) =>
        sum + Number(complement.price || 0) * Number(complement.amount || 1),
      0,
    );
  return {
    ...product,
    id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    title: stripHtml(product.title),
    description: stripHtml(product.description),
    price,
    amount: quantity,
    choosedProductComplements: complements,
    selectedComplementSteps,
    observations: "",
  };
}
// Adiciona ao carrinho o produto configurado pelo formulário.
function addConfiguredProduct(button, selectedComplementIds = []) {
  if (!cart.length) {
    activeCoupon = null;
    activeDiscount = 0;
    clearOrderPresentation();
  }
  const productId =
    Number(button.dataset.productId) || CONFIG.productIds[button.dataset.product];
  const product = byId(productId);
  const name = button.dataset.product || stripHtml(product?.title);
  let item;
  item = makeItem(name, {
    productId,
    complementIds: selectedComplementIds
      .flatMap((ids) => ids || [])
      .filter((id) => id > 0),
  });
  // Mantém as escolhas de complementos e os respectivos IDs do catálogo NextGo original.
  const existing = cart.find(
    (x) =>
      x.productId === item.productId &&
      JSON.stringify(x.choosedProductComplements?.map((c) => c.id)) ===
        JSON.stringify(item.choosedProductComplements?.map((c) => c.id)),
  );
  if (existing && !item.choosedProductComplements?.length) existing.amount += 1;
  else cart.push(item);
  renderCart();
  const old = button.textContent;
  button.textContent = "Adicionado ✓";
  window.setTimeout(() => {
    button.innerHTML = old;
  }, 1400);
}
function getProductPriceRange(product) {
  const basePrice =
    Number(String(product.price || 0).replace(",", ".")) || 0;
  if (Number(product.id) === DIGISAT_CONECTA_PRODUCT_ID) {
    const planStep = product.complementSteps.find(
      (step) => Number(step.id) === DIGISAT_CONECTA_STEP_ID,
    );
    const packageStep = product.complementSteps.find(
      (step) => Number(step.id) === DIGISAT_CONECTA_PACKAGE_STEP_ID,
    );
    const packagePrices = (packageStep?.complements || [])
      .filter(
        (complement) =>
          !complement.supply_control || Number(complement.supply) > 0,
      )
      .map((complement) => Number(complement.price) || 0)
      .sort((a, b) => b - a)
      .slice(0, Number(packageStep?.maxAmount) || undefined);
    const planTotals = (planStep?.complements || []).map((plan) => {
      const planId = Number(plan.id);
      const planPrice =
        (Number(plan.price) || 0) *
        complementBillingMultiplier(product, planStep, plan, planId);
      const duration = DIGISAT_CONECTA_PLAN_DURATIONS.get(planId) || 1;
      const maxPackages = packagePrices.reduce(
        (sum, price) => sum + price * duration,
        0,
      );
      return {
        minimum: basePrice + planPrice,
        maximum: basePrice + planPrice + maxPackages,
      };
    });
    return {
      minimum: Math.min(...planTotals.map((total) => total.minimum)),
      maximum: Math.max(...planTotals.map((total) => total.maximum)),
    };
  }
  let minimum = basePrice;
  let maximum = basePrice;
  const steps = (product.complementSteps || []).filter(
    (step) => step.complements?.length,
  );

  steps.forEach((step, index) => {
    const prices = step.complements
      .filter(
        (complement) =>
          !complement.supply_control || Number(complement.supply) > 0,
      )
      .map(
        (complement) =>
          (Number(complement.price) || 0) *
          complementBillingMultiplier(product, step, complement),
      )
      .sort((a, b) => a - b);
    const configuredMinimum = Number(step.minAmount) || 0;
    const minimumChoices =
      index === 0 && basePrice === 0 && configuredMinimum === 0
        ? 1
        : configuredMinimum;
    const selectedMinimum = Math.min(minimumChoices, prices.length);
    minimum += prices
      .slice(0, selectedMinimum)
      .reduce((total, price) => total + price, 0);

    const configuredMaximum = Number(step.maxAmount) || 0;
    const maximumChoices =
      configuredMaximum === 0
        ? prices.length
        : Math.min(configuredMaximum, prices.length);
    const maximumPrices =
      configuredMaximum === 0 ? prices : prices.slice(-maximumChoices);
    maximum += maximumPrices.reduce((total, price) => total + price, 0);
  });

  return { minimum, maximum };
}
function renderSystemProducts() {
  const categoryContainers = {
    Sistemas: document.getElementById("gpProductsSistemas"),
    Upgrade: document.getElementById("gpProductsUpgrade"),
    Renovação: document.getElementById("gpProductsRenovacao"),
  };
  const products = catalog.filter((product) =>
    ["Sistemas", "Upgrade", "Renovação"].includes(product.category_name),
  );
  products.forEach((product) => {
    const container = categoryContainers[product.category_name];
    if (!container) return;
    const unavailable =
      product.disable_product ||
      (product.supply_control && Number(product.supply) <= 0);
    if (unavailable) return;
    const title = stripHtml(product.title) || "Descrição aqui";
    const description = stripHtml(product.description) || "Descrição aqui";
    const priceRange = getProductPriceRange(product);
    const col = document.createElement("div");
    col.className = "col-sm-6 col-xl-4";
    const card = document.createElement("article");
    card.className = "product-card h-100";
    const art = document.createElement("div");
    art.className = "product-art";
    const imageUrl =
      product.productImages?.[0]?.image || product.image_url || product.image;
    if (imageUrl) {
      const image = document.createElement("img");
      image.className = "product-image";
      image.src = imageUrl;
      image.alt = `Imagem de ${title}`;
      image.loading = "lazy";
      art.append(image);
    }
    const tile = document.createElement("div");
    tile.className = "art-tile";
    tile.setAttribute("aria-hidden", "true");
    tile.innerHTML =
      '<svg viewBox="0 0 24 24" fill="none" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="16" rx="2"></rect><path d="M8 9h8M8 13h5"></path></svg>';
    art.append(tile);
    const body = document.createElement("div");
    body.className = "product-body";
    const tag = document.createElement("span");
    tag.className = "product-tag";
    tag.textContent = product.category_name || "Sistema";
    const heading = document.createElement("h3");
    heading.textContent = title;
    const text = document.createElement("p");
    text.textContent = description;
    const cost = document.createElement("div");
    cost.className = "price";
    cost.textContent =
      `${money(priceRange.minimum)} ~ ${money(priceRange.maximum)}`;
    const priceNote = document.createElement("p");
    priceNote.className = "price-note";
    priceNote.textContent =
      Number(product.id) === SAAS_PRODUCT_ID
        ? "Faixa calculada para o período mínimo de 12 meses; as configurações alteram o valor."
        : "O valor final varia conforme o sistema e as configurações escolhidas.";
    const button = document.createElement("a");
    button.className = "btn-gp w-100 mt-3 whatsapp-config";
    button.href = "#solucoes";
    button.dataset.productId = product.id;
    button.textContent = "Personalizar meu produto";
    body.append(tag, heading, text, cost, priceNote, button);
    card.append(art, body);
    col.append(card);
    container.append(col);
  });
}
renderSystemProducts();
document.addEventListener("click", (event) => {
  const button = event.target.closest(".whatsapp-config, .whatsapp-fixed");
  if (!button) return;
  event.preventDefault();
  const productId = Number(button.dataset.productId) ||
    CONFIG.productIds[button.dataset.product];
  const product = byId(productId);
  if (!product || !openProductWizard(button, product)) addConfiguredProduct(button);
});
// Calcula o subtotal dos itens presentes no carrinho.
function cartSubtotal() {
  return cart.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.amount || 1),
    0,
  );
}
// Calcula o total do pedido com desconto e frete.
function cartTotal() {
  return Math.max(
    0,
    cartSubtotal() - activeDiscount + Number(CONFIG.freight.price || 0),
  );
}
// Calcula o subtotal elegível para aplicação de cupom.
function couponEligibleSubtotal(coupon) {
  const ids = Array.isArray(coupon.productIds)
    ? coupon.productIds.map(Number)
    : [];
  return cart
    .filter((item) => ids.length === 0 || ids.includes(Number(item.productId)))
    .reduce(
      (sum, item) => sum + Number(item.price || 0) * Number(item.amount || 1),
      0,
    );
}
function couponPaymentIsAllowed(coupon, paymentType) {
  return (
    !coupon?.paymentTypes?.length || coupon.paymentTypes.includes(paymentType)
  );
}
// Determina o desconto válido para um cupom e a data atual.
function getCouponDiscount(coupon, now = new Date()) {
  if (!coupon || coupon.enabled === false)
    return { error: "Este cupom não está ativo." };
  const date = [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("-");
  const validDate = (value) => {
    if (!value) return true;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
    const [year, month, day] = value.split("-").map(Number);
    const parsed = new Date(year, month - 1, day);
    return (
      parsed.getFullYear() === year &&
      parsed.getMonth() === month - 1 &&
      parsed.getDate() === day
    );
  };
  if (!validDate(coupon.validFrom) || !validDate(coupon.validUntil))
    return {
      error: "As datas configuradas para este cupom devem usar YYYY-MM-DD.",
    };
  if (coupon.validFrom && date < coupon.validFrom)
    return { error: "Este cupom ainda não está válido." };
  if (coupon.validUntil && date > coupon.validUntil)
    return { error: "Este cupom expirou." };
  if (
    !Number.isFinite(Number(coupon.minimum || 0)) ||
    Number(coupon.minimum || 0) < 0
  )
    return { error: "O valor mínimo configurado para este cupom é inválido." };
  const eligibleSubtotal = couponEligibleSubtotal(coupon);
  if (eligibleSubtotal <= 0)
    return { error: "O cupom não se aplica aos produtos do carrinho." };
  if (eligibleSubtotal < Number(coupon.minimum || 0))
    return {
      error: `O valor mínimo para este cupom é ${money(coupon.minimum)}.`,
    };
  const value = Number(coupon.value);
  if (
    !Number.isFinite(value) ||
    value <= 0 ||
    !["percentage", "fixed"].includes(coupon.type)
  )
    return { error: "A regra deste cupom está incompleta." };
  if (coupon.type === "percentage" && value > 100)
    return { error: "O percentual configurado para este cupom é inválido." };
  if (
    coupon.maxDiscount != null &&
    (!Number.isFinite(Number(coupon.maxDiscount)) ||
      Number(coupon.maxDiscount) <= 0)
  )
    return { error: "O limite de desconto configurado é inválido." };
  let discount =
    coupon.type === "percentage" ? (eligibleSubtotal * value) / 100 : value;
  if (coupon.maxDiscount != null)
    discount = Math.min(discount, Number(coupon.maxDiscount));
  return { discount: Number(Math.min(discount, eligibleSubtotal).toFixed(2)) };
}
// Revalida o cupom e atualiza o desconto do pedido.
function recalculateCoupon() {
  if (!activeCoupon) {
    activeDiscount = 0;
    return;
  }
  if (!couponPaymentIsAllowed(activeCoupon, paymentSelect.value)) {
    const removedCode = activeCoupon.code;
    activeCoupon = null;
    activeDiscount = 0;
    document.getElementById("gpCoupon").value = "";
    document.getElementById("gpCouponMessage").textContent =
      `Cupom ${removedCode} removido porque não é válido para ${paymentSelect.value || "a forma de pagamento selecionada"}.`;
    return;
  }
  const result = getCouponDiscount(activeCoupon);
  if (result.error) {
    activeCoupon = null;
    activeDiscount = 0;
    const status = document.getElementById("gpCouponMessage");
    if (status) status.textContent = result.error;
    return;
  }
  activeDiscount = result.discount;
}
// Limpa a interface de confirmação de pedido anterior.
function clearOrderPresentation() {
  const message = document.getElementById("gpCheckoutMessage");
  message.replaceChildren();
  message.className = "";
  document.getElementById("gpCouponMessage").textContent = "";
}
function renderCouponSuggestions() {
  const container = document.getElementById("gpCouponSuggestions");
  if (!container) return;
  container.replaceChildren();
  const productIds = new Set(cart.map((item) => Number(item.productId)));
  const suggestions = CONFIG.coupons.filter(
    (coupon) =>
      coupon.suggestInCart !== false &&
      coupon.paymentTypes?.length > 0 &&
      coupon.enabled !== false &&
      !activeCoupon &&
      (coupon.productIds || []).some((id) => productIds.has(Number(id))) &&
      !getCouponDiscount(coupon).error,
  );
  if (!suggestions.length) {
    if (cart.length > 0 && !activeCoupon) {
      const emptyMessage = document.createElement("p");
      emptyMessage.className = "gp-coupon-empty";
      emptyMessage.textContent =
        "Nenhum cupom disponível nesta lista para os produtos e subtotal atuais.";
      container.append(emptyMessage);
      container.hidden = false;
    } else {
      container.hidden = true;
    }
    return;
  }
  suggestions.forEach((coupon) => {
    const discount =
      coupon.type === "percentage"
        ? `${coupon.value}%`
        : money(coupon.value);
    const payment = coupon.paymentTypes.includes("Boleto")
      ? " no PIX ou Boleto"
      : " no cartão de crédito";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "gp-coupon-suggestion";
    button.dataset.couponCode = coupon.code;
    button.textContent = `${coupon.code} · ${discount} de desconto${payment} · mínimo ${money(coupon.minimum)}`;
    container.append(button);
  });
  container.hidden = false;
}
// Atualiza a lista de itens, quantidades e totais do carrinho.
function renderCart() {
  document.getElementById("gpCouponIntro").hidden = cart.length === 0;
  document
    .getElementById("gpCartLauncher")
    ?.classList.toggle("is-visible", cart.length > 0);
  recalculateCoupon();
  renderCouponSuggestions();
  document.getElementById("gpModalTotal").textContent = money(cartTotal());
  document.getElementById("gpSubtotal").textContent = money(cartSubtotal());
  document.getElementById("gpDiscount").textContent =
    `− ${money(activeDiscount)}`;
  document.getElementById("gpFreight").textContent =
    Number(CONFIG.freight.price || 0) === 0
      ? "Grátis"
      : money(CONFIG.freight.price);
  const list = document.getElementById("gpCartItems");
  list.replaceChildren();
  if (!cart.length) {
    list.innerHTML =
      '<p class="gp-empty-cart">Seu carrinho está vazio. Adicione uma solução para continuar.</p>';
    return;
  }
  cart.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "gp-cart-item";
    const info = document.createElement("div");
    const title = document.createElement("strong");
    title.textContent = stripHtml(item.title);
    info.append(title);
    const sourceProduct = byId(item.productId);
    const selectedConectaPlanId = getDigisatConectaPlanId(
      sourceProduct,
      (item.choosedProductComplements || []).map((complement) =>
        Number(complement.id),
      ),
    );
    const selectedConectaPlanDuration =
      DIGISAT_CONECTA_PLAN_DURATIONS.get(Number(selectedConectaPlanId));
    (item.choosedProductComplements || []).forEach((c) => {
      const p = document.createElement("small");
      const isSaasComplement = Number(item.productId) === SAAS_PRODUCT_ID;
      const isConectaPlanComplement =
        DIGISAT_CONECTA_PLAN_DURATIONS.has(Number(c.id));
      const isConectaPackageComplement = sourceProduct?.complementSteps
        ?.find((step) => Number(step.id) === DIGISAT_CONECTA_PACKAGE_STEP_ID)
        ?.complements.some((complement) => complement.id === c.id);
      const isConectaDurationComplement =
        selectedConectaPlanDuration &&
        (isConectaPlanComplement || isConectaPackageComplement);
      p.textContent =
        isSaasComplement || isConectaDurationComplement
          ? `${stripHtml(c.title)} (12 meses: ${money(c.price)})`
          : `${stripHtml(c.title)} (+${money(c.price)})`;
      if (isConectaDurationComplement && !isSaasComplement) {
        p.textContent = `${stripHtml(c.title)} (${selectedConectaPlanDuration} meses: ${money(c.price)})`;
      }
      info.append(p);
    });
    const price = document.createElement("span");
    price.className = "gp-item-price";
    price.textContent = money(item.price * item.amount);
    const controls = document.createElement("div");
    controls.className = "gp-item-controls";
    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.setAttribute("aria-label", "Diminuir quantidade");
    minus.onclick = () => {
      if (item.amount > 1) item.amount--;
      else cart.splice(index, 1);
      renderCart();
    };
    const qty = document.createElement("span");
    qty.textContent = item.amount;
    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.setAttribute("aria-label", "Aumentar quantidade");
    plus.onclick = () => {
      item.amount++;
      renderCart();
    };
    const remove = document.createElement("button");
    remove.type = "button";
    remove.className = "gp-remove-item";
    remove.textContent = "Remover";
    remove.onclick = () => {
      cart.splice(index, 1);
      renderCart();
    };
    controls.append(minus, qty, plus, remove);
    row.append(info, price, controls);
    list.append(row);
  });
}
const modal = document.getElementById("gpCheckoutModal");
const successModal = document.getElementById("gpOrderSuccessModal");
let successActionTaken = false;
// Abre o painel do carrinho e atualiza seu conteúdo.
function openCart() {
  renderCart();
  modal.classList.add("is-open");
  modal.setAttribute("aria-hidden", "false");
  document.body.classList.add("gp-modal-open");
}
// Fecha o painel do carrinho e remove o estado visual de abertura.
function closeCart() {
  modal.classList.remove("is-open");
  modal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gp-modal-open");
}
// Libera a janela de confirmação para exibir o resultado do pedido.
function unlockSuccessModal() {
  successActionTaken = true;
  document.getElementById("gpSuccessClose").hidden = false;
  document.getElementById("gpSuccessCloseFooter").hidden = false;
}
// Fecha a janela de confirmação do pedido.
function closeSuccessModal() {
  if (!successActionTaken) return;
  successModal.classList.remove("is-open");
  successModal.setAttribute("aria-hidden", "true");
  document.body.classList.remove("gp-modal-open");
  document.getElementById("gpSuccessOrderSummary").replaceChildren();
  document.getElementById("gpSuccessActions").replaceChildren();
  document.getElementById("gpSuccessClose").hidden = true;
  document.getElementById("gpSuccessCloseFooter").hidden = true;
  successActionTaken = false;
}
// Exibe os dados de confirmação e as ações disponíveis para o pedido.
function showOrderSuccess({
  orderId,
  statusLink,
  paymentUrl,
  whatsappUrl,
  total,
  paymentType,
  domain,
}) {
  const summary = document.getElementById("gpSuccessOrderSummary");
  const actions = document.getElementById("gpSuccessActions");
  const order = document.createElement("p");
  order.className = "gp-success-order-id";
  order.textContent = `Pedido #${orderId}`;
  const details = document.createElement("p");
  details.textContent = `Total: ${money(total)} · Pagamento: ${paymentType}`;
  const domainDetails = document.createElement("p");
  domainDetails.textContent = `Domínio informado: ${domain}`;
  const tracking = document.createElement("a");
  tracking.href = statusLink;
  tracking.target = "_blank";
  tracking.rel = "noopener noreferrer";
  tracking.textContent = "Acompanhar pedido";
  tracking.className = "gp-tracking-link";
  summary.replaceChildren(order, details, domainDetails, tracking);
  actions.replaceChildren();
  if (paymentUrl) {
    const payment = document.createElement("a");
    payment.href = paymentUrl;
    payment.target = "_blank";
    payment.rel = "noopener noreferrer";
    payment.textContent = "Continuar para pagamento";
    payment.className = "btn-gp gp-success-action";
    payment.addEventListener("click", unlockSuccessModal);
    actions.append(payment);
  }
  if (whatsappUrl) {
    const whatsapp = document.createElement("a");
    whatsapp.href = whatsappUrl;
    whatsapp.target = "_blank";
    whatsapp.rel = "noopener noreferrer";
    whatsapp.textContent = "Confirmar pelo WhatsApp";
    whatsapp.className = "btn-gp gp-success-action gp-whatsapp-action";
    whatsapp.addEventListener("click", unlockSuccessModal);
    actions.append(whatsapp);
  }
  successActionTaken = false;
  document.getElementById("gpSuccessClose").hidden = true;
  document.getElementById("gpSuccessCloseFooter").hidden = true;
  if (!actions.childElementCount) unlockSuccessModal();
  successModal.classList.add("is-open");
  successModal.setAttribute("aria-hidden", "false");
  document.body.classList.add("gp-modal-open");
}
document.getElementById("gpOpenCart").addEventListener("click", openCart);
document
  .querySelectorAll("[data-close-cart]")
  .forEach((el) => el.addEventListener("click", closeCart));
document
  .querySelectorAll("[data-close-success]")
  .forEach((el) => el.addEventListener("click", closeSuccessModal));
document
  .getElementById("gpSuccessClose")
  .addEventListener("click", closeSuccessModal);
document
  .getElementById("gpSuccessCloseFooter")
  .addEventListener("click", closeSuccessModal);
// Inicialização/interação global da página.
document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (productWizard) closeProductWizard();
  else if (successModal.classList.contains("is-open")) closeSuccessModal();
  else closeCart();
});
const checkoutForm = document.getElementById("gpCheckoutForm");
const addressFields = document.getElementById("gpAddressFields");
const deliverySelect = checkoutForm.elements.delivery_method;
const paymentSelect = checkoutForm.elements.payment_type;
// Ajusta os campos do formulário conforme a modalidade de entrega.
function setDeliveryFields() {
  const addressNeeded = deliverySelect.value === "delivery";
  addressFields.classList.toggle("d-none", !addressNeeded);
  addressFields.querySelectorAll("input").forEach((input) => {
    input.required = addressNeeded && input.name !== "streetComplement";
    input.disabled = !addressNeeded;
  });
  checkoutForm.elements.delivery_extra_info.required = true;
}
deliverySelect.addEventListener("change", setDeliveryFields);
setDeliveryFields();
// Valida o formato e os dígitos verificadores do CPF ou CNPJ informado.
function validCpfCnpj(value) {
  const digits = String(value || "").replace(/\D/g, "");
  if (digits.length === 11) {
    if (/^(\d)\1+$/.test(digits)) return false;
    const sum1 = digits
      .slice(0, 9)
      .split("")
      .reduce((s, n, i) => s + Number(n) * (10 - i), 0);
    const d1 = ((sum1 * 10) % 11) % 10;
    const sum2 =
      digits
        .slice(0, 9)
        .split("")
        .reduce((s, n, i) => s + Number(n) * (11 - i), 0) +
      d1 * 2;
    const d2 = ((sum2 * 10) % 11) % 10;
    return digits.slice(9) === `${d1}${d2}`;
  }
  if (digits.length === 14) {
    if (/^(\d)\1+$/.test(digits)) return false;
    const calc = (base, weights) => {
      const sum = base
        .split("")
        .reduce((s, n, i) => s + Number(n) * weights[i], 0);
      const r = sum % 11;
      return r < 2 ? 0 : 11 - r;
    };
    const d1 = calc(digits.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const d2 = calc(
      digits.slice(0, 12) + d1,
      [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );
    return digits.slice(12) === `${d1}${d2}`;
  }
  return false;
}
// Valida e aplica o cupom informado no carrinho.
function applyCoupon() {
  const input = document.getElementById("gpCoupon");
  const output = document.getElementById("gpCouponMessage");
  const code = input.value.trim().toUpperCase();
  const coupon = CONFIG.coupons.find(
    (item) =>
      String(item.code || "")
        .trim()
        .toUpperCase() === code,
  );
  if (!code || !coupon) {
    activeCoupon = null;
    activeDiscount = 0;
    output.textContent = "Cupom não reconhecido.";
    renderCart();
    return;
  }
  const result = getCouponDiscount(coupon);
  if (result.error) {
    activeCoupon = null;
    activeDiscount = 0;
    output.textContent = result.error;
    renderCart();
    return;
  }
  if (
    coupon.defaultPaymentType &&
    !coupon.paymentTypes?.includes(coupon.defaultPaymentType)
  ) {
    activeCoupon = null;
    activeDiscount = 0;
    output.textContent = `A forma de pagamento do cupom ${code} está configurada incorretamente.`;
    renderCart();
    return;
  }
  activeCoupon = coupon;
  activeDiscount = result.discount;
  if (coupon.defaultPaymentType) {
    const option = Array.from(paymentSelect.options).find(
      (item) => item.value === coupon.defaultPaymentType,
    );
    if (!option) {
      activeCoupon = null;
      activeDiscount = 0;
      output.textContent = `A forma de pagamento ${coupon.defaultPaymentType} não está disponível neste formulário.`;
      renderCart();
      return;
    }
    paymentSelect.value = option.value;
    paymentSelect.dispatchEvent(new Event("change", { bubbles: true }));
  }
  const alternativePayments = (coupon.paymentTypes || []).filter(
    (type) => type !== coupon.defaultPaymentType,
  );
  const paymentMessage = coupon.defaultPaymentType
    ? ` Pagamento selecionado: ${coupon.defaultPaymentType}.${
        alternativePayments.length
          ? ` Este cupom também aceita ${alternativePayments.join(" ou ")}.`
          : ""
      }`
    : "";
  output.textContent = `Cupom ${code} aplicado: desconto de ${money(activeDiscount)}.${paymentMessage}`;
  renderCart();
}
document.getElementById("gpApplyCoupon").addEventListener("click", applyCoupon);
document.getElementById("gpCouponIntro").addEventListener("click", () => {
  const input = document.getElementById("gpCoupon");
  input.focus();
  document.getElementById("gpCouponRow").scrollIntoView({
    behavior: "smooth",
    block: "center",
  });
});
document
  .getElementById("gpCouponSuggestions")
  .addEventListener("click", (event) => {
    const button = event.target.closest("[data-coupon-code]");
    if (!button) return;
    const couponInput = document.getElementById("gpCoupon");
    couponInput.value = button.dataset.couponCode;
    couponInput.focus();
    applyCoupon();
  });
paymentSelect.addEventListener("change", () => {
  if (
    !activeCoupon ||
    couponPaymentIsAllowed(activeCoupon, paymentSelect.value)
  )
    return;
  const removedCode = activeCoupon.code;
  activeCoupon = null;
  activeDiscount = 0;
  document.getElementById("gpCoupon").value = "";
  document.getElementById("gpCouponMessage").textContent =
    `Cupom ${removedCode} removido porque a forma de pagamento foi alterada.`;
  renderCart();
});
document.getElementById("gpCoupon").addEventListener("keydown", (e) => {
  if (e.key === "Enter") {
    e.preventDefault();
    applyCoupon();
  }
});
// Monta o link de WhatsApp usado para contato sobre a loja.
function storeWhatsappLink(message) {
  const digits = String(CONFIG.whatsappBusiness || "").replace(/\D/g, "");
  if (digits.length < 12 || digits.length > 13) return null;
  return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}
// Aceita apenas endereços HTTPS seguros para uso nos links do pedido.
function safeHttpsUrl(value) {
  try {
    const url = new URL(String(value || ""));
    return url.protocol === "https:" ? url.href : null;
  } catch (_) {
    return null;
  }
}
// Valida o formulário e envia o pedido ao serviço de pedidos.
async function submitOrder(event) {
  event.preventDefault();
  clearOrderPresentation();
  if (!cart.length) {
    document.getElementById("gpCheckoutMessage").textContent =
      "Adicione pelo menos um produto ao carrinho.";
    return;
  }
  const form = event.currentTarget;
  const submit = document.getElementById("gpSubmitOrder");
  const message = document.getElementById("gpCheckoutMessage");
  const fields = Object.fromEntries(new FormData(form).entries());
  if (!couponPaymentIsAllowed(activeCoupon, fields.payment_type)) {
    const removedCode = activeCoupon.code;
    activeCoupon = null;
    activeDiscount = 0;
    document.getElementById("gpCoupon").value = "";
    document.getElementById("gpCouponMessage").textContent =
      `Cupom ${removedCode} removido porque não é válido para ${fields.payment_type || "a forma de pagamento selecionada"}.`;
    renderCart();
    message.textContent =
      "A forma de pagamento não corresponde ao cupom. O cupom foi removido; confira o total antes de enviar novamente.";
    return;
  }
  const phoneDigits = String(fields.phone || "").replace(/\D/g, "");
  const taxDigits = String(fields.tax_id || "").replace(/\D/g, "");
  if (phoneDigits.length < 10 || phoneDigits.length > 13) {
    document.getElementById("gpCheckoutMessage").textContent =
      "Informe um telefone válido com DDD.";
    return;
  }
  if (!validCpfCnpj(fields.tax_id)) {
    document.getElementById("gpCheckoutMessage").textContent =
      "Informe um CPF ou CNPJ válido.";
    return;
  }
  if (
    fields.delivery_method === "delivery" &&
    String(fields.zip_code || "").replace(/\D/g, "").length !== 8
  ) {
    document.getElementById("gpCheckoutMessage").textContent =
      "Informe um CEP válido.";
    return;
  }
  const originalLabel = submit.textContent;
  submit.disabled = true;
  submit.textContent = "Enviando pedido…";
  message.className = "";
  message.textContent = "Conectando à NextGo Orders…";
  const items = cart.map((item) => {
    const product = byId(item.productId);
    return {
      ...item,
      title: stripHtml(item.title),
      description: stripHtml(item.description),
      // O NextGo recebe o preço base e os complementos em campos separados.
      price:
        Number(
          String(product?.price ?? item.price ?? 0).replace(",", "."),
        ) || 0,
      choosedProductComplements: (item.choosedProductComplements || []).map(
        (complement) => ({ ...complement, title: stripHtml(complement.title) }),
      ),
      selectedComplementSteps: item.selectedComplementSteps || [],
    };
  });
  const payload = {
    total_price: Number(
      (cartSubtotal() + Number(CONFIG.freight.price || 0)).toFixed(2),
    ),
    discount: Number(activeDiscount.toFixed(2)),
    freight: Number(CONFIG.freight.price || 0),
    delivery_method: fields.delivery_method,
    deliveryExtraInfo: fields.delivery_extra_info.trim(),
    name: fields.name.trim(),
    phone: fields.phone.trim(),
    zip_code:
      fields.delivery_method === "delivery" ? fields.zip_code.trim() : "",
    street: fields.delivery_method === "delivery" ? fields.street.trim() : "",
    street_number:
      fields.delivery_method === "delivery" ? fields.street_number.trim() : "",
    district:
      fields.delivery_method === "delivery" ? fields.district.trim() : "",
    city: fields.delivery_method === "delivery" ? fields.city.trim() : "",
    state:
      fields.delivery_method === "delivery"
        ? fields.state.trim().toUpperCase()
        : "",
    payment_type: fields.payment_type,
    extra_info: `CPF/CNPJ: ${fields.tax_id.trim()}${fields.extra_info.trim() ? `\n${fields.extra_info.trim()}` : ""}`,
    clientId: null,
    ticketId: "",
    items,
    streetComplement:
      fields.delivery_method === "delivery"
        ? fields.streetComplement.trim()
        : "",
    extraOrderInfo: `Pedido realizado pela loja online Guia Panorama. Cupom: ${activeCoupon?.code || "nenhum"}. Subtotal: ${money(cartSubtotal())}. Desconto: ${money(activeDiscount)}.`,
  };
  try {
    const response = await fetch(
      `${CONFIG.apiUrl}/v2/card-render/${CONFIG.cardRenderId}/cart/order`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      },
    );
    let data = {};
    try {
      data = await response.json();
    } catch (_) {}
    if (!response.ok)
      throw new Error(
        data.message ||
          data.error ||
          `A API respondeu com status ${response.status}.`,
      );
    if (data.orderId) {
      const statusLink = `${CONFIG.statusUrl}${encodeURIComponent(data.orderId)}`;
      const paymentUrl =
        data.redirectMethod === "nextgo-pay"
          ? safeHttpsUrl(data.redirectUrl)
          : null;
      const completedOrderTotal = cartTotal();
      const customerMessage = `Olá, fiz um pedido na Guia Panorama. Nome: ${fields.name.trim()}. Pedido: #${data.orderId}. Total: ${money(completedOrderTotal)}. Forma de pagamento: ${fields.payment_type}. Subdomínio informado: ${fields.delivery_extra_info.trim()}.${paymentUrl ? ` Link para pagamento: ${paymentUrl}` : ""} Acompanhe: ${statusLink}`;
      const storeLink = storeWhatsappLink(customerMessage);
      cart.splice(0, cart.length);
      activeCoupon = null;
      activeDiscount = 0;
      renderCart();
      form.reset();
      setDeliveryFields();
      document.getElementById("gpCoupon").value = "";
      clearOrderPresentation();
      submit.textContent = originalLabel;
      closeCart();
      showOrderSuccess({
        orderId: data.orderId,
        statusLink,
        paymentUrl,
        whatsappUrl: storeLink,
        total: completedOrderTotal,
        paymentType: fields.payment_type,
        domain: fields.delivery_extra_info.trim(),
      });
    } else {
      throw new Error(
        data.message ||
          "A API recebeu uma resposta, mas não retornou o número do pedido. Verifique a configuração da NextGo Orders.",
      );
    }
  } catch (error) {
    console.error("Falha no envio para NextGo Orders:", error);
    message.className = "gp-error-message";
    message.textContent = `Não foi possível confirmar o pedido: ${error.message}. Confira a publicação, a conexão e a configuração da API; nenhum pedido foi confirmado nesta tela.`;
  } finally {
    submit.disabled = false;
    if (submit.textContent !== "Pedido enviado")
      submit.textContent = originalLabel;
  }
}
document
  .getElementById("gpCheckoutForm")
  .addEventListener("submit", submitOrder);
const yearNode = document.getElementById("anoAtual");
if (yearNode) yearNode.textContent = new Date().getFullYear();
document
  .querySelectorAll("#menuPrincipal .nav-link, #menuPrincipal .btn-gp")
  .forEach((link) =>
    link.addEventListener("click", () => {
      const menu = document.getElementById("menuPrincipal");
      if (menu?.classList.contains("show") && window.bootstrap)
        window.bootstrap.Collapse.getOrCreateInstance(menu).hide();
    }),
  );
document.querySelectorAll(".product-art .product-image").forEach((image) => {
  const art = image.closest(".product-art");
  image.addEventListener("load", () => art?.classList.add("has-image"), {
    once: true,
  });
  image.addEventListener(
    "error",
    () => {
      image.remove();
      art?.classList.remove("has-image");
    },
    { once: true },
  );
  if (image.complete && image.naturalWidth > 0) art?.classList.add("has-image");
});
document.querySelectorAll(".hero-carousel-image").forEach((image) => {
  const frame = image.closest(".hero-carousel-frame");
  image.addEventListener("error", () => frame?.classList.add("image-missing"), {
    once: true,
  });
  if (image.complete && image.naturalWidth === 0)
    frame?.classList.add("image-missing");
});
