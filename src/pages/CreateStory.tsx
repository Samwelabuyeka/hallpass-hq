
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { useFileUpload } from '@/hooks/use-file-upload';

export function CreateStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const { uploading, uploadFile } = useFileUpload();
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!user) {
      toast.error('You must be logged in to create a story.');
      return;
    }
    if (!content.trim() && !file) {
      toast.error('A story must have either content or media.');
      return;
    }

    setLoading(true);

    try {
      let media_url: string | null = null;
      let media_type: string | null = null;

      if (file) {
        const uploadedUrl = await uploadFile(file) as unknown as string;
        if (uploadedUrl) {
          media_url = uploadedUrl;
          media_type = file.type.startsWith('video') ? 'video' : 'image';
        } else {
          throw new Error('File upload failed.');
        }
      }

      const { error } = await supabase.from('stories').insert({
        user_id: user.id,
        content,
        media_url,
        media_type,
      });

      if (error) throw error;

      toast.success('Story created successfully!');
      navigate('/stories');
    } catch (error: any) {
      toast.error('Failed to create story', { description: error.message });
      console.error('Story creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || uploading || (!content.trim() && !file);

  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Textarea
            placeholder="What's on your mind?"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
          />
          <div>
            <label htmlFor="media-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Image or Video (Optional)
            </label>
            <Input 
              id="media-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*,video/*"
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full">
            {loading || uploading ? 'Creating...' : 'Post Story'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
