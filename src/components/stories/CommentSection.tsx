import { useState, useEffect } from 'react';
import { MessageSquare, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Tables } from '@/types/supabase';

type Comment = Tables<'story_comments'> & { profiles: { full_name: string, avatar_url: string } };

interface CommentSectionProps {
  storyId: string;
  initialCommentCount: number;
}

export function CommentSection({ storyId, initialCommentCount }: CommentSectionProps) {
  const { user } = useAuth();
  const { toast } = use-toast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentCount, setCommentCount] = useState(initialCommentCount);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, []);

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .select(`
          *,
          profiles ( full_name, avatar_url )
        `)
        .eq('story_id', storyId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      setComments(data as Comment[]);
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast({
        title: 'Error',
        description: 'Failed to load comments.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !newComment.trim()) return;

    setSubmitting(true);
    try {
      const { data, error } = await supabase
        .from('story_comments')
        .insert({ story_id: storyId, user_id: user.id, content: newComment.trim() })
        .select(`
          *,
          profiles ( full_name, avatar_url )
        `)
        .single();

      if (error) throw error;

      setComments([data as Comment, ...comments]);
      setNewComment('');
      setCommentCount(commentCount + 1);
    } catch (error) {
      console.error('Error submitting comment:', error);
      toast({
        title: 'Error',
        description: 'Failed to post your comment.',
        variant: 'destructive',
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <MessageSquare className="h-5 w-5" />
        <h3 className="text-lg font-semibold">Comments ({commentCount})</h3>
      </div>

      {user && (
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <Input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            disabled={submitting}
          />
          <Button type="submit" disabled={submitting || !newComment.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      )}

      {loading ? (
        <p>Loading comments...</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex items-start gap-3">
                <Avatar className="h-9 w-9">
                    <AvatarImage src={comment.profiles.avatar_url} />
                    <AvatarFallback>
                        {comment.profiles.full_name.slice(0, 2).toUpperCase()}
                    </AvatarFallback>
                </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-sm">{comment.profiles.full_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(comment.created_at).toLocaleDateString()}
                  </p>
                </div>
                <p className="text-sm">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
