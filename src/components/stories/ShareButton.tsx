import { Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface ShareButtonProps {
  storyId: string;
}

export function ShareButton({ storyId }: ShareButtonProps) {
  const { toast } = use-toast();

  const handleShare = () => {
    const storyUrl = `${window.location.origin}/stories/${storyId}`;
    navigator.clipboard.writeText(storyUrl);
    toast({
      title: 'Link Copied',
      description: 'The story link has been copied to your clipboard.',
    });
  };

  return (
    <Button variant="outline" size="sm" onClick={handleShare}>
      <Share2 className="mr-2 h-4 w-4" />
      Share
    </Button>
  );
}
