import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { UniversitySelector } from "@/components/university-selector"
import { SmartUnitSelector } from "@/components/smart-unit-selector"
import { useAuth } from "@/components/auth/auth-provider"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/integrations/supabase/client"
import { useNavigate } from "react-router-dom"

export default function Setup() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { toast } = useToast()
  
  const [universityId, setUniversityId] = useState("")
  const [studentId, setStudentId] = useState("")
  const [semester, setSemester] = useState<number>(1)
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const handleSave = async () => {
    if (!user) {
      toast({
        title: "Error",
        description: "You must be logged in to save your setup",
        variant: "destructive",
      })
      return
    }

    if (!universityId || !studentId || selectedUnits.length === 0) {
      toast({
        title: "Incomplete Setup",
        description: "Please fill in all fields and select at least one unit",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      // Update user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          university_id: universityId,
          student_id: studentId,
          semester: semester,
          year: year,
        })
        .eq('user_id', user.id)

      if (profileError) {
        throw profileError
      }

      // First, deactivate any existing units for this semester/year
      const { error: deactivateError } = await supabase
        .from('student_units')
        .update({ is_active: false })
        .eq('user_id', user.id)
        .eq('semester', semester)
        .eq('year', year)

      if (deactivateError) {
        throw deactivateError
      }

      // Get unit details for the selected units
      const { data: unitDetails, error: unitError } = await supabase
        .from('master_units')
        .select('unit_code, unit_name')
        .eq('university_id', universityId)
        .eq('semester', semester)
        .eq('year', year)
        .in('unit_code', selectedUnits)

      if (unitError) {
        throw unitError
      }

      // Insert new unit enrollments
      const unitEnrollments = unitDetails?.map(unit => ({
        user_id: user.id,
        university_id: universityId,
        unit_code: unit.unit_code,
        unit_name: unit.unit_name,
        semester: semester,
        year: year,
        is_active: true,
      })) || []

      const { error: enrollError } = await supabase
        .from('student_units')
        .upsert(unitEnrollments, {
          onConflict: 'user_id,unit_code,semester,year'
        })

      if (enrollError) {
        throw enrollError
      }

      toast({
        title: "Setup Complete",
        description: "Your academic information has been saved successfully",
      })

      navigate('/timetable')
    } catch (error: any) {
      console.error('Error saving setup:', error)
      toast({
        title: "Error",
        description: error.message || "Failed to save setup",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight">Academic Setup</h2>
          <p className="text-muted-foreground">
            Configure your university, academic period, and enroll in your units
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {/* University Information */}
          <Card>
            <CardHeader>
              <CardTitle>University Information</CardTitle>
              <CardDescription>
                Select your university and provide your student ID
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>University</Label>
                <UniversitySelector
                  value={universityId}
                  onValueChange={setUniversityId}
                  placeholder="Select your university..."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID</Label>
                <Input
                  id="student-id"
                  placeholder="Enter your student ID"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>

          {/* Academic Period */}
          <Card>
            <CardHeader>
              <CardTitle>Academic Period</CardTitle>
              <CardDescription>
                Specify the current semester and academic year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Semester</Label>
                <Select value={semester.toString()} onValueChange={(value) => setSemester(parseInt(value))}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select semester" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Semester 1</SelectItem>
                    <SelectItem value="2">Semester 2</SelectItem>
                    <SelectItem value="3">Semester 3</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="year">Academic Year</Label>
                <Input
                  id="year"
                  type="number"
                  placeholder="Enter academic year"
                  value={year}
                  onChange={(e) => setYear(parseInt(e.target.value) || new Date().getFullYear())}
                  min={2020}
                  max={2030}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Units Selection */}
        <Card>
          <CardHeader>
            <CardTitle>Units Selection</CardTitle>
            <CardDescription>
              Search and select the units you're enrolled in. The search is smart - try typing unit codes, names, or departments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SmartUnitSelector
              universityId={universityId}
              semester={semester}
              year={year}
              selectedUnits={selectedUnits}
              onUnitsChange={setSelectedUnits}
            />
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button
            onClick={handleSave}
            disabled={loading || !universityId || !studentId || selectedUnits.length === 0}
            size="lg"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}