import { UDPServer } from "../server/udp/server";
import dgram from "dgram";

process.on("uncaughtException", (error) => {
  console.error("UNCAUGHT EXCEPTION ON MAIN:", error);
});

const handleMessage = ({
  data,
  socket,
  rinfo,
  echo,
  udp_server,
}: {
  data: Buffer;
  rinfo: dgram.RemoteInfo;
  socket: dgram.Socket;
  echo: any;
  udp_server: UDPServer;
}) => {
  const data_received = data.toString();
  if (data_received === "LIST CLIENTS") {
    const clients = udp_server.getClients();
    socket.send(
      `${JSON.stringify(
        clients.map((c) => `${c.rinfo.address}:${c.rinfo.port}`)
      )}\n`,
      rinfo.port,
      rinfo.address
    );
    return;
  }
  if (data_received.startsWith("SEND")) {
    const question = data_received.split(" ");
    const [_, host, ...rest] = question;
    const [address, port] = host.split(":");
    socket.send(Buffer.from(rest.join(" ")), Number(port), address);
    return;
  }
  if (data_received.startsWith("REGISTER")) {
    const question = data_received.split(" ");
    const [_, host, ...rest] = question;
    const [address, port] = host.split(":");
    echo.port = port;
    echo.address = address;
    socket.send(Buffer.from("REGISTERED\n"), Number(port), address);
    return;
  }
  console.info(
    `[RECEIVED DATA FROM ${rinfo.address}:${rinfo.port}]: `,
    data.toString()
  );
  if (Object.keys(echo).length > 0) {
    socket.send(data, echo.port, echo.address);
  }
};

async function main() {
  const echo: any = {};
  const udp_server = new UDPServer({
    onMessage: ({ data, socket, rinfo }) => {
      handleMessage({ data, socket, rinfo, echo, udp_server });
    },
    onceMessage: ({ data, socket, rinfo }) => {
      handleMessage({ data, socket, rinfo, echo, udp_server });
    },
    onError: ({ message }) => console.log("ERROR: ", message),
    port: 3000,
    timeout: 60 * 5 * 1000,
  });

  udp_server.listen();
}

main();
