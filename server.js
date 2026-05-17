const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fs = require("fs");
const path = require("path");

const caminhoPedidos = path.join(__dirname, "pedidos.json");

function lerPedidos(){
  if(!fs.existsSync(caminhoPedidos)){
    fs.writeFileSync(caminhoPedidos, "[]");
  }

  return JSON.parse(fs.readFileSync(caminhoPedidos, "utf8"));
}

function salvarPedidos(pedidos){
  fs.writeFileSync(caminhoPedidos, JSON.stringify(pedidos, null, 2));
}

const app = express();

app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-6498416472210940-051420-58c6f52200361da5cb99befae642591b-3403641746"
});
app.post("/criar-pagamento", async (req, res) => {
  try {
    const {
      itens,
      nome,
      telefone,
      cep,
      rua,
      numero,
      complemento,
      bairro,
      cidade,
      estado
    } = req.body;

    const valorFrete = 20;

    const totalPedido = itens.reduce((soma, item) => {
      return soma + (Number(item.preco) * Number(item.quantidade));
    }, 0) + valorFrete;

    const pedidos = lerPedidos();
    const idPedido = pedidos.length + 1;

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
      itens: JSON.stringify(itens),
      total: totalPedido,
      status: "aguardando pagamento",
      data: new Date().toLocaleString("pt-BR")
    });

    salvarPedidos(pedidos);

    const preference = new Preference(client);

    const resposta = await preference.create({
      body: {
        external_reference: String(idPedido),

        items: [
          ...itens.map((item) => ({
            title: `${item.nome} - Tamanho ${item.tamanho}`,
            quantity: item.quantidade,
            unit_price: Number(item.preco),
            currency_id: "BRL"
          })),

          {
            title: "Frete",
            quantity: 1,
            unit_price: valorFrete,
            currency_id: "BRL"
          }
        ],

        back_urls: {
          success: "https://ms-matias-style.vercel.app/sucesso.html",
          failure: "https://ms-matias-style.vercel.app/erro.html",
          pending: "https://ms-matias-style.vercel.app/pendente.html"
        }
      }
    });

    res.json({
      id: resposta.id,
      pedido: idPedido,
      init_point: resposta.init_point || resposta.sandbox_init_point
    });

  } catch (erro) {
    console.log(erro);
    res.status(500).json({
      erro: "Erro ao criar pagamento"
    });
  }
});

app.get("/pedidos", (req, res) => {

  const pedidos = lerPedidos();

  res.json(pedidos.reverse());

});
app.post("/atualizar-status", (req, res) => {
  const { id, status } = req.body;

  const pedidos = lerPedidos();

  const pedido = pedidos.find(p => Number(p.id) === Number(id));

  if(!pedido){
    return res.status(404).json({
      erro: "Pedido não encontrado"
    });
  }

  pedido.status = status;

  salvarPedidos(pedidos);

  res.json({
    sucesso: true
  });
});