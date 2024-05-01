const WEB_SOCKET_URL = 'wss://websocket-demo-6ygb.onrender.com';
// const WEB_SOCKET_URL = 'ws://localhost:8000';

let webSocket;
const gameState = {
  roomCode: null,
};

function sendMessage(messageContents) {
  webSocket.send(messageContents);
}

function displayMessage(messageContents) {
  const receivedMessageFeedEl = document.querySelector('#received_message_wrapper');

  const newMessageEl = document.createElement('p');
  newMessageEl.innerText = messageContents;

  receivedMessageFeedEl.append(newMessageEl);
}

function initializeWebSocket() {
  if (webSocket) {
    console.log('WebSocket already initialized; quitting');
    return;
  }

  webSocket = new WebSocket(WEB_SOCKET_URL, 'multiplayer-demo-protocol');

  let gameJoined = false;

  // webSocket.addEventListener('open', () => {
  //   webSocket.send('Open event received');
  // });

  webSocket.addEventListener('message', (e) => {
    if (!gameJoined) {
      console.log(JSON.parse(e.data));
      const roomCode = JSON.parse(e.data).roomCode;
      if (roomCode) {
        gameJoined = true;
        gameState.roomCode = roomCode;
        document.querySelector('#user_code_contents').value = roomCode;
      }
    }

    console.log('Message receieved: ', e.data);
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

    sendMessage(JSON.stringify({ roomCode: enteredCode }));
  });
}

function init() {
  initializeWebSocket();
  initializeChatListeners();
}

window.addEventListener('DOMContentLoaded', init);