(function(){
  const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1' || location.protocol === 'file:')
    ? 'http://localhost:3000' : 'https://ms-matias-style.onrender.com';

  let config = null;
  const padrao = {
    ativo:true, fundo:'#090909', corTexto:'#ffffff', corIcone:'#d8ad43',
    mostrarDesktop:true, mostrarMobile:true, pausarHover:true, velocidade:28, altura:44,
    itens:[
      {id:'frete',icone:'truck',texto:'ENVIO PARA TODO O BRASIL',ativo:true,ordem:1},
      {id:'seguranca',icone:'shield',texto:'COMPRA 100% SEGURA',ativo:true,ordem:2},
      {id:'parcelamento',icone:'card',texto:'ATÉ 5X SEM JUROS',ativo:true,ordem:3},
      {id:'retirada',icone:'pin',texto:'RETIRADA NO LOCAL',ativo:true,ordem:4}
    ]
  };

  const icones = {
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
    bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };

  function clone(v){ return JSON.parse(JSON.stringify(v)); }
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function icon(nome){ return icones[nome] || icones.check; }
  function status(msg,ok=true){const el=document.getElementById('beneficiosStatusMS');if(!el)return;el.textContent=msg;el.className='beneficios-status-ms '+(ok?'ok':'erro');}
  function byId(id){ return document.getElementById(id); }

  function normalizar(c){
    c = c && typeof c === 'object' ? c : {};
    return {
      ...clone(padrao), ...c,
      velocidade: Math.max(12, Math.min(60, Number(c.velocidade)||28)),
      altura: Math.max(36, Math.min(58, Number(c.altura)||44)),
      itens: Array.isArray(c.itens) && c.itens.length ? c.itens : clone(padrao.itens)
    };
  }

  function render(){
    config=normalizar(config);
    byId('beneficiosBarraAtivaMS').checked=config.ativo!==false;
    byId('beneficiosDesktopMS').checked=config.mostrarDesktop!==false;
    byId('beneficiosMobileMS').checked=config.mostrarMobile!==false;
    byId('beneficiosPausarHoverMS').checked=config.pausarHover!==false;
    byId('beneficiosFundoMS').value=config.fundo||'#090909';
    byId('beneficiosTextoCorMS').value=config.corTexto||'#ffffff';
    byId('beneficiosIconeCorMS').value=config.corIcone||'#d8ad43';
    byId('beneficiosVelocidadeMS').value=config.velocidade||28;
    byId('beneficiosAlturaMS').value=config.altura||44;
    byId('beneficiosVelocidadeValorMS').textContent=`${config.velocidade||28}s`;
    byId('beneficiosAlturaValorMS').textContent=`${config.altura||44}px`;

    const itens=[...(config.itens||[])].sort((a,b)=>(a.ordem||0)-(b.ordem||0));
    config.itens=itens;
    byId('beneficiosListaMS').innerHTML=itens.map((item,i)=>`<article class="beneficio-editor-item-ms" data-beneficio-index="${i}">
      <div class="beneficio-arrastar-ms" title="Ordem do benefício">${String(i+1).padStart(2,'0')}</div>
      <label>Ícone<select class="beneficio-icone-ms">
        <option value="truck">Entrega</option><option value="shield">Segurança</option><option value="card">Pagamento</option><option value="repeat">Troca</option><option value="pin">Retirada</option><option value="bag">Compra</option><option value="clock">Prazo</option><option value="check">Confirmação</option>
      </select></label>
      <label class="beneficio-texto-campo-ms">Texto<input type="text" class="beneficio-texto-ms" value="${esc(item.texto||'')}" maxlength="100" placeholder="Ex.: COMPRA 100% SEGURA"></label>
      <label>Ordem<div class="beneficio-ordem-acoes-ms"><button type="button" class="beneficio-mover-ms" onclick="moverBeneficioMS(${i},-1)" aria-label="Mover para cima">↑</button><button type="button" class="beneficio-mover-ms" onclick="moverBeneficioMS(${i},1)" aria-label="Mover para baixo">↓</button></div></label>
      <label class="beneficio-ativo-ms"><input class="beneficio-check-ms" type="checkbox" ${item.ativo!==false?'checked':''}> Ativo</label>
      <button type="button" class="beneficio-remover-ms" onclick="removerBeneficioMS(${i})">Excluir</button>
    </article>`).join('');
    document.querySelectorAll('[data-beneficio-index]').forEach((el,i)=>{el.querySelector('.beneficio-icone-ms').value=config.itens[i]?.icone||'check';});
    atualizarPreview();
  }

  function lerTela(){
    const itens=[...document.querySelectorAll('[data-beneficio-index]')].map((el,i)=>({
      id:(config?.itens?.[i]?.id)||`beneficio-${Date.now()}-${i}`,
      icone:el.querySelector('.beneficio-icone-ms').value||'check',
      texto:el.querySelector('.beneficio-texto-ms').value.trim(),
      ordem:i+1,
      ativo:el.querySelector('.beneficio-check-ms').checked
    })).filter(x=>x.texto);
    return {
      ativo:byId('beneficiosBarraAtivaMS').checked,
      mostrarDesktop:byId('beneficiosDesktopMS').checked,
      mostrarMobile:byId('beneficiosMobileMS').checked,
      pausarHover:byId('beneficiosPausarHoverMS').checked,
      fundo:byId('beneficiosFundoMS').value,
      corTexto:byId('beneficiosTextoCorMS').value,
      corIcone:byId('beneficiosIconeCorMS').value,
      velocidade:Number(byId('beneficiosVelocidadeMS').value)||28,
      altura:Number(byId('beneficiosAlturaMS').value)||44,
      itens
    };
  }

  function atualizarPreview(){
    try{config=normalizar(lerTela());}catch(e){}
    const p=byId('beneficiosPreviewMS'); if(!p||!config)return;
    byId('beneficiosVelocidadeValorMS').textContent=`${config.velocidade}s`;
    byId('beneficiosAlturaValorMS').textContent=`${config.altura}px`;
    p.style.setProperty('--preview-fundo',config.fundo);
    p.style.setProperty('--preview-texto',config.corTexto);
    p.style.setProperty('--preview-icone',config.corIcone);
    p.style.minHeight=`${config.altura}px`;
    p.hidden=config.ativo===false;
    p.innerHTML=(config.itens||[]).filter(x=>x.ativo!==false).map(x=>`<span>${icon(x.icone)}<span>${esc(x.texto)}</span></span>`).join('');
  }

  window.carregarBeneficiosMS=async function(){
    status('Carregando configurações...',true);
    try{
      const r=await fetch(`${API}/beneficios-config?t=${Date.now()}`,{cache:'no-store'});
      const d=await r.json(); if(!r.ok)throw new Error(d.mensagem||'Falha ao carregar');
      config=normalizar(d);render();status('Configurações carregadas.',true);
    }catch(e){config=clone(padrao);render();status(e.message||'Não foi possível carregar.',false);}
  };

  window.adicionarBeneficioMS=function(){
    config=normalizar(lerTela()); if(config.itens.length>=6)return status('O limite é de 6 benefícios.',false);
    config.itens.push({id:`beneficio-${Date.now()}`,icone:'check',texto:'NOVO BENEFÍCIO',ativo:true,ordem:config.itens.length+1});render();
  };
  window.removerBeneficioMS=function(i){config=normalizar(lerTela());config.itens.splice(i,1);config.itens.forEach((x,n)=>x.ordem=n+1);render();};
  window.moverBeneficioMS=function(i,direcao){config=normalizar(lerTela());const destino=i+direcao;if(destino<0||destino>=config.itens.length)return;[config.itens[i],config.itens[destino]]=[config.itens[destino],config.itens[i]];config.itens.forEach((x,n)=>x.ordem=n+1);render();};

  window.salvarBeneficiosMS=async function(){
    const btn=byId('salvarBeneficiosMS'); const original=btn.textContent;config=normalizar(lerTela());
    if(!config.itens.length)return status('Cadastre pelo menos um benefício.',false);
    btn.disabled=true;btn.textContent='Salvando...';
    try{
      const r=await fetch(`${API}/beneficios-config`,{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(config)});
      const d=await r.json().catch(()=>({}));if(!r.ok)throw new Error(d.mensagem||'Falha ao salvar');
      config=normalizar(d.config||config);render();status('Barra publicada no site com sucesso.',true);
    }catch(e){status(e.message||'Não foi possível salvar.',false);}finally{btn.disabled=false;btn.textContent=original;}
  };

  document.addEventListener('input',e=>{if(e.target.closest('#beneficiosAba'))atualizarPreview();});
  document.addEventListener('change',e=>{if(e.target.closest('#beneficiosAba'))atualizarPreview();});
})();
