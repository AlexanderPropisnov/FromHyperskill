
    const inputField = document.getElementById('input-msg');
    const sendButton = document.getElementById('send-msg-btn');
    const messagesContainer = document.getElementById('messages');
    const usernameInput = document.getElementById('input-username');
    const sendUsernameButton = document.getElementById('send-username-btn');
    const chatSection = document.getElementById('chatSection');
    const onlineUsersContainer = document.getElementById('onlineUsers');
    let isConnected = false;
    let username = '';
    let currentChatType = 'public';
    let currentChatUser = '';
    const chatWithDisplay = document.getElementById('chat-with');
    const publicChatButton = document.getElementById('public-chat-btn');

    let unreadMessageCounts = {};



publicChatButton.addEventListener('click', function() {

    currentChatType = 'public'; // Set the current chat type to public
    currentChatUser = ''; // Clear the current chat user

    // Update the chat display
    updateCurrentChatDisplay();
unreadMessageCounts = {};
    // Optionally, you may want to clear the message area when switching chats
    clearMessages();
    if (username && stompClient) {
            stompClient.send("/app/chat.requestHistory", {}, JSON.stringify({ sender: username }));
        }

});


function displayAllMessages(messages) {
    console.log("Messages received:", messages); // Debug line
        console.log("Type of messages:", typeof messages); // Debug line

        // Check if messages is an array
        if (!Array.isArray(messages)) {
            console.error("Expected an array but got:", messages);
            return; // Early exit if not an array
        }

        // Proceed to sort if it's an array
        messages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
        displayPublicMessages(messages);
}


function updateCurrentChatDisplay() {
    const currentChatDisplay = document.getElementById('currentChat');
    const chatWithDisplay = document.getElementById('chat-with');

    if (currentChatType === 'public') {
            currentChatDisplay.textContent = 'Public chat';
            chatWithDisplay.textContent = 'Public chat'; // Update chat-with display
        } else {
            currentChatDisplay.textContent = currentChatUser;
            chatWithDisplay.textContent = `${currentChatUser}`; // Update chat-with display
        }
}


    sendUsernameButton.addEventListener('click', function() {

    const usernameValue = usernameInput.value.trim();
    if (usernameValue) {
            username = usernameValue; // Update the username variable
            console.log("Current usernameEEEEEEEEEEEEEE:", username);
document.getElementById('currentUserDisplay2').textContent = `Current User: ${username}`;
            usernameInput.value = ''; // Clear the input field
            document.getElementById('usernameSection').style.display = 'none'; // Hide username input
            chatSection.style.display = 'block'; // Show chat section
            currentChatType = 'public'; // Set default chat type to public
            currentChatUser = ''; // Clear current chat user
            updateCurrentChatDisplay(); // Update display to reflect public chat
            connect(usernameValue); // Call the connect function to establish WebSocket connection

        }
    });


    'use strict';

    var stompClient = null;
    var messageForm = document.querySelector('#messageForm');
    var messageInput = document.querySelector('#input-msg');
    var messageArea = document.querySelector('#messages');
    var connectingElement = document.querySelector('#connecting');

const requestHistoryButton = document.getElementById('request-history-btn');

requestHistoryButton.addEventListener('click', function() {
    if (username && stompClient) {
        stompClient.send("/app/chat.requestHistory", {}, JSON.stringify({ sender: username }));
    }
});

    function connect(username) {

        var socket = new SockJS('/ws');
        stompClient = Stomp.over(socket);

        stompClient.connect({}, function() {
                onConnected(username); // No need to pass username here
            }, onError);
document.getElementById('currentUserDisplay2').textContent = `Current User: ${username}`;
    }

 //   connect();


    function onConnected(username) {
        console.log("User connected:", username);
        document.getElementById('users').style.display = 'block';
        stompClient.subscribe('/topic/publicChatRoom', function(payload) {
                                                           const message = JSON.parse(payload.body);
                                                           // Pass the message as an array to displayAllMessages
                                                           displayAllMessages([message]);
                                                       });

        console.log("Subscribed to public chat room");


        stompClient.subscribe('/topic/onlineUsers', updateOnlineUsers); // Subscribe to online users



        stompClient.subscribe('/user/' + username + '/queue/history', function(payload) {
            const messages = JSON.parse(payload.body);
            console.log("Messages received:", messages); // Debug line

            // Check if messages is an array and display accordingly
            if (Array.isArray(messages)) {
                displayAllMessages(messages); // Pass the array directly
            } else {
                displayAllMessages([messages]); // In case it's a single message
            }

        });

        console.log("Subscribed to history queue for user:", username);

        stompClient.subscribe('/user/' + username + '/queue/private', onMessageReceived);

        stompClient.send("/app/chat.addUser",
            {},
            JSON.stringify({sender: username, type: 'JOIN'})
        )
        console.log("Sent JOIN message to server");

        document.getElementById('currentUserDisplay2').textContent = `Current User: ${username}`;

        connectingElement.classList.add('hidden');
    }


    function onError(error) {
        connectingElement.textContent = 'Could not connect to WebSocket server. Please refresh this page to try again!';
        connectingElement.style.color = 'red';
    }

