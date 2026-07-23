(function(){
  const API=(location.hostname==='localhost'||location.hostname==='127.0.0.1'||location.protocol==='file:')?'http://localhost:3000':'https://ms-matias-style.onrender.com';
  function esc(v){return String(v??'').replace(/[&<>'"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));}
  function aplicar(c){
    const barras=document.querySelectorAll('.barra-beneficios-topo');
    barras.forEach(barra=>{
      const itens=(c.itens||[]).filter(x=>x.ativo!==false&&x.texto).sort((a,b)=>(a.ordem||0)-(b.ordem||0));
      barra.innerHTML=itens.map(x=>`<span><b aria-hidden="true">${esc(x.icone||'✓')}</b> ${esc(x.texto)}</span>`).join('');
      barra.style.setProperty('--beneficios-fundo-ms',c.fundo||'#000000');
      barra.style.setProperty('--beneficios-texto-ms',c.corTexto||'#ffffff');
      barra.dataset.ativo=c.ativo===false?'false':'true';
      barra.dataset.desktop=c.mostrarDesktop===false?'false':'true';
      barra.dataset.mobile=c.mostrarMobile===false?'false':'true';
      barra.hidden=c.ativo===false||!itens.length;
    });
  }
  async function carregar(){
    try{const r=await fetch(`${API}/beneficios-config?t=${Date.now()}`,{cache:'no-store'});if(!r.ok)return;aplicar(await r.json());}catch(e){console.warn('Não foi possível carregar a barra de benefícios.',e);}
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',carregar,{once:true});else carregar();
  window.addEventListener('pageshow',e=>{if(e.persisted)carregar();});
})();
