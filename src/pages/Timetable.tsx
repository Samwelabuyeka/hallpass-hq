import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Calendar, Clock, MapPin, User, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { WeekCalendar } from "@/components/calendar/week-calendar"
import { NotificationToggle } from "@/components/notifications/notification-toggle"

interface TimetableEntry {
  id: string
  type: 'lecture' | 'tutorial' | 'lab' | 'exam'
  day: string | null
  time_start: string | null
  time_end: string | null
  exam_date: string | null
  venue: string | null
  lecturer: string | null
  unit: {
    code: string
    name: string
  }
}

const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

export default function Timetable() {
  const [timetableEntries, setTimetableEntries] = useState<TimetableEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSetup, setHasSetup] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkSetupAndLoadTimetable()
  }, [])

  const checkSetupAndLoadTimetable = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate("/")
        return
      }

      // Check if user has completed setup
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id, student_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (!profile?.university_id || !profile?.student_id) {
        navigate("/setup")
        return
      }

      setHasSetup(true)
      await loadTimetable(user.id)
    } catch (error) {
      console.error('Error checking setup:', error)
      toast({
        title: "Error",
        description: "Failed to load your information",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadTimetable = async (userId: string) => {
    try {
      // Get student's selected courses
      const { data: studentCourses, error: coursesError } = await supabase
        .from('student_units')
        .select('unit_code')
        .eq('user_id', userId)
        .eq('is_active', true)

      if (coursesError) throw coursesError

      if (!studentCourses || studentCourses.length === 0) {
        setTimetableEntries([])
        return
      }

      const courseCodes = studentCourses.map(sc => sc.unit_code)

      // Get timetable entries for these courses
      const { data: timetable, error: timetableError } = await supabase
        .from('master_timetables')
        .select('id, type, day, time_start, time_end, exam_date, venue, lecturer, unit_code, unit_name')
        .in('unit_code', courseCodes)
        .order('day')
        .order('time_start')

      if (timetableError) throw timetableError

      const formattedEntries: TimetableEntry[] = (timetable || []).map(entry => ({
        id: entry.id,
        type: entry.type as any,
        day: entry.day,
        time_start: entry.time_start,
        time_end: entry.time_end,
        exam_date: entry.exam_date,
        venue: entry.venue,
        lecturer: entry.lecturer,
        unit: {
          code: entry.unit_code,
          name: entry.unit_name
        }
      }))

      setTimetableEntries(formattedEntries)
    } catch (error) {
      console.error('Error loading timetable:', error)
      toast({
        title: "Error",
        description: "Failed to load your timetable",
        variant: "destructive",
      })
    }
  }

  const groupedByDay = timetableEntries.reduce((acc, entry) => {
    if (!entry.day) return acc
    if (!acc[entry.day]) acc[entry.day] = []
    acc[entry.day].push(entry)
    return acc
  }, {} as Record<string, TimetableEntry[]>)

  const examEntries = timetableEntries.filter(entry => entry.exam_date)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'lab': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="text-center">Loading your timetable...</div>
        </div>
      </AppLayout>
    )
  }

  if (!hasSetup) {
    return null // Will redirect to setup
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight">My Timetable</h2>
            <p className="text-muted-foreground">
              Your personalized class schedule and exam dates
            </p>
          </div>
          <Button variant="outline" onClick={() => navigate("/setup")}>
            <Settings className="mr-2 h-4 w-4" />
            Update Setup
          </Button>
        </div>

        {timetableEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Timetable Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No classes found for your selected units. This could mean:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>• The timetable hasn't been uploaded by your university yet</li>
                <li>• You need to select different units</li>
                <li>• The semester/year settings need adjustment</li>
              </ul>
              <Button onClick={() => navigate("/setup")}>
                Update Your Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Notification Toggle */}
            <NotificationToggle />

            {/* Week Calendar View */}
            <WeekCalendar 
              entries={timetableEntries
                .filter(e => e.day && e.time_start && e.time_end)
                .map(e => ({
                  id: e.id,
                  unit_code: e.unit.code,
                  unit_name: e.unit.name,
                  type: e.type,
                  day: e.day!,
                  time_start: e.time_start!,
                  time_end: e.time_end!,
                  venue: e.venue || undefined
                }))}
            />

            {/* Weekly Schedule */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Weekly Schedule
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {DAYS_ORDER.map(day => {
                    const dayEntries = groupedByDay[day] || []
                    if (dayEntries.length === 0) return null

                    return (
                      <div key={day} className="space-y-3">
                        <h4 className="font-semibold text-lg">{day}</h4>
                        <div className="grid gap-3">
                          {dayEntries.map(entry => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-4 rounded-lg border bg-card"
                            >
                              <div className="flex items-center gap-4">
                                <Badge className={getTypeColor(entry.type)}>
                                  {entry.type}
                                </Badge>
                                <div>
                                  <div className="font-medium">
                                    {entry.unit.code} - {entry.unit.name}
                                  </div>
                                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                    {entry.time_start && entry.time_end && (
                                      <span className="flex items-center gap-1">
                                        <Clock className="h-3 w-3" />
                                        {entry.time_start} - {entry.time_end}
                                      </span>
                                    )}
                                    {entry.venue && (
                                      <span className="flex items-center gap-1">
                                        <MapPin className="h-3 w-3" />
                                        {entry.venue}
                                      </span>
                                    )}
                                    {entry.lecturer && (
                                      <span className="flex items-center gap-1">
                                        <User className="h-3 w-3" />
                                        {entry.lecturer}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Exam Schedule */}
            {examEntries.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <Calendar className="h-5 w-5" />
                    Exam Schedule
                  </CardTitle>
                  <CardDescription>
                    Upcoming examinations for your units
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-3">
                    {examEntries
                      .sort((a, b) => new Date(a.exam_date!).getTime() - new Date(b.exam_date!).getTime())
                      .map(entry => (
                        <div
                          key={entry.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <Badge className={getTypeColor(entry.type)}>
                              EXAM
                            </Badge>
                            <div>
                              <div className="font-medium">
                                {entry.unit.code} - {entry.unit.name}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(entry.exam_date!).toLocaleDateString()}
                                </span>
                                {entry.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {entry.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  )
}