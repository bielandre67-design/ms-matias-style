const pedidosContainer = document.getElementById("pedidos");
const totalPedidos = document.getElementById("totalPedidos");
const totalPagos = document.getElementById("totalPagos");
const totalPendentes = document.getElementById("totalPendentes");

let filtroAtual = "todos";

function pegarPedidos() {
  return JSON.parse(localStorage.getItem("pedidosMS")) || [];
}

function salvarPedidos(pedidos) {
  localStorage.setItem("pedidosMS", JSON.stringify(pedidos));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function carregarPedidos() {
  const pedidos = pegarPedidos();

  const novos = pedidos.filter(p =>
    !p.status ||
    p.status === "pendente" ||
    p.status === "aguardando pagamento"
  );

  const pagos = pedidos.filter(p => p.status === "pago");
  const enviados = pedidos.filter(p => p.status === "enviado");

  if (totalPedidos) totalPedidos.innerText = pedidos.length;
  if (totalPagos) totalPagos.innerText = pagos.length;
  if (totalPendentes) totalPendentes.innerText = novos.length;

  const qtdNovos = document.getElementById("qtdNovos");
  const qtdPagosAba = document.getElementById("qtdPagosAba");
  const qtdEnviados = document.getElementById("qtdEnviados");

  if (qtdNovos) qtdNovos.innerText = novos.length;
  if (qtdPagosAba) qtdPagosAba.innerText = pagos.length;
  if (qtdEnviados) qtdEnviados.innerText = enviados.length;

  pedidosContainer.innerHTML = "";

  if (pedidos.length === 0) {
    pedidosContainer.innerHTML = `
      <div class="pedido-vazio">
        <h3>Nenhum pedido ainda</h3>
        <p>Quando alguém comprar na MS os pedidos aparecerão aqui.</p>
      </div>
    `;
    return;
  }

  const pedidosFiltrados = pedidos
    .filter(pedido => {
      if (filtroAtual === "todos") return true;

      if (filtroAtual === "pendente") {
        return (
          !pedido.status ||
          pedido.status === "pendente" ||
          pedido.status === "aguardando pagamento"
        );
      }

      return pedido.status === filtroAtual;
    })
    .reverse();

  if (pedidosFiltrados.length === 0) {
    pedidosContainer.innerHTML = `
      <div class="pedido-vazio">
        <h3>Nenhum pedido nesta aba</h3>
        <p>Troque de aba ou atualize o painel.</p>
      </div>
    `;
    return;
  }

  pedidosFiltrados.forEach(pedido => {
    const status = pedido.status || "pendente";

    const produtosHTML = (pedido.produtos || []).map(produto => `
      <div class="produto-admin">
        <img src="${produto.img}" alt="Produto">

        <div>
          <strong>${produto.nome}</strong>
          <p>Tamanho: ${produto.tamanho || "-"}</p>
          <p>Qtd: ${produto.quantidade || 1}</p>
          <p>${formatarMoeda(produto.preco)}</p>
        </div>
      </div>
    `).join("");

    const card = document.createElement("div");
    card.className = "pedido-card";

    card.innerHTML = `
      <div class="pedido-topo">
        <div>
          <h3>Pedido #${pedido.id}</h3>
          <p>${pedido.data || ""}</p>
        </div>

        <span class="status-pedido ${status}">
          ${status === "pago" ? "PAGO" : status === "enviado" ? "ENVIADO" : "PENDENTE"}
        </span>
      </div>

      <div class="cliente-admin">
        <h4>Cliente</h4>
        <p><strong>Nome:</strong> ${pedido.nome || "-"}</p>
        <p><strong>WhatsApp:</strong> ${pedido.telefone || "-"}</p>
      </div>

      <div class="endereco-admin">
        <h4>Endereço de entrega</h4>
        <p><strong>Rua:</strong> ${pedido.endereco?.rua || "-"}, ${pedido.endereco?.numero || "-"}</p>
        <p><strong>Bairro:</strong> ${pedido.endereco?.bairro || "-"}</p>
        <p><strong>Cidade:</strong> ${pedido.endereco?.cidade || "-"}</p>
        <p><strong>CEP:</strong> ${pedido.endereco?.cep || "-"}</p>
      </div>

      <div class="pedido-produtos">
        <h4>Produtos</h4>
        ${produtosHTML}
      </div>

      <div class="pedido-total">
        <strong>Total: ${formatarMoeda(pedido.total)}</strong>
      </div>

      <div class="pedido-botoes">
        <button onclick="copiarEndereco(${pedido.id})">Copiar endereço</button>
        <button onclick="imprimirPedido(${pedido.id})">Imprimir etiqueta</button>
        <button onclick="marcarPago(${pedido.id})">Marcar pago</button>
        <button onclick="marcarEnviado(${pedido.id})">Marcar enviado</button>
        <button onclick="abrirWhatsApp(${pedido.id})">Chamar no WhatsApp</button>
      </div>
    `;

    pedidosContainer.appendChild(card);
  });
}

function filtrarPedidos(filtro, botao) {
  filtroAtual = filtro;

  document.querySelectorAll(".aba-pedido").forEach(btn => {
    btn.classList.remove("ativa");
  });

  botao.classList.add("ativa");

  carregarPedidos();
}

function copiarEndereco(id) {
  const pedido = pegarPedidos().find(p => p.id === id);
  if (!pedido) return;

  const texto = `
${pedido.nome}
${pedido.telefone}

${pedido.endereco?.rua}, ${pedido.endereco?.numero}
${pedido.endereco?.bairro}
${pedido.endereco?.cidade}
CEP: ${pedido.endereco?.cep}
  `;

  navigator.clipboard.writeText(texto);
  alert("Endereço copiado!");
}

function imprimirPedido(id) {

  const pedidos =
    JSON.parse(localStorage.getItem("pedidosMS")) || [];

  const pedido =
    pedidos.find(p => p.id === id);

  if (!pedido) return;

  const janela = window.open("", "_blank");

  janela.document.write(`

  <html>

  <head>

    <title>Etiqueta MS</title>

   <style>

  body{
  font-family:Arial;
  background:#f2f2f2;
  padding:8px;
  margin:0;
}

  .etiqueta{
  width:620px;
  margin:auto;
  background:#fff;
  border: none;
  border-radius:20px;
  overflow:hidden;
  page-break-inside: avoid;
}
  
.box{
  page-break-inside: avoid;
}

      .topo{
  background:#000;
  color:#fff;
  padding:18px;
}

      .topo h1{
        margin:0;
        font-size:28px;
      }

      .topo p{
        margin-top:10px;
        opacity:.8;
      }

      .conteudo{
        padding:30px;
      }

      .box{
        border:2px solid #ddd;
        border-radius:18px;
        padding:25px;
        margin-bottom:25px;
      }

      h2{
        margin-top:0;
        font-size:24px;
      }

      p{
        font-size:18px;
        margin:10px 0;
      }

      .cep{
        font-size:26px;
        font-weight:bold;
        margin-top:20px;
      }

      .total{
        background:#000;
        color:#fff;
        padding:20px;
        border-radius:16px;
        font-size:22px;
        font-weight:bold;
      }

      .linha{
        border-top:2px dashed #999;
        margin:30px 0;
      }

      .pedido-id{
        font-size:22px;
        font-weight:bold;
        margin-bottom:20px;
      }

    </style>

  </head>

  <body>

    <div class="etiqueta">

      <div class="topo">

        <h1>MS Matias Style</h1>

        <p>
          Etiqueta de envio
        </p>

      </div>

      <div class="conteudo">

        <div class="pedido-id">
          Pedido #${pedido.id}
        </div>

        <div class="box">

          <h2>DESTINATÁRIO</h2>

          <p>
            <strong>Nome:</strong>
            ${pedido.nome}
          </p>

          <p>
            <strong>WhatsApp:</strong>
            ${pedido.telefone}
          </p>

          <p>
            <strong>Rua:</strong>
            ${pedido.endereco.rua},
            ${pedido.endereco.numero}
          </p>

          <p>
            <strong>Bairro:</strong>
            ${pedido.endereco.bairro}
          </p>

          <p>
            <strong>Cidade:</strong>
            ${pedido.endereco.cidade}
          </p>

          <div class="cep">
            CEP: ${pedido.endereco.cep}
          </div>

        </div>

        <div class="linha"></div>

        <div class="box">

          <h2>REMETENTE</h2>

          <p>
            <strong>MS Matias Style</strong>
          </p>
<p>
<p>
            Rua:Rua livramento 841
          </p>
            Bairro:Bairro santana
          </p>
        

          <p>
            Porto Alegre - RS
          </p>

          <p>
            CEP:90640130
          </p>

        </div>

        <div class="box">

          <h2>Produtos</h2>

          ${pedido.produtos.map(produto => `
            <p>
              <strong>${produto.nome}</strong>
              | Tam: ${produto.tamanho}
              | Qtd: ${produto.quantidade}
            </p>
          `).join("")}

        </div>

        <div class="total">
          Total: R$ ${pedido.total.toFixed(2)}
        </div>

      </div>

    </div>

    <script>
      window.print();
    </script>

  </body>

  </html>

  `);

  janela.document.close();
}

function marcarPago(id) {
  const pedidos = pegarPedidos();
  const pedido = pedidos.find(p => p.id === id);

  if (!pedido) return;

  pedido.status = "pago";
  salvarPedidos(pedidos);
  carregarPedidos();
}

function marcarEnviado(id) {
  const pedidos = pegarPedidos();
  const pedido = pedidos.find(p => p.id === id);

  if (!pedido) return;

  pedido.status = "enviado";
  salvarPedidos(pedidos);
  carregarPedidos();
}

function abrirWhatsApp(id) {
  const pedido = pegarPedidos().find(p => p.id === id);
  if (!pedido) return;

  const telefone = String(pedido.telefone || "").replace(/\D/g, "");

  const mensagem = encodeURIComponent(
    `Olá ${pedido.nome}, seu pedido da MS Matias Style está sendo preparado.`
  );

  window.open(`https://wa.me/55${telefone}?text=${mensagem}`, "_blank");
}

function logoutADM() {
  localStorage.removeItem("adminLogado");
  window.location.href = "login.html";
}

carregarPedidos();
async function ativarNotificacoes() {

  if (!("Notification" in window)) return;

  if (Notification.permission !== "granted") {
    await Notification.requestPermission();
  }

}

function notificarNovoPedido(pedido) {

  if (Notification.permission === "granted") {

    new Notification("🛒 Novo pedido na MS", {
      body: `
${pedido.nome}
${pedido.total.toFixed(2)}
      `,
      icon: "logo.png"
    });

  }

}

let ultimoTotalPedidos =
  JSON.parse(localStorage.getItem("pedidosMS"))?.length || 0;

setInterval(() => {

  const pedidos =
    JSON.parse(localStorage.getItem("pedidosMS")) || [];

  if (pedidos.length > ultimoTotalPedidos) {

    const ultimoPedido =
      pedidos[pedidos.length - 1];

    notificarNovoPedido(ultimoPedido);

    ultimoTotalPedidos = pedidos.length;
  }

}, 5000);

ativarNotificacoes();
async function ativarNotificacoesADM() {
  if (!("Notification" in window)) {
    console.log("Este navegador não suporta notificações.");
    return;
  }

  if (Notification.permission === "default") {
    await Notification.requestPermission();
  }
}

function notificarNovoPedidoADM(pedido) {
  if (!("Notification" in window)) return;
  if (Notification.permission !== "granted") return;

  new Notification("🛒 Novo pedido na MS", {
    body: `${pedido.nome || "Cliente"} - ${formatarMoeda(pedido.total)}`,
    icon: "logo.png"
  });
}

let ultimoTotalPedidosADM =
  Number(localStorage.getItem("ultimoTotalPedidosADM")) || pegarPedidos().length;

function verificarNovosPedidosADM() {
  const pedidos = pegarPedidos();

  if (pedidos.length > ultimoTotalPedidosADM) {
    const ultimoPedido = pedidos[pedidos.length - 1];

    notificarNovoPedidoADM(ultimoPedido);

    ultimoTotalPedidosADM = pedidos.length;

    localStorage.setItem(
      "ultimoTotalPedidosADM",
      String(ultimoTotalPedidosADM)
    );

    carregarPedidos();
  }
}

ativarNotificacoesADM();

setInterval(verificarNovosPedidosADM, 5000);