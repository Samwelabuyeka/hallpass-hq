
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
  const { isUploading, uploadFile } = useFileUpload();
  const [loading, setLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }[{
      "resource": "/home/user/hallpass-hq/src/pages/CreateStory.tsx",
      "owner": "typescript",
      "code": "2339",
      "severity": 8,
      "message": "Property 'isUploading' does not exist on type '{ files: UploadedFile[]; loading: boolean; uploading: boolean; uploadFile: (file: File) => Promise<void>; deleteFile: (fileName: string) => Promise<void>; refetch: () => Promise<...>; }'.",
      "source": "ts",
      "startLineNumber": 18,
      "startColumn": 11,
      "endLineNumber": 18,
      "endColumn": 22
    },{
      "resource": "/home/user/hallpass-hq/src/pages/CreateStory.tsx",
      "owner": "typescript",
      "code": "2554",
      "severity": 8,
      "message": "Expected 1 arguments, but got 2.",
      "source": "ts",
      "startLineNumber": 44,
      "startColumn": 52,
      "endLineNumber": 44,
      "endColumn": 65
    },{
      "resource": "/home/user/hallpass-hq/src/pages/CreateStory.tsx",
      "owner": "typescript",
      "code": "1345",
      "severity": 8,
      "message": "An expression of type 'void' cannot be tested for truthiness.",
      "source": "ts",
      "startLineNumber": 45,
      "startColumn": 13,
      "endLineNumber": 45,
      "endColumn": 24
    },{
      "resource": "/home/user/hallpass-hq/src/pages/CreateStory.tsx",
      "owner": "typescript",
      "code": "2769",
      "severity": 8,
      "message": "No overload matches this call.\n  Overload 1 of 2, '(relation: \"class_reps\" | \"universities\" | \"exam_timetables\" | \"imported_rows\" | \"main_timetables\" | \"master_timetables\" | \"master_units\" | \"notification_recipients\" | \"notifications\" | \"profiles\" | \"student_units\" | \"timetable_audit\"): PostgrestQueryBuilder<...>', gave the following error.\n    Argument of type '\"stories\"' is not assignable to parameter of type '\"class_reps\" | \"universities\" | \"exam_timetables\" | \"imported_rows\" | \"main_timetables\" | \"master_timetables\" | \"master_units\" | \"notification_recipients\" | \"notifications\" | \"profiles\" | \"student_units\" | \"timetable_audit\"'.\n  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder<{ PostgrestVersion: \"13.0.5\"; }, { Tables: { class_reps: { Row: { created_at: string; id: string; is_active: boolean; semester: number; unit_code: string; unit_name: string; university_id: string; user_id: string; year: number; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 10 more ...; universities: { ...; }; }; Views: {}; Functions: { ...; }; Enums: {}; CompositeTypes: {}; }, never, never, never>', gave the following error.\n    Argument of type '\"stories\"' is not assignable to parameter of type 'never'.",
      "source": "ts",
      "startLineNumber": 53,
      "startColumn": 45,
      "endLineNumber": 53,
      "endColumn": 54
    }]
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
      let media_url = null;
      let media_type = null;

      if (file) {
        const uploadedUrl = await uploadFile(file, 'story_media');
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

  const isSubmitDisabled = loading || isUploading || (!content.trim() && !file);

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
            {loading || isUploading ? 'Creating...' : 'Post Story'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
[{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2307",
	"severity": 8,
	"message": "Cannot find module '@/components/ui/AdBanner' or its corresponding type declarations.",
	"source": "ts",
	"startLineNumber": 7,
	"startColumn": 26,
	"endLineNumber": 7,
	"endColumn": 52
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2769",
	"severity": 8,
	"message": "No overload matches this call.\n  Overload 1 of 2, '(relation: \"class_reps\" | \"universities\" | \"exam_timetables\" | \"imported_rows\" | \"main_timetables\" | \"master_timetables\" | \"master_units\" | \"notification_recipients\" | \"notifications\" | \"profiles\" | \"student_units\" | \"timetable_audit\"): PostgrestQueryBuilder<...>', gave the following error.\n    Argument of type '\"listings\"' is not assignable to parameter of type '\"class_reps\" | \"universities\" | \"exam_timetables\" | \"imported_rows\" | \"main_timetables\" | \"master_timetables\" | \"master_units\" | \"notification_recipients\" | \"notifications\" | \"profiles\" | \"student_units\" | \"timetable_audit\"'.\n  Overload 2 of 2, '(relation: never): PostgrestQueryBuilder<{ PostgrestVersion: \"13.0.5\"; }, { Tables: { class_reps: { Row: { created_at: string; id: string; is_active: boolean; semester: number; unit_code: string; unit_name: string; university_id: string; user_id: string; year: number; }; Insert: { ...; }; Update: { ...; }; Relationships: [...]; }; ... 10 more ...; universities: { ...; }; }; Views: {}; Functions: { ...; }; Enums: {}; CompositeTypes: {}; }, never, never, never>', gave the following error.\n    Argument of type '\"listings\"' is not assignable to parameter of type 'never'.",
	"source": "ts",
	"startLineNumber": 12,
	"startColumn": 11,
	"endLineNumber": 12,
	"endColumn": 21
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'id' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'id' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 50,
	"startColumn": 32,
	"endLineNumber": 50,
	"endColumn": 34
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'media_url' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'media_url' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 52,
	"startColumn": 35,
	"endLineNumber": 52,
	"endColumn": 44
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'title' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'title' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 52,
	"startColumn": 59,
	"endLineNumber": 52,
	"endColumn": 64
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'title' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'title' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 55,
	"startColumn": 80,
	"endLineNumber": 55,
	"endColumn": 85
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'profiles' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'profiles' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 57,
	"startColumn": 28,
	"endLineNumber": 57,
	"endColumn": 36
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'profiles' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'profiles' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 57,
	"startColumn": 53,
	"endLineNumber": 57,
	"endColumn": 61
},{
	"resource": "/home/user/hallpass-hq/src/pages/Marketplace.tsx",
	"owner": "typescript",
	"code": "2339",
	"severity": 8,
	"message": "Property 'price' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\"> | SelectQueryError<\"column 'title' does not exist on 'universities'.\"> | ... 9 more ... | SelectQueryError<...>'.\n  Property 'price' does not exist on type 'SelectQueryError<\"column 'title' does not exist on 'class_reps'.\">'.",
	"source": "ts",
	"startLineNumber": 61,
	"startColumn": 62,
	"endLineNumber": 61,
	"endColumn": 67
}]