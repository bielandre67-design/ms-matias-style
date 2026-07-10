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
    alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
    alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
    return total + Number(item.preco) * Number(item.quantidade || 1);
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

          <strong>${dinheiro(Number(item.preco) * Number(item.quantidade || 1))}</strong>

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
    alert("Adicione um produto ao carrinho.");
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
    alert("Preencha seu nome completo.");
    return;
  }

  if (!cep || cep.replace(/\D/g, "").length < 8) {
    alert("Preencha o CEP corretamente.");
    return;
  }

  if (!valorFrete || valorFrete <= 0) {
    alert("Calcule o frete antes de continuar.");
    return;
  }

  if (!whats || whats.replace(/\D/g, "").length < 10) {
    alert("Preencha o WhatsApp com DDD.");
    return;
  }

  if (!rua || !numero || !bairro || !cidade || !estado) {
    alert("Preencha todos os dados.");
    return;
  }

  salvarDadosClienteMobileMS();
  mostrarEtapa("etapaPagamento");
  atualizarTotaisMobile();

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const subtotal = carrinho.reduce((acc, item) => {
    return acc + Number(item.preco) * Number(item.quantidade || 1);
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
    alert("Adicione um produto ao carrinho.");
    return;
  }

  mostrarEtapaPC("etapaEntregaPC", "step2");
}

