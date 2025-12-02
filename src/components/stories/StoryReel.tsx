
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export interface Story {
    id: string;
    content_url: string;
    story_type: 'image' | 'video';
    user_id: string;
    profiles: { // Using profiles alias to match potential query structure
        full_name: string;
        avatar_url: string;
    }
}

interface StoryReelProps {
  onStorySelect: (userId: string, stories: Story[]) => void;
}

export function StoryReel({ onStorySelect }: StoryReelProps) {
  const [userStories, setUserStories] = useState<Map<string, Story[]>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStories = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stories')
        .select(`
          id, content_url, story_type, user_id,
          profiles ( full_name, avatar_url )
        `)
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('Error fetching stories:', error);
      } else {
        const storiesByUser = new Map<string, Story[]>();
        for (const story of data as any[]) { // Cast to any to handle profile relation
            if (!storiesByUser.has(story.user_id)) {
                storiesByUser.set(story.user_id, []);
            }
            storiesByUser.get(story.user_id)?.push(story as Story);
        }
        setUserStories(storiesByUser);
      }
      setLoading(false);
    };

    fetchStories();
  }, []);

  if (loading) {
    return <div>Loading stories...</div>;
  }

  return (
    <div className="p-4 border-b">
      <h3 className="text-lg font-semibold mb-2">Stories</h3>
      <div className="flex space-x-4 overflow-x-auto pb-2">
        {Array.from(userStories.entries()).map(([userId, stories]) => (
          <div 
            key={userId} 
            className="flex flex-col items-center cursor-pointer" 
            onClick={() => onStorySelect(userId, stories)}
          >
            <Avatar className="w-16 h-16 border-2 border-primary">
              <AvatarImage src={stories[0].profiles.avatar_url} />
              <AvatarFallback>{stories[0].profiles.full_name[0]}</AvatarFallback>
            </Avatar>
            <span className="text-xs mt-1">{stories[0].profiles.full_name}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
