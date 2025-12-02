
import { useState, useEffect } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface UserProfile {
  user_id: string;
  full_name: string;
}

interface CreateGroupChatDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreateGroupChatDialog({ isOpen, onClose }: CreateGroupChatDialogProps) {
  const { user } = useAuth();
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<Set<string>>(new Set());
  const [groupName, setGroupName] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || !user) return;

    const fetchUsers = async () => {
        // For simplicity, fetching all users. In a large system, this should be paginated/searchable.
        const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('university_id').eq('user_id', user.id).single();

        if (profileError || !profileData.university_id) {
            toast.error('Could not determine your university.');
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .eq('university_id', profileData.university_id)
            .not('user_id', 'eq', user.id); // Exclude self

        if (error) {
            toast.error('Failed to fetch users', { description: error.message });
        } else {
            setAllUsers(data as UserProfile[]);
        }
    };

    fetchUsers();
  }, [isOpen, user]);

  const handleSelectionChange = (userId: string, isSelected: boolean) => {
    const newSelection = new Set(selectedUsers);
    if (isSelected) {
      newSelection.add(userId);
    } else {
      newSelection.delete(userId);
    }
    setSelectedUsers(newSelection);
  };

  const handleCreateGroup = async () => {
    if (!user || selectedUsers.size === 0 || !groupName) {
        toast.error('Group name and at least one member are required.');
        return;
    }

    setLoading(true);
    try {
        // 1. Create the new chat entry
        const { data: chatData, error: chatError } = await supabase
            .from('chats')
            .insert({ name: groupName, type: 'group', created_by: user.id })
            .select('id').single();

        if (chatError) throw chatError;
        const chatId = chatData.id;

        // 2. Add all selected users (including the creator) to the chat
        const participants = Array.from(selectedUsers).map(userId => ({ chat_id: chatId, user_id: userId }));
        participants.push({ chat_id: chatId, user_id: user.id }); // Add creator

        const { error: participantsError } = await supabase.from('chat_participants').insert(participants);
        if (participantsError) throw participantsError;

        toast.success(`Group '${groupName}' created successfully!`);
        onClose(); // Close the dialog
        // You might want to refresh the chat list in the parent component here

    } catch (error: any) {
        toast.error('Failed to create group', { description: error.message });
    } finally {
        setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create a New Group Chat</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
            <div>
                <Label htmlFor="group-name">Group Name</Label>
                <Input id="group-name" value={groupName} onChange={(e) => setGroupName(e.target.value)} />
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 p-2 border rounded-md">
                <p className="font-semibold">Select Members</p>
                {allUsers.map(u => (
                    <div key={u.user_id} className="flex items-center space-x-2">
                        <Checkbox
                            id={u.user_id}
                            onCheckedChange={(checked) => handleSelectionChange(u.user_id, !!checked)}
                        />
                        <Label htmlFor={u.user_id} className="flex-grow">{u.full_name}</Label>
                    </div>
                ))}
            </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button onClick={handleCreateGroup} disabled={loading}>
            {loading ? 'Creating...' : 'Create Group'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
