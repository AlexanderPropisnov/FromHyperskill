package chat;

import java.time.LocalDateTime;

public class ChatMessage {

    private MessageType type;
    private String content;
    private String sender;
    private String receiver;
    private LocalDateTime timestamp;

    public enum MessageType {
        CHAT, JOIN, LEAVE, PRIVATE
    }

    public MessageType getType() {
        return type;
    }

    public void setType(MessageType type) {
        this.type = type;
    }

    public String getContent() {
        return content;
    }

    public void setContent(String content) {
        this.content = content;
    }

    public String getSender() {
        return sender;
    }

    public void setSender(String sender) {
        this.sender = sender;
    }

    public String getReceiver() {
        return receiver;
    }

    public void setReceiver(String receiver) {
        this.receiver = receiver;
    }

    public LocalDateTime getTimestamp() {
        return timestamp;
    }

    public void setTimestamp() {
        this.timestamp = timestamp;
    }
}