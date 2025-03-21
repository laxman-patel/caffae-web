
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useToast } from '@/hooks/use-toast';

interface ChatContextType {
  isConnecting: boolean;
  isConnected: boolean;
  otherUserDisconnected: boolean;
  connect: () => void;
  disconnect: () => void;
  findNewPartner: () => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const [isConnecting, setIsConnecting] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [otherUserDisconnected, setOtherUserDisconnected] = useState(false);
  const { toast } = useToast();

  // Mock connection logic - in a real app, this would use WebSockets
  const connect = () => {
    if (isConnected || isConnecting) return;
    
    setIsConnecting(true);
    setOtherUserDisconnected(false);
    
    // Simulate connection delay
    setTimeout(() => {
      setIsConnecting(false);
      setIsConnected(true);
      
      toast({
        title: "Connected",
        description: "You are now chatting with a stranger.",
      });
    }, 2000);
  };
  
  const disconnect = () => {
    if (!isConnected) return;
    
    setIsConnected(false);
    setOtherUserDisconnected(false);
    
    toast({
      title: "Disconnected",
      description: "You have disconnected from the chat.",
    });
  };
  
  const findNewPartner = () => {
    disconnect();
    connect();
  };

  const value = {
    isConnecting,
    isConnected,
    otherUserDisconnected,
    connect,
    disconnect,
    findNewPartner,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
};
