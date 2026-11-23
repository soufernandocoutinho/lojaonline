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
  fixedPrices: {
    "Cartão de Visitas Digital": 350,
    SmallBio: 350,
    "Convite Digital": 350,
  },
  productIds: {
    "Cardápio Digital": 1548725,
    "Catálogo Digital": 1548653,
    "Cartão de Visitas Digital": 1494441,
    SmallBio: 1494440,
    "Convite Digital": 1494444,
  },
  freight: { id: 5036, type: "free", price: 0 },
  // Cadastre cupons aqui. type: "percentage" usa percentual; "fixed" usa valor em reais.
  // productIds vazio vale para todo o carrinho; datas usam YYYY-MM-DD e são inclusivas.
  coupons: [
    {
      code: "50OFF",
      enabled: true,
      type: "percentage",
      value: 50,
      minimum: 0,
      validFrom: null,
      validUntil: null,
      productIds: [],
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
    if (productWizard?.step > 0) {
      productWizard.step--;
      renderProductWizard();
    } else closeProductWizard();
  });
  overlay.querySelector("#gpConfigNext").addEventListener("click", () => {
    if (!productWizard?.selected[productWizard.step]) {
      productWizard.validationVisible = true;
      renderProductWizard();
      return;
    }
    if (productWizard.step < productWizard.steps.length - 1) {
      productWizard.step++;
      renderProductWizard();
      return;
    }
    const { button, selected } = productWizard;
    closeProductWizard();
    addConfiguredProduct(button, selected);
  });
  overlay.querySelector("#gpConfigChoices").addEventListener("change", (event) => {
    const selectedId = Number(event.target.value);
    productWizard.selected[productWizard.step] = selectedId;
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
  overlay.querySelector("#gpConfigTitle").textContent = stripHtml(product.title);
  overlay.querySelector("#gpConfigProgress").textContent = `Etapa ${step + 1} de ${steps.length}`;
  overlay.querySelector("#gpConfigQuestion").textContent = current.title;
  const choices = overlay.querySelector("#gpConfigChoices");
  choices.replaceChildren();
  if (Number(current.minAmount || 0) === 0) {
    const label = document.createElement("label");
    label.className = "gp-config-choice";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "gpProductComplement";
    input.value = -1;
    input.checked = selected[step] === -1;
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
  current.complements.forEach((complement) => {
    const label = document.createElement("label");
    label.className = "gp-config-choice";
    const input = document.createElement("input");
    input.type = "radio";
    input.name = "gpProductComplement";
    input.value = complement.id;
    input.checked = selected[step] === complement.id;
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
    price.textContent = money(complement.price);
    label.append(input, details, price);
    choices.append(label);
  });
  const chosen = selected.filter(Boolean).map((id) =>
    steps.flatMap((entry) => entry.complements).find((item) => item.id === id),
  ).filter(Boolean);
  const base = Number(String(product.price || 0).replace(",", ".")) || 0;
  const total = base + chosen.reduce((sum, item) => sum + Number(item.price || 0), 0);
  overlay.querySelector("#gpConfigTotal").textContent = `Total da configuração: ${money(total)}`;
  const next = overlay.querySelector("#gpConfigNext");
  next.textContent = step === steps.length - 1 ? "Adicionar ao carrinho" : "Continuar";
  const back = overlay.querySelector("#gpConfigBack");
  back.textContent = step === 0 ? "Cancelar" : "Voltar";
  const error = overlay.querySelector("#gpConfigError");
  error.hidden = !productWizard.validationVisible || Boolean(selected[step]);
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
    selected: Array(steps.length).fill(null),
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
  const product = byId(CONFIG.productIds[productName]);
  if (!product)
    throw new Error(
      `Não foi possível localizar o produto original: ${productName}`,
    );
  const quantity = options.quantity || 1;
  const complements = [];
  const selectedIds = options.complementIds || [];
  product.complementSteps
    ?.flatMap((step) => step.complements || [])
    .filter((complement) => selectedIds.includes(complement.id))
    .forEach((complement) => complements.push({ ...complement, amount: 1 }));
  const basePrice = Number(String(product.price || 0).replace(",", ".")) || 0;
  const price =
    basePrice + complements.reduce((sum, c) => sum + Number(c.price || 0), 0);
  return {
    ...product,
    id: `${product.id}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    productId: product.id,
    title: stripHtml(product.title),
    description: stripHtml(product.description),
    price,
    amount: quantity,
    choosedProductComplements: complements,
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
  const name = button.dataset.product;
  let item;
  item = makeItem(name, { complementIds: selectedComplementIds });
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
  const launcher = document.getElementById("gpCartLauncher");
  launcher?.classList.add("is-visible");
  const old = button.textContent;
  button.textContent = "Adicionado ✓";
  window.setTimeout(() => {
    button.innerHTML = old;
  }, 1400);
}
document
  .querySelectorAll(".whatsapp-config, .whatsapp-fixed")
  .forEach((button) => {
    button.addEventListener("click", (event) => {
      event.preventDefault();
      const product = byId(CONFIG.productIds[button.dataset.product]);
      if (!product || !openProductWizard(button, product))
        addConfiguredProduct(button);
    });
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
// Atualiza a lista de itens, quantidades e totais do carrinho.
function renderCart() {
  recalculateCoupon();
  const count = cart.reduce((sum, item) => sum + Number(item.amount || 1), 0);
  document.getElementById("gpCartCount").textContent = count;
  document.getElementById("gpCartTotal").textContent = money(cartTotal());
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
    (item.choosedProductComplements || []).forEach((c) => {
      const p = document.createElement("small");
      p.textContent = `${stripHtml(c.title)} (+${money(c.price)})`;
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
  activeCoupon = coupon;
  activeDiscount = result.discount;
  output.textContent = `Cupom ${code} aplicado: desconto de ${money(activeDiscount)}.`;
  renderCart();
}
document.getElementById("gpApplyCoupon").addEventListener("click", applyCoupon);
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
  const items = cart.map((item) => ({
    ...item,
    title: stripHtml(item.title),
    description: stripHtml(item.description),
    choosedProductComplements: (item.choosedProductComplements || []).map(
      (c) => ({ ...c, title: stripHtml(c.title) }),
    ),
  }));
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
      const customerMessage = `Olá, fiz um pedido na Guia Panorama. Nome: ${fields.name.trim()}. Pedido: #${data.orderId}. Total: ${money(cartTotal())}. Forma de pagamento: ${fields.payment_type}.${paymentUrl ? ` Link para pagamento: ${paymentUrl}` : ""} Acompanhe: ${statusLink}`;
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
