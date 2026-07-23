(function(){
  'use strict';
  const icons={
    truck:'<svg viewBox="0 0 24 24"><path d="M3 6h11v10H3zM14 9h4l3 3v4h-7zM7 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm10 0a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z"/></svg>',
    card:'<svg viewBox="0 0 24 24"><rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9h19M6 15h4"/></svg>',
    repeat:'<svg viewBox="0 0 24 24"><path d="M17 2l4 4-4 4M3 11V9a3 3 0 0 1 3-3h15M7 22l-4-4 4-4M21 13v2a3 3 0 0 1-3 3H3"/></svg>',
    cart:'<svg viewBox="0 0 24 24"><path d="M3 3h2l2.4 10.2a2 2 0 0 0 2 1.6h7.8a2 2 0 0 0 2-1.6L21 7H6M10 20a1 1 0 1 1-2 0 1 1 0 0 1 2 0Zm9 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0Z"/></svg>',
    bag:'<svg viewBox="0 0 24 24"><path d="M5 8h14l-1 13H6L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></svg>',
    heart:'<svg viewBox="0 0 24 24"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/></svg>',
    trash:'<svg viewBox="0 0 24 24"><path d="M4 7h16M9 7V4h6v3M7 7l1 14h8l1-14M10 11v6M14 11v6"/></svg>',
    check:'<svg viewBox="0 0 24 24"><path d="m5 12 4 4L19 6"/></svg>',
    bolt:'<svg viewBox="0 0 24 24"><path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/></svg>',
    lock:'<svg viewBox="0 0 24 24"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/></svg>',
    search:'<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></svg>',
    eye:'<svg viewBox="0 0 24 24"><path d="M2 12s3.5-6 10-6 10 6 10 6-3.5 6-10 6S2 12 2 12Z"/><circle cx="12" cy="12" r="2.5"/></svg>',
    sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24"><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
    menu:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>'
  };
  const aliases={'🚚':'truck','💳':'card','🔁':'repeat','🛒':'cart','🛍':'bag','🛍️':'bag','♡':'heart','♥':'heart','🗑':'trash','🗑️':'trash','✅':'check','✓':'check','⚡':'bolt','🔐':'lock','🔎':'search','👁':'eye','☀️':'sun','🌙':'moon','☰':'menu'};
  function icon(name,label){name=aliases[name]||name||'check';return `<span class="ms-icon ms-icon-${name}" aria-hidden="true">${icons[name]||icons.check}</span>${label?`<span class="ms-sr-only">${label}</span>`:''}`}
  function replace(root=document){
    root.querySelectorAll('[data-ms-icon]').forEach(el=>{el.innerHTML=icon(el.dataset.msIcon,el.getAttribute('aria-label')||'')});
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT,{acceptNode:n=>{const p=n.parentElement;if(!p||/^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION)$/.test(p.tagName))return NodeFilter.FILTER_REJECT;return Object.keys(aliases).some(x=>n.nodeValue.trim()===x)?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;}});
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const key=n.nodeValue.trim();const span=document.createElement('span');span.innerHTML=icon(aliases[key]);n.replaceWith(span.firstElementChild)});
  }
  window.MSIcons={icon,replace,aliases};
  const run=()=>replace(document);if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',run);else run();
  new MutationObserver(m=>m.forEach(x=>x.addedNodes.forEach(n=>{if(n.nodeType===1)replace(n)}))).observe(document.documentElement,{childList:true,subtree:true});
})();
