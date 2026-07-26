/* MS Matias Style - correção final dos cards recomendados
   Carregado por último para evitar conflito com versões antigas do slider. */
(function () {
  'use strict';

  function mostrarAviso(mensagem) {
    if (typeof window.avisoCarrinhoPremium === 'function') {
      window.avisoCarrinhoPremium(mensagem);
      return;
    }
    let aviso = document.getElementById('avisoRecomendadoMS');
    if (!aviso) {
      aviso = document.createElement('div');
      aviso.id = 'avisoRecomendadoMS';
      aviso.style.cssText = 'position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:999999;background:#111;color:#fff;border:1px solid #d9ad2b;border-radius:12px;padding:12px 18px;font:700 14px Arial;box-shadow:0 12px 35px rgba(0,0,0,.35)';
      document.body.appendChild(aviso);
    }
    aviso.textContent = mensagem;
    aviso.hidden = false;
    clearTimeout(aviso._timerMS);
    aviso._timerMS = setTimeout(() => { aviso.hidden = true; }, 2800);
  }

  function abrirCardRecomendado(card) {
    const id = String(card.dataset.idBanco || '').trim();
    let produtoOriginal = null;

    if (id) {
      const seletor = `.card-produto.produto-banco-ms[data-id-banco="${CSS.escape(id)}"]`;
      produtoOriginal = document.querySelector(seletor);
    }

    // Usa o card completo do catálogo. Assim cores, tamanhos, descrição,
    // estoque, fotos e preço continuam ligados ao mesmo produto do painel.
    if (produtoOriginal && typeof window.abrirProdutoDetalheCard === 'function') {
      window.msDetalheVeioSlider = false;
      window.abrirProdutoDetalheCard(produtoOriginal);
      const detalhe = document.getElementById('produtoDetalhe');
      if (detalhe) {
        detalhe.style.display = 'block';
        detalhe.classList.add('ativo');
        detalhe.scrollTo({ top: 0, behavior: 'smooth' });
      }
      return true;
    }

    // Reserva para produtos que ainda não estiverem renderizados no catálogo.
    if (typeof window.abrirRecomendadoMS === 'function') {
      window.abrirRecomendadoMS(
        card.dataset.nome || 'Produto MS',
        card.dataset.preco || '0',
        card.dataset.img || 'logo.png',
        card.dataset.fotos || card.dataset.img || 'logo.png',
        card.dataset.cor || 'unica'
      );
      return true;
    }

    return false;
  }

  document.addEventListener('click', function (evento) {
    const alvo = evento.target instanceof Element ? evento.target : null;
    if (!alvo) return;

    const favorito = alvo.closest('.recomendado-card-ms .rec-fav-ms');
    if (favorito) return; // mantém o coração funcionando normalmente

    const card = alvo.closest('.recomendado-card-ms');
    if (!card) return;

    evento.preventDefault();
    evento.stopPropagation();
    evento.stopImmediatePropagation();

    try {
      if (!abrirCardRecomendado(card)) {
        mostrarAviso('Não foi possível abrir este produto agora. Atualize a página e tente novamente.');
      }
    } catch (erro) {
      console.error('Erro ao abrir produto recomendado:', erro);
      mostrarAviso('Não foi possível abrir este produto agora.');
    }
  }, true);
})();
