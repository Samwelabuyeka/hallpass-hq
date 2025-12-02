
import { useAuth } from "@/components/auth/auth-provider";
import { UserOnboarding } from "@/components/onboarding/user-onboarding";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { StudentDashboard } from "./student-dashboard";
import { LecturerDashboard } from "./lecturer-dashboard";
import { AdminDashboard } from "./admin-dashboard";
import { StoryReel, Story } from "@/components/stories/StoryReel";
import { StoryViewer } from "@/components/stories/StoryViewer";
import { useDashboard } from "@/hooks/use-dashboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Rocket } from "lucide-react";

const StudentDashboard = ({ profile }) => {
  const { stats, loading, refetch } = useDashboard();

  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader>
            <CardTitle>Active Units</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.activeUnits}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Classes Today</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.classesToday}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Exams</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold">{stats.upcomingExams}</p>
          </CardContent>
        </Card>
      </div>
      <Alert>
        <Rocket className="h-4 w-4" />
        <AlertTitle>Next up!</AlertTitle>
        <AlertDescription>
            {stats.nextClass}
        </AlertDescription>
      </Alert>
      {stats.daysUntilNextExam !== undefined && (
        <Alert>
            <Rocket className="h-4 w-4" />
            <AlertTitle>Exam Countdown</AlertTitle>
            <AlertDescription>
                {stats.daysUntilNextExam} days until your next exam for {stats.nextExamUnit}.
            </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export function Dashboard() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  const [selectedStoryUser, setSelectedStoryUser] = useState<string | null>(null);
  const [allStories, setAllStories] = useState<Map<string, Story[]>>(new Map());

  useEffect(() => {
    if (user) {
      supabase
        .from("profiles")
        .select("*, universities(name)")
        .eq("user_id", user.id)
        .single()
        .then(({ data, error }) => {
          if (error && error.code !== 'PGRST116') { // Ignore 'exact one row' error for new users
            console.error(error);
          } else {
            setProfile(data);
          }
          setLoading(false);
        });
    }
  }, [user]);

  const handleStorySelect = (userId: string, stories: Story[]) => {
      const allUserStories = new Map<string, Story[]>();
      allUserStories.set(userId, stories);
      setAllStories(allUserStories);
      setSelectedStoryUser(userId);
  }

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!profile || !profile.role) {
    return <UserOnboarding />;
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "student":
        return <StudentDashboard profile={profile} />;
      case "lecturer":
        return <LecturerDashboard profile={profile} />;
      case "admin":
        return <AdminDashboard />;
      default:
        return <div>Unknown role</div>;
    }
  };

  return (
      <div className="p-4">
          <StoryReel onStorySelect={handleStorySelect} />
          {selectedStoryUser && (
              <StoryViewer 
                  initialUserId={selectedStoryUser}
                  userStories={allStories} 
                  onClose={() => setSelectedStoryUser(null)}
              />
          )}
          <div className="mt-4">
              {renderDashboard()}
          </div>
      </div>
  )
}
