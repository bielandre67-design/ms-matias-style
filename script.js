let carrinho = [];
let valorFrete = 0;
let desconto = 0;
let totalComFrete = 0;

function selecionarTamanho(botao, tamanho) {

  const card = botao.closest(".card-produto");

  card.querySelectorAll(".tamanhos button").forEach(btn => {
    btn.classList.remove("ativo");
  });

  botao.classList.add("ativo");

  card.dataset.tamanho = tamanho;

}

function atualizarContador(){
  let totalItens = 0;

  carrinho.forEach(item => {
    totalItens += item.quantidade;
  });

  document.getElementById("contadorCarrinho").innerText = totalItens;
}


function atualizarCarrinho(){

  let lista = document.getElementById("listaCarrinho");
  let totalElemento = document.getElementById("totalCarrinho");

  lista.innerHTML = "";

  let total = 0;

  if(carrinho.length === 0){
    lista.innerHTML = `
      <p class="carrinho-vazio">
        Seu carrinho está vazio.
      </p>
    `;

    totalComFrete = 0;
    totalElemento.innerText = "R$ 0,00";
    atualizarContador();
    return;
  }

  carrinho.forEach((item, index) => {

    total += item.preco * item.quantidade;

    lista.innerHTML += `
      <div class="item-carrinho">
       <img src="${item.img}" class="img-carrinho">

        <div class="item-info">
          <h4>${item.nome}</h4>
          <p>Tamanho: ${item.tamanho}</p>
          <p>R$ ${item.preco.toFixed(2).replace(".", ",")}</p>

          <div class="controle-quantidade">
            <button onclick="diminuirQuantidade(${index})">-</button>
            <span class="numero-quantidade">${item.quantidade}</span>
            <button onclick="aumentarQuantidade(${index})">+</button>
          </div>

          <button class="remover-item" onclick="removerItem(${index})">
            Remover
          </button>
        </div>
      </div>
    `;
  });

  totalComFrete = total + valorFrete;

  totalElemento.innerText =
  `R$ ${totalComFrete.toFixed(2).replace(".", ",")}`;

  atualizarContador();
}

function removerItem(index){

  carrinho.splice(index, 1);

  atualizarContador();
  atualizarCarrinho();


  document.getElementById("contadorCarrinho").innerText = contador;

  atualizarCarrinho();
}

function abrirCarrinho() {

  if (window.innerWidth <= 768) {
    window.location.href = "carrinho.html";
    return;
  }

  document.getElementById("carrinho")
    .classList.add("ativo");

  document.getElementById("fundoCarrinho")
    .classList.add("ativo");
}

function fecharCarrinho(){

  document.getElementById("carrinho")
    .classList.remove("ativo");

  document.getElementById("fundoCarrinho")
    .classList.remove("ativo");
}

function mostrarAviso(){

  let aviso = document.getElementById("aviso");

  aviso.classList.add("ativo");

  setTimeout(() => {
    aviso.classList.remove("ativo");
  }, 2500);
}
async function finalizarCompra(){
  
  if(carrinho.length === 0){
    alert("Seu carrinho está vazio.");
    return;
  }
  let cep = document.getElementById("cepCliente").value.trim();
let rua = document.getElementById("ruaCliente").value.trim();
let numero = document.getElementById("numeroCliente").value.trim();
let bairro = document.getElementById("bairroCliente").value.trim();
let cidade = document.getElementById("cidadeCliente").value.trim();
let estado = document.getElementById("estadoCliente").value.trim();
let nome = document.getElementById("nomeCliente").value.trim();
let telefone = document.getElementById("telefoneCliente").value.trim();

if(!nome || !telefone){
  alert("Preencha seu nome e WhatsApp antes de finalizar a compra.");
  return;
}

if(!cep || !rua || !numero || !bairro || !cidade || !estado){
  alert("Preencha o endereço completo antes de finalizar a compra.");
  return;
}

// if(valorFrete <= 0){
//   alert("Calcule o frete antes de finalizar a compra.");
//   return;
// }

  try{
console.log("FRETE ENVIADO:", valorFrete, freteSelecionado);
    const resposta = await fetch("https://ms-matias-style.onrender.com/criar-pagamento", {
    method:"POST",

      headers:{
        "Content-Type":"application/json"
      },

     body: JSON.stringify({

  itens: carrinho,

  nome: document.getElementById("nomeCliente").value,
  telefone: document.getElementById("telefoneCliente").value,

  cep: document.getElementById("cepCliente").value,

  

  cep: document.getElementById("cepCliente").value,
  rua: document.getElementById("ruaCliente").value,
  numero: document.getElementById("numeroCliente").value,
  complemento: document.getElementById("complementoCliente").value,
  bairro: document.getElementById("bairroCliente").value,
  ccidade: document.getElementById("cidadeCliente").value,
estado: document.getElementById("estadoCliente").value,

valorFrete: valorFrete,
freteSelecionado: freteSelecionado

})
    });

    const dados = await resposta.json();

console.log(dados);

if(dados.init_point){
    window.location.href = dados.init_point;
}else{
    alert("Mercado Pago não gerou o link de pagamento. Veja o console.");
}

}catch(erro){
   console.log(erro);
   alert("Erro ao iniciar pagamento.");
}

} // <- adiciona ESSA aqui

