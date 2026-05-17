let carrinho = [];
let valorFrete = 0;
let desconto = 0;
let totalComFrete = 0;

function selecionarTamanho(botao, tamanho) {

    const card = botao.closest(".card-produto");

    card.querySelectorAll(".tamanhos button").forEach(btn => {
        btn.classList.remove("selecionado");
    });

    botao.classList.add("selecionado");

    card.dataset.tamanho = tamanho;

    console.log("Selecionado:", tamanho);
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
        <img src="${item.imagem}" class="img-carrinho">

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

function abrirCarrinho(){

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

if(valorFrete <= 0){
  alert("Calcule o frete antes de finalizar a compra.");
  return;
}

  try{

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

  itens: carrinho,

  cep: document.getElementById("cepCliente").value,
  rua: document.getElementById("ruaCliente").value,
  numero: document.getElementById("numeroCliente").value,
  complemento: document.getElementById("complementoCliente").value,
  bairro: document.getElementById("bairroCliente").value,
  cidade: document.getElementById("cidadeCliente").value,
  estado: document.getElementById("estadoCliente").value,

  total: totalComFrete

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

function calcularFrete(){
  if(carrinho.length === 0){
  alert("Escolha um tamanho e adicione o produto ao carrinho antes de calcular o frete.");
  return;
}

  let cep = document.getElementById("cepCliente").value;

  if(cep.length < 8){
    alert("Digite um CEP válido.");
    return;
  }

  valorFrete = 20;

  document.getElementById("resultadoFrete").innerText =
    "Frete: R$ 20,00";

  atualizarCarrinho();
}
function selecionarTamanho(botao, tamanho) {

    const card = botao.closest(".card-produto");

    card.querySelectorAll(".tamanhos button").forEach(btn => {
        btn.classList.remove("selecionado");
    });

    botao.classList.add("selecionado");

    card.dataset.tamanho = tamanho;
}

function adicionarCarrinho(botao) {
    const card = botao.closest(".card-produto");
    const tamanho = card.dataset.tamanho;

    if (!tamanho) {
        document.getElementById("avisoMS").classList.add("ativo");
return;
    }

    const nome = botao.dataset.nome;
    const preco = Number(botao.dataset.preco);
    const imagem = botao.dataset.img;

    carrinho.push({
        nome: nome,
        preco: preco,
        imagem: imagem,
        tamanho: tamanho,
        quantidade: 1
    });

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
let slideAtual = 0;

function trocarSlideHero() {
    const slides = document.querySelectorAll(".slide-img");

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