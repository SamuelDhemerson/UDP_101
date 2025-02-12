import { UDPServer } from "../server/udp/server";

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION ON MAIN:", error);
});

async function main() {
  const udp_server = new UDPServer({
    onMessage: ({ data, socket, rinfo }) => {
      console.log("RECEIVED FROM: ", rinfo.port, rinfo.address);
      socket.send(`${data}\n`, rinfo.port, rinfo.address);
    },
    onceMessage: ({ data, socket, rinfo }) => {
      console.log("RECEIVED FROM: ", rinfo.port, rinfo.address);
      socket.send(`${data}\n`, rinfo.port, rinfo.address);
    },
    onError: ({ message }) => console.log("ERROR: ", message),
    port: 3000,
    timeout: 600,
  });

  udp_server.listen();
}

main();