function aumentarQuantidade(index){

    carrinho[index].quantidade += 1;

    atualizarContador();
    atualizarCarrinho();
}

function diminuirQuantidade(index){

    if(carrinho[index].quantidade > 1){
        carrinho[index].quantidade -= 1;
    }else{
        carrinho.splice(index, 1);
    }

    atualizarContador();
    atualizarCarrinho();
}
async function calcularFrete() {

  const cep = document.getElementById("cepCliente").value.replace(/\D/g, "");
  const resultadoFrete = document.getElementById("resultadoFrete");

  if (cep.length !== 8) {
    alert("Digite um CEP válido.");
    return;
  }

  resultadoFrete.innerHTML = "Calculando frete...";

  try {

    const resposta = await fetch("https://ms-matias-style.onrender.com/calcular-frete", {
  method: "POST",
  headers: {
    "Content-Type": "application/json"
  },
  body: JSON.stringify({ cep })
});

const fretes = await resposta.json();

    const opcoesValidas = fretes.filter(frete => !frete.error);

    if (opcoesValidas.length === 0) {
      resultadoFrete.innerHTML = "Nenhuma opção de frete encontrada.";
      return;
    }

    resultadoFrete.innerHTML = opcoesValidas.map(frete => `
      <div class="opcao-frete"
        onclick="selecionarFrete('${frete.company.name}', ${frete.price}, ${frete.delivery_time})">

        <strong>${frete.company.name} - ${frete.name}</strong><br>

        R$ ${Number(frete.price).toFixed(2).replace(".", ",")}<br>

        <small>Prazo: ${frete.delivery_time} dias úteis</small>
      </div>
    `).join("");

  } catch (erro) {

    console.log(erro);

    resultadoFrete.innerHTML = "Erro ao calcular o frete.";
  }
}

window.calcularFrete = calcularFrete;


let freteSelecionado = null;

function selecionarFrete(nome, preco, prazo) {
  preco = Number(preco);

  freteSelecionado = {
    nome: nome,
    preco: preco,
    prazo: prazo
  };

  valorFrete = preco;

  const resultadoFrete = document.getElementById("resultadoFrete");

  resultadoFrete.innerHTML = `
    <div class="frete-escolhido">
      Frete escolhido: <strong>${nome}</strong><br>
      Valor: R$ ${preco.toFixed(2).replace(".", ",")}<br>
      Prazo: ${prazo} dias uteis
    </div>
  `;

  atualizarCarrinho();
}

function adicionarCarrinho(botao) {

  const card = botao.closest(".card-produto");

  const tamanhoSelecionado =
    card.querySelector(".tamanhos button.ativo");

  if (!tamanhoSelecionado) {
    alert("Escolha um tamanho antes de adicionar.");
    return;
  }

  const produto = {
    nome: botao.dataset.nome,
    preco: Number(botao.dataset.preco),
    img: botao.dataset.img,
    tamanho: tamanhoSelecionado.innerText,
    quantidade: 1
  };

  // MOBILE
  if (window.innerWidth <= 768) {

    let carrinhoMobile =
      JSON.parse(localStorage.getItem("carrinhoMobile")) || [];

    const produtoExistente = carrinhoMobile.find(item =>
      item.nome === produto.nome &&
      item.tamanho === produto.tamanho
    );

    if (produtoExistente) {
      produtoExistente.quantidade += 1;
    } else {
      carrinhoMobile.push(produto);
    }

    localStorage.setItem(
      "carrinhoMobile",
      JSON.stringify(carrinhoMobile)
    );

    atualizarContadorMobile();

    alert("Produto adicionado ao carrinho!");

    return;
  }

  // PC
  carrinho.push(produto);

  atualizarCarrinho();

  abrirCarrinho();
}
function fecharAviso() {
    document.getElementById("avisoMS").classList.remove("ativo");
}
function aplicarCupom(){

    const cupom =
    document.getElementById("cupomInput")
    .value
    .trim()
    .toUpperCase();

    const mensagem =
    document.getElementById("cupomMensagem");

    if(cupom === "MS10"){

        desconto = 10;

        mensagem.innerText =
        "Cupom aplicado: 10% OFF 🔥";

    }else{

        desconto = 0;

        mensagem.innerText =
        "Cupom inválido.";

    }

    atualizarCarrinho();
}


