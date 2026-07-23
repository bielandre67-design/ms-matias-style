(() => {
  'use strict';

  const API = (location.hostname === 'localhost' || location.hostname === '127.0.0.1')
    ? 'http://localhost:3000'
    : 'https://ms-matias-style.onrender.com';

  const normalizar = (valor) => String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();

  const numero = (valor) => {
    if (typeof valor === 'number') return Number.isFinite(valor) ? valor : 0;
    let texto = String(valor || '0').replace(/R\$/gi, '').replace(/\s/g, '');
    if (texto.includes(',')) texto = texto.replace(/\./g, '').replace(',', '.');
    else texto = texto.replace(/[^0-9.-]/g, '');
    const resultado = Number(texto);
    return Number.isFinite(resultado) ? resultado : 0;
  };

  const corPeloNome = (nome) => {
    const n = normalizar(nome).toLowerCase();
    const cores = ['preto','branco','bege','azul','rosa','cinza','vinho','bordo','marrom','vermelho','off white'];
    const achada = cores.find(cor => n.includes(cor));
    if (!achada) return 'Única';
    if (achada === 'bordo') return 'Vinho';
    return achada.replace(/\b\w/g, letra => letra.toUpperCase());
  };

  const gerarSku = (item) => {
    const nome = normalizar(item.nome).toLowerCase();
    const cor = normalizar(item.cor || corPeloNome(item.nome)).toLowerCase().replace(/\s+/g, '');
    const tamanho = normalizar(item.tamanho || 'UN').toUpperCase();
    let tipo = 'PROD';
    if (nome.includes('moletom')) tipo = 'MOL';
    else if (nome.includes('jaqueta') || nome.includes('corta vento')) tipo = 'JAQ';
    else if (nome.includes('conjunto')) tipo = 'CON';
    else if (nome.includes('oversized')) tipo = 'OVR';
    else if (nome.includes('camiseta')) tipo = 'CBA';
    else if (nome.includes('calca')) tipo = 'CAL';
    else if (nome.includes('touca')) tipo = 'TOU';
    else if (nome.includes('meia')) tipo = 'MEI';
    const mapa = {preto:'PT',preta:'PT',branco:'BR',branca:'BR',bege:'BG',azul:'AZ',rosa:'RS',cinza:'CZ',vinho:'VN',bordo:'VN',marrom:'MR',vermelho:'VM',vermelha:'VM',offwhite:'OW',unica:'UN',unico:'UN'};
    const codigoCor = mapa[cor] || cor.slice(0, 3).toUpperCase() || 'UN';
    return `MS-${tipo}-${codigoCor}-${tamanho}`.replace(/[^A-Z0-9-]/g, '');
  };

  const lerCarrinho = () => {
    try {
      const dados = JSON.parse(localStorage.getItem('carrinho') || '[]');
      return Array.isArray(dados) ? dados : [];
    } catch {
      return [];
    }
  };

  const salvarCarrinho = (itens) => {
    localStorage.setItem('carrinho', JSON.stringify(itens));
    window.carrinho = itens;
    try { carrinho = itens; } catch {}

    ['atualizarBadgeCarrinho','atualizarTudo','renderCarrinhoMobileMS','atualizarCarrinho'].forEach(nome => {
      try {
        if (typeof window[nome] === 'function') window[nome]();
      } catch (erro) {
        console.warn(`[MS] Falha ao atualizar ${nome}:`, erro);
      }
    });
  };

  const montarItem = (botao) => {
    const card = botao?.closest?.('.card-produto');
    if (!card) throw new Error('Não foi possível identificar o produto. Atualize a página e tente novamente.');

    const ativo = card.querySelector('.tamanhos button.ativo');
    const tamanho = normalizar(card.dataset.tamanho || ativo?.textContent).toUpperCase();
    if (!tamanho) throw new Error('Selecione um tamanho para adicionar este produto ao carrinho.');

    const nome = normalizar(card.dataset.nome || botao.dataset.nome || card.querySelector('h3')?.textContent || 'Produto MS');
    const preco = numero(card.dataset.preco || botao.dataset.preco || card.querySelector('.preco')?.textContent);
    const imagem = card.dataset.img || botao.dataset.img || card.querySelector('img')?.getAttribute('src') || '';
    const cor = normalizar(card.dataset.cor || corPeloNome(nome));

    if (!(preco > 0)) throw new Error('O preço deste produto está inválido. Revise o valor no painel antes de vender.');

    const item = { nome, preco, imagem, img: imagem, tamanho, cor, quantidade: 1 };
    item.sku = normalizar(card.dataset.sku || botao.dataset.sku || gerarSku(item)).toUpperCase();
    return item;
  };

  const consultarEstoque = async (item) => {
    const controlador = new AbortController();
    const limite = setTimeout(() => controlador.abort(), 9000);
    try {
      const resposta = await fetch(`${API}/estoque/disponivel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...item,
          pedidoId: localStorage.getItem('msPedidoPagamentoAtivo') || null
        }),
        signal: controlador.signal
      });
      const dados = await resposta.json().catch(() => ({}));
      if (!resposta.ok) throw new Error(dados.mensagem || `Falha ao consultar estoque (${resposta.status}).`);
      return dados;
    } catch (erro) {
      if (erro?.name === 'AbortError') {
        throw new Error('A consulta de estoque demorou demais. Tente novamente em alguns segundos.');
      }
      throw new Error(erro?.message || 'Não foi possível consultar o estoque agora.');
    } finally {
      clearTimeout(limite);
    }
  };

  const mostrarConfirmacao = (item, botao) => {
    try {
      if (typeof window.animarProdutoParaCarrinho === 'function') window.animarProdutoParaCarrinho(botao);
      if (typeof window.mostrarConfirmacaoCarrinhoMS === 'function') return window.mostrarConfirmacaoCarrinhoMS(item);
      if (typeof window.avisoCarrinhoPremium === 'function') return window.avisoCarrinhoPremium('Produto adicionado ao carrinho.');
      if (typeof window.mostrarToastMS === 'function') return window.mostrarToastMS();
    } catch (erro) {
      console.warn('[MS] O produto foi adicionado, mas a animação falhou:', erro);
    }
  };

  async function adicionarCarrinhoSeguro(botao) {
    if (!botao || botao.dataset.msProcessando === '1') return false;

    const textoOriginal = botao.innerHTML;
    botao.dataset.msProcessando = '1';
    botao.disabled = true;
    botao.setAttribute('aria-busy', 'true');

    try {
      const item = montarItem(botao);
      const estoque = await consultarEstoque(item);

      if (!estoque.cadastrado) {
        throw new Error('Esta combinação de cor e tamanho está indisponível no momento.');
      }

      const itens = lerCarrinho();
      const indice = itens.findIndex(produto =>
        normalizar(produto.sku || gerarSku(produto)).toUpperCase() === item.sku
      );
      const quantidadeAtual = indice >= 0 ? Number(itens[indice].quantidade || 1) : 0;
      const disponivel = Number(estoque.disponivel || 0);

      if (quantidadeAtual + 1 > disponivel) {
        if (disponivel - quantidadeAtual <= 0) {
          throw new Error('Você já colocou no carrinho todas as unidades disponíveis desta opção.');
        }
        throw new Error(`Temos apenas ${disponivel - quantidadeAtual} unidade(s) restante(s) desta opção.`);
      }

      if (indice >= 0) itens[indice].quantidade = quantidadeAtual + 1;
      else itens.push(item);

      salvarCarrinho(itens);
      mostrarConfirmacao(item, botao);
      return true;
    } catch (erro) {
      console.error('[MS] Falha ao adicionar ao carrinho:', erro);
      alert(erro?.message || 'Não foi possível adicionar o produto ao carrinho.');
      return false;
    } finally {
      botao.disabled = false;
      botao.removeAttribute('aria-busy');
      delete botao.dataset.msProcessando;
      if (botao.innerHTML !== textoOriginal && !botao.querySelector('.icone-btn-carrinho')) {
        botao.innerHTML = textoOriginal;
      }
    }
  }

  window.adicionarCarrinho = adicionarCarrinhoSeguro;
  window.adicionarAoCarrinho = adicionarCarrinhoSeguro;
  window.MSCarrinho = Object.freeze({ adicionar: adicionarCarrinhoSeguro, ler: lerCarrinho });

  console.info('[MS] Módulo seguro do carrinho carregado.');
})();
