async function carregarPedidos(){
  const lista = document.getElementById("listaPedidos");

  lista.innerHTML = `
<div class="lista-vazia">
    <h3>Carregando pedidos...</h3>
    <p>Sincronizando painel MS</p>
</div>
`;

  try{
    const resposta = await fetch("https://ms-matias-style.onrender.com/pedidos")
    const pedidos = await resposta.json();

    if(pedidos.length === 0){
     lista.innerHTML = `
<div class="lista-vazia">
    <h3>Nenhum pedido ainda</h3>
    <p>Quando alguém comprar na MS os pedidos aparecerão aqui.</p>
</div>
`;
      return;
    }

    lista.innerHTML = "";

    pedidos.forEach((pedido) => {
      const itens = JSON.parse(pedido.itens);

      lista.innerHTML += `
        <div class="pedido-card">
          <div class="pedido-topo">
            <h2>Pedido #${pedido.id}</h2>
           <span class="status ${pedido.status === 'enviado' ? 'enviado' : ''}">
  ${pedido.status}
</span>
          </div>

          <p><strong>Cliente:</strong> ${pedido.nome || "Não informado"}</p>
          <p><strong>Telefone:</strong> ${pedido.telefone || "Não informado"}</p>

          <p><strong>Endereço:</strong> 
            ${pedido.rua}, ${pedido.numero} - ${pedido.bairro}, 
            ${pedido.cidade}/${pedido.estado}
          </p>

          <p><strong>CEP:</strong> ${pedido.cep}</p>
          <p><strong>Complemento:</strong> ${pedido.complemento || "Sem complemento"}</p>
<button class="btn-copiar" onclick="copiarEndereco('${pedido.rua}', '${pedido.numero}', '${pedido.bairro}', '${pedido.cidade}', '${pedido.estado}', '${pedido.cep}', '${pedido.complemento || ""}')">
  Copiar endereço
</button>
<button class="btn-enviado"
onclick="marcarEnviado(${pedido.id})">
Marcar como enviado
</button>
          <h3>Itens</h3>
          ${itens.map(item => `
            <p>
              ${item.quantidade}x ${item.nome} - Tam. ${item.tamanho}
              | R$ ${Number(item.preco).toFixed(2).replace(".", ",")}
            </p>
          `).join("")}

          <p class="total"><strong>Total:</strong> R$ ${Number(pedido.total).toFixed(2).replace(".", ",")}</p>
          <small>${pedido.data}</small>
        </div>
      `;
    });

  }catch(erro){
    console.log(erro);
    lista.innerHTML = "<p>Erro ao carregar pedidos.</p>";
  }
}

carregarPedidos();
function copiarEndereco(rua, numero, bairro, cidade, estado, cep, complemento){

  const endereco = `
${rua}, ${numero}
${bairro}
${cidade}/${estado}
CEP: ${cep}
Complemento: ${complemento || "Sem complemento"}
  `;

  navigator.clipboard.writeText(endereco);

  alert("Endereço copiado!");
}
async function marcarEnviado(id){

await fetch("https://ms-matias-style.onrender.com/atualizar-status", {

    method:"POST",

    headers:{
      "Content-Type":"application/json"
    },

    body: JSON.stringify({
      id:id,
      status:"enviado"
    })

  });

  carregarPedidos();
}
const API = "https://ms-matias-style.onrender.com";

async function carregarPedidos() {
  const lista = document.getElementById("listaPedidos");

  lista.innerHTML = "Carregando pedidos...";

  try {
    const resposta = await fetch(`${API}/pedidos`);
    const pedidos = await resposta.json();

    document.getElementById("totalPedidos").innerText = pedidos.length;
    document.getElementById("pedidosPagos").innerText =
      pedidos.filter(p => p.status === "pago").length;
    document.getElementById("pedidosPendentes").innerText =
      pedidos.filter(p => p.status !== "pago").length;

    if (pedidos.length === 0) {

  lista.innerHTML = `
    <div class="lista-vazia">
      <h3>Nenhum pedido ainda</h3>
      <p>Quando alguém comprar na MS os pedidos aparecerão aqui.</p>
    </div>
  `;

  return;
}

    lista.innerHTML = pedidos.map(pedido => {
      const produtos = JSON.parse(pedido.items || "[]");

      const textoProdutos = produtos.map(item => `
        <p>
          <strong>${item.nome}</strong><br>
          Tamanho: ${item.tamanho || "-"} |
          Qtd: ${item.quantidade || 1} |
          R$ ${Number(item.preco).toFixed(2).replace(".", ",")}
        </p>
      `).join("");

      const mensagemWhats = encodeURIComponent(
        `Olá ${pedido.nome}, recebemos seu pedido na MS Matias Style!\n\nPedido: #${pedido.id}\nStatus: ${pedido.status}\nTotal: R$ ${Number(pedido.total).toFixed(2).replace(".", ",")}\n\nObrigado pela compra!`
      );

      return `
        <div class="pedido">
          <div class="pedido-topo">
            <h3>Pedido #${pedido.id}</h3>
            <span class="status ${pedido.status}">${pedido.status}</span>
          </div>

          <div class="info">
            <p><strong>Cliente:</strong> ${pedido.nome}</p>
            <p><strong>WhatsApp:</strong> ${pedido.telefone}</p>
            <p><strong>CEP:</strong> ${pedido.cep}</p>
            <p><strong>Endereço:</strong> ${pedido.rua}, ${pedido.numero} - ${pedido.bairro}, ${pedido.cidade}/${pedido.estado}</p>
            <p><strong>Complemento:</strong> ${pedido.complemento || "-"}</p>
            <p><strong>Total:</strong> R$ ${Number(pedido.total).toFixed(2).replace(".", ",")}</p>
            <p><strong>Data:</strong> ${pedido.data}</p>
          </div>

          <div class="produtos">
            <h4>Produtos</h4>
            ${textoProdutos}
          </div>

          <div class="acoes">
            <button class="btn-pago" onclick="atualizarStatus(${pedido.id}, 'pago')">Marcar pago</button>
            <button class="btn-enviado" onclick="atualizarStatus(${pedido.id}, 'enviado')">Marcar enviado</button>
            <a href="https://wa.me/55${pedido.telefone}?text=${mensagemWhats}" target="_blank">
              <button class="btn-whats">Chamar no WhatsApp</button>
            </a>
          </div>
        </div>
      `;
    }).join("");

  } catch (erro) {
    console.log(erro);
    lista.innerHTML = "Erro ao carregar pedidos.";
  }
}

async function atualizarStatus(id, status) {
  await fetch(`${API}/atualizar-status`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ id, status })
  });

  carregarPedidos();
}

carregarPedidos();

function logoutADM() {
    localStorage.removeItem("adminLogado");
    window.location.href = "login.html";
}