import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// Define the type for a single announcement
export interface Announcement {
  id: string;
  title: string;
  content: string;
  created_at: string;
  author_id: string;
  course_id?: string;
  university_id?: string;
  profiles: { // Assuming a join with profiles table
    full_name: string;
    avatar_url: string;
  } | null;
}

export function useAnnouncements() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAnnouncements = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);

      // Build the query dynamically
      let query = supabase
        .from('announcements')
        .select(`
          id, 
          title, 
          content, 
          created_at, 
          author_id,
          course_id,
          university_id,
          profiles (full_name, avatar_url)
        `)
        .order('created_at', { ascending: false });

      // Construct the filter string for course and university
      const filters = [];
      if (profile.course) {
        filters.push(`course_id.eq.${profile.course}`);
      }
      if (profile.university) {
        filters.push(`university_id.eq.${profile.university}`);
      }
      // A general filter for announcements with no specific course or university
      filters.push('course_id.is.null,university_id.is.null');

      // Apply the filters using 'or' logic
      query = query.or(filters.join(','));

      const { data, error } = await query;

      if (error) throw error;
      
      setAnnouncements(data as Announcement[]);

    } catch (error: any) {
      toast({
        title: 'Error fetching announcements',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return { announcements, loading, refetch: fetchAnnouncements };
}
