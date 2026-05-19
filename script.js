let carrinho = JSON.parse(localStorage.getItem("carrinho")) || [];
let valorFrete = 0;
let desconto = 0;
let totalComFrete = 0;

function selecionarTamanho(botao, tamanho) {
  const grupo = botao.closest(".tamanhos");

  if (!grupo) return;

  grupo.querySelectorAll("button").forEach(btn => {
    btn.classList.remove("ativo");
  });

  botao.classList.add("ativo");

  const card = botao.closest(".card-produto");

  if (card) {
    card.dataset.tamanho = tamanho;
  }

  const detalhe = botao.closest("#produtoDetalhe");

  if (detalhe) {
    detalhe.dataset.tamanho = tamanho;
  }
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
  localStorage.setItem("carrinho", JSON.stringify(carrinho));
  localStorage.setItem("carrinhoMobile", JSON.stringify(carrinho));
  atualizarContador();
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
  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

 const nome =
  document.getElementById("nomeClienteMobile")?.value.trim() ||
  document.getElementById("nomeCliente")?.value.trim() ||
  "";

const telefone =
  document.getElementById("telefoneClienteMobile")?.value.trim() ||
  document.getElementById("telefoneCliente")?.value.trim() ||
  "";

const cep =
  document.getElementById("cepCheckout")?.value.trim() ||
  document.getElementById("cepCliente")?.value.trim() ||
  "";

const rua =
  document.getElementById("ruaCliente")?.value.trim() ||
  "";

const numero =
  document.getElementById("numeroCasa")?.value.trim() ||
  document.getElementById("numeroCliente")?.value.trim() ||
  "";

const complemento =
  document.getElementById("complementoCliente")?.value.trim() ||
  "";

const bairro =
  document.getElementById("bairroCliente")?.value.trim() ||
  "";

const cidade =
  document.getElementById("cidadeCliente")?.value.trim() ||
  "";

const estado =
  document.getElementById("estadoCliente")?.value.trim() ||
  "";

  if(!nome || !telefone){
    alert("Preencha seu nome e WhatsApp antes de finalizar a compra.");
    return;
  }

  if(!cep || !rua || !numero || !bairro || !cidade){
    alert("Preencha o endereço completo antes de finalizar a compra.");
    return;
  }

  try{
    console.log("FRETE ENVIADO:", valorFrete, freteSelecionado);

    const resposta = await fetch("https://ms-matias-style.onrender.com/criar-pagamento", {
      method:"POST",
      headers:{
        "Content-Type":"application/json"
      },
      body: JSON.stringify({
        items: carrinho,
        nome,
        telefone,
        cep,
        rua,
        numero,
        complemento,
        bairro,
        cidade,
        estado,
        valorFrete: valorFrete,
        freteSelecionado: freteSelecionado,
        desconto: desconto,
        totalComFrete: totalComFrete
      })
    });

    const novoPedido = {
  id: Date.now(),
  nome,
  telefone,
  endereco: {
    cep,
    rua,
    numero,
    complemento,
    bairro,
    cidade
  },
  produtos: carrinho,
  frete: freteSelecionado || {
    nome: "Frete selecionado",
    preco: valorFrete
  },
  total: totalComFrete,
  status: "pendente",
  data: new Date().toLocaleString("pt-BR")
};

const pedidosSalvos =
  JSON.parse(localStorage.getItem("pedidosMS")) || [];

pedidosSalvos.push(novoPedido);

localStorage.setItem(
  "pedidosMS",
  JSON.stringify(pedidosSalvos)
);

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
}

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

  
  const tamanho =
document.getElementById("produtoDetalhe")
.dataset.tamanho;

if (!tamanho) {
  mostrarAviso();
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

function irEntregaPC() {

  if (carrinho.length === 0) {
    alert("Seu carrinho está vazio.");
    return;
  }

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
function irEntrega() {

  if (carrinho.length === 0) {
    alert("Adicione um produto ao carrinho.");
    return;
  }

  mostrarEtapa("etapaEntrega");

  document.getElementById("tituloEtapa").innerText =
    "Entrega";
}

function irPagamento() {

  const cep =
    document.getElementById("cepCheckout")?.value.trim();

  if (!cep || cep.length < 8) {
    alert("Preencha o CEP antes de continuar.");
    return;
  }

  if (valorFrete <= 0) {
    alert("Calcule e selecione um frete.");
    return;
  }
  atualizarTotaisMobile();

  mostrarEtapa("etapaPagamento");

  document.getElementById("tituloEtapa").innerText =
    "Pagamento";
}

async function calcularFreteCheckout() {

 const cep = document
  .getElementById("cepCheckout")
  .value
  .replace(/\D/g, "");

const respostaCep = await fetch(
  `https://viacep.com.br/ws/${cep}/json/`
);

const dadosCep = await respostaCep.json();

if (!dadosCep.erro) {

  document.getElementById("ruaCliente").value =
    dadosCep.logradouro || "";

  document.getElementById("bairroCliente").value =
    dadosCep.bairro || "";

  document.getElementById("cidadeCliente").value =
    dadosCep.localidade || "";

}


  const resposta = await fetch("https://ms-matias-style.onrender.com/calcular-frete", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ cep })
  });

  const fretes = await resposta.json();

  const container = document.getElementById("opcoesFreteCheckout");

  container.innerHTML = "";

  fretes.forEach(frete => {

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

      <strong>
        ${preco.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}
      </strong>
    `;

    div.onclick = () => {

  document.querySelectorAll(".frete-opcao").forEach(opcao => {
    if (opcao !== div) {
      opcao.style.display = "none";
    }
  });

  div.classList.add("frete-selecionado");

  valorFrete = preco;

      document.getElementById("freteResumo").innerText =
        preco.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });

      const subtotal = 1;

      const total = subtotal + preco;

      document.getElementById("totalCheckout").innerText =
        total.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        });

    };

    container.appendChild(div);

  });

}





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
            <button class="remover-mobile" onclick="removerItem(${index})">
Remover
</button>

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

  const nome =
    document.getElementById("nomeCliente")?.value.trim();

  const telefone =
    document.getElementById("telefoneCliente")?.value.trim();

  const cep =
    document.getElementById("cepCliente")?.value.trim();

  if (!nome || !telefone || !cep) {
    alert("Preencha todos os dados antes de continuar.");
    return;
  }

  if (valorFrete <= 0) {
    alert("Selecione um frete antes de continuar.");
    return;
  }

  document.querySelectorAll(".etapa-pc").forEach(etapa => {
    etapa.classList.remove("ativa");
  });

  document
    .getElementById("etapaPagamentoPC")
    .classList.add("ativa");

  document.querySelectorAll(".etapas-pc span").forEach(step => {
    step.classList.remove("ativo");
  });

  document
    .getElementById("step3")
    .classList.add("ativo");

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

/* ===== SLIDER AUTOMÁTICO SEGURO ===== */
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
function atualizarTotaisMobile() {
  const carrinhoMobile =
    JSON.parse(localStorage.getItem("carrinhoMobile")) || [];

  const subtotal = carrinhoMobile.reduce((total, item) => {
    return total + Number(item.preco) * item.quantidade;
  }, 0);

  const total = subtotal + Number(valorFrete || 0);

  const subtotalCheckout = document.getElementById("subtotalCheckout");
  const totalCheckout = document.getElementById("totalCheckout");
  const totalPagamentoMobile = document.getElementById("totalPagamentoMobile");
  const resumoPagamentoMobile = document.getElementById("resumoPagamentoMobile");

  if (subtotalCheckout) {
    subtotalCheckout.innerText = subtotal.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (totalCheckout) {
    totalCheckout.innerText = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

  if (totalPagamentoMobile) {
    totalPagamentoMobile.innerText = total.toLocaleString("pt-BR", {
      style: "currency",
      currency: "BRL"
    });
  }

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
        <p><strong>Frete:</strong> ${Number(valorFrete || 0).toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL"
        })}</p>
      </div>
    `;
  }
}
function voltarCheckoutMobile() {
  const etapaCarrinho = document.getElementById("etapaCarrinho");
  const etapaEntrega = document.getElementById("etapaEntrega");
  const etapaPagamento = document.getElementById("etapaPagamento");

  if (etapaPagamento && etapaPagamento.classList.contains("ativa")) {
    etapaPagamento.classList.remove("ativa");
    etapaEntrega.classList.add("ativa");

    document.getElementById("tituloEtapa").innerText = "Entrega";

    document.querySelectorAll(".etapas span").forEach(step => {
      step.classList.remove("ativo");
    });

    document.querySelector('.etapas span[data-num="2"]').classList.add("ativo");
    return;
  }

  if (etapaEntrega && etapaEntrega.classList.contains("ativa")) {
    etapaEntrega.classList.remove("ativa");
    etapaCarrinho.classList.add("ativa");

    document.getElementById("tituloEtapa").innerText = "Carrinho";

    document.querySelectorAll(".etapas span").forEach(step => {
      step.classList.remove("ativo");
    });

    document.querySelector('.etapas span[data-num="1"]').classList.add("ativo");
    return;
  }

  window.location.href = "index.html";
}
let fotosDetalhe = [];
let fotoAtualDetalhe = 0;
let produtoDetalheAtual = null;

function abrirProdutoDetalheCard(card) {
  produtoDetalheAtual = {
    nome: card.dataset.nome,
    preco: Number(card.dataset.preco),
    img: card.dataset.img
  };

  fotosDetalhe = card.dataset.fotos.split(",");
  fotoAtualDetalhe = 0;

  document.getElementById("detalheImg").src = fotosDetalhe[fotoAtualDetalhe];
  document.getElementById("detalheNome").innerText = produtoDetalheAtual.nome;
  document.getElementById("detalhePreco").innerText =
    "R$ " + produtoDetalheAtual.preco.toFixed(2).replace(".", ",");

  document.getElementById("produtoDetalhe").classList.add("ativo");
}

function trocarFotoDetalhe(direcao) {
  fotoAtualDetalhe += direcao;

  if (fotoAtualDetalhe < 0) {
    fotoAtualDetalhe = fotosDetalhe.length - 1;
  }

  if (fotoAtualDetalhe >= fotosDetalhe.length) {
    fotoAtualDetalhe = 0;
  }

  document.getElementById("detalheImg").src = fotosDetalhe[fotoAtualDetalhe];
}