import http from "http"

interface Constructor {
  port: number
  requestListener: http.RequestListener
}

export class HTTPServer {
  private _server: http.Server
  private _port: number

  constructor(props: Constructor) {
    this._port = props.port
    this._server = http.createServer(props.requestListener);
  }

  listen() {
    this._server.listen(this._port, () => console.info("HTTP SERVER STARTED AT PORT", this._port))
  }
}