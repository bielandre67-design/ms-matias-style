const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fs = require("fs");
const path = require("path");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;
const caminhoPedidos = path.join(__dirname, "pedidos.json");
const caminhoPedidosExcluidos = path.join(__dirname, "pedidos_excluidos.json");
// PostgreSQL é opcional no computador e obrigatório no Render após configurar DATABASE_URL.
// A estrutura atual da loja continua igual: os arquivos JSON funcionam como cache local,
// enquanto o PostgreSQL passa a ser a fonte permanente dos dados.
const databaseUrl = process.env.DATABASE_URL || "";
const usaSSLPostgresMS = databaseUrl && !/localhost|127\.0\.0\.1/i.test(databaseUrl);
const pool = databaseUrl
  ? new Pool({
      connectionString: databaseUrl,
      ssl: usaSSLPostgresMS ? { rejectUnauthorized: false } : false,
      connectionTimeoutMillis: 10000,
      idleTimeoutMillis: 30000,
      max: Number(process.env.PG_POOL_MAX || 5)
    })
  : null;

if (pool) {
  pool.on("error", (erro) => {
    console.error("Erro inesperado na conexão PostgreSQL:", erro.message);
  });
}

const arquivosPersistidosMS = new Map();

function chaveBancoMS(caminho) {
  return path.basename(caminho, path.extname(caminho));
}

async function salvarNoPostgresMS(caminho, dados) {
  if (!pool) return;
  const chave = chaveBancoMS(caminho);
  try {
    await pool.query(
      `INSERT INTO app_state (chave, dados, atualizado_em)
       VALUES ($1, $2::jsonb, NOW())
       ON CONFLICT (chave) DO UPDATE
       SET dados = EXCLUDED.dados, atualizado_em = NOW()`,
      [chave, JSON.stringify(dados)]
    );
  } catch (erro) {
    console.error(`Erro ao salvar ${chave} no PostgreSQL:`, erro.message);
  }
}

