(function () {
const pedidosContainer = document.getElementById("pedidos");
const totalPedidos = document.getElementById("totalPedidos");
const totalPagos = document.getElementById("totalPagos");
const totalPendentes = document.getElementById("totalPendentes");

let filtroAtual = "todos";
let pedidosCache = [];

const API_PEDIDOS = "http://192.168.1.2:3000/pedidos";

async function pegarPedidos() {
  try {
    const resposta = await fetch(API_PEDIDOS + "?t=" + Date.now());

    if (!resposta.ok) {
      throw new Error("Erro ao buscar pedidos");
    }

    const pedidosServidor = await resposta.json();
    const pedidosLocal = JSON.parse(localStorage.getItem("pedidos")) || [];
    const pedidosMS = JSON.parse(localStorage.getItem("pedidosMS")) || [];

    const todosPedidos = pedidosServidor.length
      ? pedidosServidor
      : pedidosLocal.length
        ? pedidosLocal
        : pedidosMS;

    const statusSalvos = JSON.parse(localStorage.getItem("statusPedidosMS")) || {};

    pedidosCache = (todosPedidos || []).map((pedido) => {
      const id = String(pedido.id || pedido.data || Date.now());

      return {
        ...pedido,
        id: id,
        status: statusSalvos[id] || pedido.status || "pendente"
      };
    });

    localStorage.setItem("pedidosMS", JSON.stringify(pedidosCache));
    return pedidosCache;

  } catch (erro) {
    console.log("Erro ao buscar pedidos:", erro);

    const pedidosLocal = JSON.parse(localStorage.getItem("pedidos")) || [];
    const pedidosMS = JSON.parse(localStorage.getItem("pedidosMS")) || [];

    pedidosCache = pedidosLocal.length ? pedidosLocal : pedidosMS;

    return pedidosCache;
  }
}
function salvarStatusPedido(id, status) {
  const statusSalvos = JSON.parse(localStorage.getItem("statusPedidosMS")) || {};
  statusSalvos[String(id)] = status;
  localStorage.setItem("statusPedidosMS", JSON.stringify(statusSalvos));

  pedidosCache = pedidosCache.map((pedido) => {
    if (String(pedido.id) === String(id)) {
      return { ...pedido, status };
    }

    return pedido;
  });

  localStorage.setItem("pedidosMS", JSON.stringify(pedidosCache));
}

function acharPedido(id) {
  return pedidosCache.find((pedido) => String(pedido.id) === String(id));
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  });
}

function texto(valor) {
  if (valor === undefined || valor === null || valor === "") return "-";
  return valor;
}

function enderecoDoPedido(pedido) {
  return {
    cep: pedido.endereco?.cep || pedido.cep || "",
    rua: pedido.endereco?.rua || pedido.rua || "",
    numero: pedido.endereco?.numero || pedido.numero || "",
    complemento: pedido.endereco?.complemento || pedido.complemento || "",
    bairro: pedido.endereco?.bairro || pedido.bairro || "",
    cidade: pedido.endereco?.cidade || pedido.cidade || "",
    estado: pedido.endereco?.estado || pedido.estado || ""
  };
}

function produtosDoPedido(pedido) {
  let produtos = pedido.produtos || pedido.itens || pedido.items || [];

  if (typeof produtos === "string") {
    try {
      produtos = JSON.parse(produtos);
    } catch {
      produtos = [];
    }
  }

  if (!Array.isArray(produtos)) {
    produtos = [];
  }

  return produtos;
}

function telefoneLimpo(telefone) {
  let numero = String(telefone || "").replace(/\D/g, "");

  if (!numero) return "";

  if (!numero.startsWith("55")) {
    numero = "55" + numero;
  }

  return numero;
}

