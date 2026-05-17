const sqlite3 = require("sqlite3").verbose();

const db = new sqlite3.Database("./ms.db");

db.serialize(() => {

  db.run(`
    
    CREATE TABLE IF NOT EXISTS pedidos (

      id INTEGER PRIMARY KEY AUTOINCREMENT,

      nome TEXT,
      telefone TEXT,

      cep TEXT,
      rua TEXT,
      numero TEXT,
      complemento TEXT,
      bairro TEXT,
      cidade TEXT,
      estado TEXT,

      itens TEXT,

      total REAL,

      status TEXT,

      data DATETIME DEFAULT CURRENT_TIMESTAMP

    )

  `);

});

module.exports = db;