async function iniciarPostgresMS() {
  if (!pool) {
    console.warn("AVISO: DATABASE_URL não configurada. Usando arquivos JSON locais.");
    return;
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS app_state (
      chave VARCHAR(100) PRIMARY KEY,
      dados JSONB NOT NULL DEFAULT '[]'::jsonb,
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS produtos (
      id BIGSERIAL PRIMARY KEY,
      chave VARCHAR(180) UNIQUE NOT NULL,
      nome VARCHAR(180) NOT NULL,
      categoria VARCHAR(80) NOT NULL DEFAULT 'Roupas',
      preco NUMERIC(10,2) NOT NULL DEFAULT 0,
      preco_antigo NUMERIC(10,2),
      imagem TEXT,
      imagens JSONB NOT NULL DEFAULT '[]'::jsonb,
      descricao TEXT,
      cores JSONB NOT NULL DEFAULT '[]'::jsonb,
      tamanhos JSONB NOT NULL DEFAULT '["P","M","G","GG"]'::jsonb,
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      destaque BOOLEAN NOT NULL DEFAULT FALSE,
      promocao BOOLEAN NOT NULL DEFAULT FALSE,
      peso_kg NUMERIC(10,3) NOT NULL DEFAULT 0,
      altura_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
      largura_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
      comprimento_cm NUMERIC(10,2) NOT NULL DEFAULT 0,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS cores JSONB NOT NULL DEFAULT '[]'::jsonb`);
  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS tamanhos JSONB NOT NULL DEFAULT '["P","M","G","GG"]'::jsonb`);
  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS peso_kg NUMERIC(10,3) NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS altura_cm NUMERIC(10,2) NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS largura_cm NUMERIC(10,2) NOT NULL DEFAULT 0`);
  await pool.query(`ALTER TABLE produtos ADD COLUMN IF NOT EXISTS comprimento_cm NUMERIC(10,2) NOT NULL DEFAULT 0`);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS cupons (
      id BIGSERIAL PRIMARY KEY,
      codigo VARCHAR(40) UNIQUE NOT NULL,
      percentual NUMERIC(5,2) NOT NULL CHECK (percentual > 0 AND percentual <= 100),
      ativo BOOLEAN NOT NULL DEFAULT TRUE,
      valor_minimo NUMERIC(10,2) NOT NULL DEFAULT 0,
      limite_usos INTEGER NOT NULL DEFAULT 0,
      usos INTEGER NOT NULL DEFAULT 0,
      validade TIMESTAMPTZ,
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS estoque_variantes (
      sku VARCHAR(100) PRIMARY KEY,
      nome VARCHAR(180) NOT NULL,
      cor VARCHAR(80) NOT NULL DEFAULT 'Única',
      tamanho VARCHAR(20) NOT NULL DEFAULT 'ÚNICO',
      quantidade INTEGER NOT NULL DEFAULT 0 CHECK (quantidade >= 0),
      atualizado_em TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS reservas_estoque (
      id BIGSERIAL PRIMARY KEY,
      pedido_id VARCHAR(80) NOT NULL,
      sku VARCHAR(100) NOT NULL,
      nome VARCHAR(180) NOT NULL,
      cor VARCHAR(80) NOT NULL DEFAULT 'Única',
      tamanho VARCHAR(20) NOT NULL DEFAULT 'ÚNICO',
      quantidade INTEGER NOT NULL CHECK (quantidade > 0),
      status VARCHAR(30) NOT NULL DEFAULT 'reservado',
      criado_em TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      expira_em TIMESTAMPTZ NOT NULL
    )
  `);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reservas_estoque_sku_status ON reservas_estoque (sku, status)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_reservas_estoque_expira_em ON reservas_estoque (expira_em)`);

  for (const [caminho, padrao] of arquivosPersistidosMS.entries()) {
    const chave = chaveBancoMS(caminho);
    const resultado = await pool.query("SELECT dados FROM app_state WHERE chave = $1", [chave]);

    if (resultado.rows.length) {
      fs.writeFileSync(caminho, JSON.stringify(resultado.rows[0].dados, null, 2));
    } else {
      let dadosIniciais = padrao;
      if (fs.existsSync(caminho)) {
        try { dadosIniciais = JSON.parse(fs.readFileSync(caminho, "utf8")); } catch (_) {}
      }
      await salvarNoPostgresMS(caminho, dadosIniciais);
      fs.writeFileSync(caminho, JSON.stringify(dadosIniciais, null, 2));
    }
  }

  console.log("PostgreSQL conectado e dados sincronizados.");
}


app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

// Entrega os arquivos da loja e do painel pelo próprio Node.
// Assim, use http://localhost:3000/admin.html em vez do Live Server.
app.use(express.static(__dirname, {
  index: "index.html",
  extensions: ["html"]
}));

// Log para confirmar que o front chegou no backend
app.use((req, res, next) => {
  console.log(req.method, req.url);
  next();
});

function lerPedidos() {
  if (!fs.existsSync(caminhoPedidos)) {
    fs.writeFileSync(caminhoPedidos, "[]");
  }

  try {
    return JSON.parse(fs.readFileSync(caminhoPedidos, "utf8"));
  } catch (erro) {
    console.error("Erro ao ler pedidos.json:", erro);
    return [];
  }
}

function salvarPedidos(pedidos) {
  salvarJSON(caminhoPedidos, pedidos);
}

function lerPedidosExcluidos() {
  if (!fs.existsSync(caminhoPedidosExcluidos)) {
    fs.writeFileSync(caminhoPedidosExcluidos, "[]");
  }
  try {
    return JSON.parse(fs.readFileSync(caminhoPedidosExcluidos, "utf8"));
  } catch (erro) {
    console.error("Erro ao ler pedidos_excluidos.json:", erro);
    return [];
  }
}

function salvarPedidosExcluidos(pedidos) {
  salvarJSON(caminhoPedidosExcluidos, pedidos);
}

const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN || "";

function garantirMercadoPagoConfigurado() {
  if (!accessToken) {
    const erro = new Error("MERCADO_PAGO_ACCESS_TOKEN não está configurado no .env/Render.");
    erro.statusCode = 500;
    throw erro;
  }
}

const client = new MercadoPagoConfig({ accessToken });

function montarItensMercadoPago(carrinhoItems, valorFrete, freteSelecionado, percentualDesconto = 0) {
  const items = carrinhoItems
    .map((item) => {
      const preco = Number(item.preco);
      const quantidade = Number(item.quantidade) || 1;

      if (!preco || preco <= 0) return null;

      return {
        title: `${item.nome || "Produto"} - Tamanho ${item.tamanho || "-"}`,
        quantity: quantidade,
        unit_price: Math.max(0.01, preco * (1 - Number(percentualDesconto || 0) / 100)),
        currency_id: "BRL"
      };
    })
    .filter(Boolean);

  // Mercado Pago pode recusar item com valor 0. Só adiciona frete quando for maior que zero.
  if (Number(valorFrete) > 0) {
    items.push({
      title: freteSelecionado?.nome ? `Frete - ${freteSelecionado.nome}` : "Frete",
      quantity: 1,
      unit_price: Number(valorFrete),
      currency_id: "BRL"
    });
  }

  return items;
}

async function criarPreferenciaMP({ carrinhoItems, valorFrete, freteSelecionado, idPedido, percentualDesconto = 0 }) {
  garantirMercadoPagoConfigurado();
  const items = montarItensMercadoPago(carrinhoItems, valorFrete, freteSelecionado, percentualDesconto);

  if (!items.length) {
    const erro = new Error("Carrinho vazio ou produtos sem preço válido.");
    erro.statusCode = 400;
    throw erro;
  }

  console.log("ITENS ENVIADOS AO MERCADO PAGO:", items);

  const preference = new Preference(client);

  const frontendUrl = (process.env.FRONTEND_URL || "https://ms-matias-style.vercel.app").replace(/\/$/, "");
  const backendUrl = (process.env.BACKEND_URL || "https://ms-matias-style.onrender.com").replace(/\/$/, "");

  const bodyPreferencia = {
    external_reference: String(idPedido),
    items,
    back_urls: {
      success: `${frontendUrl}/carrinho.html?resultado=aprovado&pedido=${encodeURIComponent(idPedido)}`,
      failure: `${frontendUrl}/carrinho.html?resultado=recusado&pedido=${encodeURIComponent(idPedido)}`,
      pending: `${frontendUrl}/carrinho.html?resultado=pendente&pedido=${encodeURIComponent(idPedido)}`
    },
    // Este checkout é somente para cartão e outras opções.
    // O PIX é gerado dentro da loja pelo endpoint /criar-pagamento-pix.
    payment_methods: {
      excluded_payment_methods: [],
      excluded_payment_types: [{ id: "bank_transfer" }],
      installments: 12
    },
    auto_return: "approved"
  };

  if (backendUrl) bodyPreferencia.notification_url = `${backendUrl}/webhook`;

  const resposta = await preference.create({ body: bodyPreferencia });

  console.log("RESPOSTA MERCADO PAGO:", resposta);

  const linkPagamento = resposta.init_point || resposta.sandbox_init_point;

  if (!linkPagamento) {
    const erro = new Error("Mercado Pago não retornou init_point.");
    erro.respostaMercadoPago = resposta;
    throw erro;
  }

  console.log("LINK MERCADO PAGO:", linkPagamento);

  return {
    id: resposta.id,
    init_point: linkPagamento
  };
}

function normalizarNomeProdutoFreteMS(valor) {
  return String(valor || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .trim().toLowerCase();
}

async function buscarProdutoFreteBancoMS(item) {
  if (!pool) return null;

  const id = Number(item?.id || item?.produtoId || item?.idBanco || 0);
  const chave = String(item?.chave || item?.produtoChave || "").trim();
  const nome = String(item?.nome || item?.name || "").trim();

  if (Number.isInteger(id) && id > 0) {
    const r = await pool.query("SELECT * FROM produtos WHERE id=$1 LIMIT 1", [id]);
    if (r.rowCount) return r.rows[0];
  }

  if (chave) {
    const r = await pool.query("SELECT * FROM produtos WHERE chave=$1 LIMIT 1", [chaveProdutoMS(chave)]);
    if (r.rowCount) return r.rows[0];
  }

  if (nome) {
    const r = await pool.query(
      "SELECT * FROM produtos WHERE LOWER(TRIM(nome))=LOWER(TRIM($1)) ORDER BY ativo DESC, id DESC LIMIT 1",
      [nome]
    );
    if (r.rowCount) return r.rows[0];
  }

  return null;
}

async function produtoFreteMS(item, indice) {
  const quantidade = Math.max(1, Math.floor(Number(item?.quantidade || item?.quantity || 1)));
  const preco = Math.max(1, Number(item?.preco || item?.price || 0));
  const produtoBanco = await buscarProdutoFreteBancoMS(item);
  const nome = String(produtoBanco?.nome || item?.nome || item?.name || `Produto ${indice + 1}`).trim();

  if (!produtoBanco) {
    const erro = new Error(`O produto "${nome}" não foi encontrado no painel. Atualize o catálogo antes de calcular o frete.`);
    erro.statusCode = 400;
    erro.codigo = "PRODUTO_NAO_ENCONTRADO";
    throw erro;
  }

  const weight = Number(produtoBanco.peso_kg || 0);
  const height = Number(produtoBanco.altura_cm || 0);
  const width = Number(produtoBanco.largura_cm || 0);
  const length = Number(produtoBanco.comprimento_cm || 0);

  if (!(weight > 0 && height > 0 && width > 0 && length > 0)) {
    const erro = new Error(`Cadastre peso, altura, largura e comprimento de "${nome}" no painel antes de calcular o frete.`);
    erro.statusCode = 400;
    erro.codigo = "MEDIDAS_FRETE_PENDENTES";
    erro.produto = { id: produtoBanco.id, nome };
    throw erro;
  }

  return {
    id: String(produtoBanco.id),
    width,
    height,
    length,
    weight,
    insurance_value: preco,
    quantity: quantidade
  };
}

app.post("/calcular-frete", async (req, res) => {
  try {
    const cep = apenasNumerosMS(req.body?.cep);
    const cepOrigem = apenasNumerosMS(process.env.CEP_ORIGEM || "90640130");
    const itensRecebidos = Array.isArray(req.body?.items) ? req.body.items : [];

    if (cep.length !== 8) {
      return res.status(400).json({ erro: true, mensagem: "Informe um CEP válido com 8 números." });
    }
    if (cepOrigem.length !== 8) {
      return res.status(500).json({ erro: true, mensagem: "CEP_ORIGEM não está configurado corretamente." });
    }
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return res.status(500).json({ erro: true, mensagem: "MELHOR_ENVIO_TOKEN não está configurado." });
    }

    if (!itensRecebidos.length) {
      return res.status(400).json({ erro: true, mensagem: "O carrinho está vazio." });
    }

    const products = await Promise.all(itensRecebidos.map(produtoFreteMS));

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        Accept: "application/json",
        "User-Agent": "MS Matias Style (bielandre67@gmail.com)"
      },
      body: JSON.stringify({
        from: { postal_code: cepOrigem },
        to: { postal_code: cep },
        products
      })
    });

    const data = await response.json();
    console.log("COTAÇÃO MELHOR ENVIO:", { cepOrigem, cepDestino: cep, products, status: response.status });

    if (!response.ok) {
      return res.status(response.status).json({
        erro: true,
        mensagem: data?.message || "O Melhor Envio recusou o cálculo do frete.",
        detalhes: data
      });
    }

    res.set("Cache-Control", "no-store");
    return res.json(data);
  } catch (error) {
    console.error("ERRO FRETE:", error);
    return res.status(error.statusCode || 500).json({
      erro: true,
      codigo: error.codigo || "ERRO_CALCULO_FRETE",
      mensagem: error.message || "Erro ao calcular frete.",
      produto: error.produto || null
    });
  }
});


// ===============================
// ESTOQUE ONLINE REAL - MS
// Controle no servidor para cliente não comprar acima do disponível
// ===============================
const caminhoEstoque = path.join(__dirname, "estoque.json");
const caminhoReservas = path.join(__dirname, "reservas_estoque.json");

function garantirArquivoJSON(caminho, padrao) {
  arquivosPersistidosMS.set(caminho, padrao);
  if (!fs.existsSync(caminho)) {
    fs.writeFileSync(caminho, JSON.stringify(padrao, null, 2));
  }
}

function lerJSON(caminho, padrao) {
  garantirArquivoJSON(caminho, padrao);
  try {
    return JSON.parse(fs.readFileSync(caminho, "utf8"));
  } catch (erro) {
    console.error("Erro ao ler JSON:", caminho, erro);
    return padrao;
  }
}

function salvarJSON(caminho, dados) {
  fs.writeFileSync(caminho, JSON.stringify(dados, null, 2));
  void salvarNoPostgresMS(caminho, dados);
}

async function sincronizarTabelaEstoqueMS(lista) {
  if (!pool) return;
  const clientDB = await pool.connect();
  try {
    await clientDB.query("BEGIN");
    for (const item of Array.isArray(lista) ? lista : []) {
      const pronto = prepararItemEstoqueMS(item);
      await clientDB.query(
        `INSERT INTO estoque_variantes (sku, nome, cor, tamanho, quantidade, atualizado_em)
         VALUES ($1,$2,$3,$4,$5,NOW())
         ON CONFLICT (sku) DO UPDATE SET
           nome=EXCLUDED.nome, cor=EXCLUDED.cor, tamanho=EXCLUDED.tamanho,
           quantidade=EXCLUDED.quantidade, atualizado_em=NOW()`,
        [pronto.sku, pronto.nome, pronto.cor, pronto.tamanho, Math.max(0, Number(item.quantidade || 0))]
      );
    }
    const skus = (Array.isArray(lista) ? lista : []).map(item => prepararItemEstoqueMS(item).sku);
    if (skus.length) await clientDB.query("DELETE FROM estoque_variantes WHERE NOT (sku = ANY($1::text[]))", [skus]);
    else await clientDB.query("DELETE FROM estoque_variantes");
    await clientDB.query("COMMIT");
  } catch (erro) {
    await clientDB.query("ROLLBACK");
    console.error("Erro ao sincronizar tabela de estoque:", erro.message);
  } finally {
    clientDB.release();
  }
}

async function carregarEstoqueDaTabelaMS() {
  if (!pool) return;
  const resultado = await pool.query(
    `SELECT sku, nome, cor, tamanho, quantidade, atualizado_em AS "atualizadoEm"
     FROM estoque_variantes ORDER BY nome, cor, tamanho`
  );
  if (resultado.rows.length) {
    fs.writeFileSync(caminhoEstoque, JSON.stringify(resultado.rows, null, 2));
    await salvarNoPostgresMS(caminhoEstoque, resultado.rows);
    return;
  }
  const local = lerEstoqueMS();
  if (local.length) await sincronizarTabelaEstoqueMS(local);
}

function normalizarTextoMS(valor) {
  return String(valor || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase();
}

function corPeloNomeMS(nome) {
  const n = normalizarTextoMS(nome);
  if (n.includes("preto") || n.includes("preta")) return "Preto";
  if (n.includes("off white") || n.includes("offwhite")) return "Off White";
  if (n.includes("branco") || n.includes("branca")) return "Branco";
  if (n.includes("bege")) return "Bege";
  if (n.includes("azul")) return "Azul";
  if (n.includes("rosa")) return "Rosa";
  if (n.includes("cinza")) return "Cinza";
  if (n.includes("vinho") || n.includes("bordo")) return "Vinho";
  if (n.includes("marrom")) return "Marrom";
  if (n.includes("vermelho") || n.includes("vermelha")) return "Vermelho";
  return "Única";
}


function gerarSkuEstoqueMS(item) {
  const base = normalizarTextoMS(item?.nome || item?.produto || "produto");
  const cor = normalizarTextoMS(item?.cor || item?.Cor || corPeloNomeMS(item?.nome || item?.produto || ""));
  const tam = normalizarTextoMS(item?.tamanho || item?.Tamanho || "unico").toUpperCase();

  let tipo = "PROD";
  if (base.includes("moletom")) tipo = "MOL";
  else if (base.includes("jaqueta") || base.includes("corta vento")) tipo = "JAQ";
  else if (base.includes("conjunto")) tipo = "CON";
  else if (base.includes("camiseta") && base.includes("oversized")) tipo = "OVR";
  else if (base.includes("camiseta")) tipo = "CBA";
  else if (base.includes("calca") || base.includes("calça")) tipo = "CAL";
  else if (base.includes("touca")) tipo = "TOU";
  else if (base.includes("meia")) tipo = "MEI";

  const cores = {
    preto:"PT", preta:"PT", branco:"BR", branca:"BR", bege:"BG", azul:"AZ",
    rosa:"RS", cinza:"CZ", vinho:"VN", bordo:"VN", marrom:"MR", vermelho:"VM", vermelha:"VM", offwhite:"OW", unica:"UN", unico:"UN"
  };
  const corCodigo = cores[cor.replace(/\s+/g, "")] || cor.slice(0,3).toUpperCase() || "UN";
  return `MS-${tipo}-${corCodigo}-${tam || "UN"}`.replace(/[^A-Z0-9-]/g, "");
}

function prepararItemEstoqueMS(item) {
  const pronto = {
    nome: String(item?.nome || item?.produto || "Produto MS").trim(),
    cor: String(item?.cor || item?.Cor || corPeloNomeMS(item?.nome || item?.produto || "")).trim(),
    tamanho: String(item?.tamanho || item?.Tamanho || "Único").trim().toUpperCase(),
    quantidade: Math.max(1, Number(item?.quantidade || 1))
  };
  pronto.sku = String(item?.sku || item?.SKU || gerarSkuEstoqueMS(pronto)).trim().toUpperCase();
  return pronto;
}

function chaveEstoqueMS(item) {
  const it = prepararItemEstoqueMS(item);
  return String(it.sku || gerarSkuEstoqueMS(it)).trim().toUpperCase();
}

function lerEstoqueMS() {
  const lista = lerJSON(caminhoEstoque, []);
  return Array.isArray(lista) ? lista : [];
}

function salvarEstoqueMS(lista) {
  const dados = Array.isArray(lista) ? lista : [];
  salvarJSON(caminhoEstoque, dados);
  void sincronizarTabelaEstoqueMS(dados);
}

function limparReservasVencidasMS() {
  const agora = Date.now();
  const reservas = lerJSON(caminhoReservas, []);
  const ativas = Array.isArray(reservas)
    ? reservas.filter(r => Number(r.expiraEm || 0) > agora && r.status === "reservado")
    : [];
  salvarJSON(caminhoReservas, ativas);
  return ativas;
}

function quantidadeReservadaMS(chave, ignorarPedidoId = null) {
  const reservas = limparReservasVencidasMS();
  return reservas.reduce((total, r) => {
    if (String(r.chave) !== String(chave)) return total;
    if (ignorarPedidoId && String(r.pedidoId) === String(ignorarPedidoId)) return total;
    return total + Number(r.quantidade || 0);
  }, 0);
}

function buscarRegistroEstoqueMS(item) {
  const chave = chaveEstoqueMS(item);
  const estoque = lerEstoqueMS();
  return estoque.find(e => chaveEstoqueMS(e) === chave) || null;
}

function disponivelMS(item, ignorarPedidoId = null) {
  const registro = buscarRegistroEstoqueMS(item);
  if (!registro) {
    return { cadastrado: false, estoque: 0, reservado: 0, disponivel: 0 };
  }
  const estoque = Math.max(0, Number(registro.quantidade || 0));
  const reservado = quantidadeReservadaMS(chaveEstoqueMS(item), ignorarPedidoId);
  return {
    cadastrado: true,
    estoque,
    reservado,
    disponivel: Math.max(0, estoque - reservado)
  };
}

function validarCarrinhoEstoqueMS(items, ignorarPedidoId = null) {
  const agrupado = new Map();

  (items || []).forEach(item => {
    const pronto = prepararItemEstoqueMS(item);
    const chave = chaveEstoqueMS(pronto);
    const atual = agrupado.get(chave) || { ...pronto, quantidade: 0 };
    atual.quantidade += pronto.quantidade;
    agrupado.set(chave, atual);
  });

  for (const item of agrupado.values()) {
    const info = disponivelMS(item, ignorarPedidoId);

    if (!info.cadastrado) {
      return {
        ok: false,
        mensagem: `${item.nome} / ${item.cor} / ${item.tamanho} ainda não tem estoque cadastrado no painel admin.`
      };
    }

    if (item.quantidade > info.disponivel) {
      return {
        ok: false,
        mensagem: `Estoque insuficiente para ${item.nome} / ${item.cor} / ${item.tamanho}. Disponível: ${info.disponivel}. No carrinho: ${item.quantidade}.`
      };
    }
  }

  return { ok: true };
}

function reservarEstoquePedidoMS(items, pedidoId) {
  limparReservasVencidasMS();
  const reservas = lerJSON(caminhoReservas, []);
  const expiraEm = Date.now() + 20 * 60 * 1000; // 20 minutos
  const agrupado = new Map();

  (items || []).forEach(item => {
    const pronto = prepararItemEstoqueMS(item);
    const chave = chaveEstoqueMS(pronto);
    const atual = agrupado.get(chave) || { ...pronto, quantidade: 0 };
    atual.quantidade += pronto.quantidade;
    agrupado.set(chave, atual);
  });

  for (const item of agrupado.values()) {
    reservas.push({
      pedidoId,
      chave: chaveEstoqueMS(item),
      sku: item.sku,
      nome: item.nome,
      cor: item.cor,
      tamanho: item.tamanho,
      quantidade: item.quantidade,
      criadoEm: Date.now(),
      expiraEm,
      status: "reservado"
    });
  }

  salvarJSON(caminhoReservas, reservas);
}

function liberarReservaPedidoMS(pedidoId) {
  const reservas = lerJSON(caminhoReservas, []);
  const filtradas = Array.isArray(reservas)
    ? reservas.filter(r => String(r.pedidoId) !== String(pedidoId))
    : [];
  salvarJSON(caminhoReservas, filtradas);
}

function baixarEstoquePedidoMS(pedido) {
  if (!pedido || pedido.estoqueBaixado) return;

  const validacao = validarCarrinhoEstoqueMS(pedido.produtos || [], pedido.id);
  if (!validacao.ok) {
    console.error("Não foi possível baixar estoque:", validacao.mensagem);
    return;
  }

  const estoque = lerEstoqueMS();
  const agrupado = new Map();

  (pedido.produtos || []).forEach(item => {
    const pronto = prepararItemEstoqueMS(item);
    const chave = chaveEstoqueMS(pronto);
    agrupado.set(chave, (agrupado.get(chave) || 0) + pronto.quantidade);
  });

  for (const [chave, qtd] of agrupado.entries()) {
    const idx = estoque.findIndex(e => chaveEstoqueMS(e) === chave);
    if (idx >= 0) {
      estoque[idx].quantidade = Math.max(0, Number(estoque[idx].quantidade || 0) - Number(qtd || 0));
      estoque[idx].atualizadoEm = new Date().toISOString();
    }
  }

  salvarEstoqueMS(estoque);
  liberarReservaPedidoMS(pedido.id);
  pedido.estoqueBaixado = true;
}

app.get("/estoque", (req, res) => {
  limparReservasVencidasMS();
  const estoque = lerEstoqueMS().map(item => {
    const pronto = prepararItemEstoqueMS(item);
    const info = disponivelMS(pronto);
    return {
      ...item,
      sku: pronto.sku,
      nome: pronto.nome,
      cor: pronto.cor,
      tamanho: pronto.tamanho,
      quantidade: Math.max(0, Number(item.quantidade || 0)),
      reservado: info.reservado,
      disponivel: info.disponivel
    };
  });
  res.json(estoque);
});

app.post("/estoque", (req, res) => {
  const item = prepararItemEstoqueMS(req.body || {});
  const quantidade = Math.max(0, Number(req.body?.quantidade || 0));
  const estoque = lerEstoqueMS();
  const chave = chaveEstoqueMS(item);
  const idx = estoque.findIndex(e => chaveEstoqueMS(e) === chave);

  const registro = {
    sku: item.sku,
    nome: item.nome,
    cor: item.cor,
    tamanho: item.tamanho,
    quantidade,
    atualizadoEm: new Date().toISOString()
  };

  if (idx >= 0) estoque[idx] = { ...estoque[idx], ...registro };
  else estoque.push(registro);

  salvarEstoqueMS(estoque);
  res.json({ sucesso: true, item: registro });
});

app.delete("/estoque", (req, res) => {
  const item = prepararItemEstoqueMS(req.body || {});
  const chave = chaveEstoqueMS(item);
  const estoque = lerEstoqueMS().filter(e => chaveEstoqueMS(e) !== chave);
  salvarEstoqueMS(estoque);
  res.json({ sucesso: true });
});

app.post("/estoque/disponivel", (req, res) => {
  const item = prepararItemEstoqueMS(req.body || {});
  const info = disponivelMS(item);
  res.json({ ...info, ...item });
});

app.post("/estoque/validar-carrinho", (req, res) => {
  const items = req.body?.items || [];
  const validacao = validarCarrinhoEstoqueMS(items);
  if (!validacao.ok) return res.status(400).json({ erro: true, mensagem: validacao.mensagem });
  res.json({ sucesso: true });
});


app.get("/pedidos", (req, res) => {
  const pedidos = lerPedidos();
  res.json(pedidos);
});

function idsIguaisMS(a, b) {
  return String(a) === String(b) || Number(a) === Number(b);
}

function excluirPedidoPorIdMS(id) {
  const pedidos = lerPedidos();
  const pedido = pedidos.find((p) => idsIguaisMS(p.id, id));
  if (!pedido) return { sucesso: false, mensagem: "Pedido não encontrado" };

  const excluidos = lerPedidosExcluidos();
  const pedidoExcluido = {
    ...pedido,
    excluidoEm: new Date().toLocaleString("pt-BR"),
    excluidoTimestamp: new Date().toISOString()
  };

  const semDuplicado = excluidos.filter((p) => !idsIguaisMS(p.id, id));
  semDuplicado.push(pedidoExcluido);
  salvarPedidosExcluidos(semDuplicado);

  const filtrados = pedidos.filter((p) => !idsIguaisMS(p.id, id));
  liberarReservaPedidoMS(id);
  salvarPedidos(filtrados);
  return { sucesso: true, id, movidoParaLixeira: true };
}

app.delete("/pedidos/:id", (req, res) => {
  const resultado = excluirPedidoPorIdMS(req.params.id);
  if (!resultado.sucesso) return res.status(404).json({ erro: true, mensagem: resultado.mensagem });
  res.json(resultado);
});

app.post("/excluir-pedido", (req, res) => {
  const resultado = excluirPedidoPorIdMS(req.body.id);
  if (!resultado.sucesso) return res.status(404).json({ erro: true, mensagem: resultado.mensagem });
  res.json(resultado);
});


app.get("/pedidos-excluidos", (req, res) => {
  res.json(lerPedidosExcluidos());
});

app.post("/pedidos/:id/restaurar", (req, res) => {
  const id = req.params.id;
  const excluidos = lerPedidosExcluidos();
  const pedido = excluidos.find((p) => idsIguaisMS(p.id, id));
  if (!pedido) return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado na lixeira" });

  const pedidos = lerPedidos();
  const restaurado = { ...pedido };
  delete restaurado.excluidoEm;
  delete restaurado.excluidoTimestamp;

  const pedidosSemDuplicado = pedidos.filter((p) => !idsIguaisMS(p.id, id));
  pedidosSemDuplicado.push(restaurado);
  salvarPedidos(pedidosSemDuplicado);
  salvarPedidosExcluidos(excluidos.filter((p) => !idsIguaisMS(p.id, id)));

  res.json({ sucesso: true, pedido: restaurado });
});

app.delete("/pedidos-excluidos/:id", (req, res) => {
  const id = req.params.id;
  const excluidos = lerPedidosExcluidos();
  const existe = excluidos.some((p) => idsIguaisMS(p.id, id));
  if (!existe) return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado na lixeira" });
  salvarPedidosExcluidos(excluidos.filter((p) => !idsIguaisMS(p.id, id)));
  res.json({ sucesso: true, id });
});

app.post("/pedidos/:id/status", (req, res) => {
  const id = String(req.params.id);
  const status = String(req.body?.status || "pendente").toLowerCase();
  const pedidos = lerPedidos();
  const pedido = pedidos.find((p) => String(p.id) === id);

  if (!pedido) {
    return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado" });
  }

  pedido.status = status;
  if (status === "pago") baixarEstoquePedidoMS(pedido);
  if (["cancelado", "cancelada", "recusado", "recusada"].includes(status)) liberarReservaPedidoMS(pedido.id);
  salvarPedidos(pedidos);

  res.json({ sucesso: true, pedido });
});



// ===============================
// RASTREIO E MELHOR ENVIO - MS
// Fluxo profissional:
// 1) cria etiqueta no carrinho (/me/cart)
// 2) compra a etiqueta usando saldo da Melhor Carteira (/shipment/checkout)
// 3) gera/libera a etiqueta (/shipment/generate)
// 4) busca link de impressão (/shipment/print)
// 5) consulta rastreio/status (/shipment/tracking)
// ===============================
function atualizarPedidoPorIdMS(id, alterador) {
  const pedidos = lerPedidos();
  const pedido = pedidos.find((p) => idsIguaisMS(p.id, id));
  if (!pedido) return { sucesso: false, mensagem: "Pedido não encontrado" };
  alterador(pedido, pedidos);
  salvarPedidos(pedidos);
  return { sucesso: true, pedido };
}

function apenasNumerosMS(valor) {
  return String(valor || "").replace(/\D/g, "");
}

function valorPrimeiroMS(...valores) {
  for (const valor of valores) {
    if (valor !== undefined && valor !== null && String(valor).trim() !== "") return valor;
  }
  return "";
}

function headersMelhorEnvioMS() {
  return {
    "Content-Type": "application/json",
    Accept: "application/json",
    Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
    "User-Agent": process.env.MELHOR_ENVIO_USER_AGENT || "MS Matias Style (bielandre67@gmail.com)"
  };
}

function melhorEnvioBaseURLMS() {
  const base = process.env.MELHOR_ENVIO_BASE_URL || "https://www.melhorenvio.com.br";
  return base.replace(/\/$/, "");
}

async function chamarMelhorEnvioMS(endpoint, body) {
  const url = `${melhorEnvioBaseURLMS()}${endpoint}`;
  const response = await fetch(url, {
    method: "POST",
    headers: headersMelhorEnvioMS(),
    body: JSON.stringify(body || {})
  });

  const texto = await response.text();
  let data;
  try { data = texto ? JSON.parse(texto) : {}; }
  catch { data = { raw: texto }; }

  if (!response.ok) {
    const erro = new Error(data?.message || data?.mensagem || `Melhor Envio respondeu ${response.status}`);
    erro.status = response.status;
    erro.endpoint = endpoint;
    erro.data = data;
    throw erro;
  }
  return data;
}

function limparObjetoVazioMS(obj) {
  const novo = {};
  Object.entries(obj || {}).forEach(([chave, valor]) => {
    if (valor === undefined || valor === null) return;
    if (typeof valor === "string" && valor.trim() === "") return;
    novo[chave] = valor;
  });
  return novo;
}

function origemMS() {
  const origem = {
    name: process.env.MS_ORIGEM_NOME || "MS Matias Style",
    phone: apenasNumerosMS(process.env.MS_ORIGEM_TELEFONE || "51993446569"),
    email: process.env.MS_ORIGEM_EMAIL || "bielandre67@gmail.com",
    document: apenasNumerosMS(process.env.MS_ORIGEM_DOCUMENTO || ""),
    company_document: apenasNumerosMS(process.env.MS_ORIGEM_CNPJ || ""),
    state_register: process.env.MS_ORIGEM_IE || "ISENTO",
    address: process.env.MS_ORIGEM_RUA || "Rua Livramento",
    number: process.env.MS_ORIGEM_NUMERO || "841",
    complement: process.env.MS_ORIGEM_COMPLEMENTO || "",
    district: process.env.MS_ORIGEM_BAIRRO || "Santana",
    city: process.env.MS_ORIGEM_CIDADE || "Porto Alegre",
    state_abbr: process.env.MS_ORIGEM_ESTADO || "RS",
    country_id: "BR",
    postal_code: apenasNumerosMS(process.env.MS_ORIGEM_CEP || "90640130")
  };

  // O Melhor Envio aceita CPF ou CNPJ. Não mande ambos vazios.
  if (!origem.document) delete origem.document;
  if (!origem.company_document) delete origem.company_document;
  if (!origem.company_document && origem.state_register === "ISENTO") delete origem.state_register;
  return limparObjetoVazioMS(origem);
}

function enderecoPedidoMS(pedido) {
  return pedido.endereco || {};
}

function destinoMelhorEnvioMS(pedido) {
  const end = enderecoPedidoMS(pedido);
  const destino = {
    name: valorPrimeiroMS(pedido.nome, pedido.cliente?.nome, "Cliente MS"),
    phone: apenasNumerosMS(valorPrimeiroMS(pedido.telefone, pedido.whatsapp, pedido.cliente?.telefone)),
    email: valorPrimeiroMS(pedido.email, pedido.cliente?.email, process.env.MS_EMAIL_FALLBACK, "bielandre67@gmail.com"),
    document: apenasNumerosMS(valorPrimeiroMS(pedido.documento, pedido.cpf, pedido.cliente?.cpf)),
    address: valorPrimeiroMS(pedido.rua, end.rua, end.endereco),
    number: String(valorPrimeiroMS(pedido.numero, end.numero, "S/N")),
    complement: valorPrimeiroMS(pedido.complemento, end.complemento),
    district: valorPrimeiroMS(pedido.bairro, end.bairro),
    city: valorPrimeiroMS(pedido.cidade, end.cidade),
    state_abbr: valorPrimeiroMS(pedido.estado, end.estado, "RS"),
    country_id: "BR",
    postal_code: apenasNumerosMS(valorPrimeiroMS(pedido.cep, end.cep))
  };
  if (!destino.document) delete destino.document;
  return limparObjetoVazioMS(destino);
}

function detectarServicoMelhorEnvioMS(frete) {
  const id = valorPrimeiroMS(frete?.id, frete?.service_id, frete?.service, frete?.codigo, frete?.company?.id);
  if (id && !Number.isNaN(Number(id))) return Number(id);

  const nome = String(valorPrimeiroMS(frete?.nome, frete?.name, frete?.servico)).toLowerCase();
  if (nome.includes("sedex")) return 2;
  if (nome.includes("pac")) return 1;
  if (nome.includes("jadlog") || nome.includes(".com") || nome.includes("package")) return 3;
  return null;
}

function produtosDoPedidoServerMS(pedido) {
  let produtos = pedido.produtos || pedido.items || pedido.carrinho || [];
  if (typeof produtos === "string") {
    try { produtos = JSON.parse(produtos); } catch { produtos = []; }
  }
  return Array.isArray(produtos) ? produtos : [];
}

function produtosMelhorEnvioMS(pedido) {
  const produtos = produtosDoPedidoServerMS(pedido);
  return produtos.map((item, index) => {
    const qtd = Math.max(1, Number(item.quantidade || item.qtd || item.quantity || 1));
    const valor = Math.max(1, Number(item.preco || item.price || item.valor || 1));
    return {
      id: String(item.id || index + 1),
      name: String(item.nome || item.title || "Produto MS").slice(0, 120),
      quantity: qtd,
      unitary_value: Number(valor.toFixed(2))
    };
  });
}

function pacotePadraoMelhorEnvioMS(pedido) {
  const qtd = produtosDoPedidoServerMS(pedido).reduce((s, item) => s + Math.max(1, Number(item.quantidade || item.qtd || item.quantity || 1)), 0) || 1;
  return [{
    height: Number(process.env.MS_PACOTE_ALTURA || 8),
    width: Number(process.env.MS_PACOTE_LARGURA || 25),
    length: Number(process.env.MS_PACOTE_COMPRIMENTO || 30),
    weight: Number(Math.max(0.3, Number(process.env.MS_PACOTE_PESO || 0.45) * qtd).toFixed(2))
  }];
}

function totalProdutosPedidoMS(pedido) {
  return produtosDoPedidoServerMS(pedido).reduce((s, item) => {
    const qtd = Math.max(1, Number(item.quantidade || item.qtd || item.quantity || 1));
    const valor = Math.max(0, Number(item.preco || item.price || item.valor || 0));
    return s + qtd * valor;
  }, 0);
}

function montarBodyCarrinhoMelhorEnvioMS(pedido) {
  const service = detectarServicoMelhorEnvioMS(pedido.frete || pedido.freteSelecionado || {});
  if (!service) {
    const erro = new Error("Não encontrei o código do serviço do Melhor Envio no pedido. Em pedidos novos, salve o ID do frete escolhido.");
    erro.status = 400;
    throw erro;
  }

  const produtos = produtosMelhorEnvioMS(pedido);
  if (!produtos.length) {
    const erro = new Error("Pedido sem produtos para gerar etiqueta.");
    erro.status = 400;
    throw erro;
  }

  const origem = origemMS();
  const destino = destinoMelhorEnvioMS(pedido);
  if (!destino.postal_code || !destino.address || !destino.city) {
    const erro = new Error("Pedido sem endereço completo. Confira rua, cidade e CEP.");
    erro.status = 400;
    throw erro;
  }

  const seguro = totalProdutosPedidoMS(pedido) || Number(pedido.total || 1);
  return {
    service,
    from: origem,
    to: destino,
    products: produtos,
    volumes: pacotePadraoMelhorEnvioMS(pedido),
    options: {
      insurance_value: Number(Math.max(1, seguro).toFixed(2)),
      receipt: false,
      own_hand: false,
      reverse: false,
      non_commercial: true,
      platform: "MS Matias Style"
    }
  };
}

function extrairOrderIdMelhorEnvioMS(retornoCarrinho) {
  if (!retornoCarrinho) return "";
  if (typeof retornoCarrinho === "string") return retornoCarrinho;
  if (retornoCarrinho.id) return String(retornoCarrinho.id);
  if (retornoCarrinho.order_id) return String(retornoCarrinho.order_id);
  if (retornoCarrinho.protocol) return String(retornoCarrinho.protocol);
  if (Array.isArray(retornoCarrinho) && retornoCarrinho[0]) return extrairOrderIdMelhorEnvioMS(retornoCarrinho[0]);
  if (retornoCarrinho.data) return extrairOrderIdMelhorEnvioMS(retornoCarrinho.data);
  return "";
}

function extrairPrimeiroValorProfundoMS(obj, chaves) {
  const fila = [obj];
  while (fila.length) {
    const atual = fila.shift();
    if (!atual || typeof atual !== "object") continue;
    for (const chave of chaves) {
      if (atual[chave] !== undefined && atual[chave] !== null && String(atual[chave]).trim() !== "") return atual[chave];
    }
    Object.values(atual).forEach((v) => {
      if (v && typeof v === "object") fila.push(v);
    });
  }
  return "";
}

function aplicarRetornoMelhorEnvioNoPedidoMS(pedido, etapa, retorno) {
  pedido.melhorEnvio = pedido.melhorEnvio || {};
  pedido.melhorEnvio[etapa] = retorno;
  pedido.melhorEnvio.atualizadoEm = new Date().toISOString();

  const orderId = pedido.melhorEnvio.orderId || extrairOrderIdMelhorEnvioMS(retorno);
  if (orderId) {
    pedido.melhorEnvio.orderId = orderId;
    pedido.melhorEnvio.cartId = pedido.melhorEnvio.cartId || orderId;
  }

  const tracking = extrairPrimeiroValorProfundoMS(retorno, ["tracking", "tracking_code", "codigo_rastreio", "code"]);
  if (tracking && String(tracking).length >= 5) pedido.codigoRastreio = String(tracking);

  const printUrl = extrairPrimeiroValorProfundoMS(retorno, ["url", "link", "print_url", "pdf", "file"]);
  if (printUrl && String(printUrl).startsWith("http")) {
    pedido.linkEtiqueta = String(printUrl);
    pedido.melhorEnvio.printUrl = String(printUrl);
  }

  const protocolo = extrairPrimeiroValorProfundoMS(retorno, ["protocol", "authorization_code", "id"]);
  if (protocolo) pedido.melhorEnvio.protocolo = String(protocolo);
}

app.post("/pedidos/:id/rastreio", (req, res) => {
  const { codigo, transportadora, link, enviarWhatsApp } = req.body || {};
  if (!codigo || !String(codigo).trim()) {
    return res.status(400).json({ erro: true, mensagem: "Informe o código de rastreio." });
  }

  const resultado = atualizarPedidoPorIdMS(req.params.id, (pedido) => {
    pedido.codigoRastreio = String(codigo).trim();
    pedido.transportadora = String(transportadora || pedido.transportadora || pedido.frete?.nome || pedido.freteNome || "").trim();
    pedido.linkRastreio = String(link || pedido.linkRastreio || "").trim();
    pedido.rastreioAtualizadoEm = new Date().toISOString();
    pedido.status = "enviado";
    pedido.whatsAppEnvioPendente = Boolean(enviarWhatsApp);
  });

  if (!resultado.sucesso) return res.status(404).json({ erro: true, mensagem: resultado.mensagem });
  res.json(resultado);
});

app.post("/pedidos/:id/gerar-etiqueta", async (req, res) => {
  try {
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return res.status(400).json({ erro: true, mensagem: "Configure MELHOR_ENVIO_TOKEN no .env antes de gerar etiqueta." });
    }

    const pedidos = lerPedidos();
    const pedido = pedidos.find((p) => idsIguaisMS(p.id, req.params.id));
    if (!pedido) return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado" });

    const comprar = req.body?.comprar !== false;
    const gerar = req.body?.gerar !== false;
    const imprimir = req.body?.imprimir !== false;
    const consultarTracking = req.body?.tracking !== false;

    const bodyCarrinho = montarBodyCarrinhoMelhorEnvioMS(pedido);

    const retornoCarrinho = await chamarMelhorEnvioMS("/api/v2/me/cart", bodyCarrinho);
    aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "carrinho", retornoCarrinho);
    const orderId = pedido.melhorEnvio?.orderId || extrairOrderIdMelhorEnvioMS(retornoCarrinho);

    if (!orderId) {
      const erro = new Error("O Melhor Envio criou o retorno, mas não veio o ID da etiqueta.");
      erro.data = retornoCarrinho;
      throw erro;
    }

    let retornoCheckout = null;
    let retornoGenerate = null;
    let retornoPrint = null;
    let retornoTracking = null;

    if (comprar) {
      retornoCheckout = await chamarMelhorEnvioMS("/api/v2/me/shipment/checkout", { orders: [orderId] });
      aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "checkout", retornoCheckout);
      pedido.melhorEnvio.status = "comprada";
    } else {
      pedido.melhorEnvio.status = "carrinho";
    }

    if (comprar && gerar) {
      retornoGenerate = await chamarMelhorEnvioMS("/api/v2/me/shipment/generate", { orders: [orderId] });
      aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "generate", retornoGenerate);
      pedido.melhorEnvio.status = "gerada";
    }

    if (comprar && gerar && imprimir) {
      retornoPrint = await chamarMelhorEnvioMS("/api/v2/me/shipment/print", { orders: [orderId], mode: "public" });
      aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "print", retornoPrint);
    }

    if (consultarTracking) {
      try {
        retornoTracking = await chamarMelhorEnvioMS("/api/v2/me/shipment/tracking", { orders: [orderId] });
        aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "tracking", retornoTracking);
      } catch (e) {
        pedido.melhorEnvio.trackingErro = e.data || e.message;
      }
    }

    pedido.transportadora = pedido.transportadora || pedido.frete?.nome || pedido.freteNome || "Melhor Envio";
    if (pedido.codigoRastreio) {
      pedido.status = "enviado";
      pedido.rastreioAtualizadoEm = new Date().toISOString();
    } else if (comprar && gerar) {
      pedido.status = "etiqueta gerada";
    }

    salvarPedidos(pedidos);

    res.json({
      sucesso: true,
      pedido,
      melhorEnvio: pedido.melhorEnvio,
      orderId,
      retorno: {
        carrinho: retornoCarrinho,
        checkout: retornoCheckout,
        generate: retornoGenerate,
        print: retornoPrint,
        tracking: retornoTracking
      }
    });
  } catch (erro) {
    console.error("Erro no fluxo Melhor Envio:", erro.endpoint || "", erro.message, erro.data || "");
    res.status(erro.status || 500).json({
      erro: true,
      mensagem: erro.message,
      endpoint: erro.endpoint,
      detalhes: erro.data || null
    });
  }
});

app.post("/pedidos/:id/consultar-rastreio", async (req, res) => {
  try {
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return res.status(400).json({ erro: true, mensagem: "Configure MELHOR_ENVIO_TOKEN no .env." });
    }

    const pedidos = lerPedidos();
    const pedido = pedidos.find((p) => idsIguaisMS(p.id, req.params.id));
    if (!pedido) return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado" });
    const orderId = pedido.melhorEnvio?.orderId || pedido.melhorEnvio?.cartId;
    if (!orderId) return res.status(400).json({ erro: true, mensagem: "Esse pedido ainda não tem ID de etiqueta do Melhor Envio." });

    const retornoTracking = await chamarMelhorEnvioMS("/api/v2/me/shipment/tracking", { orders: [orderId] });
    aplicarRetornoMelhorEnvioNoPedidoMS(pedido, "tracking", retornoTracking);
    if (pedido.codigoRastreio) pedido.status = "enviado";
    salvarPedidos(pedidos);
    res.json({ sucesso: true, pedido, tracking: retornoTracking });
  } catch (erro) {
    res.status(erro.status || 500).json({ erro: true, mensagem: erro.message, endpoint: erro.endpoint, detalhes: erro.data || null });
  }
});


function proximoIdPedidoMS(pedidos) {
  const ids = (pedidos || []).map((p) => Number(p.id) || 0);
  return ids.length ? Math.max(...ids) + 1 : 1;
}


// =========================================================
// PIX DIRETO NA LOJA - MS MATIAS STYLE
// Gera o QR Code pela API de pagamentos do Mercado Pago sem
// mandar o cliente para outra página ou outra aba.
// =========================================================
app.post("/criar-pagamento-pix", async (req, res) => {
  try {
    garantirMercadoPagoConfigurado();

    const body = req.body || {};
    const carrinhoItems = body.items || body.carrinho || [];
    const nome = String(body.nome || body.cliente?.nome || "").trim();
    const telefone = String(body.telefone || body.whatsapp || body.cliente?.telefone || "").trim();
    const emailInformado = String(body.email || body.cliente?.email || "").trim();
    const emailPagador = emailInformado || process.env.MS_EMAIL_FALLBACK || "bielandre67@gmail.com";

    let cep = body.cep || body.endereco?.cep || "";
    let rua = body.rua || body.endereco?.rua || body.endereco?.endereco || "";
    let numero = body.numero || body.endereco?.numero || "";
    let complemento = body.complemento || body.endereco?.complemento || "";
    let bairro = body.bairro || body.endereco?.bairro || "";
    let cidade = body.cidade || body.endereco?.cidade || "";
    let estado = body.estado || body.endereco?.estado || "";

    const tipoEntrega = String(body.tipoEntrega || "entrega").toLowerCase();
    const freteSelecionado = body.freteSelecionado || null;
    const retiradaLocal = body.retiradaLocal === true || tipoEntrega === "retirada" || String(freteSelecionado?.nome || "").toLowerCase().includes("retirada");
    const valorFrete = retiradaLocal ? 0 : (Number(body.valorFrete) || 0);
    const codigoCupom = String(body.codigoCupom || "").trim().toUpperCase();

    if (retiradaLocal) {
      cep = cep || "00000000";
      rua = "Retirada no local";
      numero = "S/N";
      complemento = complemento || "Cliente retirará o pedido no local";
      bairro = bairro || "Retirada";
      cidade = cidade || "Retirada no local";
      estado = estado || "RS";
    }

    if (!carrinhoItems.length) return res.status(400).json({ erro:true, mensagem:"Carrinho vazio." });
    if (!nome || !telefone || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({ erro:true, mensagem:"Preencha os dados do cliente e o endereço antes de pagar." });
    }

    const validacaoEstoque = validarCarrinhoEstoqueMS(carrinhoItems);
    if (!validacaoEstoque.ok) return res.status(400).json({ erro:true, mensagem:validacaoEstoque.mensagem });

    const subtotal = carrinhoItems.reduce((soma, item) => soma + Number(item.preco || item.unit_price || 0) * Number(item.quantidade || item.quantity || 1), 0);
    const validacaoCupom = codigoCupom ? await validarCupomBancoMS(codigoCupom, subtotal) : { valido:false, percentual:0 };
    if (codigoCupom && !validacaoCupom.valido) return res.status(400).json({ erro:true, mensagem:validacaoCupom.mensagem });
    const desconto = validacaoCupom.valido ? Number(validacaoCupom.percentual) : 0;
    const totalPedido = Number((subtotal - subtotal * desconto / 100 + valorFrete).toFixed(2));
    if (!(totalPedido > 0)) return res.status(400).json({ erro:true, mensagem:"O total do pedido é inválido." });

    const pedidos = lerPedidos();
    const idPedido = proximoIdPedidoMS(pedidos);
    const agoraBrasil = new Date().toLocaleString("pt-BR", { timeZone:"America/Sao_Paulo", hour12:false });
    const pedidoNovo = {
      id:idPedido, nome, telefone, whatsapp:telefone, email:emailInformado,
      cep, rua, numero, complemento, bairro, cidade, estado,
      cliente:{ nome, telefone, email:emailInformado },
      endereco:{ cep, rua, numero, complemento, bairro, cidade, estado },
      produtos:carrinhoItems, tipoEntrega:retiradaLocal ? "retirada" : "entrega",
      retiradaLocal, frete:freteSelecionado, subtotal, desconto,
      codigoCupom:codigoCupom || null, total:totalPedido,
      status:"aguardando pagamento", data:agoraBrasil
    };
    pedidos.push(pedidoNovo);
    salvarPedidos(pedidos);
    reservarEstoquePedidoMS(carrinhoItems, idPedido);

    const backendUrl = (process.env.BACKEND_URL || "https://ms-matias-style.onrender.com").replace(/\/$/, "");
    const nomes = nome.split(/\s+/).filter(Boolean);
    const primeiroNome = nomes.shift() || "Cliente";
    const sobrenome = nomes.join(" ") || "MS";
    const idempotencyKey = `ms-pix-${idPedido}-${Date.now()}`;

    const respostaMP = await fetch("https://api.mercadopago.com/v1/payments", {
      method:"POST",
      headers:{
        Authorization:`Bearer ${accessToken}`,
        "Content-Type":"application/json",
        "X-Idempotency-Key":idempotencyKey
      },
      body:JSON.stringify({
        transaction_amount:totalPedido,
        description:`Pedido #${idPedido} - MS Matias Style`,
        payment_method_id:"pix",
        external_reference:String(idPedido),
        notification_url:`${backendUrl}/webhook`,
        payer:{ email:emailPagador, first_name:primeiroNome, last_name:sobrenome }
      })
    });

    const pagamento = await respostaMP.json();
    if (!respostaMP.ok) {
      liberarReservaPedidoMS(idPedido);
      salvarPedidos(lerPedidos().filter(p => !idsIguaisMS(p.id, idPedido)));
      const erro = new Error(pagamento?.message || "O Mercado Pago não conseguiu gerar o PIX.");
      erro.statusCode = respostaMP.status;
      erro.respostaMercadoPago = pagamento;
      throw erro;
    }

    const transacao = pagamento?.point_of_interaction?.transaction_data || {};
    if (!transacao.qr_code) {
      liberarReservaPedidoMS(idPedido);
      salvarPedidos(lerPedidos().filter(p => !idsIguaisMS(p.id, idPedido)));
      const erro = new Error("O Mercado Pago não retornou o código PIX.");
      erro.respostaMercadoPago = pagamento;
      throw erro;
    }

    const pedidosAtualizados = lerPedidos();
    const pedidoAtualizado = pedidosAtualizados.find(p => idsIguaisMS(p.id, idPedido));
    if (pedidoAtualizado) {
      pedidoAtualizado.pagamento = {
        metodo:"PIX Mercado Pago", status:String(pagamento.status || "pending"),
        paymentId:String(pagamento.id), idempotencyKey,
        expiracao:pagamento.date_of_expiration || null,
        atualizadoEm:new Date().toISOString()
      };
      salvarPedidos(pedidosAtualizados);
    }

    if (codigoCupom && validacaoCupom.valido && pool) {
      await pool.query("UPDATE cupons SET usos=usos+1, atualizado_em=NOW() WHERE id=$1", [validacaoCupom.cupom.id]);
    }

    return res.json({
      sucesso:true, pedido:idPedido, payment_id:pagamento.id,
      status:pagamento.status, total:totalPedido,
      qr_code:transacao.qr_code,
      qr_code_base64:transacao.qr_code_base64 || null,
      ticket_url:transacao.ticket_url || null,
      status_url:`/pagamento/status/${idPedido}`
    });
  } catch (error) {
    console.error("ERRO PIX DIRETO MS:", error.message, error.respostaMercadoPago || "");
    return res.status(error.statusCode || 500).json({ erro:true, mensagem:error.message, detalhes:error.respostaMercadoPago || null });
  }
});