function trocarSlideHero () {
    

    if (slides.length === 0) return;

    slides[slideAtual].classList.remove("ativa");

    slideAtual = (slideAtual + 1) % slides.length;

    slides[slideAtual].classList.add("ativa");
}

setInterval(trocarSlideHero, 1000);

function abrirContato(){
    document.getElementById("modalContato").classList.add("ativo");
}

function fecharContato(){
    document.getElementById("modalContato").classList.remove("ativo");
}
async function buscarEndereco(){

  let cep = document.getElementById("cepCliente").value.replace(/\D/g, "");

  if(cep.length !== 8){
    return;
  }

  try{

    const resposta = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const endereco = await resposta.json();

    if(endereco.erro){
      alert("CEP não encontrado.");
      return;
    }

    document.getElementById("ruaCliente").value = endereco.logradouro || "";
    document.getElementById("bairroCliente").value = endereco.bairro || "";
    document.getElementById("cidadeCliente").value = endereco.localidade || "";
    document.getElementById("estadoCliente").value = endereco.uf || "";

  }catch(erro){
    alert("Erro ao buscar endereço.");
  }
}
let produtoAtualDetalhe = null;

document.querySelectorAll(".card-produto").forEach(card => {
  card.addEventListener("click", function(e) {
    if (e.target.tagName === "BUTTON") return;

    const nome = this.querySelector("h3").innerText;
    const preco = this.querySelector(".preco").innerText;
    const img = this.querySelector(".foto-normal").getAttribute("src");

    produtoAtualDetalhe = {
      nome: nome,
      preco: preco,
      img: img
    };

    document.getElementById("detalheNome").innerText = nome;
    document.getElementById("detalhePreco").innerText = preco;
    document.getElementById("detalheImg").src = img;

    document.getElementById("produtoDetalhe").classList.add("ativo");
  });
});

function fecharProdutoDetalhe() {
  document.getElementById("produtoDetalhe").classList.remove("ativo");
}

function adicionarProdutoDetalhe() {

  const tamanhoSelecionado = document.querySelector(
    ".detalhe-tamanhos button.ativo"
  );

  if (!tamanhoSelecionado) {
    alert("Escolha um tamanho");
    return;
  }

  const produto = {
    nome: produtoAtualDetalhe.nome,
    preco: produtoAtualDetalhe.preco,
    img: produtoAtualDetalhe.img,
    tamanho: tamanhoSelecionado.innerText,
    quantidade: 1
  };

  localStorage.setItem(
    "produtoComprarAgora",
    JSON.stringify(produto)
  );

  window.location.href = "carrinho.html";
}
function mostrarEtapa(id) {

  document.querySelectorAll(".etapa-checkout").forEach(e => {
    e.classList.remove("ativa");
  });

  document.getElementById(id).classList.add("ativa");

  document.querySelectorAll(".etapas span").forEach(e => {
    e.classList.remove("ativo");
  });

  if (id === "etapaCarrinho") {
    document
      .querySelector(".etapas span:nth-child(1)")
      .classList.add("ativo");
  }

  if (id === "etapaEntrega") {
    document
      .querySelector(".etapas span:nth-child(2)")
      .classList.add("ativo");
  }

  if (id === "etapaPagamento") {
    document
      .querySelector(".etapas span:nth-child(3)")
      .classList.add("ativo");
  }

}

function irEntrega() {
  mostrarEtapa("etapaEntrega");
  document.getElementById("tituloEtapa").innerText = "Entrega";
}

function irPagamento() {
  mostrarEtapa("etapaPagamento");
  document.getElementById("tituloEtapa").innerText = "Pagamento";
}

