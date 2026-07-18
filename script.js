// ===============================
// MS MATIAS STYLE - SCRIPT LIMPO
// Carrinho único para PC + Mobile
// ===============================
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let valorFrete = Number(localStorage.getItem("valorFreteMS")) || 0;
let desconto = 0;
let totalComFrete = 0;
let freteSelecionado = JSON.parse(localStorage.getItem("freteSelecionadoMS")) || null;
const API_BASE = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
  ? "http://localhost:3000"
  : "https://ms-matias-style.onrender.com";


// Os avisos usam a caixa padrão do navegador, com textos claros para o cliente.

function salvarCarrinho() {
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
}
function mostrarToastMS() {
  const toast = document.getElementById("msToast");

  if (!toast) {
    console.log("Toast não encontrado");
    return;
  }

  toast.classList.add("ativo");

  setTimeout(() => {
    toast.classList.remove("ativo");
  }, 2500);
}

function carregarCarrinho() {
  carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  return carrinho;
}

function dinheiro(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function pegarPrecoNumero(preco) {
  if (typeof preco === "number") return preco;

  let valor = String(preco || "0")
    .replace("R$", "")
    .replace(/\s/g, "")
    .trim();

  // Aceita os dois formatos:
  // data-preco="89.90"  -> 89.90
  // texto "R$ 89,90"   -> 89.90
  if (valor.includes(",")) {
    valor = valor.replace(/\./g, "").replace(",", ".");
  } else {
    valor = valor.replace(/[^0-9.]/g, "");
  }

  return parseFloat(valor) || 0;
}

// ===============================
// TAMANHO
// ===============================

function selecionarTamanho(botao, tamanho) {
  const grupo = botao.closest(".tamanhos");

  if (grupo) {
    grupo.querySelectorAll("button").forEach(btn => {
      btn.classList.remove("ativo");
    });
  }

  botao.classList.add("ativo");

  const card = botao.closest(".card-produto");
  if (card) card.dataset.tamanho = tamanho;

  const detalhe = botao.closest("#produtoDetalhe");
  if (detalhe) detalhe.dataset.tamanho = tamanho;
}

// ===============================
// ADICIONAR AO CARRINHO
// Funciona no PC e Mobile
// ===============================

function adicionarCarrinho(arg1, arg2, arg3, arg4) {
  let botao;
  let nome;
  let precoFinal;
  let imagem;

  // Aceita os dois formatos que existem no seu HTML:
  // adicionarCarrinho(this)
  // adicionarCarrinho('Nome', 159.90, 'imagem.png', this)
  if (typeof arg1 === "string") {
    nome = arg1;
    precoFinal = Number(arg2);
    imagem = arg3;
    botao = arg4;
  } else {
    botao = arg1;
    nome = botao?.dataset?.nome;
    precoFinal = Number(botao?.dataset?.preco);
    imagem = botao?.dataset?.img;
  }

  const card = botao && typeof botao.closest === "function" ? botao.closest(".card-produto") : null;

  if (!nome && card) nome = card.dataset.nome || card.querySelector("h3")?.innerText || "Produto MS";
  if (!precoFinal && card) precoFinal = pegarPrecoNumero(card.dataset.preco || card.querySelector(".preco")?.innerText || 0);
  if (!imagem && card) imagem = card.dataset.img || card.querySelector("img")?.getAttribute("src") || "";

  let tamanho = "";

  if (card) {
    const tamanhoAtivo = card.querySelector(".tamanhos button.ativo");
    if (tamanhoAtivo) tamanho = tamanhoAtivo.innerText.trim();
  }

  if (!tamanho) {
    alert("Selecione um tamanho para adicionar este produto ao carrinho.");
    return;
  }

  carregarCarrinho();

  const itemExistente = carrinho.find(item =>
    item.nome === nome && item.tamanho === tamanho
  );

 const qtd = Number(window.quantidadeDetalhe || 1);

if (itemExistente) {
  itemExistente.quantidade += qtd;
} else {
  carrinho.push({
    nome: nome,
    preco: precoFinal,
    imagem: imagem,
    tamanho: tamanho,
    quantidade: qtd
  });
}

salvarCarrinho();

atualizarBadgeCarrinho();

atualizarTudo();
renderCarrinhoMobileMS();

  if (typeof animarProdutoParaCarrinho === "function" && botao) {
    animarProdutoParaCarrinho(botao);
  }

  mostrarToastMS();
}


// Compatibilidade: alguns botões antigos chamam adicionarAoCarrinho(this)
function adicionarAoCarrinho(botao) {
  return adicionarCarrinho(botao);
}

function adicionarProdutoDetalhe() {

  console.log("Quantidade escolhida:", quantidadeDetalhe);
  const detalhe = document.getElementById("produtoDetalhe");
  if (!detalhe || !produtoDetalheAtual) return;

const tamanho = detalhe.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo")?.innerText.trim();  if (!tamanho) {
    alert("Selecione um tamanho para adicionar este produto ao carrinho.");
    return;
  }

  carregarCarrinho();

  const itemExistente = carrinho.find(item =>
    item.nome === produtoDetalheAtual.nome && item.tamanho === tamanho
  );

  if (itemExistente) {
    itemExistente.quantidade += quantidadeDetalhe;
  } else {
    carrinho.push({
      nome: produtoDetalheAtual.nome,
      preco: produtoDetalheAtual.preco,
      imagem: produtoDetalheAtual.img,
      tamanho: tamanho,
      quantidade: quantidadeDetalhe
    });
  }

  salvarCarrinho();
atualizarTudo();

animarProdutoParaCarrinho(
  document.querySelector(".btn-carrinho")
);

avisoCarrinhoPremium();

}

// ===============================
// CONTADOR
// ===============================

function atualizarContador() {
  carregarCarrinho();

  const totalItens = carrinho.reduce((total, item) => {
    return total + Number(item.quantidade || 1);
  }, 0);

  document.querySelectorAll("#contadorCarrinho").forEach(contador => {
    contador.innerText = totalItens;
  });
}

// compatibilidade com nomes antigos
function atualizarContadorMobile() {
  atualizarContador();
}

// ===============================
// CARRINHO PC + MOBILE
// ===============================

function atualizarCarrinho() {
  carregarCarrinho();

  const listaPC = document.getElementById("listaCarrinho");
  const listaMobile = document.getElementById("listaCarrinhoMobile");

  const subtotal = carrinho.reduce((total, item) => {
    return total + pegarPrecoNumero(item.preco) * Number(item.quantidade || 1);
  }, 0);

  let descontoValor = 0;
  if (desconto === 10) descontoValor = subtotal * 0.10;

  totalComFrete = subtotal - descontoValor + Number(valorFrete || 0);

  if (listaPC) montarListaCarrinho(listaPC, carrinho);
  if (listaMobile) montarListaCarrinho(listaMobile, carrinho);

  atualizarTexto("subtotal1", dinheiro(subtotal));
  atualizarTexto("subtotalCheckout", dinheiro(subtotal));
  atualizarTexto("freteResumo", dinheiro(valorFrete));
  atualizarTexto("total1", dinheiro(totalComFrete));
  atualizarTexto("totalCheckout", dinheiro(totalComFrete));
  atualizarTexto("totalCarrinho", dinheiro(totalComFrete));
  atualizarTexto("totalPagamentoMobile", dinheiro(totalComFrete));

  atualizarContador();
}

function montarListaCarrinho(lista, itens) {
  lista.innerHTML = "";

  if (!itens || itens.length === 0) {
    lista.innerHTML = `
      <p class="carrinho-vazio" style="text-align:center; color:#999;">
        Seu carrinho está vazio.
      </p>
    `;
    return;
  }

  itens.forEach((item, index) => {
    const imagemItem = item.img || item.imagem || "";

    lista.innerHTML += `
      <div class="item-carrinho item-checkout">
        <img src="${imagemItem}" class="img-carrinho">

        <div class="item-info produto-info">
          <h4>${item.nome}</h4>
          <h3>${item.nome}</h3>

          <p>Tamanho: ${item.tamanho}</p>

          <div class="controle-quantidade qtd">
            <button onclick="diminuirQuantidade(${index})">−</button>
            <span class="numero-quantidade">${item.quantidade}</span>
            <button onclick="aumentarQuantidade(${index})">+</button>
          </div>

          <strong>${dinheiro(pegarPrecoNumero(item.preco) * Number(item.quantidade || 1))}</strong>

          <button class="remover-item remover-mobile" onclick="removerItem(${index})">
            Remover
          </button>
        </div>
      </div>
    `;
  });
}

function atualizarTexto(id, texto) {
  const elemento = document.getElementById(id);
  if (elemento) elemento.innerText = texto;
}

function removerItem(index) {
  carregarCarrinho();
  carrinho.splice(index, 1);
  salvarCarrinho();
  atualizarTudo();
}

function aumentarQuantidade(index) {
  carregarCarrinho();
  if (!carrinho[index]) return;

  carrinho[index].quantidade = Number(carrinho[index].quantidade || 1) + 1;
  salvarCarrinho();
  atualizarTudo();
}

function diminuirQuantidade(index) {
  carregarCarrinho();
  if (!carrinho[index]) return;

  if (Number(carrinho[index].quantidade || 1) > 1) {
    carrinho[index].quantidade -= 1;
  } else {
    carrinho.splice(index, 1);
  }

  salvarCarrinho();
  atualizarTudo();
}

function alterarQuantidadeMobile(index, valor) {
  if (valor > 0) aumentarQuantidade(index);
  else diminuirQuantidade(index);
}

function limparCarrinhoPC() {
  carrinho = [];
  salvarCarrinho();
  valorFrete = 0;
  localStorage.removeItem("valorFreteMS");
  atualizarTudo();
  irCarrinhoPC();
}

function limparCarrinhoMobile() {
  limparCarrinhoPC();
}

function carregarCarrinhoMobile() {
  atualizarCarrinho();
}

function atualizarTotaisMobile() {
  atualizarCarrinho();

  const resumoPagamentoMobile = document.getElementById("resumoPagamentoMobile");

  if (resumoPagamentoMobile) {
    const nome = document.getElementById("nomeClienteMobile")?.value || "";
    const telefone = document.getElementById("telefoneClienteMobile")?.value || "";
    const email = document.getElementById("emailClienteMobile")?.value || "";
    const cep = document.getElementById("cepCheckout")?.value || "";
    const rua = document.getElementById("ruaCliente")?.value || "";
    const numero = document.getElementById("numeroCasa")?.value || "";
    const complemento = document.getElementById("complementoCliente")?.value || "";
    const bairro = document.getElementById("bairroCliente")?.value || "";
    const cidade = document.getElementById("cidadeCliente")?.value || "";
    const estado = document.getElementById("estadoCliente")?.value || "";

    resumoPagamentoMobile.innerHTML = `
      <div class="conferencia-pagamento">
        <h4>Dados da entrega</h4>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>WhatsApp:</strong> ${telefone}</p>
        ${email ? `<p><strong>E-mail:</strong> ${email}</p>` : ""}
        <p><strong>Endereço:</strong> ${rua}, ${numero}${complemento ? ` - ${complemento}` : ""}</p>
        <p><strong>Bairro:</strong> ${bairro}</p>
        <p><strong>Cidade/UF:</strong> ${cidade} - ${estado}</p>
        <p><strong>CEP:</strong> ${cep}</p>
        <p><strong>Frete:</strong> ${dinheiro(valorFrete)}</p>
      </div>
    `;
  }
}

// ===============================
// ABRIR / FECHAR CARRINHO
// ===============================

function abrirCarrinho() {
  // abre o mesmo carrinho no PC e no mobile, sem redirecionar e sem loop

  const carrinhoBox = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if (carrinhoBox) carrinhoBox.classList.add("ativo");
  if (fundo) fundo.classList.add("ativo");

  atualizarCarrinho();
}

function fecharCarrinho() {
  const carrinhoBox = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if (carrinhoBox) carrinhoBox.classList.remove("ativo");
  if (fundo) fundo.classList.remove("ativo");
}

// ===============================
// ETAPAS MOBILE
// ===============================

function mostrarEtapa(id) {
  document.querySelectorAll(".etapa-checkout").forEach(etapa => {
    etapa.classList.remove("ativa");
  });

  const etapaAtual = document.getElementById(id);
  if (etapaAtual) etapaAtual.classList.add("ativa");

  document.querySelectorAll(".etapas span").forEach(step => {
    step.classList.remove("ativo");
  });

  const mapa = {
    etapaCarrinho: "1",
    etapaEntrega: "2",
    etapaPagamento: "3"
  };

  const step = document.querySelector(`.etapas span[data-num="${mapa[id]}"]`);
  if (step) step.classList.add("ativo");

  if (id === "etapaCarrinho") {
    atualizarCarrinho();
  }

  if (id === "etapaEntrega") {
    document.getElementById("tituloEtapa").innerText = "Entrega";
  }

  if (id === "etapaPagamento") {
    document.getElementById("tituloEtapa").innerText = "Pagamento";
  }
}
function irEntrega() {
  carregarCarrinho();

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio. Adicione um produto para continuar.");
    return;
  }

  mostrarEtapa("etapaEntrega");
  atualizarTexto("tituloEtapa", "Entrega");
}


function salvarDadosClienteMobileMS() {
  const dados = {
    nome: document.getElementById("nomeClienteMobile")?.value?.trim() || "",
    telefone: document.getElementById("telefoneClienteMobile")?.value?.trim() || "",
    email: document.getElementById("emailClienteMobile")?.value?.trim() || "",
    cep: document.getElementById("cepCheckout")?.value?.trim() || "",
    rua: document.getElementById("ruaCliente")?.value?.trim() || "",
    numero: document.getElementById("numeroCasa")?.value?.trim() || "",
    complemento: document.getElementById("complementoCliente")?.value?.trim() || "",
    bairro: document.getElementById("bairroCliente")?.value?.trim() || "",
    cidade: document.getElementById("cidadeCliente")?.value?.trim() || "",
    estado: document.getElementById("estadoCliente")?.value?.trim() || ""
  };
  localStorage.setItem("dadosClienteMS", JSON.stringify(dados));
  return dados;
}

function restaurarDadosClienteMobileMS() {
  const dados = JSON.parse(localStorage.getItem("dadosClienteMS") || "{}");
  const mapa = {
    nomeClienteMobile: dados.nome,
    telefoneClienteMobile: dados.telefone,
    emailClienteMobile: dados.email,
    cepCheckout: dados.cep,
    ruaCliente: dados.rua,
    numeroCasa: dados.numero,
    complementoCliente: dados.complemento,
    bairroCliente: dados.bairro,
    cidadeCliente: dados.cidade,
    estadoCliente: dados.estado
  };
  Object.entries(mapa).forEach(([id, valor]) => {
    const el = document.getElementById(id);
    if (el && valor) el.value = valor;
  });
}

function irPagamento() {

  const nome = document.getElementById("nomeClienteMobile")?.value.trim();
  const cep = document.getElementById("cepCheckout")?.value.trim();
  const whats = document.getElementById("telefoneClienteMobile")?.value.trim();
  const rua = document.getElementById("ruaCliente")?.value.trim();
  const numero = document.getElementById("numeroCasa")?.value.trim();
  const bairro = document.getElementById("bairroCliente")?.value.trim();
  const cidade = document.getElementById("cidadeCliente")?.value.trim();
  const estado = document.getElementById("estadoCliente")?.value.trim();

  if (!nome || nome.length < 3) {
    alert("Informe seu nome completo para continuar com o pedido.");
    return;
  }

  if (!cep || cep.replace(/\D/g, "").length < 8) {
    alert("Informe um CEP válido para calcular a entrega.");
    return;
  }

  if (!valorFrete || valorFrete <= 0) {
    alert("Calcule e escolha uma opção de entrega antes de continuar.");
    return;
  }

  if (!whats || whats.replace(/\D/g, "").length < 10) {
    alert("Informe um número de WhatsApp válido com DDD.");
    return;
  }

  if (!rua || !numero || !bairro || !cidade || !estado) {
    alert("Complete os dados de entrega para continuar com o pedido.");
    return;
  }

  salvarDadosClienteMobileMS();
  mostrarEtapa("etapaPagamento");
  atualizarTotaisMobile();

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const subtotal = carrinho.reduce((acc, item) => {
    return acc + pegarPrecoNumero(item.preco) * Number(item.quantidade || 1);
  }, 0);

  const total = subtotal + Number(valorFrete || 0);

  const fretePagamentoMobile = document.getElementById("fretePagamentoMobile");
  if (fretePagamentoMobile) fretePagamentoMobile.innerText = dinheiro(valorFrete);

  const totalPagamentoMobile = document.getElementById("totalPagamentoMobile");
  if (totalPagamentoMobile) totalPagamentoMobile.innerText = dinheiro(total);

}
function voltarCheckoutMobile() {
  const etapaCarrinho = document.getElementById("etapaCarrinho");
  const etapaEntrega = document.getElementById("etapaEntrega");
  const etapaPagamento = document.getElementById("etapaPagamento");

  if (etapaPagamento && etapaPagamento.classList.contains("ativa")) {
    mostrarEtapa("etapaEntrega");
    atualizarTexto("tituloEtapa", "Entrega");
    return;
  }

  if (etapaEntrega && etapaEntrega.classList.contains("ativa")) {
    mostrarEtapa("etapaCarrinho");
    atualizarTexto("tituloEtapa", "Carrinho");
    return;
  }

  window.location.href = "index.html";
}

// ===============================
// ETAPAS PC
// ===============================

function irCarrinhoPC() {
  mostrarEtapaPC("etapaCarrinhoPC", "step1");
}

function irEntregaPC() {
  carregarCarrinho();

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio. Adicione um produto para continuar.");
    return;
  }

  mostrarEtapaPC("etapaEntregaPC", "step2");
}

function irPagamentoPC() {
  const nome = document.getElementById("nomeCliente")?.value.trim();
  const telefone = document.getElementById("telefoneCliente")?.value.trim();
  const cep = document.getElementById("cepCliente")?.value.trim();
  const tipoEntrega = localStorage.getItem("tipoEntregaMS") || "entrega";
  const retirada = tipoEntrega === "retirada";

  if (!nome || !telefone) {
    alert("Quase lá! Informe seu nome completo e WhatsApp para continuar.");
    return;
  }

  if (!retirada && !cep) {
    alert("Informe o CEP para continuar com a entrega.");
    return;
  }

  if (!retirada && (!freteSelecionado || Number(valorFrete) <= 0)) {
    alert("Escolha uma opção de entrega para continuar.");
    return;
  }

  mostrarEtapaPC("etapaPagamentoPC", "step3");
  montarResumoPagamentoPC();
}

function mostrarEtapaPC(idEtapa, idStep) {
  document.querySelectorAll(".etapa-pc").forEach(etapa => {
    etapa.classList.remove("ativa");
  });

  const etapa = document.getElementById(idEtapa);
  if (etapa) etapa.classList.add("ativa");

  document.querySelectorAll(".etapas-pc span").forEach(step => {
    step.classList.remove("ativo");
  });

  const step = document.getElementById(idStep);
  if (step) step.classList.add("ativo");
}

function montarResumoPagamentoPC() {
  carregarCarrinho();

  const resumo = document.getElementById("resumoPagamentoPC");
  if (!resumo) return;

  if (carrinho.length === 0) {
    resumo.innerHTML = "<p>Seu carrinho está vazio.</p>";
    return;
  }

  const subtotal = carrinho.reduce((total, item) => {
    return total + pegarPrecoNumero(item.preco) * Number(item.quantidade || 1);
  }, 0);

  resumo.innerHTML = "<h3>Resumo do pedido</h3>";

  carrinho.forEach(item => {
    const imagemItem = item.img || item.imagem || "";

    resumo.innerHTML += `
   <div class="item-resumo-pc">

      <img src="${imagemItem}">

      <div class="info-item-resumo">
         <strong>${item.nome}</strong>

         <p>Tamanho: ${item.tamanho}</p>

         <div class="linha-preco-qtd">
            <span>Qtd: ${item.quantidade}</span>

            <strong class="preco-item-resumo">
               ${dinheiro(pegarPrecoNumero(item.preco) * Number(item.quantidade || 1))}
            </strong>
         </div>
      </div>

   </div>
`;
});

  const percentualCupom = Number(descontoCupomMS || 0);
  const valorDescontoCupom = subtotal * (percentualCupom / 100);
  const totalFinal = Math.max(0, subtotal - valorDescontoCupom + Number(valorFrete || 0));
  totalComFrete = totalFinal;

  resumo.innerHTML += `
    <div class="total-resumo-pc">
      <p><span>Subtotal</span><strong id="valorProdutosPagamento">${dinheiro(subtotal)}</strong></p>
      ${percentualCupom > 0 ? `<p id="linhaDescontoCupomMS" style="color:#22c55e"><span>Desconto ${codigoCupomAplicadoMS || "cupom"}</span><strong id="valorDescontoCupomMS">- ${dinheiro(valorDescontoCupom)}</strong></p>` : ""}
      <p><span>Frete</span><strong id="valorFretePagamento">${dinheiro(valorFrete)}</strong></p>
      <p><span>Total</span><strong id="valorTotalPagamento">${dinheiro(totalFinal)}</strong></p>
    </div>
  `;
}
function formatarWhatsapp(input) {
  let valor = input.value.replace(/\D/g, "");

  if (valor.length > 11) {
    valor = valor.slice(0, 11);
  }

  valor = valor.replace(/^(\d{2})(\d)/g, "($1) $2");
  valor = valor.replace(/(\d{5})(\d)/, "$1-$2");

  input.value = valor;
}
// ===============================
// TIPO DE ENTREGA: ENTREGA OU RETIRADA
// ===============================
function selecionarTipoEntregaMS(tipo) {
  const retirada = tipo === "retirada";

  localStorage.setItem("tipoEntregaMS", tipo);

  const botaoFrete = document.getElementById("btnCalcularFreteMS");
  const resultadoFrete = document.getElementById("resultadoFrete");

  if (retirada) {
    valorFrete = 0;
    window.valorFrete = 0;
    freteSelecionado = {
      nome: "Retirada no local",
      preco: 0,
      prazo: 0,
      tipo: "retirada"
    };

    localStorage.setItem("valorFreteMS", "0");
    localStorage.setItem("freteSelecionadoMS", JSON.stringify(freteSelecionado));

    if (botaoFrete) botaoFrete.style.display = "none";
    if (resultadoFrete) {
      resultadoFrete.innerHTML = `
        <div class="frete-escolhido retirada-local-ms">
          <strong>Retirada no local</strong><br>
          Frete grátis
        </div>
      `;
    }
  } else {
    valorFrete = 0;
    window.valorFrete = 0;
    freteSelecionado = null;

    localStorage.removeItem("valorFreteMS");
    localStorage.removeItem("freteSelecionadoMS");

    if (botaoFrete) botaoFrete.style.display = "block";
    if (resultadoFrete) resultadoFrete.innerHTML = "";
  }

  atualizarCarrinho();
}

function restaurarTipoEntregaMS() {
  const tipo = localStorage.getItem("tipoEntregaMS") || "entrega";
  const radio = document.querySelector(`input[name="tipoEntregaMS"][value="${tipo}"]`);
  if (radio) radio.checked = true;
  selecionarTipoEntregaMS(tipo);
}

window.selecionarTipoEntregaMS = selecionarTipoEntregaMS;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("tipoEntregaMS")) restaurarTipoEntregaMS();
});

function itensParaCalculoFreteMS() {
  const lista = Array.isArray(window.carrinho) ? window.carrinho : (Array.isArray(carrinho) ? carrinho : []);
  const catalogo = Array.isArray(window.produtosBancoMS) ? window.produtosBancoMS : [];

  return lista.map((item, indice) => {
    const nome = String(item.nome || item.name || "Produto MS").trim();
    const produtoBanco = catalogo.find((produto) =>
      Number(produto.id) === Number(item.id || item.produtoId || item.idBanco) ||
      (item.chave && String(produto.chave) === String(item.chave)) ||
      String(produto.nome || "").trim().toLowerCase() === nome.toLowerCase()
    );

    return {
      id: produtoBanco?.id || item.id || item.produtoId || item.idBanco || null,
      chave: produtoBanco?.chave || item.chave || item.produtoChave || "",
      nome,
      preco: Number(item.preco || item.price || produtoBanco?.preco || 0),
      quantidade: Math.max(1, Number(item.quantidade || item.quantity || 1))
    };
  });
}

// ===============================
// FRETE
// ===============================

function adicionarDiasUteisMS(dataInicial, quantidade) {
  const data = new Date(dataInicial);
  let restantes = Math.max(0, Number(quantidade) || 0);

  while (restantes > 0) {
    data.setDate(data.getDate() + 1);
    const dia = data.getDay();
    if (dia !== 0 && dia !== 6) restantes--;
  }

  return data;
}

function formatarDataFreteMS(data) {
  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "2-digit"
  }).format(data);
}

function dadosPrevisaoFreteMS(prazo) {
  const dias = Math.max(1, Number(prazo) || 1);
  const hoje = new Date();
  hoje.setHours(12, 0, 0, 0);

  // O prazo da transportadora começa após a postagem.
  const inicio = adicionarDiasUteisMS(hoje, dias);
  const fim = adicionarDiasUteisMS(hoje, dias + 1);

  return {
    inicio: formatarDataFreteMS(inicio),
    fim: formatarDataFreteMS(fim),
    dias
  };
}

function prepararOpcoesFreteMS(fretes) {
  const validos = (Array.isArray(fretes) ? fretes : []).filter(frete => {
    if (!frete || frete.error) return false;

    const empresa = String(frete.company?.name || "").toLowerCase();
    const servico = String(frete.name || "").toLowerCase();
    const preco = Number(frete.price);
    const prazo = Number(frete.delivery_time);

    if (!Number.isFinite(preco) || preco <= 0 || !Number.isFinite(prazo) || prazo <= 0) return false;

    return (
      servico.includes("pac") ||
      servico.includes("sedex") ||
      (empresa.includes("jadlog") && servico.includes("package") && !servico.includes("centralizado"))
    );
  });

  const menorPreco = validos.length ? Math.min(...validos.map(f => Number(f.price))) : null;
  const menorPrazo = validos.length ? Math.min(...validos.map(f => Number(f.delivery_time))) : null;

  return validos
    .map(frete => ({
      ...frete,
      _preco: Number(frete.price),
      _prazo: Number(frete.delivery_time),
      _maisBarato: Number(frete.price) === menorPreco,
      _maisRapido: Number(frete.delivery_time) === menorPrazo
    }))
    .sort((a, b) => a._preco - b._preco || a._prazo - b._prazo);
}

function selosFreteMS(frete) {
  const selos = [];
  if (frete._maisBarato) selos.push('<span class="frete-selo-ms frete-selo-preco-ms">Melhor preço</span>');
  if (frete._maisRapido) selos.push('<span class="frete-selo-ms frete-selo-rapido-ms">Mais rápido</span>');
  return selos.join("");
}

function injetarEstiloFreteMS() {
  if (document.getElementById("estiloFreteDatasMS")) return;

  const style = document.createElement("style");
  style.id = "estiloFreteDatasMS";
  style.textContent = `
    .frete-opcao-ms, .opcao-frete, .frete-opcao {
      position: relative;
      cursor: pointer;
      transition: border-color .2s ease, transform .2s ease, background .2s ease;
    }
    .frete-opcao-ms:hover, .opcao-frete:hover, .frete-opcao:hover {
      transform: translateY(-1px);
    }
    .frete-cabecalho-ms {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 7px;
    }
    .frete-nome-ms { font-weight: 800; line-height: 1.15; }
    .frete-preco-ms { font-weight: 900; white-space: nowrap; }
    .frete-selos-ms { display: flex; flex-wrap: wrap; gap: 5px; margin: 5px 0 8px; }
    .frete-selo-ms {
      display: inline-flex;
      align-items: center;
      padding: 4px 8px;
      border-radius: 999px;
      font-size: 10px;
      font-weight: 900;
      letter-spacing: .2px;
      text-transform: uppercase;
    }
    .frete-selo-preco-ms { background: rgba(34,197,94,.16); color: #4ade80; border: 1px solid rgba(34,197,94,.35); }
    .frete-selo-rapido-ms { background: rgba(59,130,246,.16); color: #60a5fa; border: 1px solid rgba(59,130,246,.35); }
    .frete-data-ms { font-weight: 800; font-size: 13px; margin-top: 2px; }
    .frete-prazo-ms { opacity: .72; font-size: 11px; margin-top: 3px; line-height: 1.35; }
    .frete-opcao.selecionado, .opcao-frete.selecionado { border-color: #22c55e !important; box-shadow: 0 0 0 1px rgba(34,197,94,.3); }
    @media (max-width: 600px) {
      .frete-cabecalho-ms { gap: 7px; }
      .frete-nome-ms { font-size: 14px; }
      .frete-preco-ms { font-size: 14px; }
      .frete-data-ms { font-size: 12px; }
      .frete-selo-ms { font-size: 9px; padding: 3px 7px; }
    }
  `;
  document.head.appendChild(style);
}

function nomeCompletoFreteMS(frete) {
  return `${frete.company?.name || "Transportadora"} - ${frete.name || "Entrega"}`;
}

async function calcularFrete() {
  injetarEstiloFreteMS();
  const cep = document.getElementById("cepCliente")?.value.replace(/\D/g, "");
  const resultadoFrete = document.getElementById("resultadoFrete");

  if (!cep || cep.length !== 8) {
    alert("Informe um CEP válido para calcular a entrega.");
    return;
  }

  if (resultadoFrete) resultadoFrete.innerHTML = "Calculando frete...";

  try {
    const resposta = await fetch(`${API_BASE}/calcular-frete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, items: itensParaCalculoFreteMS() })
    });

    const dadosFrete = await resposta.json().catch(() => null);
    if (!resposta.ok) throw new Error(dadosFrete?.mensagem || `Erro HTTP ${resposta.status}`);
    const fretes = prepararOpcoesFreteMS(dadosFrete);
    if (!resultadoFrete) return;

    if (fretes.length === 0) {
      resultadoFrete.innerHTML = "Nenhuma opção de frete encontrada.";
      return;
    }

    resultadoFrete.innerHTML = "";
    fretes.forEach(frete => {
      const previsao = dadosPrevisaoFreteMS(frete._prazo);
      const div = document.createElement("div");
      div.className = "opcao-frete frete-opcao-ms";
      div.innerHTML = `
        <div class="frete-cabecalho-ms">
          <span class="frete-nome-ms">🚚 ${nomeCompletoFreteMS(frete)}</span>
          <span class="frete-preco-ms">${dinheiro(frete._preco)}</span>
        </div>
        <div class="frete-selos-ms">${selosFreteMS(frete)}</div>
        <div class="frete-data-ms">Previsão de entrega: até ${previsao.dias} dias úteis após a postagem</div>
        <div class="frete-prazo-ms">Prazo estimado pela transportadora e sujeito a variações.</div>
      `;
      div.onclick = () => selecionarFrete(nomeCompletoFreteMS(frete), frete._preco, frete._prazo);
      resultadoFrete.appendChild(div);
    });
  } catch (erro) {
    console.error(erro);
    if (resultadoFrete) resultadoFrete.innerHTML = "Erro ao calcular o frete.";
  }
}

async function calcularFreteCheckout() {
  injetarEstiloFreteMS();
  const cepInput = document.getElementById("cepCheckout");
  if (!cepInput) return;

  const cep = cepInput.value.replace(/\D/g, "");
  if (cep.length !== 8) {
    alert("Informe um CEP válido para calcular a entrega.");
    return;
  }

  try {
    const respostaCep = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dadosCep = await respostaCep.json();

    if (!dadosCep.erro) {
      const rua = document.getElementById("ruaCliente");
      const bairro = document.getElementById("bairroCliente");
      const cidade = document.getElementById("cidadeCliente");
      const estado = document.getElementById("estadoCliente");
      if (rua) rua.value = dadosCep.logradouro || "";
      if (bairro) bairro.value = dadosCep.bairro || "";
      if (cidade) cidade.value = dadosCep.localidade || "";
      if (estado) estado.value = dadosCep.uf || "";
    }

    const resposta = await fetch(`${API_BASE}/calcular-frete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep, items: itensParaCalculoFreteMS() })
    });

    const dadosFrete = await resposta.json().catch(() => null);
    if (!resposta.ok) throw new Error(dadosFrete?.mensagem || `Erro HTTP ${resposta.status}`);
    const fretes = prepararOpcoesFreteMS(dadosFrete);
    const container = document.getElementById("opcoesFreteCheckout");
    if (!container) return;

    container.innerHTML = "";
    if (!fretes.length) {
      container.innerHTML = "Nenhuma opção de frete encontrada.";
      return;
    }

    fretes.forEach(frete => {
      const previsao = dadosPrevisaoFreteMS(frete._prazo);
      const div = document.createElement("div");
      div.className = "frete-opcao frete-opcao-ms";
      div.innerHTML = `
        <div class="frete-cabecalho-ms">
          <span class="frete-nome-ms">🚚 ${nomeCompletoFreteMS(frete)}</span>
          <span class="frete-preco-ms">${dinheiro(frete._preco)}</span>
        </div>
        <div class="frete-selos-ms">${selosFreteMS(frete)}</div>
        <div class="frete-data-ms">Previsão de entrega: até ${previsao.dias} dias úteis após a postagem</div>
        <div class="frete-prazo-ms">Prazo estimado pela transportadora e sujeito a variações.</div>
      `;

      div.onclick = () => {
        document.querySelectorAll(".frete-opcao").forEach(opcao => opcao.classList.remove("selecionado"));
        div.classList.add("selecionado");
        selecionarFrete(nomeCompletoFreteMS(frete), frete._preco, frete._prazo);
      };
      container.appendChild(div);
    });
  } catch (erro) {
    console.error(erro);
    alert("Não foi possível calcular a entrega agora. Tente novamente em instantes.");
  }
}

