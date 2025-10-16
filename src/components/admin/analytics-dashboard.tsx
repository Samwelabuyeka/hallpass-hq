import { useState, useEffect } from "react"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { BarChart3, TrendingUp, Users, BookOpen, Calendar, FileText, Bell, Award } from "lucide-react"
import { Badge } from "@/components/ui/badge"

interface UniversityStats {
  id: string
  name: string
  totalStudents: number
  totalUnits: number
  totalTimetableEntries: number
  totalClassReps: number
  totalNotifications: number
}

interface SystemStats {
  totalUsers: number
  totalUniversities: number
  totalUnits: number
  totalTimetableEntries: number
  totalClassReps: number
  totalNotifications: number
  recentSignups: number
}

export function AnalyticsDashboard() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null)
  const [universityStats, setUniversityStats] = useState<UniversityStats[]>([])
  const [selectedUniversity, setSelectedUniversity] = useState<string>("all")
  const [universities, setUniversities] = useState<{ id: string; name: string }[]>([])

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      await Promise.all([
        loadSystemStats(),
        loadUniversities(),
        loadUniversityStats()
      ])
    } catch (error) {
      console.error('Error loading analytics:', error)
      toast({
        title: "Error",
        description: "Failed to load analytics data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadSystemStats = async () => {
    try {
      // Get total counts for each table
      const [
        { count: usersCount },
        { count: universitiesCount },
        { count: unitsCount },
        { count: timetableCount },
        { count: classRepsCount },
        { count: notificationsCount },
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('universities').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('master_units').select('id', { count: 'exact', head: true }),
        supabase.from('master_timetables').select('id', { count: 'exact', head: true }),
        supabase.from('class_reps').select('id', { count: 'exact', head: true }).eq('is_active', true),
        supabase.from('notifications').select('id', { count: 'exact', head: true }),
      ])

      // Get recent signups (last 30 days)
      const thirtyDaysAgo = new Date()
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
      const { count: recentCount } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', thirtyDaysAgo.toISOString())

      setSystemStats({
        totalUsers: usersCount || 0,
        totalUniversities: universitiesCount || 0,
        totalUnits: unitsCount || 0,
        totalTimetableEntries: timetableCount || 0,
        totalClassReps: classRepsCount || 0,
        totalNotifications: notificationsCount || 0,
        recentSignups: recentCount || 0,
      })
    } catch (error) {
      console.error('Error loading system stats:', error)
    }
  }

  const loadUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setUniversities(data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const loadUniversityStats = async () => {
    try {
      const { data: universities, error: uniError } = await supabase
        .from('universities')
        .select('id, name')
        .eq('is_active', true)

      if (uniError) throw uniError

      const stats = await Promise.all(
        (universities || []).map(async (uni) => {
          const [
            { count: studentsCount },
            { count: unitsCount },
            { count: timetableCount },
            { count: classRepsCount },
            { count: notificationsCount },
          ] = await Promise.all([
            supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('university_id', uni.id),
            supabase.from('master_units').select('id', { count: 'exact', head: true }).eq('university_id', uni.id),
            supabase.from('master_timetables').select('id', { count: 'exact', head: true }).eq('university_id', uni.id),
            supabase.from('class_reps').select('id', { count: 'exact', head: true }).eq('university_id', uni.id).eq('is_active', true),
            supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('university_id', uni.id),
          ])

          return {
            id: uni.id,
            name: uni.name,
            totalStudents: studentsCount || 0,
            totalUnits: unitsCount || 0,
            totalTimetableEntries: timetableCount || 0,
            totalClassReps: classRepsCount || 0,
            totalNotifications: notificationsCount || 0,
          }
        })
      )

      setUniversityStats(stats)
    } catch (error) {
      console.error('Error loading university stats:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  const filteredStats = selectedUniversity === "all"
    ? universityStats
    : universityStats.filter(stat => stat.id === selectedUniversity)

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            System Analytics
          </CardTitle>
          <CardDescription>
            Overview of system-wide statistics and usage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-4 w-4 text-muted-foreground" />
                <Badge variant="outline">{systemStats?.recentSignups} new</Badge>
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalUsers}</div>
              <p className="text-xs text-muted-foreground">Total Users</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-4 w-4 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalUniversities}</div>
              <p className="text-xs text-muted-foreground">Active Universities</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalUnits}</div>
              <p className="text-xs text-muted-foreground">Total Units</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <TrendingUp className="h-3 w-3 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalTimetableEntries}</div>
              <p className="text-xs text-muted-foreground">Timetable Entries</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Award className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{systemStats?.totalClassReps}</Badge>
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalClassReps}</div>
              <p className="text-xs text-muted-foreground">Class Representatives</p>
            </div>

            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <Badge variant="secondary">{systemStats?.totalNotifications}</Badge>
              </div>
              <div className="text-2xl font-bold">{systemStats?.totalNotifications}</div>
              <p className="text-xs text-muted-foreground">Notifications Sent</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>University Breakdown</CardTitle>
              <CardDescription>
                Detailed statistics by university
              </CardDescription>
            </div>
            <Select value={selectedUniversity} onValueChange={setSelectedUniversity}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((uni) => (
                  <SelectItem key={uni.id} value={uni.id}>
                    {uni.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {filteredStats.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No university data available</p>
              </div>
            ) : (
              filteredStats.map((stat) => (
                <div key={stat.id} className="border rounded-lg p-4">
                  <h4 className="font-semibold mb-4">{stat.name}</h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    <div>
                      <div className="text-2xl font-bold">{stat.totalStudents}</div>
                      <p className="text-xs text-muted-foreground">Students</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.totalUnits}</div>
                      <p className="text-xs text-muted-foreground">Units</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.totalTimetableEntries}</div>
                      <p className="text-xs text-muted-foreground">Timetable</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.totalClassReps}</div>
                      <p className="text-xs text-muted-foreground">Class Reps</p>
                    </div>
                    <div>
                      <div className="text-2xl font-bold">{stat.totalNotifications}</div>
                      <p className="text-xs text-muted-foreground">Notifications</p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
