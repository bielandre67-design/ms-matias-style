(function () {
  const pedidosContainer = document.getElementById("pedidos");
  const totalPedidos = document.getElementById("totalPedidos");
  const totalPagos = document.getElementById("totalPagos");
  const totalPendentes = document.getElementById("totalPendentes");
  const faturamentoHojeEl = document.getElementById("faturamentoHoje");
  const buscaCliente = document.getElementById("buscaPedido") || document.querySelector('input[placeholder*="cliente" i]');
  const filtroData = document.getElementById("dataPedido") || document.querySelector('input[type="date"]');

  const API_BASE = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://localhost:3000' : 'https://ms-matias-style.onrender.com';
  const API_PEDIDOS = `${API_BASE}/pedidos`;
  const API_EXCLUIDOS = `${API_BASE}/pedidos-excluidos`;

  let filtroAtual = "todos";
  let pedidosCache = [];
  let pedidosExcluidosCache = [];

  function injetarCSSPedidosMS() {
    if (document.getElementById("ms-pedidos-pro-css")) return;
    const style = document.createElement("style");
    style.id = "ms-pedidos-pro-css";
    style.textContent = `
      #pedidos.lista, #pedidos{display:grid;gap:16px;}
      .pedido-card.ms-pro{position:relative;overflow:hidden;padding:22px;border-radius:26px;background:linear-gradient(145deg,rgba(18,20,26,.88),rgba(13,15,20,.92));border:1px solid rgba(255,255,255,.11);color:var(--text);box-shadow:0 24px 70px rgba(0,0,0,.32);backdrop-filter:blur(18px);}
      .pedido-card.ms-pro::before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 0% 0%,rgba(216,173,67,.16),transparent 30%);pointer-events:none;}
      .pedido-head-ms,.pedido-grid-ms,.pedido-actions-ms,.produtos-box-ms,.pedido-total-ms{position:relative;z-index:1;}
      .pedido-head-ms{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:16px;}
      .pedido-title-ms h3{margin:0;font-size:21px;letter-spacing:-.035em;color:var(--text);}
      .pedido-title-ms p{margin:7px 0 0;color:var(--muted);font-size:13px;font-weight:750;}
      .pedido-meta-ms{display:flex;gap:8px;flex-wrap:wrap;margin-top:12px;}
      .pill-ms{display:inline-flex;align-items:center;border:1px solid var(--line);background:var(--panel2);border-radius:999px;padding:7px 11px;font-size:12px;font-weight:900;color:var(--text);}
      .status-pedido{border-radius:999px;padding:10px 14px;font-size:12px;font-weight:950;letter-spacing:.06em;text-transform:uppercase;white-space:nowrap;border:1px solid transparent;}
      .status-pedido.pago{background:rgba(34,197,94,.15);color:#64df84;border-color:rgba(34,197,94,.34);}
      .status-pedido.enviado{background:rgba(59,130,246,.16);color:#8bb9ff;border-color:rgba(59,130,246,.35);}
      .status-pedido.pendente,.status-pedido.aguardando-pagamento{background:rgba(216,173,67,.17);color:#f3cf69;border-color:rgba(216,173,67,.38);}
      .status-pedido.excluido{background:rgba(239,68,68,.14);color:#ff7d8f;border-color:rgba(239,68,68,.32);}
      .pedido-grid-ms{display:grid;grid-template-columns:1fr 1.08fr .86fr;gap:13px;margin-bottom:15px;}
      .rastreio-card-ms{grid-column:1/-1;}
      .rastreio-tools-ms{display:grid;grid-template-columns:1fr 1fr 1fr auto;gap:9px;margin-top:12px;}
      .rastreio-tools-ms input{min-height:42px;border-radius:13px;border:1px solid var(--line);background:var(--panel);color:var(--text);padding:0 12px;font-weight:800;outline:none;}
      .rastreio-tools-ms input:focus{border-color:rgba(216,173,67,.62);box-shadow:0 0 0 4px rgba(216,173,67,.13);}
      .rastreio-tools-ms button{min-height:42px;border-radius:13px;border:1px solid rgba(216,173,67,.42);background:linear-gradient(135deg,#e8bd42,#b8891d);color:#111;font-weight:950;padding:0 14px;white-space:nowrap;}
      .info-card-ms{border:1px solid var(--line);background:var(--panel2);border-radius:19px;padding:15px;min-height:136px;}
      .info-card-ms h4{margin:0 0 12px;color:var(--gold);font-size:12px;letter-spacing:.12em;text-transform:uppercase;}
      .info-line-ms{display:grid;grid-template-columns:88px 1fr;gap:10px;margin:8px 0;align-items:start;}
      .info-line-ms span{color:var(--muted);font-weight:750;font-size:13px;}
      .info-line-ms strong{color:var(--text);font-weight:900;word-break:break-word;}
      .produtos-box-ms{border:1px solid var(--line);background:var(--panel2);border-radius:20px;overflow:hidden;}
      .produtos-title-ms{display:flex;justify-content:space-between;gap:12px;padding:14px 16px;border-bottom:1px solid var(--line);font-weight:950;color:var(--text);}
      .produto-row-ms{display:grid;grid-template-columns:minmax(0,1fr) 64px 94px 104px;gap:10px;align-items:center;padding:13px 16px;border-bottom:1px solid var(--line);}
      .produto-row-ms:last-child{border-bottom:0;}
      .produto-row-ms strong{display:block;color:var(--text);}
      .produto-row-ms small{display:block;color:var(--muted);margin-top:5px;font-weight:750;}
      .produto-qtd-ms,.produto-preco-ms,.produto-subtotal-ms{font-weight:950;text-align:right;color:var(--text);}
      .pedido-total-ms{display:flex;justify-content:flex-end;gap:18px;align-items:center;padding:16px 0 4px;color:var(--text);}
      .pedido-total-ms span{color:var(--muted);font-weight:850;}.pedido-total-ms strong{font-size:24px;color:var(--gold);}
      .pedido-actions-ms{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:9px;padding-top:16px;border-top:1px solid var(--line);margin-top:15px;}
      .pedido-actions-ms button{min-height:46px;border-radius:15px;padding:0 12px;font-weight:950;border:1px solid rgba(255,255,255,.10);background:#0f172a;color:#fff;transition:.18s ease;box-shadow:0 10px 24px rgba(0,0,0,.16);white-space:nowrap;}
      .pedido-actions-ms button:hover{transform:translateY(-2px);filter:brightness(1.08);box-shadow:0 16px 34px rgba(0,0,0,.22);}
      .pedido-actions-ms .btn-primary-ms{background:linear-gradient(135deg,#e8bd42,#b8891d);color:#101010;border-color:rgba(216,173,67,.5);}
      .pedido-actions-ms .btn-blue-ms{background:linear-gradient(135deg,#477eea,#2051b7);border-color:rgba(80,130,240,.45);}
      .pedido-actions-ms .btn-green-ms{background:linear-gradient(135deg,#26bd5c,#12813c);border-color:rgba(34,197,94,.45);}
      .pedido-actions-ms .btn-danger-ms{background:#fff1f2;color:#e11d48;border-color:#fecdd3;}
      .pedido-actions-ms .btn-ghost-ms{background:rgba(255,255,255,.07);color:var(--text);border-color:var(--line);}
      .pedido-vazio{border-radius:24px;padding:28px;border:1px solid var(--line);background:var(--panel);color:var(--text);}
      html:not([data-theme="escuro"]) .pedido-card.ms-pro{background:linear-gradient(145deg,#ffffff,#fbfbf7);color:#0b1220;border-color:rgba(15,23,42,.10);box-shadow:0 24px 70px rgba(15,23,42,.10);}
      html:not([data-theme="escuro"]) .pedido-card.ms-pro::before{background:radial-gradient(circle at 0% 0%,rgba(216,173,67,.18),transparent 30%);}
      html:not([data-theme="escuro"]) .pedido-actions-ms button:not(.btn-primary-ms):not(.btn-blue-ms):not(.btn-green-ms):not(.btn-danger-ms){background:#0f172a;color:#fff;border-color:#0f172a;}
      @media(max-width:1180px){.pedido-actions-ms{grid-template-columns:repeat(3,minmax(0,1fr));}.pedido-grid-ms{grid-template-columns:1fr 1fr}.pedido-grid-ms .info-card-ms:nth-child(3){grid-column:1/-1}.rastreio-tools-ms{grid-template-columns:1fr 1fr}.rastreio-tools-ms button{grid-column:1/-1}}
      @media(max-width:760px){.rastreio-tools-ms{grid-template-columns:1fr}.pedido-card.ms-pro{padding:16px;border-radius:22px}.pedido-head-ms{display:grid;gap:12px}.pedido-title-ms h3{font-size:18px}.pedido-meta-ms{gap:6px}.pill-ms{font-size:11px;padding:6px 9px}.status-pedido{width:max-content;font-size:11px;padding:8px 11px}.pedido-grid-ms{grid-template-columns:1fr;gap:10px}.info-card-ms{min-height:auto;padding:13px;border-radius:16px}.info-line-ms{grid-template-columns:78px 1fr;font-size:13px}.produtos-title-ms{padding:12px 13px;font-size:13px}.produto-row-ms{grid-template-columns:1fr auto;padding:12px 13px;gap:6px}.produto-qtd-ms{text-align:left}.produto-preco-ms,.produto-subtotal-ms{grid-column:1/-1;text-align:left;font-size:13px;color:var(--muted)}.pedido-total-ms{justify-content:space-between}.pedido-total-ms strong{font-size:20px}.pedido-actions-ms{grid-template-columns:1fr 1fr;gap:8px}.pedido-actions-ms button{min-height:44px;border-radius:14px;font-size:12px;padding:0 8px;white-space:normal;line-height:1.1}.pedido-actions-ms .btn-danger-ms{grid-column:1/-1}}
      @media(max-width:420px){.pedido-actions-ms{grid-template-columns:1fr}.info-line-ms{grid-template-columns:1fr;gap:3px}.produto-row-ms{grid-template-columns:1fr}.produto-qtd-ms,.produto-preco-ms,.produto-subtotal-ms{text-align:left}}
    `;
    document.head.appendChild(style);
  }

  function safe(valor) {
    return String(valor ?? "").replace(/[&<>'"]/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", "'":"&#39;", '"':"&quot;" }[c]));
  }

  function texto(valor, vazio = "Não informado") {
    if (valor === undefined || valor === null || String(valor).trim() === "") return vazio;
    return safe(valor);
  }

  function numero(valor) {
    const n = Number(String(valor ?? 0).replace(",", "."));
    return Number.isFinite(n) ? n : 0;
  }

  function formatarMoeda(valor) {
    return numero(valor).toLocaleString("pt-BR", { style:"currency", currency:"BRL" });
  }

  function normalizarStatus(status) {
    const s = String(status || "pendente").toLowerCase().trim();
    if (["pago", "paid", "aprovado", "approved"].includes(s)) return "pago";
    if (["enviado", "enviada", "sent", "entregue"].includes(s)) return "enviado";
    if (["etiqueta gerada", "etiqueta", "gerada"].includes(s)) return "etiqueta";
    return "pendente";
  }

  function statusLabel(status) {
    const s = normalizarStatus(status);
    if (s === "pago") return "PAGO";
    if (s === "enviado") return "ENVIADO";
    if (s === "etiqueta") return "ETIQUETA";
    return "PENDENTE";
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
      try { produtos = JSON.parse(produtos); } catch { produtos = []; }
    }
    return Array.isArray(produtos) ? produtos : [];
  }

  function produtoQtd(produto) { return Math.max(1, numero(produto.quantidade ?? produto.qtd ?? produto.quantity ?? 1)); }
  function produtoPreco(produto) { return numero(produto.preco ?? produto.price ?? produto.unit_price ?? produto.valor ?? 0); }
  function subtotalProdutos(pedido) { return produtosDoPedido(pedido).reduce((s, p) => s + produtoPreco(p) * produtoQtd(p), 0); }
  function freteValor(pedido) { return numero(pedido.frete?.preco ?? pedido.valorFrete ?? pedido.freteValor ?? 0); }
  function totalPedido(pedido) { return numero(pedido.total) > 0 ? numero(pedido.total) : subtotalProdutos(pedido) + freteValor(pedido); }

  function rastreioDoPedido(pedido) {
    return {
      codigo: pedido.codigoRastreio || pedido.rastreio?.codigo || pedido.trackingCode || "",
      transportadora: pedido.transportadora || pedido.rastreio?.transportadora || pedido.frete?.nome || pedido.freteNome || "",
      link: pedido.linkRastreio || pedido.rastreio?.link || pedido.trackingUrl || "",
      cartId: pedido.melhorEnvio?.orderId || pedido.melhorEnvio?.cartId || pedido.melhorEnvio?.id || "",
      etiqueta: pedido.linkEtiqueta || pedido.melhorEnvio?.printUrl || ""
    };
  }

  function mensagemWhatsAppMS(pedido, tipo) {
    const nome = pedido.nome || "";
    const rastreio = rastreioDoPedido(pedido);
    const codigo = rastreio.codigo || "código ainda não informado";
    const link = rastreio.link ? `\nLink para acompanhar: ${rastreio.link}` : "";
    const transportadora = rastreio.transportadora ? ` pela ${rastreio.transportadora}` : "";
    const total = formatarMoeda(totalPedido(pedido));

    if (tipo === "agradecer" || tipo === "boas-vindas" || tipo === "💬 Enviar boas-vindas") {
  return `Olá ${nome}! 💛

Muito obrigado por escolher a MS Matias Style.

Seu pedido #${pedido.id} foi recebido com sucesso e nossa equipe já está preparando tudo com muito cuidado para que sua experiência seja a melhor possível.

Em breve entraremos em contato com as próximas atualizações do seu pedido.

Qualquer dúvida, estamos à disposição. Será um prazer atender você!

📲 Instagram:
https://www.instagram.com/matiasstyleofc

Acompanhe as novidades, lançamentos e promoções da MS.

Equipe MS Matias Style 🤍`;
}
    if (tipo === "pagamento") {
      return `Olá ${nome}! Seu pagamento do pedido #${pedido.id} foi confirmado.\n\nAgora vamos separar seu pedido com cuidado. Assim que for enviado, você receberá o código de rastreio por aqui.\n\nMS Matias Style`;
    }
    if (tipo === "envio") {
      return `Olá ${nome}! Seu pedido #${pedido.id} foi enviado${transportadora}.\n\nCódigo de rastreio: ${codigo}${link}\n\nObrigado por comprar na MS Matias Style!`;
    }
    return `Olá ${nome}! 💛\n\nEstamos entrando em contato sobre seu pedido #${pedido.id} na MS Matias Style.\n\nQualquer dúvida, pode chamar a gente por aqui.\n\n📲 Instagram:\nhttps://www.instagram.com/matiasstyleofc\n\nEquipe MS Matias Style 🤍`;
  }

  function abrirWhatsAppComMensagem(pedido, tipo) {
    const telefone = telefoneLimpo(pedido.telefone);
    if (!telefone) return alert("Esse pedido está sem WhatsApp.");
    const mensagem = encodeURIComponent(mensagemWhatsAppMS(pedido, tipo));
    window.open(`https://wa.me/${telefone}?text=${mensagem}`, "_blank");
  }

  function telefoneLimpo(telefone) {
    let n = String(telefone || "").replace(/\D/g, "");
    if (!n) return "";
    if (!n.startsWith("55")) n = "55" + n;
    return n;
  }

  async function pegarPedidos() {
    try {
      const resposta = await fetch(`${API_PEDIDOS}?t=${Date.now()}`);
      if (!resposta.ok) throw new Error("Erro ao buscar pedidos");
      const pedidosServidor = await resposta.json();
      const statusSalvos = JSON.parse(localStorage.getItem("statusPedidosMS") || "{}");
      pedidosCache = (pedidosServidor || []).map((pedido) => ({
        ...pedido,
        id: String(pedido.id || pedido.data || Date.now()),
        status: normalizarStatus(statusSalvos[String(pedido.id)] || pedido.status)
      }));
      localStorage.setItem("pedidosMS", JSON.stringify(pedidosCache));
      return pedidosCache;
    } catch (erro) {
      console.warn("Pedidos em modo local:", erro);
      pedidosCache = JSON.parse(localStorage.getItem("pedidosMS") || localStorage.getItem("pedidos") || "[]");
      return pedidosCache;
    }
  }

  function acharPedido(id) { return pedidosCache.find((p) => String(p.id) === String(id)); }

  function passarNosFiltros(pedido) {
    const status = normalizarStatus(pedido.status);
    if (filtroAtual !== "todos" && status !== filtroAtual) return false;

    const termo = (buscaCliente?.value || "").toLowerCase().trim();
    if (termo) {
      const alvo = `${pedido.nome || ""} ${pedido.telefone || ""} ${pedido.id || ""}`.toLowerCase();
      if (!alvo.includes(termo)) return false;
    }

    if (filtroData?.value) {
      const dataPedido = dataISOdoPedido(pedido.data);
      if (dataPedido !== filtroData.value) return false;
    }

    return true;
  }

  function dataISOdoPedido(data) {
    if (!data) return "";
    const s = String(data);
    const match = s.match(/(\d{2})\/(\d{2})\/(\d{4})/);
    if (match) return `${match[3]}-${match[2]}-${match[1]}`;
    const d = new Date(s);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 10);
  }

  function atualizarResumo(pedidos) {
    const pagos = pedidos.filter((p) => normalizarStatus(p.status) === "pago");
    const pendentes = pedidos.filter((p) => normalizarStatus(p.status) === "pendente");
    const enviados = pedidos.filter((p) => normalizarStatus(p.status) === "enviado");

    if (totalPedidos) totalPedidos.innerText = pedidos.length;
    if (totalPagos) totalPagos.innerText = pagos.length;
    if (totalPendentes) totalPendentes.innerText = pendentes.length;

    const qtdNovos = document.getElementById("qtdNovos");
    const qtdPagosAba = document.getElementById("qtdPagosAba");
    const qtdEnviados = document.getElementById("qtdEnviados");
    if (qtdNovos) qtdNovos.innerText = pendentes.length;
    if (qtdPagosAba) qtdPagosAba.innerText = pagos.length;
    if (qtdEnviados) qtdEnviados.innerText = enviados.length;

    atualizarFaturamentoHoje(pedidos);
    criarGraficoVendas(pedidos);
  }

  function renderizarPedidos(pedidos = pedidosCache) {
    if (!pedidosContainer) return;
    injetarCSSPedidosMS();
    pedidosContainer.innerHTML = "";

    const lista = pedidos.filter(passarNosFiltros).slice().reverse();
    if (!lista.length) {
      pedidosContainer.innerHTML = `<div class="pedido-vazio"><h3>Nenhum pedido encontrado</h3><p>Use outro filtro ou atualize o painel.</p></div>`;
      return;
    }

    lista.forEach((pedido) => {
      const status = normalizarStatus(pedido.status);
      const endereco = enderecoDoPedido(pedido);
      const produtos = produtosDoPedido(pedido);
      const totalProdutos = subtotalProdutos(pedido);
      const frete = freteValor(pedido);
      const total = totalPedido(pedido);
      const rastreio = rastreioDoPedido(pedido);
      const idSeguro = safe(pedido.id);

      const produtosHTML = produtos.map((produto) => {
        const qtd = produtoQtd(produto);
        const preco = produtoPreco(produto);
        return `
          <div class="produto-row-ms">
            <div><strong>${texto(produto.nome || produto.title || "Produto")}</strong><small>Cor: ${texto(produto.cor || produto.color, "Única")} • Tamanho: ${texto(produto.tamanho || produto.size, "-")}</small></div>
            <div class="produto-qtd-ms">x${qtd}</div>
            <div class="produto-preco-ms">${formatarMoeda(preco)}</div>
            <div class="produto-subtotal-ms">${formatarMoeda(preco * qtd)}</div>
          </div>`;
      }).join("");

      const card = document.createElement("div");
      card.className = "pedido-card ms-pro";
      card.innerHTML = `
        <div class="pedido-head-ms">
          <div class="pedido-title-ms">
            <h3>Pedido #${texto(pedido.id)}</h3>
            <p>${texto(pedido.data, "Data não informada")}</p>
            <div class="pedido-meta-ms">
              <span class="pill-ms">${produtos.length} produto${produtos.length === 1 ? "" : "s"}</span>
              <span class="pill-ms">Frete: ${formatarMoeda(frete)}</span>
              <span class="pill-ms">Total: ${formatarMoeda(total)}</span>
            </div>
          </div>
          <span class="status-pedido ${status}">${statusLabel(status)}</span>
        </div>

        <div class="pedido-grid-ms">
          <div class="info-card-ms">
            <h4>Cliente</h4>
            <div class="info-line-ms"><span>Nome</span><strong>${texto(pedido.nome)}</strong></div>
            <div class="info-line-ms"><span>WhatsApp</span><strong>${texto(pedido.telefone)}</strong></div>
          </div>
          <div class="info-card-ms">
            <h4>Entrega</h4>
            <div class="info-line-ms"><span>Endereço</span><strong>${texto(endereco.rua)}, ${texto(endereco.numero)}</strong></div>
            <div class="info-line-ms"><span>Bairro</span><strong>${texto(endereco.bairro)}</strong></div>
            <div class="info-line-ms"><span>Cidade</span><strong>${texto(endereco.cidade)} ${endereco.estado ? "- " + texto(endereco.estado) : ""}</strong></div>
            <div class="info-line-ms"><span>CEP</span><strong>${texto(endereco.cep)}</strong></div>
          </div>
          <div class="info-card-ms">
            <h4>Pagamento</h4>
            <div class="info-line-ms"><span>Status</span><strong>${statusLabel(status)}</strong></div>
            <div class="info-line-ms"><span>Frete</span><strong>${texto(pedido.frete?.nome || pedido.freteNome, "Não informado")}</strong></div>
            <div class="info-line-ms"><span>Total</span><strong>${formatarMoeda(total)}</strong></div>
          </div>
          <div class="info-card-ms rastreio-card-ms">
            <h4>Envio e rastreamento</h4>
            <div class="info-line-ms"><span>Transp.</span><strong>${texto(rastreio.transportadora, "Aguardando")}</strong></div>
            <div class="info-line-ms"><span>Código</span><strong>${texto(rastreio.codigo, "Ainda não informado")}</strong></div>
            <div class="info-line-ms"><span>Etiqueta</span><strong>${texto(rastreio.cartId, "Não criada")}</strong></div>
            <div class="info-line-ms"><span>Impressão</span><strong>${rastreio.etiqueta ? `<a href="${safe(rastreio.etiqueta)}" target="_blank" rel="noopener">Abrir etiqueta</a>` : "Aguardando"}</strong></div>
            <div class="rastreio-tools-ms">
              <input id="rastTransp-${idSeguro}" value="${safe(rastreio.transportadora)}" placeholder="Transportadora">
              <input id="rastCodigo-${idSeguro}" value="${safe(rastreio.codigo)}" placeholder="Código de rastreio">
              <input id="rastLink-${idSeguro}" value="${safe(rastreio.link)}" placeholder="Link de rastreio (opcional)">
              <button type="button" onclick="window.salvarRastreioPedido('${idSeguro}')">Salvar rastreio</button>
            </div>
          </div>
        </div>

        <div class="produtos-box-ms">
          <div class="produtos-title-ms"><span>Produtos do pedido</span><span>${formatarMoeda(totalProdutos)}</span></div>
          ${produtosHTML || `<div class="produto-row-ms"><strong>Nenhum produto encontrado.</strong></div>`}
        </div>

        <div class="pedido-total-ms"><span>Total final</span><strong>${formatarMoeda(total)}</strong></div>

        <div class="pedido-actions-ms">
          <button type="button" onclick="window.copiarEndereco('${idSeguro}')">📋 Endereço</button>
          <button type="button" onclick="window.imprimirPedido('${idSeguro}')">🖨️ Etiqueta</button>
          <button type="button" class="btn-ghost-ms" onclick="window.whatsAgradecerCompra('${idSeguro}')">🙏 Agradecer</button>
          <button type="button" class="btn-primary-ms" onclick="window.confirmarPagamentoCliente('${idSeguro}')">💰 Pago + Whats</button>
          <button type="button" class="btn-blue-ms" onclick="window.gerarEtiquetaMelhorEnvio('${idSeguro}')">📦 Gerar + comprar</button>
          <button type="button" class="btn-ghost-ms" onclick="window.consultarRastreioMelhorEnvio('${idSeguro}')">🔎 Consultar</button>
          <button type="button" class="btn-green-ms" onclick="window.avisarEnvioCliente('${idSeguro}')">🚚 Avisar envio</button>
          <button type="button" class="btn-danger-ms" onclick="window.excluirPedido('${idSeguro}')">🗑️ Excluir</button>
        </div>`;
      pedidosContainer.appendChild(card);
    });
  }


  async function pegarPedidosExcluidos() {
    try {
      const resposta = await fetch(API_EXCLUIDOS);
      if (!resposta.ok) throw new Error("Erro ao buscar lixeira");
      pedidosExcluidosCache = await resposta.json() || [];
      return pedidosExcluidosCache;
    } catch (erro) {
      console.warn("Não carregou pedidos excluídos:", erro);
      pedidosExcluidosCache = JSON.parse(localStorage.getItem("pedidosExcluidosMS") || "[]");
      return pedidosExcluidosCache;
    }
  }

  async function carregarPedidosExcluidos() {
    const lista = await pegarPedidosExcluidos();
    renderizarPedidosExcluidos(lista);
  }

  function renderizarPedidosExcluidos(lista = pedidosExcluidosCache) {
    if (!pedidosContainer) return;
    injetarCSSPedidosMS();
    pedidosContainer.innerHTML = "";
    const busca = (buscaCliente?.value || "").toLowerCase().trim();
    const filtrados = (lista || []).filter((pedido) => {
      const alvo = `${pedido.id || ""} ${pedido.nome || ""} ${pedido.telefone || ""} ${pedido.rua || ""} ${pedido.cidade || ""}`.toLowerCase();
      return !busca || alvo.includes(busca);
    }).slice().reverse();

    if (!filtrados.length) {
      pedidosContainer.innerHTML = `<div class="pedido-vazio"><h3>Lixeira vazia</h3><p>Nenhum pedido excluído encontrado.</p></div>`;
      return;
    }

    filtrados.forEach((pedido) => {
      const endereco = enderecoDoPedido(pedido);
      const produtos = produtosDoPedido(pedido);
      const totalProdutos = subtotalProdutos(pedido);
      const frete = freteValor(pedido);
      const total = totalPedido(pedido);
      const produtosHTML = produtos.map((produto) => {
        const qtd = produtoQtd(produto);
        const preco = produtoPreco(produto);
        return `<div class="produto-row-ms"><div><strong>${texto(produto.nome || produto.title || "Produto")}</strong><small>Cor: ${texto(produto.cor || produto.color, "Única")} • Tamanho: ${texto(produto.tamanho || produto.size, "-")}</small></div><div class="produto-qtd-ms">x${qtd}</div><div class="produto-preco-ms">${formatarMoeda(preco)}</div><div class="produto-subtotal-ms">${formatarMoeda(preco * qtd)}</div></div>`;
      }).join("");
      const card = document.createElement("div");
      card.className = "pedido-card ms-pro";
      card.innerHTML = `
        <div class="pedido-head-ms"><div class="pedido-title-ms"><h3>Pedido #${texto(pedido.id)}</h3><p>Excluído em: ${texto(pedido.excluidoEm || pedido.deletadoEm || "não informado")}</p><div class="pedido-meta-ms"><span class="pill-ms">${produtos.length} produto${produtos.length === 1 ? "" : "s"}</span><span class="pill-ms">Frete: ${formatarMoeda(frete)}</span><span class="pill-ms">Total: ${formatarMoeda(total)}</span></div></div><span class="status-pedido excluido">Excluído</span></div>
        <div class="pedido-grid-ms"><div class="info-card-ms"><h4>Cliente</h4><div class="info-line-ms"><span>Nome</span><strong>${texto(pedido.nome)}</strong></div><div class="info-line-ms"><span>WhatsApp</span><strong>${texto(pedido.telefone)}</strong></div></div><div class="info-card-ms"><h4>Entrega</h4><div class="info-line-ms"><span>Endereço</span><strong>${texto(endereco.rua)}, ${texto(endereco.numero)}</strong></div><div class="info-line-ms"><span>Bairro</span><strong>${texto(endereco.bairro)}</strong></div><div class="info-line-ms"><span>Cidade</span><strong>${texto(endereco.cidade)} ${endereco.estado ? "- " + texto(endereco.estado) : ""}</strong></div><div class="info-line-ms"><span>CEP</span><strong>${texto(endereco.cep)}</strong></div></div><div class="info-card-ms"><h4>Pagamento</h4><div class="info-line-ms"><span>Status antigo</span><strong>${statusLabel(pedido.status)}</strong></div><div class="info-line-ms"><span>Total</span><strong>${formatarMoeda(total)}</strong></div></div></div>
        <div class="produtos-box-ms"><div class="produtos-title-ms"><span>Produtos do pedido</span><span>${formatarMoeda(totalProdutos)}</span></div>${produtosHTML || `<div class="produto-row-ms"><strong>Nenhum produto encontrado.</strong></div>`}</div>
        <div class="pedido-total-ms"><span>Total final</span><strong>${formatarMoeda(total)}</strong></div>
        <div class="pedido-actions-ms"><button type="button" class="btn-green-ms" onclick="window.restaurarPedido('${safe(pedido.id)}')">↩ Restaurar</button><button type="button" class="btn-danger-ms" onclick="window.excluirPedidoDefinitivo('${safe(pedido.id)}')">🗑️ Excluir definitivo</button></div>`;
      pedidosContainer.appendChild(card);
    });
  }

  async function salvarStatusPedido(id, status) {
    const statusFinal = normalizarStatus(status);
    try {
      const resposta = await fetch(`${API_BASE}/atualizar-status`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ id, status: statusFinal })
      });
      if (!resposta.ok) throw new Error("Servidor não atualizou o status");
    } catch (erro) {
      console.warn("Status salvo só no navegador:", erro);
      const statusSalvos = JSON.parse(localStorage.getItem("statusPedidosMS") || "{}");
      statusSalvos[String(id)] = statusFinal;
      localStorage.setItem("statusPedidosMS", JSON.stringify(statusSalvos));
    }
    pedidosCache = pedidosCache.map((p) => String(p.id) === String(id) ? { ...p, status: statusFinal } : p);
    localStorage.setItem("pedidosMS", JSON.stringify(pedidosCache));
    atualizarResumo(pedidosCache);
    renderizarPedidos();
  }

  async function carregarPedidos() {
    const pedidos = await pegarPedidos();
    atualizarResumo(pedidos);
    renderizarPedidos(pedidos);
  }

  window.filtrarPedidos = function (filtro, botao) {
    filtroAtual = filtro;
    document.querySelectorAll(".aba-pedido").forEach((btn) => btn.classList.remove("ativa"));
    if (botao) botao.classList.add("ativa");
    if (filtro === "excluidos") {
      carregarPedidosExcluidos();
      return;
    }
    renderizarPedidos();
  };

  window.copiarEndereco = function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    const e = enderecoDoPedido(pedido);
    const conteudo = `${pedido.nome || "Cliente"}\nWhatsApp: ${pedido.telefone || ""}\n\n${e.rua || ""}, ${e.numero || ""}${e.complemento ? " - " + e.complemento : ""}\nBairro: ${e.bairro || ""}\nCidade: ${e.cidade || ""} ${e.estado ? "- " + e.estado : ""}\nCEP: ${e.cep || ""}`;
    navigator.clipboard?.writeText(conteudo).then(() => alert("Endereço copiado."))
      .catch(() => prompt("Copie o endereço:", conteudo));
  };

  window.imprimirPedido = function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    const e = enderecoDoPedido(pedido);
    const produtosHTML = produtosDoPedido(pedido).map((p) => `<p><strong>${texto(p.nome || p.title || "Produto")}</strong> | Cor: ${texto(p.cor || p.color, "Única")} | Tam: ${texto(p.tamanho || p.size, "-")} | Qtd: ${produtoQtd(p)}</p>`).join("");
    const janela = window.open("", "_blank");
    if (!janela) return alert("Permita pop-ups para imprimir a etiqueta.");
    janela.document.write(`<!doctype html><html><head><title>Etiqueta MS</title><style>body{font-family:Arial,sans-serif;margin:0;padding:18px;background:#f4f4f5}.etiqueta{max-width:720px;margin:auto;background:white;border:2px solid #111;border-radius:18px;overflow:hidden}.topo{background:#050505;color:#fff;padding:20px}.topo h1{margin:0;font-size:26px}.conteudo{padding:24px}.box{border:1px solid #ddd;border-radius:14px;padding:18px;margin-bottom:16px}h2{margin:0 0 12px;font-size:18px}.cep{font-size:24px;font-weight:900}.total{background:#111;color:#fff;border-radius:14px;padding:16px;font-weight:900;font-size:20px}@media print{body{background:#fff}.etiqueta{border-radius:0;max-width:none}}</style></head><body><div class="etiqueta"><div class="topo"><h1>MS Matias Style</h1><p>Etiqueta de envio • Pedido #${texto(pedido.id)}</p></div><div class="conteudo"><div class="box"><h2>Destinatário</h2><p><strong>Nome:</strong> ${texto(pedido.nome)}</p><p><strong>WhatsApp:</strong> ${texto(pedido.telefone)}</p><p><strong>Rua:</strong> ${texto(e.rua)}, ${texto(e.numero)}</p><p><strong>Bairro:</strong> ${texto(e.bairro)}</p><p><strong>Cidade:</strong> ${texto(e.cidade)} ${e.estado ? "- " + texto(e.estado) : ""}</p><div class="cep">CEP: ${texto(e.cep)}</div></div><div class="box"><h2>Remetente</h2><p><strong>MS Matias Style</strong></p><p>Rua Livramento, 841</p><p>Santana • Porto Alegre - RS</p><p>CEP: 90640130</p></div><div class="box"><h2>Produtos</h2>${produtosHTML || "<p>Nenhum produto encontrado.</p>"}</div><div class="total">Total: ${formatarMoeda(totalPedido(pedido))}</div></div></div><script>window.onload=()=>window.print()</script></body></html>`);
    janela.document.close();
  };

  window.marcarPago = function (id) {
    if (!acharPedido(id)) return alert("Pedido não encontrado.");
    salvarStatusPedido(id, "pago");
  };

  window.marcarEnviado = function (id) {
    if (!acharPedido(id)) return alert("Pedido não encontrado.");
    salvarStatusPedido(id, "enviado");
  };

  window.abrirWhatsApp = function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    abrirWhatsAppComMensagem(pedido, "geral");
  };

  window.whatsAgradecerCompra = function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    abrirWhatsAppComMensagem(pedido, "agradecer");
  };

  window.confirmarPagamentoCliente = async function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    await salvarStatusPedido(id, "pago");
    const atualizado = acharPedido(id) || { ...pedido, status: "pago" };
    abrirWhatsAppComMensagem(atualizado, "pagamento");
  };

  window.avisarEnvioCliente = async function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    const rastreio = rastreioDoPedido(pedido);
    if (!rastreio.codigo) {
      const continuar = confirm("Esse pedido ainda não tem código de rastreio salvo. Quer salvar agora?");
      if (!continuar) return;
      const salvou = await window.salvarRastreioPedido(id, false);
      if (!salvou) return;
    }
    await salvarStatusPedido(id, "enviado");
    abrirWhatsAppComMensagem(acharPedido(id) || pedido, "envio");
  };

  window.salvarRastreioPedido = async function (id, mostrarAlerta = true) {
    const codigo = document.getElementById(`rastCodigo-${id}`)?.value?.trim() || prompt("Código de rastreio:", "") || "";
    if (!codigo.trim()) return false;
    const transportadora = document.getElementById(`rastTransp-${id}`)?.value?.trim() || "";
    const link = document.getElementById(`rastLink-${id}`)?.value?.trim() || "";
    try {
      const resposta = await fetch(`${API_PEDIDOS}/${encodeURIComponent(id)}/rastreio`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({ codigo, transportadora, link })
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Servidor não salvou o rastreio");
      pedidosCache = pedidosCache.map((p) => String(p.id) === String(id) ? dados.pedido : p);
      atualizarResumo(pedidosCache);
      renderizarPedidos();
      if (mostrarAlerta) alert("Rastreio salvo e pedido marcado como enviado.");
      return true;
    } catch (erro) {
      alert("Não consegui salvar o rastreio. Confere se o Node está ligado. " + erro.message);
      return false;
    }
  };

  window.gerarEtiquetaMelhorEnvio = async function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    const msg = "Gerar, comprar e liberar a etiqueta do pedido #" + id + " no Melhor Envio?\n\nIsso usa o saldo da Melhor Carteira. Continue somente se o pedido já foi pago e os dados do endereço estão certos.";
    if (!confirm(msg)) return;
    try {
      const botao = document.activeElement;
      const textoOriginal = botao?.innerHTML;
      if (botao) { botao.disabled = true; botao.innerHTML = "⏳ Gerando..."; }
      const resposta = await fetch(`${API_PEDIDOS}/${encodeURIComponent(id)}/gerar-etiqueta`, {
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body: JSON.stringify({ comprar:true, gerar:true, imprimir:true, tracking:true })
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) {
        const detalhe = dados.detalhes ? "\n\nDetalhes: " + JSON.stringify(dados.detalhes).slice(0, 900) : "";
        throw new Error((dados.mensagem || "Melhor Envio não gerou a etiqueta.") + detalhe);
      }
      pedidosCache = pedidosCache.map((p) => String(p.id) === String(id) ? dados.pedido : p);
      atualizarResumo(pedidosCache);
      renderizarPedidos();
      const atualizado = acharPedido(id) || dados.pedido;
      const rast = rastreioDoPedido(atualizado);
      if (rast.etiqueta && confirm("Etiqueta criada. Abrir impressão agora?")) window.open(rast.etiqueta, "_blank");
      if (rast.codigo && confirm("Código de rastreio encontrado. Enviar WhatsApp para o cliente agora?")) abrirWhatsAppComMensagem(atualizado, "envio");
      if (!rast.codigo) alert("Etiqueta criada/gerada. O código de rastreio pode demorar alguns minutos para aparecer. Use o botão Consultar depois.");
      if (botao) { botao.disabled = false; botao.innerHTML = textoOriginal; }
    } catch (erro) {
      alert("Não consegui gerar a etiqueta: " + erro.message);
      const botao = document.activeElement;
      if (botao) botao.disabled = false;
    }
  };

  window.consultarRastreioMelhorEnvio = async function (id) {
    try {
      const resposta = await fetch(`${API_PEDIDOS}/${encodeURIComponent(id)}/consultar-rastreio`, { method:"POST" });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || "Não foi possível consultar o Melhor Envio.");
      pedidosCache = pedidosCache.map((p) => String(p.id) === String(id) ? dados.pedido : p);
      atualizarResumo(pedidosCache);
      renderizarPedidos();
      const rast = rastreioDoPedido(dados.pedido);
      alert(rast.codigo ? "Rastreio atualizado: " + rast.codigo : "Consulta feita. O Melhor Envio ainda não retornou código de rastreio.");
    } catch (erro) {
      alert("Não consegui consultar rastreio: " + erro.message);
    }
  };

  window.excluirPedido = async function (id) {
    const pedido = acharPedido(id);
    if (!pedido) return alert("Pedido não encontrado.");
    if (!confirm(`Mover o pedido #${id} para a lixeira? Você poderá restaurar depois.`)) return;

    let excluiuNoServidor = false;
    try {
      const resposta = await fetch(`${API_PEDIDOS}/${encodeURIComponent(id)}`, { method:"DELETE" });
      excluiuNoServidor = resposta.ok;
    } catch (erro) {
      console.warn("DELETE falhou, tentando fallback:", erro);
    }

    if (!excluiuNoServidor) {
      try {
        const respostaFallback = await fetch(`${API_BASE}/excluir-pedido`, {
          method:"POST",
          headers:{"Content-Type":"application/json"},
          body:JSON.stringify({ id })
        });
        excluiuNoServidor = respostaFallback.ok;
      } catch (erro) {
        console.warn("Fallback de exclusão falhou:", erro);
      }
    }

    pedidosCache = pedidosCache.filter((p) => String(p.id) !== String(id));
    localStorage.setItem("pedidosMS", JSON.stringify(pedidosCache));
    atualizarResumo(pedidosCache);
    renderizarPedidos();

    alert(excluiuNoServidor ? "Pedido movido para a lixeira." : "Pedido removido da tela, mas o servidor não confirmou. Veja se o Node está ligado.");
  };



  window.restaurarPedido = async function (id) {
    if (!confirm(`Restaurar o pedido #${id} para a lista principal?`)) return;
    try {
      const resposta = await fetch(`${API_BASE}/pedidos/${encodeURIComponent(id)}/restaurar`, { method:"POST" });
      if (!resposta.ok) throw new Error("Servidor não restaurou o pedido");
      await carregarPedidosExcluidos();
      await carregarPedidos();
      alert("Pedido restaurado.");
    } catch (erro) {
      alert("Não consegui restaurar. Confere se o Node está ligado em localhost:3000.");
    }
  };

  window.excluirPedidoDefinitivo = async function (id) {
    if (!confirm(`Excluir definitivamente o pedido #${id}? Essa ação não tem volta.`)) return;
    try {
      const resposta = await fetch(`${API_EXCLUIDOS}/${encodeURIComponent(id)}`, { method:"DELETE" });
      if (!resposta.ok) throw new Error("Servidor não excluiu definitivamente");
      await carregarPedidosExcluidos();
      alert("Pedido excluído definitivamente.");
    } catch (erro) {
      alert("Não consegui excluir definitivamente. Confere se o Node está ligado em localhost:3000.");
    }
  };

  window.logoutADM = function () {
    localStorage.removeItem("adminLogado");
    window.location.href = "login.html";
  };

  function atualizarFaturamentoHoje(pedidos) {
    if (!faturamentoHojeEl) return;
    const hoje = new Date().toISOString().slice(0,10);
    const total = pedidos.filter((p) => normalizarStatus(p.status) === "pago" && dataISOdoPedido(p.data) === hoje).reduce((s, p) => s + totalPedido(p), 0);
    faturamentoHojeEl.innerText = formatarMoeda(total);
  }

  function criarGraficoVendas(pedidos) {
    const canvas = document.getElementById("graficoVendas");
    if (!canvas || !window.Chart) return;
    const dias = [];
    const valores = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const iso = d.toISOString().slice(0,10);
      dias.push(d.toLocaleDateString("pt-BR", { day:"2-digit", month:"2-digit" }));
      valores.push(pedidos.filter((p) => normalizarStatus(p.status) === "pago" && dataISOdoPedido(p.data) === iso).reduce((s, p) => s + totalPedido(p), 0));
    }
    if (window.graficoMS) window.graficoMS.destroy();
    window.graficoMS = new Chart(canvas, { type:"line", data:{ labels:dias, datasets:[{ label:"Vendas", data:valores, tension:.4, fill:true }] }, options:{ responsive:true, plugins:{ legend:{ display:false } } } });
  }

  async function ativarNotificacoesADM() {
    if (!("Notification" in window)) return;
    if (Notification.permission === "default") await Notification.requestPermission();
  }

  function notificarNovoPedidoADM(pedido) {
    if (!("Notification" in window) || Notification.permission !== "granted") return;
    new Notification("Novo pedido na MS", { body:`${pedido.nome || "Cliente"} - ${formatarMoeda(totalPedido(pedido))}`, icon:"logo.png" });
  }

  let ultimoTotalPedidosADM = Number(localStorage.getItem("ultimoTotalPedidosADM") || 0);
  async function verificarNovosPedidosADM() {
    const pedidos = await pegarPedidos();
    if (ultimoTotalPedidosADM === 0) {
      ultimoTotalPedidosADM = pedidos.length;
      localStorage.setItem("ultimoTotalPedidosADM", String(ultimoTotalPedidosADM));
      return;
    }
    if (pedidos.length > ultimoTotalPedidosADM) {
      notificarNovoPedidoADM(pedidos[pedidos.length - 1]);
      ultimoTotalPedidosADM = pedidos.length;
      localStorage.setItem("ultimoTotalPedidosADM", String(ultimoTotalPedidosADM));
      atualizarResumo(pedidos);
      renderizarPedidos(pedidos);
    }
  }

  buscaCliente?.addEventListener("input", () => filtroAtual === "excluidos" ? renderizarPedidosExcluidos() : renderizarPedidos());
  filtroData?.addEventListener("change", () => filtroAtual === "excluidos" ? renderizarPedidosExcluidos() : renderizarPedidos());

  carregarPedidos();
  ativarNotificacoesADM();
  setInterval(verificarNovosPedidosADM, 8000);
  window.carregarPedidos = carregarPedidos;
  window.atualizarPedidos = carregarPedidos;
})();

