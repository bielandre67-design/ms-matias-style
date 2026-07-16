(function () {
  "use strict";

  const API = (window.API_BASE || "https://ms-matias-style.onrender.com").replace(/\/$/, "");
  let brickController = null;
  let carregando = false;

  function valor(id) {
    return String(document.getElementById(id)?.value || "").trim();
  }

  function carrinhoAtual() {
    try { return JSON.parse(localStorage.getItem("carrinho") || "[]"); }
    catch (_) { return []; }
  }

  function dadosPedido() {
    const mobile = window.innerWidth <= 768;
    const freteSalvo = (() => {
      try { return JSON.parse(localStorage.getItem("freteSelecionadoMS") || "null"); }
      catch (_) { return null; }
    })();

    const freteObj = window.freteSelecionado || freteSalvo || null;
    const retirada = Boolean(
      freteObj?.retiradaLocal ||
      String(freteObj?.nome || "").toLowerCase().includes("retirada")
    );

    return {
      items: carrinhoAtual(),
      nome: mobile ? valor("nomeClienteMobile") : valor("nomeCliente"),
      telefone: mobile ? valor("telefoneClienteMobile") : valor("telefoneCliente"),
      email: mobile ? valor("emailClienteMobile") : (valor("emailCliente") || valor("emailClienteMobile")),
      cep: mobile ? valor("cepCheckout") : valor("cepCliente"),
      rua: mobile ? valor("ruaClienteMobile") : valor("ruaCliente"),
      numero: mobile ? valor("numeroCasaMobile") : valor("numeroCliente"),
      complemento: mobile ? valor("complementoClienteMobile") : valor("complementoCliente"),
      bairro: mobile ? valor("bairroClienteMobile") : valor("bairroCliente"),
      cidade: mobile ? valor("cidadeClienteMobile") : valor("cidadeCliente"),
      estado: mobile ? valor("estadoClienteMobile") : valor("estadoCliente"),
      tipoEntrega: retirada ? "retirada" : "entrega",
      retiradaLocal: retirada,
      valorFrete: retirada ? 0 : Number(window.valorFrete || freteObj?.preco || localStorage.getItem("valorFreteMS") || localStorage.getItem("valorFrete") || 0),
      freteSelecionado: freteObj,
      codigoCupom: String(window.codigoCupomAplicadoMS || "").trim().toUpperCase()
    };
  }

  function calcularTotal(pedido) {
    const subtotal = pedido.items.reduce((soma, item) => {
      const preco = typeof window.pegarPrecoNumero === "function"
        ? window.pegarPrecoNumero(item.preco ?? item.valor ?? item.price ?? 0)
        : Number(item.preco ?? item.valor ?? item.price ?? 0);
      return soma + preco * Number(item.quantidade ?? item.qtd ?? 1);
    }, 0);
    const percentual = Number(window.descontoCupomMS || 0);
    return Math.max(0.01, Number((subtotal - subtotal * percentual / 100 + Number(pedido.valorFrete || 0)).toFixed(2)));
  }

  function validar(pedido) {
    if (!pedido.items.length) return "Seu carrinho está vazio.";
    if (!pedido.nome) return "Informe o nome completo.";
    if (pedido.telefone.replace(/\D/g, "").length < 10) return "Informe um WhatsApp válido com DDD.";
    if (!pedido.retiradaLocal && (!pedido.cep || !pedido.rua || !pedido.numero || !pedido.bairro || !pedido.cidade || !pedido.estado)) {
      return "Preencha o endereço completo antes de pagar.";
    }
    return "";
  }

  function area() {
    let box = document.getElementById("paymentBrick_container");
    if (box) return box;
    const card = document.querySelector("#cmmsEtapaPagamento .pagamento-card-ms") || document.querySelector("#etapaPagamentoPC");
    if (!card) return null;
    box = document.createElement("div");
    box.id = "paymentBrick_container";
    box.style.marginTop = "18px";
    card.appendChild(box);
    return box;
  }

  function mensagem(html, tipo) {
    const box = area();
    if (!box) return;
    box.innerHTML = `<div class="ms-status-pagamento ${tipo || ""}" style="padding:18px;border-radius:14px;background:#111827;color:#fff;line-height:1.5;text-align:center">${html}</div>`;
  }

  function mostrarPix(resposta) {
    const transacao = resposta?.point_of_interaction?.transaction_data || {};
    const imagem = transacao.qr_code_base64 ? `<img alt="QR Code Pix" style="width:230px;max-width:90%;background:#fff;padding:10px;border-radius:12px" src="data:image/png;base64,${transacao.qr_code_base64}">` : "";
    const copia = transacao.qr_code ? `<textarea readonly style="width:100%;min-height:90px;margin-top:12px;padding:10px;border-radius:10px">${transacao.qr_code}</textarea><button type="button" id="copiarPixMS" style="margin-top:10px;padding:12px 18px;border:0;border-radius:10px;font-weight:700">Copiar código Pix</button>` : "";
    mensagem(`<h3 style="margin-top:0">Pix gerado</h3>${imagem}<p>Escaneie o QR Code ou copie o código abaixo.</p>${copia}<p id="statusPixMS">Aguardando confirmação do pagamento…</p>`, "pendente");
    document.getElementById("copiarPixMS")?.addEventListener("click", async () => {
      await navigator.clipboard.writeText(transacao.qr_code || "");
      document.getElementById("copiarPixMS").textContent = "Código copiado ✓";
    });
  }

  function aprovado() {
    mensagem("<h2 style='margin:0 0 8px'>✅ Pagamento aprovado!</h2><p style='margin:0'>Recebemos seu pagamento. Seu pedido já aparece como pago no painel da MS Matias Style.</p>", "aprovado");
    localStorage.removeItem("carrinho");
  }

  async function acompanhar(pedidoId) {
    if (!pedidoId) return;
    for (let i = 0; i < 120; i++) {
      await new Promise(r => setTimeout(r, 3000));
      try {
        const r = await fetch(`${API}/pagamento/status/${encodeURIComponent(pedidoId)}?t=${Date.now()}`, { cache: "no-store" });
        if (!r.ok) continue;
        const d = await r.json();
        const status = String(d.statusPagamento || d.pagamento?.status || d.status || "").toLowerCase();
        if (["approved", "pago"].includes(status)) return aprovado();
        if (["rejected", "recusado", "cancelled", "cancelado"].includes(status)) {
          return mensagem("<h3>Pagamento não aprovado</h3><p>Tente novamente ou escolha outra forma de pagamento.</p>", "erro");
        }
      } catch (_) {}
    }
  }

  async function abrirCheckout() {
    if (carregando) return false;
    const pedido = dadosPedido();
    const erro = validar(pedido);
    if (erro) { alert(erro); return false; }

    carregando = true;
    try {
      if (typeof window.atualizarResumoPagamentoMSComCupom === "function") window.atualizarResumoPagamentoMSComCupom();
      const total = calcularTotal(pedido);
      const configResp = await fetch(`${API}/config/mercadopago`, { cache: "no-store" });
      const config = await configResp.json();
      if (!config.publicKey) throw new Error("A chave pública do Mercado Pago não está configurada no Render.");
      if (!window.MercadoPago) throw new Error("O formulário seguro do Mercado Pago não carregou.");

      document.querySelectorAll(".btn-finalizar-ms, .btn-finalizar").forEach(b => b.style.display = "none");
      const box = area();
      box.innerHTML = "<p style='text-align:center'>Carregando formas de pagamento…</p>";
      if (brickController?.unmount) await brickController.unmount();

      const mp = new MercadoPago(config.publicKey, { locale: "pt-BR" });
      const bricks = mp.bricks();
      brickController = await bricks.create("payment", "paymentBrick_container", {
        initialization: {
          amount: total,
          payer: { email: pedido.email || undefined }
        },
        customization: {
          paymentMethods: {
            creditCard: "all",
            debitCard: "all",
            bankTransfer: "all",
            mercadoPago: "all",
            maxInstallments: 12
          },
          visual: { style: { theme: "dark" } }
        },
        callbacks: {
          onReady: () => { carregando = false; },
          onSubmit: async ({ selectedPaymentMethod, formData }) => {
            const resposta = await fetch(`${API}/processar-pagamento-brick`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ paymentData: formData, pedido })
            });
            const dados = await resposta.json();
            if (!resposta.ok || dados.erro) throw new Error(dados.mensagem || "Não foi possível processar o pagamento.");
            const status = String(dados.pagamento?.status || "").toLowerCase();
            if (status === "approved") aprovado();
            else if (selectedPaymentMethod === "bank_transfer" || dados.pagamento?.payment_method_id === "pix") mostrarPix(dados.pagamento);
            else if (status === "rejected") mensagem("<h3>Pagamento recusado</h3><p>Confira os dados ou escolha outra forma de pagamento.</p>", "erro");
            else mensagem("<h3>Pagamento em análise</h3><p>A confirmação aparecerá aqui automaticamente.</p>", "pendente");
            acompanhar(dados.pedido);
            return dados.pagamento;
          },
          onError: (e) => {
            console.error("Payment Brick:", e);
            carregando = false;
          }
        }
      });
    } catch (e) {
      carregando = false;
      console.error(e);
      mensagem(`<h3>Não foi possível abrir o pagamento</h3><p>${e.message || "Tente novamente."}</p>`, "erro");
      document.querySelectorAll(".btn-finalizar-ms, .btn-finalizar").forEach(b => b.style.display = "");
    }
    return false;
  }

  window.finalizarCompra = abrirCheckout;
  window.finalizarCompraFinal = abrirCheckout;
})();
