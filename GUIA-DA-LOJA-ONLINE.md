# Loja Online | Guia Panorama

## Versão ativa

- `index.html`: nova interface da loja construída com Bootstrap.
- `assets/css/` e `assets/img/`: estilos e imagens usados pela página ativa.
- `assets/js/main.js`: catálogo visual, configuração dos complementos, carrinho e integração de pedidos.
- `assets/js/nextgo-products.js`: dados de produtos e complementos usados pelo catálogo.
- `assets/js/consent.js`: preferências de cookies e carregamento dos recursos opcionais.

Os dados de produto são carregados antes de `main.js`. O envio usa a API NextGo, preservando no item do pedido os complementos escolhidos em `choosedProductComplements` e o agrupamento original em `selectedComplementSteps`. O catálogo ativo inclui os sistemas, migração e renovação encontrados no arquivo legado. `nextgo-products.js` é uma cópia local dos dados; alterações posteriores no painel NextGo não atualizam esse arquivo automaticamente.

## Arquivos originais preservados

- `index-old.html`: versão anterior da loja.
- `assets/js/*-old.js` e `assets/css/*-old.css`: scripts e estilos da versão anterior. Os caminhos locais em `index-old.html` apontam para esses nomes arquivados.

As funções da versão original foram preservadas sem reescrita. O sufixo `-old` evita que a página nova carregue simultaneamente os scripts antigos e os novos.

## Integrações externas

A loja ativa depende de Bootstrap e dos serviços NextGo para catálogo, pedidos, pagamento e consulta de status. Os dados de configuração e os endpoints usados pela integração ficam em `assets/js/main.js`.

## O que mudou na página ativa

`index.html` passou a apresentar a loja em uma única página responsiva. A navegação leva às seções de soluções, benefícios, funcionamento, dúvidas frequentes e contato. A página também inclui imagens e cards para as soluções digitais, informações comerciais e links de contato.

O Bootstrap 5.3.3 é carregado por CDN. Os estilos próprios ficam em `assets/css/style.css`, `assets/css/cart-v3.css` e `assets/css/consent.css`; o HTML também inclui título, descrição, metadados para compartilhamento e dados estruturados de perguntas frequentes.

## Catálogo e personalização

Os cinco produtos principais são apresentados no HTML. As categorias de sistemas, upgrades e renovações são preenchidas a partir dos dados de `assets/js/nextgo-products.js`, carregados antes de `assets/js/main.js`. Esse catálogo é uma cópia local: mudanças feitas no painel NextGo não se refletem automaticamente no arquivo.

Quando um produto tem complementos configuráveis, `main.js` apresenta um assistente por etapas. As opções escolhidas determinam o preço exibido e são organizadas por etapa para preservar os identificadores e a estrutura esperados pela NextGo. A disponibilidade e os preços apresentados dependem dos dados do catálogo.

## Carrinho e envio de pedidos

A página ativa inclui carrinho, resumo de subtotal, desconto, frete e total, além de formulário de checkout e tela de confirmação. O formulário adapta os campos de endereço à modalidade de entrega e valida telefone, CPF ou CNPJ e, quando aplicável, CEP.

Os cupons estão configurados em `assets/js/main.js`. O código verifica as condições do cupom, como produtos elegíveis, valor mínimo e forma de pagamento, e recalcula o desconto antes do envio. O pedido é enviado à API configurada no mesmo arquivo; a confirmação pode apresentar o acompanhamento do pedido e as opções de pagamento e contato retornadas pela integração.

## Privacidade e recursos opcionais

`assets/js/consent.js` controla o aviso de preferências. As ferramentas opcionais de análise e publicidade só são carregadas após o aceite. A escolha fica armazenada no navegador; o visitante pode reabrir as preferências pelo botão de gerenciamento.

## Arquivos para manutenção

- `index.html`: estrutura, conteúdo, navegação e formulários da página.
- `assets/css/style.css`, `assets/css/cart-v3.css` e `assets/css/consent.css`: estilos da página, carrinho e preferências.
- `assets/js/nextgo-products.js`: cópia local dos produtos e complementos.
- `assets/js/main.js`: renderização do catálogo, configuração dos produtos, carrinho, cupons, validações e envio dos pedidos.
- `assets/js/consent.js`: preferências de privacidade e carregamento de ferramentas opcionais.
- `index-old.html` e arquivos `*-old.*`: versões arquivadas para consulta; não são referências diretas da página ativa.

## Publicação dos arquivos arquivados

O `.gitignore` contém o padrão `*-old.*`, que mantém esses arquivos no diretório local e evita que arquivos ainda não rastreados sejam adicionados ao Git. O `.gitignore` não remove do GitHub arquivos que já estejam rastreados; nesses casos, é necessário removê-los do índice do Git para que deixem de ser publicados, sem apagar as cópias locais.