function irPagamentoPC() {
  const nome = document.getElementById("nomeCliente")?.value.trim();
  const telefone = document.getElementById("telefoneCliente")?.value.trim();
  const cep = document.getElementById("cepCliente")?.value.trim();

  if (!nome || !telefone || !cep) {
    alert("Preencha todos os dados antes de continuar.");
    return;
  }

  if (valorFrete <= 0) {
    alert("Selecione um frete antes de continuar.");
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
    return total + Number(item.preco) * Number(item.quantidade || 1);
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
               ${dinheiro(Number(item.preco) * Number(item.quantidade || 1))}
            </strong>
         </div>
      </div>

   </div>
`;
});

  resumo.innerHTML += `
    <div class="total-resumo-pc">
      <p><span>Subtotal</span><strong>${dinheiro(subtotal)}</strong></p>
      <p><span>Frete</span><strong>${dinheiro(valorFrete)}</strong></p>
      <p><span>Total</span><strong>${dinheiro(subtotal + Number(valorFrete || 0))}</strong></p>
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
// FRETE
// ===============================

async function calcularFrete() {
  const cep = document.getElementById("cepCliente")?.value.replace(/\D/g, "");
  const resultadoFrete = document.getElementById("resultadoFrete");

  if (!cep || cep.length !== 8) {
    alert("Digite um CEP válido.");
    return;
  }

  if (resultadoFrete) resultadoFrete.innerHTML = "Calculando frete...";

  try {
    const resposta = await fetch(`${API_BASE}/calcular-frete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ cep })
    });

    const fretes = await resposta.json();
    console.log("FRETES RECEBIDOS:", fretes);
    const opcoesValidas = fretes.filter(frete => {

  if (frete.error) return false;

  const empresa = (frete.company?.name || "").toLowerCase();
  const servico = (frete.name || "").toLowerCase();

  return (
    servico.includes("pac") ||
    servico.includes("sedex") ||
    (
      empresa.includes("jadlog") &&
      servico.includes("package") &&
      !servico.includes("centralizado")
    )
  );

});

    if (!resultadoFrete) return;

    if (opcoesValidas.length === 0) {
      resultadoFrete.innerHTML = "Nenhuma opção de frete encontrada.";
      return;
    }

    resultadoFrete.innerHTML = opcoesValidas.map(frete => `
      <div class="opcao-frete"
        onclick="selecionarFrete('${frete.company.name} - ${frete.name}', ${Number(frete.price)}, ${Number(frete.delivery_time)})">
        <strong>${frete.company.name} - ${frete.name}</strong><br>
        ${dinheiro(frete.price)}<br>
        <small>Prazo: ${frete.delivery_time} dias úteis</small>
      </div>
    `).join("");

  } catch (erro) {
    console.log(erro);
    if (resultadoFrete) resultadoFrete.innerHTML = "Erro ao calcular o frete.";
  }
}

async function calcularFreteCheckout() {
  const cepInput = document.getElementById("cepCheckout");
  if (!cepInput) return;

  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) {
    alert("Digite um CEP válido.");
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
      body: JSON.stringify({ cep })
    });

    const fretes = await resposta.json();
    const container = document.getElementById("opcoesFreteCheckout");
    if (!container) return;

    container.innerHTML = "";
   const fretesFiltrados = fretes.filter(frete => {
  const empresa = (frete.company?.name || "").toLowerCase();
  const servico = (frete.name || "").toLowerCase();

  return (
    servico.includes("pac") ||
    servico.includes("sedex") ||
    (empresa.includes("jadlog") && servico.includes("package") && !servico.includes("centralizado"))
  );
});
    fretesFiltrados.forEach(frete => {
      if (frete.error) return;

      const preco = Number(frete.price);
      const div = document.createElement("div");

      div.className = "frete-opcao";
      div.innerHTML = `
        <span>
          ⊙ ${frete.company.name} - ${frete.name}
          <br>
          <small>Prazo: ${frete.delivery_time} dias úteis</small>
        </span>
        <strong>${dinheiro(preco)}</strong>
      `;

      div.onclick = () => {
        document.querySelectorAll(".frete-opcao").forEach(opcao => {
         opcao.classList.remove("selecionado");
        });

        div.classList.add("selecionado");

        selecionarFrete(`${frete.company.name} - ${frete.name}`, preco, frete.delivery_time);
      };

      container.appendChild(div);
    });

  } catch (erro) {
    console.log(erro);
    alert("Erro ao calcular o frete.");
  }
}

function selecionarFrete(nome, preco, prazo) {
  preco = Number(preco);

  freteSelecionado = { nome, preco, prazo };
  valorFrete = preco;

  localStorage.setItem("valorFreteMS", String(valorFrete));
  localStorage.setItem("freteSelecionadoMS", JSON.stringify(freteSelecionado));

  const resultadoFrete = document.getElementById("resultadoFrete");

  if (resultadoFrete) {
    resultadoFrete.innerHTML = `
      <div class="frete-escolhido">
        Frete escolhido: <strong>${nome}</strong><br>
        Valor: ${dinheiro(preco)}<br>
        Prazo: ${prazo} dias úteis
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
      alert("CEP não encontrado.");
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
    alert("Erro ao buscar endereço.");
  }
}

function aplicarCupom() {
  const input = document.getElementById("cupomInput");
  const mensagem = document.getElementById("cupomMensagem");

  if (!input || !mensagem) return;

  const cupom = input.value.trim().toUpperCase();

  if (cupom === "MS10") {
    desconto = 10;
    mensagem.innerText = "Cupom aplicado: 10% OFF 🔥";
  } else {
    desconto = 0;
    mensagem.innerText = "Cupom inválido.";
  }

  atualizarCarrinho();
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
    alert("Seu carrinho está vazio.");
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
      alert("Mercado Pago não gerou link. Veja o console.");
      return false;
    }

    window.open(dados.init_point, "_blank");
    return false;

  } catch (erro) {
    console.error("ERRO MERCADO PAGO:", erro);
    esconderLoadingCheckout();
    alert("Erro ao iniciar pagamento.");
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
    alert("Digite um WhatsApp válido com DDD.");
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
    alert("Menu não encontrado");
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
    alert("Carrinho não encontrado");
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

        <strong>${dinheiro(Number(item.preco) * Number(item.quantidade || 1))}</strong>

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
    alert("Não achei listaCarrinhoMobile no HTML");
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
        <strong>${dinheiro(Number(item.preco) * Number(item.quantidade || 1))}</strong>
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
        ${dinheiro(Number(item.preco))}
      </p>

      <strong>
        ${dinheiro(Number(item.preco) * Number(item.quantidade || 1))}
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
            return acc + (Number(item.preco) * Number(item.quantidade || 1));
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
      Number(item.preco) *
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
    alert("Não achei o carrinhoMobileMS");
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
    alert("Não achei o carrinhoMobileMS no HTML");
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
      alert("Não achei o carrinhoMobileMS");
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
      alert("CEP não encontrado");
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
      alert("CEP não encontrado");
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
    alert("Algum ID do endereço está errado");
    return;
  }

  const cep = cepInput.value.replace(/\D/g, "");

  if (cep.length !== 8) return;

  try {
    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await resposta.json();

    if (dados.erro) {
      alert("CEP não encontrado");
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
    alert("Algum campo não foi encontrado. Confere os IDs no HTML.");
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
    alert("CEP não encontrado");
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

  const frete = Number(window.valorFrete || window.freteSelecionadoValor || 14.59);
  const total = subtotal + frete;

  document.getElementById("valorProdutosPagamento").innerText =
    subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorFretePagamento").innerText =
    frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  document.getElementById("valorTotalPagamento").innerText =
    total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};
setInterval(() => {
  const itens = document.querySelectorAll("#resumoPedidoMobile > div");
  const qtdItens = itens.length;

  const precoUnitario = 100; // preço de cada moletom
  const subtotal = qtdItens * precoUnitario;

  const frete = 14.59;
  const total = subtotal + frete;

  const produtos = document.getElementById("valorProdutosPagamento");
  const freteEl = document.getElementById("valorFretePagamento");
  const totalEl = document.getElementById("valorTotalPagamento");

  if (produtos) produtos.innerText = subtotal.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (freteEl) freteEl.innerText = frete.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  if (totalEl) totalEl.innerText = total.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}, 500);
let descontoCupomMS = 0;

function aplicarCupomMS(){
  const cupom = document.getElementById("cupomPagamentoMS").value.trim().toUpperCase();
  const msg = document.getElementById("mensagemCupomMS");

  if(cupom === "MS10"){
    descontoCupomMS = 10;
    msg.innerText = "Cupom aplicado: 10% de desconto";
  } else {
    descontoCupomMS = 0;
    msg.innerText = "Cupom inválido";
  }

  atualizarResumoPagamentoMS();
}
function comprarFavoritosMS(){

  const favoritos = JSON.parse(localStorage.getItem("favoritosMS")) || [];

  let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  favoritos.forEach(produto => {

    const itemExistente = carrinho.find(item => item.nome === produto.nome);

    if(itemExistente){
      itemExistente.quantidade += 1;
    } else {
      carrinho.push({
        nome: produto.nome,
        preco: pegarPrecoNumero(produto.preco) || 0,
        imagem: produto.imagem || produto.img || "",
        tamanho: produto.tamanho || "P",
        quantidade: 1
      });
    }

  });

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  if(typeof carregarCarrinho === "function") carregarCarrinho();
  if(typeof atualizarCarrinho === "function") atualizarCarrinho();
  if(typeof atualizarBadgeCarrinho === "function") atualizarBadgeCarrinho();

  document.getElementById("painelFavoritos")?.classList.remove("ativo");
  document.getElementById("painelFavoritos")?.classList.remove("favoritos-ativo");

  if(window.innerWidth <= 768){
    abrirCarrinhoMobileMS();
  } else {
    abrirCarrinho();
  }
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
    alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
    alert("Produto não encontrado.");
    return null;
  }

  const tamanho =
    detalhe.dataset.tamanho ||
    detalhe.querySelector(".tamanhos-detalhe button.ativo, .detalhe-tamanhos button.ativo")?.innerText.trim();

  if(!tamanho){
    alert("Escolha um tamanho antes de comprar.");
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

  alert("Carrinho não encontrado no HTML.");
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

  alert("Carrinho não encontrado no HTML.");
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
    alert("Carrinho PC não encontrado.");
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
    alert("Carrinho PC não encontrado.");
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
    alert("Escolha um tamanho antes de comprar.");
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
    alert("Escolha um tamanho antes de comprar.");
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
      alert("Escolha um tamanho antes de comprar.");
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
    alert("Produto não encontrado.");
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
      alert('Produto não encontrado.');
      return false;
    }

    if(!item.tamanho){
      if(typeof alertaMS === 'function') alertaMS('Escolha um tamanho antes de continuar.');
      else alert('Escolha um tamanho antes de adicionar ao carrinho.');
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
        alert("Seu carrinho está vazio.");
        return false;
      }

      if(typeof atualizarCarrinho === "function") atualizarCarrinho();
      if(typeof mostrarLoadingCheckout === "function") mostrarLoadingCheckout();

      var apiBase = msApiBaseFinal();
      if(!apiBase){
        alert("API_BASE não encontrado. Confira o endereço do backend.");
        return false;
      }

      console.log("MS PAGAMENTO: chamando", apiBase + "/criar-pagamento");

      var resposta = await fetch(apiBase + "/criar-pagamento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: msNormalizarItensPagamento(lista),
          carrinho: msNormalizarItensPagamento(lista),
          valorFrete: Number(window.valorFrete || valorFrete || localStorage.getItem("valorFreteMS") || 0),
          freteSelecionado: window.freteSelecionado || freteSelecionado || JSON.parse(localStorage.getItem("freteSelecionadoMS") || "null"),
          desconto: Number(window.desconto || desconto || 0),
          totalComFrete: Number(window.totalComFrete || totalComFrete || 0)
        })
      });

      var texto = await resposta.text();
      var dados = {};
      try { dados = JSON.parse(texto); } catch(e) { dados = { raw: texto }; }

      console.log("MS PAGAMENTO: resposta", resposta.status, dados);

      if(!resposta.ok){
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert("Erro no backend do pagamento: " + resposta.status + ". Veja o Console.");
        return false;
      }

      var link = dados.init_point || dados.sandbox_init_point || dados.url || dados.link;
      if(!link){
        if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
        alert("Mercado Pago não gerou link. Veja o Console.");
        return false;
      }

      window.location.href = link;
      return false;

    }catch(erro){
      console.error("ERRO FINAL MERCADO PAGO MS:", erro);
      if(typeof esconderLoadingCheckout === "function") esconderLoadingCheckout();
      alert("Não consegui iniciar o Mercado Pago. Veja o Console.");
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

    finalizarCompraMPCorrigido(e);
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
      alert('Escolha um tamanho antes de adicionar ao carrinho.');
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
      alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
      alert('Escolha um tamanho antes de adicionar ao carrinho.');
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
    if(n.includes("branco") || n.includes("branca") || n.includes("off white")) return "Branco";
    if(n.includes("bege")) return "Bege";
    if(n.includes("azul")) return "Azul";
    if(n.includes("rosa")) return "Rosa";
    if(n.includes("cinza")) return "Cinza";
    if(n.includes("vinho") || n.includes("bordo")) return "Vinho";
    if(n.includes("marrom")) return "Marrom";
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
    else if(nome.includes("camiseta")) tipo = "CAM";
    else if(nome.includes("calca")) tipo = "CAL";
    else if(nome.includes("touca")) tipo = "TOU";
    else if(nome.includes("meia")) tipo = "MEI";
    const mapa = {preto:"PT",preta:"PT",branco:"BR",branca:"BR",bege:"BG",azul:"AZ",rosa:"RS",cinza:"CZ",vinho:"VN",bordo:"VN",marrom:"MR",offwhite:"OW",unica:"UN",unico:"UN"};
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
      alert(`${pronto.nome} / ${pronto.cor} / ${pronto.tamanho} ainda não tem estoque cadastrado no painel admin.`);
      return false;
    }

    const jaNoCarrinho = qtdNoCarrinhoMS(pronto);
    const pedidoTotal = jaNoCarrinho + Math.max(1, Number(qtdNova || 1));

    if(pedidoTotal > Number(info.disponivel || 0)){
      const restante = Math.max(0, Number(info.disponivel || 0) - jaNoCarrinho);
      if(restante <= 0){
        alert(`Estoque insuficiente. Você já adicionou todas as unidades disponíveis de ${pronto.nome} ${pronto.cor} ${pronto.tamanho}.`);
      }else{
        alert(`Temos apenas ${restante} unidade(s) disponível(is) de ${pronto.nome} ${pronto.cor} ${pronto.tamanho}.`);
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
      alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
    if(typeof mostrarToastMS === "function") mostrarToastMS();
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
      alert("Escolha um tamanho antes de adicionar ao carrinho.");
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
    if(typeof avisoCarrinhoPremium === "function") avisoCarrinhoPremium();
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
      alert("Seu carrinho está vazio.");
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
