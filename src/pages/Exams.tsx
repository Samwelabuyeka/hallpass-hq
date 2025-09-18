import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Calendar, Clock, MapPin, AlertTriangle, Download, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"
import { formatDistanceToNow, isAfter, isBefore, addDays } from "date-fns"

interface ExamEntry {
  id: string
  exam_date: string | null
  venue: string | null
  unit: {
    code: string
    name: string
  }
}

export default function Exams() {
  const [examEntries, setExamEntries] = useState<ExamEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [hasSetup, setHasSetup] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    checkSetupAndLoadExams()
  }, [])

  const checkSetupAndLoadExams = async () => {
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
        .eq('id', user.id)
        .single()

      if (!profile?.university_id || !profile?.student_id) {
        navigate("/setup")
        return
      }

      setHasSetup(true)
      await loadExams(user.id)
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

  const loadExams = async (userId: string) => {
    try {
      // Get student's selected units
      const { data: studentUnits, error: unitsError } = await supabase
        .from('student_units')
        .select(`
          unit_id,
          master_units!inner(
            id,
            code,
            name
          )
        `)
        .eq('student_id', userId)
        .eq('is_active', true)

      if (unitsError) throw unitsError

      if (!studentUnits || studentUnits.length === 0) {
        setExamEntries([])
        return
      }

      const unitIds = studentUnits.map(su => su.unit_id)

      // Get exam entries for these units
      const { data: exams, error: examsError } = await supabase
        .from('master_timetables')
        .select(`
          id,
          exam_date,
          venue,
          master_units!inner(
            code,
            name
          )
        `)
        .in('unit_id', unitIds)
        .eq('type', 'exam')
        .not('exam_date', 'is', null)
        .order('exam_date')

      if (examsError) throw examsError

      const formattedExams: ExamEntry[] = (exams || []).map(exam => ({
        id: exam.id,
        exam_date: exam.exam_date,
        venue: exam.venue,
        unit: {
          code: (exam.master_units as any)?.code || '',
          name: (exam.master_units as any)?.name || ''
        }
      }))

      setExamEntries(formattedExams)
    } catch (error) {
      console.error('Error loading exams:', error)
      toast({
        title: "Error",
        description: "Failed to load your exam schedule",
        variant: "destructive",
      })
    }
  }

  const getExamStatus = (examDate: string) => {
    const now = new Date()
    const exam = new Date(examDate)
    const oneWeek = addDays(now, 7)

    if (isBefore(exam, now)) {
      return { status: 'past', color: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300' }
    } else if (isBefore(exam, oneWeek)) {
      return { status: 'upcoming', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300' }
    } else {
      return { status: 'future', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300' }
    }
  }

  const upcomingExams = examEntries.filter(exam => 
    exam.exam_date && isAfter(new Date(exam.exam_date), addDays(new Date(), -1))
  )

  const pastExams = examEntries.filter(exam => 
    exam.exam_date && isBefore(new Date(exam.exam_date), new Date())
  )

  const urgentExams = examEntries.filter(exam => 
    exam.exam_date && 
    isAfter(new Date(exam.exam_date), new Date()) &&
    isBefore(new Date(exam.exam_date), addDays(new Date(), 7))
  )

  const exportToCalendar = () => {
    const calendarData = examEntries
      .filter(exam => exam.exam_date)
      .map(exam => {
        const startDate = new Date(exam.exam_date!)
        const endDate = new Date(startDate.getTime() + (3 * 60 * 60 * 1000)) // 3 hours duration
        
        return `BEGIN:VEVENT
DTSTART:${startDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
DTEND:${endDate.toISOString().replace(/[-:]/g, '').split('.')[0]}Z
SUMMARY:${exam.unit.code} - ${exam.unit.name} Exam
DESCRIPTION:Examination for ${exam.unit.name}
LOCATION:${exam.venue || 'TBA'}
END:VEVENT`
      }).join('\n')

    const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MyStudent//Exam Calendar//EN
${calendarData}
END:VCALENDAR`

    const blob = new Blob([icsContent], { type: 'text/calendar' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'exam-schedule.ics'
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 space-y-6 p-8 pt-6">
          <div className="text-center">Loading your exam schedule...</div>
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
            <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Calendar className="h-8 w-8" />
              Exam Schedule
            </h2>
            <p className="text-muted-foreground">
              Your upcoming examinations and important dates
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={exportToCalendar} disabled={examEntries.length === 0}>
              <Download className="mr-2 h-4 w-4" />
              Export Calendar
            </Button>
            <Button variant="outline" onClick={() => navigate("/setup")}>
              <Settings className="mr-2 h-4 w-4" />
              Update Setup
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{examEntries.length}</div>
              <p className="text-xs text-muted-foreground">
                This semester
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingExams.length}</div>
              <p className="text-xs text-muted-foreground">
                Still to come
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">This Week</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {urgentExams.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Needs attention
              </p>
            </CardContent>
          </Card>
        </div>

        {examEntries.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Calendar className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Exams Found</h3>
              <p className="text-muted-foreground text-center mb-4">
                No examination schedule found for your selected units. This could mean:
              </p>
              <ul className="text-sm text-muted-foreground space-y-1 mb-4">
                <li>• The exam schedule hasn't been uploaded yet</li>
                <li>• You need to select different units</li>
                <li>• Exams are scheduled for a different semester</li>
              </ul>
              <Button onClick={() => navigate("/setup")}>
                Update Your Setup
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Urgent Exams Alert */}
            {urgentExams.length > 0 && (
              <Card className="border-red-200 dark:border-red-800">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertTriangle className="h-5 w-5 animate-pulse" />
                    Urgent: Exams This Week
                  </CardTitle>
                  <CardDescription>
                    You have {urgentExams.length} exam(s) coming up within the next 7 days
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {urgentExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20"
                      >
                        <div className="flex items-center gap-3">
                          <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300">
                            URGENT
                          </Badge>
                          <div>
                            <div className="font-medium">
                              {exam.unit.code} - {exam.unit.name}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(exam.exam_date!).toLocaleDateString()}
                              </span>
                              <span className="text-red-600 dark:text-red-400 font-medium">
                                {formatDistanceToNow(new Date(exam.exam_date!), { addSuffix: true })}
                              </span>
                              {exam.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {exam.venue}
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

            {/* Upcoming Exams */}
            {upcomingExams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
                    Upcoming Examinations
                  </CardTitle>
                  <CardDescription>
                    Your future exam schedule
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {upcomingExams.map((exam) => {
                      const { status, color } = getExamStatus(exam.exam_date!)
                      return (
                        <div
                          key={exam.id}
                          className="flex items-center justify-between p-4 rounded-lg border bg-card"
                        >
                          <div className="flex items-center gap-4">
                            <Badge className={color}>
                              {status === 'upcoming' ? 'SOON' : 'EXAM'}
                            </Badge>
                            <div>
                              <div className="font-medium">
                                {exam.unit.code} - {exam.unit.name}
                              </div>
                              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(exam.exam_date!).toLocaleDateString('en-US', {
                                    weekday: 'long',
                                    year: 'numeric',
                                    month: 'long',
                                    day: 'numeric'
                                  })}
                                </span>
                                <span>
                                  {formatDistanceToNow(new Date(exam.exam_date!), { addSuffix: true })}
                                </span>
                                {exam.venue && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {exam.venue}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Past Exams */}
            {pastExams.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-5 w-5" />
                    Completed Examinations
                  </CardTitle>
                  <CardDescription>
                    Your examination history
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {pastExams.map((exam) => (
                      <div
                        key={exam.id}
                        className="flex items-center justify-between p-4 rounded-lg border bg-muted/30"
                      >
                        <div className="flex items-center gap-4">
                          <Badge className="bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300">
                            COMPLETED
                          </Badge>
                          <div>
                            <div className="font-medium text-muted-foreground">
                              {exam.unit.code} - {exam.unit.name}
                            </div>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                {new Date(exam.exam_date!).toLocaleDateString()}
                              </span>
                              {exam.venue && (
                                <span className="flex items-center gap-1">
                                  <MapPin className="h-3 w-3" />
                                  {exam.venue}
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