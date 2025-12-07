import { useState, useEffect } from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';

interface LikeButtonProps {
  storyId: string;
  initialLikes: number;
}

export function LikeButton({ storyId, initialLikes }: LikeButtonProps) {
  const { user } = useAuth();
  const { toast } = use-toast();
  const [likes, setLikes] = useState(initialLikes);
  const [isLiked, setIsLiked] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkIfLiked();
    }
  }, [user]);

  const checkIfLiked = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('story_likes')
        .select('id')
        .eq('story_id', storyId)
        .eq('user_id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; // PGRST116: no rows found

      if (data) {
        setIsLiked(true);
      }
    } catch (error) {
      console.error('Error checking like status:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleLike = async () => {
    if (!user) {
      toast({
        title: 'Authentication Error',
        description: 'You must be logged in to like a story.',
        variant: 'destructive',
      });
      return;
    }

    if (isLiked) {
      // Unlike the story
      try {
        const { error } = await supabase
          .from('story_likes')
          .delete()
          .eq('story_id', storyId)
          .eq('user_id', user.id);

        if (error) throw error;

        setLikes(likes - 1);
        setIsLiked(false);
      } catch (error) {
        console.error('Error unliking story:', error);
        toast({
          title: 'Error',
          description: 'Failed to unlike the story.',
          variant: 'destructive',
        });
      }
    } else {
      // Like the story
      try {
        const { error } = await supabase
          .from('story_likes')
          .insert({ story_id: storyId, user_id: user.id });

        if (error) throw error;

        setLikes(likes + 1);
        setIsLiked(true);
      } catch (error) {
        console.error('Error liking story:', error);
        toast({
          title: 'Error',
          description: 'Failed to like the story.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Button variant="outline" size="sm" onClick={toggleLike} disabled={loading}>
      <Heart className={`mr-2 h-4 w-4 ${isLiked ? 'fill-red-500 text-red-500' : ''}`} />
      {likes}
    </Button>
  );
}
