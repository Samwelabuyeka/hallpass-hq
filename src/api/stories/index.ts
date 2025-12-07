
import { supabase } from '@/integrations/supabase/client';

// Manually-defined types as a temporary workaround for Supabase type generation issues.
// It is highly recommended to fix the Supabase CLI and regenerate the types.

type StoryLike = {
  id: number;
  story_id: string;
  user_id: string;
  created_at: string;
};

// This represents a comment with the author's profile information.
type StoryCommentWithProfile = {
  id: number;
  story_id: string;
  user_id: string;
  comment: string;
  created_at: string;
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
};


// ====== Likes ======

export const getStoryLikes = async (storyId: string): Promise<StoryLike[]> => {
    const { data, error } = await (supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId) as Promise<{ data: StoryLike[]; error: any }>);
    if (error) throw new Error(error.message);
    return data || [];
};

export const likeStory = async (storyId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('story_likes')
        .insert([{ story_id: storyId, user_id: userId }]);
    if (error) throw new Error(error.message);
};

export const unlikeStory = async (storyId: string, userId: string): Promise<void> => {
    const { error } = await supabase
        .from('story_likes')
        .delete()
        .match({ story_id: storyId, user_id: userId });
    if (error) throw new Error(error.message);
};

// ====== Comments ======

export const getStoryComments = async (storyId: string): Promise<StoryCommentWithProfile[]> => {
    const { data, error } = await (supabase
        .from('story_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true }) as Promise<{ data: StoryCommentWithProfile[]; error: any }>);
    if (error) throw new Error(error.message);
    return data || [];
};

export const addStoryComment = async (storyId: string, userId: string, comment: string): Promise<StoryCommentWithProfile> => {
    const { data, error } = await (supabase
        .from('story_comments')
        .insert([{ story_id: storyId, user_id: userId, comment }])
        .select('*, profiles(full_name, avatar_url)')
        .single() as Promise<{ data: StoryCommentWithProfile; error: any }>);
    if (error) throw new Error(error.message);
    if (!data) throw new Error("No data returned from insert");
    return data;
};