async function carregarPedidos() {
  const pedidos = await pegarPedidos();

  const novos = pedidos.filter((p) =>
    !p.status ||
    p.status === "pendente" ||
    p.status === "aguardando pagamento"
  );

  const pagos = pedidos.filter((p) => p.status === "pago");
  const enviados = pedidos.filter((p) => p.status === "enviado");

  if (totalPedidos) totalPedidos.innerText = pedidos.length;
  if (totalPagos) totalPagos.innerText = pagos.length;
  if (totalPendentes) totalPendentes.innerText = novos.length;

  const qtdNovos = document.getElementById("qtdNovos");
  const qtdPagosAba = document.getElementById("qtdPagosAba");
  const qtdEnviados = document.getElementById("qtdEnviados");

  if (qtdNovos) qtdNovos.innerText = novos.length;
  if (qtdPagosAba) qtdPagosAba.innerText = pagos.length;
  if (qtdEnviados) qtdEnviados.innerText = enviados.length;

  if (!pedidosContainer) return;

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
    .filter((pedido) => {
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

  pedidosFiltrados.forEach((pedido) => {
    const status = pedido.status || "pendente";
    const endereco = enderecoDoPedido(pedido);
    const produtos = produtosDoPedido(pedido);

    const produtosHTML = produtos.map((produto) => `
      <div class="produto-admin">
        ${produto.img || produto.imagem ? `<img src="${produto.img || produto.imagem}" alt="Produto">` : ""}
        <div>
          <strong>${texto(produto.nome || produto.title)}</strong>
          <p>Tamanho: ${texto(produto.tamanho || produto.size)}</p>
          <p>Qtd: ${produto.quantidade || produto.qtd || 1}</p>
          <p>${formatarMoeda(produto.preco || produto.price)}</p>
        </div>
      </div>
    `).join("");

    const card = document.createElement("div");
    card.className = "pedido-card";

    card.innerHTML = `
      <div class="pedido-topo">
        <div>
          <h3>Pedido #${texto(pedido.id)}</h3>
          <p>${texto(pedido.data)}</p>
        </div>

        <span class="status-pedido ${status}">
          ${status === "pago" ? "PAGO" : status === "enviado" ? "ENVIADO" : "PENDENTE"}
        </span>
      </div>

      <div class="cliente-admin">
        <h4>Cliente</h4>
        <p><strong>Nome:</strong> ${texto(pedido.nome)}</p>
        <p><strong>WhatsApp:</strong> ${texto(pedido.telefone)}</p>
      </div>

      <div class="endereco-admin">
        <h4>Endereço de entrega</h4>
        <p><strong>Rua:</strong> ${texto(endereco.rua)}, ${texto(endereco.numero)}</p>
        <p><strong>Bairro:</strong> ${texto(endereco.bairro)}</p>
        <p><strong>Cidade:</strong> ${texto(endereco.cidade)} ${endereco.estado ? "- " + endereco.estado : ""}</p>
        <p><strong>CEP:</strong> ${texto(endereco.cep)}</p>

<p><strong>Frete:</strong> 
${texto(pedido.frete?.nome || "Não informado")}
</p>

<p><strong>Valor Frete:</strong> 
R$ ${Number(pedido.frete?.preco || 0)
.toFixed(2)
.replace(".", ",")}
</p>
      </div>

      <div class="pedido-produtos">
        <h4>Produtos</h4>
        ${produtosHTML || "<p>Nenhum produto encontrado.</p>"}
      </div>

      <div class="pedido-total">
        <strong>Total: ${formatarMoeda(pedido.total)}</strong>
      </div>

      <div class="pedido-botoes">
        <button type="button" onclick="window.copiarEndereco('${pedido.id}')">Copiar endereço</button>
        <button type="button" onclick="window.imprimirPedido('${pedido.id}')">Imprimir etiqueta</button>
        <button type="button" onclick="window.marcarPago('${pedido.id}')">Marcar pago</button>
        <button type="button" onclick="window.marcarEnviado('${pedido.id}')">Marcar enviado</button>
        <button type="button" onclick="window.abrirWhatsApp('${pedido.id}')">Chamar no WhatsApp</button>
      </div>
    `;

    pedidosContainer.appendChild(card);
  });
}

window.filtrarPedidos = function(filtro, botao) {
  filtroAtual = filtro;

  document.querySelectorAll(".aba-pedido").forEach((btn) => {
    btn.classList.remove("ativa");
  });

  if (botao) botao.classList.add("ativa");

  carregarPedidos();
};

window.copiarEndereco = function(id) {
  const pedido = acharPedido(id);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  const endereco = enderecoDoPedido(pedido);

  const conteudo = `${texto(pedido.nome)}
WhatsApp: ${texto(pedido.telefone)}

${texto(endereco.rua)}, ${texto(endereco.numero)}
Bairro: ${texto(endereco.bairro)}
Cidade: ${texto(endereco.cidade)} ${endereco.estado ? "- " + endereco.estado : ""}
CEP: ${texto(endereco.cep)}`;

  navigator.clipboard.writeText(conteudo)
    .then(() => alert("Endereço copiado!"))
    .catch(() => prompt("Copie o endereço:", conteudo));
};

window.imprimirPedido = function(id) {
  const pedido = acharPedido(id);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  const endereco = enderecoDoPedido(pedido);
  const produtos = produtosDoPedido(pedido);

  const produtosHTML = produtos.map((produto) => `
    <p>
      <strong>${texto(produto.nome || produto.title)}</strong>
      | Tam: ${texto(produto.tamanho || produto.size)}
      | Qtd: ${produto.quantidade || produto.qtd || 1}
    </p>
  `).join("");

  const janela = window.open("", "_blank");

  if (!janela) {
    alert("Permita pop-ups para imprimir a etiqueta.");
    return;
  }

  janela.document.write(`
    <html>
      <head>
        <title>Etiqueta MS</title>
        <style>
          body{
            font-family: Arial, sans-serif;
            background:#f2f2f2;
            padding:8px;
            margin:0;
          }

          .etiqueta{
            width:620px;
            max-width:100%;
            margin:auto;
            background:#fff;
            border-radius:20px;
            overflow:hidden;
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
            page-break-inside:avoid;
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

          @media print{
            body{ background:#fff; }
            .etiqueta{ width:100%; border-radius:0; }
          }
        </style>
      </head>

      <body>
        <div class="etiqueta">
          <div class="topo">
            <h1>MS Matias Style</h1>
            <p>Etiqueta de envio</p>
          </div>

          <div class="conteudo">
            <div class="pedido-id">Pedido #${texto(pedido.id)}</div>

            <div class="box">
              <h2>DESTINATÁRIO</h2>
              <p><strong>Nome:</strong> ${texto(pedido.nome)}</p>
              <p><strong>WhatsApp:</strong> ${texto(pedido.telefone)}</p>
              <p><strong>Rua:</strong> ${texto(endereco.rua)}, ${texto(endereco.numero)}</p>
              <p><strong>Bairro:</strong> ${texto(endereco.bairro)}</p>
              <p><strong>Cidade:</strong> ${texto(endereco.cidade)} ${endereco.estado ? "- " + endereco.estado : ""}</p>
              <div class="cep">CEP: ${texto(endereco.cep)}</div>
            </div>

            <div class="linha"></div>

            <div class="box">
              <h2>REMETENTE</h2>
              <p><strong>MS Matias Style</strong></p>
              <p>Rua: Rua Livramento 841</p>
              <p>Bairro: Santana</p>
              <p>Porto Alegre - RS</p>
              <p>CEP: 90640130</p>
            </div>

            <div class="box">
              <h2>Produtos</h2>
              ${produtosHTML || "<p>Nenhum produto encontrado.</p>"}
            </div>

            <div class="total">
              Total: ${formatarMoeda(pedido.total)}
            </div>
          </div>
        </div>

        <script>
          window.onload = function(){
            window.print();
          };
        </script>
      </body>
    </html>
  `);

  janela.document.close();
};

window.marcarPago = function(id) {
  if (!acharPedido(id)) {
    alert("Pedido não encontrado.");
    return;
  }

  salvarStatusPedido(id, "pago");
  carregarPedidos();
};

window.marcarEnviado = function(id) {
  if (!acharPedido(id)) {
    alert("Pedido não encontrado.");
    return;
  }

  salvarStatusPedido(id, "enviado");
  carregarPedidos();
};

window.abrirWhatsApp = function(id) {
  const pedido = acharPedido(id);

  if (!pedido) {
    alert("Pedido não encontrado.");
    return;
  }

  const telefone = telefoneLimpo(pedido.telefone);

  if (!telefone) {
    alert("Esse pedido está sem WhatsApp.");
    return;
  }

  const mensagem = encodeURIComponent(
    `Olá ${pedido.nome || ""}, seu pedido da MS Matias Style está sendo preparado.`
  );

  window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
};

window.logoutADM = function() {
  localStorage.removeItem("adminLogado");
  window.location.href = "login.html";
};

async function ativarNotificacoesADM() {
  if (!("Notification" in window)) return;

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

let ultimoTotalPedidosADM = Number(localStorage.getItem("ultimoTotalPedidosADM")) || 0;

async function verificarNovosPedidosADM() {
  const pedidos = await pegarPedidos();

  if (ultimoTotalPedidosADM === 0) {
    ultimoTotalPedidosADM = pedidos.length;
    localStorage.setItem("ultimoTotalPedidosADM", String(ultimoTotalPedidosADM));
    return;
  }

  if (pedidos.length > ultimoTotalPedidosADM) {
    const ultimoPedido = pedidos[pedidos.length - 1];

    notificarNovoPedidoADM(ultimoPedido);

    ultimoTotalPedidosADM = pedidos.length;
    localStorage.setItem("ultimoTotalPedidosADM", String(ultimoTotalPedidosADM));

    carregarPedidos();
  }
}

carregarPedidos();
ativarNotificacoesADM();
setInterval(verificarNovosPedidosADM, 5000);
window.carregarPedidos = carregarPedidos;

window.atualizarPedidos = function() {
  carregarPedidos();
};
})();