
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tables } from '@/types/supabase';
import { InFeedAd } from '@/components/ui/InFeedAd';

type StoryWithProfile = Tables<'stories'> & { profiles: { id: string, full_name: string, avatar_url: string } };

interface StoryReelProps {
  userStories: Map<string, StoryWithProfile[]>;
  onUserClick: (userId: string) => void;
}

export function StoryReel({ userStories, onUserClick }: StoryReelProps) {
  const users = Array.from(userStories.values()).map(stories => stories[0].profiles);

  return (
    <div className="bg-background dark:bg-black p-4 rounded-lg shadow-inner">
      <div className="flex items-center space-x-4 overflow-x-auto pb-2 scrollbar-hide">
        {users.map((user, index) => (
          <>
            <div 
              key={user.id} 
              className="flex flex-col items-center cursor-pointer group" 
              onClick={() => onUserClick(user.id)}
            >
              <div className="relative">
                  <Avatar className="w-16 h-16 transition-transform duration-300 transform group-hover:scale-110">
                      <AvatarImage src={user.avatar_url} />
                      <AvatarFallback>{user.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  <div className="absolute -top-1 -right-1 -bottom-1 -left-1 rounded-full bg-gradient-to-r from-yellow-400 via-red-500 to-pink-500 transform rotate-45 -z-10 group-hover:rotate-90 transition-transform duration-500"></div>
              </div>
              <span className="text-xs text-muted-foreground dark:text-gray-300 mt-2 truncate w-16 text-center">
                  {user.full_name}
              </span>
            </div>
            {(index + 1) % 8 === 0 && (
                <div className="w-16 h-16 flex items-center justify-center bg-gray-200 dark:bg-gray-800 rounded-full">
                    <InFeedAd client="ca-pub-7929365740282293" slot="7056026184" layoutKey="-6t+ed+2i-1n-4w" />
                </div>
            )}
          </>
        ))}
      </div>
    </div>
  );
}
