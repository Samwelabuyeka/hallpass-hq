import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TimetableUpload } from "@/components/timetable/timetable-upload"
import { AppLayout } from "@/components/layout/app-layout"
import { UniversitySelector } from "@/components/university-selector"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { Shield, Upload, Users, Calendar, BarChart3 } from "lucide-react"

interface Stats {
  totalStudents: number
  totalUnits: number
  totalTimetableEntries: number
  activeUniversities: number
}

export default function Admin() {
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("")
  const [stats, setStats] = useState<Stats>({
    totalStudents: 0,
    totalUnits: 0,
    totalTimetableEntries: 0,
    activeUniversities: 0
  })
  const [loading, setLoading] = useState(true)
  const { toast } = useToast()

  useEffect(() => {
    loadStats()
  }, [])

  const loadStats = async () => {
    try {
      // Load various statistics
      const [
        { count: studentsCount },
        { count: unitsCount },
        { count: timetableCount },
        { count: universitiesCount }
      ] = await Promise.all([
        supabase.from('profiles').select('id', { count: 'exact', head: true }),
        supabase.from('master_units').select('id', { count: 'exact', head: true }),
        supabase.from('master_timetables').select('id', { count: 'exact', head: true }),
        supabase.from('universities').select('id', { count: 'exact', head: true }).eq('is_active', true)
      ])

      setStats({
        totalStudents: studentsCount || 0,
        totalUnits: unitsCount || 0,
        totalTimetableEntries: timetableCount || 0,
        activeUniversities: universitiesCount || 0
      })
    } catch (error) {
      console.error('Error loading stats:', error)
      toast({
        title: "Error",
        description: "Failed to load statistics",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUploadComplete = () => {
    toast({
      title: "Upload Complete",
      description: "Timetable data has been successfully uploaded",
    })
    loadStats() // Refresh stats
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Admin Panel
          </h2>
          <p className="text-muted-foreground">
            Manage universities, upload timetables, and monitor system statistics
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Registered users
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Universities</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeUniversities}</div>
              <p className="text-xs text-muted-foreground">
                Active institutions
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Units</CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUnits}</div>
              <p className="text-xs text-muted-foreground">
                Available courses
              </p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Timetable Entries</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalTimetableEntries}</div>
              <p className="text-xs text-muted-foreground">
                Schedule entries
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="upload" className="space-y-4">
          <TabsList>
            <TabsTrigger value="upload">Upload Timetables</TabsTrigger>
            <TabsTrigger value="manage">Manage Universities</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
          </TabsList>
          
          <TabsContent value="upload" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>University Selection</CardTitle>
                <CardDescription>
                  Select the university for which you want to upload timetable data
                </CardDescription>
              </CardHeader>
              <CardContent>
                <UniversitySelector
                  value={selectedUniversityId}
                  onValueChange={setSelectedUniversityId}
                  placeholder="Select university for timetable upload..."
                />
              </CardContent>
            </Card>

            {selectedUniversityId && (
              <TimetableUpload
                universityId={selectedUniversityId}
                onUploadComplete={handleUploadComplete}
              />
            )}
          </TabsContent>
          
          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>University Management</CardTitle>
                <CardDescription>
                  Manage university information and settings
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  University management features coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>System Analytics</CardTitle>
                <CardDescription>
                  View detailed analytics and usage reports
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Analytics dashboard coming soon...
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}