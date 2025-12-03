
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessages } from '@/components/messaging/ChatMessages';
import { ChatSidebar } from '@/components/messaging/ChatSidebar';
import { Chat, getChatDisplayName } from '@/lib/chat-helpers';

export function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id, name, type, course_id, last_message_at,
          participants:chat_participants!inner(
            user_id,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .in('id', 
          supabase.from('chat_participants').select('chat_id').eq('user_id', user.id)
        )
        .order('last_message_at', { ascending: false, nulls: 'last' });

      if (error) {
        console.error('Error fetching chats:', error);
      } else {
        setChats(data as Chat[]);
      }
      setLoading(false);
    };

    fetchChats();

    const subscription = supabase
        .channel('public:chats')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'chats' }, fetchChats)
        .subscribe();

    return () => {
        supabase.removeChannel(subscription);
    };
  }, [user]);

  return (
    <div className="flex h-screen bg-background text-foreground">
        <div className="w-full md:w-1/3 lg:w-1/4 border-r border-border flex flex-col">
            <ChatSidebar 
                chats={chats}
                activeChat={activeChat}
                onSelectChat={setActiveChat}
                loading={loading}
            />
        </div>

      <main className="hidden md:flex flex-1 flex-col">
        {activeChat ? (
          <ChatMessages 
            chat={activeChat} 
            getChatDisplayName={(chat) => getChatDisplayName(chat, user?.id || '')} 
          />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
    </div>
  );
}
