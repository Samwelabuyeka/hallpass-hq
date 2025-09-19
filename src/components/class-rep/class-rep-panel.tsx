import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Users, Send, Crown, BookOpen, Plus, UserCheck } from "lucide-react"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"

interface Unit {
  id: string
  code: string
  name: string
}

interface ClassRep {
  id: string
  unit_id: string
  semester: string
  year: number
  is_active: boolean
  master_units: {
    code: string
    name: string
  }
}

interface Student {
  id: string
  full_name: string | null
  email: string
}

export function ClassRepPanel() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [units, setUnits] = useState<Unit[]>([])
  const [classReps, setClassReps] = useState<ClassRep[]>([])
  const [loading, setLoading] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [sendingNotification, setSendingNotification] = useState(false)
  
  // Registration form
  const [selectedUnit, setSelectedUnit] = useState("")
  const [semester, setSemester] = useState("")
  const [year, setYear] = useState(new Date().getFullYear())
  
  // Notification form
  const [notificationTitle, setNotificationTitle] = useState("")
  const [notificationMessage, setNotificationMessage] = useState("")
  const [notificationType, setNotificationType] = useState<"lecture" | "assignment" | "exam" | "general" | "announcement">("general")
  const [selectedRepUnit, setSelectedRepUnit] = useState("")

  // Fetch available units
  const fetchUnits = async () => {
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user?.id)
        .single()

      if (!profile?.university_id) return

      const { data, error } = await supabase
        .from('master_units')
        .select('id, code, name')
        .eq('university_id', profile.university_id)

      if (error) throw error
      setUnits(data || [])
    } catch (error) {
      console.error('Error fetching units:', error)
    }
  }

  // Fetch user's class rep registrations
  const fetchClassReps = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('class_representatives')
        .select(`
          *,
          master_units(code, name)
        `)
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setClassReps(data || [])
    } catch (error) {
      console.error('Error fetching class reps:', error)
      toast({
        title: "Error",
        description: "Failed to load class representative data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Register as class representative
  const registerAsClassRep = async () => {
    if (!user || !selectedUnit || !semester) return
    
    setRegistering(true)
    try {
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!profile?.university_id) {
        throw new Error('University not set in profile')
      }

      // Check if already registered for this unit and semester
      const { data: existing } = await supabase
        .from('class_representatives')
        .select('id')
        .eq('student_id', user.id)
        .eq('unit_id', selectedUnit)
        .eq('semester', semester)
        .eq('year', year)
        .eq('is_active', true)

      if (existing && existing.length > 0) {
        throw new Error('You are already registered as class rep for this unit and semester')
      }

      const { error } = await supabase
        .from('class_representatives')
        .insert({
          student_id: user.id,
          unit_id: selectedUnit,
          university_id: profile.university_id,
          semester,
          year,
          is_active: true,
        })

      if (error) throw error
      
      toast({
        title: "Success",
        description: "Successfully registered as class representative",
      })
      
      setSelectedUnit("")
      setSemester("")
      fetchClassReps()
    } catch (error: any) {
      console.error('Error registering as class rep:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to register as class representative",
        variant: "destructive",
      })
    } finally {
      setRegistering(false)
    }
  }

  // Send notification to students in a unit
  const sendNotificationToStudents = async () => {
    if (!user || !selectedRepUnit || !notificationTitle || !notificationMessage) return
    
    setSendingNotification(true)
    try {
      // Get all students enrolled in the selected unit
      const { data: studentUnits, error: studentsError } = await supabase
        .from('student_units')
        .select('student_id')
        .eq('unit_id', selectedRepUnit)
        .eq('is_active', true)

      if (studentsError) throw studentsError

      if (!studentUnits || studentUnits.length === 0) {
        throw new Error('No students found for this unit')
      }

      const recipientIds = studentUnits.map(su => su.student_id)

      // Create notifications for all students
      const notifications = recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: user.id,
        title: notificationTitle,
        message: notificationMessage,
        type: notificationType,
        unit_id: selectedRepUnit,
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) throw notificationError
      
      toast({
        title: "Success",
        description: `Notification sent to ${recipientIds.length} student${recipientIds.length !== 1 ? 's' : ''}`,
      })
      
      // Reset form
      setNotificationTitle("")
      setNotificationMessage("")
      setSelectedRepUnit("")
    } catch (error: any) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to send notification",
        variant: "destructive",
      })
    } finally {
      setSendingNotification(false)
    }
  }

  useEffect(() => {
    if (user) {
      fetchUnits()
      fetchClassReps()
    }
  }, [user])

  return (
    <div className="space-y-6">
      {/* Current Class Rep Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-yellow-500" />
            Class Representative Dashboard
          </CardTitle>
          <CardDescription>
            Manage your class representative roles and communicate with students
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : classReps.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>You are not registered as a class representative yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {classReps.map((rep) => (
                <div key={rep.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-yellow-500 text-white rounded-full">
                      <Crown className="h-4 w-4" />
                    </div>
                    <div>
                      <h4 className="font-medium">{rep.master_units.code}</h4>
                      <p className="text-sm text-muted-foreground">{rep.master_units.name}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant={rep.is_active ? "default" : "secondary"}>
                          {rep.is_active ? "Active" : "Inactive"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {rep.semester} {rep.year}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Register as Class Rep */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <UserCheck className="h-5 w-5" />
            Register as Class Representative
          </CardTitle>
          <CardDescription>
            Register to become a class representative for a unit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={selectedUnit} onValueChange={setSelectedUnit}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map((unit) => (
                    <SelectItem key={unit.id} value={unit.id}>
                      {unit.code} - {unit.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="semester">Semester</Label>
              <Select value={semester} onValueChange={setSemester}>
                <SelectTrigger>
                  <SelectValue placeholder="Select semester" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Semester 1">Semester 1</SelectItem>
                  <SelectItem value="Semester 2">Semester 2</SelectItem>
                  <SelectItem value="Summer">Summer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="year">Year</Label>
              <Input
                type="number"
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value))}
                min={2020}
                max={2030}
              />
            </div>
          </div>
          <Button
            onClick={registerAsClassRep}
            disabled={!selectedUnit || !semester || registering}
            className="w-full"
          >
            <Plus className="h-4 w-4 mr-2" />
            {registering ? "Registering..." : "Register as Class Rep"}
          </Button>
        </CardContent>
      </Card>

      {/* Send Notifications */}
      {classReps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="h-5 w-5" />
              Send Notification to Students
            </CardTitle>
            <CardDescription>
              Send important updates to students in your classes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="rep-unit">Select Unit</Label>
                <Select value={selectedRepUnit} onValueChange={setSelectedRepUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select unit to notify" />
                  </SelectTrigger>
                  <SelectContent>
                    {classReps.filter(rep => rep.is_active).map((rep) => (
                      <SelectItem key={rep.unit_id} value={rep.unit_id}>
                        {rep.master_units.code} - {rep.master_units.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notification-type">Notification Type</Label>
                <Select value={notificationType} onValueChange={(value: any) => setNotificationType(value)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General</SelectItem>
                    <SelectItem value="lecture">Lecture Update</SelectItem>
                    <SelectItem value="assignment">Assignment</SelectItem>
                    <SelectItem value="exam">Exam Information</SelectItem>
                    <SelectItem value="announcement">Announcement</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  placeholder="Enter notification title"
                  value={notificationTitle}
                  onChange={(e) => setNotificationTitle(e.target.value)}
                />
              </div>
              
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  placeholder="Enter your message to students"
                  value={notificationMessage}
                  onChange={(e) => setNotificationMessage(e.target.value)}
                  rows={4}
                />
              </div>
              
              <Button
                onClick={sendNotificationToStudents}
                disabled={!selectedRepUnit || !notificationTitle || !notificationMessage || sendingNotification}
                className="w-full"
              >
                <Send className="h-4 w-4 mr-2" />
                {sendingNotification ? "Sending..." : "Send Notification"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}