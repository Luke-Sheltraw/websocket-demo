import { server } from 'websocket';
import * as http from "node:http";

const PORT = process.env.PORT || 8000;

const httpServer = http.createServer();

httpServer.listen(PORT);

const webSocketServer = new server({
  httpServer,
  autoAcceptConnections: false,
});

console.log('Server online');

console.log(webSocketServer);

let webSocketConnections = [];

webSocketServer.on('request', (webSocketRequest) => {
  console.log(`Request received at "${ webSocketRequest.remoteAddress }"`);

  const webSocketConnection = webSocketRequest.accept('multiplayer-demo-protocol', webSocketRequest.origin);  

  console.log(`WebSocket connected at "${ webSocketConnection.remoteAddress }"`);

  webSocketConnections.push(webSocketConnection);

  webSocketConnection.on('close', (code, desc) => {
    console.log(`WebSocket disconnected at "${ webSocketConnection.remoteAddress }" with code "${ code }" and desc "${ desc }"`);
    webSocketConnections = webSocketConnections.filter((con) => con !== webSocketConnection);
  });

  webSocketConnection.on('message', (data) => {
    console.log(`Message received at "${ webSocketConnection.remoteAddress }": "${ data.utf8Data }"`);

    webSocketConnections.forEach((webSocketConnection) => {
      webSocketConnection.sendUTF(data.utf8Data);
    })
  })
});


webSocketServer.on('close', (webSocketConnection, closeReason, description) => {
  console.log(description);
});