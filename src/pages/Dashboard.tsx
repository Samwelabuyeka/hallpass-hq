"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Calendar, Clock, BookOpen, Trophy, TrendingUp, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { useNavigate } from "react-router-dom"
import { AppLayout } from "@/components/layout/app-layout"

interface DashboardStats {
  activeUnits: number
  classesToday: number
  upcomingExams: number
  nextClass?: string
  daysUntilNextExam?: number
  nextExamUnit?: string
}

interface TodayClass {
  time: string
  unit_code: string
  unit_name: string
  venue?: string
  lecturer?: string
  status: "completed" | "upcoming" | "current"
}

interface Notification {
  id: string
  title: string
  message: string
  type: string
  created_at: string
  unit_code?: string
}

export default function Dashboard() {
  const { user } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState<DashboardStats>({
    activeUnits: 0,
    classesToday: 0,
    upcomingExams: 0,
    daysUntilNextExam: undefined,
    nextExamUnit: undefined
  })
  const [todaySchedule, setTodaySchedule] = useState<TodayClass[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [userProfile, setUserProfile] = useState<any>(null)

  const checkSetupAndLoadData = async () => {
    if (!user) return

    try {
      // Check if user has completed setup
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single()

      if (profileError) throw profileError

      setUserProfile(profile)

      if (!profile.university_id || !profile.student_id) {
        navigate('/setup')
        return
      }

      await Promise.all([
        loadStats(profile),
        loadTodaySchedule(profile),
        loadNotifications(profile)
      ])
    } catch (error: any) {
      console.error('Error loading dashboard:', error)
      toast({
        title: "Error",
        description: "Failed to load dashboard data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (profile: any) => {
    try {
      // Get active units count
      const { data: units, error: unitsError } = await supabase
        .from('student_units')
        .select('*')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .eq('semester', profile.semester)
        .eq('year', profile.year)

      if (unitsError) throw unitsError

      // Get today's classes - normalize day name to UPPERCASE
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      console.log('Looking for classes on:', today)
      
      const { data: todayClasses, error: classesError } = await supabase
        .from('master_timetables')
        .select('*')
        .eq('university_id', profile.university_id)
        .eq('semester', profile.semester)
        .eq('year', profile.year)
        .eq('day', today)
        .in('unit_code', units?.map(u => u.unit_code) || [])

      console.log('Today classes found:', todayClasses?.length || 0)
      if (classesError) console.error('Classes error:', classesError)

      // Get upcoming exams (next 30 days)
      const nextMonth = new Date()
      nextMonth.setDate(nextMonth.getDate() + 30)
      
      const { data: exams, error: examsError } = await supabase
        .from('master_timetables')
        .select('*')
        .eq('university_id', profile.university_id)
        .eq('type', 'exam')
        .gte('exam_date', new Date().toISOString().split('T')[0])
        .lte('exam_date', nextMonth.toISOString().split('T')[0])
        .in('unit_code', units?.map(u => u.unit_code) || [])
        .order('exam_date', { ascending: true })

      if (examsError) console.error('Exams error:', examsError)

      // Calculate days until next exam
      let daysUntilNextExam: number | undefined
      let nextExamUnit: string | undefined
      
      if (exams && exams.length > 0) {
        const nextExam = exams[0]
        const examDate = new Date(nextExam.exam_date)
        const today = new Date()
        const diffTime = examDate.getTime() - today.getTime()
        daysUntilNextExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
        nextExamUnit = nextExam.unit_code
      }

      setStats({
        activeUnits: units?.length || 0,
        classesToday: todayClasses?.length || 0,
        upcomingExams: exams?.length || 0,
        nextClass: todayClasses?.[0]?.unit_code,
        daysUntilNextExam,
        nextExamUnit
      })
    } catch (error) {
      console.error('Error loading stats:', error)
    }
  }

  const loadTodaySchedule = async (profile: any) => {
    try {
      const { data: units } = await supabase
        .from('student_units')
        .select('unit_code')
        .eq('user_id', user?.id)
        .eq('is_active', true)
        .eq('semester', profile.semester)
        .eq('year', profile.year)

      if (!units || units.length === 0) {
        console.log('No active units found for schedule')
        return
      }

      // Normalize day name to UPPERCASE to match database format
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long' }).toUpperCase()
      console.log('Loading schedule for:', today, 'Units:', units.map(u => u.unit_code))
      
      const { data: schedule, error } = await supabase
        .from('master_timetables')
        .select('*')
        .eq('university_id', profile.university_id)
        .eq('semester', profile.semester)
        .eq('year', profile.year)
        .eq('day', today)
        .in('unit_code', units.map(u => u.unit_code))
        .order('time_start')

      console.log('Schedule query result:', schedule?.length || 0, 'classes')
      if (error) {
        console.error('Schedule error:', error)
        throw error
      }

      const currentTime = new Date()
      const formattedSchedule = schedule?.map(item => {
        // Handle time_start and time_end which might be in HH:MM:SS or HH:MM format
        const timeStart = item.time_start || '00:00:00'
        const timeEnd = item.time_end || '23:59:59'
        
        const startTime = new Date(`${currentTime.toDateString()} ${timeStart}`)
        const endTime = new Date(`${currentTime.toDateString()} ${timeEnd}`)
        
        let status: "completed" | "upcoming" | "current" = "upcoming"
        if (currentTime > endTime) {
          status = "completed"
        } else if (currentTime >= startTime && currentTime <= endTime) {
          status = "current"
        }

        // Format time for display (HH:MM)
        const displayTimeStart = timeStart.slice(0, 5)
        const displayTimeEnd = timeEnd.slice(0, 5)

        return {
          time: `${displayTimeStart} - ${displayTimeEnd}`,
          unit_code: item.unit_code,
          unit_name: item.unit_name,
          venue: item.venue || 'TBA',
          lecturer: item.lecturer || 'TBA',
          status
        }
      }) || []

      console.log('Formatted schedule:', formattedSchedule.length, 'classes')
      setTodaySchedule(formattedSchedule)
    } catch (error) {
      console.error('Error loading today schedule:', error)
    }
  }

  const loadNotifications = async (profile: any) => {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('created_at', { ascending: false })
        .limit(5)

      if (error) throw error

      setNotifications(data || [])
    } catch (error) {
      console.error('Error loading notifications:', error)
    }
  }

  useEffect(() => {
    checkSetupAndLoadData()
  }, [user])

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="p-6 space-y-8 max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <h1 className="text-3xl font-bold mb-2">
            Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}, {userProfile?.full_name || 'Student'}! 👋
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your academic schedule today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 }}
          >
            <Card className="card-gradient shadow-soft hover:shadow-elegant transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Units</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.activeUnits}</div>
                <p className="text-xs text-muted-foreground">This semester</p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.2 }}
          >
            <Card className="card-gradient shadow-soft hover:shadow-elegant transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Classes Today</CardTitle>
                <Calendar className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.classesToday}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.nextClass ? `Next: ${stats.nextClass}` : 'No classes today'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.3 }}
          >
            <Card className="card-gradient shadow-soft hover:shadow-elegant transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Days</CardTitle>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {stats.daysUntilNextExam !== undefined ? stats.daysUntilNextExam : '-'}
                </div>
                <p className="text-xs text-muted-foreground">
                  {stats.nextExamUnit ? `Until ${stats.nextExamUnit} exam` : 'No upcoming exams'}
                </p>
              </CardContent>
            </Card>
          </motion.div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.4 }}
          >
            <Card className="card-gradient shadow-soft hover:shadow-elegant transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Upcoming Exams</CardTitle>
                <Trophy className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.upcomingExams}</div>
                <p className="text-xs text-muted-foreground">Next 30 days</p>
              </CardContent>
            </Card>
          </motion.div>
        </motion.div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Schedule */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="lg:col-span-2"
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Today's Schedule
                </CardTitle>
                <CardDescription>
                  Your classes for today, {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {todaySchedule.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No classes scheduled for today</p>
                  </div>
                ) : (
                  todaySchedule.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className={`flex items-center space-x-4 p-3 rounded-lg border ${
                        item.status === 'completed' 
                          ? 'bg-muted/50 opacity-60'
                          : item.status === 'current'
                          ? 'bg-primary/10 border-primary'
                          : 'bg-background'
                      }`}
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-3 h-3 rounded-full ${
                          item.status === 'completed' 
                            ? 'bg-muted-foreground' 
                            : item.status === 'current'
                            ? 'bg-primary animate-pulse'
                            : 'bg-primary'
                        }`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium">
                              {item.unit_code} - {item.unit_name}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              {item.venue} {item.lecturer && `• ${item.lecturer}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-medium">{item.time}</p>
                            <Badge 
                              variant={
                                item.status === 'completed' 
                                  ? 'secondary' 
                                  : item.status === 'current'
                                  ? 'default'
                                  : 'outline'
                              }
                              className="text-xs"
                            >
                              {item.status === 'current' ? 'in progress' : item.status}
                            </Badge>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </CardContent>
            </Card>
          </motion.div>

          {/* Notifications */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Card className="shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="h-5 w-5" />
                  Recent Notifications
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {notifications.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No notifications yet</p>
                  </div>
                ) : (
                  notifications.map((notification, index) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: 0.1 * index }}
                      className="space-y-2 p-3 rounded-lg border bg-background/50"
                    >
                      <div className="flex items-start justify-between">
                        <h4 className="text-sm font-medium leading-tight">
                          {notification.title}
                        </h4>
                        <Badge variant="outline" className="text-xs">
                          {notification.type}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {notification.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-xs text-muted-foreground">
                          {new Date(notification.created_at).toLocaleDateString()}
                        </p>
                        {notification.unit_code && (
                          <Badge variant="secondary" className="text-xs">
                            {notification.unit_code}
                          </Badge>
                        )}
                      </div>
                    </motion.div>
                  ))
                )}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="w-full"
                  onClick={() => navigate('/notifications')}
                >
                  View All Notifications
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
        >
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
              <CardDescription>
                Frequently used features for faster access
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/timetable')}
                >
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs">View Timetable</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/units')}
                >
                  <BookOpen className="h-6 w-6" />
                  <span className="text-xs">Manage Units</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/exams')}
                >
                  <Trophy className="h-6 w-6" />
                  <span className="text-xs">Exam Schedule</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-20 flex-col gap-2"
                  onClick={() => navigate('/class-rep')}
                >
                  <TrendingUp className="h-6 w-6" />
                  <span className="text-xs">Class Rep</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </AppLayout>
  )
}