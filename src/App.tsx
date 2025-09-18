import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider, useAuth } from "@/components/auth/auth-provider";
import { LoginForm } from "@/components/auth/login-form";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import Setup from "./pages/Setup";
import Timetable from "./pages/Timetable";
import TimetableSimple from "./pages/TimetableSimple";
import Units from "./pages/Units";
import Profile from "./pages/Profile";
import Announcements from "./pages/Announcements";
import Admin from "./pages/Admin";
import Exams from "./pages/Exams";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { user, loading } = useAuth();

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

  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/setup" element={<Setup />} />
      <Route path="/timetable" element={<Timetable />} />
      <Route path="/timetable-simple" element={<TimetableSimple />} />
      <Route path="/units" element={<Units />} />
      <Route path="/exams" element={<Exams />} />
      <Route path="/profile" element={<Profile />} />
      <Route path="/announcements" element={<Announcements />} />
      <Route path="/admin" element={<Admin />} />
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
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
