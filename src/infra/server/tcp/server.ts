import net from 'node:net'

export namespace Server {
  export namespace Socket {
    export type OnceData<Socket> = (params: { data: Buffer, socket: Socket }) => void
    export type OnData<Socket> = (params: { data: Buffer, socket: Socket }) => void
    export type OnClose<Socket> = (params: { socket: Socket }) => void
    export type OnConnect<Socket> = (params: { socket: Socket }) => void
    export type OnDrain<Socket> = (params: { socket: Socket }) => void
    export type OnEnd<Socket> = (params: { socket: Socket }) => void
    export type OnError<Socket> = (params: { socket: Socket, error: Error }) => void
    export type OnLookup<Socket> = (params: {
      socket: Socket,
      error: Error,
      address: string,
      family: string | number,
      host: string
    }) => void
    export type OnReady<Socket> = (params: { socket: Socket }) => void
    export type OnTimeout<Socket> = (params: { socket: Socket }) => void
  }

  export namespace Server {
    export type OnError = (params: { error: Error }) => void
    export type OnDrop = (params: { data?: net.DropArgument }) => void
    export type OnClose = () => void
  }
}

interface ServerProps<Socket extends net.Socket> {
  socket?: {
    onData?: Server.Socket.OnData<Socket>
    onceData?: Server.Socket.OnceData<Socket>
    onClose?: Server.Socket.OnClose<Socket>
    onConnect?: Server.Socket.OnConnect<Socket>
    onDrain?: Server.Socket.OnDrain<Socket>
    onEnd?: Server.Socket.OnEnd<Socket>
    onError?: Server.Socket.OnError<Socket>
    onLookup?: Server.Socket.OnLookup<Socket>
    onReady?: Server.Socket.OnReady<Socket>
    onTimeout?: Server.Socket.OnTimeout<Socket>
  }
  server?: {
    onClose?: Server.Server.OnClose
    onDrop?: Server.Server.OnDrop
    onError?: Server.Server.OnError
  }
  timeout: number
  maxConnections?: number
  port: number
}

process.on('uncaughtException', (error) => {
  console.error("UNCAUGHT EXCEPTION ON SERVER CLASS:", error);
});

export class Server<Socket extends net.Socket = net.Socket> {
  private _server: net.Server

  private _onServerClose?: Server.Server.OnClose
  private _onServerDrop?: Server.Server.OnDrop
  private _onServerError?: Server.Server.OnError

  private _onceSocketData?: Server.Socket.OnceData<Socket>
  private _onSocketClose?: Server.Socket.OnClose<Socket>
  private _onSocketConnect?: Server.Socket.OnConnect<Socket>
  private _onSocketDrain?: Server.Socket.OnDrain<Socket>
  private _onSocketEnd?: Server.Socket.OnEnd<Socket>
  private _onSocketError?: Server.Socket.OnError<Socket>
  private _onSocketLookup?: Server.Socket.OnLookup<Socket>
  private _onSocketReady?: Server.Socket.OnReady<Socket>
  private _onSocketData?: Server.Socket.OnData<Socket>
  private _onSocketTimeout?: Server.Socket.OnTimeout<Socket>

  private _timeout: number
  private _port: number
  private _maxConnections?: number
  private _connectionsCount: number = 0

  constructor(props: ServerProps<Socket>) {
    this._server = net.createServer()
    this._onServerClose = props?.server?.onClose
    this._onServerDrop = props?.server?.onDrop
    this._onServerError = props?.server?.onError

    this._onceSocketData = props?.socket?.onceData
    this._onSocketClose = props?.socket?.onClose
    this._onSocketConnect = props?.socket?.onConnect
    this._onSocketData = props?.socket?.onData
    this._onSocketDrain = props?.socket?.onDrain
    this._onSocketEnd = props?.socket?.onEnd
    this._onSocketError = props?.socket?.onError
    this._onSocketLookup = props?.socket?.onLookup
    this._onSocketReady = props?.socket?.onReady
    this._onSocketTimeout = props?.socket?.onTimeout

    this._timeout = props.timeout
    this._port = props.port
    this._maxConnections = props?.maxConnections
    this._maxConnections && (this._server.maxConnections = this._maxConnections)
  }

  private async handleSocketConnection(socket: Socket) {
    socket.setTimeout(this._timeout)
    socket.setKeepAlive(true)
    // socket.setNoDelay(true)

    this._connectionsCount += 1

    socket.once("data", (data) => this._onceSocketData?.({ data, socket }))
    socket.on("close", () => { this._connectionsCount -= 1; this._onSocketClose?.({ socket }) })
    socket.on("connect", () => this._onSocketConnect?.({ socket }))
    socket.on("data", (data) => this._onSocketData?.({ data, socket }))
    socket.on("drain", () => this._onSocketDrain?.({ socket }))
    socket.on("end", () => this._onSocketEnd?.({ socket }))
    socket.on("error", (error) => this._onSocketError?.({ socket, error }))
    socket.on("lookup", (error, address, family, host) => this._onSocketLookup?.({
      socket,
      error,
      address,
      family,
      host
    }))
    socket.on("ready", () => this._onSocketReady?.({ socket }))
    socket.on("timeout", () => this._onSocketTimeout?.({ socket }))
  }

  listen() {
    this._server.listen(this._port, () => console.info(`TCP SERVER STARTED AT PORT ${this._port}`))
    this._server.on("connection", (socket: Socket) => this.handleSocketConnection(socket))
    this._server.on("close", () => this._onServerClose?.())
    this._server.on("drop", (data) => this._onServerDrop?.({ data }))
    this._server.on("error", (error) => this._onServerError?.({ error }))
  }

  getConnections(): number {
    // return new Promise<number>((resolve) => {
    //   let connections = NaN
    //   this._server.getConnections((err, count) => {
    //     if (!err) (connections = count);
    //     resolve(connections)
    //   })
    // })
    return this._connectionsCount
  }

  ping() {
    return this._server.listening
  }
}
