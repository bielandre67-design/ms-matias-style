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
    eyeOff:'<svg viewBox="0 0 24 24"><path d="m3 3 18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 4.2A11 11 0 0 1 12 4c6.5 0 10 8 10 8a18 18 0 0 1-2.1 3.2M6.6 6.6C3.5 8.4 2 12 2 12s3.5 8 10 8a10 10 0 0 0 5.4-1.6"/></svg>',
    sun:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>',
    moon:'<svg viewBox="0 0 24 24"><path d="M20 15.5A8 8 0 0 1 8.5 4 8.5 8.5 0 1 0 20 15.5Z"/></svg>',
    menu:'<svg viewBox="0 0 24 24"><path d="M4 6h16M4 12h16M4 18h16"/></svg>',
    warning:'<svg viewBox="0 0 24 24"><path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 9v5M12 18h.01"/></svg>',
    clock:'<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
    box:'<svg viewBox="0 0 24 24"><path d="m3 7 9-4 9 4-9 4-9-4Z"/><path d="M3 7v10l9 4 9-4V7M12 11v10"/></svg>',
    clipboard:'<svg viewBox="0 0 24 24"><rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V2h6v2M9 9h6M9 13h6M9 17h4"/></svg>',
    printer:'<svg viewBox="0 0 24 24"><path d="M7 8V3h10v5M7 17H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-3"/><path d="M7 14h10v7H7z"/></svg>',
    message:'<svg viewBox="0 0 24 24"><path d="M21 12a8 8 0 0 1-8 8H6l-4 2 1.4-4.2A9 9 0 1 1 21 12Z"/></svg>',
    money:'<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="M7 9h.01M17 15h.01M9 12h6"/></svg>',
    camera:'<svg viewBox="0 0 24 24"><path d="M4 7h4l2-3h4l2 3h4v13H4V7Z"/><circle cx="12" cy="13" r="4"/></svg>',
    receipt:'<svg viewBox="0 0 24 24"><path d="M6 3h12v18l-3-2-3 2-3-2-3 2V3Z"/><path d="M9 8h6M9 12h6M9 16h4"/></svg>',
    scale:'<svg viewBox="0 0 24 24"><path d="M12 3v18M5 7h14M7 7l-4 7h8L7 7ZM17 7l-4 7h8l-4-7ZM8 21h8"/></svg>',
    save:'<svg viewBox="0 0 24 24"><path d="M4 3h14l2 2v16H4V3Z"/><path d="M8 3v6h8V3M8 21v-8h8v8"/></svg>',
    undo:'<svg viewBox="0 0 24 24"><path d="m9 7-5 5 5 5M4 12h10a6 6 0 0 1 6 6"/></svg>',
    shirt:'<svg viewBox="0 0 24 24"><path d="m8 4-5 3 3 5 2-1v10h8V11l2 1 3-5-5-3a4 4 0 0 1-8 0Z"/></svg>',
    instagram:'<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".6"/></svg>',
    star:'<svg viewBox="0 0 24 24"><path d="m12 2 3 6 7 .9-5 4.8 1.3 7-6.3-3.3-6.3 3.3 1.3-7-5-4.8L9 8l3-6Z"/></svg>'
  };

  const aliases={
    '🚚':'truck','💳':'card','🔁':'repeat','🔄':'repeat','↩':'undo','↩️':'undo',
    '🛒':'cart','🛍':'bag','🛍️':'bag','♡':'heart','♥':'heart','❤':'heart','❤️':'heart',
    '🗑':'trash','🗑️':'trash','✅':'check','✓':'check','✔':'check','✔️':'check',
    '⚡':'bolt','🔐':'lock','🔒':'lock','🔎':'search','🔍':'search','👁':'eye','👁️':'eye','🙈':'eyeOff',
    '☀':'sun','☀️':'sun','🌙':'moon','☰':'menu','⚠':'warning','⚠️':'warning','⏳':'clock','🕒':'clock',
    '📦':'box','📋':'clipboard','🖨':'printer','🖨️':'printer','💬':'message','🙏':'message','💰':'money',
    '📷':'camera','🧾':'receipt','⚖':'scale','⚖️':'scale','💾':'save','👕':'shirt','📲':'instagram',
    '⭐':'star','★':'star'
  };

  const tokenPattern=new RegExp(Object.keys(aliases).sort((a,b)=>b.length-a.length).map(escapeRegExp).join('|'),'g');
  let replacing=false;

  function escapeRegExp(value){return value.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');}

  function icon(name,label){
    name=aliases[name]||name||'check';
    return `<span class="ms-icon ms-icon-${name}" aria-hidden="true">${icons[name]||icons.check}</span>${label?`<span class="ms-sr-only">${label}</span>`:''}`;
  }

  function makeIcon(name){
    const template=document.createElement('template');
    template.innerHTML=icon(name).trim();
    return template.content.firstElementChild;
  }

  function replaceTextNode(node){
    const text=node.nodeValue;
    if(!text || !tokenPattern.test(text)) return;
    tokenPattern.lastIndex=0;
    const fragment=document.createDocumentFragment();
    let last=0;
    text.replace(tokenPattern,(token,offset)=>{
      if(offset>last) fragment.appendChild(document.createTextNode(text.slice(last,offset)));
      const el=makeIcon(aliases[token]);
      el.classList.add('ms-icon-inline');
      fragment.appendChild(el);
      last=offset+token.length;
      return token;
    });
    if(last<text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
    node.replaceWith(fragment);
  }

  function shouldSkip(parent){
    return !parent || /^(SCRIPT|STYLE|TEXTAREA|INPUT|OPTION|SELECT|SVG|PATH)$/.test(parent.tagName) || parent.closest('.ms-icon,[data-ms-keep-emoji]');
  }

  function replace(root=document){
    if(replacing || !root) return;
    replacing=true;
    try{
      const scope=root.nodeType===1||root.nodeType===9?root:document;
      scope.querySelectorAll?.('[data-ms-icon]:not([data-ms-icon-ready])').forEach(el=>{
        el.innerHTML=icon(el.dataset.msIcon,el.getAttribute('aria-label')||'');
        el.dataset.msIconReady='1';
      });
      const walker=document.createTreeWalker(scope,NodeFilter.SHOW_TEXT,{acceptNode:n=>{
        if(shouldSkip(n.parentElement)) return NodeFilter.FILTER_REJECT;
        tokenPattern.lastIndex=0;
        return tokenPattern.test(n.nodeValue||'')?NodeFilter.FILTER_ACCEPT:NodeFilter.FILTER_REJECT;
      }});
      const nodes=[];
      while(walker.nextNode()) nodes.push(walker.currentNode);
      nodes.forEach(replaceTextNode);
    }finally{replacing=false;}
  }

  window.MSIcons={icon,replace,aliases,icons};
  const run=()=>replace(document);
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',run,{once:true}); else run();

  const observer=new MutationObserver(records=>{
    if(replacing) return;
    records.forEach(record=>record.addedNodes.forEach(node=>{
      if(node.nodeType===1) replace(node);
      else if(node.nodeType===3 && !shouldSkip(node.parentElement)) replaceTextNode(node);
    }));
  });
  observer.observe(document.documentElement,{childList:true,subtree:true});
})();
