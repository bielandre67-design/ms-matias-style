// ===============================
// MS MATIAS STYLE - SCRIPT LIMPO
// Carrinho único para PC + Mobile
// ===============================
let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let valorFrete = Number(localStorage.getItem("valorFreteMS")) || 0;
let desconto = 0;
let totalComFrete = 0;
let freteSelecionado = JSON.parse(localStorage.getItem("freteSelecionadoMS")) || null;
const API_BASE = "http://127.0.0.1:3000";

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

  return Number(
    String(preco || "0")
      .replace("R$", "")
      .replace(/\./g, "")
      .replace(",", ".")
      .trim()
  );
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

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      nome: nome,
      preco: precoFinal,
      imagem: imagem,
      tamanho: tamanho,
      quantidade: 1
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

function adicionarProdutoDetalhe() {
  const detalhe = document.getElementById("produtoDetalhe");
  if (!detalhe || !produtoDetalheAtual) return;

  const tamanho = detalhe.querySelector(".detalhe-tamanhos button.ativo")?.innerText.trim();

  if (!tamanho) {
    alert("Escolha um tamanho antes de adicionar ao carrinho.");
    return;
  }

  carregarCarrinho();

  const itemExistente = carrinho.find(item =>
    item.nome === produtoDetalheAtual.nome && item.tamanho === tamanho
  );

  if (itemExistente) {
    itemExistente.quantidade += 1;
  } else {
    carrinho.push({
      nome: produtoDetalheAtual.nome,
      preco: produtoDetalheAtual.preco,
      imagem: produtoDetalheAtual.img,
      tamanho: tamanho,
      quantidade: 1
    });
  }

  salvarCarrinho();
  atualizarTudo();
  animarProdutoParaCarrinho(
document.querySelector(".btn-carrinho")
);
  mostrarToastMS();
  fecharProdutoDetalhe();
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
    const cep = document.getElementById("cepCheckout")?.value || "";
    const rua = document.getElementById("ruaCliente")?.value || "";
    const numero = document.getElementById("numeroCasa")?.value || "";
    const bairro = document.getElementById("bairroCliente")?.value || "";
    const cidade = document.getElementById("cidadeCliente")?.value || "";

    resumoPagamentoMobile.innerHTML = `
      <div class="conferencia-pagamento">
        <h4>Dados da entrega</h4>
        <p><strong>Nome:</strong> ${nome}</p>
        <p><strong>WhatsApp:</strong> ${telefone}</p>
        <p><strong>Endereço:</strong> ${rua}, ${numero}</p>
        <p><strong>Bairro:</strong> ${bairro}</p>
        <p><strong>Cidade:</strong> ${cidade}</p>
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

function irPagamento() {

  const cep = document.getElementById("cepCheckout")?.value.trim();
  const whats = document.getElementById("telefoneClienteMobile")?.value.trim();
  const rua = document.getElementById("ruaCliente")?.value.trim();
  const numero = document.getElementById("numeroCasa")?.value.trim();
  const bairro = document.getElementById("bairroCliente")?.value.trim();
  const cidade = document.getElementById("cidadeCliente")?.value.trim();
  const estado = document.getElementById("estadoCliente")?.value.trim();

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

  mostrarEtapa("etapaPagamento");

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  const subtotal = carrinho.reduce((acc, item) => {
    return acc + Number(item.preco) * Number(item.quantidade || 1);
  }, 0);

  const total = subtotal + Number(valorFrete || 0);

  document.getElementById("fretePagamentoMobile").innerText =
    dinheiro(valorFrete);

  document.getElementById("totalPagamentoMobile").innerText =
    dinheiro(total);

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
    const resposta = await fetch("http://127.0.0.1:3000/calcular-frete", {
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

    const resposta = await fetch("http://127.0.0.1:3000/calcular-frete", {
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

  produtoDetalheAtual = {
    nome: card.dataset.nome || card.querySelector("h3")?.innerText || "",
    preco: pegarPrecoNumero(card.dataset.preco || card.querySelector(".preco")?.innerText || 0),
    img: card.dataset.img || card.querySelector(".foto-normal")?.getAttribute("src") || ""
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
  if (detalheNome) detalheNome.innerText = produtoDetalheAtual.nome;
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

    window.location.replace(dados.init_point);
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

  favoritos.classList.toggle("ativo");
}

function fecharFavoritos(){
  document.getElementById("painelFavoritos")?.classList.remove("ativo");
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

function avaliar(event, elemento, nota){

event.stopPropagation();

const estrelas =
elemento.parentElement.querySelectorAll("span");

estrelas.forEach((estrela, index)=>{

if(index < nota){
estrela.classList.add("ativa");
}else{
estrela.classList.remove("ativa");
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
function comprarAgoraDetalhe() {
  const detalhe = document.getElementById("produtoDetalhe");

  if (!detalhe || !produtoDetalheAtual) {
    alert("Produto não encontrado.");
    return;
  }

  const tamanho = detalhe.querySelector(".detalhe-tamanhos button.ativo")?.innerText.trim();

  if (!tamanho) {
    alert("Escolha um tamanho antes de comprar.");
    return;
  }

  carregarCarrinho();

  carrinho.push({
    nome: produtoDetalheAtual.nome,
    preco: produtoDetalheAtual.preco,
    imagem: produtoDetalheAtual.img,
    tamanho: tamanho,
    quantidade: 1
  });

  salvarCarrinho();

mostrarToastMS();

atualizarTudo();

  fecharProdutoDetalhe();

  if (window.innerWidth <= 768) {
    abrirCarrinhoMobileMS();
    mostrarEtapaMS("cmmsEtapaFrete");
  } else {
    abrirCarrinho();
    irEntregaPC();
  }
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
function avaliar(event, estrela, nota) {
  event.stopPropagation();

  const box = estrela.closest(".avaliacao-produto");
  if (!box) return;

  box.dataset.nota = nota;

  const estrelas = box.querySelectorAll("span");

  estrelas.forEach((s, index) => {
    if (index < nota) {
      s.classList.add("ativa");
    } else {
      s.classList.remove("ativa");
    }
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

function adicionarCarrinho(botao){
  const card = botao.closest(".card-produto");

  if(!card){
    alert("Produto não encontrado.");
    return;
  }

  const tamanho = card.dataset.tamanho;

  if(!tamanho){
    alert("Escolha um tamanho antes de adicionar.");
    return;
  }

  const carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];

  carrinho.push({
    nome: botao.dataset.nome || card.dataset.nome,
    preco: Number(botao.dataset.preco || card.dataset.preco),
    imagem: botao.dataset.img || card.dataset.img,
    tamanho: tamanho,
    quantidade: 1
  });

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

  localStorage.setItem("carrinho", JSON.stringify(carrinho));

if(typeof atualizarCarrinho === "function"){
  atualizarCarrinho();
}

if(typeof atualizarContador === "function"){
  atualizarContador();
}

animarProdutoAoCarrinho(botao);

mostrarToastMS();
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

  document.getElementById("ruaClienteMobile").value = dados.logradouro || "";
  document.getElementById("bairroClienteMobile").value = dados.bairro || "";
  document.getElementById("cidadeClienteMobile").value = dados.localidade || "";
  document.getElementById("estadoClienteMobile").value = dados.uf || "";
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
  const itensFavoritos = favoritos.map(item => ({
  ...item,
  quantidade: item.quantidade || 1
}));

window.carrinho = itensFavoritos;
window.carrinhoMobile = itensFavoritos;

localStorage.setItem("carrinho", JSON.stringify(itensFavoritos));
localStorage.setItem("carrinhoMS", JSON.stringify(itensFavoritos));

if (window.innerWidth <= 768) {

  abrirCarrinhoMobileMS();
  carregarCarrinhoMobileMS();
  mostrarEtapaMS("cmmsEtapaProdutos");

} else {

  fecharFavoritos();
  abrirCarrinho();

  if (typeof montarResumoPagamentoPC === "function") {
    montarResumoPagamentoPC();
  }

}
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