function calcularFreteCheckout() {

  const cep = document
    .getElementById("cepCheckout")
    .value
    .replace(/\D/g, "");

  if (cep.length !== 8) {
    alert("Digite um CEP válido");
    return;
  }

  const valorFrete = 15.90;

  document.getElementById("freteValor").innerText =
    valorFrete.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  const subtotal = 1;
  const total = subtotal + valorFrete;

  document.getElementById("totalCheckout").innerText =
    total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

}


function finalizarCompra() {
  alert("Agora vamos ligar isso no Mercado Pago.");
}

let slideAtualBanner = 0;

setInterval(() => {
  

  if (!slides || slides.length === 0) return;

  slides.forEach(slide => slide.classList.remove("ativo"));

  slideAtualBanner++;

  if (slideAtualBanner >= slides.length) {
    slideAtualBanner = 0;
  }

  slides[slideAtualBanner].classList.add("ativo");
}, 2500);
let tamanhoSelecionado = "";
let quantidadeMobile = 1;
let precoMobile = 1;

function alterarQuantidade(valor) {
  quantidadeMobile += valor;

  if (quantidadeMobile < 1) {
    quantidadeMobile = 1;
  }

  const qtd = document.getElementById("quantidadeCheckout");
  if (qtd) qtd.innerText = quantidadeMobile;

  const subtotal = precoMobile * quantidadeMobile;

  const subtotal1 = document.getElementById("subtotal1");
  const total1 = document.getElementById("total1");

  if (subtotal1) {
    subtotal1.innerText = subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (total1) {
    total1.innerText = subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }
}
function atualizarContadorMobile() {
  const carrinhoMobile = JSON.parse(localStorage.getItem("carrinhoMobile")) || [];
  const total = carrinhoMobile.reduce((soma, item) => soma + item.quantidade, 0);

  const contador = document.getElementById("contadorCarrinho");
  if (contador) contador.innerText = total;
}

document.addEventListener("DOMContentLoaded", atualizarContadorMobile);
function carregarCarrinhoMobile() {
  if (!document.querySelector(".checkout-ms")) return;

  const carrinhoMobile =
    JSON.parse(localStorage.getItem("carrinhoMobile")) || [];

  if (carrinhoMobile.length === 0) return;

  const produto = carrinhoMobile[0];

  document.getElementById("checkoutImg").src = produto.img;
  document.getElementById("checkoutNome").innerText = produto.nome;
  document.getElementById("checkoutTam").innerText = "Tamanho: " + produto.tamanho;
  document.getElementById("quantidadeCheckout").innerText = produto.quantidade;

  const subtotal = carrinhoMobile.reduce((total, item) => {
    return total + Number(item.preco) * item.quantidade;
  }, 0);

  document.getElementById("subtotal1").innerText =
    subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  document.getElementById("total1").innerText =
    subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
}

document.addEventListener("DOMContentLoaded", carregarCarrinhoMobile);
function carregarCarrinhoMobile() {

  const lista =
    document.getElementById("listaCarrinhoMobile");

  if (!lista) return;

  const carrinhoMobile =
    JSON.parse(localStorage.getItem("carrinhoMobile")) || [];

  lista.innerHTML = "";

  if (carrinhoMobile.length === 0) {

    lista.innerHTML = `
      <p style="text-align:center; color:#999;">
        Seu carrinho está vazio.
      </p>
    `;

    return;
  }

  let subtotal = 0;

  carrinhoMobile.forEach((item, index) => {

    subtotal += item.preco * item.quantidade;

    lista.innerHTML += `

      <div class="item-checkout">

        <div class="produto-topo">

          <img src="${item.img}" class="img-carrinho">

          <div class="produto-info">

            <h3>${item.nome}</h3>

            <p>Tamanho: ${item.tamanho}</p>

            <div class="qtd">

              <button onclick="alterarQuantidadeMobile(${index}, -1)">
                −
              </button>

              <span>${item.quantidade}</span>

              <button onclick="alterarQuantidadeMobile(${index}, 1)">
                +
              </button>

            </div>

            <strong>
              ${(item.preco * item.quantidade).toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL"
              })}
            </strong>

          </div>

        </div>

      </div>

    `;
  });

  document.getElementById("subtotal1").innerText =
    subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

  document.getElementById("total1").innerText =
    subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });

}

