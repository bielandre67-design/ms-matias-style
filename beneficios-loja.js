(function(){
  const API=(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:')?'http://localhost:3000':'https://ms-matias-style.onrender.com';
  const icones={
    truck:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h11v10H3z"/><path d="M14 10h4l3 3v3h-7z"/><circle cx="7" cy="18" r="2"/><circle cx="18" cy="18" r="2"/></svg>',
    card:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 10h18M7 15h4"/></svg>',
    repeat:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M17 2l4 4-4 4"/><path d="M3 11V9a3 3 0 0 1 3-3h15"/><path d="M7 22l-4-4 4-4"/><path d="M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    shield:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l8 3v5c0 5-3.4 8.6-8 10-4.6-1.4-8-5-8-10V6z"/><path d="M9 12l2 2 4-4"/></svg>',
    check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M8 12l2.5 2.5L16 9"/></svg>',
    bag:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1 12H6z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    pin:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function normalizar(v){const mapa={'🚚':'truck','💳':'card','🔁':'repeat','✓':'check'};return mapa[v]||v||'check';}
  function itemHtml(x){const nome=normalizar(x.icone);return `<span class="beneficio-faixa-item-ms"><span class="beneficio-icone-vetor-ms" aria-hidden="true">${icones[nome]||icones.check}</span><span>${esc(x.texto)}</span></span>`;}
  function aplicar(c){
    document.querySelectorAll('.barra-beneficios-topo').forEach(barra=>{
      const itens=(c.itens||[]).filter(x=>x.ativo!==false&&x.texto).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
      const conteudo=itens.map(itemHtml).join('');
      barra.innerHTML=`<div class="beneficios-esteira-ms"><div class="beneficios-trilho-ms"><div class="beneficios-grupo-ms">${conteudo}</div><div class="beneficios-grupo-ms" aria-hidden="true">${conteudo}</div></div></div>`;
      barra.style.setProperty('--beneficios-fundo-ms',c.fundo||'#090909');
      barra.style.setProperty('--beneficios-texto-ms',c.corTexto||'#fff');
      barra.style.setProperty('--beneficios-icone-ms',c.corIcone||'#d8ad43');
      barra.style.setProperty('--beneficios-velocidade-ms',`${Math.max(12,Math.min(60,Number(c.velocidade)||28))}s`);
      barra.style.setProperty('--beneficios-altura-ms',`${Math.max(36,Math.min(58,Number(c.altura)||44))}px`);
      barra.dataset.ativo=c.ativo===false?'false':'true';
      barra.dataset.desktop=c.mostrarDesktop===false?'false':'true';
      barra.dataset.mobile=c.mostrarMobile===false?'false':'true';
      barra.dataset.pausar=c.pausarHover===false?'false':'true';
      barra.hidden=c.ativo===false||!itens.length;
    });
  }
  async function carregar(){try{const r=await fetch(`${API}/beneficios-config?t=${Date.now()}`,{cache:'no-store'});if(r.ok)aplicar(await r.json());}catch(e){console.warn('Não foi possível carregar a barra de benefícios.',e);}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',carregar,{once:true});else carregar();
  window.addEventListener('pageshow',e=>{if(e.persisted)carregar();});
})();
