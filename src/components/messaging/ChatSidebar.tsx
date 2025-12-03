
import { useState } from 'react';
import { ChatList } from './ChatList';
import { Button } from '@/components/ui/button';
import { CreateGroupChatDialog } from './CreateGroupChatDialog';
import { Chat, getChatDisplayName } from '@/lib/chat-helpers';
import { useAuth } from '@/components/auth/auth-provider';

interface ChatSidebarProps {
    chats: Chat[];
    activeChat: Chat | null;
    onSelectChat: (chat: Chat) => void;
    loading: boolean;
}

export function ChatSidebar({ chats, activeChat, onSelectChat, loading }: ChatSidebarProps) {
    const { user } = useAuth();
    const [isCreateGroupOpen, setCreateGroupOpen] = useState(false);
    const [currentTab, setCurrentTab] = useState<'direct' | 'group' | 'course_channel'>('direct');

    const filteredChats = chats.filter(chat => chat.type === currentTab);

    return (
        <div className="h-full flex flex-col">
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
                onSelectChat={onSelectChat}
                getChatDisplayName={(chat) => getChatDisplayName(chat, user?.id || '')}
                loading={loading}
            />

            <CreateGroupChatDialog isOpen={isCreateGroupOpen} onClose={() => setCreateGroupOpen(false)} />
        </div>
    );
}