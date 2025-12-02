
import { Chat } from '@/pages/Chats';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatListProps {
  chats: Chat[];
  activeChat: Chat | null;
  onSelectChat: (chat: Chat) => void;
  getChatDisplayName: (chat: Chat) => string;
  loading: boolean;
}

export function ChatList({ chats, activeChat, onSelectChat, getChatDisplayName, loading }: ChatListProps) {
  const [unreadCounts, setUnreadCounts] = useState<Map<string, number>>(new Map());

  useEffect(() => {
    const fetchUnreadCounts = async () => {
      const newCounts = new Map<string, number>();
      for (const chat of chats) {
        const { data, error } = await supabase.rpc('count_unread_messages', { p_chat_id: chat.id, p_user_id: supabase.auth.user()?.id });
        if (!error) {
          newCounts.set(chat.id, data);
        }
      }
      setUnreadCounts(newCounts);
    };

    if (chats.length > 0) {
      fetchUnreadCounts();
    }
  }, [chats]);

  if (loading) {
    return <div className="p-4 text-center">Loading chats...</div>;
  }

  return (
    <div className="flex-1 overflow-y-auto">
      {chats.map(chat => {
        const displayName = getChatDisplayName(chat);
        const unreadCount = unreadCounts.get(chat.id) || 0;

        return (
          <div
            key={chat.id}
            className={`flex items-center p-3 cursor-pointer hover:bg-muted ${activeChat?.id === chat.id ? 'bg-muted' : ''}`}
            onClick={() => onSelectChat(chat)}
          >
            <Avatar className="w-10 h-10 mr-3">
              <AvatarImage src={chat.participants.find(p => p.user_id !== supabase.auth.user()?.id)?.profile.avatar_url} />
              <AvatarFallback>{displayName[0]}</AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <div className="font-semibold">{displayName}</div>
            </div>
            {unreadCount > 0 && (
              <Badge className="ml-2">{unreadCount}</Badge>
            )}
          </div>
        );
      })}
    </div>
  );
}