function selecionarFrete(nome, preco, prazo) {
  preco = Number(preco);
  const previsao = dadosPrevisaoFreteMS(prazo);

  freteSelecionado = {
    nome,
    preco,
    prazo: Number(prazo),
    previsaoInicio: previsao.inicio,
    previsaoFim: previsao.fim
  };
  valorFrete = preco;

  localStorage.setItem("valorFreteMS", String(valorFrete));
  localStorage.setItem("freteSelecionadoMS", JSON.stringify(freteSelecionado));

  const resultadoFrete = document.getElementById("resultadoFrete");
  if (resultadoFrete) {
    resultadoFrete.innerHTML = `
      <div class="frete-escolhido">
        Frete escolhido: <strong>${nome}</strong><br>
        Valor: ${dinheiro(preco)}<br>
        Previsão de entrega: <strong>até ${previsao.dias} dias úteis após a postagem</strong><br>
        <small>Prazo estimado pela transportadora e sujeito a variações.</small>
      </div>
    `;
  }

  atualizarCarrinho();
}

// ===============================
// ENDEREÇO / CUPOM
// ===============================

async function buscarEndereco() {
  const campoCep = document.getElementById("cepCliente") || document.getElementById("cepCheckout");
  if (!campoCep) return;

  const cep = campoCep.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const endereco = await resposta.json();

    if (endereco.erro) {
      alert("Não encontramos esse CEP. Confira os números e tente novamente.");
      return;
    }

    const rua = document.getElementById("ruaCliente");
    const bairro = document.getElementById("bairroCliente");
    const cidade = document.getElementById("cidadeCliente");
    const estado = document.getElementById("estadoCliente");

    if (rua) rua.value = endereco.logradouro || "";
    if (bairro) bairro.value = endereco.bairro || "";
    if (cidade) cidade.value = endereco.localidade || "";
    if (estado) estado.value = endereco.uf || "";

  } catch (erro) {
    alert("Não foi possível localizar o endereço. Confira o CEP e tente novamente.");
  }
}

let cupomValidandoMS = false;

async function aplicarCupom() {
  if (cupomValidandoMS) return;
  cupomValidandoMS = true;
  // Aceita tanto os IDs do carrinho lateral quanto os IDs do checkout mobile.
  const input =
    document.getElementById("cupomPagamentoMS") ||
    document.getElementById("cupomInput");

  const mensagem =
    document.getElementById("mensagemCupomMS") ||
    document.getElementById("cupomMensagem");

  if (!input || !mensagem) return;

  const codigo = input.value.trim().toUpperCase();

  if (!codigo) {
    descontoCupomMS = 0;
    codigoCupomAplicadoMS = "";
    mensagem.textContent = "Digite um cupom.";
    mensagem.style.color = "#ff4d6d";
    montarResumoPagamentoPC();
    return;
  }

  carregarCarrinho();
  const subtotal = carrinho.reduce((soma, item) => {
    return soma + pegarPrecoNumero(item.preco) * Number(item.quantidade || 1);
  }, 0);

  mensagem.textContent = "Validando cupom...";
  mensagem.style.color = "#d6b24c";

  const botaoCupom = document.querySelector(".cupom-linha-ms button") || document.querySelector("#cupomInput + button");
  if (botaoCupom) {
    botaoCupom.disabled = true;
    botaoCupom.textContent = "Validando...";
  }

  const controller = new AbortController();
  const timeoutCupom = setTimeout(() => controller.abort(), 15000);

  try {
    const resposta = await fetch(`${API_BASE}/cupons/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, subtotal }),
      signal: controller.signal
    });

    const dados = await resposta.json();

    if (!resposta.ok || !dados.valido) {
      throw new Error(dados.mensagem || "Cupom inválido.");
    }

    descontoCupomMS = Number(dados.percentual || dados.cupom?.percentual || 0);
    codigoCupomAplicadoMS = codigo;

    // Mensagem neutra, para nunca ficar presa em 10% quando o painel for editado.
    mensagem.textContent = "Cupom aplicado com sucesso ✓";
    mensagem.style.color = "#22c55e";
  } catch (erro) {
    descontoCupomMS = 0;
    codigoCupomAplicadoMS = "";
    mensagem.textContent = erro?.name === "AbortError"
      ? "O servidor demorou para responder. Tente novamente."
      : (erro.message || "Cupom inválido.");
    mensagem.style.color = "#ff4d6d";
  } finally {
    clearTimeout(timeoutCupom);
    cupomValidandoMS = false;
    if (botaoCupom) {
      botaoCupom.disabled = false;
      botaoCupom.textContent = "Aplicar";
    }
  }

  // Atualiza os dois resumos. Antes, somente o resumo do PC era recalculado,
  // por isso o cupom aparecia como aplicado no mobile, mas o total não mudava.
  if (typeof montarResumoPagamentoPC === "function") montarResumoPagamentoPC();
  if (typeof atualizarResumoPagamentoMSComCupom === "function") atualizarResumoPagamentoMSComCupom();
}

// ===============================
// CONTATO / AVISO
// ===============================

function abrirContato() {
  const modal = document.getElementById("modalContato");
  if (modal) modal.classList.add("ativo");
}

function fecharContato() {
  const modal = document.getElementById("modalContato");
  if (modal) modal.classList.remove("ativo");
}

function mostrarAviso() {
  const aviso = document.getElementById("aviso") || document.getElementById("avisoMS");
  if (!aviso) return;

  aviso.classList.add("ativo");

  setTimeout(() => {
    aviso.classList.remove("ativo");
  }, 2500);
}

function fecharAviso() {
  const aviso = document.getElementById("avisoMS") || document.getElementById("aviso");
  if (aviso) aviso.classList.remove("ativo");
}

// ===============================
// DETALHE DO PRODUTO
// ===============================

let fotosDetalhe = [];
let fotoAtualDetalhe = 0;
let produtoDetalheAtual = null;

function abrirProdutoDetalheCard(card) {
  if (!card) return;

  if (card.classList.contains("produto-em-breve")) {
    return;
  }

  const nome = card.dataset.nome;
  const preco = card.dataset.preco;
  const img = card.dataset.img;
  produtoDetalheAtual = {
  nome: nome,
  preco: pegarPrecoNumero(preco) || 100,
  precoAntigo: pegarPrecoNumero(card.dataset.precoantigo) || 199,
  img: img
};

  fotosDetalhe = (card.dataset.fotos || produtoDetalheAtual.img)
    .split(",")
    .map(foto => foto.trim())
    .filter(Boolean);

  fotoAtualDetalhe = 0;

  const detalheImg = document.getElementById("detalheImg");
  const detalheNome = document.getElementById("detalheNome");
  const detalhePreco = document.getElementById("detalhePreco");
  const detalhe = document.getElementById("produtoDetalhe");

  if (detalheImg) detalheImg.src = fotosDetalhe[fotoAtualDetalhe] || produtoDetalheAtual.img;
  
  

const desc = document.getElementById("descricaoProduto");
const det = document.getElementById("detalhesProduto");
const comp = document.getElementById("composicaoProduto");
const cuid = document.getElementById("cuidadosProduto");

if(desc) desc.innerText = card.dataset.descricao || "";
if(det) det.innerText = card.dataset.detalhes || "";
if(comp) comp.innerText = card.dataset.composicao || "";
if(cuid) cuid.innerText = card.dataset.cuidados || "";
card.dataset.cuidados || "";
  if (detalhePreco) detalhePreco.innerText = dinheiro(produtoDetalheAtual.preco);
  const miniaturas = document.getElementById("miniaturasDetalhe");

if (miniaturas) {

    miniaturas.innerHTML = "";

    fotosDetalhe.forEach((foto, index) => {

        const img = document.createElement("img");

        img.src = foto;

        if(index === fotoAtualDetalhe){
            img.classList.add("ativa");
        }

        img.onclick = () => {

            fotoAtualDetalhe = index;

            detalheImg.src = foto;

            document
            .querySelectorAll(".miniaturas-detalhe img")
            .forEach(el => el.classList.remove("ativa"));

            img.classList.add("ativa");
        };

        miniaturas.appendChild(img);

    });

}
  if (detalhe) {
    detalhe.dataset.tamanho = "";
    detalhe.classList.add("ativo");
  }
}

function trocarFotoDetalhe(direcao) {
  if (!fotosDetalhe.length) return;

  fotoAtualDetalhe += direcao;

  if (fotoAtualDetalhe < 0) fotoAtualDetalhe = fotosDetalhe.length - 1;
  if (fotoAtualDetalhe >= fotosDetalhe.length) fotoAtualDetalhe = 0;

  const detalheImg = document.getElementById("detalheImg");
  if (detalheImg) detalheImg.src = fotosDetalhe[fotoAtualDetalhe];
}

function fecharProdutoDetalhe() {
  const detalhe = document.getElementById("produtoDetalhe");
  if (detalhe) detalhe.classList.remove("ativo");
}

// abre detalhe clicando no card, sem atrapalhar botões

function mostrarLoadingCheckout() {
  const loading = document.getElementById("loadingCheckout");
  if (loading) loading.classList.add("ativo");
}

function esconderLoadingCheckout() {
  const loading = document.getElementById("loadingCheckout");
  if (loading) loading.classList.remove("ativo");
}

// ===============================
// FINALIZAR COMPRA
// ===============================


async function finalizarCompra(event) {
  if (event) {
    event.preventDefault();
    event.stopPropagation();
  }

  carregarCarrinho();

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio. Adicione um produto para continuar.");
    return false;
  }

  atualizarCarrinho();
  mostrarLoadingCheckout();

  try {
    const resposta = await fetch(`${API_BASE}/criar-pagamento`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        items: carrinho,
        valorFrete: Number(valorFrete || 0),
        freteSelecionado,
        desconto,
        totalComFrete: Number(totalComFrete || 0)
      })
    });

    const dados = await resposta.json();

    console.log("RESPOSTA MERCADO PAGO:", dados);

    if (!dados.init_point) {
      alert("Não foi possível abrir o pagamento agora. Tente novamente em instantes.");
      return false;
    }

    window.open(dados.init_point, "_blank");
    return false;

  } catch (erro) {
    console.error("ERRO MERCADO PAGO:", erro);
    esconderLoadingCheckout();
    alert("Não foi possível iniciar o pagamento. Tente novamente em instantes.");
    return false;
  }
}

function finalizarCompraFinal(evento){
  if (evento) {
    evento.preventDefault();
    evento.stopPropagation();
  }

  const tel =
    document.getElementById("telefoneClienteMobile") ||
    document.getElementById("telefoneCliente");

  if(!tel || tel.value.replace(/\D/g, "").length < 11){
    alert("Informe um número de WhatsApp válido com DDD.");
    return;
  }

  finalizarCompra();
}
// ===============================
// SLIDER
// ===============================

document.addEventListener("DOMContentLoaded", function () {
  const slides = document.querySelectorAll(".slide");
  let slideAtual = 0;

  if (!slides || slides.length === 0) return;

  setInterval(function () {
    slides[slideAtual].classList.remove("ativo");
    slides[slideAtual].classList.remove("ativa");

    slideAtual = (slideAtual + 1) % slides.length;

    slides[slideAtual].classList.add("ativo");
  }, 4000);
});

// ===============================
// INICIAR
// ===============================

function atualizarTudo() {
  carregarCarrinho();
  atualizarContador();
  atualizarCarrinho();
}
function irParaMoletons() {
  const secao = document.getElementById("moletons");

  if (secao) {
    secao.scrollIntoView({
      behavior: "smooth"
    });
  }
}
function irParaCategorias() {
  const secao = document.querySelector(".categorias-home");

  if (!secao) return;

  const distanciaDoTopo = secao.getBoundingClientRect().top + window.pageYOffset;
  const descontoHeader = 95;

  window.scrollTo({
    top: distanciaDoTopo - descontoHeader,
    behavior: "smooth"
  });
}
function abrirMenuMobile(){
  document.getElementById("menuLateralMobile").classList.add("ativo");
}

function fecharMenuMobile(){
  document.getElementById("menuLateralMobile").classList.remove("ativo");
}
function abrirAjudaMobile(){
  document.getElementById("opcoesAjudaMobile").classList.toggle("ativo");
}
/* =========================
MENU LATERAL
========================= */

function abrirMenuMobile(){
  document
    .getElementById("menuLateralMobile")
    .classList.add("ativo");
}

function fecharMenuMobile(){
  document
    .getElementById("menuLateralMobile")
    .classList.remove("ativo");
}

function abrirAjudaMobile(){
  document
    .getElementById("opcoesAjudaMobile")
    .classList.toggle("ativo");
}
document.addEventListener("DOMContentLoaded", function(){
  const detalhe = document.getElementById("produtoDetalheMobile");

  if (detalhe) {
    detalhe.classList.remove("ativo");
    detalhe.style.display = "none";
  }
});
let favoritos = JSON.parse(localStorage.getItem("favoritosMS")) || [];

function salvarFavoritos(){
  localStorage.setItem("favoritosMS", JSON.stringify(favoritos));
}

function favoritarProduto(botao, evento){
  evento.stopPropagation();

  const card = botao.closest(".card-produto");
  if(!card) return;

  const nome =
    card.dataset.nome ||
    card.querySelector("h3")?.innerText ||
    "";

  const preco =
    card.dataset.preco ||
    card.querySelector(".preco")?.innerText ||
    "";

  const imagem =
    card.dataset.img ||
    card.querySelector(".img-principal")?.getAttribute("src") ||
    card.querySelector(".produto-img img")?.getAttribute("src") ||
    "";

  const existe = favoritos.find(item => item.nome === nome);

  if(existe){
    favoritos = favoritos.filter(item => item.nome !== nome);
    botao.classList.remove("ativo");
    botao.innerText = "♡";
  } else {
    favoritos.push({ nome, preco, imagem });
    botao.classList.add("ativo");
    botao.innerText = "♥";
  }

  salvarFavoritos();
  atualizarFavoritos();
}

function atualizarFavoritos(){
  const contador = document.getElementById("contadorFavoritos");
  const lista = document.getElementById("listaFavoritos");

  if(contador) contador.innerText = favoritos.length;

  if(!lista) return;

  if(favoritos.length === 0){
    lista.innerHTML = "<p style='color:#999'>Nenhum favorito ainda.</p>";
    return;
  }

  lista.innerHTML = favoritos.map((item, index) => `
    <div class="item-favorito">
      <img src="${item.imagem}" alt="${item.nome}">
      <div>
        <h4>${item.nome}</h4>
        <p>${item.preco}</p>
        <button onclick="removerFavorito(${index})">Remover</button>
      </div>
    </div>
  `).join("");
}

function removerFavorito(index){
  favoritos.splice(index, 1);
  salvarFavoritos();
  atualizarFavoritos();
  marcarFavoritosNosCards();
}

function abrirFavoritos(){

  const favoritos = document.getElementById("painelFavoritos");

  if(!favoritos) return;

  favoritos.classList.toggle("favoritos-ativo");
}

function fecharFavoritos(){
  document.getElementById("painelFavoritos")?.classList.remove("favoritos-ativo");
  document.getElementById("fundoFavoritos")?.classList.remove("ativo");
}

function marcarFavoritosNosCards(){
  document.querySelectorAll(".card-produto").forEach(card => {
    const nome = card.dataset.nome || card.querySelector("h3")?.innerText || "";
    const botao = card.querySelector(".btn-favorito");

    if(!botao) return;

    const existe = favoritos.find(item => item.nome === nome);

    botao.classList.toggle("ativo", !!existe);
    botao.innerText = existe ? "♥" : "♡";
  });
}

document.addEventListener("DOMContentLoaded", () => {
  atualizarFavoritos();
  marcarFavoritosNosCards();
});
function avaliar(event, estrela, nota){

  event.stopPropagation();

  const box = estrela.closest(".avaliacao-produto");

  if(!box) return;

  const estrelas = box.querySelectorAll("span");

  estrelas.forEach((s, index) => {

    if(index < nota){
      s.classList.add("ativa");
    }else{
      s.classList.remove("ativa");
    }

  });

}

function animarProdutoParaCarrinho(botao){
  const card = botao.closest(".card-produto");
  const img = card?.querySelector(".produto-img img");

  const carrinhoTopo = document.querySelector("header .btn-carrinho");

  if(!img || !carrinhoTopo){
    console.log("Animação não encontrou imagem ou carrinho");
    return;
  }

  const imgRect = img.getBoundingClientRect();
  const cartRect = carrinhoTopo.getBoundingClientRect();

  const clone = img.cloneNode(true);
  clone.className = "produto-voando";

  clone.style.left = imgRect.left + "px";
  clone.style.top = imgRect.top + "px";

  document.body.appendChild(clone);

  setTimeout(() => {
    clone.style.left = cartRect.left + "px";
    clone.style.top = cartRect.top + "px";
    clone.style.transform = "scale(.15)";
    clone.style.opacity = "0";
  }, 50);

  setTimeout(() => {
    clone.remove();

    carrinhoTopo.classList.add("animar-carrinho");

    setTimeout(() => {
      carrinhoTopo.classList.remove("animar-carrinho");
    }, 500);

  }, 1650);
}
function comprarAgoraDetalhe(){
  abrirCarrinhoMS();
}
function mostrarEtapaMS(id) {
  document.querySelectorAll(".cmms-etapa").forEach(e => e.classList.remove("ativa"));
  document.getElementById(id)?.classList.add("ativa");

  document.querySelectorAll(".cmms-etapas span").forEach(s => s.classList.remove("ativo"));

  if (id === "cmmsEtapaProdutos") document.getElementById("cmmsStep1")?.classList.add("ativo");
  if (id === "cmmsEtapaFrete") document.getElementById("cmmsStep2")?.classList.add("ativo");
  if (id === "cmmsEtapaPagamento") {
    document.getElementById("cmmsStep3")?.classList.add("ativo");
    atualizarResumoPagamentoMS();
  }
  if (id === "cmmsEtapaPagamento") {
  setTimeout(window.atualizarResumoPagamentoMS, 100);
}
  
}
function irPagamentoDoJeitoCerto(){
  const etapaCarrinhoPC = document.getElementById("etapaCarrinhoPC");
  const etapaEntregaPC = document.getElementById("etapaEntregaPC");
  const etapaCarrinhoMobile = document.getElementById("etapaCarrinho");
  const etapaEntregaMobile = document.getElementById("etapaEntrega");

  if (etapaCarrinhoPC && etapaCarrinhoPC.classList.contains("ativa")) {
    irEntregaPC();
    return;
  }

  if (etapaEntregaPC && etapaEntregaPC.classList.contains("ativa")) {
    irPagamentoPC();
    return;
  }

  if (etapaCarrinhoMobile && etapaCarrinhoMobile.classList.contains("ativa")) {
    irEntrega();
    return;
  }

  if (etapaEntregaMobile && etapaEntregaMobile.classList.contains("ativa")) {
    irPagamento();
    return;
  }

  irPagamentoPC();
}
document.addEventListener("click", function(e){
  const area = e.target.closest(".imagem-principal");

  if(!area) return;

  area.classList.toggle("zoom-ativo");
});
document.addEventListener("mousemove", function(e){
  if (!e.target || typeof e.target.closest !== "function") return;
  const area = e.target.closest(".imagem-principal");

  if(!area) return;

  const img = area.querySelector("img");
  if(!img) return;

  const rect = area.getBoundingClientRect();

  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  area.classList.add("zoom-ativo");
  img.style.transformOrigin = `${x}% ${y}%`;
});

document.addEventListener("mouseleave", function(e){
  if (!e.target || typeof e.target.closest !== "function") return;
  const area = e.target.closest(".imagem-principal");

  if(!area) return;

  area.classList.remove("zoom-ativo");

  const img = area.querySelector("img");
  if(img) img.style.transformOrigin = "center center";
}, true);
function abrirMenu(){
  const menu = document.querySelector("nav.menu");

  if(!menu){
    alert("Não foi possível abrir esta seção. Atualize a página e tente novamente.");
    return;
  }

  menu.classList.toggle("ativo");
}
function abrirCarrinhoMobile() {
  atualizarCarrinho();
  mostrarEtapa("etapaCarrinho");

  const carrinhoMobile = document.getElementById("carrinhoMobile");
  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if (window.innerWidth <= 768 && carrinhoMobile) {
    carrinhoMobile.classList.add("ativo");
  } else if (carrinhoPC) {
    carrinhoPC.classList.add("ativo");
    if (fundo) fundo.classList.add("ativo");
  } else if (carrinhoMobile) {
    carrinhoMobile.classList.add("ativo");
  } else {
    alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
  }
}

function fecharCarrinhoMobile() {

  const carrinho = document.getElementById("carrinhoMobile");

  if (!carrinho) return;

  carrinho.classList.remove("ativo");

}


function continuarCarrinhoMobile() {
  irEntrega();
}

function abrirCarrinhoMobileNovo() {
  abrirCarrinhoMobile();
}

function fecharCarrinhoMobileNovo() {
  fecharCarrinhoMobile();
}

function irParaCheckoutMobileNovo() {
  irEntrega();
}
function abrirCarrinhoMobile() {
  const checkoutMobile =
    document.getElementById("checkoutMobile") ||
    document.querySelector(".checkout-mobile") ||
    document.querySelector(".carrinho-mobile");

  if (checkoutMobile) {
    checkoutMobile.classList.add("ativo");
  }

  if (typeof mostrarEtapa === "function") {
    mostrarEtapa("etapaCarrinho");
  }

  if (typeof atualizarCarrinho === "function") {
    atualizarCarrinho();
  }
}

function fecharCarrinhoMobile() {
  const checkoutMobile =
    document.getElementById("checkoutMobile") ||
    document.querySelector(".checkout-mobile") ||
    document.querySelector(".carrinho-mobile");

  if (checkoutMobile) {
    checkoutMobile.classList.remove("ativo");
  }
}
function abrirCarrinhoMobile() {
  const checkout = document.getElementById("checkoutMobile");

  if (!checkout) return;

  checkout.classList.add("ativo");

  carregarCarrinho();
  atualizarCarrinho();

  const listaMobile = document.getElementById("listaCarrinhoMobile");

  if (listaMobile) {
    montarListaCarrinho(listaMobile, carrinho);
  }

  mostrarEtapa("etapaCarrinho");
}
function atualizarBadgeCarrinho(){

  carregarCarrinho();

  const contador =
    document.getElementById("contadorCarrinho");

  if(!contador) return;

  const total = carrinho.reduce((acc,item)=>{
    return acc + Number(item.quantidade || 1);
  },0);

  contador.innerText = total;
}

document.addEventListener("DOMContentLoaded", ()=>{

  atualizarBadgeCarrinho();

});
function renderCarrinhoMobileMS() {
  carregarCarrinho();

  const lista = document.getElementById("listaCarrinhoMobile");
  if (!lista) return;

  if (carrinho.length === 0) {
    lista.innerHTML = `<p class="carrinho-vazio-mobile">Seu carrinho está vazio.</p>`;
    return;
  }

  lista.innerHTML = carrinho.map((item, index) => `
    <div class="item-mobile-ms">
      <img src="${item.imagem || item.img}" alt="${item.nome}">

      <div class="info-mobile-ms">
        <h4>${item.nome}</h4>
        <p>Tamanho: ${item.tamanho}</p>

        <div class="qtd-mobile-ms">
          <button onclick="diminuirQuantidade(${index}); renderCarrinhoMobileMS();">−</button>
          <span>${item.quantidade}</span>
          <button onclick="aumentarQuantidade(${index}); renderCarrinhoMobileMS();">+</button>
        </div>

        <strong>${dinheiro(pegarPrecoNumero(item.preco) * Number(item.quantidade || 1))}</strong>

        <button class="remover-mobile-ms" onclick="removerItem(${index}); renderCarrinhoMobileMS();">
          Remover
        </button>
      </div>
    </div>
  `).join("");
}

function abrirCarrinhoMobile() {
  const checkout = document.getElementById("checkoutMobile");
  if (!checkout) return;

  checkout.classList.add("ativo");

  mostrarEtapa("etapaCarrinho");
  renderCarrinhoMobileMS();
}
function abrirCarrinhoMobile() {
  const checkout = document.getElementById("checkoutMobile");
  const lista = document.getElementById("listaCarrinhoMobile");

  if (!checkout) return;

  checkout.classList.add("ativo");

  document.getElementById("tituloEtapa").innerText = "Meu carrinho";

  document.querySelectorAll(".etapa-checkout").forEach(e => e.classList.remove("ativa"));
  document.getElementById("etapaCarrinho").classList.add("ativa");

  document.querySelectorAll(".etapas span").forEach(s => s.classList.remove("ativo"));
  document.querySelector('.etapas span[data-num="1"]').classList.add("ativo");

  carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  if (!lista) {
    alert("Não foi possível carregar o carrinho. Atualize a página e tente novamente.");
    return;
  }

  if (carrinho.length === 0) {
    lista.innerHTML = `<p style="color:#aaa;text-align:center;margin:25px 0;">Seu carrinho está vazio.</p>`;
    return;
  }

  lista.innerHTML = carrinho.map((item, index) => `
    <div class="item-mobile-ms">
      <img src="${item.imagem || item.img || ''}">
      <div>
        <h4>${item.nome}</h4>
        <p>Tamanho: ${item.tamanho}</p>
        <strong>${dinheiro(pegarPrecoNumero(item.preco) * Number(item.quantidade || 1))}</strong>
        <p>Qtd: ${item.quantidade || 1}</p>
        <button onclick="removerItem(${index}); abrirCarrinhoMobile();">Remover</button>
      </div>
    </div>
  `).join("");
}
function abrirCarrinhoMobileMS() {
  const modal = document.getElementById("carrinhoMobileMS");
  const lista = document.getElementById("listaCarrinhoMobileMS");

  if (!modal || !lista) return;

  modal.classList.add("ativo");

  const carrinhoMS = JSON.parse(localStorage.getItem("carrinho")) || [];

  if (carrinhoMS.length === 0) {
    lista.innerHTML = `
      <p style="color:#aaa;text-align:center;margin:20px 0;">
        Seu carrinho está vazio.
      </p>
    `;
    return;
  }

  lista.innerHTML = carrinhoMS.map((item, index) => `
  <div class="cmms-item">

    <img src="${item.imagem || item.img || ""}">

    <div class="cmms-info">

      <h4>${item.nome}</h4>

      <p>Tamanho: ${item.tamanho}</p>

      <p>
        Preço unit.:
        ${dinheiro(pegarPrecoNumero(item.preco))}
      </p>

      <strong>
        ${dinheiro(pegarPrecoNumero(item.preco) * Number(item.quantidade || 1))}
      </strong>

      <div class="cmms-acoes">

        <div class="cmms-qtd">

          <button onclick="
            diminuirQuantidade(${index});
            abrirCarrinhoMobileMS();
          ">
            −
          </button>

          <span>
            ${item.quantidade || 1}
          </span>

          <button onclick="
            aumentarQuantidade(${index});
            abrirCarrinhoMobileMS();
          ">
            +
          </button>

        </div>

        <button
        class="cmms-remover"
        onclick="
          removerItem(${index});
          abrirCarrinhoMobileMS();
        ">

          🗑 Remover

        </button>

      </div>

    </div>

  </div>
`).join("") + `

  <div class="cmms-footer">

    <div class="cmms-total">

      <span>Total:</span>

      <strong>
        ${dinheiro(
          carrinhoMS.reduce((acc, item) => {
            return acc + (pegarPrecoNumero(item.preco) * Number(item.quantidade || 1));
          }, 0)
        )}
      </strong>

    </div>

   <button class="cmms-continuar" onclick="irFreteMS()">
  Continuar
</button>

    <button
    class="cmms-limpar"
    onclick="limparCarrinhoMS()">

      🗑 Limpar carrinho

    </button>

  </div>
`;}
function limparCarrinhoMS() {

  localStorage.removeItem("carrinho");

  carrinho = [];

  abrirCarrinhoMobileMS();

  atualizarBadgeCarrinho();

}
function fecharCarrinhoMobileMS() {
  document.getElementById("carrinhoMobileMS")?.classList.remove("ativo");
}

/* caso esteja escrito com letra diferente em algum botão */
function fecharCarrinhoMobilems() {
  fecharCarrinhoMobileMS();
}
function irFreteMS(){
  document.getElementById("tituloCarrinhoMS").innerText = "Entrega";

  document.querySelectorAll(".cmms-etapa").forEach(e => e.classList.remove("ativa"));
  document.getElementById("cmmsEtapaFrete").classList.add("ativa");

  document.querySelectorAll(".cmms-etapas span").forEach(s => s.classList.remove("ativo"));
  document.getElementById("cmmsStep2").classList.add("ativo");
}
function irPagamentoMS(){

  document.getElementById("tituloCarrinhoMS").innerText = "Pagamento";

  document.querySelectorAll(".cmms-etapa").forEach(e=>{
    e.classList.remove("ativa");
  });

  document.getElementById("cmmsEtapaPagamento")
  .classList.add("ativa");

  document.querySelectorAll(".cmms-etapas span")
  .forEach(s=>{
    s.classList.remove("ativo");
  });

  document.getElementById("cmmsStep3")
  .classList.add("ativo");

  const carrinhoMS =
  JSON.parse(localStorage.getItem("carrinho")) || [];

  const total = carrinhoMS.reduce((acc,item)=>{
    return acc + (
      pegarPrecoNumero(item.preco) *
      Number(item.quantidade || 1)
    );
  },0);

  document.getElementById("totalPagamentoMobile")
  .innerText = dinheiro(total);

}
function voltarFreteMS(){

  document.getElementById("tituloCarrinhoMS")
  .innerText = "Entrega";

  document.querySelectorAll(".cmms-etapa")
  .forEach(e=>{
    e.classList.remove("ativa");
  });

  document.getElementById("cmmsEtapaFrete")
  .classList.add("ativa");

  document.querySelectorAll(".cmms-etapas span")
  .forEach(s=>{
    s.classList.remove("ativo");
  });

  document.getElementById("cmmsStep2")
  .classList.add("ativo");

}
function voltarProdutosMS(){
  document.getElementById("tituloCarrinhoMS").innerText = "Meu carrinho";

  document.querySelectorAll(".cmms-etapa").forEach(e => e.classList.remove("ativa"));
  document.getElementById("cmmsEtapaProdutos").classList.add("ativa");

  document.querySelectorAll(".cmms-etapas span").forEach(s => s.classList.remove("ativo"));
  document.getElementById("cmmsStep1").classList.add("ativo");
}
function abrirCarrinhoResponsivo() {

  if (window.innerWidth <= 768) {

    abrirCarrinhoMobileMS();

  } else {

    abrirCarrinho();

  }

}
function abrirCarrinhoMobileMS() {
  const carrinho = document.getElementById("carrinhoMobileMS");

  if (!carrinho) {
    alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
    return;
  }

  carrinho.classList.add("ativo");
}

function fecharCarrinhoMobileMS() {
  document.getElementById("carrinhoMobileMS")?.classList.remove("ativo");
}
function abrirCarrinhoMobileMS() {
  const modal = document.getElementById("carrinhoMobileMS");

  if (!modal) {
    alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
    return;
  }

  modal.classList.add("ativo");

  if (typeof abrirCarrinhoMobileMSRender === "function") {
    abrirCarrinhoMobileMSRender();
  }
}

function fecharCarrinhoMobileMS() {
  const modal = document.getElementById("carrinhoMobileMS");
  if (modal) modal.classList.remove("ativo");
}
function abrirCarrinhoResponsivoMS() {
  if (window.innerWidth <= 768) {
    const modal = document.getElementById("carrinhoMobileMS");

    if (!modal) {
      alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
      return;
    }

    modal.classList.add("ativo");
    return;
  }

  abrirCarrinho();
}
function avaliar(a, b, c){

  let estrela;
  let nota;

  if(c !== undefined){
    // formato: avaliar(event, this, 1)
    if(a && a.stopPropagation) a.stopPropagation();
    estrela = b;
    nota = c;
  }else{
    // formato antigo: avaliar(this, 1)
    estrela = a;
    nota = b;
  }

  const box = estrela.closest(".avaliacao-produto");
  if(!box) return;

  const estrelas = box.querySelectorAll("span");

  estrelas.forEach((s, index) => {
    s.classList.toggle("ativa", index < nota);
  });
}
function selecionarTamanho(botao, tamanho){
  const card = botao.closest(".card-produto");
  const grupo = botao.closest(".tamanhos");

  if(grupo){
    grupo.querySelectorAll("button").forEach(b => b.classList.remove("ativo"));
  }

  botao.classList.add("ativo");

  if(card){
    card.dataset.tamanho = tamanho;
  }
}

function mostrarToastMS(texto = "🛒 Produto adicionado ao carrinho") {

  const toast = document.getElementById("toastMS");

  if(!toast) return;

  toast.innerHTML = texto;

  toast.classList.add("ativo");

  clearTimeout(window.toastTimeoutMS);

  window.toastTimeoutMS = setTimeout(() => {
    toast.classList.remove("ativo");
  }, 2500);

}
function animarProdutoAoCarrinho(botao){

  const card = botao.closest(".card-produto");

  if(!card) return;

  const img = card.querySelector("img");

  const carrinho =
  document.querySelector(".btn-com-badge");

  if(!img || !carrinho) return;

  const imgRect = img.getBoundingClientRect();
  const carrinhoRect = carrinho.getBoundingClientRect();

  const clone = img.cloneNode(true);

  clone.style.position = "fixed";
  clone.style.zIndex = "999999";
  clone.style.pointerEvents = "none";

  clone.style.left = imgRect.left + "px";
  clone.style.top = imgRect.top + "px";

  clone.style.width = imgRect.width + "px";
  clone.style.height = imgRect.height + "px";

  clone.style.borderRadius = "24px";

  clone.style.transition =
  "all .8s cubic-bezier(.2,.8,.2,1)";

  clone.style.boxShadow =
  "0 0 30px rgba(212,175,55,.45)";

  document.body.appendChild(clone);

  requestAnimationFrame(() => {

    clone.style.left =
    carrinhoRect.left + "px";

    clone.style.top =
    carrinhoRect.top + "px";

    clone.style.width = "25px";
    clone.style.height = "25px";

    clone.style.opacity = ".2";

    clone.style.transform =
    "scale(.3) rotate(15deg)";

  });

  setTimeout(() => {
    clone.remove();
  }, 850);

}
function avaliar(el, nota){

  const estrelas =
  el.parentElement.querySelectorAll("span");

  estrelas.forEach((estrela,index)=>{

    if(index < nota){
      estrela.classList.add("ativa");
    }else{
      estrela.classList.remove("ativa");
    }

  });

}
async function buscarEnderecoCheckout() {

  const cep = document
    .getElementById("cepCheckout")
    .value
    .replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {

    const resposta = await fetch(
      `https://viacep.com.br/ws/${cep}/json/`
    );

    const dados = await resposta.json();

    if (dados.erro) {
      alert("Não encontramos esse CEP. Confira os números e tente novamente.");
      return;
    }

    document.getElementById("ruaCliente").value =
      dados.logradouro || "";

    document.getElementById("bairroCliente").value =
      dados.bairro || "";

    document.getElementById("cidadeCliente").value =
      dados.localidade || "";

    document.getElementById("estadoCliente").value =
      dados.uf || "";

  } catch (erro) {

    console.error("Erro ao buscar CEP:", erro);

  }

}
async function buscarEnderecoCheckout() {
  const cep = document.getElementById("cepCheckout").value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("Não encontramos esse CEP. Confira os números e tente novamente.");
      return;
    }

    document.getElementById("ruaCliente").value = dados.logradouro || "";
    document.getElementById("bairroCliente").value = dados.bairro || "";
    document.getElementById("cidadeCliente").value = dados.localidade || "";
    document.getElementById("estadoCliente").value = dados.uf || "";

  } catch (erro) {
    console.log("Erro ViaCEP:", erro);
  }
}
async function buscarEnderecoCheckout() {
  const cepInput = document.getElementById("cepCheckout");
  const rua = document.getElementById("ruaCliente");
  const bairro = document.getElementById("bairroCliente");
  const cidade = document.getElementById("cidadeCliente");
  const estado = document.getElementById("estadoCliente");

  if (!cepInput || !rua || !bairro || !cidade || !estado) {
    alert("Não foi possível carregar os campos de entrega. Atualize a página e tente novamente.");
    return;
  }

  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("Não encontramos esse CEP. Confira os números e tente novamente.");
      return;
    }

    rua.value = dados.logradouro || "";
    bairro.value = dados.bairro || "";
    cidade.value = dados.localidade || "";
    estado.value = dados.uf || "";

  } catch (erro) {
    console.error("Erro ao buscar CEP:", erro);
  }
}
async function buscarEnderecoCheckout() {
  console.log("FUNÇÃO RODOU");

  const cepInput = document.querySelector("#cepCheckout");
  const rua = document.querySelector("#ruaCliente");
  const bairro = document.querySelector("#bairroCliente");
  const cidade = document.querySelector("#cidadeCliente");
  const estado = document.querySelector("#estadoCliente");

  console.log({
    cepInput,
    rua,
    bairro,
    cidade,
    estado
  });

  if (!cepInput || !rua || !bairro || !cidade || !estado) {
    alert("Não foi possível carregar os dados de entrega. Atualize a página e tente novamente.");
    return;
  }

  const cep = cepInput.value.replace(/\D/g, "");

  console.log("CEP LIMPO:", cep);

  if (cep.length !== 8) return;

  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const dados = await resposta.json();

  console.log("DADOS VIACEP:", dados);

  rua.value = dados.logradouro || "";
  bairro.value = dados.bairro || "";
  cidade.value = dados.localidade || "";
  estado.value = dados.uf || "";
}
async function buscarEnderecoCheckout() {
  const cepInput = document.getElementById("cepCheckout");
  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
  const dados = await resposta.json();

  if (dados.erro) {
    alert("Não encontramos esse CEP. Confira os números e tente novamente.");
    return;
  }

  const rua = document.getElementById("ruaCliente");
  const bairro = document.getElementById("bairroCliente");
  const cidade = document.getElementById("cidadeCliente");
  const estado = document.getElementById("estadoCliente");
  if (rua) rua.value = dados.logradouro || "";
  if (bairro) bairro.value = dados.bairro || "";
  if (cidade) cidade.value = dados.localidade || "";
  if (estado) estado.value = dados.uf || "";
}
function atualizarResumoPagamentoMS() {
  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  let subtotal = 0;

  carrinho.forEach(item => {
    const preco = Number(item.preco || item.valor || 0);
    const qtd = Number(item.quantidade || item.qtd || 1);
    subtotal += preco * qtd;
  });

  const frete = Number(window.valorFrete || localStorage.getItem("valorFrete") || 0);
  const total = subtotal + frete;

  const elProdutos = document.getElementById("valorProdutosPagamento");
  const elFrete = document.getElementById("valorFretePagamento");
  const elTotal = document.getElementById("valorTotalPagamento");

  if (elProdutos) elProdutos.innerText = subtotal.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  if (elFrete) elFrete.innerText = frete.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });

  if (elTotal) elTotal.innerText = total.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}
