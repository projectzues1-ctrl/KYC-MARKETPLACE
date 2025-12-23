import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip, Image } from "lucide-react";

interface Message {
  id: string;
  senderId: string;
  senderUsername: string;
  content: string;
  createdAt: string;
  isSystem?: boolean;
}

interface ChatWindowProps {
  messages: Message[];
  currentUserId: string;
  onSendMessage: (content: string) => void;
  onSendFile?: (file: File) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

export function ChatWindow({
  messages,
  currentUserId,
  onSendMessage,
  onSendFile,
  isLoading = false,
  disabled = false,
}: ChatWindowProps) {
  const [newMessage, setNewMessage] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (newMessage.trim() && !disabled) {
      onSendMessage(newMessage.trim());
      setNewMessage("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onSendFile) {
      onSendFile(file);
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 rounded-xl border border-gray-800" data-testid="chat-window">
      <div className="p-3 border-b border-gray-800">
        <h3 className="text-white font-medium">Order Chat</h3>
      </div>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No messages yet. Start the conversation!
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${
                  msg.isSystem
                    ? "justify-center"
                    : msg.senderId === currentUserId
                    ? "justify-end"
                    : "justify-start"
                }`}
                data-testid={`message-${msg.id}`}
              >
                {msg.isSystem ? (
                  <div className="px-3 py-1 bg-gray-800 rounded-full text-xs text-gray-400">
                    {msg.content}
                  </div>
                ) : (
                  <div
                    className={`max-w-[70%] rounded-xl p-3 ${
                      msg.senderId === currentUserId
                        ? "bg-purple-600 text-white"
                        : "bg-gray-800 text-gray-200"
                    }`}
                  >
                    {msg.senderId !== currentUserId && (
                      <p className="text-xs font-medium mb-1 text-purple-400">
                        {msg.senderUsername}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                    <p
                      className={`text-xs mt-1 ${
                        msg.senderId === currentUserId
                          ? "text-purple-200"
                          : "text-gray-500"
                      }`}
                    >
                      {formatTime(msg.createdAt)}
                    </p>
                  </div>
                )}
              </div>
            ))
          )}
          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-xl p-3">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-100" />
                  <div className="w-2 h-2 bg-gray-600 rounded-full animate-bounce delay-200" />
                </div>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="p-3 border-t border-gray-800">
        <div className="flex items-center gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            className="hidden"
            accept="image/*,.pdf,.doc,.docx,.xlsx,.xls,.csv,.mp4,.mov,.avi,.webm"
          />
          {onSendFile && (
            <Button
              variant="ghost"
              size="icon"
              className="text-gray-400 hover:text-white"
              onClick={() => fileInputRef.current?.click()}
              disabled={disabled}
              data-testid="button-attach-file"
            >
              <Paperclip className="h-5 w-5" />
            </Button>
          )}
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 bg-gray-800 border-gray-700 text-white"
            disabled={disabled}
            data-testid="input-chat-message"
          />
          <Button
            onClick={handleSend}
            disabled={!newMessage.trim() || disabled}
            className="bg-purple-600 hover:bg-purple-700"
            data-testid="button-send-message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
