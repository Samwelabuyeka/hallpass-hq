
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { ChatMessages } from '@/components/messaging/ChatMessages';
import { ChatList } from '@/components/messaging/ChatList';
import { Button } from '@/components/ui/button';
import { CreateGroupChatDialog } from '@/components/messaging/CreateGroupChatDialog';

export type Chat = {
  id: string;
  type: 'direct' | 'group' | 'course_channel';
  name: string | null;
  course_id: string | null;
  participants: { user_id: string; profile: { full_name: string; avatar_url: string } }[];
};

export function Chats() {
  const { user } = useAuth();
  const [chats, setChats] = useState<Chat[]>([]);
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
  const [currentTab, setCurrentTab] = useState<'direct' | 'group' | 'course_channel'>('direct');

  useEffect(() => {
    if (!user) return;

    const fetchChats = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('chats')
        .select(`
          id, name, type, course_id,
          participants:chat_participants!inner(
            user_id,
            profile:profiles(full_name, avatar_url)
          )
        `)
        .in('id', 
          supabase.from('chat_participants').select('chat_id').eq('user_id', user.id)
        );

      if (error) {
        console.error('Error fetching chats:', error);
      } else {
        setChats(data as Chat[]);
      }
      setLoading(false);
    };

    fetchChats();
  }, [user]);

  const getChatDisplayName = (chat: Chat) => {
    if (chat.type === 'course_channel') {
      return chat.name || 'Course Channel';
    }
    if (chat.type === 'group') {
        return chat.name || 'Group Chat';
    }
    // For direct chats
    const otherParticipant = chat.participants.find(p => p.user_id !== user?.id);
    return otherParticipant?.profile.full_name || 'Direct Message';
  };

  const filteredChats = chats.filter(chat => chat.type === currentTab);

  return (
    <div className="flex h-screen bg-background text-foreground">
      <aside className="w-1/4 border-r border-border flex flex-col">
        <div className="p-4 border-b border-border">
            <h2 className="text-xl font-semibold">Conversations</h2>
            <Button className="w-full mt-4" onClick={() => setCreateGroupOpen(true)}>Create Group Chat</Button>
        </div>

        <div className="flex justify-around p-2 border-b">
            <Button variant={currentTab === 'direct' ? 'secondary' : 'ghost'} onClick={() => setCurrentTab('direct')}>Direct</Button>
            <Button variant={currentTab === 'group' ? 'secondary' : 'ghost'} onClick={() => setCurrentTab('group')}>Groups</Button>
            <Button variant={currentTab === 'course_channel' ? 'secondary' : 'ghost'} onClick={() => setCurrentTab('course_channel')}>Courses</Button>
        </div>
        
        <ChatList 
          chats={filteredChats}
          activeChat={activeChat}
          onSelectChat={setActiveChat}
          getChatDisplayName={getChatDisplayName}
          loading={loading}
        />
      </aside>

      <main className="w-3/4 flex flex-col">
        {activeChat ? (
          <ChatMessages chat={activeChat} getChatDisplayName={getChatDisplayName} />
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-muted-foreground">Select a conversation to start chatting</p>
          </div>
        )}
      </main>
      <CreateGroupChatDialog isOpen={isCreateGroupOpen} onClose={() => setCreateGroupOpen(false)} />
    </div>
  );
}
