import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { format, startOfWeek, endOfWeek, eachDayOfInterval, addWeeks, subWeeks, isSameDay, parseISO } from "date-fns";

interface TimetableEntry {
  id: string;
  unit_code: string;
  unit_name: string;
  type: string;
  day: string;
  time_start: string;
  time_end: string;
  venue?: string;
}

interface WeekCalendarProps {
  entries: TimetableEntry[];
}

const DAYS_MAP: Record<string, number> = {
  'SUNDAY': 0,
  'MONDAY': 1,
  'TUESDAY': 2,
  'WEDNESDAY': 3,
  'THURSDAY': 4,
  'FRIDAY': 5,
  'SATURDAY': 6,
};

export const WeekCalendar = ({ entries }: WeekCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [weekDays, setWeekDays] = useState<Date[]>([]);

  useEffect(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 1 }); // Start on Monday
    const end = endOfWeek(currentDate, { weekStartsOn: 1 });
    setWeekDays(eachDayOfInterval({ start, end }));
  }, [currentDate]);

  const goToPreviousWeek = () => setCurrentDate(subWeeks(currentDate, 1));
  const goToNextWeek = () => setCurrentDate(addWeeks(currentDate, 1));
  const goToToday = () => setCurrentDate(new Date());

  const getEntriesForDay = (date: Date) => {
    const dayName = format(date, 'EEEE').toUpperCase();
    return entries.filter(entry => entry.day === dayName);
  };

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'lecture': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'lab': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
    }
  };

  const isToday = (date: Date) => isSameDay(date, new Date());

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5" />
            Week View
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={goToNextWeek}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="text-sm text-muted-foreground">
          {format(weekDays[0] || new Date(), 'MMM d')} - {format(weekDays[6] || new Date(), 'MMM d, yyyy')}
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-2">
          {weekDays.map((day, index) => {
            const dayEntries = getEntriesForDay(day);
            const today = isToday(day);

            return (
              <div
                key={index}
                className={`min-h-32 p-3 rounded-lg border ${
                  today ? 'border-primary bg-primary/5' : 'border-border'
                }`}
              >
                <div className="mb-2">
                  <div className={`text-sm font-semibold ${today ? 'text-primary' : ''}`}>
                    {format(day, 'EEE')}
                  </div>
                  <div className={`text-2xl font-bold ${today ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </div>
                </div>
                <div className="space-y-1.5">
                  {dayEntries.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No classes</div>
                  ) : (
                    dayEntries
                      .sort((a, b) => a.time_start.localeCompare(b.time_start))
                      .map((entry) => (
                        <div
                          key={entry.id}
                          className="text-xs p-2 rounded border bg-card space-y-1"
                        >
                          <Badge className={getTypeColor(entry.type)} variant="secondary">
                            {entry.type}
                          </Badge>
                          <div className="font-medium truncate" title={entry.unit_name}>
                            {entry.unit_code}
                          </div>
                          <div className="text-muted-foreground">
                            {entry.time_start.slice(0, 5)} - {entry.time_end.slice(0, 5)}
                          </div>
                          {entry.venue && (
                            <div className="text-muted-foreground truncate" title={entry.venue}>
                              {entry.venue}
                            </div>
                          )}
                        </div>
                      ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