if (!messageForm.dataset.listenerAdded) {
    messageForm.addEventListener('submit', sendMessage, true);
    messageForm.dataset.listenerAdded = true; // Set a flag to prevent re-adding
}


// -----------------------------------------------------------------
//                    SEND MESSAGE
// -----------------------------------------------------------------

    function sendMessage(event) {
                                    event.preventDefault();
                                    var messageContent = messageInput.value.trim();
                                    if (messageContent && stompClient) {
                                        var chatMessage = {
                                            sender: username,
                                            content: messageContent,
                                            type: currentChatType === 'public' ? 'CHAT' : 'PRIVATE',
                                            receiver: currentChatType === 'private' ? currentChatUser : null,
                                            timestamp: new Date().toISOString()
                                        };

                                        // Send message based on chat type
                                        if (currentChatType === 'public') {
                                            stompClient.send("/app/chat.sendMessage", {}, JSON.stringify(chatMessage));
                                        } else if (currentChatType === 'private') {
                                            stompClient.send("/app/chat.sendPrivateMessage", {}, JSON.stringify(chatMessage));
                                            moveUserToTop(currentChatUser); // Move user to the top after sending a private message
                                        }
                                        messageInput.value = '';
                                    }
                                }


    function onMessageReceived(payload) {
//        console.log("Payload received:", payload);
        var message = JSON.parse(payload.body);
 //       console.log("Received message:", message);


        // Check message type and handle accordingly
            if (message.type === 'CHAT') {
                displayPublicMessages([message]); // Handle public message
            } else if (message.type === 'PRIVATE') {
                if (currentChatType !== 'private' || currentChatUser !== message.sender) {
                            // If the chat is not currently opened or is not the sender, update the counter
                            unreadMessageCounts[message.sender] = (unreadMessageCounts[message.sender] || 0) + 1;

                            // Update the corresponding user element in the UI
                            updateNewMessageCounter(message.sender);
                            moveUserToTop(message.sender);
                        }

                        // Always display private messages regardless of current chat type
                        displayPrivateMessage(message);

            }
    }

// Function to display public messages
function displayPublicMessage(message) {
if (currentChatType === 'private') {
        return; // Skip displaying the message
    }

    var messageContainer = document.createElement('div');
    messageContainer.classList.add('message-container');

    var senderElement = document.createElement('div');
    senderElement.classList.add('sender');
    senderElement.textContent = message.sender; // Set sender text

    var dateElement = document.createElement('div');
    dateElement.classList.add('date');
    dateElement.textContent = new Date(message.timestamp).toLocaleString();

    var messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.textContent = message.content; // Set message text

    messageContainer.appendChild(senderElement);
    messageContainer.appendChild(dateElement);
    messageContainer.appendChild(messageElement);

    messageArea.appendChild(messageContainer);
    messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom
}

function displayPublicMessages(messages) {
if (currentChatType === 'private') {
        return; // Skip displaying the message
    }
    const fragment = document.createDocumentFragment(); // Create a document fragment

    messages.forEach(message => {
        var messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container');

        var senderElement = document.createElement('div');
        senderElement.classList.add('sender');
        senderElement.textContent = message.sender; // Set sender text

        var dateElement = document.createElement('div');
        dateElement.classList.add('date');
        dateElement.textContent = new Date(message.timestamp).toLocaleString();

        var messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = message.content; // Set message text

        messageContainer.appendChild(senderElement);
        messageContainer.appendChild(dateElement);
        messageContainer.appendChild(messageElement);

        fragment.appendChild(messageContainer); // Append to the fragment
    });

    messageArea.appendChild(fragment); // Append the fragment to the message area in one go
    messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom
}

