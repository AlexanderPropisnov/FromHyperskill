package chat;

import org.springframework.context.event.EventListener;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.Payload;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.messaging.simp.SimpMessageHeaderAccessor;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.stereotype.Controller;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.util.*;
import java.util.concurrent.atomic.AtomicInteger;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.socket.messaging.SessionDisconnectEvent;

@Controller
public class WebSocketController {

    private static final AtomicInteger userCount = new AtomicInteger(0);
    private List<ChatMessage> chatHistory = new ArrayList<>(); // Store messages here
    private List<String> onlineUsers = new ArrayList<>(); // Store online users
    @Autowired
    private SimpMessagingTemplate messagingTemplate;

    // In-memory store for private messages
    private PrivateMessageStore privateMessageStore = new PrivateMessageStore();

    @MessageMapping("/chat.sendMessage")
    @SendTo("/topic/publicChatRoom")
    public void sendMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");
        //System.out.println("Session Username: " + username);

        if (username != null) {
            chatMessage.setSender(username);
            chatMessage.setType(ChatMessage.MessageType.CHAT);
            chatHistory.add(chatMessage); // Add message to history
//            return chatMessage;
            messagingTemplate.convertAndSend("/topic/publicChatRoom", chatMessage);
            //System.out.println("Message sent: " + chatMessage.getContent());
            printAllMessages();

        }
 //       return null;
    }
    private void printAllMessages() {
        //System.out.println("Current chat history:");
        for (ChatMessage message : chatHistory) {
            System.out.printf("Sender: %s, Receiver: %s, Type: %s, Content: %s, Timestamp: %s%n",
                    message.getSender(),
                    message.getReceiver(),
                    message.getType(),
                    message.getContent(),
                    message.getTimestamp());
        }
    }

    @MessageMapping("/chat.addUser")
    @SendTo("/topic/publicChatRoom")
    public void addUser(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {

        String username = chatMessage.getSender();
        // Add username in web socket session


                if (username != null && !username.isEmpty()) {
                    headerAccessor.getSessionAttributes().put("username", username);
                    chatMessage.setSender(username);

                    onlineUsers.add(username); // Add user to online users
                    messagingTemplate.convertAndSend("/topic/onlineUsers", onlineUsers);

                    //System.out.println("User added: " + username);
                    // Send chat history to the newly connected user
                    for (ChatMessage message : chatHistory) {
                        messagingTemplate.convertAndSendToUser(username, "/queue/history", message);
                        //System.out.println("Sending to history queue: " + message.getContent());
                    }
                } else {
                    System.out.println("Received invalid username: " + username);
                }

    }

    @MessageMapping("/chat.requestHistory")
    public void requestHistory(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (username != null) {
            // Send the chat history to the requesting user
            List<ChatMessage> messagesToSend = new ArrayList<>(chatHistory);
            messagingTemplate.convertAndSendToUser(username, "/queue/history", messagesToSend);
        } else {
            System.out.println("No username found for history request.");
        }
    }

    @EventListener
    public void handleWebSocketDisconnectListener(SessionDisconnectEvent event) {
        StompHeaderAccessor headerAccessor = StompHeaderAccessor.wrap(event.getMessage());
        String username = (String) headerAccessor.getSessionAttributes().get("username");

        if (username != null) {
            onlineUsers.remove(username); // Remove user from online users
            ChatMessage chatMessage = new ChatMessage();
            chatMessage.setType(ChatMessage.MessageType.LEAVE);
            chatMessage.setSender(username);

            // Notify all users about the user leaving
            messagingTemplate.convertAndSend("/topic/onlineUsers", onlineUsers);
            messagingTemplate.convertAndSend("/topic/publicChatRoom", chatMessage);
        }
    }

    @MessageMapping("/chat.sendPrivateMessage")
    public void sendPrivateMessage(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String senderUsername = (String) headerAccessor.getSessionAttributes().get("username");

        if (senderUsername != null) {
            chatMessage.setSender(senderUsername);
            // Save the message to the in-memory store
            chatMessage.setType(ChatMessage.MessageType.PRIVATE);
            privateMessageStore.addMessage(senderUsername, chatMessage.getReceiver(), chatMessage);

            messagingTemplate.convertAndSendToUser(chatMessage.getReceiver(), "/queue/private", chatMessage);

            // Also send the message back to the sender
            messagingTemplate.convertAndSendToUser(senderUsername, "/queue/private", chatMessage);

     //       //System.out.println("Private message sent: " + chatMessage.getContent() + " to " + chatMessage.getReceiver());
     //       privateMessageStore.printAllMessages();
        }
    }

    @MessageMapping("/chat.requestPrivateHistory")
    public void requestPrivateHistory(@Payload ChatMessage chatMessage, SimpMessageHeaderAccessor headerAccessor) {
        String sender = chatMessage.getSender();
        String receiver = chatMessage.getReceiver();
        if (sender != null) {
            List<ChatMessage> allMessages = privateMessageStore.getAllMessages();

            for (ChatMessage message : allMessages) {
                // Check if the message involves the specified sender
                if ((message.getSender().equals(sender) && (message.getReceiver().equals(receiver)))|| (message.getSender().equals(receiver) && (message.getReceiver().equals(sender)))) {
                    messagingTemplate.convertAndSendToUser (sender, "/queue/private", message);
                    //System.out.println("Sending message from " + message.getSender() + " to " + message.getReceiver() + ": " + message.getContent());
                }
            }
        } else {
            System.out.println("Sender is null. Cannot send messages.");
        }
    }
}