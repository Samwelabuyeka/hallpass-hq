
import { AppLayout } from "@/components/layout/app-layout";
import { ChatList } from "@/components/chat/chat-list";
import { ChatWindow } from "@/components/chat/chat-window";
import { useState } from "react";

export default function ChatPage() {
  const [selectedChat, setSelectedChat] = useState<any>(null);

  return (
    <AppLayout>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 h-[calc(100vh-theme(spacing.16))]">
        <div className="col-span-1">
          <ChatList onSelectChat={setSelectedChat} />
        </div>
        <div className="col-span-2">
          <ChatWindow chat={selectedChat} />
        </div>
      </div>
    </AppLayout>
  );
}
