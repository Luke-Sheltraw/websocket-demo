import { server } from 'websocket';
import { generateGameCode } from './util.js';
import * as http from 'node:http';
import { randomUUID } from 'crypto';

const PORT = process.env.PORT || 8000;
const OFFERED_PROTOCOL = 'multiplayer-demo-protocol';

const webSocketServer = new server({
  httpServer: http.createServer().listen(PORT),
  autoAcceptConnections: false,
});

console.log('Server online');

const gameInstancesByGameCode = {};
const gameInstancesByPlayerUUID = {};

/**
 * For a given connection, sends stringified version of object for re-parsing on other side
 * 
 * @param { connection } webSocketConnection 
 * @param { any } object 
 * @returns { void }
 */
function sendObject(webSocketConnection, object) {
  webSocketConnection.sendUTF(JSON.stringify(object));
} /* sendObject */

/**
 * Start game by sending 'start_game' code to all child connections.
 * 
 * @param { number } gameCode
 * @returns { void }
 */
function startGame(gameCode) {
  const gameInstance = gameInstancesByGameCode[gameCode];

  gameInstance.playConnections.forEach((webSocketConnection) => {
    sendObject(webSocketConnection, {
      action: 'start_game',
    });
  });

  console.log(`Game ${ gameCode } started`);
} /* startGame */

/**
 * For a given connection, leaves the game instance they are currently member to
 * 
 * @param { connection } webSocketConnection 
 * @returns { void }
 */
function leaveInstance(webSocketConnection) {
  const gameInstance =  gameInstancesByPlayerUUID[webSocketConnection.playerUUID];
  
  gameInstance.playConnections = gameInstance.playConnections.filter((conn) => conn != webSocketConnection);
  delete gameInstancesByPlayerUUID[webSocketConnection.playerUUID];
} /* leaveInstance */

/**
 * For a given connection, joins the game instance corresponding to the gameCode
 * 
 * @param { connection } webSocketConnection 
 * @param { number } gameCode 
 * @returns { void }
 */
function joinInstance(webSocketConnection, gameCode) {
  const gameInstance = gameInstancesByGameCode[gameCode];

  if (gameInstance.playConnections.includes(webSocketConnection)) {
    console.log(`Game ${ gameCode } rejected connection: already exists`);
    return;
  }

  leaveInstance(webSocketConnection);
  gameInstancesByPlayerUUID[webSocketConnection.playerUUID] = gameInstance;
  gameInstance.playConnections.push(webSocketConnection);

  sendObject(webSocketConnection, {
    action: 'join_instance',
    gameCode,
  });

  console.log(`Secondary player joined instance with room code ${ gameCode }`);

  startGame(gameCode);
} /* joinInstance */

/**
 * For a given connection, alerts other player of new position
 * 
 * @param { connection } webSocketConnection 
 * @param { number } xPos
 * @param { number } yPos
 * @returns { void }
 */
function updatePosition(webSocketConnection, xPos, yPos) {
  gameInstancesByPlayerUUID[webSocketConnection.playerUUID]
    .playConnections
    .filter((conn) => conn !== webSocketConnection)
    .forEach((conn) => {
      sendObject(conn, {
        action: 'update_position',
        xPos,
        yPos,
    });
  });
} /* updatePosition */

/**
 * Accepts a given WebSocket connection request
 * 
 * @param { request } webSocketRequest
 * @returns { connection }
 */
function acceptRequest(webSocketRequest) {
  const webSocketConnection = webSocketRequest.accept(OFFERED_PROTOCOL, webSocketRequest.origin);  
  webSocketConnection.playerUUID = randomUUID();

  return webSocketConnection;
} /* acceptConnectionRequest */

/**
 * Creates a new game instance and links it to given player
 * 
 * @param { connection } webSocketConnection
 * @returns { void }
 */
function createInstance(webSocketConnection) {
  const gameInstance = {
    gameCode: generateGameCode(),
    playConnections: [webSocketConnection],
  }

  gameInstancesByGameCode[gameInstance.gameCode] = gameInstance;
  gameInstancesByPlayerUUID[webSocketConnection.playerUUID] = gameInstance;

  sendObject(webSocketConnection, {
    action: 'join_instance',
    gameCode: gameInstance.gameCode,
  });
} /* createInstance */

/**
 * Handles a new request to the WebSocket server
 * 
 * @param { request } webSocketRequest
 * @returns { void }
 */
function handleRequest(webSocketRequest) {
  console.log(`Request received at "${ webSocketRequest.remoteAddress }"`);

  const webSocketConnection = acceptRequest(webSocketRequest);  

  console.log(`WebSocket connected at "${ webSocketConnection.remoteAddress }"`);

  createInstance(webSocketConnection);

  /**
   * Handles close event for a given WebSocket connection
   * 
   * @param { number } code 
   * @param { string } desc
   * @returns { void }
   */
  function handleClose(code, desc) {
    console.log(`WebSocket disconnected at "${ webSocketConnection.remoteAddress }" with code "${ code }" and desc "${ desc }"`);
  } /* handleClose */

  /**
   * Handles message event for a given WebSocket connection
   * 
   * @param { { type: 'utf8'|'binary', utf8Data: string, binaryData: binaryDataBuffer} } data
   * @returns { void }
   */
  function handleMessage(data) {
    console.log(`Message received at "${ webSocketConnection.remoteAddress }": "${ data.utf8Data }"`);

    const messageObj = JSON.parse(data.utf8Data);

    switch (messageObj.action) {
      case 'join_instance':
        joinInstance(webSocketConnection, messageObj.gameCode);
      break;
      case 'update_position':
        updatePosition(webSocketConnection, +messageObj.xPos, +messageObj.yPos);
      break;
    }
  } /* handleMessage */

  webSocketConnection.on('close', handleClose);
  webSocketConnection.on('message', handleMessage);
} /* handleRequest */

webSocketServer.on('request', handleRequest);