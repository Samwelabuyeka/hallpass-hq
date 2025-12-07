import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { AppLayout } from '@/components/layout/app-layout';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/types/supabase';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { LikeButton } from '@/components/stories/LikeButton';
import { CommentSection } from '@/components/stories/CommentSection';
import { ShareButton } from '@/components/stories/ShareButton';

type Story = Tables<'stories'> & { profiles: { full_name: string, avatar_url: string } };

export default function StoryPage() {
  const router = useRouter();
  const { storyId } = router.query;
  const [story, setStory] = useState<Story | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (storyId) {
      fetchStory();
    }
  }, [storyId]);

  const fetchStory = async () => {
    try {
      const { data, error } = await supabase
        .from('stories')
        .select(`
          *,
          profiles ( full_name, avatar_url )
        `)
        .eq('id', storyId)
        .single();

      if (error) throw error;

      setStory(data as Story);
    } catch (error) {
      console.error('Error fetching story:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Loading story...</div>
        </div>
      </AppLayout>
    );
  }

  if (!story) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Story not found</div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="max-w-2xl mx-auto">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-4">
                <Avatar>
                  <AvatarImage src={story.profiles.avatar_url} />
                  <AvatarFallback>{story.profiles.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                </Avatar>
                <div>
                  <CardTitle>{story.profiles.full_name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {new Date(story.created_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <p>{story.content}</p>
            </CardContent>
            <CardFooter className="flex justify-between">
                <div className="flex gap-2">
                    <LikeButton storyId={story.id} initialLikes={story.like_count} />
                    <ShareButton storyId={story.id} />
                </div>
                <p className="text-sm text-muted-foreground">{story.comment_count} comments</p>
            </CardFooter>
          </Card>

          <div className="mt-6">
            <CommentSection storyId={story.id} initialCommentCount={story.comment_count} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
