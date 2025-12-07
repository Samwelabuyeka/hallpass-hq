
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { UniversitySelector } from '@/components/university-selector';
import { useAuth } from '@/components/auth/auth-provider';
import { toast } from 'sonner';

export function Setup() {
  const { user, profile, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [universityId, setUniversityId] = useState('');

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
    }
    // If profile is loaded and university is already set, move on
    if (profile?.university_id) {
      if (profile.role === 'lecturer') {
        navigate('/dashboard'); // Or lecturer-specific page
      } else if (profile.course_id) {
        navigate('/dashboard');
      } else {
        navigate('/registration');
      }
    }
  }, [user, profile, authLoading, navigate]);

  const handleSubmit = async () => {
    if (!user || !universityId) {
      toast.error('Please select a university.');
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ university_id: universityId })
        .eq('user_id', user.id);

      if (error) throw error;

      toast.success('University saved!');
      
      // Manually refetch profile or update context if provider doesn't auto-update
      // For now, just navigate and let the destination handle it.
      if (profile?.role === 'lecturer') {
        navigate('/dashboard');
      } else {
        navigate('/registration');
      }

    } catch (error: any) {
      toast.error('Failed to save university', { description: error.message });
      console.error('Setup error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (authLoading || (!profile && user) || profile?.university_id) {
    return <div>Loading...</div>; // Or a proper loading spinner
  }

  return (
    <div className="flex justify-center items-center h-screen">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Welcome!</CardTitle>
          <CardDescription>Let's get your account set up. Please select your university to continue.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <UniversitySelector
            value={universityId}
            onValueChange={setUniversityId}
            placeholder="Select your university..."
          />
          <Button onClick={handleSubmit} className="w-full" disabled={loading || !universityId}>
            {loading ? 'Saving...' : 'Continue'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
