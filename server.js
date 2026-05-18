const express = require("express");
const cors = require("cors");
require("dotenv").config();
const { MercadoPagoConfig, Preference } = require("mercadopago");
const fs = require("fs");
const path = require("path");

const caminhoPedidos = path.join(__dirname, "pedidos.json");

function lerPedidos() {
  if (!fs.existsSync(caminhoPedidos)) {
    fs.writeFileSync(caminhoPedidos, "[]");
  }

  return JSON.parse(fs.readFileSync(caminhoPedidos, "utf8"));
}

function salvarPedidos(pedidos) {
  fs.writeFileSync(caminhoPedidos, JSON.stringify(pedidos, null, 2));
}

const app = express();

app.use(cors());
app.use(express.json());
app.post("/calcular-frete", async (req, res) => {
  try {

    const { cep } = req.body;

    const response = await fetch("https://www.melhorenvio.com.br/api/v2/me/shipment/calculate", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
       Authorization: `Bearer ${process.env.MELHOR_ENVIO_TOKEN}`,
        "Accept": "application/json",
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
console.log("RESPOSTA MELHOR ENVIO:", data);
    res.json(data);

  } catch (error) {
    console.log(error);
    res.status(500).json({
      erro: "Erro ao calcular frete"
    });
  }
});

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-6498416472210940-051420-58c6f52200361da5cb99befae642591b-3403641746"
});
app.post("/criar-pagamento", async (req, res) => {
  try {
    const {
  items,
  nome,
  telefone,
  cep,
  rua,
  numero,
  complemento,
  bairro,
  cidade,
  estado,
  valorFrete,
  freteSelecionado
} = req.body;

  

    const totalPedido = items.reduce((soma, item) => {
  return soma + (Number(item.preco) * Number(item.quantidade));
}, 0) + (Number(valorFrete) || 0);

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
  ...items.map((item) => ({
    title: `${item.nome} - Tamanho ${item.tamanho}`,
    quantity: item.quantidade,
    unit_price: Number(item.preco),
    currency_id: "BRL"
  })),

  {
    title: freteSelecionado ? `Frete - ${freteSelecionado.nome}` : "Frete",
    quantity: 1,
    unit_price: Number(valorFrete) || 0,
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
      init_point: resposta.init_point
    });

  } catch (error) {

  console.log("ERRO PAGAMENTO:", error);

  res.status(500).json({
    erro: "Erro ao criar pagamento",
    detalhes: error.message
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

  if (!pedido) {
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
const PORT = process.env.PORT || 3000;
app.post("/webhook", async (req, res) => {
  try {
    const pagamentoId = req.body?.data?.id || req.query["data.id"];

    if (!pagamentoId) {
      return res.sendStatus(200);
    }

    const resposta = await fetch(`https://api.mercadopago.com/v1/payments/${pagamentoId}`, {
      headers: {
        Authorization: `Bearer ${client.accessToken}`
      }
    });

    const pagamento = await resposta.json();

    if (pagamento.status === "approved") {
      const idPedido = pagamento.external_reference;

      const pedidos = lerPedidos();

      const pedido = pedidos.find(p => String(p.id) === String(idPedido));

      if (pedido) {
        pedido.status = "pago";
        salvarPedidos(pedidos);
      }
    }

    res.sendStatus(200);

  } catch (erro) {
    console.log("Erro no webhook:", erro);
    res.sendStatus(200);
  }
});
app.get("/gerar-token", async (req, res) => {

  const code = "def50200faff2d821faa4b37752058e3c0832c67abfe0e659ddda2a22b335509c3f3dc4ae2528d9995714e1df50da53e70c9766b691bc43b114ca16d4bd01567ae4842dac8232f7f0ce4124d59f44e756751aaf7adfa3eed317a0fbcd8e768dd09bbb636f8f0d985e3e0620f0619a3a44f5823a736f47f2adeec1b1738e20e812004990e2dc022d6558e8615d56a2c5154aa35aeb5acf63059da65cab3d4f364c4595687cc5821b2c03e52e614e9efd78dad22bef73fe0e60692eb159993656993c750cfce5304886fb07bed43b7318b85cb6263f2f522b2bea98aee037d03ade0023de71fcc187b5bd65f165f005b4940521643aa585e3b5fb967cd08fad12fea8a3b60f9305357096bcb780fa375a3f0b0c094617dc73263395c4cde89fd416a0b6a4b9dc05a6df8527dd19101a49215be71dc9f4432eb192a704a5346311efd46f91e2ff5421b806a4ab0b43fc4aa8e95a62c0c6ae16fb303e5aefad143a8613b391bec91c5f085455e1a8db34d376ed9eb98a985c02a9d77238a3055acf5fd77a53c1313501b902c";

  const response = await fetch("https://www.melhorenvio.com.br/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      grant_type: "authorization_code",
      client_id: "24991",
      client_secret: "Q8ZeuUJ9C4DJgHTR2QWDc78Et2DyLUQ6Q2lFsWQB",
      redirect_uri: "https://ms-matias-style.vercel.app",
      code: code 
    })
  });

  const data = await response.json();

  console.log(data);

  res.json(data);

});

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});



  
