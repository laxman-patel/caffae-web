import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { cn } from "@/lib/utils";
import { MessageCircle, Send, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Message = {
  id: string;
  content: string;
  sender: 'you' | 'other';
  timestamp: Date;
};

export const ChatInterface = () => {
  const { user } = useAuth();
  const { 
    isConnecting, isConnected, otherUserDisconnected, connect, disconnect, findNewPartner 
  } = useChat();
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Scroll to bottom when new messages are added
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);
  
  // Connect to chat when component mounts
  useEffect(() => {
    if (!isConnected && !isConnecting) {
      connect();
    }
    
    return () => {
      disconnect();
    };
  }, []);
  
  // Mock receiving messages (in a real app this would come from WebSockets)
  useEffect(() => {
    if (isConnected) {
      const typingTimer = setTimeout(() => {
        setIsTyping(true);
        
        const replyTimer = setTimeout(() => {
          setIsTyping(false);
          const responses = [
            "Hi there! How are you today?",
            "Nice to meet you! Where are you from?",
            "What brings you to Caffae?",
            "Interesting! Tell me more about yourself.",
            "I'm enjoying this conversation. What do you like to do in your free time?"
          ];
          
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          
          setMessages(prev => [
            ...prev, 
            { 
              id: `msg-${Date.now()}`,
              content: randomResponse,
              sender: 'other',
              timestamp: new Date()
            }
          ]);
        }, 2000);
        
        return () => clearTimeout(replyTimer);
      }, 5000);
      
      return () => clearTimeout(typingTimer);
    }
  }, [isConnected, messages]);
  
  const handleSendMessage = () => {
    if (!message.trim()) return;
    
    setMessages(prev => [
      ...prev, 
      { 
        id: `msg-${Date.now()}`,
        content: message.trim(),
        sender: 'you',
        timestamp: new Date()
      }
    ]);
    
    setMessage("");
    
    // Focus back on textarea
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-background relative">
      {/* Header */}
      <div className="border-b border-border p-4 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MessageCircle className="h-5 w-5 text-primary" />
          <span className="font-medium">Random Chat</span>
        </div>
        <div className="flex items-center space-x-2">
          {isConnected && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Connected</span>
              <div className="h-2 w-2 rounded-full bg-green-500"></div>
            </div>
          )}
          {isConnecting && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Connecting</span>
              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
            </div>
          )}
          {!isConnected && !isConnecting && (
            <div className="flex items-center">
              <span className="text-xs text-muted-foreground mr-2">Disconnected</span>
              <div className="h-2 w-2 rounded-full bg-red-500"></div>
            </div>
          )}
        </div>
      </div>
      
      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4">
        {isConnecting && (
          <div className="flex flex-col items-center justify-center h-full space-y-3 animate-pulse">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">Finding someone to chat with...</p>
          </div>
        )}
        
        {otherUserDisconnected && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
              <X className="h-6 w-6 text-destructive/50" />
            </div>
            <p className="text-sm text-muted-foreground">Your chat partner disconnected.</p>
            <Button variant="default" size="sm" onClick={findNewPartner}>
              Find New Partner
            </Button>
          </div>
        )}
        
        {isConnected && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full space-y-3">
            <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
              <MessageCircle className="h-6 w-6 text-primary/50" />
            </div>
            <p className="text-sm text-muted-foreground">Say hello to your new chat partner!</p>
          </div>
        )}
        
        <div className="flex flex-col">
          {messages.map((msg) => (
            <div 
              key={msg.id}
              className={cn(
                "chat-bubble",
                msg.sender === 'you' 
                  ? "chat-bubble-you ml-auto" 
                  : "chat-bubble-other mr-auto"
              )}
            >
              {msg.content}
            </div>
          ))}
          
          {isTyping && (
            <div className="chat-bubble chat-bubble-other mr-auto">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>
      
      {/* Input Area */}
      <div className="border-t border-border p-4">
        {isConnected ? (
          <div className="flex items-end space-x-2">
            <Textarea
              ref={textareaRef}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="min-h-[80px] resize-none"
            />
            <Button
              variant="default"
              size="icon"
              className="h-10 w-10 shrink-0"
              onClick={handleSendMessage}
              disabled={!message.trim()}
            >
              <Send size={18} />
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-3 py-4">
            {otherUserDisconnected ? (
              <>
                <p className="text-sm text-muted-foreground">Chat ended</p>
                <Button variant="default" onClick={findNewPartner}>
                  Find New Partner
                </Button>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">
                  {isConnecting ? "Connecting..." : "Disconnected"}
                </p>
                <Button variant="default" onClick={connect} disabled={isConnecting}>
                  {isConnecting ? "Connecting..." : "Connect"}
                </Button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
