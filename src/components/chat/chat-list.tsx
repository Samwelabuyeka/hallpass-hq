import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { CreateChatDialog } from "./create-chat-dialog";

export function ChatList({ onSelectChat }) {
  const { user } = useAuth();
  const [chats, setChats] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isCreateChatOpen, setCreateChatOpen] = useState(false);

  const fetchChats = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("chat_participants")
        .select("*, chat:chats(*)")
        .eq("user_id", user.id);

      if (error) throw error;

      const enrichedChats = await Promise.all(
        data.map(async (participant) => {
          let chatDetails = { ...participant.chat, last_message: null };

          const { data: lastMessage } = await supabase
            .from('messages')
            .select('content')
            .eq('chat_id', participant.chat_id)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();
          
          if(lastMessage){
            chatDetails.last_message = lastMessage.content;
          }

          if (participant.chat.is_group_chat) {
            return { ...chatDetails, display_name: participant.chat.name, avatar_url: null };
          } else {
            const { data: otherParticipantData } = await supabase
              .from('chat_participants')
              .select('user_id')
              .eq('chat_id', participant.chat_id)
              .neq('user_id', user.id)
              .single();

            if (otherParticipantData) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('username, avatar_url')
                .eq('user_id', otherParticipantData.user_id)
                .single();
              
              return { ...chatDetails, display_name: profile?.username || 'Unknown User', avatar_url: profile?.avatar_url, other_user_id: otherParticipantData.user_id };
            }
            return { ...chatDetails, display_name: 'Unknown User', avatar_url: null };
          }
        })
      );
      
      setChats(enrichedChats);
    } catch (error) {
      console.error("Error fetching chats:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) return;

    fetchChats();

    const channels = supabase.channel('chat-list-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_participants', filter: `user_id=eq.${user.id}` }, fetchChats)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'messages' }, (payload) => {
        // Check if the new message belongs to any of the current user's chats
        const chatIds = chats.map(c => c.id);
        if(chatIds.includes(payload.new.chat_id)){
          fetchChats();
        }
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(channels);
    };

  }, [user, chats]);

  return (
    <div className="border-r h-full flex flex-col">
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">Chats</h2>
        <Button size="icon" variant="ghost" onClick={() => setCreateChatOpen(true)}>
          <Plus />
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto">
        {loading ? (
          <div className="p-4 text-center">Loading chats...</div>
        ) : (
          chats.map((chat) => (
            <div
              key={chat.id}
              className="p-4 border-b cursor-pointer hover:bg-muted/50 flex items-center gap-4"
              onClick={() => onSelectChat(chat)}
            >
              <Avatar>
                <AvatarImage src={chat.avatar_url} />
                <AvatarFallback>{chat.display_name?.[0].toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-grow">
                <p className="font-semibold">{chat.display_name}</p>
                <p className="text-sm text-muted-foreground truncate">
                  {chat.last_message || "No messages yet."}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
      <CreateChatDialog isOpen={isCreateChatOpen} onClose={() => setCreateChatOpen(false)} />
    </div>
  );
}
