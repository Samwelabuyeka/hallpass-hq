import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import { CookieBanner } from "@/components/monetization/cookie-banner";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Timetable from "./pages/Timetable";
import TimetableSimple from "./pages/TimetableSimple";
import Units from "./pages/Units";
import Profile from "./pages/Profile";
import Announcements from "./pages/Announcements";
import Admin from "./pages/Admin";
import Exams from "./pages/Exams";
import Files from "./pages/Files";
import Notifications from "./pages/Notifications";
import ClassRep from "./pages/ClassRep";
import TimetableImport from "./pages/TimetableImport";
import ChatPage from "./pages/Chat";
import ConnectionsPage from "./pages/Connections";
import { Registration } from "./pages/Registration";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading, profile } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  // If user is logged in but has no course, redirect to registration
  if (user && !profile?.course) {
    return (
      <Routes>
        <Route path="/registration" element={<Registration />} />
        <Route path="*" element={<Navigate to="/registration" />} />
      </Routes>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/chat" element={<ChatPage />} />
      <Route path="/connections" element={<ConnectionsPage />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/timetable-simple" element={<TimetableSimple />} />
      <Route path="/units" element={<Units />} />
      <Route path="/exams" element={<Exams />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/files" element={<Files />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/class-rep" element={<ClassRep />} />
      <Route path="/admin" element={<Admin />} />
      <Route path="/timetable-import" element={<TimetableImport />} />
      <Route path="/registration" element={<Registration />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
          <CookieBanner />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