function atualizarResumoPagamentoMS() {
  const carrinho =
    window.carrinho ||
    window.carrinhoMobile ||
    JSON.parse(localStorage.getItem("carrinhoMobile")) ||
    JSON.parse(localStorage.getItem("carrinhoMS")) ||
    JSON.parse(localStorage.getItem("carrinho")) ||
    [];

  let subtotal = 0;

  carrinho.forEach(item => {
    const preco = Number(item.preco || item.valor || item.price || item.precoProduto || 0);
    const qtd = Number(item.quantidade || item.qtd || 1);
    subtotal += preco * qtd;
  });

  const frete = Number(
    window.valorFrete ||
    localStorage.getItem("valorFrete") ||
    localStorage.getItem("freteMS") ||
    0
  );

  const total = subtotal + frete;

  document.getElementById("valorProdutosPagamento").innerText =
    subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorFretePagamento").innerText =
    frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorTotalPagamento").innerText =
    total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}
window.atualizarResumoPagamentoMS = function () {
  let subtotal = 0;

  const cards = document.querySelectorAll("#resumoPedidoMobile .item-resumo, #resumoPedidoMobile .produto-resumo, #resumoPedidoMobile > div");

  const carrinho = window.carrinho || window.carrinhoMobile || [];
  const resumoMobile = document.getElementById("resumoPedidoMobile");

if (resumoMobile && Array.isArray(carrinho)) {

  resumoMobile.innerHTML = "";

  carrinho.forEach(item => {

    const imagemItem = item.img || item.imagem || "";
    const precoFinal = Number(item.preco || 0) * Number(item.quantidade || 1);

    resumoMobile.innerHTML += `
      <div class="item-resumo-mobile">

        <img src="${imagemItem}">

        <div class="info-item-resumo">
          <strong>${item.nome}</strong>

          <p>Tamanho: ${item.tamanho}</p>

          <div class="linha-preco-qtd">
            <span>Qtd: ${item.quantidade}</span>

            <strong class="preco-item-resumo">
              ${precoFinal.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </strong>
          </div>
        </div>

      </div>
    `;
  });
}

  if (Array.isArray(carrinho) && carrinho.length > 0) {
    carrinho.forEach(item => {
      const preco = Number(item.preco || item.valor || item.price || 0);
      const qtd = Number(item.quantidade || item.qtd || 1);
      subtotal += preco * qtd;
    });
  }

  if (subtotal <= 0) {
    subtotal = 0;
    const textos = document.querySelectorAll("#resumoPedidoMobile strong, #resumoPedidoMobile b, #resumoPedidoMobile span");
    textos.forEach(t => {
      const valor = t.textContent.replace(/[^\d,]/g, "").replace(",", ".");
      if (valor) subtotal += Number(valor) || 0;
    });
  }

  const frete = Number(window.valorFrete || window.freteSelecionadoValor || localStorage.getItem("valorFreteMS") || 0);
  const total = subtotal + frete;

  document.getElementById("valorProdutosPagamento").innerText =
    subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorFretePagamento").innerText =
    frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorTotalPagamento").innerText =
    total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
// Removido: este temporizador sobrescrevia o desconto do cupom a cada 500 ms.
let descontoCupomMS = 0;
let codigoCupomAplicadoMS = "";
localStorage.removeItem("descontoCupomMS");
localStorage.removeItem("cupomMS");

async function aplicarCupomMS() {
  if (window.__cupomMobileValidandoMS) return;

  const input = document.getElementById("cupomPagamentoMS") || document.getElementById("cupomInput");
  const mensagem = document.getElementById("mensagemCupomMS") || document.getElementById("cupomMensagem");
  const botao = input?.closest(".cupom-linha-ms, .cmms-cupom-linha, div")?.querySelector("button") ||
    document.querySelector("button[onclick*=\"aplicarCupomMS\"]");

  if (!input || !mensagem) return;

  const codigo = input.value.trim().toUpperCase();
  if (!codigo) {
    mensagem.textContent = "Digite um cupom.";
    mensagem.style.color = "#ff4d6d";
    return;
  }

  let itens = [];
  try { itens = JSON.parse(localStorage.getItem("carrinho") || "[]"); } catch (_) {}
  const subtotal = itens.reduce((soma, item) => {
    return soma + pegarPrecoNumero(item.preco ?? item.valor ?? item.price ?? 0) * Number(item.quantidade ?? item.qtd ?? 1);
  }, 0);

  window.__cupomMobileValidandoMS = true;
  mensagem.textContent = "Validando cupom...";
  mensagem.style.color = "#f4ca38";
  if (botao) { botao.disabled = true; botao.textContent = "Validando..."; }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const resposta = await fetch(`${API_BASE}/cupons/validar`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ codigo, subtotal }),
      signal: controller.signal
    });

    const texto = await resposta.text();
    let dados = {};
    try { dados = texto ? JSON.parse(texto) : {}; } catch (_) {}

    if (!resposta.ok || !dados.valido) {
      throw new Error(dados.mensagem || "Cupom inválido.");
    }

    descontoCupomMS = Number(dados.percentual ?? dados.cupom?.percentual ?? 0);
    codigoCupomAplicadoMS = codigo;
    window.descontoCupomMS = descontoCupomMS;
    window.codigoCupomAplicadoMS = codigo;

    mensagem.textContent = "Cupom aplicado com sucesso ✓";
    mensagem.style.color = "#22c55e";

    // Atualiza apenas o resumo. Não reconstrói nem fecha o carrinho mobile.
    atualizarResumoPagamentoMSComCupom();
  } catch (erro) {
    descontoCupomMS = 0;
    codigoCupomAplicadoMS = "";
    window.descontoCupomMS = 0;
    atualizarResumoPagamentoMSComCupom();
    mensagem.textContent = erro?.name === "AbortError"
      ? "A validação demorou demais. Tente novamente."
      : (erro.message || "Não foi possível validar o cupom.");
    mensagem.style.color = "#ff4d6d";
  } finally {
    clearTimeout(timeout);
    window.__cupomMobileValidandoMS = false;
    if (botao) { botao.disabled = false; botao.textContent = "Aplicar"; }
  }
}
function atualizarResumoPagamentoMSComCupom() {
  let itens = [];
  try {
    itens = JSON.parse(localStorage.getItem("carrinho") || "[]");
  } catch (erro) {
    itens = [];
  }

  const subtotal = Array.isArray(itens)
    ? itens.reduce((soma, item) => {
        const preco = pegarPrecoNumero(item.preco ?? item.valor ?? item.price ?? 0);
        const quantidade = Number(item.quantidade ?? item.qtd ?? 1);
        return soma + (preco * quantidade);
      }, 0)
    : 0;

  let freteSalvo = null;
  try {
    freteSalvo = JSON.parse(localStorage.getItem("freteSelecionadoMS") || "null");
  } catch (erro) {}

  const frete = Number(
    freteSelecionado?.preco ??
    freteSalvo?.preco ??
    window.valorFrete ??
    window.freteSelecionadoValor ??
    localStorage.getItem("valorFreteMS") ??
    localStorage.getItem("valorFrete") ??
    0
  ) || 0;

  const percentual = Number(descontoCupomMS || 0);
  const valorDesconto = subtotal * (percentual / 100);
  const total = Math.max(0, subtotal - valorDesconto + frete);

  atualizarTexto("valorProdutosPagamento", dinheiro(subtotal));
  atualizarTexto("valorFretePagamento", dinheiro(frete));
  atualizarTexto("valorTotalPagamento", dinheiro(total));
  atualizarTexto("totalPagamentoMobile", dinheiro(total));
  atualizarTexto("totalCarrinhoMobileMS", dinheiro(total));

  const totalEl = document.getElementById("valorTotalPagamento");
  let linhaDesconto = document.getElementById("linhaDescontoCupomMSMobile");

  if (!linhaDesconto && totalEl) {
    const linhaTotal = totalEl.closest(".linha-total, p, .linha-resumo, .resumo-linha, div");
    if (linhaTotal?.parentElement) {
      linhaDesconto = document.createElement("div");
      linhaDesconto.id = "linhaDescontoCupomMSMobile";
      linhaDesconto.className = "linha-resumo linha-desconto-cupom-ms";
      linhaDesconto.style.color = "#22c55e";
      linhaDesconto.innerHTML = `
        <span id="rotuloDescontoCupomMSMobile">Desconto</span>
        <strong id="valorDescontoCupomMSMobile"></strong>
      `;
      linhaTotal.parentElement.insertBefore(linhaDesconto, linhaTotal);
    }
  }

  if (linhaDesconto) {
    linhaDesconto.style.display = percentual > 0 ? "flex" : "none";
    const rotulo = document.getElementById("rotuloDescontoCupomMSMobile");
    const valorEl = document.getElementById("valorDescontoCupomMSMobile");
    if (rotulo) rotulo.textContent = `Desconto ${codigoCupomAplicadoMS || "cupom"}`;
    if (valorEl) valorEl.textContent = `- ${dinheiro(valorDesconto)}`;
  }

  totalComFrete = total;
  window.descontoCupomMS = percentual;
  window.valorDescontoCupomMS = valorDesconto;
  window.totalComCupomMS = total;
}

window.aplicarCupomMS = aplicarCupomMS;
window.atualizarResumoPagamentoMSComCupom = atualizarResumoPagamentoMSComCupom;

document.addEventListener("keydown", function (event) {
  if (event.key === "Enter" && ["cupomPagamentoMS", "cupomInput"].includes(event.target?.id)) {
    event.preventDefault();
    window.aplicarCupomMS();
  }
});

async function comprarFavoritosMS(){

  const favoritos = JSON.parse(localStorage.getItem("favoritosMS")) || [];

  if(!favoritos.length){
    alert("Você ainda não adicionou produtos aos favoritos.");
    return false;
  }

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
  const adicionados = [];
  const indisponiveis = [];

  function corFavoritoMS(nome){
    const n = String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
    if(n.includes("preto") || n.includes("preta")) return "Preto";
    if(n.includes("off white") || n.includes("offwhite")) return "Off White";
    if(n.includes("branco") || n.includes("branca")) return "Branco";
    if(n.includes("bege")) return "Bege";
    if(n.includes("azul")) return "Azul";
    if(n.includes("rosa")) return "Rosa";
    if(n.includes("cinza")) return "Cinza";
    if(n.includes("vinho") || n.includes("bordo")) return "Vinho";
    if(n.includes("marrom")) return "Marrom";
    if(n.includes("vermelho") || n.includes("vermelha")) return "Vermelho";
    return "Única";
  }

  for(const produto of favoritos){
    const tamanho = String(produto.tamanho || "P").toUpperCase().trim();
    const item = {
      nome: produto.nome,
      preco: pegarPrecoNumero(produto.preco) || 0,
      imagem: produto.imagem || produto.img || "",
      img: produto.img || produto.imagem || "",
      tamanho,
      cor: produto.cor || corFavoritoMS(produto.nome),
      quantidade: 1
    };

    try{
      const resposta = await fetch(`${API_BASE}/estoque/disponivel`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(item)
      });

      const estoque = await resposta.json().catch(() => ({}));
      const jaNoCarrinho = carrinho
        .filter(p => String(p.nome || "").trim() === String(item.nome || "").trim()
          && String(p.tamanho || "").toUpperCase().trim() === tamanho)
        .reduce((total, p) => total + Number(p.quantidade || 1), 0);

      if(!resposta.ok || !estoque.cadastrado || jaNoCarrinho + 1 > Number(estoque.disponivel || 0)){
        indisponiveis.push(`${item.nome} - tamanho ${tamanho}`);
        continue;
      }

      const itemExistente = carrinho.find(p =>
        String(p.nome || "").trim() === String(item.nome || "").trim()
        && String(p.tamanho || "").toUpperCase().trim() === tamanho
      );

      if(itemExistente){
        itemExistente.quantidade = Number(itemExistente.quantidade || 1) + 1;
      }else{
        carrinho.push(item);
      }

      adicionados.push(item.nome);
    }catch(erro){
      console.error("Erro ao validar favorito no estoque:", erro);
      indisponiveis.push(`${item.nome} - não foi possível validar o estoque`);
    }
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  if(typeof carregarCarrinho === "function") carregarCarrinho();
  if(typeof atualizarCarrinho === "function") atualizarCarrinho();
  if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
  if(typeof renderCarrinhoMobileMS === "function") renderCarrinhoMobileMS();

  if(indisponiveis.length){
    alert(`Não adicionamos os produtos sem estoque:\n\n${indisponiveis.join("\n")}`);
  }

  if(!adicionados.length) return false;

  document.getElementById("painelFavoritos")?.classList.remove("ativo");
  document.getElementById("painelFavoritos")?.classList.remove("favoritos-ativo");

  if(window.innerWidth <= 768){
    abrirCarrinhoMobileMS();
  } else {
    abrirCarrinho();
  }

  return true;
}


function iniciarHeroSliderMS(){
  return;
}

document.addEventListener("DOMContentLoaded", iniciarHeroSliderMS);

window.avaliar = function(event, elemento, nota){

  if(event && event.stopPropagation){
    event.stopPropagation();
  }

  const estrela = elemento;
  const box = estrela.closest(".avaliacao-produto");

  if(!box) return;

  const estrelas = box.querySelectorAll("span");

  estrelas.forEach((s, index) => {
    s.classList.toggle("ativa", index < nota);
  });
};
// ===== BUSCA MS =====

function abrirBuscaMS(){
  document.getElementById("buscaMS").classList.add("ativo");
  document.getElementById("campoBuscaMS").focus();
}

function fecharBuscaMS(){
  document.getElementById("buscaMS").classList.remove("ativo");
}

function filtrarProdutosMS(){

  const termo = document
    .getElementById("campoBuscaMS")
    .value
    .toLowerCase();

  const resultado = document.getElementById("resultadoBuscaMS");

  resultado.innerHTML = "";

  if(termo.length < 1){
    return;
  }

  const cards = document.querySelectorAll(".card-produto");

  cards.forEach(card => {

    const nome =
      card.querySelector("h3, .nome-produto, .produto-nome")
      ?.innerText || "";

    const preco =
      card.querySelector(".preco, .produto-preco")
      ?.innerText || "";

    const img =
      card.querySelector("img")
      ?.src || "";

    if(nome.toLowerCase().includes(termo)){

      const item = document.createElement("div");

      item.className = "item-busca-ms";

      item.innerHTML = `
        <img src="${img}">

        <div>
          <strong>${nome}</strong>
          <span>${preco}</span>
        </div>
      `;

      item.onclick = function(){

        fecharBuscaMS();

        abrirProdutoDetalheCard(card);

      };

      resultado.appendChild(item);
    }

  });

  if(resultado.innerHTML === ""){
    resultado.innerHTML = "<p>Nenhum produto encontrado.</p>";
  }

}
// ===== CORREÇÃO TAMANHO DETALHE =====

window.tamanhoSelecionadoDetalhe = "";

function selecionarTamanho(botao, tamanho){
  window.tamanhoSelecionadoDetalhe = tamanho;
  window.tamanhoSelecionado = tamanho;

  const grupo = botao.closest(".tamanhos-detalhe, .detalhe-tamanhos, .tamanhos");

  if(grupo){
    grupo.querySelectorAll("button").forEach(btn => {
      btn.classList.remove("ativo");
    });
  }

  botao.classList.add("ativo");
}
// ===== CORREÇÃO DEFINITIVA TAMANHO CARD + DETALHE =====

function selecionarTamanho(botao, tamanho){
  const grupo = botao.closest(".tamanhos, .tamanhos-detalhe, .detalhe-tamanhos");

  if(grupo){
    grupo.querySelectorAll("button").forEach(btn => {
      btn.classList.remove("ativo");
    });
  }

  botao.classList.add("ativo");

  const card = botao.closest(".card-produto");
  if(card){
    card.dataset.tamanho = tamanho;
  }

  const detalhe = botao.closest("#produtoDetalhe");
  if(detalhe){
    detalhe.dataset.tamanho = tamanho;
  }

  window.tamanhoSelecionado = tamanho;
  window.tamanhoSelecionadoDetalhe = tamanho;
}
function mostrarToastMS(texto = "Produto adicionado ao carrinho!"){
  let toast = document.getElementById("toastMS");

  if(!toast){
    toast = document.createElement("div");
    toast.id = "toastMS";
    toast.className = "toast-ms";
    document.body.appendChild(toast);
  }

  toast.innerHTML = `
    <div class="toast-ms-icone">✓</div>
    <div>
      <strong>MS MATIAS STYLE</strong>
      <p>${texto}</p>
    </div>
  `;

  toast.classList.add("ativo");

  clearTimeout(window.toastMSTimer);
  window.toastMSTimer = setTimeout(() => {
    toast.classList.remove("ativo");
  }, 2600);
}
function avisoCarrinhoPremium(){

  let aviso = document.getElementById("avisoCarrinhoPremium");

  if(!aviso){

    aviso = document.createElement("div");

    aviso.id = "avisoCarrinhoPremium";

    aviso.innerHTML = `
      <div class="premium-check">✓</div>

      <div class="premium-info">
        <strong>Produto adicionado</strong>
        <span>Seu item foi enviado ao carrinho.</span>
      </div>
    `;

    document.body.appendChild(aviso);
  }

  aviso.classList.add("ativo");

  clearTimeout(window.toastPremiumTimer);

  window.toastPremiumTimer = setTimeout(() => {
    aviso.classList.remove("ativo");
  }, 2200);
}
function abrirCarrinhoMS(){
  const carrinho =
    document.querySelector(".carrinho") ||
    document.getElementById("carrinho") ||
    document.querySelector(".carrinho-responsivo");

  const fundo =
    document.querySelector(".fundo-carrinho") ||
    document.getElementById("fundoCarrinho");

  if(carrinho){
    carrinho.classList.add("ativo");
  }

  if(fundo){
    fundo.classList.add("ativo");
  }

  document.body.style.overflow = "hidden";
}

window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;
window.abrirAjudaMobile = abrirAjudaMobile;
window.abrirAjudaMobile = abrirAjudaMobile;

window.abrirMenuMobile = abrirMenuMobile;
window.fecharMenuMobile = fecharMenuMobile;

window.irParaCategorias = irParaCategorias;

window.irParaMoletons = irParaMoletons;

document.addEventListener("DOMContentLoaded", atualizarTudo);

// deixa funções disponíveis para onclick do HTML
window.selecionarTamanho = selecionarTamanho;
window.adicionarCarrinho = adicionarCarrinho;
window.abrirCarrinho = abrirCarrinho;
window.fecharCarrinho = fecharCarrinho;
window.removerItem = removerItem;
window.aumentarQuantidade = aumentarQuantidade;
window.diminuirQuantidade = diminuirQuantidade;
window.alterarQuantidadeMobile = alterarQuantidadeMobile;
window.limparCarrinhoMobile = limparCarrinhoMobile;
window.limparCarrinhoPC = limparCarrinhoPC;
window.irEntrega = irEntrega;
window.irPagamento = irPagamento;
window.voltarCheckoutMobile = voltarCheckoutMobile;
window.irCarrinhoPC = irCarrinhoPC;
window.irEntregaPC = irEntregaPC;
window.irPagamentoPC = irPagamentoPC;
window.finalizarCompra = finalizarCompra;
window.finalizarCompraFinal = finalizarCompraFinal;
window.calcularFrete = calcularFrete;
window.calcularFreteCheckout = calcularFreteCheckout;
window.selecionarFrete = selecionarFrete;
window.buscarEndereco = buscarEndereco;
window.aplicarCupom = aplicarCupom;
window.abrirContato = abrirContato;
window.fecharContato = fecharContato;
window.mostrarAviso = mostrarAviso;
window.fecharAviso = fecharAviso;
window.abrirProdutoDetalheCard = abrirProdutoDetalheCard;
window.trocarFotoDetalhe = trocarFotoDetalhe;
window.fecharProdutoDetalhe = fecharProdutoDetalhe;
window.adicionarProdutoDetalhe = adicionarProdutoDetalhe;

// ===============================
// CORREÇÃO DEFINITIVA DO BOTÃO FINAL
// ===============================


window.abrirCarrinhoMobile = abrirCarrinhoMobile;

window.fecharCarrinhoMobile = fecharCarrinhoMobile;

window.continuarCarrinhoMobile = continuarCarrinhoMobile;

window.abrirCarrinhoMobileNovo = abrirCarrinhoMobileNovo;

window.fecharCarrinhoMobileNovo = fecharCarrinhoMobileNovo;

window.irParaCheckoutMobileNovo = irParaCheckoutMobileNovo;

window.mostrarLoadingCheckout = mostrarLoadingCheckout;

window.esconderLoadingCheckout = esconderLoadingCheckout;


/* =========================================================
   CORREÇÃO FINAL MS - CARRINHO, COMPRAR AGORA E AVISO PREMIUM
   Colei no final para mandar nas funções antigas sem quebrar o resto.
   ========================================================= */

function msCarregarCarrinhoFinal(){
  try{
    return JSON.parse(localStorage.getItem("carrinho")) || [];
  }catch(e){
    return [];
  }
}

function msSalvarCarrinhoFinal(lista){
  localStorage.setItem("carrinho", JSON.stringify(lista || []));
  window.carrinho = lista || [];
  carrinho = lista || [];
}

function msDinheiroFinal(valor){
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function msAtualizarTudoFinal(){
  if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
  if(typeof atualizarContador === "function") atualizarContador();
  if(typeof atualizarCarrinho === "function") atualizarCarrinho();
  if(typeof renderCarrinhoMobileMS === "function") renderCarrinhoMobileMS();
}

function avisoCarrinhoPremium(texto = "Seu item foi enviado ao carrinho."){
  let aviso = document.getElementById("avisoCarrinhoPremium");

  if(!aviso){
    aviso = document.createElement("div");
    aviso.id = "avisoCarrinhoPremium";
    document.body.appendChild(aviso);
  }

  aviso.innerHTML = `
    <div class="premium-check">✓</div>
    <div class="premium-info">
      <strong>Produto adicionado</strong>
      <span>${texto}</span>
    </div>
  `;

  aviso.classList.add("ativo");

  clearTimeout(window.avisoCarrinhoPremiumTimer);
  window.avisoCarrinhoPremiumTimer = setTimeout(() => {
    aviso.classList.remove("ativo");
  }, 2200);
}

function selecionarTamanho(botao, tamanho){
  const grupo = botao.closest(".tamanhos, .tamanhos-detalhe, .detalhe-tamanhos");

  if(grupo){
    grupo.querySelectorAll("button").forEach(btn => btn.classList.remove("ativo"));
  }

  botao.classList.add("ativo");

  const card = botao.closest(".card-produto");
  if(card) card.dataset.tamanho = tamanho;

  const detalhe = botao.closest("#produtoDetalhe");
  if(detalhe) detalhe.dataset.tamanho = tamanho;
}

function msPegarProdutoDoCard(botao){
  const card = botao?.closest?.(".card-produto");

  if(!card) return null;

  const tamanho =
    card.dataset.tamanho ||
    card.querySelector(".tamanhos button.ativo, .tamanho-btn.ativo")?.innerText.trim();

  if(!tamanho){
    alert("Selecione um tamanho para adicionar este produto ao carrinho.");
    return null;
  }

  const nome =
    botao.dataset.nome ||
    card.dataset.nome ||
    card.querySelector("h3")?.innerText.trim() ||
    "Produto MS";

  const precoBruto =
    botao.dataset.preco ||
    card.dataset.preco ||
    card.querySelector(".preco")?.innerText ||
    "100";

  const preco = typeof pegarPrecoNumero === "function"
    ? pegarPrecoNumero(precoBruto)
    : Number(String(precoBruto).replace(/\D/g, "")) || 100;

  const imagem =
    botao.dataset.img ||
    card.dataset.img ||
    card.querySelector(".img-principal")?.getAttribute("src") ||
    card.querySelector(".foto-normal")?.getAttribute("src") ||
    card.querySelector(".produto-img img")?.getAttribute("src") ||
    card.querySelector("img")?.getAttribute("src") ||
    "";

  return { nome, preco, imagem, tamanho, quantidade: 1 };
}

function msPegarProdutoDoDetalhe(){
  const detalhe = document.getElementById("produtoDetalhe");

  if(!detalhe || !produtoDetalheAtual){
    alert("Este produto não está disponível no momento. Escolha outra opção.");
    return null;
  }

  const tamanho =
    detalhe.dataset.tamanho ||
    detalhe.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo")?.innerText.trim();

  if(!tamanho){
    alert("Selecione um tamanho para continuar com a compra.");
    return null;
  }

  return {
    nome: produtoDetalheAtual.nome,
    preco: pegarPrecoNumero(produtoDetalheAtual.preco || 100),
    imagem: produtoDetalheAtual.img,
    tamanho: tamanho,
    quantidade: Number(quantidadeDetalhe || 1)
  };
}

function msAdicionarItemFinal(item){
  const lista = msCarregarCarrinhoFinal();

  const existente = lista.find(produto =>
    produto.nome === item.nome && produto.tamanho === item.tamanho
  );

  const qtd = Number(item.quantidade || quantidadeDetalhe || 1);

  if(existente){
    existente.quantidade = Number(existente.quantidade || 0) + qtd;
  }else{
    lista.push({ ...item, quantidade: qtd });
  }

  msSalvarCarrinhoFinal(lista);
  msAtualizarTudoFinal();

  return lista;
}

function adicionarCarrinho(botao){
  const item = msPegarProdutoDoCard(botao);
  if(!item) return;

  msAdicionarItemFinal(item);

  if(typeof animarProdutoAoCarrinho === "function"){
    animarProdutoAoCarrinho(botao);
  }else if(typeof animarProdutoParaCarrinho === "function"){
    animarProdutoParaCarrinho(botao);
  }

  avisoCarrinhoPremium("Seu item foi enviado ao carrinho.");
}

function adicionarProdutoDetalhe(){
  console.log("ADICIONAR DETALHE", quantidadeDetalhe);
  const item = msPegarProdutoDoDetalhe();
  if(!item) return;

  msAdicionarItemFinal(item);
  avisoCarrinhoPremium("Seu item foi enviado ao carrinho.");
}

function abrirCarrinhoMS(){
  msAtualizarTudoFinal();

  const carrinhoNovo = document.getElementById("carrinhoMobileMS");
  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(carrinhoNovo){
    carrinhoNovo.classList.add("ativo");
    carrinhoNovo.style.zIndex = "10000000";

    if(typeof abrirCarrinhoMobileMSRender === "function"){
      abrirCarrinhoMobileMSRender();
    }

    if(typeof mostrarEtapaMS === "function"){
      mostrarEtapaMS("cmmsEtapaProdutos");
    }

    return;
  }

  if(carrinhoPC){
    carrinhoPC.classList.add("ativo");
    carrinhoPC.style.zIndex = "10000000";
    if(fundo){
      fundo.classList.add("ativo");
      fundo.style.zIndex = "9999999";
    }
    return;
  }

  alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
}

function abrirCarrinhoResponsivoMS(){
  abrirCarrinhoMS();
}

function abrirCarrinhoResponsivo(){
  abrirCarrinhoMS();
}

function abrirCarrinho(){
  abrirCarrinhoMS();
}
function comprarAgoraDetalhe(){

    adicionarProdutoDetalhe();

    abrirCarrinhoResponsivoMS();

}

function fecharCarrinhoMS(){
  document.getElementById("carrinhoMobileMS")?.classList.remove("ativo");
  document.getElementById("carrinho")?.classList.remove("ativo");
  document.getElementById("fundoCarrinho")?.classList.remove("ativo");
}
/* ===== CORREÇÃO FINAL CARRINHO MS ===== */

function abrirCarrinhoMS(){

  carregarCarrinho();

  const carrinhoMS = document.getElementById("carrinhoMobileMS");
  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(window.innerWidth <= 768){

    if(carrinhoMS){
      carrinhoMS.classList.add("ativo");

      if(typeof abrirCarrinhoMobileMSRender === "function"){
        abrirCarrinhoMobileMSRender();
      }

      return;
    }

  }

  if(carrinhoPC){
    carrinhoPC.classList.add("ativo");
    fundo?.classList.add("ativo");

    if(typeof atualizarCarrinho === "function"){
      atualizarCarrinho();
    }

    return;
  }

  alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
}

function comprarAgoraDetalhe(){
  
  adicionarProdutoDetalhe();
  abrirCarrinhoPCMS();
  return false;
}
function abrirCarrinhoPCMS(){
  const carrinhoMobile = document.getElementById("carrinhoMobileMS");
  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(carrinhoMobile){
    carrinhoMobile.classList.remove("ativo");
    carrinhoMobile.style.display = "none";
  }

  if(!carrinhoPC){
    alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
    return false;
  }

  carrinhoPC.style.display = "block";
  carrinhoPC.classList.add("ativo");

  if(fundo){
    fundo.classList.add("ativo");
  }

  if(typeof atualizarCarrinho === "function"){
    atualizarCarrinho();
  }

  return false;
}

window.comprarAgoraDetalhe = function(){
  return abrirCarrinhoPCMS();
};

window.abrirCarrinhoResponsivoMS = function(){
  if(window.innerWidth > 768){
    return abrirCarrinhoPCMS();
  }

  document.getElementById("carrinhoMobileMS")?.classList.add("ativo");
};
function abrirCarrinhoPCMS(){
  const carrinho = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(!carrinho){
    alert("Não foi possível abrir o carrinho. Atualize a página e tente novamente.");
    return false;
  }

  carrinho.classList.add("ativo");
  carrinho.style.display = "block";
  carrinho.style.right = "0";

  if(fundo){
    fundo.classList.add("ativo");
    fundo.style.display = "block";
  }

  atualizarCarrinho();

  return false;
}
/* ===== COMPRAR AGORA DEFINITIVO ===== */

window.comprarAgoraDetalhe = function(){

  const detalhe = document.getElementById("produtoDetalhe");

  const tamanho = detalhe?.querySelector(
    ".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo"
  )?.innerText.trim();

  if(!tamanho){
    alert("Selecione um tamanho para continuar com a compra.");
    return false;
  }

  const produto = {
    nome: document.getElementById("detalheNome")?.innerText || "Produto MS",
    preco: 100,
    imagem: document.getElementById("detalheImg")?.src || "",
    tamanho: tamanho,
    quantidade: 1
  };

  let carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];

  carrinhoAtual.push(produto);

  localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));

  window.carrinho = carrinhoAtual;
  carrinho = carrinhoAtual;

  if(typeof atualizarCarrinho === "function") atualizarCarrinho();
  if(typeof atualizarContador === "function") atualizarContador();
  if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();

  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(carrinhoPC){
    carrinhoPC.classList.add("ativo");
    carrinhoPC.style.display = "block";
    carrinhoPC.style.right = "0";
  }

  if(fundo){
    fundo.classList.add("ativo");
    fundo.style.display = "block";
  }

  return false;
};
/* ===== COMPRAR AGORA FINAL MS ===== */

