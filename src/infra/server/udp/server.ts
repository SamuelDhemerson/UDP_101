import dgram from 'node:dgram';
import { clearInterval } from 'node:timers';

export namespace UDPServer {
  export type OnMessage = (params: {
    data: Buffer, rinfo: dgram.RemoteInfo, socket: dgram.Socket
  }) => void;
  export type OnceMessage = (params: {
    data: Buffer, rinfo: dgram.RemoteInfo, socket: dgram.Socket
  }) => void;
  export type OnTimeout = (params: { rinfo: dgram.RemoteInfo }) => void;
  export type OnError = (error: Error) => void;
}

interface UDPServerProps {
  onMessage?: UDPServer.OnMessage;
  onceMessage?: UDPServer.OnceMessage
  onTimeout?: UDPServer.OnTimeout
  onError?: UDPServer.OnError;
  port: number;
  timeout: number
}

interface Client {
  rinfo: dgram.RemoteInfo
  timestamp: number
}
export class UDPServer {
  private _socket: dgram.Socket;
  private _port: number;
  private _clients: Map<string, Client>
  private _timeout: number
  private _interval_id: NodeJS.Timer

  constructor(props: UDPServerProps) {
    this._socket = dgram.createSocket('udp4')
    this._port = props.port;

    this._socket.on('message', this.handleOnMessage.bind(this, props));
    this._socket.on('error', this.handleOnError.bind(this, props));

    this._clients = new Map()

    this._timeout = props.timeout
    this._interval_id = setInterval(this.handleOnTimeout.bind(this, props), this._timeout)
  }

  listen() {
    this._socket.bind(this._port);
    console.info(`UDP SERVER STARTED AT PORT ${this._port}`);
  }

  handleOnMessage(props: UDPServerProps, data: Buffer, rinfo: dgram.RemoteInfo) {
    const key = `${rinfo.address}:${rinfo.port}`
    const client: Client = { rinfo, timestamp: Date.now() }

    if (!this._clients.get(key)) {
      this._clients.set(key, client)
      props.onceMessage?.({ data, rinfo, socket: this._socket })
    } else {
      this._clients.set(key, client)
      props.onMessage?.({ data, rinfo, socket: this._socket })
    }
  }

  handleOnError(props: UDPServerProps, error: Error) {
    console.error(error)
    console.error(Object.keys(error))
    props?.onError(error)
  }

  async handleOnTimeout(props: UDPServerProps) {
    const current_timestamp = Date.now()
    for (let [key, value] of this._clients.entries()) {
      const { timestamp: last_timestamp, rinfo } = value
      const isIdle = current_timestamp - last_timestamp >= this._timeout
      if (isIdle) {
        this._clients.delete(key)
        props?.onTimeout({ rinfo })
      }
    }
  }

  close() {
    if (typeof this._interval_id === "number") {
      clearInterval(this._interval_id)
    }
    this._socket.close();
  }
}