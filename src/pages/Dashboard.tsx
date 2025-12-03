import { useAuth } from "@/components/auth/auth-provider";
import LecturerDashboard from "./LecturerDashboard";
import StudentDashboard from "./StudentDashboard";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { PostgrestError } from "@supabase/supabase-js";

// Define the profile type based on the database schema
interface Profile {
  id: string;
  full_name: string;
  avatar_url?: string;
  role?: "student" | "lecturer" | "admin";
}

function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<PostgrestError | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      if (user) {
        try {
          setLoading(true);
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            throw error;
          }

          if (data) {
            setProfile(data);
          }
        } catch (error: any) {
          setError(error);
        } finally {
          setLoading(false);
        }
      }
    }

    fetchProfile();
  }, [user]);

  if (loading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>Error: {error.message}</div>;
  }

  const renderDashboard = () => {
    if (!profile) {
      return <div>Profile not found.</div>;
    }

    switch (profile.role) {
      case "student":
        return <StudentDashboard />;
      case "lecturer":
        return <LecturerDashboard profile={profile} />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
    <div className="p-4">
      <div className="mt-4">
        {renderDashboard()}
      </div>
    </div>
  );
}

export default Dashboard;