document.addEventListener("click", function(e){
  const botao = e.target.closest(".btn-comprar-agora-DESATIVADO-MS");

  if(!botao) return;

  e.preventDefault();
  e.stopPropagation();

  const detalhe = document.getElementById("produtoDetalhe");

  const tamanho = detalhe?.querySelector(
    ".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo"
  )?.innerText.trim();

  if(!tamanho){
    alert("Selecione um tamanho para continuar com a compra.");
    return;
  }

  const produto = {
    nome: document.getElementById("detalheNome")?.innerText || "Produto MS",
    preco: 100,
    imagem: document.getElementById("detalheImg")?.src || "",
    tamanho: tamanho,
    quantidade: 1
  };

  let carrinhoAtual = JSON.parse(localStorage.getItem("carrinho")) || [];

  carrinhoAtual.push(produto);

  localStorage.setItem("carrinho", JSON.stringify(carrinhoAtual));

  carrinho = carrinhoAtual;

  if(typeof atualizarCarrinho === "function"){
    atualizarCarrinho();
  }

  if(typeof atualizarContador === "function"){
    atualizarContador();
  }

  if(typeof atualizarBadgeCarrinho === "function"){
    atualizarBadgeCarrinho();
  }

  const carrinhoPC = document.getElementById("carrinho");
  const fundo = document.getElementById("fundoCarrinho");

  if(carrinhoPC){
    carrinhoPC.classList.add("ativo");
    carrinhoPC.style.display = "block";
    carrinhoPC.style.right = "0";
  }

  if(fundo){
    fundo.classList.add("ativo");
    fundo.style.display = "block";
    fundo.classList.add("ativo");
  }

}, true);
function abrirRecomendadoMS(nome, preco, img, fotos, cor = "unica"){
  produtoDetalheAtual = {
    nome: nome,
    preco: pegarPrecoNumero(preco) || 100,
    precoAntigo: null,
    img: img,
    cor: cor
  };

  fotosDetalhe = String(fotos || img)
    .split(",")
    .map(foto => foto.trim())
    .filter(Boolean);

  fotoAtualDetalhe = 0;

  const detalheImg = document.getElementById("detalheImg");
  const detalheNome = document.getElementById("detalheNome");
  const detalhePreco = document.getElementById("detalhePreco");
  const breadcrumbNome = document.getElementById("breadcrumbNome");
  const detalhe = document.getElementById("produtoDetalhe");
  const miniaturas = document.getElementById("miniaturasDetalhe");
  const precoAntigo = document.querySelector("#produtoDetalhe .preco-antigo");

  if(detalheImg) detalheImg.src = fotosDetalhe[0] || img;
  if(detalheNome) detalheNome.innerText = nome;
  if(detalhePreco) detalhePreco.innerText = dinheiro(pegarPrecoNumero(preco));
  if(breadcrumbNome) breadcrumbNome.innerText = nome;
  if(precoAntigo) precoAntigo.innerText = "";

  montarCorUnicaRecomendado(cor);

  if(miniaturas){
    miniaturas.innerHTML = "";

    fotosDetalhe.forEach((foto, index) => {
      const thumb = document.createElement("img");
      thumb.src = foto;

      if(index === 0) thumb.classList.add("ativa");

      thumb.onclick = function(event){
        event.stopPropagation();

        fotoAtualDetalhe = index;
        if(detalheImg) detalheImg.src = foto;

        miniaturas.querySelectorAll("img").forEach(img => img.classList.remove("ativa"));
        thumb.classList.add("ativa");
      };

      miniaturas.appendChild(thumb);
    });
  }

  if(detalhe){
    detalhe.dataset.tamanho = "";
    detalhe.dataset.cor = cor;

    detalhe.querySelectorAll(".tamanho-btn").forEach(btn => btn.classList.remove("ativo"));

    detalhe.classList.add("ativo");
    detalhe.style.display = "block";
    detalhe.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function montarCorUnicaRecomendado(cor){
  const box = document.getElementById("opcoesCoresDetalhe");
  const texto = document.getElementById("corSelecionadaDetalhe");

  const cores = {
    preto: { nome: "Preto", hex: "#000000" },
    branco: { nome: "Branco", hex: "#ffffff" },
    bege: { nome: "Bege", hex: "#d7bf98" },
    rosa: { nome: "Rosa", hex: "#d87ba7" },
    vinho: { nome: "Vinho", hex: "#7b1e1e" },
    cinza: { nome: "Cinza", hex: "#777777" },
    azul: { nome: "Azul", hex: "#071b3a" },
    unica: { nome: "Única", hex: "#d7bf98" }
  };

  const corInfo = cores[cor] || cores.unica;

  if(box){
    box.innerHTML = `
      <button class="cor ativa" type="button" style="background:${corInfo.hex}"></button>
    `;
  }

  if(texto){
    texto.innerText = "Cor selecionada: " + corInfo.nome;
  }
}

/* ===== ABRIR PRODUTO PELO CARD - DEFINITIVO ===== */

document.addEventListener("click", function(e){
  const card = e.target.closest(".card-produto");

  if(!card) return;

  if(
    e.target.closest("button") ||
    e.target.closest("a") ||
    e.target.closest(".tamanhos") ||
    e.target.closest(".btn-favorito")
  ){
    return;
  }

  abrirProdutoDetalheCard(card);
});

function alterarQtdDetalhe(valor){

    quantidadeDetalhe += valor;

    if(quantidadeDetalhe < 1){
        quantidadeDetalhe = 1;
    }

    const span = document.getElementById("qtdProdutoDetalhe");

    if(span){
        span.innerText = quantidadeDetalhe;
    }
}
window.abrirCarrinhoResponsivoMS = function(){
  if(window.innerWidth <= 768){
    if(typeof abrirCarrinhoMobileMS === "function") return abrirCarrinhoMobileMS();
    if(typeof abrirCarrinhoMS === "function") return abrirCarrinhoMS();
    if(typeof abrirCarrinhoMobile === "function") return abrirCarrinhoMobile();
    if(typeof abrirCarrinho === "function") return abrirCarrinho();
  }
  if(typeof abrirCarrinhoPCMS === "function") return abrirCarrinhoPCMS();
  if(typeof abrirCarrinho === "function") return abrirCarrinho();
};

/* =========================================================
   FIX DEFINITIVO MS - QUANTIDADE DO COMPRAR AGORA
   Mantém a quantidade escolhida no detalhe e impede funções antigas de forçar 1.
   ========================================================= */
(function(){
  function msNumeroPreco(valor){
    if(typeof valor === "number") return valor;
    return Number(String(valor || "100")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .replace(/[^0-9.]/g, "")) || 100;
  }

  function msQtdDetalheFinal(){
    const tela = document.getElementById("qtdProdutoDetalhe")?.innerText;
    const qtd = Number(tela || window.quantidadeDetalhe || quantidadeDetalhe || 1);
    return qtd > 0 ? qtd : 1;
  }

  window.alterarQtdDetalhe = function(valor){
    window.quantidadeDetalhe = Number(window.quantidadeDetalhe || quantidadeDetalhe || 1) + Number(valor || 0);
    if(window.quantidadeDetalhe < 1) window.quantidadeDetalhe = 1;
    quantidadeDetalhe = window.quantidadeDetalhe;

    const span = document.getElementById("qtdProdutoDetalhe");
    if(span) span.innerText = window.quantidadeDetalhe;
  };

  function msItemDetalheFinal(){
    const detalhe = document.getElementById("produtoDetalhe");
    const tamanho = detalhe?.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo")?.innerText.trim();

    if(!tamanho){
      alert("Selecione um tamanho para continuar com a compra.");
      return null;
    }

    const nome = produtoDetalheAtual?.nome || document.getElementById("detalheNome")?.innerText || "Produto MS";
    const preco = msNumeroPreco(produtoDetalheAtual?.preco || document.getElementById("detalhePreco")?.innerText || 100);
    const imagem = produtoDetalheAtual?.img || document.getElementById("detalheImg")?.src || "";

    return {
      nome,
      preco,
      imagem,
      tamanho,
      quantidade: msQtdDetalheFinal()
    };
  }

  function msSalvarItemExatoDoDetalhe(){
    const item = msItemDetalheFinal();
    if(!item) return false;

    let lista = [];
    try{
      lista = JSON.parse(localStorage.getItem("carrinho")) || [];
    }catch(e){
      lista = [];
    }

    // Remove versões antigas do mesmo produto/tamanho que funções antigas adicionaram com qtd 1.
    lista = lista.filter(produto => !(produto.nome === item.nome && produto.tamanho === item.tamanho));
    lista.push(item);

    localStorage.setItem("carrinho", JSON.stringify(lista));
    window.carrinho = lista;
    if(typeof carrinho !== "undefined") carrinho = lista;

    if(typeof atualizarCarrinho === "function") atualizarCarrinho();
    if(typeof atualizarContador === "function") atualizarContador();
    if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
    if(typeof renderCarrinhoMobileMS === "function") renderCarrinhoMobileMS();

    return true;
  }

  window.comprarAgoraDetalhe = function(){
    if(!msSalvarItemExatoDoDetalhe()) return false;

    setTimeout(function(){
      if(typeof abrirCarrinhoPCMS === "function") abrirCarrinhoPCMS();
      else if(typeof abrirCarrinhoMS === "function") abrirCarrinhoMS();
      else if(typeof abrirCarrinho === "function") abrirCarrinho();
    }, 50);

    return false;
  };

  document.addEventListener("click", function(e){
    const botao = e.target.closest(".btn-comprar-agora-DESATIVADO-MS");
    if(!botao) return;

    e.preventDefault();
    e.stopPropagation();

    // Espera as funções antigas terminarem e corrige o carrinho para a quantidade certa.
    setTimeout(function(){
      msSalvarItemExatoDoDetalhe();

      if(typeof abrirCarrinhoPCMS === "function") abrirCarrinhoPCMS();
      else if(typeof abrirCarrinhoMS === "function") abrirCarrinhoMS();
      else if(typeof abrirCarrinho === "function") abrirCarrinho();
    }, 250);
  }, true);
})();
function abrirZoom(){

  const img = document.getElementById("detalheImg");
  const modal = document.getElementById("zoomModal");
  const zoomImg = document.getElementById("zoomImg");

  if(!img || !modal || !zoomImg) return;

  zoomImg.src = img.src;
  modal.classList.add("ativo");
}

function fecharZoom(){
  document.getElementById("zoomModal").classList.remove("ativo");
}
window.quantidadeDetalhe = 1;

function aumentarQuantidadeDetalhe() {
  window.quantidadeDetalhe++;

  const el = document.getElementById("quantidadeDetalhe");
  if (el) el.innerText = window.quantidadeDetalhe;
}

function diminuirQuantidadeDetalhe() {
  if (window.quantidadeDetalhe > 1) {
    window.quantidadeDetalhe--;

    const el = document.getElementById("quantidadeDetalhe");
    if (el) el.innerText = window.quantidadeDetalhe;
  }
}

function comprarAgoraDetalhe() {
  adicionarProdutoDetalhe();

  setTimeout(() => {
    abrirCarrinhoResponsivoMS();
  }, 200);
}
window.quantidadeDetalhe = 1;

function atualizarNumeroDetalheMS() {
  const el1 = document.getElementById("qtdProdutoDetalhe");
  const el2 = document.getElementById("quantidadeDetalhe");

  if (el1) el1.innerText = window.quantidadeDetalhe;
  if (el2) el2.innerText = window.quantidadeDetalhe;
}

function alterarQtdDetalhe(valor) {
  window.quantidadeDetalhe = Number(window.quantidadeDetalhe || 1);

  window.quantidadeDetalhe += Number(valor);

  if (window.quantidadeDetalhe < 1) {
    window.quantidadeDetalhe = 1;
  }

  atualizarNumeroDetalheMS();
}

function aumentarQuantidadeDetalhe() {
  alterarQtdDetalhe(1);
}

function diminuirQuantidadeDetalhe() {
  alterarQtdDetalhe(-1);
}

function adicionarProdutoDetalhe() {
  const detalhe = document.getElementById("produtoDetalhe");

  if (!produtoDetalheAtual) {
    alert("Este produto não está disponível no momento. Escolha outra opção.");
    return;
  }

  const tamanho =
    detalhe.querySelector(".tamanhos button.ativo")?.innerText ||
    detalhe.querySelector(".tamanho-btn.ativo")?.innerText;

  if (!tamanho) {
    alertaMS("Escolha um tamanho antes de continuar.");
    return;
  }

  carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const itemExistente = carrinho.find(item =>
    item.nome === produtoDetalheAtual.nome &&
    item.tamanho === tamanho
  );

  if (itemExistente) {
    itemExistente.quantidade += Number(window.quantidadeDetalhe || 1);
  } else {
    carrinho.push({
      nome: produtoDetalheAtual.nome,
      preco: pegarPrecoNumero(produtoDetalheAtual.preco),
      imagem: produtoDetalheAtual.img,
      tamanho: tamanho,
      quantidade: Number(window.quantidadeDetalhe || 1)
    });
  }

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  atualizarBadgeCarrinho();
  atualizarTudo();

  if (typeof mostrarToastMS === "function") {
    mostrarToastMS("✅ Produto adicionado<br><strong>Seu item foi enviado ao carrinho.</strong>");
  } else if (typeof mostrarToastCarrinhoMS === "function") {
    mostrarToastCarrinhoMS();
  }
}

function comprarAgoraDetalhe() {
  adicionarProdutoDetalhe();

  setTimeout(() => {
    abrirCarrinhoResponsivoMS();
  }, 300);
}

function alertaMS(texto){

  document.getElementById("msAlertaTexto").innerText = texto;

  document.getElementById("msAlerta")
    .classList.add("ativo");
}


function fecharAlertaMS(){

  document.getElementById("msAlerta")
    .classList.remove("ativo");

}
function mostrarToastCarrinhoMS(){

  const toast =
    document.getElementById("toastCarrinhoMS");

  if(!toast) return;

  toast.classList.add("ativo");

  setTimeout(() => {
    toast.classList.remove("ativo");
  }, 2500);

}
function toggleAbaProduto(elemento){

  elemento.classList.toggle("ativo");

}
function toggleInfo(botao){

  const conteudo = botao.nextElementSibling;

  if (!conteudo) return;

  conteudo.classList.toggle("ativo");

}
window.fecharCarrinhoMobileMS = function() {
  const modal = document.getElementById("carrinhoMobileMS");

  if(modal){
    modal.style.display = "none";
    modal.classList.remove("ativo");
  }
}
const coresHex = {
    preto: "#000000",
    vinho: "#7b1e1e",
    bege: "#d7bf98",
    cinza: "#777777",
    rosa: "#d87ba7",
    azul: "#071b3a",
    branco: "#ffffff"
};

function montarCoresProduto(card) {
    const box = document.getElementById("opcoesCoresDetalhe");
    if (!box) return;

    const cores = (card.dataset.cores || "").split(",").map(c => c.trim()).filter(Boolean);

    box.innerHTML = "";

    cores.forEach((cor, index) => {
        const btn = document.createElement("button");
        btn.className = index === 0 ? "cor ativa" : "cor";
        btn.dataset.cor = cor;
        btn.style.background = coresHex[cor] || "#ccc";

        btn.onclick = function () {
            trocarCorDetalhe(card, cor, btn);
        };

        box.appendChild(btn);
    });
}

function trocarCorDetalhe(card, cor, botao) {
    const chave = "fotos" + cor.charAt(0).toUpperCase() + cor.slice(1);
    const fotos = card.dataset[chave];

    if (!fotos) return;

    fotosDetalhe = fotos.split(",").map(f => f.trim()).filter(Boolean);
    fotoAtualDetalhe = 0;

    const detalheImg = document.getElementById("detalheImg");
    const miniaturas = document.getElementById("miniaturasDetalhe");

    if (detalheImg) detalheImg.src = fotosDetalhe[0];

    if (miniaturas) {
        miniaturas.innerHTML = "";

        fotosDetalhe.forEach((foto, index) => {
            const img = document.createElement("img");
            img.src = foto;

            if (index === 0) img.classList.add("ativa");

            img.onclick = function () {
                fotoAtualDetalhe = index;
                detalheImg.src = foto;

                document
                    .querySelectorAll(".miniaturas-detalhe img")
                    .forEach(el => el.classList.remove("ativa"));

                img.classList.add("ativa");
            };

            miniaturas.appendChild(img);
        });
    }

    document.querySelectorAll(".cor").forEach(c => c.classList.remove("ativa"));
    botao.classList.add("ativa");
}

/* =========================================================
   MS MATIAS STYLE - CORES NO DETALHE + CARRINHO CORRETO
   Corrige: escolher cor troca fotos e adiciona a cor escolhida no carrinho.
   ========================================================= */
(function(){
  const MAPA_CORES_MS = {
    preto:   { label:'Preto', hex:'#000000' },
    preta:   { label:'Preta', hex:'#000000' },
    branco:  { label:'Branco', hex:'#ffffff' },
    branca:  { label:'Branca', hex:'#ffffff' },
    bege:    { label:'Bege', hex:'#d7bf98' },
    cinza:   { label:'Cinza', hex:'#777777' },
    rosa:    { label:'Rosa', hex:'#d87ba7' },
    vinho:   { label:'Vinho', hex:'#6e1d25' },
    bordo:   { label:'Bordô', hex:'#5b1420' },
    bordô:   { label:'Bordô', hex:'#5b1420' },
    vermelho:{ label:'Vermelho', hex:'#8a1d1d' },
    vermelha:{ label:'Vermelha', hex:'#8a1d1d' },
    azul:    { label:'Azul', hex:'#071b3a' },
    marinho: { label:'Azul Marinho', hex:'#071b3a' },
    offwhite:{ label:'Off White', hex:'#eee8dc' },
    marrom:  { label:'Marrom', hex:'#5a3825' }
  };

  const PALAVRAS_COR_MS = Object.keys(MAPA_CORES_MS).sort((a,b)=>b.length-a.length);

  window.msProdutoCardAtual = window.msProdutoCardAtual || null;
  window.msProdutoVariacaoAtual = window.msProdutoVariacaoAtual || null;
  window.msCorSelecionada = window.msCorSelecionada || '';
  window.msImagemSelecionada = window.msImagemSelecionada || '';

  function normalizarMS(txt){
    return String(txt || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim();
  }

  function numeroPrecoMS(valor){
    if(typeof valor === 'number') return valor;

    let preco = String(valor || '0')
      .replace('R$', '')
      .replace(/\s/g, '')
      .trim();

    // Aceita tanto data-preco="89.90" quanto texto "R$ 89,90".
    if(preco.includes(',')){
      preco = preco.replace(/\./g, '').replace(',', '.');
    } else {
      preco = preco.replace(/[^0-9.]/g, '');
    }

    return parseFloat(preco) || 0;
  }

  function dinheiroMS(valor){
    const n = numeroPrecoMS(valor);
    return n.toLocaleString('pt-BR',{style:'currency',currency:'BRL'});
  }

  function corDoNomeMS(nome){
    const n = ' ' + normalizarMS(nome) + ' ';
    for(const cor of PALAVRAS_COR_MS){
      const c = normalizarMS(cor);
      if(new RegExp('(^|\\s)' + c + '(\\s|$)').test(n)) return cor;
    }
    return '';
  }

  function baseDoNomeMS(nome){
    let base = ' ' + normalizarMS(nome).replace(/\bmoleto\b/g,'moletom').replace(/\bms\b/g,'') + ' ';
    PALAVRAS_COR_MS.forEach(cor => {
      base = base.replace(new RegExp('\\b' + normalizarMS(cor) + '\\b','g'), ' ');
    });
    return base.replace(/\s+/g,' ').trim();
  }

  function fotosDoCardMS(card){
    return String(card?.dataset?.fotos || card?.dataset?.img || '')
      .split(',')
      .map(f => f.trim())
      .filter(Boolean);
  }

  function cardsDoMesmoProdutoMS(cardAtual){
    const base = baseDoNomeMS(cardAtual?.dataset?.nome || '');
    const cards = Array.from(document.querySelectorAll('.card-produto'));
    const iguais = cards.filter(c => baseDoNomeMS(c.dataset.nome || '') === base);
    return iguais.length ? iguais : (cardAtual ? [cardAtual] : []);
  }

  function variacoesDoCardMS(cardAtual){
    const variacoes = [];
    const usados = new Set();

    // Primeiro tenta pegar produtos irmãos pelo nome: Moletom Preto, Moletom Vinho, Moletom Bege...
    cardsDoMesmoProdutoMS(cardAtual).forEach(card => {
      const cor = card.dataset.cor || corDoNomeMS(card.dataset.nome || '') || 'unica';
      if(usados.has(cor)) return;
      usados.add(cor);
      variacoes.push({
        cor,
        label: MAPA_CORES_MS[cor]?.label || (cor === 'unica' ? 'Única' : cor),
        hex: MAPA_CORES_MS[cor]?.hex || '#cccccc',
        card,
        fotos: fotosDoCardMS(card)
      });
    });

    // Também aceita data-cores no próprio card, caso você use no futuro.
    const coresExtras = String(cardAtual?.dataset?.cores || '')
      .split(',')
      .map(c => c.trim())
      .filter(Boolean);

    coresExtras.forEach(cor => {
      if(usados.has(cor)) return;

      // Se existir um card real dessa cor, usa ele para não deixar o nome errado
      // Ex.: clicar na cor Bege não pode manter o título Moletom Vinho MS.
      const cardDaCor = cardsDoMesmoProdutoMS(cardAtual).find(c => {
        const corCard = c.dataset.cor || corDoNomeMS(c.dataset.nome || '');
        return corCard === cor;
      });

      const chave = 'fotos' + cor.charAt(0).toUpperCase() + cor.slice(1);
      const fotos = cardDaCor
        ? fotosDoCardMS(cardDaCor)
        : String(cardAtual?.dataset?.[chave] || '').split(',').map(f=>f.trim()).filter(Boolean);

      if(!fotos.length) return;
      usados.add(cor);
      variacoes.push({
        cor,
        label: MAPA_CORES_MS[cor]?.label || cor,
        hex: MAPA_CORES_MS[cor]?.hex || '#cccccc',
        card: cardDaCor || cardAtual,
        fotos
      });
    });

    if(!variacoes.length && cardAtual){
      const cor = corDoNomeMS(cardAtual.dataset.nome || '') || 'unica';
      variacoes.push({
        cor,
        label: MAPA_CORES_MS[cor]?.label || 'Única',
        hex: MAPA_CORES_MS[cor]?.hex || '#cccccc',
        card: cardAtual,
        fotos: fotosDoCardMS(cardAtual)
      });
    }

    return variacoes;
  }

  function montarMiniaturasMS(fotos){
    const detalheImg = document.getElementById('detalheImg');
    const miniaturas = document.getElementById('miniaturasDetalhe');

    if(detalheImg && fotos[0]) detalheImg.src = fotos[0];
    window.msImagemSelecionada = fotos[0] || detalheImg?.src || '';

    if(!miniaturas) return;
    miniaturas.innerHTML = '';

    fotos.forEach((foto, index) => {
      const img = document.createElement('img');
      img.src = foto;
      if(index === 0) img.classList.add('ativa');

      img.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        if(detalheImg) detalheImg.src = foto;
        window.msImagemSelecionada = foto;
        miniaturas.querySelectorAll('img').forEach(el => el.classList.remove('ativa'));
        img.classList.add('ativa');
      };

      miniaturas.appendChild(img);
    });
  }

  function selecionarCorMS(variacao, botao){
    if(!variacao) return;

    window.msProdutoVariacaoAtual = variacao;
    window.msProdutoCardAtual = variacao.card || window.msProdutoCardAtual;
    window.msCorSelecionada = variacao.label || '';

    const card = variacao.card;
    const nome = card?.dataset?.nome || document.getElementById('detalheNome')?.innerText || 'Produto MS';
    const preco = numeroPrecoMS(card?.dataset?.preco || document.getElementById('detalhePreco')?.innerText || 0);

    const detalheNome = document.getElementById('detalheNome');
    const detalhePreco = document.getElementById('detalhePreco');
    const breadcrumb = document.getElementById('breadcrumbNome');

    if(detalheNome) detalheNome.innerText = nome;
    if(breadcrumb) breadcrumb.innerText = nome;
    if(detalhePreco && preco) detalhePreco.innerText = dinheiroMS(preco);

    if(typeof produtoDetalheAtual === 'object' && produtoDetalheAtual){
      produtoDetalheAtual.nome = nome;
      produtoDetalheAtual.preco = preco || produtoDetalheAtual.preco;
      produtoDetalheAtual.img = variacao.fotos?.[0] || card?.dataset?.img || produtoDetalheAtual.img;
      produtoDetalheAtual.cor = variacao.label || '';
      produtoDetalheAtual.card = card || produtoDetalheAtual.card;
    }

    montarMiniaturasMS(variacao.fotos || []);

    const box = document.getElementById('opcoesCoresDetalhe');
    if(box) box.querySelectorAll('.cor-ms-btn, .cor').forEach(b => b.classList.remove('ativa'));
    if(botao) botao.classList.add('ativa');

    let texto = document.getElementById('corSelecionadaMS');
    const bloco = document.getElementById('coresProdutoDetalhe');
    if(bloco && !texto){
      texto = document.createElement('div');
      texto.id = 'corSelecionadaMS';
      texto.className = 'cor-selecionada-ms';
      bloco.appendChild(texto);
    }
    if(texto) texto.innerText = 'Cor selecionada: ' + (variacao.label || 'Única');
  }

  window.montarCoresProduto = function(cardAtual){
    const box = document.getElementById('opcoesCoresDetalhe');
    const bloco = document.getElementById('coresProdutoDetalhe');
    if(!box || !bloco || !cardAtual) return;

    const variacoes = variacoesDoCardMS(cardAtual);
    box.innerHTML = '';

    const corInicial = corDoNomeMS(cardAtual.dataset.nome || '') || cardAtual.dataset.cor || variacoes[0]?.cor;
    let indiceInicial = variacoes.findIndex(v => v.cor === corInicial);
    if(indiceInicial < 0) indiceInicial = 0;

    variacoes.forEach((v, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'cor-ms-btn' + (index === indiceInicial ? ' ativa' : '');
      btn.dataset.cor = v.cor;
      btn.title = v.label;
      btn.setAttribute('aria-label', 'Selecionar cor ' + v.label);
      btn.style.background = v.hex;

      if(v.hex === '#ffffff') btn.classList.add('cor-branca-ms');

      btn.onclick = function(ev){
        ev.preventDefault();
        ev.stopPropagation();
        selecionarCorMS(v, btn);
      };

      box.appendChild(btn);
    });

    bloco.style.display = variacoes.length ? 'block' : 'none';
    selecionarCorMS(variacoes[indiceInicial] || variacoes[0], box.children[indiceInicial] || box.children[0]);
  };

  function tamanhoSelecionadoMS(){
    const detalhe = document.getElementById('produtoDetalhe');
    const ativo = detalhe?.querySelector('.tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo, .tamanhos-detalhe .selecionado');
    return detalhe?.dataset?.tamanho || ativo?.innerText?.trim() || window.tamanhoSelecionadoDetalhe || '';
  }

  function quantidadeDetalheMS(){
    const qtdTela = Number(document.getElementById('qtdProdutoDetalhe')?.innerText || document.getElementById('quantidadeDetalhe')?.innerText || window.quantidadeDetalhe || quantidadeDetalhe || 1);
    return qtdTela > 0 ? qtdTela : 1;
  }

  function produtoEscolhidoMS(){
    const variacao = window.msProdutoVariacaoAtual;
    const card = variacao?.card || window.msProdutoCardAtual;
    if(!card) return null;

    const cor = variacao?.label || window.msCorSelecionada || MAPA_CORES_MS[corDoNomeMS(card.dataset.nome || '')]?.label || '';
    const imagem = window.msImagemSelecionada || variacao?.fotos?.[0] || fotosDoCardMS(card)[0] || card.dataset.img || '';

    return {
      nome: card.dataset.nome || document.getElementById('detalheNome')?.innerText || 'Produto MS',
      preco: numeroPrecoMS(card.dataset.preco || document.getElementById('detalhePreco')?.innerText || 100),
      imagem: imagem,
      img: imagem,
      cor: cor,
      tamanho: tamanhoSelecionadoMS(),
      quantidade: quantidadeDetalheMS()
    };
  }

  function salvarItemDetalheMSCarrinho(){
    const item = produtoEscolhidoMS();
    if(!item){
      alert('Este produto não está disponível no momento. Escolha outra opção.');
      return false;
    }

    if(!item.tamanho){
      if(typeof alertaMS === 'function') alertaMS('Escolha um tamanho antes de continuar.');
      else alert('Selecione um tamanho para adicionar este produto ao carrinho.');
      return false;
    }

    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem('carrinho')) || []; }catch(e){ lista = []; }

    const existente = lista.find(produto =>
      produto.nome === item.nome &&
      produto.tamanho === item.tamanho &&
      (produto.cor || '') === (item.cor || '')
    );

    if(existente){
      existente.quantidade = Number(existente.quantidade || 1) + Number(item.quantidade || 1);
      existente.imagem = item.imagem;
      existente.img = item.img;
      existente.cor = item.cor;
    }else{
      lista.push(item);
    }

    localStorage.setItem('carrinho', JSON.stringify(lista));
    window.carrinho = lista;
    try{ carrinho = lista; }catch(e){}

    if(typeof atualizarCarrinho === 'function') atualizarCarrinho();
    if(typeof atualizarTudo === 'function') atualizarTudo();
    if(typeof atualizarBadgeCarrinho === 'function') atualizarBadgeCarrinho();
    if(typeof atualizarContador === 'function') atualizarContador();
    if(typeof renderCarrinhoMobileMS === 'function') renderCarrinhoMobileMS();
    setTimeout(mostrarCoresNoCarrinhoMS, 80);

    const toast = document.getElementById('toastCarrinhoMS') || document.getElementById('msToast') || document.getElementById('toastMS');
    if(toast){
      if(toast.tagName !== 'DIV' || !toast.querySelector('img')) toast.innerHTML = '🛒 Produto adicionado ao carrinho';
      toast.classList.add('ativo');
      toast.style.display = 'block';
      setTimeout(() => { toast.classList.remove('ativo'); toast.style.display = ''; }, 1800);
    }

    return true;
  }

  window.adicionarProdutoDetalhe = function(){
    return salvarItemDetalheMSCarrinho();
  };

  window.comprarAgoraDetalhe = function(){
    if(!salvarItemDetalheMSCarrinho()) return false;
    setTimeout(function(){
      if(window.innerWidth <= 768){
        if(typeof window.abrirCarrinhoMobileMS === 'function') window.abrirCarrinhoMobileMS();
        else if(typeof window.abrirCarrinhoMS === 'function') window.abrirCarrinhoMS();
        else if(typeof window.abrirCarrinhoMobile === 'function') window.abrirCarrinhoMobile();
        else if(typeof window.abrirCarrinho === 'function') window.abrirCarrinho();
        else window.location.href = 'carrinho.html';
      }else{
        if(typeof window.abrirCarrinhoPCMS === 'function') window.abrirCarrinhoPCMS();
        else if(typeof window.abrirCarrinho === 'function') window.abrirCarrinho();
      }
      setTimeout(mostrarCoresNoCarrinhoMS, 100);
    }, 80);
    return false;
  };

  const abrirProdutoDetalheOriginalMS = window.abrirProdutoDetalheCard;
  window.abrirProdutoDetalheCard = function(card){
    window.msProdutoCardAtual = card;
    window.msProdutoVariacaoAtual = null;
    window.msCorSelecionada = '';
    window.msImagemSelecionada = '';

    if(typeof abrirProdutoDetalheOriginalMS === 'function') abrirProdutoDetalheOriginalMS.call(this, card);

    setTimeout(function(){
      window.montarCoresProduto(card);
    }, 40);
  };

  const selecionarTamanhoOriginalMS = window.selecionarTamanho;
  window.selecionarTamanho = function(botao, tamanho){
    if(typeof selecionarTamanhoOriginalMS === 'function') selecionarTamanhoOriginalMS.call(this, botao, tamanho);

    const detalhe = document.getElementById('produtoDetalhe');
    if(detalhe) detalhe.dataset.tamanho = tamanho;

    const area = botao?.closest?.('.tamanhos-detalhe, .detalhe-tamanhos, .tamanhos') || document;
    area.querySelectorAll('.tamanho-btn, button').forEach(b => b.classList.remove('ativo','selecionado'));
    if(botao) botao.classList.add('ativo');

    window.tamanhoSelecionado = tamanho;
    window.tamanhoSelecionadoDetalhe = tamanho;
  };

  function mostrarCoresNoCarrinhoMS(){
    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem('carrinho')) || []; }catch(e){ lista = []; }

    const seletores = [
      '#listaCarrinho .item-carrinho',
      '#itensCarrinho .item-carrinho',
      '#listaCarrinhoMobileMS .cmms-item',
      '.carrinho-itens .item-carrinho',
      '.item-carrinho'
    ];

    seletores.forEach(sel => {
      document.querySelectorAll(sel).forEach((itemEl, i) => {
        const item = lista[i];
        if(!item || !item.cor || itemEl.querySelector('.ms-cor-carrinho')) return;

        const alvo = itemEl.querySelector('.cmms-info') || itemEl.querySelector('.info-item') || itemEl.querySelector('.item-info') || itemEl;
        const p = document.createElement('p');
        p.className = 'ms-cor-carrinho';
        p.innerText = 'Cor: ' + item.cor;

        const tamanho = Array.from(alvo.querySelectorAll('p, span')).find(el => /tamanho/i.test(el.innerText || ''));
        if(tamanho) tamanho.insertAdjacentElement('afterend', p);
        else alvo.appendChild(p);
      });
    });
  }

  ['atualizarCarrinho','atualizarTudo','renderCarrinhoMobileMS','abrirCarrinhoPCMS','abrirCarrinhoMobileMS','abrirCarrinho'].forEach(nome => {
    const original = window[nome];
    if(typeof original !== 'function') return;
    window[nome] = function(){
      const retorno = original.apply(this, arguments);
      setTimeout(mostrarCoresNoCarrinhoMS, 80);
      return retorno;
    };
  });

  document.addEventListener('click', function(e){
    const card = e.target.closest('.card-produto');
    if(!card) return;
    if(e.target.closest('button') || e.target.closest('a') || e.target.closest('.tamanhos') || e.target.closest('.btn-favorito')) return;

    setTimeout(function(){
      window.msProdutoCardAtual = card;
      window.montarCoresProduto(card);
    }, 120);
  }, true);

  document.addEventListener('click', function(e){
    if(e.target.closest('.btn-comprar-agora')){
      e.preventDefault();
      e.stopPropagation();
      window.comprarAgoraDetalhe();
    }
  }, true);

  document.addEventListener('DOMContentLoaded', function(){
    setTimeout(mostrarCoresNoCarrinhoMS, 200);
  });
})();


