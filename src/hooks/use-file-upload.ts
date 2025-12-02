
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface UploadedFile {
  id: string;
  name: string;
  url: string;
  created_at: string;
}

export function useFileUpload() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);

  const listFiles = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      const { data, error } = await supabase.storage
        .from('files') // Your storage bucket name
        .list(user.id, { // Folder named after the user's ID
          limit: 100,
          offset: 0,
          sortBy: { column: 'created_at', order: 'desc' },
        });

      if (error) throw error;

      const fileUrls = await Promise.all(
        data.map(async (file) => {
            const { data: urlData } = await supabase.storage
              .from('files')
              .getPublicUrl(`${user.id}/${file.name}`);
            
            return {
              id: file.id,
              name: file.name,
              url: urlData.publicUrl,
              created_at: (file.metadata as any)?.lastModified || new Date().toISOString(),
            };
        })
      );
      
      setFiles(fileUrls as UploadedFile[]);
    } catch (error: any) {
      toast({
        title: 'Error listing files',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    listFiles();
  }, [listFiles]);

  const uploadFile = async (file: File) => {
    if (!user) return;

    try {
      setUploading(true);
      const { error } = await supabase.storage
        .from('files')
        .upload(`${user.id}/${file.name}`, file, { // Use user.id as the folder
          cacheControl: '3600',
          upsert: false, // Set to true to overwrite existing files
        });

      if (error) throw error;

      await listFiles(); // Refresh the file list
      toast({ title: 'File uploaded successfully' });
    } catch (error: any) {
      toast({
        title: 'Error uploading file',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const deleteFile = async (fileName: string) => {
    if (!user) return;

    try {
      const { error } = await supabase.storage
        .from('files')
        .remove([`${user.id}/${fileName}`]); // Use user.id as the folder

      if (error) throw error;

      await listFiles(); // Refresh the file list
      toast({ title: 'File deleted successfully' });
    } catch (error: any) {
      toast({
        title: 'Error deleting file',
        description: error.message,
        variant: 'destructive',
      });
    }
  };

  return { files, loading, uploading, uploadFile, deleteFile, refetch: listFiles };
}
