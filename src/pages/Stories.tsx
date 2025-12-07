
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { StoryReel } from '@/components/stories/StoryReel';
import { StoryViewer } from '@/components/stories/StoryViewer';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { Tables } from '@/types/supabase';

type StoryWithProfile = Tables<'stories'> & { profiles: { id: string, full_name: string, avatar_url: string } };

const fetchUserStories = async () => {
  const { data: stories, error } = await supabase
    .from('stories')
    .select(`
      id, 
      user_id, 
      content, 
      created_at, 
      media_url, 
      media_type,
      profiles ( id, full_name, avatar_url )
    `)
    .order('created_at', { ascending: false });

  if (error) throw new Error(error.message);

  const userStories = new Map<string, StoryWithProfile[]>();
  (stories as StoryWithProfile[]).forEach(story => {
    const userId = story.profiles.id;
    if (!userStories.has(userId)) {
      userStories.set(userId, []);
    }
    userStories.get(userId)?.push(story);
  });

  return userStories;
};

export function Stories() {
  const [viewingUser, setViewingUser] = useState<string | null>(null);
  const navigate = useNavigate();
  const { data: userStories, isLoading, error } = useQuery({
    queryKey: ['userStories'],
    queryFn: fetchUserStories,
  });

  const handleUserClick = (userId: string) => {
    setViewingUser(userId);
  };

  const handleCloseViewer = () => {
    setViewingUser(null);
  };

  if (isLoading) return <div className="dark bg-black text-white min-h-screen flex items-center justify-center">Loading stories...</div>;
  if (error) return <div className="dark bg-black text-white min-h-screen flex items-center justify-center">Error loading stories: {(error as Error).message}</div>;

  return (
    <div className="dark bg-black text-white min-h-screen">
        <div className="p-4">
            <div className="flex justify-between items-center mb-4">
                <h1 className="text-2xl font-bold">Stories</h1>
                <Button onClick={() => navigate('/stories/create')} variant="outline" className="bg-gray-800 text-white hover:bg-gray-700">
                    Create Story
                </Button>
            </div>
            {userStories && (
                <StoryReel userStories={userStories} onUserClick={handleUserClick} />
            )}
            {viewingUser && userStories && (
                <StoryViewer
                userStories={userStories}
                initialUser={viewingUser}
                onClose={handleCloseViewer}
                />
            )}
        </div>
    </div>
  );
}