/* =====================================================
   MS MATIAS STYLE - SLIDER DO BANNER INICIAL
===================================================== */
let slideHeroAtualMS = 0;
let timerHeroMS = null;

function atualizarHeroSliderMS(){
  const slides = document.querySelectorAll('.hero-slider-ms .slide-ms');
  const bolinhas = document.querySelectorAll('.bolinha-hero-ms');
  if(!slides.length) return;

  slides.forEach((slide, index) => {
    slide.classList.toggle('ativo', index === slideHeroAtualMS);
  });

  bolinhas.forEach((bolinha, index) => {
    bolinha.classList.toggle('ativa', index === slideHeroAtualMS);
  });
}

function irSlideHeroMS(index){
  const slides = document.querySelectorAll('.hero-slider-ms .slide-ms');
  if(!slides.length) return;
  slideHeroAtualMS = (index + slides.length) % slides.length;
  atualizarHeroSliderMS();
  reiniciarTimerHeroMS();
}

function mudarSlideHeroMS(direcao){
  const slides = document.querySelectorAll('.hero-slider-ms .slide-ms');
  if(!slides.length) return;
  slideHeroAtualMS = (slideHeroAtualMS + direcao + slides.length) % slides.length;
  atualizarHeroSliderMS();
  reiniciarTimerHeroMS();
}

function iniciarTimerHeroMS(){
  if(timerHeroMS) clearInterval(timerHeroMS);
  timerHeroMS = setInterval(() => {
    const slides = document.querySelectorAll('.hero-slider-ms .slide-ms');
    if(!slides.length) return;
    slideHeroAtualMS = (slideHeroAtualMS + 1) % slides.length;
    atualizarHeroSliderMS();
  }, 2000);
}

function reiniciarTimerHeroMS(){
  iniciarTimerHeroMS();
}

document.addEventListener('DOMContentLoaded', () => {
  atualizarHeroSliderMS();
  iniciarTimerHeroMS();

  const hero = document.querySelector('.hero-slider-ms');
  if(hero){
    hero.addEventListener('mouseenter', () => {
      if(timerHeroMS) clearInterval(timerHeroMS);
    });
    hero.addEventListener('mouseleave', iniciarTimerHeroMS);
  }
});


/* =====================================================
   MS FIX FINAL - CARDS + COMPRAR AGORA RESPONSIVO
   Mantém os cards abrindo e evita carrinho PC no mobile.
===================================================== */
(function(){
  function abrirCarrinhoCertoMS(){
    if(window.innerWidth <= 768){
      if(typeof window.abrirCarrinhoMobileMS === 'function') return window.abrirCarrinhoMobileMS();
      if(typeof window.abrirCarrinhoMS === 'function') return window.abrirCarrinhoMS();
      if(typeof window.abrirCarrinhoMobile === 'function') return window.abrirCarrinhoMobile();
      if(typeof window.abrirCarrinho === 'function') return window.abrirCarrinho();
      window.location.href = 'carrinho.html';
      return false;
    }

    if(typeof window.abrirCarrinhoPCMS === 'function') return window.abrirCarrinhoPCMS();
    if(typeof window.abrirCarrinho === 'function') return window.abrirCarrinho();
    return false;
  }

  window.abrirCarrinhoResponsivoMS = abrirCarrinhoCertoMS;

  // Garante que clique no card sempre abra o detalhe, sem mexer nos botões internos.
  document.addEventListener('click', function(e){
    const card = e.target.closest('.card-produto');
    if(!card) return;

    if(
      e.target.closest('button') ||
      e.target.closest('a') ||
      e.target.closest('.tamanhos') ||
      e.target.closest('.btn-favorito') ||
      e.target.closest('.avaliacao-produto')
    ){
      return;
    }

    if(typeof window.abrirProdutoDetalheCard === 'function'){
      e.preventDefault();
      window.abrirProdutoDetalheCard(card);
    }
  }, false);

  // Comprar agora: salva o item do detalhe e abre o carrinho correto conforme o tamanho da tela.
  document.addEventListener('click', function(e){
    const btn = e.target.closest('.btn-comprar-agora');
    if(!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();

    if(typeof window.comprarAgoraDetalhe === 'function'){
      window.comprarAgoraDetalhe();
    }else if(typeof window.adicionarProdutoDetalhe === 'function'){
      window.adicionarProdutoDetalhe();
      setTimeout(abrirCarrinhoCertoMS, 80);
    }else{
      setTimeout(abrirCarrinhoCertoMS, 80);
    }
  }, true);
})();

/* =========================================================
   CORREÇÃO DIRETA MERCADO PAGO MS
   Garante que qualquer botão final do checkout chame o backend.
   ========================================================= */
(function(){
  function msApiBaseFinal(){
    if (window.location.hostname === "127.0.0.1" || window.location.hostname === "localhost") {
      return "http://127.0.0.1:3000";
    }
    return window.API_BASE || (typeof API_BASE !== "undefined" ? API_BASE : "");
  }

  function msObterValorCampo(){
    for(var i = 0; i < arguments.length; i++){
      var el = document.getElementById(arguments[i]);
      if(el && String(el.value || "").trim()) return String(el.value).trim();
    }
    return "";
  }

  function msDadosClientePagamento(){
    var salvo = {};
    try { salvo = JSON.parse(localStorage.getItem("dadosClienteMS") || "{}"); } catch(e) {}

    var dados = {
      nome: msObterValorCampo("nomeClienteMobile", "nomeCliente", "customerName") || salvo.nome || "",
      telefone: msObterValorCampo("telefoneClienteMobile", "telefoneCliente", "customerPhone", "whatsappCliente") || salvo.telefone || salvo.whatsapp || "",
      email: msObterValorCampo("emailClienteMobile", "emailCliente", "customerEmail") || salvo.email || "",
      cep: msObterValorCampo("cepCheckout", "cepCliente", "zip") || salvo.cep || "",
      rua: msObterValorCampo("ruaCliente", "ruaCheckout", "street") || salvo.rua || "",
      numero: msObterValorCampo("numeroCasa", "numeroCliente", "numeroCheckout", "number") || salvo.numero || "",
      complemento: msObterValorCampo("complementoCliente", "complementoCheckout", "complement") || salvo.complemento || "",
      bairro: msObterValorCampo("bairroCliente", "bairroCheckout", "district") || salvo.bairro || "",
      cidade: msObterValorCampo("cidadeCliente", "cidadeCheckout", "city") || salvo.cidade || "",
      estado: msObterValorCampo("estadoCliente", "estadoCheckout", "state") || salvo.estado || ""
    };

    localStorage.setItem("dadosClienteMS", JSON.stringify(dados));
    return dados;
  }

  function msNormalizarItensPagamento(lista){
    return (lista || []).map(function(item){
      return {
        nome: item.nome || item.title || "Produto MS",
        title: item.nome || item.title || "Produto MS",
        preco: Number(item.preco || item.unit_price || item.valor || 0),
        unit_price: Number(item.preco || item.unit_price || item.valor || 0),
        quantidade: Number(item.quantidade || item.quantity || 1),
        quantity: Number(item.quantidade || item.quantity || 1),
        tamanho: item.tamanho || "",
        imagem: item.imagem || item.img || ""
      };
    });
  }

  async function finalizarCompraMPCorrigido(event){
    if(event){
      event.preventDefault();
      event.stopPropagation();
      event.stopImmediatePropagation?.();
    }

    try{
      if(typeof carregarCarrinho === "function") carregarCarrinho();
      var lista = JSON.parse(localStorage.getItem("carrinho") || "[]");
      if(!lista.length && Array.isArray(window.carrinho)) lista = window.carrinho;
      if(!lista.length && typeof carrinho !== "undefined" && Array.isArray(carrinho)) lista = carrinho;

      if(!lista || !lista.length){
        alert("Seu carrinho está vazio. Adicione um produto para continuar.");
        return false;
      }

      if(typeof atualizarCarrinho === "function") atualizarCarrinho();
      if(typeof mostrarLoadingCheckout === "function") mostrarLoadingCheckout();

      // Abre uma aba vazia durante o clique do cliente para evitar que o navegador
      // bloqueie o Mercado Pago depois que a requisição terminar.
      var abaMercadoPagoMS = null;
      try { abaMercadoPagoMS = window.open("about:blank", "_blank"); } catch(e) {}

      var apiBase = msApiBaseFinal();
      if(!apiBase){
        alert("A loja está passando por uma instabilidade. Tente novamente em instantes.");
        return false;
      }

      console.log("MS PAGAMENTO: chamando", apiBase + "/criar-pagamento");

      var clienteMS = msDadosClientePagamento();
      var tipoEntregaMS = localStorage.getItem("tipoEntregaMS") || "entrega";
      var retiradaLocalMS = tipoEntregaMS === "retirada";

      if(!clienteMS.nome || !clienteMS.telefone){
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert("Volte à etapa Entrega e informe nome completo e WhatsApp antes de finalizar.");
        return false;
      }

      if(!retiradaLocalMS && (!clienteMS.cep || !clienteMS.rua || !clienteMS.numero || !clienteMS.bairro || !clienteMS.cidade || !clienteMS.estado)){
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert("Volte à etapa Entrega e preencha o endereço completo antes de finalizar.");
        return false;
      }

      var resposta = await fetch(apiBase + "/criar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoEntrega: tipoEntregaMS,
          retiradaLocal: retiradaLocalMS,
          items: msNormalizarItensPagamento(lista),
          carrinho: msNormalizarItensPagamento(lista),
          nome: clienteMS.nome,
          telefone: clienteMS.telefone,
          whatsapp: clienteMS.telefone,
          email: clienteMS.email,
          cep: clienteMS.cep,
          rua: clienteMS.rua,
          numero: clienteMS.numero,
          complemento: clienteMS.complemento,
          bairro: clienteMS.bairro,
          cidade: clienteMS.cidade,
          estado: clienteMS.estado,
          cliente: { nome: clienteMS.nome, telefone: clienteMS.telefone, email: clienteMS.email },
          endereco: { cep: clienteMS.cep, rua: clienteMS.rua, numero: clienteMS.numero, complemento: clienteMS.complemento, bairro: clienteMS.bairro, cidade: clienteMS.cidade, estado: clienteMS.estado },
          valorFrete: Number(window.valorFrete || valorFrete || localStorage.getItem("valorFreteMS") || 0),
          freteSelecionado: window.freteSelecionado || freteSelecionado || JSON.parse(localStorage.getItem("freteSelecionadoMS") || "null"),
          desconto: Number(descontoCupomMS || 0),
          codigoCupom: codigoCupomAplicadoMS || "",
          totalComFrete: Number(window.totalComFrete || totalComFrete || 0)
        })
      });

      var texto = await resposta.text();
      var dados = {};
      try { dados = JSON.parse(texto); } catch(e) { dados = { raw: texto }; }

      console.log("MS PAGAMENTO: resposta", resposta.status, dados);

      if(!resposta.ok){
        try { if(abaMercadoPagoMS && !abaMercadoPagoMS.closed) abaMercadoPagoMS.close(); } catch(e) {}
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert(dados.mensagem || "Não foi possível processar o pagamento agora. Tente novamente em instantes.");
        return false;
      }

      var link = dados.init_point || dados.sandbox_init_point || dados.url || dados.link;
      var pedidoIdMS = dados.pedido || dados.pedidoId || dados.external_reference || "";
      if(!link || !pedidoIdMS){
        try { if(abaMercadoPagoMS && !abaMercadoPagoMS.closed) abaMercadoPagoMS.close(); } catch(e) {}
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert("Não foi possível abrir o pagamento agora. Tente novamente em instantes.");
        return false;
      }

      // Guarda o link para o botão de contingência da página de acompanhamento.
      localStorage.setItem("msUltimoPedidoId", String(pedidoIdMS));
      localStorage.setItem("msUltimoLinkPagamento", link);

      // O Mercado Pago fica em outra aba. A aba da loja acompanha o webhook e
      // mostra automaticamente a confirmação com a identidade da MS.
      try {
        if(abaMercadoPagoMS && !abaMercadoPagoMS.closed){
          abaMercadoPagoMS.location.href = link;
        }
      } catch(e) {}

      if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
      window.location.href = "aguardando.html?pedido=" + encodeURIComponent(pedidoIdMS);
      return false;

    }catch(erro){
      console.error("ERRO FINAL MERCADO PAGO MS:", erro);
      if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
      alert("Não foi possível iniciar o pagamento. Tente novamente em instantes.");
      return false;
    }
  }

  window.finalizarCompra = finalizarCompraMPCorrigido;
  window.finalizarCompraFinal = finalizarCompraMPCorrigido;
  window.finalizarPagamento = finalizarCompraMPCorrigido;
  window.pagarMercadoPago = finalizarCompraMPCorrigido;
  window.msFinalizarPagamento = finalizarCompraMPCorrigido;

  document.addEventListener("click", function(e){
    var alvo = e.target.closest("button, a, input[type='button'], input[type='submit']");
    if(!alvo) return;

    var texto = ((alvo.innerText || alvo.value || alvo.getAttribute("aria-label") || alvo.id || alvo.className || "") + "").toLowerCase();
    var ehPagamento =
      texto.includes("mercado pago") ||
      texto.includes("pagar") ||
      texto.includes("finalizar compra") ||
      texto.includes("finalizar pedido") ||
      texto.includes("confirmar pagamento");

    if(!ehPagamento) return;

    var dentroCheckout = alvo.closest("#carrinho, #carrinhoMobileMS, #checkoutMobile, .checkout-mobile, .carrinho, .carrinho-lateral, .modal-carrinho");
    if(!dentroCheckout && !texto.includes("mercado pago")) return;

    // Chama sempre a função pública atual. Assim, a correção final que abre
    // a escolha PIX ou cartão não é ignorada por este listener antigo.
    if (typeof window.finalizarCompra === "function") {
      window.finalizarCompra(e);
    }
  }, true);

  console.log("Correção Mercado Pago MS carregada.");
})();

/* =========================================================
   CORREÇÃO FINAL - CONJUNTO BRANCO / QUANTIDADE NO DETALHE
   Impede o produto de duplicar/multiplicar ao clicar novamente.
   Quando o mesmo produto/tamanho/cor já existe, atualiza para a
   quantidade escolhida na tela em vez de somar por cima.
   ========================================================= */
(function(){
  function msTexto(el){ return (el && el.innerText ? el.innerText : '').trim(); }
  function msNumero(valor){
    if(typeof pegarPrecoNumero === 'function') return pegarPrecoNumero(valor);
    return Number(String(valor || '0').replace(/[^0-9,\.]/g,'').replace('.', '').replace(',', '.')) || 0;
  }
  function msQtdDetalheCorrigida(){
    const el = document.getElementById('qtdProdutoDetalhe') || document.getElementById('quantidadeDetalhe');
    const qtd = Number(msTexto(el) || window.quantidadeDetalhe || 1);
    return qtd > 0 ? qtd : 1;
  }
  function msTamanhoDetalheCorrigido(){
    const detalhe = document.getElementById('produtoDetalhe');
    const ativo = detalhe?.querySelector('.tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo');
    return detalhe?.dataset?.tamanho || msTexto(ativo) || '';
  }
  function msProdutoDetalheCorrigido(){
    const detalhe = document.getElementById('produtoDetalhe');
    const card = window.msProdutoCardAtual;
    const variacao = window.msProdutoVariacaoAtual;
    const tamanho = msTamanhoDetalheCorrigido();

    if(!tamanho){
      alert('Selecione um tamanho para adicionar este produto ao carrinho.');
      return null;
    }

    const nomeTela = msTexto(document.getElementById('detalheNome'));
    const nome = card?.dataset?.nome || produtoDetalheAtual?.nome || nomeTela || 'Produto MS';
    const preco = msNumero(card?.dataset?.preco || produtoDetalheAtual?.preco || msTexto(document.getElementById('detalhePreco')) || 0);
    const imagem = window.msImagemSelecionada || variacao?.fotos?.[0] || card?.dataset?.img || produtoDetalheAtual?.img || document.getElementById('detalheImg')?.getAttribute('src') || '';
    const cor = window.msCorSelecionada || variacao?.label || msTexto(document.getElementById('corSelecionadaDetalhe')).replace('Cor selecionada:', '').trim() || 'Única';

    return {
      nome: nome,
      preco: preco,
      imagem: imagem,
      img: imagem,
      tamanho: tamanho,
      cor: cor,
      quantidade: msQtdDetalheCorrigida()
    };
  }
  function msSalvarDetalheCorrigido(){
    const item = msProdutoDetalheCorrigido();
    if(!item) return false;

    let lista = [];
    try { lista = JSON.parse(localStorage.getItem('carrinho')) || []; } catch(e){ lista = []; }

    const i = lista.findIndex(p =>
      p.nome === item.nome &&
      p.tamanho === item.tamanho &&
      (p.cor || '') === (item.cor || '')
    );

    if(i >= 0){
      lista[i] = {
        ...lista[i],
        ...item,
        quantidade: item.quantidade
      };
    }else{
      lista.push(item);
    }

    localStorage.setItem('carrinho', JSON.stringify(lista));
    window.carrinho = lista;
    try { carrinho = lista; } catch(e){}

    if(typeof atualizarCarrinho === 'function') atualizarCarrinho();
    if(typeof atualizarTudo === 'function') atualizarTudo();
    if(typeof atualizarBadgeCarrinho === 'function') atualizarBadgeCarrinho();
    if(typeof atualizarContador === 'function') atualizarContador();
    if(typeof renderCarrinhoMobileMS === 'function') renderCarrinhoMobileMS();

    if(typeof avisoCarrinhoPremium === 'function') avisoCarrinhoPremium('Produto atualizado no carrinho.');
    return true;
  }

  const abrirAntigo = window.abrirProdutoDetalheCard;
  window.abrirProdutoDetalheCard = function(card){
    window.quantidadeDetalhe = 1;
    try { quantidadeDetalhe = 1; } catch(e){}
    const q1 = document.getElementById('qtdProdutoDetalhe');
    const q2 = document.getElementById('quantidadeDetalhe');
    if(q1) q1.innerText = '1';
    if(q2) q2.innerText = '1';
    if(card && card.dataset && card.dataset.nome === 'Conjunto-branco'){
      card.dataset.nome = 'Conjunto Branco MS';
    }
    return abrirAntigo.call(this, card);
  };

  window.adicionarProdutoDetalhe = function(){
    return msSalvarDetalheCorrigido();
  };

  window.comprarAgoraDetalhe = function(){
    if(!msSalvarDetalheCorrigido()) return false;
    setTimeout(function(){
      if(window.innerWidth <= 768){
        if(typeof window.abrirCarrinhoMobileMS === 'function') window.abrirCarrinhoMobileMS();
        else if(typeof window.abrirCarrinhoMS === 'function') window.abrirCarrinhoMS();
        else if(typeof window.abrirCarrinhoMobile === 'function') window.abrirCarrinhoMobile();
        else if(typeof window.abrirCarrinho === 'function') window.abrirCarrinho();
        else window.location.href = 'carrinho.html';
      }else{
        if(typeof window.abrirCarrinhoPCMS === 'function') window.abrirCarrinhoPCMS();
        else if(typeof window.abrirCarrinhoMS === 'function') window.abrirCarrinhoMS();
        else if(typeof window.abrirCarrinho === 'function') window.abrirCarrinho();
      }
    }, 50);
    return false;
  };
})();



/* ===== FIX DEFINITIVO - PRODUTOS RECOMENDADOS / SLIDER ===== */
(function(){
  function msPrecoSlider(valor){
    if(typeof valor === "number") return valor;
    return Number(String(valor || "0")
      .replace("R$","")
      .replace(/\./g,"")
      .replace(",",".")
      .replace(/[^0-9.]/g,"")) || 0;
  }

  function msDinheiroSlider(valor){
    const n = msPrecoSlider(valor);
    return n.toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }

  function msResetDetalheSlider(){
    window.quantidadeDetalhe = 1;
    try{ quantidadeDetalhe = 1; }catch(e){}

    const q1 = document.getElementById("qtdProdutoDetalhe");
    const q2 = document.getElementById("quantidadeDetalhe");
    if(q1) q1.innerText = "1";
    if(q2) q2.innerText = "1";

    const detalhe = document.getElementById("produtoDetalhe");
    if(detalhe){
      detalhe.dataset.tamanho = "";
      detalhe.dataset.cor = "";
      detalhe.querySelectorAll(".tamanho-btn, .tamanhos-detalhe button, .detalhe-tamanhos button")
        .forEach(btn => btn.classList.remove("ativo"));
    }
  }

  window.abrirRecomendadoMS = function(nome, preco, img, fotos, cor){
    msResetDetalheSlider();

    const precoFinal = msPrecoSlider(preco);
    const corFinal = cor || "unica";

    window.produtoDetalheAtual = {
      nome: nome,
      preco: precoFinal,
      precoAntigo: null,
      img: img,
      imagem: img,
      cor: corFinal
    };

    try{
      produtoDetalheAtual = window.produtoDetalheAtual;
    }catch(e){}

    window.fotosDetalhe = String(fotos || img)
      .split(",")
      .map(f => f.trim())
      .filter(Boolean);

    try{
      fotosDetalhe = window.fotosDetalhe;
      fotoAtualDetalhe = 0;
    }catch(e){}

    const detalhe = document.getElementById("produtoDetalhe");
    const detalheImg = document.getElementById("detalheImg");
    const detalheNome = document.getElementById("detalheNome");
    const detalhePreco = document.getElementById("detalhePreco");
    const breadcrumbNome = document.getElementById("breadcrumbNome");
    const precoAntigo = document.getElementById("detalhePrecoAntigo");
    const miniaturas = document.getElementById("miniaturasDetalhe");

    if(detalheImg) detalheImg.src = window.fotosDetalhe[0] || img;
    if(detalheNome) detalheNome.innerText = nome;
    if(detalhePreco) detalhePreco.innerText = msDinheiroSlider(precoFinal);
    if(breadcrumbNome) breadcrumbNome.innerText = nome;
    if(precoAntigo) precoAntigo.innerText = "";

    if(typeof montarCorUnicaRecomendado === "function"){
      montarCorUnicaRecomendado(corFinal);
    }

    if(miniaturas){
      miniaturas.innerHTML = "";
      window.fotosDetalhe.forEach(function(foto, index){
        const thumb = document.createElement("img");
        thumb.src = foto;
        if(index === 0) thumb.classList.add("ativa");
        thumb.onclick = function(event){
          event.stopPropagation();
          if(detalheImg) detalheImg.src = foto;
          miniaturas.querySelectorAll("img").forEach(el => el.classList.remove("ativa"));
          thumb.classList.add("ativa");
          try{ fotoAtualDetalhe = index; }catch(e){}
        };
        miniaturas.appendChild(thumb);
      });
    }

    const desc = document.getElementById("descricaoProduto");
    const det = document.getElementById("detalhesProduto");
    const comp = document.getElementById("composicaoProduto");
    const cuid = document.getElementById("cuidadosProduto");
    if(desc) desc.innerText = "";
    if(det) det.innerText = "Peça MS Matias Style com caimento moderno, acabamento reforçado e visual premium para o dia a dia.";
    if(comp) comp.innerText = "Composição informada conforme lote do fornecedor.";
    if(cuid) cuid.innerText = "Lavar do avesso, não usar alvejante e secar à sombra.";

    if(detalhe){
      detalhe.classList.add("ativo");
      detalhe.style.display = "block";
      detalhe.scrollTo({ top: 0, behavior: "smooth" });
    }
  };
})();




/* =========================================================
   FIX REAL - SLIDER "VOCÊ PODE GOSTAR"
   Resolve:
   1) produto recomendado abrindo com nome/preço de outro produto;
   2) carrinho usando card antigo;
   3) quantidade multiplicando;
   4) clique do coração abrindo produto.
   ========================================================= */
(function(){
  function dinheiroMS(valor){
    const n = Number(String(valor || "0").replace("R$","").replace(/\./g,"").replace(",",".").replace(/[^0-9.]/g,"")) || 0;
    return n.toLocaleString("pt-BR", {style:"currency", currency:"BRL"});
  }

  function numeroMS(valor){
    if(typeof valor === "number") return valor;
    return Number(String(valor || "0").replace("R$","").replace(/\./g,"").replace(",",".").replace(/[^0-9.]/g,"")) || 0;
  }

  function textoMS(el){
    return (el && el.innerText ? el.innerText : "").trim();
  }

  function qtdDetalheMS(){
    const el = document.getElementById("qtdProdutoDetalhe") || document.getElementById("quantidadeDetalhe");
    const n = Number(textoMS(el) || window.quantidadeDetalhe || 1);
    return n > 0 ? n : 1;
  }

  function tamanhoDetalheMS(){
    const detalhe = document.getElementById("produtoDetalhe");
    const ativo = detalhe?.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo");
    return detalhe?.dataset?.tamanho || textoMS(ativo);
  }

  function corNomeMS(cor){
    const mapa = {
      preto:"Preto", branco:"Branco", bege:"Bege", rosa:"Rosa",
      vinho:"Vinho", cinza:"Cinza", azul:"Azul", unica:"Única"
    };
    return mapa[String(cor || "unica").toLowerCase()] || cor || "Única";
  }

  function resetDetalheMS(){
    window.quantidadeDetalhe = 1;
    try{ quantidadeDetalhe = 1; }catch(e){}

    const q1 = document.getElementById("qtdProdutoDetalhe");
    const q2 = document.getElementById("quantidadeDetalhe");
    if(q1) q1.innerText = "1";
    if(q2) q2.innerText = "1";

    const detalhe = document.getElementById("produtoDetalhe");
    if(detalhe){
      detalhe.dataset.tamanho = "";
      detalhe.querySelectorAll(".tamanhos-detalhe button, .detalhe-tamanhos button, .tamanho-btn")
        .forEach(btn => btn.classList.remove("ativo"));
    }
  }

  function abrirSliderCard(card){
    if(!card) return false;

    const nome = card.dataset.nome;
    const preco = numeroMS(card.dataset.preco);
    const img = card.dataset.img;
    const fotos = String(card.dataset.fotos || img).split(",").map(f => f.trim()).filter(Boolean);
    const cor = card.dataset.cor || "unica";

    resetDetalheMS();

    window.msDetalheVeioSlider = true;
    window.msProdutoCardAtual = null;
    window.msProdutoVariacaoAtual = null;
    window.msImagemSelecionada = fotos[0] || img;
    window.msCorSelecionada = corNomeMS(cor);

    const obj = {
      nome: nome,
      preco: preco,
      precoAntigo: null,
      img: img,
      imagem: img,
      cor: corNomeMS(cor)
    };

    window.produtoDetalheAtual = obj;
    try{ produtoDetalheAtual = obj; }catch(e){}

    window.fotosDetalhe = fotos;
    try{
      fotosDetalhe = fotos;
      fotoAtualDetalhe = 0;
    }catch(e){}

    const detalhe = document.getElementById("produtoDetalhe");
    const detalheImg = document.getElementById("detalheImg");
    const detalheNome = document.getElementById("detalheNome");
    const detalhePreco = document.getElementById("detalhePreco");
    const breadcrumbNome = document.getElementById("breadcrumbNome");
    const miniaturas = document.getElementById("miniaturasDetalhe");
    const corTexto = document.getElementById("corSelecionadaDetalhe");

    if(detalheImg) detalheImg.src = fotos[0] || img;
    if(detalheNome) detalheNome.innerText = nome;
    if(detalhePreco) detalhePreco.innerText = dinheiroMS(preco);
    if(breadcrumbNome) breadcrumbNome.innerText = nome;
    if(corTexto) corTexto.innerText = "Cor selecionada: " + corNomeMS(cor);

    if(typeof montarCorUnicaRecomendado === "function"){
      montarCorUnicaRecomendado(cor);
    }

    if(miniaturas){
      miniaturas.innerHTML = "";
      fotos.forEach(function(foto, index){
        const thumb = document.createElement("img");
        thumb.src = foto;
        if(index === 0) thumb.classList.add("ativa");
        thumb.onclick = function(event){
          event.stopPropagation();
          window.msImagemSelecionada = foto;
          if(detalheImg) detalheImg.src = foto;
          miniaturas.querySelectorAll("img").forEach(el => el.classList.remove("ativa"));
          thumb.classList.add("ativa");
          try{ fotoAtualDetalhe = index; }catch(e){}
        };
        miniaturas.appendChild(thumb);
      });
    }

    const desc = document.getElementById("descricaoProduto");
    const det = document.getElementById("detalhesProduto");
    const comp = document.getElementById("composicaoProduto");
    const cuid = document.getElementById("cuidadosProduto");
    if(desc) desc.innerText = "";
    if(det) det.innerText = "Peça MS Matias Style com caimento moderno, acabamento reforçado e visual premium para o dia a dia.";
    if(comp) comp.innerText = "Composição informada conforme lote do fornecedor.";
    if(cuid) cuid.innerText = "Lavar do avesso, não usar alvejante e secar à sombra.";

    if(detalhe){
      detalhe.dataset.cor = corNomeMS(cor);
      detalhe.classList.add("ativo");
      detalhe.style.display = "block";
      detalhe.scrollTo({top:0, behavior:"smooth"});
    }

    return false;
  }

  window.abrirRecomendadoMS = function(nome, preco, img, fotos, cor){
    const fake = document.createElement("article");
    fake.dataset.nome = nome;
    fake.dataset.preco = preco;
    fake.dataset.img = img;
    fake.dataset.fotos = fotos || img;
    fake.dataset.cor = cor || "unica";
    return abrirSliderCard(fake);
  };

  const abrirCardAntigo = window.abrirProdutoDetalheCard;
  window.abrirProdutoDetalheCard = function(card){
    window.msDetalheVeioSlider = false;
    return abrirCardAntigo ? abrirCardAntigo.call(this, card) : undefined;
  };

  document.addEventListener("click", function(e){
    const fav = e.target.closest(".recomendado-card-ms .rec-fav-ms");
    if(fav){
      e.preventDefault();
      e.stopPropagation();
      try{ favoritarProduto(fav, e); }catch(err){}
      return false;
    }

    const card = e.target.closest(".recomendado-card-ms");
    if(!card) return;

    e.preventDefault();
    e.stopPropagation();
    abrirSliderCard(card);
    return false;
  }, true);

  function salvarItemSlider(){
    if(!window.msDetalheVeioSlider) return null;

    const atual = window.produtoDetalheAtual || (typeof produtoDetalheAtual !== "undefined" ? produtoDetalheAtual : null);
    if(!atual) return false;

    const tamanho = tamanhoDetalheMS();
    if(!tamanho){
      alert("Selecione um tamanho para adicionar este produto ao carrinho.");
      return false;
    }

    const item = {
      nome: atual.nome,
      preco: numeroMS(atual.preco),
      imagem: window.msImagemSelecionada || atual.img || atual.imagem,
      img: window.msImagemSelecionada || atual.img || atual.imagem,
      tamanho: tamanho,
      cor: window.msCorSelecionada || atual.cor || "Única",
      quantidade: qtdDetalheMS()
    };

    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }

    const i = lista.findIndex(p =>
      p.nome === item.nome &&
      p.tamanho === item.tamanho &&
      String(p.cor || "") === String(item.cor || "")
    );

    if(i >= 0){
      lista[i] = {...lista[i], ...item, quantidade:item.quantidade};
    }else{
      lista.push(item);
    }

    localStorage.setItem("carrinho", JSON.stringify(lista));
    window.carrinho = lista;
    try{ carrinho = lista; }catch(e){}

    if(typeof atualizarCarrinho === "function") atualizarCarrinho();
    if(typeof atualizarTudo === "function") atualizarTudo();
    if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
    if(typeof atualizarContador === "function") atualizarContador();
    if(typeof renderCarrinhoMobileMS === "function") renderCarrinhoMobileMS();
    if(typeof avisoCarrinhoPremium === "function") avisoCarrinhoPremium("Produto adicionado ao carrinho.");

    return true;
  }

  const addAntigo = window.adicionarProdutoDetalhe;
  window.adicionarProdutoDetalhe = function(){
    const r = salvarItemSlider();
    if(r !== null) return r;
    return addAntigo ? addAntigo.apply(this, arguments) : false;
  };

  const comprarAntigo = window.comprarAgoraDetalhe;
  window.comprarAgoraDetalhe = function(){
    const r = salvarItemSlider();
    if(r === null){
      return comprarAntigo ? comprarAntigo.apply(this, arguments) : false;
    }
    if(!r) return false;

    setTimeout(function(){
      if(window.innerWidth <= 768){
        if(typeof window.abrirCarrinhoMobileMS === "function") window.abrirCarrinhoMobileMS();
        else if(typeof window.abrirCarrinhoMS === "function") window.abrirCarrinhoMS();
        else if(typeof window.abrirCarrinho === "function") window.abrirCarrinho();
        else window.location.href = "carrinho.html";
      }else{
        if(typeof window.abrirCarrinhoPCMS === "function") window.abrirCarrinhoPCMS();
        else if(typeof window.abrirCarrinhoMS === "function") window.abrirCarrinhoMS();
        else if(typeof window.abrirCarrinho === "function") window.abrirCarrinho();
      }
    }, 50);

    return false;
  };

  console.log("FIX REAL SLIDER RECOMENDADOS carregado.");
})();


