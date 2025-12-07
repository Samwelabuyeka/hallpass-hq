
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/types/supabase';

type Story = Tables<'stories'>;
type StoryLike = Tables<'story_likes'>;
type StoryComment = Tables<'story_comments'>;

// ====== Likes ======

export const getStoryLikes = async (storyId: string): Promise<StoryLike[]> => {
    const { data, error } = await supabase
        .from('story_likes')
        .select('*')
        .eq('story_id', storyId);
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

export const getStoryComments = async (storyId: string): Promise<StoryComment[]> => {
    const { data, error } = await supabase
        .from('story_comments')
        .select('*, profiles(full_name, avatar_url)')
        .eq('story_id', storyId)
        .order('created_at', { ascending: true });
    if (error) throw new Error(error.message);
    return data || [];
};

export const addStoryComment = async (storyId: string, userId: string, comment: string): Promise<StoryComment> => {
    const { data, error } = await supabase
        .from('story_comments')
        .insert([{ story_id: storyId, user_id: userId, comment }])
        .select('*, profiles(full_name, avatar_url)')
        .single();
    if (error) throw new Error(error.message);
    return data;
};