app.post("/criar-pagamento", async (req, res) => {
  try {
    console.log("ENTROU NO /criar-pagamento");

    const body = req.body || {};
    const carrinhoItems = body.items || [];

    const nome = body.nome || body.cliente?.nome || "";
    const telefone = body.telefone || body.whatsapp || body.cliente?.telefone || "";
    const email = body.email || body.cliente?.email || "";
    let cep = body.cep || body.endereco?.cep || "";
    let rua = body.rua || body.endereco?.rua || body.endereco?.endereco || "";
    let numero = body.numero || body.endereco?.numero || "";
    let complemento = body.complemento || body.endereco?.complemento || "";
    let bairro = body.bairro || body.endereco?.bairro || "";
    let cidade = body.cidade || body.endereco?.cidade || "";
    let estado = body.estado || body.endereco?.estado || "";

    const tipoEntrega = String(body.tipoEntrega || "entrega").toLowerCase();
    const freteSelecionado = body.freteSelecionado || null;
    const retiradaLocal = body.retiradaLocal === true || tipoEntrega === "retirada" || String(freteSelecionado?.nome || "").toLowerCase().includes("retirada");
    const valorFrete = retiradaLocal ? 0 : (Number(body.valorFrete) || 0);

    if (retiradaLocal) {
      cep = cep || "00000000";
      rua = "Retirada no local";
      numero = "S/N";
      complemento = complemento || "Cliente retirará o pedido no local";
      bairro = bairro || "Retirada";
      cidade = cidade || "Retirada no local";
      estado = estado || "RS";
    }
    const codigoCupom = String(body.codigoCupom || "").trim().toUpperCase();

    if (!carrinhoItems.length) {
      return res.status(400).json({
        erro: true,
        mensagem: "Carrinho vazio. Adicione um produto antes de pagar."
      });
    }

    if (!nome || !telefone || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      return res.status(400).json({
        erro: true,
        mensagem: "Dados do cliente ou endereço incompletos. Volte à etapa Entrega e preencha todos os campos obrigatórios."
      });
    }

    const validacaoEstoque = validarCarrinhoEstoqueMS(carrinhoItems);
    if (!validacaoEstoque.ok) {
      return res.status(400).json({
        erro: true,
        mensagem: validacaoEstoque.mensagem
      });
    }

    const subtotal = carrinhoItems.reduce((soma, item) => {
      return soma + Number(item.preco || 0) * Number(item.quantidade || 1);
    }, 0);

    const validacaoCupom = codigoCupom ? await validarCupomBancoMS(codigoCupom, subtotal) : { valido:false, percentual:0 };
    if (codigoCupom && !validacaoCupom.valido) return res.status(400).json({ erro:true, mensagem:validacaoCupom.mensagem });
    const desconto = validacaoCupom.valido ? Number(validacaoCupom.percentual) : 0;
    const valorDesconto = subtotal * (desconto / 100);
    const totalPedido = subtotal - valorDesconto + valorFrete;

    const pedidos = lerPedidos();
    const idPedido = proximoIdPedidoMS(pedidos);
    const agoraBrasil = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour12: false
    });

    pedidos.push({
      id: idPedido,
      nome,
      telefone,
      whatsapp: telefone,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      cliente: { nome, telefone, email },
      endereco: { cep, rua, numero, complemento, bairro, cidade, estado },
      produtos: carrinhoItems,
      tipoEntrega: retiradaLocal ? "retirada" : "entrega",
      retiradaLocal,
      frete: freteSelecionado,
      subtotal,
      desconto,
      codigoCupom: codigoCupom || null,
      total: totalPedido,
      status: "aguardando pagamento",
      data: agoraBrasil
    });

    salvarPedidos(pedidos);
    reservarEstoquePedidoMS(carrinhoItems, idPedido);

    let pagamento;
    try {
      pagamento = await criarPreferenciaMP({
        carrinhoItems,
        valorFrete,
        freteSelecionado,
        idPedido,
        percentualDesconto: desconto
      });
    } catch (erroPagamento) {
      liberarReservaPedidoMS(idPedido);
      salvarPedidos(lerPedidos().filter((p) => !idsIguaisMS(p.id, idPedido)));
      throw erroPagamento;
    }

    if (codigoCupom && validacaoCupom.valido && pool) {
      await pool.query("UPDATE cupons SET usos=usos+1, atualizado_em=NOW() WHERE id=$1", [validacaoCupom.cupom.id]);
    }

    const pedidosAtualizados = lerPedidos();
    const pedidoAtualizado = pedidosAtualizados.find((p) => idsIguaisMS(p.id, idPedido));
    if (pedidoAtualizado) {
      pedidoAtualizado.pagamento = {
        metodo: "Mercado Pago",
        status: "aguardando pagamento",
        preferenceId: pagamento.id
      };
      salvarPedidos(pedidosAtualizados);
    }

    return res.json({
      sucesso: true,
      pedido: idPedido,
      id: pagamento.id,
      init_point: pagamento.init_point,
      status_url: `/pagamento/status/${idPedido}`
    });
  } catch (error) {
    console.error("========== ERRO MERCADO PAGO ==========");
    console.error("Mensagem:", error.message);
    console.error("Cause:", error.cause);
    console.error("Response:", error.response?.data);
    console.error("Resposta MP:", error.respostaMercadoPago);
    console.error("Objeto completo:", error);

    return res.status(error.statusCode || 500).json({
      erro: true,
      mensagem: error.message,
      detalhes: error.response?.data || error.cause || error.respostaMercadoPago || null
    });
  }
});

