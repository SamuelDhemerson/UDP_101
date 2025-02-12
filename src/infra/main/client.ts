const dgram = require("dgram");

// Cria o socket UDP do cliente
const client = dgram.createSocket("udp4");

// Evento para receber mensagens do servidor
client.on(
  "message",
  (msg: { toString: () => any }, rinfo: { address: any; port: any }) => {
    client.send(`${msg.toString()} from client`, rinfo.port, rinfo.address);
    console.log(
      `Mensagem recebida do servidor ${rinfo.address}:${
        rinfo.port
      }: ${msg.toString()}`
    );
  }
);

// Função para enviar uma mensagem ao servidor
function enviarMensagem(mensagem: string) {
  const buffer = Buffer.from(mensagem);
  client.send(buffer, 0, buffer.length, 3000, "localhost", (err: any) => {
    if (err) {
      console.error("Erro ao enviar mensagem:", err);
      client.close();
    } else {
      console.log(`Mensagem enviada: "${mensagem}"`);
    }
  });
}

enviarMensagem("INIT");
