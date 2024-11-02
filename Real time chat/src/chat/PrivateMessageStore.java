package chat;

import java.util.HashMap;
import java.util.List;
import java.util.ArrayList;
import java.util.Map;

public class PrivateMessageStore {
    private Map<String, List<ChatMessage>> privateMessages = new HashMap<>();

    public void addMessage(String sender, String receiver, ChatMessage message) {
        String key = getKey(sender, receiver);
        privateMessages.putIfAbsent(key, new ArrayList<>());
        privateMessages.get(key).add(message);
        printAllMessages();
 //       System.out.println("Message added: " + message.getContent() + " from " + sender + " to " + receiver);
    }

    public List<ChatMessage> getMessages(String user1, String user2) {
        List<ChatMessage> messages = privateMessages.getOrDefault(getKey(user1, user2), new ArrayList<>());
//        System.out.println("Retrieved " + messages.size() + " messages between " + user1 + " and " + user2);
        return messages;
    }
    private String getKey(String user1, String user2) {
        return user1 + ":" + user2; // Creates a unique key for each user pair
    }
    /*private String getKey(String user1, String user2) {
        return user1.compareTo(user2) < 0 ? user1 + "-" + user2 : user2 + "-" + user1;
    }*/
    public void printAllMessages() {
        for (Map.Entry<String, List<ChatMessage>> entry : privateMessages.entrySet()) {
            String key = entry.getKey();
            List<ChatMessage> messages = entry.getValue();

            String[] users = key.split(":");
            String user1 = users[0];
            String user2 = users[1];

            System.out.println("Messages between " + user1 + " and " + user2 + ":");
            for (ChatMessage message : messages) {
                System.out.println(" - " + message.getSender() + ": " + message.getContent() + " (at " + message.getTimestamp() + ")");
            }
            System.out.println("------------------------");
        }
    }

    public List<ChatMessage> getAllMessages() {
        List<ChatMessage> allMessages = new ArrayList<>();
        for (List<ChatMessage> messages : privateMessages.values()) {
            allMessages.addAll(messages);
        }
        return allMessages;
    }
}