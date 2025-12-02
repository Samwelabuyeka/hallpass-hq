
import { useState } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';

export function CreateStory() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleSubmit = async () => {
    if (!file || !user) {
      toast.error('You must select a file to upload.');
      return;
    }

    setLoading(true);
    const fileExtension = file.name.split('.').pop();
    const fileName = `${user.id}-${Date.now()}.${fileExtension}`;
    const filePath = `public/${fileName}`;

    try {
      // 1. Upload the file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('stories')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 2. Get the public URL of the uploaded file
      const { data: urlData } = supabase.storage
        .from('stories')
        .getPublicUrl(filePath);
      
      const publicUrl = urlData.publicUrl;

      // 3. Create a new entry in the 'stories' table
      const { error: dbError } = await supabase
        .from('stories')
        .insert({
          user_id: user.id,
          content_url: publicUrl,
          story_type: file.type.startsWith('video') ? 'video' : 'image',
        });

      if (dbError) throw dbError;

      toast.success('Story uploaded successfully!');
      navigate('/dashboard'); // Or wherever the story reel is

    } catch (error: any) {
      toast.error('Failed to upload story', { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <Card className="max-w-md mx-auto">
        <CardHeader>
          <CardTitle>Create a New Story</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <label htmlFor="story-file" className="block text-sm font-medium text-muted-foreground mb-2">
              Upload Image or Video (max 24 hours)
            </label>
            <Input id="story-file" type="file" onChange={handleFileChange} accept="image/*,video/*" />
          </div>
          {file && (
            <div className="text-sm text-center">Preview: {file.name}</div>
          )}
          <Button onClick={handleSubmit} disabled={loading} className="w-full">
            {loading ? 'Uploading...' : 'Upload Story'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
