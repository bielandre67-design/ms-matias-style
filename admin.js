async function carregarPedidos(){
  const lista = document.getElementById("listaPedidos");

  lista.innerHTML = "<p>Carregando pedidos...</p>";

  try{
    const resposta = await fetch("https://ms-matias-style.onrender.com/pedidos")
    const pedidos = await resposta.json();

    if(pedidos.length === 0){
      lista.innerHTML = "<p>Nenhum pedido encontrado.</p>";
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

  await fetch("https://ms-matias-style.onrender.com/atualizar-status", {, {

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