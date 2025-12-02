
import { useState, useEffect, useRef } from 'react';
import { Story } from './StoryReel';
import { X } from 'lucide-react';

interface StoryViewerProps {
  initialUserId: string;
  userStories: Map<string, Story[]>;
  onClose: () => void;
}

export function StoryViewer({ initialUserId, userStories, onClose }: StoryViewerProps) {
  const [currentUser, setCurrentUser] = useState(initialUserId);
  const [storyIndex, setStoryIndex] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);

  const stories = userStories.get(currentUser) || [];
  const currentStory = stories[storyIndex];

  useEffect(() => {
    const timer = setTimeout(() => {
        if (currentStory.story_type === 'image') {
            handleNextStory();
        }
    }, 5000); // 5 seconds for images

    return () => clearTimeout(timer);
  }, [storyIndex, currentUser]);

  const handleNextStory = () => {
    if (storyIndex < stories.length - 1) {
      setStoryIndex(storyIndex + 1);
    } else {
      // Move to the next user or close
      const userIds = Array.from(userStories.keys());
      const currentUserIndex = userIds.indexOf(currentUser);
      if (currentUserIndex < userIds.length - 1) {
        setCurrentUser(userIds[currentUserIndex + 1]);
        setStoryIndex(0);
      } else {
        onClose();
      }
    }
  };

  const onVideoEnd = () => {
      handleNextStory();
  }

  if (!currentStory) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-90 z-50 flex items-center justify-center">
      <div className="relative w-full h-full max-w-md max-h-screen">
        {/* Close Button */}
        <button onClick={onClose} className="absolute top-4 right-4 text-white z-50">
            <X size={32} />
        </button>

        {/* Story Content */}
        <div className="w-full h-full flex items-center justify-center">
            {currentStory.story_type === 'image' ? (
                <img src={currentStory.content_url} className="max-h-full max-w-full object-contain" alt="Story" />
            ) : (
                <video ref={videoRef} src={currentStory.content_url} className="max-h-full max-w-full object-contain" autoPlay onEnded={onVideoEnd} />
            )}
        </div>

        {/* Progress Bars */}
        <div className="absolute top-2 left-2 right-2 flex space-x-1">
            {stories.map((_, index) => (
                <div key={index} className="h-1 flex-1 bg-gray-500 rounded-full">
                    <div style={{ width: `${index < storyIndex ? 100 : (index === storyIndex ? 50 : 0)}%` }} 
                         className="h-full bg-white rounded-full transition-all duration-200">
                    </div>
                </div>
            ))}
        </div>
      </div>
    </div>
  );
}