/* =========================================================
   CORREÇÃO FINAL MS - PREÇO / COR / SLIDER
   Colocado por último para sobrescrever os fixes antigos.
   ========================================================= */
function pegarPrecoNumero(preco){
  if(typeof preco === 'number') return preco;
  let valor = String(preco || '0').replace('R$','').replace(/\s/g,'').trim();
  if(!valor) return 0;
  if(valor.includes(',')){
    valor = valor.replace(/\./g,'').replace(',','.');
  }else{
    valor = valor.replace(/[^0-9.]/g,'');
  }
  return parseFloat(valor) || 0;
}

function dinheiro(valor){
  return pegarPrecoNumero(valor).toLocaleString('pt-BR', {style:'currency', currency:'BRL'});
}

(function(){
  const nomesCoresMS = {
    preto:'Preto', branco:'Branco', bege:'Bege', rosa:'Rosa',
    vinho:'Vinho', cinza:'Cinza', azul:'Azul', unica:'Única'
  };

  function corNomeMS(cor){
    return nomesCoresMS[String(cor || 'unica').toLowerCase()] || cor || 'Única';
  }

  function resetDetalheFinalMS(){
    window.quantidadeDetalhe = 1;
    try{ quantidadeDetalhe = 1; }catch(e){}

    const q1 = document.getElementById('qtdProdutoDetalhe');
    const q2 = document.getElementById('quantidadeDetalhe');
    if(q1) q1.innerText = '1';
    if(q2) q2.innerText = '1';

    const detalhe = document.getElementById('produtoDetalhe');
    if(detalhe){
      detalhe.dataset.tamanho = '';
      detalhe.querySelectorAll('.tamanhos-detalhe button, .detalhe-tamanhos button, .tamanho-btn')
        .forEach(btn => btn.classList.remove('ativo'));
    }
  }

  function setCorFinalMS(cor){
    const corKey = String(cor || 'unica').toLowerCase();
    const nomeCor = corNomeMS(corKey);

    if(typeof montarCorUnicaRecomendado === 'function'){
      montarCorUnicaRecomendado(corKey);
    }

    const t1 = document.getElementById('corSelecionadaDetalhe');
    const t2 = document.getElementById('corSelecionadaMS');
    if(t1) t1.innerText = 'Cor selecionada: ' + nomeCor;
    if(t2) t2.innerText = 'Cor selecionada: ' + nomeCor;

    const detalhe = document.getElementById('produtoDetalhe');
    if(detalhe) detalhe.dataset.cor = nomeCor;
    window.msCorSelecionada = nomeCor;
  }

  function montarMiniaturasFinalMS(fotos){
    const miniaturas = document.getElementById('miniaturasDetalhe');
    const detalheImg = document.getElementById('detalheImg');
    if(!miniaturas) return;

    miniaturas.innerHTML = '';
    fotos.forEach((foto, index) => {
      const thumb = document.createElement('img');
      thumb.src = foto;
      if(index === 0) thumb.classList.add('ativa');
      thumb.onclick = function(event){
        event.stopPropagation();
        if(detalheImg) detalheImg.src = foto;
        window.msImagemSelecionada = foto;
        miniaturas.querySelectorAll('img').forEach(img => img.classList.remove('ativa'));
        thumb.classList.add('ativa');
        try{ fotoAtualDetalhe = index; }catch(e){}
      };
      miniaturas.appendChild(thumb);
    });
  }

  window.abrirRecomendadoMS = function(nome, preco, img, fotos, cor = 'unica'){
    resetDetalheFinalMS();

    const precoFinal = pegarPrecoNumero(preco);
    const listaFotos = String(fotos || img).split(',').map(f => f.trim()).filter(Boolean);
    const imagemFinal = listaFotos[0] || img;
    const nomeCor = corNomeMS(cor);

    window.msDetalheVeioSlider = true;
    window.msImagemSelecionada = imagemFinal;

    window.produtoDetalheAtual = {
      nome: nome,
      preco: precoFinal,
      precoAntigo: null,
      img: img,
      imagem: imagemFinal,
      cor: nomeCor
    };
    try{ produtoDetalheAtual = window.produtoDetalheAtual; }catch(e){}

    window.fotosDetalhe = listaFotos;
    try{
      fotosDetalhe = listaFotos;
      fotoAtualDetalhe = 0;
    }catch(e){}

    const detalhe = document.getElementById('produtoDetalhe');
    const detalheImg = document.getElementById('detalheImg');
    const detalheNome = document.getElementById('detalheNome');
    const detalhePreco = document.getElementById('detalhePreco');
    const breadcrumbNome = document.getElementById('breadcrumbNome');
    const precoAntigo = document.querySelector('#produtoDetalhe .preco-antigo') || document.getElementById('detalhePrecoAntigo');

    if(detalheImg) detalheImg.src = imagemFinal;
    if(detalheNome) detalheNome.innerText = nome;
    if(detalhePreco) detalhePreco.innerText = dinheiro(precoFinal);
    if(breadcrumbNome) breadcrumbNome.innerText = nome;
    if(precoAntigo) precoAntigo.innerText = '';

    setCorFinalMS(cor);
    montarMiniaturasFinalMS(listaFotos);

    if(detalhe){
      detalhe.classList.add('ativo');
      detalhe.style.display = 'block';
      detalhe.scrollTo({top:0, behavior:'smooth'});
    }

    return false;
  };

  function abrirCardSliderFinal(card){
    return window.abrirRecomendadoMS(
      card.dataset.nome,
      card.dataset.preco,
      card.dataset.img,
      card.dataset.fotos || card.dataset.img,
      card.dataset.cor || 'unica'
    );
  }

  document.addEventListener('click', function(e){
    const fav = e.target.closest('.recomendado-card-ms .rec-fav-ms');
    if(fav){
      e.preventDefault();
      e.stopPropagation();
      if(typeof favoritarProduto === 'function') favoritarProduto(fav, e);
      return false;
    }

    const card = e.target.closest('.recomendado-card-ms');
    if(!card) return;

    e.preventDefault();
    e.stopPropagation();
    abrirCardSliderFinal(card);
    return false;
  }, true);

  function quantidadeFinalMS(){
    const el = document.getElementById('qtdProdutoDetalhe') || document.getElementById('quantidadeDetalhe');
    const n = Number((el && el.innerText) || window.quantidadeDetalhe || 1);
    return n > 0 ? n : 1;
  }

  function tamanhoFinalMS(){
    const detalhe = document.getElementById('produtoDetalhe');
    const ativo = detalhe?.querySelector('.tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo');
    return detalhe?.dataset?.tamanho || (ativo ? ativo.innerText.trim() : '');
  }

  function addSliderCarrinhoFinalMS(){
    if(!window.msDetalheVeioSlider) return null;

    const p = window.produtoDetalheAtual || (typeof produtoDetalheAtual !== 'undefined' ? produtoDetalheAtual : null);
    if(!p) return false;

    const tamanho = tamanhoFinalMS();
    if(!tamanho){
      alert('Selecione um tamanho para adicionar este produto ao carrinho.');
      return false;
    }

    const item = {
      nome: p.nome,
      preco: pegarPrecoNumero(p.preco),
      img: window.msImagemSelecionada || p.imagem || p.img,
      imagem: window.msImagemSelecionada || p.imagem || p.img,
      tamanho: tamanho,
      cor: window.msCorSelecionada || p.cor || 'Única',
      quantidade: quantidadeFinalMS()
    };

    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem('carrinho')) || []; }catch(e){ lista = []; }

    const idx = lista.findIndex(x =>
      x.nome === item.nome &&
      x.tamanho === item.tamanho &&
      String(x.cor || '') === String(item.cor || '')
    );

    if(idx >= 0){
      lista[idx].quantidade = item.quantidade;
      lista[idx].preco = item.preco;
      lista[idx].img = item.img;
      lista[idx].imagem = item.imagem;
    }else{
      lista.push(item);
    }

    localStorage.setItem('carrinho', JSON.stringify(lista));
    window.carrinho = lista;
    try{ carrinho = lista; }catch(e){}

    if(typeof atualizarCarrinho === 'function') atualizarCarrinho();
    if(typeof atualizarTudo === 'function') atualizarTudo();
    if(typeof atualizarBadgeCarrinho === 'function') atualizarBadgeCarrinho();
    if(typeof renderCarrinhoMobileMS === 'function') renderCarrinhoMobileMS();
    if(typeof mostrarToastMS === 'function') mostrarToastMS();

    return true;
  }

  const addDetalheAntigoFinal = window.adicionarProdutoDetalhe;
  window.adicionarProdutoDetalhe = function(){
    const r = addSliderCarrinhoFinalMS();
    if(r !== null) return r;
    return addDetalheAntigoFinal ? addDetalheAntigoFinal.apply(this, arguments) : false;
  };

  const comprarAntigoFinal = window.comprarAgoraDetalhe;
  window.comprarAgoraDetalhe = function(){
    const r = addSliderCarrinhoFinalMS();
    if(r === null){
      return comprarAntigoFinal ? comprarAntigoFinal.apply(this, arguments) : false;
    }
    if(!r) return false;

    setTimeout(() => {
      if(window.innerWidth <= 768){
        if(typeof abrirCarrinhoMobileMS === 'function') abrirCarrinhoMobileMS();
        else if(typeof abrirCarrinho === 'function') abrirCarrinho();
      }else{
        if(typeof abrirCarrinhoPCMS === 'function') abrirCarrinhoPCMS();
        else if(typeof abrirCarrinho === 'function') abrirCarrinho();
      }
    }, 50);
    return false;
  };

  console.log('Correção final MS preço/cor/slider carregada');
})();

/* =========================================================
   ESTOQUE ONLINE REAL - MS MATIAS STYLE
   Liga cliente + carrinho + checkout ao servidor.
   Não remove funções antigas: só trava estoque por cima.
   ========================================================= */
(function(){
  const API_ESTOQUE_MS = (typeof API_BASE !== "undefined" ? API_BASE : "http://127.0.0.1:3000");

  function textoLimpoMS(v){ return String(v || "").trim(); }

  function numeroMS(v){
    if(typeof v === "number") return v;
    let s = String(v || "0").replace("R$","").replace(/\s/g,"").trim();
    if(s.includes(",")) s = s.replace(/\./g,"").replace(",",".");
    else s = s.replace(/[^0-9.]/g,"");
    return Number(s) || 0;
  }

  function corPeloNomeMS(nome){
    const n = String(nome || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    if(n.includes("preto") || n.includes("preta")) return "Preto";
    if(n.includes("off white") || n.includes("offwhite")) return "Off White";
    if(n.includes("branco") || n.includes("branca")) return "Branco";
    if(n.includes("bege")) return "Bege";
    if(n.includes("azul")) return "Azul";
    if(n.includes("rosa")) return "Rosa";
    if(n.includes("cinza")) return "Cinza";
    if(n.includes("vinho") || n.includes("bordo")) return "Vinho";
    if(n.includes("marrom")) return "Marrom";
    if(n.includes("vermelho") || n.includes("vermelha")) return "Vermelho";
    return "Única";
  }


  function gerarSkuMS(item){
    function norm(v){ return String(v || "").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim(); }
    const nome = norm(item?.nome || item?.produto || "produto");
    const corTxt = norm(item?.cor || corPeloNomeMS(item?.nome || item?.produto || ""));
    const tam = String(item?.tamanho || "unico").toUpperCase().trim();
    let tipo = "PROD";
    if(nome.includes("moletom")) tipo = "MOL";
    else if(nome.includes("jaqueta") || nome.includes("corta vento")) tipo = "JAQ";
    else if(nome.includes("conjunto")) tipo = "CON";
    else if(nome.includes("camiseta") && nome.includes("oversized")) tipo = "OVR";
    else if(nome.includes("camiseta")) tipo = "CBA";
    else if(nome.includes("calca")) tipo = "CAL";
    else if(nome.includes("touca")) tipo = "TOU";
    else if(nome.includes("meia")) tipo = "MEI";
    const mapa = {preto:"PT",preta:"PT",branco:"BR",branca:"BR",bege:"BG",azul:"AZ",rosa:"RS",cinza:"CZ",vinho:"VN",bordo:"VN",marrom:"MR",vermelho:"VM",vermelha:"VM",offwhite:"OW",unica:"UN",unico:"UN"};
    const corKey = corTxt.replace(/\s+/g,"");
    const cor = mapa[corKey] || (corKey.slice(0,3).toUpperCase() || "UN");
    return `MS-${tipo}-${cor}-${tam || "UN"}`.replace(/[^A-Z0-9-]/g,"");
  }

  function itemProntoMS(item){
    const pronto = {
      nome: textoLimpoMS(item?.nome || item?.produto || "Produto MS"),
      preco: numeroMS(item?.preco || 0),
      imagem: item?.imagem || item?.img || "",
      img: item?.img || item?.imagem || "",
      tamanho: textoLimpoMS(item?.tamanho || "Único").toUpperCase(),
      cor: textoLimpoMS(item?.cor || corPeloNomeMS(item?.nome || item?.produto || "")),
      quantidade: Math.max(1, Number(item?.quantidade || 1))
    };
    pronto.sku = textoLimpoMS(item?.sku || item?.SKU || gerarSkuMS(pronto)).toUpperCase();
    return pronto;
  }

  function chaveItemMS(item){
    const i = itemProntoMS(item);
    return String(i.sku || gerarSkuMS(i)).toUpperCase();
  }

  function qtdNoCarrinhoMS(item){
    const alvo = chaveItemMS(item);
    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }
    return lista.reduce((total, p) => chaveItemMS(p) === alvo ? total + Number(p.quantidade || 1) : total, 0);
  }

  async function buscarDisponivelMS(item){
    const resp = await fetch(`${API_ESTOQUE_MS}/estoque/disponivel`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(itemProntoMS(item))
    });
    const dados = await resp.json().catch(() => ({}));
    if(!resp.ok) throw new Error(dados.mensagem || "Erro ao consultar estoque.");
    return dados;
  }

  async function podeAdicionarMS(item, qtdNova){
    const pronto = itemProntoMS(item);
    const info = await buscarDisponivelMS(pronto);

    if(!info.cadastrado){
      alert("Esta combinação de cor e tamanho está indisponível no momento. Escolha outra opção.");
      return false;
    }

    const jaNoCarrinho = qtdNoCarrinhoMS(pronto);
    const pedidoTotal = jaNoCarrinho + Math.max(1, Number(qtdNova || 1));

    if(pedidoTotal > Number(info.disponivel || 0)){
      const restante = Math.max(0, Number(info.disponivel || 0) - jaNoCarrinho);
      if(restante <= 0){
        alert("Você já adicionou ao carrinho todas as unidades disponíveis desta opção.");
      }else{
        alert(`Temos apenas ${restante} unidade(s) disponível(is) desta opção.`);
      }
      return false;
    }

    return true;
  }

  function pegarItemDoCardMS(arg1, arg2, arg3, arg4){
    let botao, nome, preco, imagem;
    if(typeof arg1 === "string"){
      nome = arg1;
      preco = arg2;
      imagem = arg3;
      botao = arg4;
    }else{
      botao = arg1;
    }
    const card = botao && typeof botao.closest === "function" ? botao.closest(".card-produto") : null;
    if(card){
      nome = nome || card.dataset.nome || card.querySelector("h3")?.innerText || "Produto MS";
      preco = preco || card.dataset.preco || card.querySelector(".preco")?.innerText || 0;
      imagem = imagem || card.dataset.img || card.querySelector("img")?.getAttribute("src") || "";
    }
    const tamanhoAtivo = card?.querySelector(".tamanhos button.ativo");
    const tamanho = textoLimpoMS(card?.dataset.tamanho || tamanhoAtivo?.innerText);
    return itemProntoMS({ nome, preco, imagem, img: imagem, tamanho, cor: corPeloNomeMS(nome), quantidade: Math.max(1, Number(window.quantidadeDetalhe || 1)) });
  }

  function salvarEAtualizarMS(lista){
    localStorage.setItem("carrinho", JSON.stringify(lista));
    window.carrinho = lista;
    try{ carrinho = lista; }catch(e){}
    if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();
    if(typeof atualizarTudo === "function") atualizarTudo();
    if(typeof renderCarrinhoMobileMS === "function") renderCarrinhoMobileMS();
    if(typeof atualizarCarrinho === "function") atualizarCarrinho();
  }

  const addOriginalMS = window.adicionarCarrinho;
  window.adicionarCarrinho = async function(arg1, arg2, arg3, arg4){
    const item = pegarItemDoCardMS(arg1, arg2, arg3, arg4);
    const botao = typeof arg1 === "string" ? arg4 : arg1;

    if(!item.tamanho || item.tamanho === "ÚNICO" && botao?.closest?.(".card-produto")?.querySelector(".tamanhos")){
      alert("Selecione um tamanho para adicionar este produto ao carrinho.");
      return false;
    }

    if(!(await podeAdicionarMS(item, item.quantidade))) return false;

    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }
    const idx = lista.findIndex(p => chaveItemMS(p) === chaveItemMS(item));
    if(idx >= 0){
      lista[idx].quantidade = Number(lista[idx].quantidade || 1) + item.quantidade;
    }else{
      lista.push(item);
    }

    salvarEAtualizarMS(lista);

    if(typeof animarProdutoParaCarrinho === "function" && botao) animarProdutoParaCarrinho(botao);
    if(typeof mostrarConfirmacaoCarrinhoMS === "function") mostrarConfirmacaoCarrinhoMS(item);
    else if(typeof avisoCarrinhoPremium === "function") avisoCarrinhoPremium(item);
    else if(typeof mostrarToastMS === "function") mostrarToastMS();
    return true;
  };

  window.adicionarAoCarrinho = function(botao){ return window.adicionarCarrinho(botao); };

  window.adicionarProdutoDetalhe = async function(){
    const detalhe = document.getElementById("produtoDetalhe");
    const atual = window.produtoDetalheAtual || (typeof produtoDetalheAtual !== "undefined" ? produtoDetalheAtual : null);
    if(!detalhe || !atual) return false;

    const ativo = detalhe.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo, .tamanho-btn.ativo");
    const tamanho = textoLimpoMS(detalhe.dataset.tamanho || ativo?.innerText);
    if(!tamanho){
      alert("Selecione um tamanho para adicionar este produto ao carrinho.");
      return false;
    }

    const qtd = Math.max(1, Number(window.quantidadeDetalhe || (typeof quantidadeDetalhe !== "undefined" ? quantidadeDetalhe : 1) || 1));
    const item = itemProntoMS({
      nome: atual.nome,
      preco: atual.preco,
      imagem: atual.img || atual.imagem,
      img: atual.img || atual.imagem,
      tamanho,
      cor: atual.cor || detalhe.dataset.cor || corPeloNomeMS(atual.nome),
      quantidade: qtd
    });

    if(!(await podeAdicionarMS(item, qtd))) return false;

    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }
    const idx = lista.findIndex(p => chaveItemMS(p) === chaveItemMS(item));
    if(idx >= 0) lista[idx].quantidade = Number(lista[idx].quantidade || 1) + item.quantidade;
    else lista.push(item);

    salvarEAtualizarMS(lista);
    if(typeof mostrarConfirmacaoCarrinhoMS === "function") mostrarConfirmacaoCarrinhoMS(item);
    else if(typeof avisoCarrinhoPremium === "function") avisoCarrinhoPremium(item);
    else if(typeof mostrarToastMS === "function") mostrarToastMS();
    return true;
  };

  window.aumentarQuantidade = async function(index){
    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }
    if(!lista[index]) return false;
    const item = itemProntoMS(lista[index]);
    if(!(await podeAdicionarMS(item, 1))) return false;
    lista[index].quantidade = Number(lista[index].quantidade || 1) + 1;
    salvarEAtualizarMS(lista);
    return true;
  };

  window.alterarQuantidadeMobile = function(index, valor){
    if(valor > 0) return window.aumentarQuantidade(index);
    if(typeof diminuirQuantidade === "function") return diminuirQuantidade(index);
  };

  const finalizarOriginalMS = window.finalizarCompra;
  window.finalizarCompra = async function(event){
    if(event){ event.preventDefault(); event.stopPropagation(); }
    let lista = [];
    try{ lista = JSON.parse(localStorage.getItem("carrinho")) || []; }catch(e){ lista = []; }
    if(!lista.length){
      alert("Seu carrinho está vazio. Adicione um produto para continuar.");
      return false;
    }

    try{
      const resp = await fetch(`${API_ESTOQUE_MS}/estoque/validar-carrinho`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({items: lista})
      });
      const dados = await resp.json().catch(() => ({}));
      if(!resp.ok){
        alert(dados.mensagem || "Estoque insuficiente para finalizar a compra.");
        return false;
      }
    }catch(erro){
      alert("Não consegui validar o estoque agora. Confira se o servidor está ligado.");
      console.error(erro);
      return false;
    }

    return finalizarOriginalMS ? finalizarOriginalMS.call(this, event) : false;
  };

  window.comprarAgoraDetalhe = async function(){
    const ok = await window.adicionarProdutoDetalhe();
    if(!ok) return false;
    if(typeof abrirCarrinhoMS === "function") abrirCarrinhoMS();
    else if(typeof abrirCarrinho === "function") abrirCarrinho();
    return false;
  };

  window.msConsultarEstoque = buscarDisponivelMS;
  console.log("Estoque online real conectado no cliente.");
})();


// MOBILE CHECKOUT MS - restaura dados digitados se o cliente voltar de etapa
document.addEventListener("DOMContentLoaded", () => {
  if (document.querySelector(".checkout-ms")) {
    restaurarDadosClienteMobileMS();
    atualizarCarrinho();
    atualizarTotaisMobile();
  }
});


// CATÁLOGO 100% VINDO DO POSTGRESQL -------------------------------------------
// O HTML antigo fica apenas como reserva. Quando a API responde, os cards da
// página são substituídos pelo catálogo salvo no painel administrativo.
(function(){
  const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://ms-matias-style.onrender.com';

  const esc = valor => String(valor ?? '').replace(/[&<>"']/g, caractere => ({
    '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'
  }[caractere]));

  const normalizar = valor => String(valor || '')
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .toLowerCase().replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const moeda = valor => Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency', currency: 'BRL'
  });

  const ORDEM_CATEGORIAS_MS = [
    'moletons',
    'calcas',
    'toucas',
    'jaquetas',
    'camisetas',
    'camisetas-basicas',
    'conjuntos'
  ];

  function informacoesCategoria(produto){
    const texto = String(produto?.categoria || 'Roupas').trim();
    const categoria = normalizar(texto);
    const nome = normalizar(produto?.nome || '');

    // O nome do produto desempata categorias cadastradas de forma genérica
    // ou com mais de um tipo, impedindo jaquetas de caírem em Moletons.
    if (nome.includes('jaqueta') || nome.includes('corta-vento')) return { id:'jaquetas', titulo:'Jaquetas MS', subtitulo:'COLEÇÃO' };
    if (nome.includes('moletom')) return { id:'moletons', titulo:'MOLETONS MS', subtitulo:'COLEÇÃO' };
    if (nome.includes('calca')) return { id:'calcas', titulo:'CALÇAS MS', subtitulo:'COLEÇÃO' };
    if (nome.includes('touca') || nome.includes('meia')) return { id:'toucas', titulo:'ACESSÓRIOS MS', subtitulo:'COLEÇÃO' };
    if (nome.includes('oversized')) return { id:'camisetas', titulo:'Camisetas Oversized', subtitulo:'COLEÇÃO' };
    if (nome.includes('basica')) return { id:'camisetas-basicas', titulo:'Camisetas Básicas', subtitulo:'COLEÇÃO' };
    if (nome.includes('conjunto')) return { id:'conjuntos', titulo:'Conjuntos MS', subtitulo:'COLEÇÃO' };

    if (categoria.includes('jaqueta') || categoria.includes('corta-vento')) return { id:'jaquetas', titulo:'Jaquetas MS', subtitulo:'COLEÇÃO' };
    if (categoria.includes('moletom')) return { id:'moletons', titulo:'MOLETONS MS', subtitulo:'COLEÇÃO' };
    if (categoria.includes('calca')) return { id:'calcas', titulo:'CALÇAS MS', subtitulo:'COLEÇÃO' };
    if (categoria.includes('acessor') || categoria.includes('touca') || categoria.includes('meia')) return { id:'toucas', titulo:'ACESSÓRIOS MS', subtitulo:'COLEÇÃO' };
    if (categoria.includes('oversized')) return { id:'camisetas', titulo:'Camisetas Oversized', subtitulo:'COLEÇÃO' };
    if (categoria.includes('basica')) return { id:'camisetas-basicas', titulo:'Camisetas Básicas', subtitulo:'COLEÇÃO' };
    if (categoria.includes('conjunto')) return { id:'conjuntos', titulo:'Conjuntos MS', subtitulo:'COLEÇÃO' };

    return {
      id: `categoria-${categoria || 'roupas'}`,
      titulo: texto,
      subtitulo: 'PRODUTOS'
    };
  }

  function fotosProduto(produto){
    const lista = Array.isArray(produto.imagens) ? produto.imagens : [];
    return [...new Set([produto.imagem, ...lista].map(v => String(v || '').trim()).filter(Boolean))];
  }

  function cardProduto(produto){
    const fotos = fotosProduto(produto);
    const fotoPrincipal = fotos[0] || 'logo.png';
    const fotoHover = fotos[1] || fotoPrincipal;
    const tamanhos = Array.isArray(produto.tamanhos) && produto.tamanhos.length
      ? produto.tamanhos : ['P','M','G','GG'];
    const cores = Array.isArray(produto.cores) ? produto.cores : [];
    const preco = Number(produto.preco || 0);
    const antigo = produto.precoAntigo == null ? null : Number(produto.precoAntigo);

    return `<div class="card-produto produto-banco-ms"
      data-id-banco="${produto.id}"
      data-chave="${esc(produto.chave || normalizar(produto.nome))}"
      data-nome="${esc(produto.nome)}"
      data-preco="${preco.toFixed(2)}"
      data-precoantigo="${antigo == null ? '' : antigo.toFixed(2)}"
      data-img="${esc(fotoPrincipal)}"
      data-fotos="${esc(fotos.join(','))}"
      data-descricao="${esc(produto.descricao || '')}"
      data-cores="${esc(cores.join(','))}"
      data-tamanhos="${esc(tamanhos.join(','))}">

      ${produto.promocao
        ? '<span class="selo-produto">PROMOÇÃO</span>'
        : produto.destaque ? '<span class="selo-produto">DESTAQUE</span>' : ''}

      <button class="btn-favorito" onclick="favoritarProduto(this,event)" aria-label="Favoritar produto">♡</button>

      <div class="produto-img" onclick="abrirProdutoDetalheCard(this.closest('.card-produto'))">
        <img src="${esc(fotoPrincipal)}" class="foto-normal" alt="${esc(produto.nome)}" onerror="this.src='logo.png'">
        <img src="${esc(fotoHover)}" class="foto-hover" alt="${esc(produto.nome)}" onerror="this.src='logo.png'">
      </div>

      <h3>${esc(produto.nome)}</h3>
      <div class="preco-box">
        ${antigo != null && antigo > preco ? `<span class="preco-antigo">${moeda(antigo)}</span>` : ''}
        <p class="preco">${moeda(preco)}</p>
        <span class="parcelamento">em até 5x sem juros</span>
      </div>

      <div class="tamanhos">
        ${tamanhos.map(tamanho => `<button type="button" onclick="selecionarTamanho(this,'${esc(tamanho)}')">${esc(tamanho)}</button>`).join('')}
      </div>

      <button
        type="button"
        class="btn-comprar"
        onclick="window.adicionarCarrinho(this)"
        data-nome="${esc(produto.nome)}"
        data-preco="${preco.toFixed(2)}"
        data-img="${esc(fotoPrincipal)}">
        <span>Adicionar ao carrinho</span>
        <span class="icone-btn-carrinho">🛒</span>
      </button>
    </div>`;
  }

  function montarCatalogo(produtos){
    const grupos = new Map();

    produtos.forEach(produto => {
      const info = informacoesCategoria(produto);
      if (!grupos.has(info.id)) grupos.set(info.id, { info, produtos: [] });
      grupos.get(info.id).produtos.push(produto);
    });

    const catalogo = document.createElement('div');
    catalogo.id = 'catalogoBancoMS';

    const gruposOrdenados = [...grupos.values()].sort((a, b) => {
      const posicaoA = ORDEM_CATEGORIAS_MS.indexOf(a.info.id);
      const posicaoB = ORDEM_CATEGORIAS_MS.indexOf(b.info.id);
      const ordemA = posicaoA === -1 ? ORDEM_CATEGORIAS_MS.length : posicaoA;
      const ordemB = posicaoB === -1 ? ORDEM_CATEGORIAS_MS.length : posicaoB;
      return ordemA - ordemB;
    });

    gruposOrdenados.forEach(({info, produtos: itens}) => {
      const secao = document.createElement('section');
      secao.className = 'produtos categoria-banco-ms';
      secao.id = info.id;
      secao.innerHTML = `
        <div class="titulo-section">
          <p>${esc(info.subtitulo)}</p>
          <h2>${esc(info.titulo)}</h2>
        </div>
        <div class="grid-produtos">${itens.map(cardProduto).join('')}</div>`;
      catalogo.appendChild(secao);
    });

    return catalogo;
  }

  async function carregarCatalogoBanco(){
    const secoesAntigas = [...document.querySelectorAll('section.produtos')];
    const primeiraSecao = secoesAntigas[0];
    if (!primeiraSecao) return;

    try {
      const resposta = await fetch(`${API}/produtos?ativos=true&t=${Date.now()}`, {
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      if (!resposta.ok) throw new Error(`API respondeu ${resposta.status}`);
      const produtos = await resposta.json();
      if (!Array.isArray(produtos)) throw new Error('Resposta de produtos inválida');

      const catalogo = montarCatalogo(produtos);
      primeiraSecao.parentNode.insertBefore(catalogo, primeiraSecao);
      secoesAntigas.forEach(secao => secao.remove());

      window.produtosBancoMS = produtos;
      document.dispatchEvent(new CustomEvent('catalogoMSCarregado', { detail: produtos }));
      console.log(`Catálogo PostgreSQL carregado: ${produtos.length} produto(s).`);
    } catch (erro) {
      console.warn('Banco indisponível. Mantendo o catálogo local como reserva.', erro.message);
    }
  }

  document.addEventListener('DOMContentLoaded', carregarCatalogoBanco);
})();


