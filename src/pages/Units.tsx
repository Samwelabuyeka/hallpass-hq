import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { BookOpen, Clock, MapPin, User, Settings, Plus } from "lucide-react"
import { useNavigate } from "react-router-dom"

interface Unit {
  id: string
  code: string
  name: string
  department: string | null
  semester: string | null
  year: number | null
  credits: number | null
}

interface TimetableEntry {
  id: string
  type: string
  day: string | null
  time_start: string | null
  time_end: string | null
  venue: string | null
  lecturer: string | null
}

export default function Units() {
  const [units, setUnits] = useState<(Unit & { timetable: TimetableEntry[] })[]>([])
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    loadUnits()
  }, [])

  const loadUnits = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get student's selected courses
      const { data: studentCourses, error } = await supabase
        .from('student_units')
        .select('unit_code, unit_name')
        .eq('user_id', user.id)
        .eq('is_active', true)

      if (error) throw error

      if (!studentCourses || studentCourses.length === 0) {
        setUnits([])
        return
      }

      const courseCodes = studentCourses.map(sc => sc.unit_code)

      // Get full course details from master_units
      const { data: courseDetails, error: detailsError } = await supabase
        .from('master_units')
        .select('*')
        .in('unit_code', courseCodes)

      if (detailsError) throw detailsError

      // Get timetable entries for these courses
      const { data: timetableData, error: timetableError } = await supabase
        .from('master_timetables')
        .select('*')
        .in('unit_code', courseCodes)

      if (timetableError) throw timetableError

      // Combine course data with timetable entries
      const coursesWithTimetable = (courseDetails || []).map(course => {
        const courseTimetable = (timetableData || []).filter(t => t.unit_code === course.unit_code)
        
        return {
          id: course.id,
          code: course.unit_code,
          name: course.unit_name,
          department: course.department,
          semester: course.semester?.toString() || null,
          year: course.year,
          credits: course.credits,
          timetable: courseTimetable
        }
      })

      setUnits(coursesWithTimetable)
    } catch (error) {
      console.error('Error loading courses:', error)
      toast({
        title: "Error",
        description: "Failed to load your courses",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'lab': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const getDaysWithClasses = (timetable: TimetableEntry[]) => {
    const days = timetable
      .filter(entry => entry.day && entry.type !== 'exam')
      .map(entry => entry.day)
      .filter((day, index, arr) => arr.indexOf(day) === index)
    return days.length
  }

  const getTotalWeeklyHours = (timetable: TimetableEntry[]) => {
    return timetable
      .filter(entry => entry.time_start && entry.time_end && entry.type !== 'exam')
      .reduce((total, entry) => {
        const start = new Date(`2000-01-01 ${entry.time_start}`)
        const end = new Date(`2000-01-01 ${entry.time_end}`)
        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60)
        return total + hours
      }, 0)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Loading your units...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <BookOpen className="h-8 w-8" />
              My Units
            </h2>
            <p className="text-muted-foreground">
              Overview of your enrolled units and their schedules
            </p>
          </div>
          <Button onClick={() => navigate("/setup")}>
            <Plus className="mr-2 h-4 w-4" />
            Manage Units
          </Button>
        </div>

        {units.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Units Enrolled</h3>
              <p className="text-muted-foreground text-center mb-4">
                You haven't enrolled in any units yet. Complete your setup to get started.
              </p>
              <Button onClick={() => navigate("/setup")}>
                <Settings className="mr-2 h-4 w-4" />
                Complete Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Units Summary */}
            <div className="grid gap-4 md:grid-cols-3">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Units</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{units.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {units.reduce((total, unit) => total + (unit.credits || 0), 0)} total credits
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Weekly Hours</CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {units.reduce((total, unit) => total + getTotalWeeklyHours(unit.timetable), 0)}h
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Contact hours per week
                  </p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Study Days</CardTitle>
                  <MapPin className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {Math.max(...units.map(unit => getDaysWithClasses(unit.timetable)))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Days with classes
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Units List */}
            <div className="grid gap-6">
              {units.map((unit) => (
                <Card key={unit.id} className="animate-fade-in">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="font-mono">
                            {unit.code}
                          </Badge>
                          {unit.credits && (
                            <Badge variant="secondary">
                              {unit.credits} credits
                            </Badge>
                          )}
                        </div>
                        <CardTitle className="text-xl">{unit.name}</CardTitle>
                        {unit.department && (
                          <CardDescription>{unit.department}</CardDescription>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {unit.timetable.length === 0 ? (
                      <p className="text-muted-foreground text-sm">
                        No timetable information available for this unit
                      </p>
                    ) : (
                      <div className="space-y-3">
                        <h4 className="font-medium">Schedule</h4>
                        <div className="grid gap-2">
                          {unit.timetable
                            .filter(entry => entry.type !== 'exam')
                            .map((entry) => (
                            <div
                              key={entry.id}
                              className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
                            >
                              <div className="flex items-center gap-3">
                                <Badge className={getTypeColor(entry.type)}>
                                  {entry.type}
                                </Badge>
                                <div className="text-sm">
                                  <div className="font-medium">{entry.day}</div>
                                  <div className="flex items-center gap-3 text-muted-foreground">
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

                        {/* Exam Information */}
                        {unit.timetable.some(entry => entry.type === 'exam') && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="font-medium text-red-600 dark:text-red-400 mb-2">
                              Exam Schedule
                            </h4>
                            {unit.timetable
                              .filter(entry => entry.type === 'exam')
                              .map((entry) => (
                              <div
                                key={entry.id}
                                className="flex items-center gap-3 p-2 rounded border border-red-200 dark:border-red-800"
                              >
                                <Badge className={getTypeColor(entry.type)}>
                                  EXAM
                                </Badge>
                                <div className="text-sm">
                                  {entry.venue && (
                                    <span className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {entry.venue}
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppLayout>
  )
}