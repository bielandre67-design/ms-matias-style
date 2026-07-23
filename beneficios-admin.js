(function(){
  const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
    ? 'http://localhost:3000' : 'https://ms-matias-style.onrender.com';
  let config = null;
  const padrao = {ativo:true,fundo:'#000000',corTexto:'#ffffff',mostrarDesktop:true,mostrarMobile:true,itens:[
    {id:'frete',icone:'truck',texto:'FRETE PARA TODO O BRASIL',ativo:true,ordem:1},
    {id:'parcelamento',icone:'card',texto:'PARCELE EM ATÉ 3X SEM JUROS',ativo:true,ordem:2},
    {id:'troca',icone:'repeat',texto:'TROCA GARANTIDA EM ATÉ 7 DIAS',ativo:true,ordem:3}
  ]};
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function status(msg,ok=true){const el=document.getElementById('beneficiosStatusMS');if(!el)return;el.textContent=msg;el.className='beneficios-status-ms '+(ok?'ok':'erro');}
  function render(){
    if(!config) config=structuredClone(padrao);
    beneficiosBarraAtivaMS.checked=config.ativo!==false;
    beneficiosDesktopMS.checked=config.mostrarDesktop!==false;
    beneficiosMobileMS.checked=config.mostrarMobile!==false;
    beneficiosFundoMS.value=config.fundo||'#000000';
    beneficiosTextoCorMS.value=config.corTexto||'#ffffff';
    const lista=document.getElementById('beneficiosListaMS');
    lista.innerHTML=(config.itens||[]).sort((a,b)=>(a.ordem||0)-(b.ordem||0)).map((item,i)=>`<article class="beneficio-editor-item-ms" data-beneficio-index="${i}">
      <div class="beneficio-arrastar-ms">⋮⋮</div>
      <label>Ícone<select class="beneficio-icone-ms"><option value="truck">Entrega</option><option value="card">Pagamento</option><option value="repeat">Troca</option><option value="lock">Segurança</option><option value="check">Confirmação</option><option value="bag">Compra</option></select></label>
      <label class="beneficio-texto-campo-ms">Texto<input class="beneficio-texto-ms" value="${esc(item.texto||'')}" maxlength="100"></label>
      <label>Ordem<input class="beneficio-ordem-ms" type="number" min="1" max="99" value="${Number(item.ordem)||i+1}"></label>
      <label class="beneficio-ativo-ms"><input class="beneficio-check-ms" type="checkbox" ${item.ativo!==false?'checked':''}> Ativo</label>
      <button type="button" class="beneficio-remover-ms" onclick="removerBeneficioMS(${i})">Excluir</button>
    </article>`).join('');
    document.querySelectorAll('[data-beneficio-index]').forEach((el,i)=>{const sel=el.querySelector('.beneficio-icone-ms');if(sel)sel.value=config.itens[i]?.icone||'check'});
    atualizarPreview();
  }
  function lerTela(){
    const itens=[...document.querySelectorAll('[data-beneficio-index]')].map((el,i)=>({
      id:(config?.itens?.[i]?.id)||`beneficio-${Date.now()}-${i}`,
      icone:el.querySelector('.beneficio-icone-ms').value||'check',
      texto:el.querySelector('.beneficio-texto-ms').value.trim(),
      ordem:Number(el.querySelector('.beneficio-ordem-ms').value)||i+1,
      ativo:el.querySelector('.beneficio-check-ms').checked
    })).filter(x=>x.texto);
    return {ativo:beneficiosBarraAtivaMS.checked,mostrarDesktop:beneficiosDesktopMS.checked,mostrarMobile:beneficiosMobileMS.checked,fundo:beneficiosFundoMS.value,corTexto:beneficiosTextoCorMS.value,itens};
  }
  function atualizarPreview(){
    try{config=lerTela();}catch(e){}
    const p=document.getElementById('beneficiosPreviewMS'); if(!p||!config)return;
    p.style.background=config.fundo;p.style.color=config.corTexto;p.hidden=config.ativo===false;
    p.innerHTML=(config.itens||[]).filter(x=>x.ativo!==false).sort((a,b)=>a.ordem-b.ordem).map(x=>`<span>${window.MSIcons?.icon(x.icone)||''} ${esc(x.texto)}</span>`).join('');
  }
  window.carregarBeneficiosMS=async function(){
    status('Carregando configurações...',true);
    try{const r=await fetch(`${API}/beneficios-config?t=${Date.now()}`,{cache:'no-store'});const d=await r.json();if(!r.ok)throw new Error(d.mensagem||'Falha ao carregar');config=d;render();status('Configurações carregadas.',true);}catch(e){config=structuredClone(padrao);render();status(e.message||'Não foi possível carregar.',false);}
  };
  window.adicionarBeneficioMS=function(){
    config=lerTela(); if(config.itens.length>=6)return status('O limite é de 6 benefícios.',false);
    config.itens.push({id:`beneficio-${Date.now()}`,icone:'check',texto:'NOVO BENEFÍCIO',ativo:true,ordem:config.itens.length+1});render();
  };
  window.removerBeneficioMS=function(i){config=lerTela();config.itens.splice(i,1);config.itens.forEach((x,n)=>x.ordem=n+1);render();};
  window.salvarBeneficiosMS=async function(){
    const btn=document.getElementById('salvarBeneficiosMS'); const original=btn.textContent;config=lerTela();
    if(!config.itens.length)return status('Cadastre pelo menos um benefício.',false);
    btn.disabled=true;btn.textContent='Salvando...';
    try{const r=await fetch(`${API}/beneficios-config`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.mensagem||'Falha ao salvar');config=d.config||config;render();status('Barra publicada no site com sucesso ✓',true);}catch(e){status(e.message||'Não foi possível salvar.',false);}finally{btn.disabled=false;btn.textContent=original;}
  };
  document.addEventListener('input',e=>{if(e.target.closest('#beneficiosAba'))atualizarPreview();});
  document.addEventListener('change',e=>{if(e.target.closest('#beneficiosAba'))atualizarPreview();});
})();