app.post("/checkout-mp", async (req, res) => {
  try {
    console.log("ENTROU NO /checkout-mp");

    const pedidoBody = JSON.parse(req.body.pedido || "{}");
    const carrinhoItems = pedidoBody.items || pedidoBody.produtos || [];
    const valorFrete = Number(pedidoBody.valorFrete) || 0;
    const freteSelecionado = pedidoBody.freteSelecionado || pedidoBody.frete || null;
    const desconto = Number(pedidoBody.desconto) || 0;

    const nome = pedidoBody.nome || pedidoBody.cliente?.nome || "";
    const telefone = pedidoBody.telefone || pedidoBody.whatsapp || pedidoBody.cliente?.telefone || "";
    const email = pedidoBody.email || pedidoBody.cliente?.email || "";
    const cep = pedidoBody.cep || pedidoBody.endereco?.cep || "";
    const rua = pedidoBody.rua || pedidoBody.endereco?.rua || "";
    const numero = pedidoBody.numero || pedidoBody.endereco?.numero || "";
    const complemento = pedidoBody.complemento || pedidoBody.endereco?.complemento || "";
    const bairro = pedidoBody.bairro || pedidoBody.endereco?.bairro || "";
    const cidade = pedidoBody.cidade || pedidoBody.endereco?.cidade || "";
    const estado = pedidoBody.estado || pedidoBody.endereco?.estado || "";

    if (!carrinhoItems.length) {
      return res.status(400).send("Carrinho vazio. Volte para a loja e adicione um produto.");
    }

    if (!nome || !telefone || !cep || !rua || !numero || !bairro || !cidade || !estado) {
      return res.status(400).send("Dados do cliente/endereço incompletos. Volte ao checkout e preencha todos os campos obrigatórios.");
    }

    const validacaoEstoque = validarCarrinhoEstoqueMS(carrinhoItems);
    if (!validacaoEstoque.ok) {
      return res.status(400).send(validacaoEstoque.mensagem);
    }

    const subtotal = carrinhoItems.reduce((soma, item) => {
      return soma + Number(item.preco || 0) * Number(item.quantidade || 1);
    }, 0);

    const valorDesconto = desconto > 0 ? subtotal * (desconto / 100) : 0;
    const totalPedido = subtotal - valorDesconto + valorFrete;

    const pedidos = lerPedidos();
    const idPedido = proximoIdPedidoMS(pedidos);
    const agoraBrasil = new Date().toLocaleString("pt-BR", {
      timeZone: "America/Sao_Paulo",
      hour12: false
    });

    const novoPedido = {
      id: idPedido,
      origem: pedidoBody.origem || "mobile",
      nome,
      telefone,
      whatsapp: telefone,
      email,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      endereco: { cep, rua, numero, complemento, bairro, cidade, estado },
      cliente: { nome, telefone, email },
      produtos: carrinhoItems,
      frete: freteSelecionado,
      valorFrete,
      subtotal,
      desconto,
      total: totalPedido,
      status: "aguardando pagamento",
      pagamento: { metodo: "Mercado Pago", status: "aguardando pagamento" },
      data: agoraBrasil
    };

    pedidos.push(novoPedido);
    salvarPedidos(pedidos);
    reservarEstoquePedidoMS(carrinhoItems, idPedido);

    let pagamento;
    try {
      pagamento = await criarPreferenciaMP({
        carrinhoItems,
        valorFrete,
        freteSelecionado,
        idPedido
      });
    } catch (erroPagamento) {
      liberarReservaPedidoMS(idPedido);
      salvarPedidos(lerPedidos().filter((p) => !idsIguaisMS(p.id, idPedido)));
      throw erroPagamento;
    }

    const pedidosAtualizados = lerPedidos();
    const pedidoAtualizado = pedidosAtualizados.find((p) => idsIguaisMS(p.id, idPedido));
    if (pedidoAtualizado) {
      pedidoAtualizado.pagamento = {
        ...(pedidoAtualizado.pagamento || {}),
        preferenceId: pagamento.id
      };
      salvarPedidos(pedidosAtualizados);
    }

    return res.redirect(pagamento.init_point);
  } catch (erro) {
    console.error("ERRO CHECKOUT MP:", erro);
    return res.status(500).send("Erro ao abrir Mercado Pago: " + erro.message);
  }
});

