(function(){
  const API=(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:')?'http://localhost:3000':'https://ms-matias-style.onrender.com';
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function normalizar(v){const mapa={'🚚':'truck','💳':'card','🔁':'repeat','✓':'check'};return mapa[v]||v||'check'}
  function itemHtml(x){return `<span class="beneficio-faixa-item-ms"><b aria-hidden="true">${window.MSIcons?.icon(normalizar(x.icone))||''}</b><span>${esc(x.texto)}</span></span>`}
  function aplicar(c){
    document.querySelectorAll('.barra-beneficios-topo').forEach(barra=>{
      const itens=(c.itens||[]).filter(x=>x.ativo!==false&&x.texto).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
      const conteudo=itens.map(itemHtml).join('');
      barra.innerHTML=`<div class="beneficios-esteira-ms"><div class="beneficios-trilho-ms"><div class="beneficios-grupo-ms">${conteudo}</div><div class="beneficios-grupo-ms" aria-hidden="true">${conteudo}</div></div></div>`;
      barra.style.setProperty('--beneficios-fundo-ms',c.fundo||'#000');
      barra.style.setProperty('--beneficios-texto-ms',c.corTexto||'#fff');
      barra.dataset.ativo=c.ativo===false?'false':'true';
      barra.dataset.desktop=c.mostrarDesktop===false?'false':'true';
      barra.dataset.mobile=c.mostrarMobile===false?'false':'true';
      barra.hidden=c.ativo===false||!itens.length;
    });
  }
  async function carregar(){try{const r=await fetch(`${API}/beneficios-config?t=${Date.now()}`,{cache:'no-store'});if(r.ok)aplicar(await r.json())}catch(e){console.warn('Não foi possível carregar a barra de benefícios.',e)}}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',carregar,{once:true});else carregar();
  window.addEventListener('pageshow',e=>{if(e.persisted)carregar()});
})();
