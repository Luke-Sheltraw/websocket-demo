// const WEB_SOCKET_URL = 'wss://websocket-demo-6ygb.onrender.com';
const WEB_SOCKET_URL = 'ws://localhost:8000';

const gameState = {
  webSocket: null,
  refreshIntervalFn: null,
  roomCode: null,
  self: {
    xPos: 0,
    yPos: 0,
    avatarEl: null,
  },
  opponent: {
    xPos: 0,
    yPos: 0,
    avatarEl: null,
  },
};

function sendMessage(messageContents) {
  gameState.webSocket.send(messageContents);
}

function displayMessage(messageContents) {
  const receivedMessageFeedEl = document.querySelector('#received_message_wrapper');

  const newMessageEl = document.createElement('p');
  newMessageEl.innerText = messageContents;

  receivedMessageFeedEl.prepend(newMessageEl);
}

function refreshOpponentAnimation() {
  gameState.opponent.avatarEl.style.transform = `translate(${
    gameState.opponent.xPos
  }px, ${
    gameState.opponent.yPos
  }px)`;
}

function startGame() {
  gameState.self.avatarEl = document.querySelector('#self_character');
  gameState.opponent.avatarEl = document.querySelector('#opponent_character');
  console.log(gameState.opponent.avatarEl);
  document.querySelector('#game_area').classList.remove('disabled');

  window.addEventListener('keydown', (e) => {
    switch (e.key) {
      case 'ArrowDown':
        gameState.self.yPos += 10;
      break;
      case 'ArrowUp':
        gameState.self.yPos -= 10;
      break;
      case 'ArrowRight':
        gameState.self.xPos += 10;
      break;
      case 'ArrowLeft':
        gameState.self.xPos -= 10;
      break;
    }
  });

  gameState.refreshIntervalFn = setInterval(() => {
    sendMessage(JSON.stringify({
      action: 'update_position',
      xPos: gameState.self.xPos,
      yPos: gameState.self.yPos,
    }));
  }, 100);
}

function endGame() {
  clearInterval(gameState.refreshIntervalFn);
}

function initializeWebSocket() {
  if (gameState.webSocket) {
    console.log('WebSocket already initialized; quitting');
  }

  gameState.webSocket = new WebSocket(WEB_SOCKET_URL, 'multiplayer-demo-protocol');

  gameState.webSocket.addEventListener('message', (e) => {
    const messageObj = JSON.parse(e.data);

    const action = messageObj.action;

    switch (action) {
      case 'join_instance':
        const roomCode = messageObj.roomCode;
        gameState.roomCode = roomCode;
        document.querySelector('#user_code_contents').value = roomCode;
      break;
      case 'start_game':
        startGame();
      break;
      case 'update_position':
        const xPos = messageObj.xPos;
        const yPos = messageObj.yPos;

        gameState.opponent.xPos= xPos;
        gameState.opponent.yPos= yPos;

        refreshOpponentAnimation();
      break;
      default:
      
    }

    displayMessage(e.data);
  })
}

function initializeChatListeners() {
  const sendButtonEl = document.querySelector('button#send_message');
  const messageContentsInputEl = document.querySelector('input#message_contents');

  sendButtonEl.addEventListener('click', () => sendMessage(messageContentsInputEl.value) );
  messageContentsInputEl.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage(messageContentsInputEl.value);
  });

  document.querySelector('button#join_code_button').addEventListener('click', () => {
    const enteredCode = document.querySelector('input#join_code_contents').value;

    sendMessage(JSON.stringify({
      action: 'join_instance',
      roomCode: enteredCode,
    }));
  });
}

function init() {
  initializeWebSocket();
  initializeChatListeners();
}

window.addEventListener('DOMContentLoaded', init);