app.post("/atualizar-status", (req, res) => {
  const { id, status } = req.body;
  const pedidos = lerPedidos();
  const pedido = pedidos.find((p) => Number(p.id) === Number(id));

  if (!pedido) {
    return res.status(404).json({
      erro: "Pedido não encontrado"
    });
  }

  pedido.status = status;
  if (String(status).toLowerCase() === "pago") {
    baixarEstoquePedidoMS(pedido);
  }
  if (["cancelado", "cancelada", "recusado", "recusada"].includes(String(status).toLowerCase())) {
    liberarReservaPedidoMS(pedido.id);
  }
  salvarPedidos(pedidos);

  res.json({
    sucesso: true
  });
});

function statusPedidoMercadoPagoMS(statusMP) {
  const mapa = {
    approved: "pago",
    pending: "aguardando pagamento",
    in_process: "pagamento em análise",
    rejected: "recusado",
    cancelled: "cancelado",
    refunded: "reembolsado",
    charged_back: "estornado"
  };
  return mapa[String(statusMP || "").toLowerCase()] || String(statusMP || "aguardando pagamento");
}

app.post("/webhook", async (req, res) => {
  try {
    garantirMercadoPagoConfigurado();

    const pagamentoId =
      req.body?.data?.id ||
      req.body?.id ||
      req.query["data.id"] ||
      req.query.id;

    const tipo = req.body?.type || req.body?.topic || req.query.type || req.query.topic || "payment";

    if (!pagamentoId || !String(tipo).toLowerCase().includes("payment")) {
      return res.sendStatus(200);
    }

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });

    if (!resposta.ok) {
      console.error("Webhook MP: falha ao consultar pagamento", pagamentoId, resposta.status);
      return res.sendStatus(200);
    }

    const pagamento = await resposta.json();
    const idPedido = pagamento.external_reference;

    if (!idPedido) {
      console.error("Webhook MP sem external_reference:", pagamentoId);
      return res.sendStatus(200);
    }

    const pedidos = lerPedidos();
    const pedido = pedidos.find((p) => idsIguaisMS(p.id, idPedido));

    if (!pedido) {
      console.error("Webhook MP: pedido não encontrado", idPedido);
      return res.sendStatus(200);
    }

    const statusMP = String(pagamento.status || "").toLowerCase();
    pedido.status = statusPedidoMercadoPagoMS(statusMP);
    pedido.pagamento = {
      ...(pedido.pagamento || {}),
      metodo: "Mercado Pago",
      status: statusMP,
      paymentId: String(pagamento.id || pagamentoId),
      preferenceId: pagamento.preference_id || pedido.pagamento?.preferenceId || null,
      statusDetail: pagamento.status_detail || "",
      atualizadoEm: new Date().toISOString()
    };

    if (statusMP === "approved") {
      baixarEstoquePedidoMS(pedido);
      pedido.pagoEm = pagamento.date_approved || new Date().toISOString();
    }

    if (["rejected", "cancelled", "refunded", "charged_back"].includes(statusMP)) {
      liberarReservaPedidoMS(pedido.id);
    }

    salvarPedidos(pedidos);
    console.log("Webhook MP atualizado:", { pedido: pedido.id, pagamento: pagamento.id, status: statusMP });
    return res.sendStatus(200);
  } catch (erro) {
    console.error("Erro no webhook Mercado Pago:", erro);
    return res.sendStatus(200);
  }
});