/* ===== ETAPA 2 - CONTROLE UNICO DOS CARDS ===== */
(function(){
  function ehControleInternoMS(alvo){
    return Boolean(alvo.closest(
      'button, a, .tamanhos, .tamanhos-detalhe, .detalhe-tamanhos, ' +
      '.btn-favorito, .avaliacao-produto, input, select, textarea'
    ));
  }

  document.addEventListener('click', function(evento){
    const card = evento.target.closest('.card-produto');
    if(!card || ehControleInternoMS(evento.target)) return;

    // Interrompe os vários listeners antigos para o detalhe não abrir duas vezes.
    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    // Produtos marcados como lançamento não devem abrir o modal.
    if(card.classList.contains('produto-em-breve')){
      if(typeof avisoCarrinhoPremium === 'function'){
        avisoCarrinhoPremium('Este produto será lançado em breve.');
      }
      return false;
    }

    // Normaliza dados antes de abrir, evitando foto ou nome de outro card.
    const titulo = card.querySelector('h3')?.innerText?.trim();
    const imagem = card.querySelector('.produto-img img, img.img-principal, img.foto-normal')?.getAttribute('src');
    if(!card.dataset.nome && titulo) card.dataset.nome = titulo;
    if(!card.dataset.img && imagem) card.dataset.img = imagem;

    if(typeof window.abrirProdutoDetalheCard === 'function'){
      window.abrirProdutoDetalheCard(card);
    }
    return false;
  }, true);
})();


/* =========================================================
   CORREÇÃO FINAL MS - NAVEGAÇÃO PRESA PELO CARRINHO
   Fecha todos os carrinhos/overlays antes de navegar e restaura
   a rolagem da página no computador e no celular.
   ========================================================= */
(function corrigirNavegacaoCarrinhoMS(){
  function fecharTudoDoCarrinhoMS(){
    const seletores = [
      '#carrinho',
      '#carrinhoMobile',
      '#carrinhoMobileMS',
      '#checkoutMobile',
      '.checkout-mobile',
      '.carrinho-mobile',
      '.carrinho-lateral',
      '.modal-carrinho'
    ];

    document.querySelectorAll(seletores.join(',')).forEach(function(elemento){
      elemento.classList.remove('ativo', 'aberto', 'open', 'mostrar');

      // Remove estilos colocados por versões antigas do carrinho.
      elemento.style.removeProperty('display');
      elemento.style.removeProperty('right');
      elemento.style.removeProperty('z-index');
      elemento.style.removeProperty('transform');
      elemento.style.removeProperty('pointer-events');
    });

    document.querySelectorAll('#fundoCarrinho, .fundo-carrinho, .overlay-carrinho, .carrinho-overlay').forEach(function(fundo){
      fundo.classList.remove('ativo', 'aberto', 'open', 'mostrar');
      fundo.style.removeProperty('display');
      fundo.style.removeProperty('z-index');
      fundo.style.removeProperty('pointer-events');
    });

    document.documentElement.style.removeProperty('overflow');
    document.documentElement.style.removeProperty('position');
    document.body.style.removeProperty('overflow');
    document.body.style.removeProperty('position');
    document.body.style.removeProperty('width');
    document.body.classList.remove('sem-scroll', 'no-scroll', 'modal-aberto', 'carrinho-aberto');

    // Fecha também menu e detalhe para evitar camadas invisíveis.
    document.querySelector('nav.menu')?.classList.remove('ativo');
    document.getElementById('produtoDetalhe')?.classList.remove('ativo');
  }

  // Mantém compatibilidade com todos os nomes usados no arquivo antigo.
  window.fecharTudoDoCarrinhoMS = fecharTudoDoCarrinhoMS;
  window.fecharCarrinhoMS = fecharTudoDoCarrinhoMS;
  window.fecharCarrinhoMobile = fecharTudoDoCarrinhoMS;
  window.fecharCarrinhoMobileNovo = fecharTudoDoCarrinhoMS;

  document.addEventListener('click', function(evento){
    const link = evento.target.closest('header a, nav.menu a, .menu-mobile a, a[href^="#"], a[href="index.html"], a[href^="index.html#"]');
    if(!link) return;

    fecharTudoDoCarrinhoMS();

    const href = link.getAttribute('href') || '';
    if(href.startsWith('#') && href.length > 1){
      const destino = document.querySelector(href);
      if(destino){
        evento.preventDefault();
        setTimeout(function(){
          destino.scrollIntoView({behavior: 'smooth', block: 'start'});
          history.replaceState(null, '', href);
        }, 20);
      }
    }
  }, true);

  document.addEventListener('keydown', function(evento){
    if(evento.key === 'Escape') fecharTudoDoCarrinhoMS();
  });

  window.addEventListener('pageshow', fecharTudoDoCarrinhoMS);
  window.addEventListener('popstate', fecharTudoDoCarrinhoMS);
})();

/* =========================================================
   MS MATIAS STYLE - CONFIRMAÇÃO PREMIUM AO ADICIONAR PRODUTO
   Exibe nome, tamanho e dois botões: continuar ou finalizar.
   ========================================================= */
(function instalarConfirmacaoCarrinhoMS(){
  if (/\/carrinho(?:\.html)?$/i.test(location.pathname)) {
    document.addEventListener("DOMContentLoaded", function(){
      document.getElementById("msConfirmacaoCarrinho")?.remove();
    });
    return;
  }
  const STYLE_ID = "ms-confirmacao-carrinho-style";
  const TOAST_ID = "msConfirmacaoCarrinho";

  function escaparHTMLMS(valor){
    return String(valor ?? "").replace(/[&<>'"]/g, function(caractere){
      return ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        "'": "&#39;",
        '"': "&quot;"
      })[caractere];
    });
  }

  function garantirEstiloMS(){
    if(document.getElementById(STYLE_ID)) return;

    const style = document.createElement("style");
    style.id = STYLE_ID;
    style.textContent = `
      #${TOAST_ID}{
        position:fixed;
        top:22px;
        right:22px;
        z-index:2147483646;
        width:min(390px,calc(100vw - 28px));
        background:#101010;
        color:#fff;
        border:1px solid rgba(212,175,55,.75);
        border-radius:18px;
        box-shadow:0 22px 70px rgba(0,0,0,.55);
        padding:18px;
        opacity:0;
        visibility:hidden;
        transform:translateX(calc(100% + 36px));
        transition:transform .32s ease,opacity .25s ease,visibility .25s ease;
        font-family:inherit;
      }
      #${TOAST_ID}.ativo{
        opacity:1;
        visibility:visible;
        transform:translateX(0);
      }
      #${TOAST_ID} .ms-confirmacao-topo{
        display:flex;
        align-items:flex-start;
        gap:12px;
      }
      #${TOAST_ID} .ms-confirmacao-icone{
        width:42px;
        height:42px;
        flex:0 0 42px;
        display:grid;
        place-items:center;
        border-radius:50%;
        background:rgba(212,175,55,.12);
        border:1px solid rgba(212,175,55,.55);
        font-size:20px;
      }
      #${TOAST_ID} .ms-confirmacao-conteudo{min-width:0;flex:1;}
      #${TOAST_ID} .ms-confirmacao-titulo{
        display:block;
        margin:0 28px 5px 0;
        color:#d4af37;
        font-size:17px;
        line-height:1.25;
      }
      #${TOAST_ID} .ms-confirmacao-produto{
        margin:0;
        color:#fff;
        font-size:15px;
        line-height:1.45;
        overflow-wrap:anywhere;
      }
      #${TOAST_ID} .ms-confirmacao-detalhe{
        margin:4px 0 0;
        color:#bdbdbd;
        font-size:13px;
      }
      #${TOAST_ID} .ms-confirmacao-fechar{
        position:absolute;
        top:12px;
        right:12px;
        width:30px;
        height:30px;
        border:0;
        border-radius:50%;
        background:transparent;
        color:#aaa;
        cursor:pointer;
        font-size:20px;
        line-height:1;
      }
      #${TOAST_ID} .ms-confirmacao-fechar:hover{color:#fff;background:rgba(255,255,255,.07);}
      #${TOAST_ID} .ms-confirmacao-acoes{
        display:grid;
        grid-template-columns:1fr 1fr;
        gap:10px;
        margin-top:16px;
      }
      #${TOAST_ID} .ms-confirmacao-btn{
        min-height:44px;
        border-radius:11px;
        padding:10px 12px;
        font:inherit;
        font-size:13px;
        font-weight:700;
        cursor:pointer;
        transition:transform .18s ease,background .18s ease,color .18s ease,border-color .18s ease;
      }
      #${TOAST_ID} .ms-confirmacao-btn:hover{transform:translateY(-1px);}
      #${TOAST_ID} .ms-confirmacao-continuar{
        color:#fff;
        background:transparent;
        border:1px solid rgba(255,255,255,.22);
      }
      #${TOAST_ID} .ms-confirmacao-continuar:hover{border-color:#d4af37;color:#d4af37;}
      #${TOAST_ID} .ms-confirmacao-finalizar{
        color:#111;
        background:#d4af37;
        border:1px solid #d4af37;
      }
      #${TOAST_ID} .ms-confirmacao-finalizar:hover{background:#ebc94e;border-color:#ebc94e;}
      .btn-carrinho.ms-pulso-carrinho{animation:msPulsoCarrinho .48s ease;}
      @keyframes msPulsoCarrinho{
        0%,100%{transform:scale(1)}
        45%{transform:scale(1.18)}
      }
      @media(max-width:600px){
        #${TOAST_ID}{
          top:auto;
          right:14px;
          bottom:16px;
          left:14px;
          width:auto;
          transform:translateY(calc(100% + 32px));
          padding:17px;
        }
        #${TOAST_ID}.ativo{transform:translateY(0);}
        #${TOAST_ID} .ms-confirmacao-acoes{grid-template-columns:1fr;}
      }
    `;
    document.head.appendChild(style);
  }

  function fecharConfirmacaoCarrinhoMS(){
    const toast = document.getElementById(TOAST_ID);
    if(toast) toast.classList.remove("ativo");
    clearTimeout(window.msConfirmacaoCarrinhoTimer);
  }

  function abrirCarrinhoPeloToastMS(){
    fecharConfirmacaoCarrinhoMS();

    if(typeof window.abrirCarrinhoResponsivoMS === "function"){
      window.abrirCarrinhoResponsivoMS();
      return;
    }
    if(typeof window.abrirCarrinhoMS === "function"){
      window.abrirCarrinhoMS();
      return;
    }
    if(typeof window.abrirCarrinho === "function"){
      window.abrirCarrinho();
    }
  }

  function mostrarConfirmacaoCarrinhoMS(item){
    if(!document.body) return;
    garantirEstiloMS();

    let toast = document.getElementById(TOAST_ID);
    if(!toast){
      toast = document.createElement("aside");
      toast.id = TOAST_ID;
      toast.setAttribute("role", "status");
      toast.setAttribute("aria-live", "polite");
      document.body.appendChild(toast);
    }

    const nome = escaparHTMLMS(item?.nome || "Produto MS");
    const tamanho = escaparHTMLMS(item?.tamanho || "");
    const quantidade = Math.max(1, Number(item?.quantidade || 1));

    toast.innerHTML = `
      <button class="ms-confirmacao-fechar" type="button" aria-label="Fechar">×</button>
      <div class="ms-confirmacao-topo">
        <div class="ms-confirmacao-icone" aria-hidden="true">🛍️</div>
        <div class="ms-confirmacao-conteudo">
          <strong class="ms-confirmacao-titulo">Adicionado ao carrinho!</strong>
          <p class="ms-confirmacao-produto">${nome} foi adicionado com sucesso.</p>
          ${tamanho ? `<p class="ms-confirmacao-detalhe">Tamanho: ${tamanho}${quantidade > 1 ? ` · Quantidade: ${quantidade}` : ""}</p>` : ""}
        </div>
      </div>
      <div class="ms-confirmacao-acoes">
        <button class="ms-confirmacao-btn ms-confirmacao-continuar" type="button">Continuar comprando</button>
        <button class="ms-confirmacao-btn ms-confirmacao-finalizar" type="button">Finalizar pedido</button>
      </div>
    `;

    toast.querySelector(".ms-confirmacao-fechar")?.addEventListener("click", fecharConfirmacaoCarrinhoMS);
    toast.querySelector(".ms-confirmacao-continuar")?.addEventListener("click", fecharConfirmacaoCarrinhoMS);
    toast.querySelector(".ms-confirmacao-finalizar")?.addEventListener("click", abrirCarrinhoPeloToastMS);

    requestAnimationFrame(function(){
      toast.classList.add("ativo");
    });

    const botaoCarrinho = document.querySelector("header .btn-carrinho, .btn-carrinho");
    if(botaoCarrinho){
      botaoCarrinho.classList.remove("ms-pulso-carrinho");
      void botaoCarrinho.offsetWidth;
      botaoCarrinho.classList.add("ms-pulso-carrinho");
      setTimeout(function(){ botaoCarrinho.classList.remove("ms-pulso-carrinho"); }, 520);
    }

    clearTimeout(window.msConfirmacaoCarrinhoTimer);
    window.msConfirmacaoCarrinhoTimer = setTimeout(fecharConfirmacaoCarrinhoMS, 8000);
  }

  // Mantém o nome antigo funcionando para outras partes do projeto.
  window.avisoCarrinhoPremium = function(textoOuItem){
    if(textoOuItem && typeof textoOuItem === "object"){
      mostrarConfirmacaoCarrinhoMS(textoOuItem);
    }else{
      mostrarConfirmacaoCarrinhoMS({ nome: "Seu produto", tamanho: "", quantidade: 1 });
    }
  };
  window.mostrarConfirmacaoCarrinhoMS = mostrarConfirmacaoCarrinhoMS;
  window.fecharConfirmacaoCarrinhoMS = fecharConfirmacaoCarrinhoMS;

  // A confirmação visual não substitui as funções de adicionar.
  // Assim, toda inclusão continua passando pela validação real de estoque.

})();

// =====================================================
// CORREÇÃO DEFINITIVA: CEP E FRETE DO CARRINHO INTERNO MOBILE
// =====================================================
(function corrigirFreteCarrinhoMobileMS() {
  const obterCampo = (...ids) => {
    for (const id of ids) {
      const elemento = document.getElementById(id);
      if (elemento) return elemento;
    }
    return null;
  };

  window.buscarEnderecoCheckout = async function buscarEnderecoCheckoutMS() {
    const cepInput = obterCampo("cepCheckout", "cepCliente");
    if (!cepInput) return;

    const cep = String(cepInput.value || "").replace(/\D/g, "");
    if (cep.length !== 8) return;

    try {
      const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      if (!resposta.ok) throw new Error(`ViaCEP respondeu ${resposta.status}`);

      const dados = await resposta.json();
      if (dados.erro) {
        alert("Não encontramos esse CEP. Confira os números e tente novamente.");
        return;
      }

      const rua = obterCampo("ruaClienteMobile", "ruaCliente");
      const bairro = obterCampo("bairroClienteMobile", "bairroCliente");
      const cidade = obterCampo("cidadeClienteMobile", "cidadeCliente");
      const estado = obterCampo("estadoClienteMobile", "estadoCliente");

      if (rua) rua.value = dados.logradouro || "";
      if (bairro) bairro.value = dados.bairro || "";
      if (cidade) cidade.value = dados.localidade || "";
      if (estado) estado.value = dados.uf || "";
    } catch (erro) {
      console.error("Erro ao consultar CEP:", erro);
      alert("Não foi possível localizar o endereço agora. Tente novamente em instantes.");
    }
  };

  window.calcularFreteCheckout = async function calcularFreteCheckoutMS() {
    const cepInput = obterCampo("cepCheckout", "cepCliente");
    const container = document.getElementById("opcoesFreteCheckout");

    if (!cepInput || !container) {
      alert("Não foi possível carregar o cálculo de entrega. Atualize a página e tente novamente.");
      return;
    }

    const cep = String(cepInput.value || "").replace(/\D/g, "");
    if (cep.length !== 8) {
      alert("Informe um CEP válido com 8 números para calcular a entrega.");
      return;
    }

    container.innerHTML = '<p class="frete-carregando-ms">Calculando opções de entrega...</p>';

    try {
      await window.buscarEnderecoCheckout();

      const resposta = await fetch(`${API_BASE}/calcular-frete`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cep, items: itensParaCalculoFreteMS() })
      });

      let dados;
      try {
        dados = await resposta.json();
      } catch (_) {
        throw new Error("O servidor devolveu uma resposta inválida.");
      }

      if (!resposta.ok) {
        throw new Error(dados?.mensagem || dados?.message || "Falha ao calcular o frete.");
      }

      const lista = Array.isArray(dados)
        ? dados
        : Array.isArray(dados?.fretes)
          ? dados.fretes
          : Array.isArray(dados?.data)
            ? dados.data
            : [];

      const opcoes = lista.filter((frete) => {
        if (!frete || frete.error) return false;
        const empresa = String(frete.company?.name || frete.empresa || "").toLowerCase();
        const servico = String(frete.name || frete.nome || "").toLowerCase();
        return servico.includes("pac") || servico.includes("sedex") ||
          (empresa.includes("jadlog") && servico.includes("package") && !servico.includes("centralizado"));
      });

      if (!opcoes.length) {
        container.innerHTML = '<p class="frete-vazio-ms">Nenhuma opção de entrega foi encontrada para esse CEP.</p>';
        return;
      }

      function adicionarDiasUteis(dataInicial, quantidade) {
        const data = new Date(dataInicial);
        let adicionados = 0;
        while (adicionados < Math.max(0, quantidade)) {
          data.setDate(data.getDate() + 1);
          const dia = data.getDay();
          if (dia !== 0 && dia !== 6) adicionados++;
        }
        return data;
      }

      function dataEntregaFormatada(prazo) {
        const data = adicionarDiasUteis(new Date(), Math.max(1, Number(prazo) || 1));
        return new Intl.DateTimeFormat("pt-BR", {
          day: "2-digit", month: "2-digit", weekday: "short"
        }).format(data).replace(".", "");
      }

      const opcoesOrdenadas = opcoes
        .map((frete) => ({
          frete,
          preco: Number(String(frete.price ?? frete.preco ?? 0).replace(",", ".")),
          prazo: Number(frete.delivery_time ?? frete.prazo ?? 0)
        }))
        .filter((item) => Number.isFinite(item.preco) && item.preco > 0)
        .sort((a, b) => a.preco - b.preco);

      const menorPreco = Math.min(...opcoesOrdenadas.map((item) => item.preco));
      const menorPrazo = Math.min(...opcoesOrdenadas.map((item) => item.prazo || 9999));

      container.innerHTML = "";
      opcoesOrdenadas.forEach(({ frete, preco, prazo }) => {
        const empresa = frete.company?.name || frete.empresa || "Transportadora";
        const servico = frete.name || frete.nome || "Entrega";
        const badges = [];
        if (preco === menorPreco) badges.push('<em class="frete-badge-ms">Melhor preço</em>');
        if (prazo === menorPrazo) badges.push('<em class="frete-badge-ms rapido">Mais rápido</em>');

        const opcao = document.createElement("button");
        opcao.type = "button";
        opcao.className = "frete-opcao frete-opcao-data-ms";
        opcao.innerHTML = `
          <span class="frete-dados-ms">
            <span class="frete-badges-ms">${badges.join("")}</span>
            <strong>${empresa} - ${servico}</strong>
            <small>Previsão após postagem: <b>${dataEntregaFormatada(prazo)}</b></small>
            <small>Prazo informado: ${prazo || "-"} dias úteis</small>
          </span>
          <strong>${preco.toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}</strong>
        `;

        opcao.addEventListener("click", () => {
          container.querySelectorAll(".frete-opcao").forEach((item) => item.classList.remove("selecionado"));
          opcao.classList.add("selecionado");

          freteSelecionado = { nome: `${empresa} - ${servico}`, preco, prazo };
          valorFrete = preco;
          window.valorFrete = preco;
          localStorage.setItem("valorFreteMS", String(preco));
          localStorage.setItem("freteSelecionadoMS", JSON.stringify(freteSelecionado));

          if (typeof atualizarTotais === "function") atualizarTotais();
          if (typeof atualizarResumoPagamentoMS === "function") atualizarResumoPagamentoMS();
        });

        container.appendChild(opcao);
      });

      if (!container.children.length) {
        container.innerHTML = '<p class="frete-vazio-ms">Nenhuma opção de entrega válida foi encontrada.</p>';
      }
    } catch (erro) {
      console.error("Erro ao calcular frete mobile:", erro);
      container.innerHTML = `<p class="frete-erro-ms">${String(erro.message || "Não foi possível calcular a entrega.")}</p>`;
    }
  };
})();

/* =========================================================
   PIX DENTRO DA LOJA - MS MATIAS STYLE
   Este bloco é o controlador final do pagamento.
   ========================================================= */
(function(){
  let msPixTimer = null;

  function apiMS(){
    if (["localhost","127.0.0.1"].includes(location.hostname)) return "http://127.0.0.1:3000";
    return window.API_BASE || (typeof API_BASE !== "undefined" ? API_BASE : "https://ms-matias-style.onrender.com");
  }
  function campoMS(){
    for (const id of arguments){ const el=document.getElementById(id); if(el && String(el.value||"").trim()) return String(el.value).trim(); }
    return "";
  }
  function clienteMS(){
    let salvo={}; try{ salvo=JSON.parse(localStorage.getItem("dadosClienteMS")||"{}"); }catch(e){}
    return {
      nome:campoMS("nomeClienteMobile","nomeCliente","customerName")||salvo.nome||"",
      telefone:campoMS("telefoneClienteMobile","telefoneCliente","customerPhone","whatsappCliente")||salvo.telefone||salvo.whatsapp||"",
      email:campoMS("emailClienteMobile","emailCliente","customerEmail")||salvo.email||"",
      cep:campoMS("cepCheckout","cepCliente","zip")||salvo.cep||"",
      rua:campoMS("ruaCliente","ruaCheckout","street")||salvo.rua||"",
      numero:campoMS("numeroCasa","numeroCliente","numeroCheckout","number")||salvo.numero||"",
      complemento:campoMS("complementoCliente","complementoCheckout","complement")||salvo.complemento||"",
      bairro:campoMS("bairroCliente","bairroCheckout","district")||salvo.bairro||"",
      cidade:campoMS("cidadeCliente","cidadeCheckout","city")||salvo.cidade||"",
      estado:campoMS("estadoCliente","estadoCheckout","state")||salvo.estado||""
    };
  }
  function itensMS(lista){ return (lista||[]).map(i=>({nome:i.nome||i.title||"Produto MS",preco:Number(i.preco||i.unit_price||0),quantidade:Number(i.quantidade||i.quantity||1),tamanho:i.tamanho||"",imagem:i.imagem||i.img||""})); }
  function dinheiroMS(v){ return Number(v||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"}); }

  function garantirModalMS(){
    let modal=document.getElementById("msPixModal"); if(modal) return modal;
    modal=document.createElement("div"); modal.id="msPixModal";
    modal.innerHTML=`<div class="ms-pix-caixa">
      <button class="ms-pix-fechar" type="button" aria-label="Fechar">×</button>
      <div class="ms-pix-logo">MS</div>
      <h2 id="msPixTitulo">Pague com PIX</h2>
      <p id="msPixTexto">Estamos gerando seu código seguro...</p>
      <div id="msPixCarregando" class="ms-pix-loader"></div>
      <img id="msPixQr" alt="QR Code PIX" hidden>
      <strong id="msPixValor"></strong>
      <textarea id="msPixCodigo" readonly hidden></textarea>
      <button id="msPixCopiar" class="ms-pix-copiar" type="button" hidden>Copiar código PIX</button>
      <div id="msPixStatus" class="ms-pix-status">Aguardando pagamento...</div>
      <p class="ms-pix-aviso">Esta tela confirma automaticamente. Não precisa trocar de aba.</p>
    </div>`;
    document.body.appendChild(modal);
    const css=document.createElement("style"); css.textContent=`
      #msPixModal{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif}
      .ms-pix-caixa{width:min(430px,100%);max-height:94vh;overflow:auto;background:#fff;color:#151515;border-radius:22px;padding:25px;text-align:center;box-shadow:0 25px 80px rgba(0,0,0,.45);position:relative}
      .ms-pix-fechar{position:absolute;right:13px;top:10px;border:0;background:transparent;font-size:30px;cursor:pointer}.ms-pix-logo{width:58px;height:58px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;margin:0 auto 12px;font-weight:800;font-size:20px}
      .ms-pix-caixa h2{margin:5px 0 8px}.ms-pix-caixa p{line-height:1.4}.ms-pix-loader{width:38px;height:38px;border:4px solid #ddd;border-top-color:#111;border-radius:50%;animation:msrodar .8s linear infinite;margin:25px auto}@keyframes msrodar{to{transform:rotate(360deg)}}
      #msPixQr{width:230px;max-width:80%;margin:12px auto;display:block}#msPixQr[hidden]{display:none}#msPixValor{display:block;font-size:22px;margin:8px}
      #msPixCodigo{width:100%;height:74px;resize:none;border:1px solid #ddd;border-radius:10px;padding:10px;font-size:12px;box-sizing:border-box}.ms-pix-copiar{width:100%;border:0;border-radius:12px;padding:14px;background:#111;color:#fff;font-weight:700;cursor:pointer;margin-top:10px}.ms-pix-status{margin-top:16px;padding:12px;background:#f3f3f3;border-radius:10px;font-weight:700}.ms-pix-aviso{font-size:12px;color:#666;margin-bottom:0}.ms-pix-ok{font-size:60px;margin:12px}.ms-pix-sucesso{background:#eaf8ef!important;color:#12652f}
    `; document.head.appendChild(css);
    modal.querySelector(".ms-pix-fechar").onclick=()=>{ modal.style.display="none"; };
    document.getElementById("msPixCopiar").onclick=async()=>{ const c=document.getElementById("msPixCodigo").value; try{await navigator.clipboard.writeText(c);}catch(e){document.getElementById("msPixCodigo").select();document.execCommand("copy");} document.getElementById("msPixCopiar").textContent="Código copiado ✓"; };
    return modal;
  }

  function mostrarPixMS(d){
    const modal=garantirModalMS(); modal.style.display="flex";
    document.getElementById("msPixCarregando").hidden=true;
    document.getElementById("msPixTexto").textContent=`Pedido #${d.pedido}. Escaneie o QR Code ou copie o código.`;
    document.getElementById("msPixValor").textContent=dinheiroMS(d.total);
    const img=document.getElementById("msPixQr");
    if(d.qr_code_base64){ img.src=`data:image/png;base64,${d.qr_code_base64}`; img.hidden=false; }
    document.getElementById("msPixCodigo").value=d.qr_code; document.getElementById("msPixCodigo").hidden=false;
    document.getElementById("msPixCopiar").hidden=false;
    localStorage.setItem("msUltimoPedidoId",String(d.pedido));
    acompanharMS(d.pedido);
  }

  function sucessoMS(pedido){
    clearInterval(msPixTimer);
    const caixa=document.querySelector("#msPixModal .ms-pix-caixa");
    const agora=new Date();
    const dataHora=agora.toLocaleDateString("pt-BR")+" às "+agora.toLocaleTimeString("pt-BR",{hour:"2-digit",minute:"2-digit"});
    caixa.classList.add("ms-confirmacao-premium");
    caixa.innerHTML=`
      <div class="ms-sucesso-brilho" aria-hidden="true"></div>
      <div class="ms-sucesso-icone" aria-hidden="true"><span>✓</span></div>
      <h2>Pagamento confirmado!</h2>
      <p class="ms-sucesso-subtitulo">Seu pedido foi recebido com sucesso.</p>
      <div class="ms-sucesso-dados">
        <div class="ms-sucesso-dado">
          <span class="ms-sucesso-mini-icone">▣</span>
          <div><small>Pedido</small><strong>#${pedido}</strong></div>
        </div>
        <div class="ms-sucesso-divisor"></div>
        <div class="ms-sucesso-dado">
          <span class="ms-sucesso-mini-icone">◷</span>
          <div><small>Data</small><strong>${dataHora}</strong></div>
        </div>
      </div>
      <div class="ms-sucesso-aviso">
        <span>✓</span>
        <p>Seu pagamento foi aprovado. Agora vamos separar seu pedido e avisar você sobre as próximas etapas.</p>
      </div>
      <button class="ms-sucesso-botao" type="button" onclick="localStorage.removeItem('carrinho');localStorage.removeItem('carrinhoMS');location.href='index.html'">Voltar para a loja</button>
      <p class="ms-sucesso-seguranca">Compra processada com segurança</p>`;
    try{ localStorage.removeItem("carrinho"); localStorage.removeItem("carrinhoMS"); }catch(e){}
  }
  async function consultarMS(pedido){
    try{ const r=await fetch(`${apiMS()}/pagamento/status/${encodeURIComponent(pedido)}?t=${Date.now()}`,{cache:"no-store"}); if(!r.ok)return; const d=await r.json(); const st=String(d.status||d.pagamento?.status||"").toLowerCase();
      if(st==="pago"||st==="approved") return sucessoMS(pedido);
      if(["recusado","rejected","cancelado","cancelled"].includes(st)){ clearInterval(msPixTimer); document.getElementById("msPixStatus").textContent="Pagamento não aprovado. Gere um novo PIX."; return; }
      document.getElementById("msPixStatus").textContent="Aguardando confirmação do PIX...";
    }catch(e){}
  }
  function acompanharMS(pedido){ clearInterval(msPixTimer); consultarMS(pedido); msPixTimer=setInterval(()=>consultarMS(pedido),3000); }

  async function pagarPixDentroDaLoja(event){
    if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}
    try{
      if(typeof carregarCarrinho==="function") carregarCarrinho();
      let lista=[]; try{lista=JSON.parse(localStorage.getItem("carrinho")||"[]");}catch(e){}
      if(!lista.length && typeof carrinho!=="undefined" && Array.isArray(carrinho)) lista=carrinho;
      if(!lista.length){alert("Seu carrinho está vazio.");return false;}
      const c=clienteMS(), tipo=localStorage.getItem("tipoEntregaMS")||"entrega", retirada=tipo==="retirada";
      if(!c.nome||!c.telefone){alert("Informe nome completo e WhatsApp antes de pagar.");return false;}
      if(!retirada&&(!c.cep||!c.rua||!c.numero||!c.bairro||!c.cidade||!c.estado)){alert("Preencha o endereço completo antes de pagar.");return false;}
      const modal=garantirModalMS(); modal.style.display="flex";
      const r=await fetch(`${apiMS()}/criar-pagamento-pix`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({tipoEntrega:tipo,retiradaLocal:retirada,items:itensMS(lista),nome:c.nome,telefone:c.telefone,email:c.email,cep:c.cep,rua:c.rua,numero:c.numero,complemento:c.complemento,bairro:c.bairro,cidade:c.cidade,estado:c.estado,cliente:c,endereco:c,valorFrete:Number(window.valorFrete||((typeof valorFrete!=="undefined")?valorFrete:0)||localStorage.getItem("valorFreteMS")||0),freteSelecionado:window.freteSelecionado||((typeof freteSelecionado!=="undefined")?freteSelecionado:null),codigoCupom:(typeof codigoCupomAplicadoMS!=="undefined"?codigoCupomAplicadoMS:"")})});
      const d=await r.json(); if(!r.ok) throw new Error(d.mensagem||"Não foi possível gerar o PIX."); mostrarPixMS(d); return false;
    }catch(e){ const m=document.getElementById("msPixModal"); if(m)m.style.display="none"; alert(e.message||"Não foi possível gerar o PIX."); return false; }
  }

  function dadosPagamentoMS(){
    if(typeof carregarCarrinho==="function") carregarCarrinho();
    let lista=[]; try{lista=JSON.parse(localStorage.getItem("carrinho")||"[]");}catch(e){}
    if(!lista.length && typeof carrinho!=="undefined" && Array.isArray(carrinho)) lista=carrinho;
    const c=clienteMS(), tipo=localStorage.getItem("tipoEntregaMS")||"entrega", retirada=tipo==="retirada";
    return {lista,c,tipo,retirada,payload:{tipoEntrega:tipo,retiradaLocal:retirada,items:itensMS(lista),nome:c.nome,telefone:c.telefone,email:c.email,cep:c.cep,rua:c.rua,numero:c.numero,complemento:c.complemento,bairro:c.bairro,cidade:c.cidade,estado:c.estado,cliente:c,endereco:c,valorFrete:Number(window.valorFrete||((typeof valorFrete!=="undefined")?valorFrete:0)||localStorage.getItem("valorFreteMS")||0),freteSelecionado:window.freteSelecionado||((typeof freteSelecionado!=="undefined")?freteSelecionado:null),codigoCupom:(typeof codigoCupomAplicadoMS!=="undefined"?codigoCupomAplicadoMS:(localStorage.getItem("codigoCupomAplicadoMS")||""))}};
  }

  function validarAntesPagamentoMS(d){
    if(!d.lista.length){alert("Seu carrinho está vazio.");return false;}
    if(!d.c.nome||!d.c.telefone){alert("Informe nome completo e WhatsApp antes de pagar.");return false;}
    if(!d.retirada&&(!d.c.cep||!d.c.rua||!d.c.numero||!d.c.bairro||!d.c.cidade||!d.c.estado)){alert("Preencha o endereço completo antes de pagar.");return false;}
    return true;
  }

  async function pagarCartaoOutrosMS(){
    const d=dadosPagamentoMS(); if(!validarAntesPagamentoMS(d)) return false;
    try{
      const r=await fetch(`${apiMS()}/criar-pagamento`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d.payload)});
      const resp=await r.json(); if(!r.ok) throw new Error(resp.mensagem||"Não foi possível abrir as opções de pagamento.");
      if(!resp.init_point) throw new Error("O Mercado Pago não retornou o checkout.");
      window.location.href=resp.init_point;
    }catch(e){ alert(e.message||"Não foi possível abrir o pagamento."); }
    return false;
  }

  function abrirEscolhaPagamentoMS(event){
    if(event){event.preventDefault();event.stopPropagation();event.stopImmediatePropagation?.();}
    const d=dadosPagamentoMS(); if(!validarAntesPagamentoMS(d)) return false;
    let modal=document.getElementById("msEscolhaPagamento");
    if(!modal){
      modal=document.createElement("div"); modal.id="msEscolhaPagamento";
      modal.innerHTML=`<div class="ms-escolha-caixa"><button type="button" class="ms-escolha-fechar">×</button><div class="ms-pix-logo">MS</div><h2>Escolha como pagar</h2><p>Selecione uma opção para continuar.</p><button type="button" class="ms-opcao-pagamento ms-opcao-cartao"><strong>💳 Cartão e outras opções</strong><span>Crédito, débito e opções disponíveis no Mercado Pago</span></button><button type="button" class="ms-opcao-pagamento ms-opcao-pix"><strong>◆ PIX</strong><span>Gerar QR Code e confirmar nesta tela</span></button></div>`;
      document.body.appendChild(modal);
      const css=document.createElement("style"); css.textContent=`#msEscolhaPagamento{position:fixed;inset:0;background:rgba(0,0,0,.82);z-index:2147483647;display:flex;align-items:center;justify-content:center;padding:18px;font-family:Arial,sans-serif}.ms-escolha-caixa{width:min(440px,100%);background:#fff;color:#151515;border-radius:22px;padding:26px;position:relative;text-align:center}.ms-escolha-fechar{position:absolute;right:14px;top:10px;border:0;background:none;font-size:30px;cursor:pointer}.ms-opcao-pagamento{width:100%;border:1px solid #ddd;background:#fff;border-radius:14px;padding:16px;margin-top:12px;text-align:left;cursor:pointer;display:flex;flex-direction:column;gap:5px}.ms-opcao-pagamento:hover{border-color:#111;background:#f7f7f7}.ms-opcao-pagamento strong{font-size:16px}.ms-opcao-pagamento span{font-size:13px;color:#666}`; document.head.appendChild(css);
      modal.querySelector(".ms-escolha-fechar").onclick=()=>modal.style.display="none";
      modal.querySelector(".ms-opcao-pix").onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();modal.style.display="none";pagarPixDentroDaLoja(ev);};
      modal.querySelector(".ms-opcao-cartao").onclick=(ev)=>{ev.preventDefault();ev.stopPropagation();modal.style.display="none";pagarCartaoOutrosMS();};
    }
    modal.style.display="flex"; return false;
  }

  // Deixa as ações acessíveis e garante o toque no mobile, mesmo quando outro
  // listener global tenta capturar o clique do botão de pagamento.
  window.msPagarCartaoOutros = pagarCartaoOutrosMS;
  window.msPagarPixDentroDaLoja = pagarPixDentroDaLoja;
  document.addEventListener("click",function(e){
    const cartao=e.target.closest("#msEscolhaPagamento .ms-opcao-cartao");
    if(cartao){
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.();
      const modal=document.getElementById("msEscolhaPagamento");
      if(modal) modal.style.display="none";
      pagarCartaoOutrosMS();
      return;
    }
    const pix=e.target.closest("#msEscolhaPagamento .ms-opcao-pix");
    if(pix){
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation?.();
      const modal=document.getElementById("msEscolhaPagamento");
      if(modal) modal.style.display="none";
      pagarPixDentroDaLoja(e);
    }
  },true);

  window.finalizarCompra=abrirEscolhaPagamentoMS; window.finalizarCompraFinal=abrirEscolhaPagamentoMS; window.finalizarPagamento=abrirEscolhaPagamentoMS; window.pagarMercadoPago=abrirEscolhaPagamentoMS; window.msFinalizarPagamento=abrirEscolhaPagamentoMS;
  document.addEventListener("click",function(e){ const b=e.target.closest("button,a,input[type=button],input[type=submit]"); if(!b)return; if(b.closest("#msEscolhaPagamento")) return; const t=String(b.innerText||b.value||b.id||b.className||"").toLowerCase(); if((t.includes("pagar")||t.includes("finalizar pedido")||t.includes("mercado pago")||t.includes("finalizar compra")) && b.closest("#carrinhoModal,#carrinhoMobile,.carrinho,.checkout,form")){ abrirEscolhaPagamentoMS(e); } },true);
})();


