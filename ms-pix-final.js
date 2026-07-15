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
    clearInterval(msPixTimer); const caixa=document.querySelector("#msPixModal .ms-pix-caixa");
    caixa.innerHTML=`<div class="ms-pix-ok">✅</div><h2>Pagamento confirmado!</h2><p>Recebemos o pagamento do pedido <strong>#${pedido}</strong>.</p><p>Seu pedido já entrou na fila de separação da MS Matias Style.</p><button class="ms-pix-copiar" type="button" onclick="localStorage.removeItem('carrinho');location.href='index.html'">Voltar para a loja</button>`;
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

  window.finalizarCompra=pagarPixDentroDaLoja; window.finalizarCompraFinal=pagarPixDentroDaLoja; window.finalizarPagamento=pagarPixDentroDaLoja; window.pagarMercadoPago=pagarPixDentroDaLoja; window.msFinalizarPagamento=pagarPixDentroDaLoja;
  window.addEventListener("click",function(e){ const b=e.target.closest("button,a,input[type=button],input[type=submit]"); if(!b)return; const t=String(b.innerText||b.value||b.id||b.className||"").toLowerCase(); if((t.includes("pagar")||t.includes("finalizar pedido")||t.includes("mercado pago")||t.includes("finalizar compra")) && b.closest("#carrinhoModal,#carrinhoMobile,.carrinho,.checkout,form")){ pagarPixDentroDaLoja(e); } },true);
})();