app.get("/pagamento/status/:pedidoId", (req, res) => {
  res.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.set("Pragma", "no-cache");
  res.set("Expires", "0");
  const pedido = lerPedidos().find((p) => idsIguaisMS(p.id, req.params.pedidoId));
  if (!pedido) return res.status(404).json({ erro: true, mensagem: "Pedido não encontrado" });

  res.json({
    pedido: pedido.id,
    status: pedido.status,
    pagamento: pedido.pagamento || null,
    estoqueBaixado: Boolean(pedido.estoqueBaixado)
  });
});

// A antiga rota /gerar-token foi removida por segurança.
// Nunca deixe client_secret ou authorization code gravados no código-fonte.

app.get("/health", (req, res) => {
  res.json({
    ok: true,
    servico: "MS Matias Style API",
    porta: PORT,
    mercadoPagoConfigurado: Boolean(accessToken),
    melhorEnvioConfigurado: Boolean(process.env.MELHOR_ENVIO_TOKEN)
  });
});



// CUPONS ---------------------------------------------------------------------
function cupomRespostaMS(row) {
  return {
    id: Number(row.id), codigo: row.codigo, percentual: Number(row.percentual || 0),
    ativo: Boolean(row.ativo), valorMinimo: Number(row.valor_minimo || 0),
    limiteUsos: Number(row.limite_usos || 0), usos: Number(row.usos || 0),
    validade: row.validade, criadoEm: row.criado_em, atualizadoEm: row.atualizado_em
  };
}
async function validarCupomBancoMS(codigo, subtotal) {
  if (!pool || !codigo) return { valido:false, mensagem:"Cupom inválido." };
  const r = await pool.query("SELECT * FROM cupons WHERE UPPER(codigo)=UPPER($1) LIMIT 1", [String(codigo).trim()]);
  if (!r.rowCount) return { valido:false, mensagem:"Cupom inválido." };
  const c=r.rows[0];
  if(!c.ativo) return { valido:false, mensagem:"Este cupom está desativado." };
  if(c.validade && new Date(c.validade).getTime() < Date.now()) return { valido:false, mensagem:"Este cupom expirou." };
  if(Number(c.limite_usos)>0 && Number(c.usos)>=Number(c.limite_usos)) return { valido:false, mensagem:"Este cupom atingiu o limite de usos." };
  if(Number(subtotal||0) < Number(c.valor_minimo||0)) return { valido:false, mensagem:`Compra mínima de R$ ${Number(c.valor_minimo).toFixed(2).replace('.',',')}.` };
  return { valido:true, cupom:cupomRespostaMS(c), percentual:Number(c.percentual), valorDesconto:Number(subtotal||0)*(Number(c.percentual)/100) };
}
app.get("/cupons", async (req,res,next)=>{ if(!pool) return res.json([]); try{const r=await pool.query("SELECT * FROM cupons ORDER BY id DESC");res.json(r.rows.map(cupomRespostaMS));}catch(e){next(e);} });
app.post("/cupons/validar", async (req,res,next)=>{ try{const resultado=await validarCupomBancoMS(req.body?.codigo, Number(req.body?.subtotal||0)); res.status(resultado.valido?200:400).json(resultado);}catch(e){next(e);} });
app.post("/cupons", async (req,res,next)=>{ if(!pool)return res.status(503).json({mensagem:"Banco não configurado."});try{const b=req.body||{};const codigo=String(b.codigo||'').trim().toUpperCase();if(!codigo)return res.status(400).json({mensagem:"Informe o código."});const r=await pool.query(`INSERT INTO cupons(codigo,percentual,ativo,valor_minimo,limite_usos,validade) VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,[codigo,Number(b.percentual)||0,b.ativo!==false,Number(b.valorMinimo)||0,Math.max(0,Number(b.limiteUsos)||0),b.validade||null]);res.json({ok:true,cupom:cupomRespostaMS(r.rows[0])});}catch(e){if(e.code==='23505')return res.status(400).json({mensagem:"Esse código já existe."});next(e);} });
app.put("/cupons/:id", async (req,res,next)=>{if(!pool)return res.status(503).json({mensagem:"Banco não configurado."});try{const b=req.body||{};const r=await pool.query(`UPDATE cupons SET codigo=UPPER($2),percentual=$3,ativo=$4,valor_minimo=$5,limite_usos=$6,validade=$7,atualizado_em=NOW() WHERE id=$1 RETURNING *`,[req.params.id,String(b.codigo||'').trim(),Number(b.percentual)||0,b.ativo!==false,Number(b.valorMinimo)||0,Math.max(0,Number(b.limiteUsos)||0),b.validade||null]);if(!r.rowCount)return res.status(404).json({mensagem:"Cupom não encontrado."});res.json({ok:true,cupom:cupomRespostaMS(r.rows[0])});}catch(e){next(e);} });
app.delete("/cupons/:id", async(req,res,next)=>{if(!pool)return res.status(503).json({mensagem:"Banco não configurado."});try{await pool.query("DELETE FROM cupons WHERE id=$1",[req.params.id]);res.json({ok:true});}catch(e){next(e);} });


function normalizarImagensProdutoMS(valor, limite = 12) {
  if (!Array.isArray(valor)) return [];
  return valor
    .map((item) => String(item || "").trim())
    .filter((item) => item && (item.startsWith("data:image/") || /^https?:\/\//i.test(item) || item.startsWith("/")))
    .slice(0, limite);
}

function normalizarImagemPrincipalMS(valor) {
  const item = String(valor || "").trim();
  if (!item) return "";
  return (item.startsWith("data:image/") || /^https?:\/\//i.test(item) || item.startsWith("/")) ? item : "";
}
// PRODUTOS NO POSTGRESQL ------------------------------------------------------
// Esta API é compatível com o catálogo HTML atual. O front sincroniza os cards
// existentes uma única vez e, depois, preços/visibilidade são controlados aqui.
function chaveProdutoMS(valor) {
  return String(valor || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "").slice(0, 180);
}

function numeroMedidaProdutoMS(valor, campo) {
  if (valor === undefined || valor === null || valor === '') return 0;
  const numero = Number(String(valor).replace(',', '.'));
  if (!Number.isFinite(numero) || numero < 0) {
    const erro = new Error(`${campo} deve ser um número igual ou maior que zero.`);
    erro.statusCode = 400;
    throw erro;
  }
  return numero;
}

function produtoRespostaMS(row) {
  return {
    id: Number(row.id), chave: row.chave, nome: row.nome,
    categoria: row.categoria, preco: Number(row.preco || 0),
    precoAntigo: row.preco_antigo == null ? null : Number(row.preco_antigo),
    imagem: row.imagem || "", imagens: Array.isArray(row.imagens) ? row.imagens : [],
    descricao: row.descricao || "", cores: Array.isArray(row.cores) ? row.cores : [],
    tamanhos: Array.isArray(row.tamanhos) ? row.tamanhos : ['P','M','G','GG'], ativo: Boolean(row.ativo),
    destaque: Boolean(row.destaque), promocao: Boolean(row.promocao),
    pesoKg: Number(row.peso_kg || 0), alturaCm: Number(row.altura_cm || 0),
    larguraCm: Number(row.largura_cm || 0), comprimentoCm: Number(row.comprimento_cm || 0),
    medidasCompletas: Number(row.peso_kg || 0) > 0 && Number(row.altura_cm || 0) > 0 && Number(row.largura_cm || 0) > 0 && Number(row.comprimento_cm || 0) > 0,
    criadoEm: row.criado_em, atualizadoEm: row.atualizado_em
  };
}

app.get("/produtos", async (req, res, next) => {
  if (!pool) return res.json([]);
  try {
    const apenasAtivos = String(req.query.ativos || "").toLowerCase() === "true";
    const sql = `SELECT * FROM produtos ${apenasAtivos ? "WHERE ativo = TRUE" : ""} ORDER BY id`;
    const resultado = await pool.query(sql);
    res.json(resultado.rows.map(produtoRespostaMS));
  } catch (erro) { next(erro); }
});

app.post("/produtos/sincronizar-catalogo", async (req, res, next) => {
  if (!pool) return res.status(503).json({ erro: true, mensagem: "PostgreSQL não configurado." });
  const produtos = Array.isArray(req.body?.produtos) ? req.body.produtos : [];
  if (!produtos.length) return res.json({ ok: true, inseridos: 0 });
  try {
    let inseridos = 0;
    for (const p of produtos.slice(0, 500)) {
      const nome = String(p.nome || "").trim();
      if (!nome) continue;
      const chave = chaveProdutoMS(p.chave || nome);
      const preco = Number(String(p.preco ?? 0).replace(",", ".")) || 0;
      const precoAntigo = p.precoAntigo == null || p.precoAntigo === "" ? null : Number(String(p.precoAntigo).replace(",", "."));
      const imagens = normalizarImagensProdutoMS(p.imagens);
      const r = await pool.query(
        `INSERT INTO produtos (chave,nome,categoria,preco,preco_antigo,imagem,imagens,descricao)
         VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8)
         ON CONFLICT (chave) DO NOTHING RETURNING id`,
        [chave, nome, String(p.categoria || "Roupas").slice(0,80), preco, Number.isFinite(precoAntigo) ? precoAntigo : null,
         normalizarImagemPrincipalMS(p.imagem || imagens[0] || ""), JSON.stringify(imagens), String(p.descricao || "")]
      );
      if (r.rowCount) inseridos++;
    }
    res.json({ ok: true, inseridos });
  } catch (erro) { next(erro); }
});

app.post("/produtos", async (req, res, next) => {
  if (!pool) return res.status(503).json({ erro: true, mensagem: "PostgreSQL não configurado." });
  try {
    const p = req.body || {};
    const nome = String(p.nome || "").trim();
    if (!nome) return res.status(400).json({ erro: true, mensagem: "Informe o nome do produto." });
    const chave = chaveProdutoMS(p.chave || nome);
    const resultado = await pool.query(
      `INSERT INTO produtos (chave,nome,categoria,preco,preco_antigo,imagem,imagens,descricao,cores,tamanhos,ativo,destaque,promocao,peso_kg,altura_cm,largura_cm,comprimento_cm)
       VALUES ($1,$2,$3,$4,$5,$6,$7::jsonb,$8,$9::jsonb,$10::jsonb,$11,$12,$13,$14,$15,$16,$17)
       ON CONFLICT (chave) DO UPDATE SET nome=EXCLUDED.nome,categoria=EXCLUDED.categoria,
       preco=EXCLUDED.preco,preco_antigo=EXCLUDED.preco_antigo,imagem=EXCLUDED.imagem,
       imagens=EXCLUDED.imagens,descricao=EXCLUDED.descricao,cores=EXCLUDED.cores,tamanhos=EXCLUDED.tamanhos,ativo=EXCLUDED.ativo,
       destaque=EXCLUDED.destaque,promocao=EXCLUDED.promocao,peso_kg=EXCLUDED.peso_kg,altura_cm=EXCLUDED.altura_cm,
       largura_cm=EXCLUDED.largura_cm,comprimento_cm=EXCLUDED.comprimento_cm,atualizado_em=NOW()
       RETURNING *`,
      [chave,nome,String(p.categoria||"Roupas").slice(0,80),Number(p.preco)||0,
       p.precoAntigo==null||p.precoAntigo===""?null:Number(p.precoAntigo),normalizarImagemPrincipalMS(p.imagem),
       JSON.stringify(normalizarImagensProdutoMS(p.imagens)),String(p.descricao||""),
       JSON.stringify(Array.isArray(p.cores)?p.cores:[]),JSON.stringify(Array.isArray(p.tamanhos)?p.tamanhos:['P','M','G','GG']),p.ativo!==false,
       Boolean(p.destaque),Boolean(p.promocao),
       numeroMedidaProdutoMS(p.pesoKg, 'Peso'), numeroMedidaProdutoMS(p.alturaCm, 'Altura'),
       numeroMedidaProdutoMS(p.larguraCm, 'Largura'), numeroMedidaProdutoMS(p.comprimentoCm, 'Comprimento')]
    );
    res.json({ ok:true, produto:produtoRespostaMS(resultado.rows[0]) });
  } catch (erro) { next(erro); }
});

app.put("/produtos/:id", async (req, res, next) => {
  if (!pool) return res.status(503).json({ erro: true, mensagem: "PostgreSQL não configurado." });
  try {
    const p=req.body||{};
    const resultado=await pool.query(
      `UPDATE produtos SET nome=COALESCE($2,nome),categoria=COALESCE($3,categoria),
       preco=COALESCE($4,preco),preco_antigo=$5,imagem=COALESCE($6,imagem),
       descricao=COALESCE($7,descricao),ativo=COALESCE($8,ativo),destaque=COALESCE($9,destaque),
       promocao=COALESCE($10,promocao),imagens=COALESCE($11::jsonb,imagens),cores=COALESCE($12::jsonb,cores),tamanhos=COALESCE($13::jsonb,tamanhos),
       peso_kg=COALESCE($14,peso_kg),altura_cm=COALESCE($15,altura_cm),largura_cm=COALESCE($16,largura_cm),comprimento_cm=COALESCE($17,comprimento_cm),
       atualizado_em=NOW() WHERE id=$1 RETURNING *`,
      [req.params.id,p.nome==null?null:String(p.nome).trim(),p.categoria==null?null:String(p.categoria),
       p.preco==null?null:Number(p.preco),p.precoAntigo==null||p.precoAntigo===""?null:Number(p.precoAntigo),
       p.imagem==null?null:normalizarImagemPrincipalMS(p.imagem),p.descricao==null?null:String(p.descricao),
       p.ativo==null?null:Boolean(p.ativo),p.destaque==null?null:Boolean(p.destaque),p.promocao==null?null:Boolean(p.promocao),
       p.imagens==null?null:JSON.stringify(normalizarImagensProdutoMS(p.imagens)),
       p.cores==null?null:JSON.stringify(Array.isArray(p.cores)?p.cores:[]),
       p.tamanhos==null?null:JSON.stringify(Array.isArray(p.tamanhos)?p.tamanhos:[]),
       p.pesoKg==null?null:numeroMedidaProdutoMS(p.pesoKg, 'Peso'),
       p.alturaCm==null?null:numeroMedidaProdutoMS(p.alturaCm, 'Altura'),
       p.larguraCm==null?null:numeroMedidaProdutoMS(p.larguraCm, 'Largura'),
       p.comprimentoCm==null?null:numeroMedidaProdutoMS(p.comprimentoCm, 'Comprimento')]
    );
    if(!resultado.rowCount) return res.status(404).json({erro:true,mensagem:"Produto não encontrado."});
    res.json({ok:true,produto:produtoRespostaMS(resultado.rows[0])});
  } catch(erro){ next(erro); }
});

app.delete("/produtos/:id", async (req,res,next)=>{
  if (!pool) return res.status(503).json({ erro: true, mensagem: "PostgreSQL não configurado." });
  try { await pool.query("DELETE FROM produtos WHERE id=$1",[req.params.id]); res.json({ok:true}); }
  catch(erro){ next(erro); }
});


// Diagnóstico seguro do Mercado Pago: confirma se o Access Token habilita PIX.
// Não revela o token completo. Após o deploy, abra:
// https://ms-matias-style.onrender.com/diagnostico-mercado-pago
app.get("/diagnostico-mercado-pago", async (req, res) => {
  try {
    garantirMercadoPagoConfigurado();

    const resposta = await fetch("https://api.mercadopago.com/v1/payment_methods", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/json"
      }
    });

    const dados = await resposta.json();
    if (!resposta.ok) {
      return res.status(resposta.status).json({
        ok: false,
        mensagem: "O Mercado Pago recusou a consulta dos meios de pagamento.",
        statusMercadoPago: resposta.status,
        detalhes: dados
      });
    }

    const metodos = Array.isArray(dados) ? dados : [];
    const pix = metodos.find((metodo) => String(metodo.id || "").toLowerCase() === "pix");

    return res.json({
      ok: true,
      ambiente: "token configurado no Render",
      tokenInicio: `${accessToken.slice(0, 12)}...`,
      pixDisponivelNoToken: Boolean(pix),
      pix: pix
        ? {
            id: pix.id,
            nome: pix.name,
            tipo: pix.payment_type_id,
            status: pix.status || "disponível"
          }
        : null,
      metodosDisponiveis: metodos.map((metodo) => ({
        id: metodo.id,
        nome: metodo.name,
        tipo: metodo.payment_type_id,
        status: metodo.status || null
      }))
    });
  } catch (erro) {
    console.error("Erro no diagnóstico do Mercado Pago:", erro);
    return res.status(500).json({
      ok: false,
      mensagem: erro.message || "Erro ao consultar os meios de pagamento."
    });
  }
});

// Resposta JSON para rotas de API inexistentes.
app.use((req, res, next) => {
  if (["GET", "HEAD"].includes(req.method) && !req.path.startsWith("/api/")) return next();
  return res.status(404).json({ erro: true, mensagem: "Rota não encontrada." });
});

// Tratamento final para erros inesperados.
app.use((erro, req, res, next) => {
  console.error("ERRO NÃO TRATADO:", erro);
  if (res.headersSent) return next(erro);
  res.status(erro.statusCode || erro.status || 500).json({
    erro: true,
    mensagem: erro.message || "Erro interno do servidor."
  });
});

async function iniciarServidorMS() {
  // Registra os arquivos que já fazem parte do sistema atual.
  garantirArquivoJSON(caminhoPedidos, []);
  garantirArquivoJSON(caminhoPedidosExcluidos, []);
  garantirArquivoJSON(caminhoEstoque, []);
  garantirArquivoJSON(caminhoReservas, []);

  try {
    await iniciarPostgresMS();
    await carregarEstoqueDaTabelaMS();
  } catch (erro) {
    console.error("Falha ao iniciar PostgreSQL:", erro.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`Servidor rodando na porta ${PORT}`);
    console.log(`Loja local: http://localhost:${PORT}`);
    console.log(`Painel local: http://localhost:${PORT}/admin.html`);
    if (!accessToken) console.warn("AVISO: MERCADO_PAGO_ACCESS_TOKEN não configurado.");
    if (!process.env.MELHOR_ENVIO_TOKEN) console.warn("AVISO: MELHOR_ENVIO_TOKEN não configurado.");
  });
}

iniciarServidorMS();