// GERENCIADOR DE PRODUTOS MS -------------------------------------------------
(function(){
  const API = (location.hostname === '127.0.0.1' || location.hostname === 'localhost') ? 'http://localhost:3000' : 'https://ms-matias-style.onrender.com';
  let produtos = [];
  const esc = v => String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const num = v => Number(String(v ?? 0).replace(',','.')) || 0;
  const moeda = v => num(v).toLocaleString('pt-BR',{style:'currency',currency:'BRL'});

  function criarInterface(){
    if(document.getElementById('abaProdutosMS')) return;
    const nav = document.querySelector('.menu-ms, nav');
    if(nav){
      const b=document.createElement('button');
      b.type='button'; b.className='ms-tab'; b.innerHTML='＋ Cadastrar produto';
      b.onclick=()=>abrirProdutosMS(); nav.appendChild(b);
    }
    const main=document.querySelector('main, .conteudo-admin, .admin-main, .main-content') || document.body;
    const sec=document.createElement('section');
    sec.id='abaProdutosMS'; sec.style.display='none';
    sec.innerHTML=`
      <style>
      #abaProdutosMS{padding:24px;color:#f4f4f4}.ms-prod-head{display:flex;justify-content:space-between;gap:14px;align-items:center;flex-wrap:wrap;margin-bottom:20px}
      .ms-prod-head h2{margin:0;font-size:28px}.ms-prod-btn{border:0;border-radius:14px;padding:12px 18px;font-weight:900;cursor:pointer;background:#d8ad43;color:#111}
      .ms-prod-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px}.ms-prod-card{background:#14171d;border:1px solid rgba(255,255,255,.1);border-radius:20px;padding:16px;display:grid;grid-template-columns:76px 1fr;gap:14px}
      .ms-prod-card img{width:76px;height:96px;object-fit:cover;border-radius:12px;background:#222}.ms-prod-card h3{margin:0 0 7px}.ms-prod-meta{font-size:13px;color:#aaa}.ms-prod-acoes{grid-column:1/-1;display:flex;gap:8px}.ms-prod-acoes button{flex:1;border:1px solid rgba(255,255,255,.13);background:#20242d;color:white;border-radius:12px;padding:10px;cursor:pointer}
      .ms-prod-form{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;background:#14171d;border:1px solid rgba(255,255,255,.1);padding:18px;border-radius:20px;margin-bottom:18px}.ms-prod-form label{display:grid;gap:6px;font-size:13px;font-weight:800}.ms-prod-form input,.ms-prod-form textarea{background:#0f1116;color:white;border:1px solid rgba(255,255,255,.14);border-radius:12px;padding:11px}.ms-prod-form textarea{min-height:85px;resize:vertical}.ms-prod-full{grid-column:1/-1}.ms-checks{display:flex;gap:16px;align-items:center;flex-wrap:wrap}.ms-checks label{display:flex;grid-auto-flow:column;align-items:center}.ms-form-actions{display:flex;gap:10px}.ms-msg{padding:11px 13px;border-radius:12px;background:#20242d;margin-bottom:14px;display:none}@media(max-width:700px){.ms-prod-form{grid-template-columns:1fr}.ms-prod-full{grid-column:auto}}
      </style>
      <div class="ms-prod-head"><div><h2>Produtos</h2><div class="ms-prod-meta">Cadastre e edite sem mexer no HTML.</div></div><button class="ms-prod-btn" onclick="novoProdutoMS()">+ Novo produto</button></div>
      <div id="msgProdutoMS" class="ms-msg"></div>
      <form id="formProdutoMS" class="ms-prod-form" style="display:none">
        <input type="hidden" id="produtoIdMS">
        <label>Nome<input id="produtoNomeMS" required></label><label>Categoria<input id="produtoCategoriaMS" value="Roupas"></label>
        <label>Preço<input id="produtoPrecoMS" type="number" step="0.01" min="0" required></label><label>Preço antigo<input id="produtoPrecoAntigoMS" type="number" step="0.01" min="0"></label>
        <label class="ms-prod-full">Imagem principal<input id="produtoImagemMS" placeholder="ex.: moletom-preto.jpeg ou URL"></label>
        <label class="ms-prod-full">Outras imagens, separadas por vírgula<input id="produtoImagensMS"></label>
        <label class="ms-prod-full">Descrição<textarea id="produtoDescricaoMS"></textarea></label>
        <label>Cores, separadas por vírgula<input id="produtoCoresMS" placeholder="Preto, Bege, Rosa"></label><label>Tamanhos, separados por vírgula<input id="produtoTamanhosMS" value="P, M, G, GG"></label>
        <label class="ms-prod-full">Quantidade inicial por variação<input id="produtoQuantidadeMS" type="number" min="0" value="0"><small class="ms-prod-meta">Ex.: 3 cria 3 unidades para cada combinação de cor e tamanho.</small></label>
        <div class="ms-checks ms-prod-full"><label><input id="produtoAtivoMS" type="checkbox" checked> Ativo</label><label><input id="produtoDestaqueMS" type="checkbox"> Destaque</label><label><input id="produtoPromocaoMS" type="checkbox"> Promoção</label></div>
        <div class="ms-form-actions ms-prod-full"><button class="ms-prod-btn" type="submit">Salvar produto</button><button type="button" onclick="cancelarProdutoMS()">Cancelar</button></div>
      </form>
      <div id="listaProdutosMS" class="ms-prod-grid"></div>`;
    main.appendChild(sec);
    document.getElementById('formProdutoMS').addEventListener('submit', salvarProdutoMS);
  }

  function esconderOutrasAbas(){
    document.querySelectorAll('main > section, .conteudo-admin > section, .admin-main > section').forEach(s=>{if(s.id!=='abaProdutosMS') s.style.display='none';});
  }
  window.abrirProdutosMS=async function(){ criarInterface(); esconderOutrasAbas(); document.getElementById('abaProdutosMS').style.display='block'; await carregarProdutosMS(); };
  window.novoProdutoMS=function(){
    document.getElementById('formProdutoMS').reset(); document.getElementById('produtoIdMS').value=''; document.getElementById('produtoCategoriaMS').value='Roupas'; document.getElementById('produtoAtivoMS').checked=true; document.getElementById('formProdutoMS').style.display='grid'; scrollTo({top:0,behavior:'smooth'});
  };
  window.cancelarProdutoMS=function(){ document.getElementById('formProdutoMS').style.display='none'; };
  function msg(t,erro=false){const e=document.getElementById('msgProdutoMS');e.textContent=t;e.style.display='block';e.style.background=erro?'#4a1820':'#1d3b2a';setTimeout(()=>e.style.display='none',3500)}
  async function carregarProdutosMS(){
    const box=document.getElementById('listaProdutosMS'); box.innerHTML='Carregando...';
    try{const r=await fetch(`${API}/produtos?t=${Date.now()}`); if(!r.ok) throw new Error(); produtos=await r.json(); render();}
    catch(e){box.innerHTML='Não consegui carregar os produtos. Confira se o servidor está ligado.';}
  }
  function render(){
    const box=document.getElementById('listaProdutosMS');
    if(!produtos.length){box.innerHTML='<p>Nenhum produto cadastrado ainda.</p>';return;}
    box.innerHTML=produtos.map(p=>`<article class="ms-prod-card"><img src="${esc(p.imagem||'logo.png')}" onerror="this.src='logo.png'"><div><h3>${esc(p.nome)}</h3><div class="ms-prod-meta">${esc(p.categoria)} · ${moeda(p.preco)}</div><div class="ms-prod-meta">${p.ativo?'Ativo':'Oculto'}${p.destaque?' · Destaque':''}${p.promocao?' · Promoção':''}</div></div><div class="ms-prod-acoes"><button onclick="editarProdutoMS(${p.id})">Editar</button><button onclick="excluirProdutoMS(${p.id})">Excluir</button></div></article>`).join('');
  }
  window.editarProdutoMS=function(id){
    const p=produtos.find(x=>x.id===id); if(!p)return; novoProdutoMS();
    produtoIdMS.value=p.id; produtoNomeMS.value=p.nome||''; produtoCategoriaMS.value=p.categoria||''; produtoPrecoMS.value=p.preco||0; produtoPrecoAntigoMS.value=p.precoAntigo??''; produtoImagemMS.value=p.imagem||''; produtoImagensMS.value=(p.imagens||[]).join(', '); produtoDescricaoMS.value=p.descricao||''; produtoCoresMS.value=(p.cores||[]).join(', '); produtoTamanhosMS.value=(p.tamanhos||['P','M','G','GG']).join(', '); produtoQuantidadeMS.value=0; produtoAtivoMS.checked=!!p.ativo; produtoDestaqueMS.checked=!!p.destaque; produtoPromocaoMS.checked=!!p.promocao;
  };
  async function salvarProdutoMS(ev){
    ev.preventDefault(); const id=produtoIdMS.value;
    const body={nome:produtoNomeMS.value.trim(),categoria:produtoCategoriaMS.value.trim()||'Roupas',preco:num(produtoPrecoMS.value),precoAntigo:produtoPrecoAntigoMS.value===''?null:num(produtoPrecoAntigoMS.value),imagem:produtoImagemMS.value.trim(),imagens:produtoImagensMS.value.split(',').map(x=>x.trim()).filter(Boolean),descricao:produtoDescricaoMS.value.trim(),cores:produtoCoresMS.value.split(',').map(x=>x.trim()).filter(Boolean),tamanhos:produtoTamanhosMS.value.split(',').map(x=>x.trim().toUpperCase()).filter(Boolean),ativo:produtoAtivoMS.checked,destaque:produtoDestaqueMS.checked,promocao:produtoPromocaoMS.checked};
    try{const r=await fetch(id?`${API}/produtos/${id}`:`${API}/produtos`,{method:id?'PUT':'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(body)});const d=await r.json();if(!r.ok)throw new Error(d.mensagem||'Erro ao salvar'); const qtd=Math.max(0,num(produtoQuantidadeMS.value)); if(qtd>0){const cores=body.cores.length?body.cores:['Única'];const tamanhos=body.tamanhos.length?body.tamanhos:['ÚNICO'];for(const cor of cores){for(const tamanho of tamanhos){await fetch(`${API}/estoque`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({nome:body.nome,cor,tamanho,quantidade:qtd})});}}}cancelarProdutoMS();msg(qtd>0?'Produto e estoque salvos.':'Produto salvo.');await carregarProdutosMS();}catch(e){msg(e.message,true)}
  }
  window.excluirProdutoMS=async function(id){
    if(!confirm('Excluir este produto?'))return;
    try{const r=await fetch(`${API}/produtos/${id}`,{method:'DELETE'});if(!r.ok)throw new Error();msg('Produto excluído.');await carregarProdutosMS();}catch(e){msg('Não consegui excluir.',true)}
  };
  document.addEventListener('DOMContentLoaded',criarInterface);
})();
