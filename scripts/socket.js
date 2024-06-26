const WEB_SOCKET_URL = 'wss://websocket-demo-6ygb.onrender.com';
// const WEB_SOCKET_URL = 'ws://localhost:8000';
const REQUESTED_PROTOCOL = 'multiplayer-demo-protocol';

const gameState = {
  webSocket: null,
  refreshIntervalFn: null,
  gameCode: null,
  self: {
    xPos: 0,
    yPos: 0,
    avatarEl: null,
    pendingUpdate: true,
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

function refreshOpponentAnimation() {
  gameState.opponent.avatarEl.style.transform = `translate(${
    gameState.opponent.xPos
  }px, ${
    gameState.opponent.yPos
  }px)`;
}

function refreshSelfAnimation() {
  gameState.self.avatarEl.style.transform = `translate(${
    gameState.self.xPos
  }px, ${
    gameState.self.yPos
  }px)`;
}

function startGame() {
  gameState.self.avatarEl = document.querySelector('#self_character');
  gameState.opponent.avatarEl = document.querySelector('#opponent_character');

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
      default: return;
    }

    gameState.self.pendingUpdate = true;
    refreshSelfAnimation();
  });

  gameState.refreshIntervalFn = setInterval(() => {
    if (!gameState.self.pendingUpdate) return;
    sendMessage(JSON.stringify({
      action: 'update_position',
      xPos: gameState.self.xPos,
      yPos: gameState.self.yPos,
    }));
    gameState.self.pendingUpdate = false;
  }, 33);
}

function endGame() {
  clearInterval(gameState.refreshIntervalFn);
}

function initializeWebSocket() {
  if (gameState.webSocket) {
    console.log('WebSocket already initialized; quitting');
  }

  gameState.webSocket = new WebSocket(WEB_SOCKET_URL, REQUESTED_PROTOCOL);

  gameState.webSocket.addEventListener('message', (e) => {
    const messageObj = JSON.parse(e.data);

    switch (messageObj.action) {
      case 'join_instance':
        const gameCode = messageObj.gameCode;
        gameState.gameCode = gameCode;
        document.querySelector('#user_code_contents').value = gameCode;
      break;
      case 'start_game':
        startGame();
        document.querySelector('#join_code_button').disabled = true;
        document.querySelector('#join_code_contents').disabled = true;
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
  });
}

function initializeEventListeners() {
  document.querySelector('button#join_code_button').addEventListener('click', () => {
    const enteredCode = document.querySelector('input#join_code_contents').value;

    sendMessage(JSON.stringify({
      action: 'join_instance',
      gameCode: enteredCode,
    }));
  });
}

function init() {
  initializeWebSocket();
  initializeEventListeners();
}

window.addEventListener('DOMContentLoaded', init);