import crypto from "crypto"
import { metric } from "./metric";
import { Factory } from "@/usecase/@factory/factory";
import { EasytrackTcpServer } from "../server/tcp/easytrack.tcp";
import { Gt06TcpServer } from "../server/tcp/gt06.tcp";
import { EasytrackUdpServer } from "../server/udp/easytrack.udp";
import { Gt06UdpServer } from "../server/udp/gt06.udp";

process.on('uncaughtException', (error) => {
  console.error("UNCAUGHT EXCEPTION ON MAIN:", error);
});

async function main() {
  const hostname = process.env.HOSTNAME ?? "local"
  const uid = crypto.randomUUID()
  const { facade, repository } = await Factory.create({ uid })

  const easytracker_udp_server = new EasytrackUdpServer({
    onceData: facade.onceDataEasytrackUsecase.execute.bind(facade.onceDataEasytrackUsecase),
    onData: facade.onDataEasytrackUsecase.execute.bind(facade.onDataEasytrackUsecase),
    onClose: facade.onCloseUsecase.execute.bind(facade.onCloseUsecase)
  })

  const easytracker_tcp_server = new EasytrackTcpServer({
    onceData: facade.onceDataEasytrackUsecase.execute.bind(facade.onceDataEasytrackUsecase),
    onData: facade.onDataEasytrackUsecase.execute.bind(facade.onDataEasytrackUsecase),
    onClose: facade.onCloseUsecase.execute.bind(facade.onCloseUsecase)
  });

  const gt06_tcp_server = new Gt06TcpServer({
    onceData: facade.onceDataGt06Usecase.execute.bind(facade.onceDataGt06Usecase),
    onData: facade.onDataGt06Usecase.execute.bind(facade.onDataGt06Usecase),
    onClose: facade.onCloseUsecase.execute.bind(facade.onCloseUsecase)
  })

  const gt06_udp_server = new Gt06UdpServer({
    onceData: facade.onceDataGt06Usecase.execute.bind(facade.onceDataGt06Usecase),
    onData: facade.onDataGt06Usecase.execute.bind(facade.onDataGt06Usecase),
    onClose: facade.onCloseUsecase.execute.bind(facade.onCloseUsecase)
  })

  easytracker_udp_server.listen();
  easytracker_tcp_server.listen();
  gt06_tcp_server.listen();
  gt06_udp_server.listen();

  await metric({
    protocolRepository: repository.protocolRepository,
    uid,
    servers: [easytracker_tcp_server, gt06_tcp_server]
  });


  const updateConnectionsOnRedis = async () => {
    const connectionsArray = [easytracker_tcp_server, gt06_tcp_server].map(s => s.getConnections())
    const connections = connectionsArray.reduce((acc, cur) => acc += cur, 0)
    await repository.webhookRepository.set(hostname, connections)
  }

  setInterval(updateConnectionsOnRedis, 30000)

}



main()
