
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";

export function CreateChatDialog({ isOpen, onClose }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isGroupChat, setIsGroupChat] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [connections, setConnections] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchConnections = async () => {
      try {
        const { data, error } = await supabase
          .from('user_connections')
          .select('id, user_b:profiles!user_connections_user_b_id_fkey(user_id, username, avatar_url)')
          .eq('user_a_id', user.id)
          .eq('status', 'accepted');
        
        if (error) throw error;
        setConnections(data.map(conn => conn.user_b));
      } catch (error) {
        console.error("Error fetching connections:", error);
      }
    };
    
    fetchConnections();
  }, [user]);

  const handleUserSelection = (userId: string) => {
    if (isGroupChat) {
      setSelectedUsers(prev => 
        prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
      );
    } else {
      setSelectedUsers([userId]);
    }
  }

  const handleCreateChat = async () => {
    if (!user || selectedUsers.length === 0) return;
    if (isGroupChat && !groupName.trim()) {
      toast({ title: "Error", description: "Group name is required for group chats", variant: "destructive" });
      return;
    }

    setLoading(true);
    try {
      // Create the chat room
      const { data: chat, error: chatError } = await supabase
        .from('chats')
        .insert({
          is_group_chat: isGroupChat,
          name: isGroupChat ? groupName : null,
          created_by: user.id,
        })
        .select()
        .single();
      
      if (chatError) throw chatError;

      // Add participants
      const participants = [...selectedUsers, user.id].map(userId => ({
        chat_id: chat.id,
        user_id: userId,
        is_admin: isGroupChat && userId === user.id, // Creator is admin in group chats
      }));

      const { error: participantsError } = await supabase
        .from('chat_participants')
        .insert(participants);
        
      if (participantsError) throw participantsError;

      toast({ title: "Success", description: "Chat created successfully" });
      onClose();
    } catch (error: any) {
      console.error("Error creating chat:", error);
      toast({ title: "Error", description: error.message || "Failed to create chat", variant: "destructive" });
    } finally {
      setLoading(false);
    }

  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
            <div className="flex items-center space-x-2">
                <Label htmlFor="group-switch">Group Chat</Label>
                <Switch id="group-switch" checked={isGroupChat} onCheckedChange={setIsGroupChat} />
            </div>
            {isGroupChat && (
                <div>
                    <Label htmlFor="group-name">Group Name</Label>
                    <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name..." />
                </div>
            )}
            <div>
                <Label>Select Users</Label>
                <div className="border rounded-md max-h-60 overflow-y-auto p-2 space-y-2">
                    {connections.map(connection => (
                        <div key={connection.user_id} 
                             className={`flex items-center gap-3 p-2 rounded-md cursor-pointer ${selectedUsers.includes(connection.user_id) ? 'bg-primary/20' : ''}`}
                             onClick={() => handleUserSelection(connection.user_id)}>
                            {connection.username}
                        </div>
                    ))}
                </div>
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateChat} disabled={loading || selectedUsers.length === 0}>
            {loading ? "Creating..." : "Create Chat"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
