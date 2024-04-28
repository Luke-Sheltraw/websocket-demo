const WEB_SOCKET_URL = 'wss://websocket-demo-6ygb.onrender.com';
// const WEB_SOCKET_URL = 'ws://localhost:8000';

let webSocket;

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

  webSocket.addEventListener('open', () => {
    webSocket.send('Open event received');
  });

  webSocket.addEventListener('message', (e) => {
    console.log('Message receieved: ', e.data);
    displayMessage(e.data);
  })
}

function initializeChatListeners() {
  const sendButtonEl = document.querySelector('button#send_message');
  const messageContentsInputEl = document.querySelector('input#message_contents');

  sendButtonEl.addEventListener('click', () => sendMessage(messageContentsInputEl.value) );
}

function init() {
  initializeWebSocket();
  initializeChatListeners();
}

window.addEventListener('DOMContentLoaded', init);