function alterarQuantidadeMobile(index, valor) {

  let carrinhoMobile =
    JSON.parse(localStorage.getItem("carrinhoMobile")) || [];

  carrinhoMobile[index].quantidade += valor;

  if (carrinhoMobile[index].quantidade <= 0) {
    carrinhoMobile.splice(index, 1);
  }

  localStorage.setItem(
    "carrinhoMobile",
    JSON.stringify(carrinhoMobile)
  );

  carregarCarrinhoMobile();

  atualizarContadorMobile();
}

document.addEventListener(
  "DOMContentLoaded",
  carregarCarrinhoMobile
);
function limparCarrinhoMobile() {

  localStorage.removeItem("carrinhoMobile");

  carregarCarrinhoMobile();

  atualizarContadorMobile();

}
function irEntregaPC() {

  document.querySelectorAll(".etapa-pc")
    .forEach(etapa => {
      etapa.classList.remove("ativa");
    });

  document
    .getElementById("etapaEntregaPC")
    .classList.add("ativa");

  document.querySelectorAll(".etapas-pc span")
    .forEach(step => {
      step.classList.remove("ativo");
    });

  document
    .getElementById("step2")
    .classList.add("ativo");

}
function irPagamentoPC() {

  document.querySelectorAll(".etapa-pc").forEach(etapa => {
    etapa.classList.remove("ativa");
  });

  document.getElementById("etapaPagamentoPC").classList.add("ativa");

  document.querySelectorAll(".etapas-pc span").forEach(step => {
    step.classList.remove("ativo");
  });

  document.getElementById("step3").classList.add("ativo");

  montarResumoPagamentoPC();

}

function finalizarCompraFinal() {
  finalizarCompra();
}
function limparCarrinhoPC() {
  carrinho = [];
  atualizarCarrinho();
  atualizarContador();
  irCarrinhoPC();
}
function irCarrinhoPC() {

  document.querySelectorAll(".etapa-pc")
    .forEach(etapa => {
      etapa.classList.remove("ativa");
    });

  document
    .getElementById("etapaCarrinhoPC")
    .classList.add("ativa");

  document.querySelectorAll(".etapas-pc span")
    .forEach(step => {
      step.classList.remove("ativo");
    });

  document
    .getElementById("step1")
    .classList.add("ativo");

}
function irEntregaPC() {

  document.querySelectorAll(".etapa-pc")
    .forEach(etapa => {
      etapa.classList.remove("ativa");
    });

  document
    .getElementById("etapaEntregaPC")
    .classList.add("ativa");

  document.querySelectorAll(".etapas-pc span")
    .forEach(step => {
      step.classList.remove("ativo");
    });

  document
    .getElementById("step2")
    .classList.add("ativo");

}
function montarResumoPagamentoPC() {
  const resumo = document.getElementById("resumoPagamentoPC");
  if (!resumo) return;

  if (!carrinho || carrinho.length === 0) {
    resumo.innerHTML = "<p>Seu carrinho está vazio.</p>";
    return;
  }

  let subtotal = 0;

  resumo.innerHTML = "<h3>Resumo do pedido</h3>";

  carrinho.forEach(item => {
    subtotal += Number(item.preco) * item.quantidade;

    resumo.innerHTML += `
      <div class="item-resumo-pc">
        <img src="${item.img}">
        <div>
          <strong>${item.nome}</strong>
          <p>Tamanho: ${item.tamanho}</p>
          <p>Qtd: ${item.quantidade}</p>
        </div>
        <span>
          ${(Number(item.preco) * item.quantidade).toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL"
          })}
        </span>
      </div>
    `;
  });

  resumo.innerHTML += `
    <div class="total-resumo-pc">
      <p>
        <span>Total</span>
        <strong>${document.getElementById("totalCarrinho").innerText}</strong>
      </p>
    </div>
  `;
}
/* ===== SLIDER AUTOMÁTICO ===== */



let slideAtual = 0;

function trocarSlide() {

  slides[slideAtual].classList.remove('ativo');

  slideAtual++;

  if (slideAtual >= slides.length) {
    slideAtual = 0;
  }

  slides[slideAtual].classList.add('ativo');
}

/* troca a cada 4 segundos */
setInterval(trocarSlide, 4000);
/* ===== SLIDER AUTOMÁTICO ===== */

const slides = document.querySelectorAll(".slide");



function trocarSlide() {

  slides[slideAtual].classList.remove("ativo");

  slideAtual++;

  if (slideAtual >= slides.length) {
    slideAtual = 0;
  }

  slides[slideAtual].classList.add("ativo");
}

/* troca sozinho */
setInterval(trocarSlide, 3500);