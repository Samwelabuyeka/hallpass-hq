import { supabase } from "@/integrations/supabase/client";

export interface ClassNotification {
  unit_code: string;
  unit_name: string;
  time_start: string;
  venue?: string;
  day: string;
}

export const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) {
    console.log("This browser does not support notifications");
    return false;
  }

  if (Notification.permission === "granted") {
    return true;
  }

  if (Notification.permission !== "denied") {
    const permission = await Notification.requestPermission();
    return permission === "granted";
  }

  return false;
};

export const scheduleClassNotifications = async () => {
  const hasPermission = await requestNotificationPermission();
  if (!hasPermission) {
    console.log("Notification permission not granted");
    return;
  }

  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('university_id, semester, year')
      .eq('user_id', user.id)
      .single();

    if (!profile) return;

    // Get student's active units
    const { data: studentUnits } = await supabase
      .from('student_units')
      .select('unit_code')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .eq('semester', profile.semester)
      .eq('year', profile.year);

    if (!studentUnits || studentUnits.length === 0) return;

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase();
    
    // Get today's classes
    const { data: todayClasses } = await supabase
      .from('master_timetables')
      .select('*')
      .eq('university_id', profile.university_id)
      .eq('semester', profile.semester)
      .eq('year', profile.year)
      .eq('day', today)
      .in('unit_code', studentUnits.map(u => u.unit_code))
      .order('time_start');

    if (!todayClasses) return;

    // Schedule notifications for classes starting in the next 30 minutes
    const now = new Date();
    const thirtyMinutesFromNow = new Date(now.getTime() + 30 * 60000);

    todayClasses.forEach(classItem => {
      if (!classItem.time_start) return;

      const [hours, minutes] = classItem.time_start.split(':').map(Number);
      const classTime = new Date();
      classTime.setHours(hours, minutes, 0, 0);

      // Check if class is within the next 30 minutes
      const timeDiff = classTime.getTime() - now.getTime();
      const minutesUntilClass = Math.floor(timeDiff / 60000);

      if (minutesUntilClass > 0 && minutesUntilClass <= 30) {
        // Schedule notification
        setTimeout(() => {
          new Notification(`Class Starting Soon! 🎓`, {
            body: `${classItem.unit_code} - ${classItem.unit_name}\nStarts in ${minutesUntilClass} minutes\n${classItem.venue || 'Check venue'}`,
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: `class-${classItem.id}`,
            requireInteraction: false,
          });
        }, timeDiff - 15 * 60000); // Notify 15 minutes before
      }
    });
  } catch (error) {
    console.error('Error scheduling notifications:', error);
  }
};

export const checkAndNotifyUpcomingClasses = () => {
  // Check every 5 minutes
  scheduleClassNotifications();
  setInterval(scheduleClassNotifications, 5 * 60000);
};
