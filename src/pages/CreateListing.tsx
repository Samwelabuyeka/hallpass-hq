
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

export function CreateListing() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
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
      toast.error('You must be logged in to create a listing.');
      return;
    }
    if (!title.trim() || !price.trim() || !file) {
      toast.error('Please fill out the title, price, and upload a photo.');
      return;
    }

    setLoading(true);

    try {
      const media_url = await uploadFile(file) as unknown as string;
      if (!media_url) {
        throw new Error('File upload failed.');
      }

      const { error } = await supabase.from('listings').insert({
        user_id: user.id,
        title,
        description,
        price: parseFloat(price),
        media_url,
        media_type: file.type.startsWith('video') ? 'video' : 'image',
      });

      if (error) throw error;

      toast.success('Listing created successfully!');
      navigate('/marketplace'); // Navigate to the marketplace to see the new listing
    } catch (error: any) {
      toast.error('Failed to create listing', { description: error.message });
      console.error('Listing creation error:', error);
    } finally {
      setLoading(false);
    }
  };

  const isSubmitDisabled = loading || uploading || !title.trim() || !price.trim() || !file;

  return (
    <div className="p-4 flex justify-center">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Create a New Listing</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="What are you selling?"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
          <Textarea
            placeholder="Describe your item in detail..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />
          <Input
            type="number"
            placeholder="Price (e.g., 25.00)"
            value={price}
            onChange={(e) => setPrice(e.target.value)}
          />
          <div>
            <label htmlFor="media-upload" className="block text-sm font-medium text-gray-700 mb-2">
              Upload Photo or Video
            </label>
            <Input 
              id="media-upload" 
              type="file" 
              onChange={handleFileChange} 
              accept="image/*,video/*"
              required
            />
          </div>
          <Button onClick={handleSubmit} disabled={isSubmitDisabled} className="w-full">
            {loading || uploading ? 'Creating Listing...' : 'Post Listing'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
