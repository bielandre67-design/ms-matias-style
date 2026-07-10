const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;
const caminhoPedidos = path.join(__dirname, "pedidos.json");
const caminhoPedidosExcluidos = path.join(__dirname, "pedidos_excluidos.json");

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

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
  fs.writeFileSync(caminhoPedidos, JSON.stringify(pedidos, null, 2));
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
  fs.writeFileSync(caminhoPedidosExcluidos, JSON.stringify(pedidos, null, 2));
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

function montarItensMercadoPago(carrinhoItems, valorFrete, freteSelecionado) {
  const items = carrinhoItems
    .map((item) => {
      const preco = Number(item.preco);
      const quantidade = Number(item.quantidade) || 1;

      if (!preco || preco <= 0) return null;

      return {
        title: `${item.nome || "Produto"} - Tamanho ${item.tamanho || "-"}`,
        quantity: quantidade,
        unit_price: preco,
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

async function criarPreferenciaMP({ carrinhoItems, valorFrete, freteSelecionado, idPedido }) {
  garantirMercadoPagoConfigurado();
  const items = montarItensMercadoPago(carrinhoItems, valorFrete, freteSelecionado);

  if (!items.length) {
    const erro = new Error("Carrinho vazio ou produtos sem preço válido.");
    erro.statusCode = 400;
    throw erro;
  }

  console.log("ITENS ENVIADOS AO MERCADO PAGO:", items);

  const preference = new Preference(client);

  const frontendUrl = (process.env.FRONTEND_URL || "https://ms-matias-style.vercel.app").replace(/\/$/, "");
  const backendUrl = (process.env.BACKEND_URL || "").replace(/\/$/, "");

  const bodyPreferencia = {
    external_reference: String(idPedido),
    items,
    back_urls: {
      success: `${frontendUrl}/sucesso.html`,
      failure: `${frontendUrl}/erro.html`,
      pending: `${frontendUrl}/pendente.html`
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

app.post("/calcular-frete", async (req, res) => {
  try {
    const cep = apenasNumerosMS(req.body?.cep);
    if (cep.length !== 8) {
      return res.status(400).json({ erro: true, mensagem: "Informe um CEP válido com 8 números." });
    }
    if (!process.env.MELHOR_ENVIO_TOKEN) {
      return res.status(500).json({ erro: true, mensagem: "MELHOR_ENVIO_TOKEN não está configurado." });
    }

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        Accept: "application/json",
        "User-Agent": "MS Store (bielandre67@gmail.com)"
      },
      body: JSON.stringify({
        from: {
          postal_code: "90640130"
        },
        to: {
          postal_code: cep
        },
        products: [
          {
            id: "1",
            width: 20,
            height: 5,
            length: 25,
            weight: 0.5,
            insurance_value: 89,
            quantity: 1
          }
        ]
      })
    });

    const data = await response.json();
    console.log("STATUS MELHOR ENVIO:", response.status);
    if (!response.ok) {
      return res.status(response.status).json({
        erro: true,
        mensagem: data?.message || "O Melhor Envio recusou o cálculo do frete.",
        detalhes: data
      });
    }
    res.json(data);
  } catch (error) {
    console.error("ERRO FRETE:", error);
    res.status(500).json({
      erro: "Erro ao calcular frete",
      detalhes: error.message
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
  if (n.includes("branco") || n.includes("branca") || n.includes("off white")) return "Branco";
  if (n.includes("bege")) return "Bege";
  if (n.includes("azul")) return "Azul";
  if (n.includes("rosa")) return "Rosa";
  if (n.includes("cinza")) return "Cinza";
  if (n.includes("vinho") || n.includes("bordo")) return "Vinho";
  if (n.includes("marrom")) return "Marrom";
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
  else if (base.includes("camiseta")) tipo = "CAM";
  else if (base.includes("calca") || base.includes("calça")) tipo = "CAL";
  else if (base.includes("touca")) tipo = "TOU";
  else if (base.includes("meia")) tipo = "MEI";

  const cores = {
    preto:"PT", preta:"PT", branco:"BR", branca:"BR", bege:"BG", azul:"AZ",
    rosa:"RS", cinza:"CZ", vinho:"VN", bordo:"VN", marrom:"MR", offwhite:"OW", unica:"UN", unico:"UN"
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
  salvarJSON(caminhoEstoque, Array.isArray(lista) ? lista : []);
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

app.post("/criar-pagamento", async (req, res) => {
  try {
    console.log("ENTROU NO /criar-pagamento");

    const body = req.body || {};
    const carrinhoItems = body.items || [];

    const nome = body.nome || "";
    const telefone = body.telefone || "";
    const cep = body.cep || "";
    const rua = body.rua || "";
    const numero = body.numero || "";
    const complemento = body.complemento || "";
    const bairro = body.bairro || "";
    const cidade = body.cidade || "";
    const estado = body.estado || "";

    const valorFrete = Number(body.valorFrete) || 0;
    const freteSelecionado = body.freteSelecionado || null;
    const desconto = Number(body.desconto) || 0;

    if (!carrinhoItems.length) {
      return res.status(400).json({
        erro: true,
        mensagem: "Carrinho vazio. Adicione um produto antes de pagar."
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

    const valorDesconto = desconto > 0 ? subtotal * (desconto / 100) : 0;
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
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado,
      produtos: carrinhoItems,
      frete: freteSelecionado,
      total: totalPedido,
      status: "aguardando pagamento",
      data: agoraBrasil
    });

    salvarPedidos(pedidos);
    reservarEstoquePedidoMS(carrinhoItems, idPedido);

    const pagamento = await criarPreferenciaMP({
      carrinhoItems,
      valorFrete,
      freteSelecionado,
      idPedido
    });

    return res.json({
      sucesso: true,
      pedido: idPedido,
      id: pagamento.id,
      init_point: pagamento.init_point
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

    const pagamento = await criarPreferenciaMP({
      carrinhoItems,
      valorFrete,
      freteSelecionado,
      idPedido
    });

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

app.post("/webhook", async (req, res) => {
  try {
    const pagamentoId = req.body?.data?.id || req.query["data.id"];

    if (!pagamentoId) {
      return res.sendStatus(200);
    }

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    });

    const pagamento = await resposta.json();

    if (pagamento.status === "approved") {
      const idPedido = pagamento.external_reference;
      const pedidos = lerPedidos();
      const pedido = pedidos.find((p) => String(p.id) === String(idPedido));

      if (pedido) {
        pedido.status = "pago";
        baixarEstoquePedidoMS(pedido);
        salvarPedidos(pedidos);
      }
    }

    res.sendStatus(200);
  } catch (erro) {
    console.error("Erro no webhook:", erro);
    res.sendStatus(200);
  }
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

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  console.log(`Loja local: http://localhost:${PORT}`);
  console.log(`Painel local: http://localhost:${PORT}/admin.html`);
  if (!accessToken) console.warn("AVISO: MERCADO_PAGO_ACCESS_TOKEN não configurado.");
  if (!process.env.MELHOR_ENVIO_TOKEN) console.warn("AVISO: MELHOR_ENVIO_TOKEN não configurado.");
});
