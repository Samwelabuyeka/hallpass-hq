
import { useState, useEffect, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Heart, Send, X } from 'lucide-react';
import { Tables } from '@/types/supabase';
import { useAuth } from '@/components/auth/auth-provider';
import { getStoryLikes, likeStory, unlikeStory, getStoryComments, addStoryComment } from '@/api/stories';
import AdBanner from '@/components/AdBanner';

type StoryWithProfile = Tables<'stories'> & { profiles: { id: string, full_name: string, avatar_url: string } };

interface StoryViewerProps {
  userStories: Map<string, StoryWithProfile[]>;
  initialUser: string;
  onClose: () => void;
}

export function StoryViewer({
  userStories,
  initialUser,
  onClose,
}: StoryViewerProps) {
  const { user } = useAuth();
  const [currentUser, setCurrentUser] = useState(initialUser);
  const [storyIndex, setStoryIndex] = useState(0);
  const [comment, setComment] = useState('');
  
  const [likes, setLikes] = useState<Tables<'story_likes'>[]>([]);
  const [comments, setComments] = useState<Awaited<ReturnType<typeof getStoryComments>>>([]);
  const [isLiked, setIsLiked] = useState(false);

  const userIds = Array.from(userStories.keys());
  const stories = userStories.get(currentUser);
  const currentStory = stories?.[storyIndex];

  useEffect(() => {
    setStoryIndex(0);
  }, [currentUser]);
  
  useEffect(() => {
    if (!currentStory) return;

    const fetchData = async () => {
      const [likesData, commentsData] = await Promise.all([
        getStoryLikes(currentStory.id),
        getStoryComments(currentStory.id)
      ]);

      setLikes(likesData);
      setComments(commentsData);

      if (user) {
        setIsLiked(likesData.some(like => like.user_id === user.id));
      }
    };

    fetchData();
  }, [currentStory, user]);

  useEffect(() => {
    if (!stories) return;
    if (currentStory?.media_type === 'video') return;

    const timer = setTimeout(() => {
      handleNextStory();
    }, 5000);

    return () => clearTimeout(timer);
  }, [storyIndex, currentUser, stories, currentStory]);

  const handleNextStory = () => {
    if (stories && storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      const currentUserIndex = userIds.indexOf(currentUser);
      if (currentUserIndex < userIds.length - 1) {
        setCurrentUser(userIds[currentUserIndex + 1]);
      } else {
        onClose();
      }
    }
  };
  
  const handlePrevStory = () => {
    if (storyIndex > 0) {
      setStoryIndex(storyIndex - 1)
    } else {
      const currentUserIndex = userIds.indexOf(currentUser);
      if (currentUserIndex > 0) {
        const prevUser = userIds[currentUserIndex - 1]
        setCurrentUser(prevUser);
        const prevUserStories = userStories.get(prevUser);
        if (prevUserStories) {
            setStoryIndex(prevUserStories.length - 1);
        }
      }
    }
  }

  const handleLike = async () => {
    if (!user || !currentStory) return;

    const originalIsLiked = isLiked;
    setIsLiked(!isLiked);

    try {
      if (originalIsLiked) {
        await unlikeStory(currentStory.id, user.id);
      } else {
        await likeStory(currentStory.id, user.id);
      }
    } catch (error) {
      setIsLiked(originalIsLiked); // Revert on error
    }
  };

  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!comment.trim() || !user || !currentStory) return;

    const newComment = comment.trim();
    setComment('');

    try {
        const returnedComment = await addStoryComment(currentStory.id, user.id, newComment);
        setComments(prev => [...prev, returnedComment]);
    } catch(error) {
        // Handle error, maybe show a toast notification
    }
  };

  if (!stories || stories.length === 0) return null;

  const storyProfile = currentStory?.profiles;
  if (!storyProfile) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center" onClick={onClose}>
      <div className="relative w-full h-full max-w-md max-h-screen flex flex-col justify-center" onClick={(e) => e.stopPropagation()}>
        <div className="absolute top-2 left-0 right-0 px-2 z-10">
            <div className="flex items-center space-x-1">
                {stories.map((_, idx) => (
                <div key={idx} className="h-1 flex-1 bg-gray-500/50 rounded-full">
                    <div
                        style={{
                            width: idx < storyIndex ? '100%' : (idx === storyIndex ? '100%' : '0%'),
                            transitionDuration: idx === storyIndex ? '5s' : '0s'
                        }}
                        className={`h-full bg-white rounded-full ${idx === storyIndex ? 'transition-width ease-linear' : ''}`}
                    />
                </div>
                ))}
            </div>
            <div className="flex items-center justify-between mt-2 text-white">
                <div className="flex items-center">
                    <Avatar className="w-8 h-8">
                        <AvatarImage src={storyProfile.avatar_url} />
                        <AvatarFallback>{storyProfile.full_name.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <span className="ml-2 font-semibold">{storyProfile.full_name}</span>
                </div>
                <button onClick={onClose} className="text--white"><X size={24} /></button>
            </div>
        </div>

        <div className="flex-1 flex items-center justify-center overflow-hidden">
          {currentStory.media_type === 'image' ? (
            <img src={currentStory.media_url} className="max-h-full object-contain" alt="Story content" />
          ) : (
            <video src={currentStory.media_url} className="max-h-full object-contain" autoPlay onEnded={handleNextStory} />
          )}
        </div>
        
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent">
          <AdBanner />
          <div className="flex items-center justify-between">
            <form onSubmit={handleCommentSubmit} className="flex-1 flex items-center">
              <Input
                type="text"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Add a comment..."
                className="bg-transparent border-gray-500 text-white placeholder-gray-400 rounded-full"
              />
              <Button type="submit" variant="ghost" size="icon" className="text-white">
                <Send size={24} />
              </Button>
            </form>
            <div className="flex items-center">
                <Button variant="ghost" size="icon" onClick={handleLike} className="text-white">
                <Heart size={24} className={isLiked ? 'fill-red-500 text-red-500' : ''} />
                </Button>
                <span className='text-white text-sm ml-1'>{likes.length}</span>
            </div>
          </div>
          <div className="mt-2 text-white text-sm space-y-1 max-h-24 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id}><b>{c.profiles?.full_name || 'User'}</b>: {c.comment}</div>
            ))}
          </div>
        </div>
        
        <div className="absolute top-1/2 left-2 -translate-y-1/2 z-10">
            <Button variant='ghost' size='icon' className="text-white" onClick={(e) => {e.stopPropagation(); handlePrevStory();}}>
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    &lt;
                </div>
            </Button>
        </div>
        <div className="absolute top-1/2 right-2 -translate-y-1/2 z-10">
            <Button variant='ghost' size='icon' className="text-white" onClick={(e) => {e.stopPropagation(); handleNextStory();}}>
                <div className="w-8 h-8 rounded-full bg-black/50 flex items-center justify-center">
                    &gt;
                </div>
            </Button>
        </div>
      </div>
    </div>
  );
}