// Function to display private messages
function displayPrivateMessage(message) {
if (currentChatType === 'public') {
        return; // Skip displaying the message
    }

    var messageContainer = document.createElement('div');
        messageContainer.classList.add('message-container'); // Add the first class
        messageContainer.classList.add('private-message'); // Add the second class

        var senderElement = document.createElement('div');
        senderElement.classList.add('sender');
        senderElement.textContent = message.sender; // Set sender text

        var dateElement = document.createElement('div');
        dateElement.classList.add('date');
        dateElement.textContent = new Date(message.timestamp).toLocaleString();

        var messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.textContent = message.content; // Set message text

        messageContainer.appendChild(senderElement);
        messageContainer.appendChild(dateElement);
        messageContainer.appendChild(messageElement);

        messageArea.appendChild(messageContainer);
        messageArea.scrollTop = messageArea.scrollHeight; // Scroll to the bottom
}


function updateOnlineUsers(payload) {
    const onlineUsers = JSON.parse(payload.body);
        console.log("Online users received:", onlineUsers);
        onlineUsersContainer.innerHTML = ''; // Clear existing users

        onlineUsers.forEach(user => {
            if (user !== username) {
                // Create a user-container for each user
                const userContainer = document.createElement('div');
                userContainer.classList.add('user-container');

                // User element
                const userElement = document.createElement('span');
                userElement.classList.add('user');
                userElement.textContent = user;

                // New message counter
                const newMessageCounter = document.createElement('span');
                newMessageCounter.classList.add('new-message-counter');
                newMessageCounter.textContent = '0'; // Initialize with 0 unread messages

                // Add click event to open private chat
                userContainer.addEventListener('click', function() {
                    clearMessages(); // Clear current messages
                    currentChatUser = user; // Set the current user for private chat
                    currentChatType = 'private'; // Update chat type
                    loadPrivateChat(currentChatUser, username); // Load private chat messages
                    updateCurrentChatDisplay(); // Update the current chat display

                    // Optionally, reset unread messages counter on click
                    unreadMessageCounts[user] = 0;
                    const newMessageCounter = userContainer.querySelector('.new-message-counter');
                    newMessageCounter.textContent = '0'; // Reset counter to 0 when clicked
                    newMessageCounter.style.display = 'none'; // Reset counter when clicked
                });

                // Append user element and message counter to the container
                userContainer.appendChild(userElement);
                userContainer.appendChild(newMessageCounter);
                onlineUsersContainer.appendChild(userContainer); // Add the container to the online users
            }
        });
}

// Load private chat
function loadPrivateChat(receiver, sender) {
    stompClient.send("/app/chat.requestPrivateHistory", {}, JSON.stringify({ receiver: receiver, sender: sender}));
}

function clearMessages() {
    messagesContainer.innerHTML = ''; // Clear all messages from the message area
}

function requestPrivateHistory(user) {
    if (stompClient) {
        stompClient.send("/app/chat.requestPrivateHistory", {}, JSON.stringify({ receiver: user }));
    }
}

function updateNewMessageCounter(sender) {
    // Find the user-container for the sender
    const userContainers = onlineUsersContainer.getElementsByClassName('user-container');

    for (let userContainer of userContainers) {
            const userElement = userContainer.querySelector('.user');
            const newMessageCounter = userContainer.querySelector('.new-message-counter');

            if (userElement.textContent === sender) {
                const count = unreadMessageCounts[sender] || 0; // Get the count or default to 0
                if (count > 0) {
                    newMessageCounter.textContent = count; // Update the count displayed
                    newMessageCounter.style.display = 'block'; // Show the counter
                } else {
                    newMessageCounter.style.display = 'none'; // Hide if there are no unread messages
                }
                break; // Exit once we found the correct user
            }
        }
}

function moveUserToTop(user) {
    const userContainers = onlineUsersContainer.getElementsByClassName('user-container');
    for (let userContainer of userContainers) {
        const userElement = userContainer.querySelector('.user');
        if (userElement.textContent === user) {
            onlineUsersContainer.prepend(userContainer); // Move this user to the top
            break; // Exit once we find and move the user
        }
    }
}