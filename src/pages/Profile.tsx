import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { AppLayout } from "@/components/layout/app-layout"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { User, Mail, School, Hash, Calendar, Save } from "lucide-react"

interface Profile {
  id: string
  user_id: string
  email: string
  full_name: string | null
  university_id: string | null
  student_id: string | null
  semester: number | null
  year: number | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

interface University {
  id: string
  name: string
  code: string
}

export default function Profile() {
  const { user, signOut } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [universities, setUniversities] = useState<University[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    if (user) {
      loadProfile()
      loadUniversities()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user!.id)
        .maybeSingle()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
      toast({
        title: "Error",
        description: "Failed to load profile data",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const loadUniversities = async () => {
    try {
      const { data, error } = await supabase
        .from('universities')
        .select('id, name, code')
        .eq('is_active', true)
        .order('name')

      if (error) throw error
      setUniversities(data || [])
    } catch (error) {
      console.error('Error loading universities:', error)
    }
  }

  const handleSave = async () => {
    if (!profile) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          university_id: profile.university_id,
          student_id: profile.student_id,
          semester: profile.semester,
          year: profile.year,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', profile.user_id)

      if (error) throw error

      toast({
        title: "Profile updated",
        description: "Your profile has been saved successfully",
      })
    } catch (error: any) {
      console.error('Error saving profile:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save profile",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Loading profile...</div>
        </div>
      </AppLayout>
    )
  }

  if (!profile) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Profile not found</div>
        </div>
      </AppLayout>
    )
  }

  const selectedUniversity = universities.find(u => u.id === profile.university_id)

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Profile</h2>
          <p className="text-muted-foreground">
            Manage your account settings and preferences
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Personal Information
              </CardTitle>
              <CardDescription>
                Your basic account information
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20">
                  <AvatarImage src="" />
                  <AvatarFallback className="text-lg">
                    {profile.full_name?.split(' ').map(n => n[0]).join('') ||
                     profile.email.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="font-medium">{profile.full_name || "No name set"}</h3>
                  <p className="text-sm text-muted-foreground">{profile.email}</p>
                </div>
              </div>

              <div className="grid gap-4">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="fullName"
                      value={profile.full_name || ""}
                      onChange={(e) => setProfile({...profile, full_name: e.target.value})}
                      placeholder="Enter your full name"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      value={profile.email}
                      disabled
                      className="pl-9 bg-muted"
                    />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <School className="h-5 w-5" />
                Academic Information
              </CardTitle>
              <CardDescription>
                Your university and student details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University</Label>
                <Select
                  value={profile.university_id || ""}
                  onValueChange={(value) => setProfile({...profile, university_id: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select your university" />
                  </SelectTrigger>
                  <SelectContent>
                    {universities.map((university) => (
                      <SelectItem key={university.id} value={university.id}>
                        {university.name} ({university.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <div className="relative">
                  <Hash className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="studentId"
                    value={profile.student_id || ""}
                    onChange={(e) => setProfile({...profile, student_id: e.target.value})}
                    placeholder="Enter your student ID"
                    className="pl-9"
                  />
                </div>
              </div>

              {selectedUniversity && (
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm">
                    <strong>Current University:</strong> {selectedUniversity.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Code: {selectedUniversity.code}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>


          <div className="flex gap-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="mr-2 h-4 w-4" />
              {saving ? "Saving..." : "Save Changes"}
            </Button>
            <Button variant="destructive" onClick={handleSignOut}>
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}