/* =========================================================
   CORRECAO REAL DO FRETE MOBILE: ENTREGA OU RETIRADA
   ========================================================= */
(function(){
  function $(id){ return document.getElementById(id); }
  const idsEndereco=['cepCheckout','ruaClienteMobile','numeroCasaMobile','complementoCasa','bairroClienteMobile','cidadeClienteMobile','estadoClienteMobile'];
  function botaoCalcular(){ return document.querySelector('#cmmsEtapaFrete button[onclick="calcularFreteCheckout()"]'); }
  function modoAtual(){ return document.querySelector('input[name="tipoEntregaMobileMS"]:checked')?.value || localStorage.getItem('tipoEntregaMS') || 'entrega'; }
  function definirGlobaisRetirada(){
    const f={nome:'Retirada no local',preco:0,prazo:0,tipo:'retirada'};
    try{ valorFrete=0; freteSelecionado=f; }catch(e){}
    window.valorFrete=0; window.freteSelecionado=f;
    localStorage.setItem('tipoEntregaMS','retirada');
    localStorage.setItem('valorFreteMS','0');
    localStorage.setItem('freteSelecionadoMS',JSON.stringify(f));
  }
  function aplicarModo(tipo){
    const retirada=tipo==='retirada';
    localStorage.setItem('tipoEntregaMS',retirada?'retirada':'entrega');
    idsEndereco.forEach(id=>{ const el=$(id); if(el) el.style.display=retirada?'none':''; });
    const calc=botaoCalcular(); if(calc) calc.style.display=retirada?'none':'';
    const opcoes=$('opcoesFreteCheckout');
    const aviso=$('cmmsAvisoRetirada'); if(aviso) aviso.hidden=!retirada;
    if(retirada){
      definirGlobaisRetirada();
      if(opcoes) opcoes.innerHTML='<button type="button" class="frete-opcao selecionado cmms-retirada-card"><span class="frete-info"><strong>Buscar no local</strong><small>Combine o horário pelo WhatsApp</small></span><strong class="frete-preco">Grátis</strong></button>';
    } else {
      try{ if(freteSelecionado?.tipo==='retirada'){ freteSelecionado=null; valorFrete=0; } }catch(e){}
      window.valorFrete=0; window.freteSelecionado=null;
      localStorage.removeItem('freteSelecionadoMS'); localStorage.setItem('valorFreteMS','0');
      if(opcoes && opcoes.querySelector('.cmms-retirada-card')) opcoes.innerHTML='';
    }
    if(typeof atualizarTotais==='function') atualizarTotais();
    if(typeof atualizarResumoPagamentoMS==='function') atualizarResumoPagamentoMS();
  }
  function instalar(){
    document.querySelectorAll('input[name="tipoEntregaMobileMS"]').forEach(r=>r.addEventListener('change',()=>aplicarModo(r.value)));
    const salvo=localStorage.getItem('tipoEntregaMS')||'entrega';
    const radio=document.querySelector(`input[name="tipoEntregaMobileMS"][value="${salvo}"]`);
    if(radio) radio.checked=true;
    aplicarModo(salvo);
  }
  const irPagamentoOriginal=window.irPagamentoMS;
  window.irPagamentoMS=function(){
    const nome=String($('nomeClienteMobile')?.value||'').trim();
    const telefone=String($('telefoneClienteMobile')?.value||'').replace(/\D/g,'');
    if(nome.split(/\s+/).length<2){ alert('Informe o nome completo do cliente.'); $('nomeClienteMobile')?.focus(); return; }
    if(telefone.length<10){ alert('Informe um WhatsApp válido com DDD.'); $('telefoneClienteMobile')?.focus(); return; }
    if(modoAtual()==='entrega'){
      const obrigatorios=['cepCheckout','ruaClienteMobile','numeroCasaMobile','bairroClienteMobile','cidadeClienteMobile','estadoClienteMobile'];
      const faltando=obrigatorios.find(id=>!String($(id)?.value||'').trim());
      if(faltando){ alert('Preencha o endereço completo para continuar.'); $(faltando)?.focus(); return; }
      const salvo=JSON.parse(localStorage.getItem('freteSelecionadoMS')||'null');
      if(!salvo || salvo.tipo==='retirada' || Number(salvo.preco)<=0){ alert('Escolha uma opção de frete para continuar.'); return; }
    } else definirGlobaisRetirada();
    return typeof irPagamentoOriginal==='function' ? irPagamentoOriginal.apply(this,arguments) : undefined;
  };
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',instalar); else instalar();
})();

/* =========================================================
   CORREÇÃO DEFINITIVA DO CUPOM MOBILE
   Uma única validação, timeout real e UI sempre destravada.
========================================================= */
(() => {
  let emValidacao = false;

  function moedaBR(valor) {
    return Number(valor || 0).toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    });
  }

  function lerCarrinhoCupomMS() {
    try {
      const dados = JSON.parse(localStorage.getItem('carrinho') || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch (_) {
      return [];
    }
  }

  function subtotalCupomMS() {
    return lerCarrinhoCupomMS().reduce((soma, item) => {
      const preco = typeof pegarPrecoNumero === 'function'
        ? pegarPrecoNumero(item.preco ?? item.valor ?? item.price ?? 0)
        : Number(String(item.preco ?? item.valor ?? item.price ?? 0)
            .replace(/[^0-9,.-]/g, '')
            .replace('.', '')
            .replace(',', '.')) || 0;
      const qtd = Number(item.quantidade ?? item.qtd ?? 1) || 1;
      return soma + (preco * qtd);
    }, 0);
  }

  function freteCupomMS() {
    const retirada = document.querySelector('#opcaoRetiradaMS:checked, input[value="retirada"]:checked, input[value="local"]:checked');
    if (retirada || /buscar no local/i.test(document.querySelector('#resumoEntregaPagamentoMS, .resumo-entrega-ms')?.textContent || '')) {
      return 0;
    }
    const texto = document.getElementById('valorFretePagamento')?.textContent || '0';
    return Number(texto.replace(/[^0-9,]/g, '').replace(',', '.')) || 0;
  }

  function atualizarResumoCupomUnico(percentual, codigo) {
    const subtotal = subtotalCupomMS();
    const frete = freteCupomMS();
    const desconto = subtotal * (Number(percentual || 0) / 100);
    const total = Math.max(0, subtotal + frete - desconto);

    const elProdutos = document.getElementById('valorProdutosPagamento');
    const elFrete = document.getElementById('valorFretePagamento');
    const elTotal = document.getElementById('valorTotalPagamento');
    const linha = document.getElementById('linhaDescontoCupomMSMobile');
    const rotulo = document.getElementById('rotuloDescontoCupomMSMobile');
    const valor = document.getElementById('valorDescontoCupomMSMobile');

    if (elProdutos) elProdutos.textContent = moedaBR(subtotal);
    if (elFrete) elFrete.textContent = moedaBR(frete);
    if (elTotal) elTotal.textContent = moedaBR(total);
    if (linha) linha.style.display = percentual > 0 ? 'flex' : 'none';
    if (rotulo) rotulo.textContent = codigo ? `Desconto ${codigo}` : 'Desconto';
    if (valor) valor.textContent = `- ${moedaBR(desconto)}`;

    window.descontoCupomMS = Number(percentual || 0);
    window.codigoCupomAplicadoMS = codigo || '';
    window.totalPagamentoMS = total;
  }

  async function validarCupomUnicoMS() {
    if (emValidacao) return;

    const input = document.getElementById('cupomPagamentoMS');
    const mensagem = document.getElementById('mensagemCupomMS');
    const botao = input?.parentElement?.querySelector('button');
    if (!input || !mensagem) return;

    const codigo = input.value.trim().toUpperCase();
    if (!codigo) {
      mensagem.textContent = 'Digite um cupom.';
      mensagem.style.color = '#ff4d6d';
      return;
    }

    emValidacao = true;
    mensagem.textContent = 'Validando cupom...';
    mensagem.style.color = '#f4ca38';
    if (botao) {
      botao.disabled = true;
      botao.textContent = 'Validando...';
    }

    const timeout = new Promise((_, rejeitar) => {
      setTimeout(() => rejeitar(new Error('TIMEOUT_CUPOM')), 8000);
    });

    try {
      const requisicao = fetch(`${API_BASE}/cupons/validar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ codigo, subtotal: subtotalCupomMS() }),
        cache: 'no-store'
      }).then(async resposta => {
        const dados = await resposta.json().catch(() => ({}));
        if (!resposta.ok || !dados.valido) {
          throw new Error(dados.mensagem || 'Cupom inválido.');
        }
        return dados;
      });

      const dados = await Promise.race([requisicao, timeout]);
      const percentual = Number(dados.percentual ?? dados.cupom?.percentual ?? 0);

      atualizarResumoCupomUnico(percentual, codigo);
      mensagem.textContent = 'Cupom aplicado com sucesso ✓';
      mensagem.style.color = '#22c55e';
    } catch (erro) {
      atualizarResumoCupomUnico(0, '');
      mensagem.textContent = erro?.message === 'TIMEOUT_CUPOM'
        ? 'O servidor não respondeu. Tente novamente.'
        : (erro?.message || 'Não foi possível validar o cupom.');
      mensagem.style.color = '#ff4d6d';
    } finally {
      emValidacao = false;
      window.__cupomMobileValidandoMS = false;
      cupomValidandoMS = false;
      if (botao) {
        botao.disabled = false;
        botao.textContent = 'Aplicar';
      }
    }
  }

  window.aplicarCupomMS = validarCupomUnicoMS;
})();


// ==========================================================
// CUPOM UNIFICADO MS - versão definitiva para PC e mobile
// Mantido no final do arquivo para substituir rotinas antigas.
// ==========================================================
(() => {
  let validacaoEmAndamento = false;

  function obterSubtotalCupomMS() {
    let lista = [];
    try {
      lista = JSON.parse(localStorage.getItem("carrinho") || "[]");
    } catch (_) {
      lista = [];
    }

    return Array.isArray(lista)
      ? lista.reduce((soma, item) => {
          const preco = typeof pegarPrecoNumero === "function"
            ? pegarPrecoNumero(item.preco ?? item.valor ?? item.price ?? 0)
            : Number(String(item.preco ?? item.valor ?? item.price ?? 0)
                .replace(/[^0-9,.-]/g, "")
                .replace(/\.(?=.*\.)/g, "")
                .replace(",", ".")) || 0;
          const qtd = Number(item.quantidade ?? item.qtd ?? 1) || 1;
          return soma + preco * qtd;
        }, 0)
      : 0;
  }

  function elementosCupomMS(tipo) {
    const mobile = tipo === "mobile";
    const input = document.getElementById(mobile ? "cupomPagamentoMS" : "cupomInput");
    const mensagem = document.getElementById(mobile ? "mensagemCupomMS" : "cupomMensagem");
    const botao = input?.parentElement?.querySelector("button") ||
      input?.closest(".cupom-linha-ms, .cupom-linha, .cmms-cupom-linha")?.querySelector("button");
    return { input, mensagem, botao };
  }

  function atualizarTelasCupomMS(tipo) {
    if (tipo === "mobile") {
      if (typeof atualizarResumoPagamentoMSComCupom === "function") {
        atualizarResumoPagamentoMSComCupom();
      }
    } else if (typeof montarResumoPagamentoPC === "function") {
      montarResumoPagamentoPC();
    }
  }

  async function validarCupomCompartilhadoMS(tipo) {
    const { input, mensagem, botao } = elementosCupomMS(tipo);
    if (!input || !mensagem) return;
    if (validacaoEmAndamento) {
      mensagem.textContent = "Aguarde a validação atual.";
      return;
    }

    const codigo = input.value.trim().toUpperCase();
    if (!codigo) {
      mensagem.textContent = "Digite um cupom.";
      mensagem.style.color = "#ff4d6d";
      return;
    }

    validacaoEmAndamento = true;
    cupomValidandoMS = true;
    window.__cupomMobileValidandoMS = true;

    mensagem.textContent = "Validando cupom...";
    mensagem.style.color = "#d6b24c";
    if (botao) {
      botao.disabled = true;
      botao.textContent = "Validando...";
    }

    const controller = new AbortController();
    const temporizador = setTimeout(() => controller.abort(), 8000);

    try {
      const resposta = await fetch(`${API_BASE}/cupons/validar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ codigo, subtotal: obterSubtotalCupomMS() }),
        signal: controller.signal,
        cache: "no-store"
      });

      const texto = await resposta.text();
      let dados = {};
      try { dados = texto ? JSON.parse(texto) : {}; } catch (_) {}

      if (!resposta.ok || !dados.valido) {
        throw new Error(dados.mensagem || dados.erro || "Cupom inválido.");
      }

      descontoCupomMS = Number(dados.percentual ?? dados.cupom?.percentual ?? dados.desconto ?? 0);
      codigoCupomAplicadoMS = codigo;
      window.descontoCupomMS = descontoCupomMS;
      window.codigoCupomAplicadoMS = codigoCupomAplicadoMS;

      atualizarTelasCupomMS(tipo);
      mensagem.textContent = "Cupom aplicado com sucesso ✓";
      mensagem.style.color = "#22c55e";
    } catch (erro) {
      descontoCupomMS = 0;
      codigoCupomAplicadoMS = "";
      window.descontoCupomMS = 0;
      window.codigoCupomAplicadoMS = "";
      atualizarTelasCupomMS(tipo);

      mensagem.textContent = erro?.name === "AbortError"
        ? "O servidor não respondeu em 8 segundos. Tente novamente."
        : (erro?.message || "Não foi possível validar o cupom.");
      mensagem.style.color = "#ff4d6d";
    } finally {
      clearTimeout(temporizador);
      validacaoEmAndamento = false;
      cupomValidandoMS = false;
      window.__cupomMobileValidandoMS = false;
      if (botao) {
        botao.disabled = false;
        botao.textContent = "Aplicar";
      }
    }
  }

  window.aplicarCupom = () => validarCupomCompartilhadoMS("desktop");
  window.aplicarCupomMS = () => validarCupomCompartilhadoMS("mobile");
})();

/* =========================================================
   CHECKOUT PC DEFINITIVO: PIX NA LOJA + CARTAO EXTERNO
   Não altera o fluxo mobile.
   ========================================================= */
(function () {
  "use strict";

  const API_PC_MS = (location.hostname === "localhost" || location.hostname === "127.0.0.1")
    ? "http://127.0.0.1:3000"
    : "https://ms-matias-style.onrender.com";

  let timerPixPCMS = null;

  function lerCampoPCMS(...ids) {
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el && String(el.value || "").trim()) return String(el.value).trim();
    }
    return "";
  }

  function lerCarrinhoPCMS() {
    try {
      const lista = JSON.parse(localStorage.getItem("carrinho") || "[]");
      if (Array.isArray(lista) && lista.length) return lista;
    } catch (_) {}
    try {
      if (Array.isArray(window.carrinho) && window.carrinho.length) return window.carrinho;
    } catch (_) {}
    return [];
  }

  function normalizarItensPCMS(lista) {
    return (lista || []).map((item) => ({
      nome: item.nome || item.title || "Produto MS",
      preco: Number(item.preco || item.unit_price || 0),
      quantidade: Number(item.quantidade || item.quantity || 1),
      tamanho: item.tamanho || "",
      imagem: item.imagem || item.img || ""
    }));
  }

  function dadosPCMS() {
    let salvo = {};
    try { salvo = JSON.parse(localStorage.getItem("dadosClienteMS") || "{}"); } catch (_) {}

    const cliente = {
      nome: lerCampoPCMS("nomeCliente", "customerName") || salvo.nome || "",
      telefone: lerCampoPCMS("telefoneCliente", "customerPhone", "whatsappCliente") || salvo.telefone || salvo.whatsapp || "",
      email: lerCampoPCMS("emailCliente", "customerEmail") || salvo.email || "",
      cep: lerCampoPCMS("cepCliente", "zip") || salvo.cep || "",
      rua: lerCampoPCMS("ruaCliente", "ruaCheckout", "street") || salvo.rua || "",
      numero: lerCampoPCMS("numeroCasa", "numeroCliente", "numeroCheckout", "number") || salvo.numero || "",
      complemento: lerCampoPCMS("complementoCliente", "complementoCheckout", "complement") || salvo.complemento || "",
      bairro: lerCampoPCMS("bairroCliente", "bairroCheckout", "district") || salvo.bairro || "",
      cidade: lerCampoPCMS("cidadeCliente", "cidadeCheckout", "city") || salvo.cidade || "",
      estado: lerCampoPCMS("estadoCliente", "estadoCheckout", "state") || salvo.estado || ""
    };

    const itens = lerCarrinhoPCMS();
    const tipoEntrega = localStorage.getItem("tipoEntregaMS") || "entrega";
    const retiradaLocal = tipoEntrega === "retirada";
    let frete = 0;
    try { frete = Number(window.valorFrete || valorFrete || localStorage.getItem("valorFreteMS") || 0); } catch (_) { frete = Number(localStorage.getItem("valorFreteMS") || 0); }
    let freteObj = null;
    try { freteObj = window.freteSelecionado || freteSelecionado || JSON.parse(localStorage.getItem("freteSelecionadoMS") || "null"); } catch (_) {}
    let cupom = "";
    try { cupom = String(window.codigoCupomAplicadoMS || codigoCupomAplicadoMS || localStorage.getItem("codigoCupomAplicadoMS") || ""); } catch (_) { cupom = localStorage.getItem("codigoCupomAplicadoMS") || ""; }

    return {
      itens,
      cliente,
      payload: {
        tipoEntrega,
        retiradaLocal,
        items: normalizarItensPCMS(itens),
        carrinho: normalizarItensPCMS(itens),
        nome: cliente.nome,
        telefone: cliente.telefone,
        whatsapp: cliente.telefone,
        email: cliente.email,
        cep: cliente.cep,
        rua: cliente.rua,
        numero: cliente.numero,
        complemento: cliente.complemento,
        bairro: cliente.bairro,
        cidade: cliente.cidade,
        estado: cliente.estado,
        cliente,
        endereco: cliente,
        valorFrete: retiradaLocal ? 0 : frete,
        freteSelecionado: freteObj,
        codigoCupom: cupom
      }
    };
  }

  function validarPCMS(dados) {
    if (!dados.itens.length) {
      alert("Seu carrinho está vazio.");
      return false;
    }
    const c = dados.cliente;
    if (!c.nome || !c.telefone) {
      alert("Volte à etapa de entrega e informe nome completo e WhatsApp.");
      return false;
    }
    if (!dados.payload.retiradaLocal && (!c.cep || !c.rua || !c.numero || !c.bairro || !c.cidade || !c.estado)) {
      alert("Volte à etapa de entrega e preencha o endereço completo.");
      return false;
    }
    return true;
  }

  function modalPixPCMS() {
    let modal = document.getElementById("modalPixPCMSFinal");
    if (modal) return modal;
    modal = document.createElement("div");
    modal.id = "modalPixPCMSFinal";
    modal.innerHTML = `
      <div class="caixa-pix-pc-ms-final">
        <button type="button" class="fechar-pix-pc-ms-final">×</button>
        <div class="logo-pix-pc-ms-final">MS</div>
        <h2 id="tituloPixPCMSFinal">Gerando PIX...</h2>
        <p id="textoPixPCMSFinal">Aguarde alguns segundos.</p>
        <div id="loaderPixPCMSFinal" class="loader-pix-pc-ms-final"></div>
        <img id="qrPixPCMSFinal" alt="QR Code PIX" hidden>
        <strong id="valorPixPCMSFinal"></strong>
        <textarea id="codigoPixPCMSFinal" readonly hidden></textarea>
        <button type="button" id="copiarPixPCMSFinal" hidden>Copiar código PIX</button>
        <div id="statusPixPCMSFinal">Aguardando pagamento...</div>
      </div>`;
    document.body.appendChild(modal);
    const css = document.createElement("style");
    css.textContent = `
      #modalPixPCMSFinal{position:fixed;inset:0;z-index:2147483647;background:rgba(0,0,0,.86);display:flex;align-items:center;justify-content:center;padding:20px;font-family:Arial,sans-serif}
      .caixa-pix-pc-ms-final{position:relative;width:min(430px,100%);max-height:94vh;overflow:auto;background:#fff;color:#111;padding:26px;border-radius:22px;text-align:center;box-shadow:0 24px 80px rgba(0,0,0,.5)}
      .fechar-pix-pc-ms-final{position:absolute;right:13px;top:8px;border:0;background:transparent;font-size:31px;cursor:pointer}.logo-pix-pc-ms-final{width:58px;height:58px;margin:0 auto 12px;border-radius:50%;background:#111;color:#fff;display:grid;place-items:center;font-weight:900}
      .loader-pix-pc-ms-final{width:42px;height:42px;margin:24px auto;border:4px solid #ddd;border-top-color:#111;border-radius:50%;animation:giraPixPCMS .8s linear infinite}@keyframes giraPixPCMS{to{transform:rotate(360deg)}}
      #qrPixPCMSFinal{display:block;width:235px;max-width:82%;margin:12px auto}#qrPixPCMSFinal[hidden]{display:none}#valorPixPCMSFinal{display:block;font-size:22px;margin:10px}
      #codigoPixPCMSFinal{width:100%;height:78px;box-sizing:border-box;border:1px solid #ddd;border-radius:10px;padding:10px;font-size:12px;resize:none}#copiarPixPCMSFinal{width:100%;padding:14px;margin-top:10px;border:0;border-radius:12px;background:#111;color:#fff;font-weight:800;cursor:pointer}#statusPixPCMSFinal{margin-top:15px;padding:12px;border-radius:10px;background:#f3f3f3;font-weight:800}`;
    document.head.appendChild(css);
    modal.querySelector(".fechar-pix-pc-ms-final").onclick = () => {
      modal.style.display = "none";
      clearInterval(timerPixPCMS);
    };
    document.getElementById("copiarPixPCMSFinal").onclick = async () => {
      const campo = document.getElementById("codigoPixPCMSFinal");
      try { await navigator.clipboard.writeText(campo.value); }
      catch (_) { campo.select(); document.execCommand("copy"); }
      document.getElementById("copiarPixPCMSFinal").textContent = "Código copiado ✓";
    };
    return modal;
  }

  async function consultarPixPCMS(pedido) {
    try {
      const resposta = await fetch(`${API_PC_MS}/pagamento/status/${encodeURIComponent(pedido)}?t=${Date.now()}`, { cache: "no-store" });
      if (!resposta.ok) return;
      const dados = await resposta.json();
      const status = String(dados.status || dados.pagamento?.status || "").toLowerCase();
      if (status === "pago" || status === "approved") {
        clearInterval(timerPixPCMS);
        const caixaSucesso = document.querySelector("#modalPixPCMSFinal .caixa-pix-pc-ms-final");
        const agora = new Date();
        const dataHora = agora.toLocaleDateString("pt-BR") + " às " + agora.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
        caixaSucesso.classList.add("ms-confirmacao-premium");
        caixaSucesso.innerHTML = `
          <div class="ms-sucesso-brilho" aria-hidden="true"></div>
          <div class="ms-sucesso-icone" aria-hidden="true"><span>✓</span></div>
          <h2>Pagamento confirmado!</h2>
          <p class="ms-sucesso-subtitulo">Seu pedido foi recebido com sucesso.</p>
          <div class="ms-sucesso-dados">
            <div class="ms-sucesso-dado">
              <span class="ms-sucesso-mini-icone">▣</span>
              <div><small>Pedido</small><strong>#${pedido}</strong></div>
            </div>
            <div class="ms-sucesso-divisor"></div>
            <div class="ms-sucesso-dado">
              <span class="ms-sucesso-mini-icone">◷</span>
              <div><small>Data</small><strong>${dataHora}</strong></div>
            </div>
          </div>
          <div class="ms-sucesso-aviso">
            <span>✓</span>
            <p>Seu pagamento foi aprovado. Agora vamos separar seu pedido e avisar você sobre as próximas etapas.</p>
          </div>
          <button type="button" id="voltarLojaPixPCMS" class="ms-sucesso-botao">Voltar para a loja</button>
          <p class="ms-sucesso-seguranca">Compra processada com segurança</p>`;
        localStorage.removeItem("carrinho");
        localStorage.removeItem("carrinhoMS");
        document.getElementById("voltarLojaPixPCMS").onclick = () => location.href = "index.html";
      }
    } catch (_) {}
  }

  window.msPixPCDireto = async function (event) {
    if (event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
    const botao = document.getElementById("btnPixPCMS");
    const dados = dadosPCMS();
    if (!validarPCMS(dados)) return false;
    const modal = modalPixPCMS();
    modal.style.display = "flex";
    document.getElementById("tituloPixPCMSFinal").textContent = "Gerando PIX...";
    document.getElementById("textoPixPCMSFinal").textContent = "Aguarde alguns segundos.";
    document.getElementById("loaderPixPCMSFinal").hidden = false;
    if (botao) botao.disabled = true;
    try {
      const resposta = await fetch(`${API_PC_MS}/criar-pagamento-pix`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados.payload)
      });
      const retorno = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(retorno.mensagem || "Não foi possível gerar o PIX.");
      document.getElementById("loaderPixPCMSFinal").hidden = true;
      document.getElementById("tituloPixPCMSFinal").textContent = "Pague com PIX";
      document.getElementById("textoPixPCMSFinal").textContent = `Pedido #${retorno.pedido}. Escaneie o QR Code ou copie o código.`;
      document.getElementById("valorPixPCMSFinal").textContent = Number(retorno.total || 0).toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
      const qr = document.getElementById("qrPixPCMSFinal");
      if (retorno.qr_code_base64) { qr.src = `data:image/png;base64,${retorno.qr_code_base64}`; qr.hidden = false; }
      const codigo = document.getElementById("codigoPixPCMSFinal");
      codigo.value = retorno.qr_code || ""; codigo.hidden = false;
      document.getElementById("copiarPixPCMSFinal").hidden = false;
      clearInterval(timerPixPCMS);
      consultarPixPCMS(retorno.pedido);
      timerPixPCMS = setInterval(() => consultarPixPCMS(retorno.pedido), 3000);
    } catch (erro) {
      modal.style.display = "none";
      alert(erro.message || "Não foi possível gerar o PIX.");
    } finally {
      if (botao) botao.disabled = false;
    }
    return false;
  };

  window.msCartaoPCDireto = async function (event) {
    if (event) { event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation?.(); }
    const botao = document.getElementById("btnCartaoPCMS");
    const dados = dadosPCMS();
    if (!validarPCMS(dados)) return false;
    if (botao) botao.disabled = true;
    try {
      const resposta = await fetch(`${API_PC_MS}/criar-pagamento`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dados.payload)
      });
      const retorno = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(retorno.mensagem || "Não foi possível abrir o cartão.");
      const link = retorno.init_point || retorno.sandbox_init_point;
      if (!link) throw new Error("O Mercado Pago não retornou o link de pagamento.");
      window.location.href = link;
    } catch (erro) {
      alert(erro.message || "Não foi possível abrir o pagamento.");
    } finally {
      if (botao) botao.disabled = false;
    }
    return false;
  };
})();

/* FRETE COM DATA ESTIMADA - PC E MOBILE */
(function(){
  if(document.getElementById("frete-data-style-ms")) return;
  const style=document.createElement("style");
  style.id="frete-data-style-ms";
  style.textContent=`
    .frete-opcao-data-ms{align-items:center!important;gap:12px!important;text-align:left!important}
    .frete-dados-ms{display:flex;flex-direction:column;gap:3px;min-width:0}
    .frete-dados-ms small{display:block;color:#c9c9c9;line-height:1.35}
    .frete-dados-ms small b{color:#fff}
    .frete-badges-ms{display:flex;flex-wrap:wrap;gap:5px;margin-bottom:2px}
    .frete-badge-ms{font-style:normal;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:.3px;border-radius:999px;padding:4px 7px;background:#ead04b;color:#090909}
    .frete-badge-ms.rapido{background:#fff;color:#090909}
    @media(max-width:600px){.frete-opcao-data-ms{padding:13px!important}.frete-dados-ms strong{font-size:14px}.frete-dados-ms small{font-size:11px}}
  `;
  document.head.appendChild(style);
})();

/* =========================================================
   CORRECAO DEFINITIVA DO TOQUE NO CARTAO MOBILE
   Usa pointerdown no window para executar antes de listeners
   antigos que possam bloquear o clique do modal.
   ========================================================= */
(function(){
  let abrindoCartaoMS = false;

  async function acionarCartaoMobileMS(event){
    const alvo = event.target instanceof Element
      ? event.target.closest("#msEscolhaPagamento .ms-opcao-cartao")
      : null;
    if(!alvo) return;

    event.preventDefault();
    event.stopPropagation();
    if(typeof event.stopImmediatePropagation === "function") event.stopImmediatePropagation();
    if(abrindoCartaoMS) return;
    abrindoCartaoMS = true;

    const modal = document.getElementById("msEscolhaPagamento");
    const textoOriginal = alvo.innerHTML;
    alvo.disabled = true;
    alvo.innerHTML = "<strong>💳 Abrindo Mercado Pago...</strong><span>Aguarde alguns segundos</span>";

    try{
      if(typeof window.msPagarCartaoOutros !== "function"){
        throw new Error("A função do cartão não foi carregada. Atualize a página.");
      }
      await window.msPagarCartaoOutros();
    }catch(erro){
      console.error("ERRO CARTAO MOBILE MS:", erro);
      alert(erro?.message || "Não foi possível abrir o Mercado Pago.");
    }finally{
      abrindoCartaoMS = false;
      alvo.disabled = false;
      alvo.innerHTML = textoOriginal;
      if(modal) modal.style.display = "flex";
    }
  }

  window.addEventListener("pointerdown", acionarCartaoMobileMS, true);
})();
