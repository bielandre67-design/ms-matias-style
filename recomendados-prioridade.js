/* MS Matias Style - abertura prioritária dos cards recomendados
   Este arquivo precisa ser carregado ANTES do script.js.
   O listener no window/capture impede que correções antigas bloqueiem o clique. */
(function () {
  'use strict';

  const API_MS = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://ms-matias-style.onrender.com';

  function listaFotos(produto) {
    const extras = Array.isArray(produto?.imagens) ? produto.imagens : [];
    return [...new Set([produto?.imagem, ...extras]
      .map(v => String(v || '').trim())
      .filter(Boolean))];
  }

  function acharNaMemoria(id) {
    const lista = Array.isArray(window.produtosBancoMS) ? window.produtosBancoMS : [];
    return lista.find(p => String(p?.id) === String(id)) || null;
  }

  async function buscarProduto(id) {
    let produto = acharNaMemoria(id);
    if (produto) return produto;

    const resposta = await fetch(`${API_MS}/produtos?ativos=true&t=${Date.now()}`, {
      headers: { Accept: 'application/json' },
      cache: 'no-store'
    });
    if (!resposta.ok) throw new Error(`API ${resposta.status}`);
    const lista = await resposta.json();
    if (!Array.isArray(lista)) throw new Error('Resposta de produtos inválida');
    window.produtosBancoMS = lista;
    return lista.find(p => String(p?.id) === String(id)) || null;
  }

  function cardTemporario(produto, cardClicado) {
    const fotos = listaFotos(produto);
    const el = document.createElement('article');
    el.className = 'card-produto produto-banco-ms';
    el.dataset.idBanco = String(produto?.id || cardClicado?.dataset?.idBanco || '');
    el.dataset.nome = String(produto?.nome || cardClicado?.dataset?.nome || 'Produto MS');
    el.dataset.preco = Number(produto?.preco ?? cardClicado?.dataset?.preco ?? 0).toFixed(2);
    el.dataset.precoantigo = produto?.precoAntigo == null ? '' : Number(produto.precoAntigo || 0).toFixed(2);
    el.dataset.img = fotos[0] || cardClicado?.dataset?.img || 'logo.png';
    el.dataset.fotos = (fotos.length ? fotos : String(cardClicado?.dataset?.fotos || '').split(',')).filter(Boolean).join(',');
    el.dataset.descricao = String(produto?.descricao || produto?.tabelaMedidas || '');
    el.dataset.detalhes = String(produto?.detalhesProduto || '');
    el.dataset.composicao = String(produto?.composicao || '');
    el.dataset.cuidados = String(produto?.cuidados || '');
    el.dataset.categoria = String(produto?.categoria || cardClicado?.dataset?.categoria || '');
    el.dataset.cores = (Array.isArray(produto?.cores) ? produto.cores : []).join(',');
    el.dataset.tamanhos = (Array.isArray(produto?.tamanhos) && produto.tamanhos.length ? produto.tamanhos : ['P','M','G','GG']).join(',');
    return el;
  }

  function abrirDetalhe(card) {
    if (typeof window.abrirProdutoDetalheCard !== 'function') {
      throw new Error('Função de detalhes indisponível');
    }
    window.msDetalheVeioSlider = false;
    window.abrirProdutoDetalheCard(card);

    const detalhe = document.getElementById('produtoDetalhe');
    if (detalhe) {
      detalhe.classList.add('ativo');
      detalhe.style.display = 'block';
      detalhe.style.visibility = 'visible';
      detalhe.style.opacity = '1';
      detalhe.style.pointerEvents = 'auto';
      detalhe.scrollTop = 0;
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  function aviso(texto) {
    if (typeof window.avisoCarrinhoPremium === 'function') {
      window.avisoCarrinhoPremium(texto);
      return;
    }
    console.error(texto);
    alert(texto);
  }

  async function tratarClique(card) {
    const id = String(card.dataset.idBanco || '').trim();
    let produto = id ? await buscarProduto(id) : null;

    // Fallback por nome para cadastros antigos que ainda não tenham ID no card.
    if (!produto) {
      const nome = String(card.dataset.nome || card.querySelector('h4,h3')?.textContent || '').trim().toLowerCase();
      const lista = Array.isArray(window.produtosBancoMS) ? window.produtosBancoMS : [];
      produto = lista.find(p => String(p?.nome || '').trim().toLowerCase() === nome) || null;
    }

    const completo = cardTemporario(produto || {}, card);
    abrirDetalhe(completo);
  }

  // WINDOW + CAPTURE: executa antes dos listeners antigos colocados no document.
  window.addEventListener('click', function (evento) {
    const alvo = evento.target instanceof Element ? evento.target : null;
    if (!alvo) return;

    if (alvo.closest('.recomendado-card-ms .rec-fav-ms')) return;
    const card = alvo.closest('.recomendado-card-ms');
    if (!card) return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    tratarClique(card).catch(erro => {
      console.error('Falha ao abrir recomendado:', erro);
      aviso('Não foi possível abrir este produto. Atualize a página e tente novamente.');
    });
  }, true);
})();
