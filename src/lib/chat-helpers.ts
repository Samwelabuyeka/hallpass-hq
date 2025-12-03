
export type Chat = {
    id: string;
    type: 'direct' | 'group' | 'course_channel';
    name: string | null;
    course_id: string | null;
    last_message_at: string | null;
    participants: { user_id: string; profile: { full_name: string; avatar_url: string } }[];
};

export const getChatDisplayName = (chat: Chat, currentUserId: string): string => {
    if (chat.type === 'course_channel') {
      return chat.name || 'Course Channel';
    }
    if (chat.type === 'group') {
        return chat.name || 'Group Chat';
    }
    // For direct chats
    const otherParticipant = chat.participants.find(p => p.user_id !== currentUserId);
    return otherParticipant?.profile.full_name || 'Direct Message';
};