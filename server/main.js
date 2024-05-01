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

const gameInstancesByRoom = {};
const roomsByConnection = {};

webSocketServer.on('request', (webSocketRequest) => {
  console.log(`Request received at "${ webSocketRequest.remoteAddress }"`);

  const webSocketConnection = webSocketRequest.accept('multiplayer-demo-protocol', webSocketRequest.origin);  

  console.log(`WebSocket connected at "${ webSocketConnection.remoteAddress }"`);

  const roomCode = Math.floor(Math.random() * 9000) + 1000;

  webSocketConnection.sendUTF(JSON.stringify({
    action: 'join_instance',
    roomCode,
  }));

  gameInstancesByRoom[roomCode] = {
    roomCode,
    adminPlayerConnection: webSocketConnection,
  }
  roomsByConnection[webSocketConnection] = roomCode;

  webSocketConnections.push(webSocketConnection);

  webSocketConnection.on('close', (code, desc) => {
    console.log(`WebSocket disconnected at "${ webSocketConnection.remoteAddress }" with code "${ code }" and desc "${ desc }"`);
    webSocketConnections = webSocketConnections.filter((con) => con !== webSocketConnection);
  });

  webSocketConnection.on('message', (data) => {
    console.log(`Message received at "${ webSocketConnection.remoteAddress }": "${ data.utf8Data }"`);

    const messageObj = JSON.parse(data.utf8Data);

    const action = messageObj.action;

    console.log(action);

    switch (action) {
      case 'join_instance':
        const roomCode = messageObj.roomCode;
        console.log(`Secondary player joined instance with room code ${ roomCode }`);
        gameInstancesByRoom[roomCode].secondaryPlayerConnection = webSocketConnection;
        roomsByConnection[webSocketConnection] = roomCode;

        // console.log(webSocketConnection);
        webSocketConnection.sendUTF(JSON.stringify({
          action: 'join_instance',
          roomCode,
        }));

        webSocketConnection.sendUTF(JSON.stringify({
          action: 'start_game',
        }));

        gameInstancesByRoom[roomCode].adminPlayerConnection.sendUTF(JSON.stringify({
          action: 'start_game',
        }));
      break;
      case 'update_position':
        const xPos = messageObj.xPos;
        const yPos = messageObj.yPos;

        const gameInstance = gameInstancesByRoom[roomsByConnection[webSocketConnection]];
        const targetConnection = webSocketConnection === gameInstance.adminPlayerConnection
          ? gameInstance.secondaryPlayerConnection
          : gameInstance.adminPlayerConnection; // choose opposite connection

        targetConnection.sendUTF(JSON.stringify({
          action: 'update_position',
          xPos,
          yPos,
        }));
      break;
      default:
      
    }
  })
});


webSocketServer.on('close', (webSocketConnection, closeReason, description) => {
  console.log(description);
});