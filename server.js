const express = require("express");
const cors = require("cors");
const { MercadoPagoConfig, Preference } = require("mercadopago");
const db = require("./database.js");

const app = express();

app.use(cors());
app.use(express.json());

const client = new MercadoPagoConfig({
  accessToken: "APP_USR-6498416472210940-051420-58c6f52200361da5cb99befae642591b-3403641746"
});


app.get("/pedidos", (req, res) => {

  db.all(
    "SELECT * FROM pedidos ORDER BY id DESC",
    [],
    (err, rows) => {

      if(err){
        return res.status(500).json({
          erro:"Erro ao buscar pedidos"
        });
      }

      res.json(rows);

    }
  );

});
app.post("/atualizar-status", (req, res) => {

  const { id, status } = req.body;

  db.run(
    "UPDATE pedidos SET status = ? WHERE id = ?",
    [status, id],
    function(err){

      if(err){
        return res.status(500).json({
          erro: "Erro ao atualizar status"
        });
      }

      res.json({
        sucesso: true
      });
    }
  );
});
app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});