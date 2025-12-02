
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

// Define types for the dashboard data
interface DashboardStats {
  activeUnits: number;
  classesToday: number;
  upcomingExams: number;
  nextClass?: string;
  daysUntilNextExam?: number;
  nextExamUnit?: string;
}

export function useDashboard() {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [stats, setStats] = useState<DashboardStats>({
    activeUnits: 0,
    classesToday: 0,
    upcomingExams: 0,
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = useCallback(async () => {
    if (!user || !profile) return;

    try {
      setLoading(true);

      // 1. Get user's active unit codes
      const { data: studentUnits, error: studentUnitsError } = await supabase
        .from('student_units')
        .select('unit_code')
        .eq('student_id', user.id);
      
      if (studentUnitsError) throw studentUnitsError;
      const unitCodes = studentUnits.map(u => u.unit_code);
      const activeUnits = unitCodes.length;

      // 2. Get today's classes for those units
      const today = new Date();
      const dayOfWeek = today.toLocaleString('en-us', { weekday: 'long' });
      const { data: classesTodayData, error: classesError } = await supabase
        .from('timetable_entries')
        .select('*, units(name)') // Join with units to get name
        .in('unit_code', unitCodes)
        .eq('day_of_week', dayOfWeek);

      if (classesError) throw classesError;

      const classesTodayCount = classesTodayData?.length || 0;

      // 3. Find the next class
      const now = new Date();
      const nextClass = classesTodayData
        ?.filter(c => {
            const [hour, minute] = c.start_time.split(':');
            const classStartTime = new Date(now);
            classStartTime.setHours(parseInt(hour, 10), parseInt(minute, 10), 0, 0);
            return classStartTime > now;
        })
        .sort((a,b) => a.start_time.localeCompare(b.start_time))[0];

      const nextClassInfo = nextClass ? `${nextClass.units.name} at ${nextClass.start_time}` : 'No more classes today';

      // 4. Get upcoming exams for the user's units
      const { data: examsData, error: examsError } = await supabase
        .from('exams')
        .select('*, units(name)') // Join with units table
        .in('unit_code', unitCodes)
        .gte('exam_date', today.toISOString())
        .order('exam_date', { ascending: true });
        
      if (examsError) throw examsError;

      const upcomingExamsCount = examsData?.length || 0;
      
      // 5. Get next exam info
      let daysUntilNextExam: number | undefined;
      let nextExamUnit: string | undefined;

      if (examsData && examsData.length > 0) {
          const nextExam = examsData[0];
          const examDate = new Date(nextExam.exam_date);
          const diffTime = examDate.getTime() - today.getTime();
          daysUntilNextExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          nextExamUnit = nextExam.units.name;
      }

      setStats({
          activeUnits,
          classesToday: classesTodayCount,
          upcomingExams: upcomingExamsCount,
          nextClass: nextClassInfo,
          daysUntilNextExam,
          nextExamUnit,
      });

    } catch (error: any) {
      toast({
        title: 'Error fetching dashboard data',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user, profile, toast]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  return { stats, loading, refetch: fetchDashboardData };
}
