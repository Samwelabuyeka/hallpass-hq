import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { UniversitySelector } from "@/components/university-selector"
import { UnitSelector } from "@/components/unit-selector"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { useNavigate } from "react-router-dom"

export default function Setup() {
  const [universityId, setUniversityId] = useState<string>("")
  const [studentId, setStudentId] = useState<string>("")
  const [semester, setSemester] = useState<string>("")
  const [year, setYear] = useState<number>(new Date().getFullYear())
  const [selectedUnits, setSelectedUnits] = useState<string[]>([])
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSave = async () => {
    if (!universityId || !studentId || selectedUnits.length === 0) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields and select at least one unit",
        variant: "destructive",
      })
      return
    }

    setLoading(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) throw new Error("Not authenticated")

      // Update profile with university and student ID
      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          university_id: universityId,
          student_id: studentId,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (profileError) throw profileError

      // Save selected units
      const studentUnitsData = selectedUnits.map(unitId => ({
        student_id: user.id,
        unit_id: unitId,
        semester,
        year,
        is_active: true
      }))

      // First, deactivate existing units for this semester/year
      const { error: deactivateError } = await supabase
        .from('student_units')
        .update({ is_active: false })
        .eq('student_id', user.id)
        .eq('semester', semester)
        .eq('year', year)

      if (deactivateError) throw deactivateError

      // Insert new units
      const { error: unitsError } = await supabase
        .from('student_units')
        .insert(studentUnitsData)

      if (unitsError) throw unitsError

      toast({
        title: "Setup Complete",
        description: "Your academic profile has been configured successfully",
      })

      navigate("/timetable")
    } catch (error) {
      console.error('Error saving setup:', error)
      toast({
        title: "Error",
        description: "Failed to save your setup. Please try again.",
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
            Configure your university and units to get started with your timetable
          </p>
        </div>

        <div className="grid gap-6 max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle>University Information</CardTitle>
              <CardDescription>
                Select your university and provide your student details
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="university">University *</Label>
                <UniversitySelector
                  value={universityId}
                  onValueChange={setUniversityId}
                  placeholder="Select your university..."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="student-id">Student ID *</Label>
                <Input
                  id="student-id"
                  value={studentId}
                  onChange={(e) => setStudentId(e.target.value)}
                  placeholder="Enter your student ID"
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Academic Period</CardTitle>
              <CardDescription>
                Specify the current semester and year
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="semester">Semester</Label>
                  <Select value={semester} onValueChange={setSemester}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select semester" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Semester 1</SelectItem>
                      <SelectItem value="2">Semester 2</SelectItem>
                      <SelectItem value="summer">Summer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="year">Year</Label>
                  <Input
                    id="year"
                    type="number"
                    value={year}
                    onChange={(e) => setYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Units Selection</CardTitle>
              <CardDescription>
                Choose the units you're enrolled in for this semester
              </CardDescription>
            </CardHeader>
            <CardContent>
              <UnitSelector
                universityId={universityId}
                selectedUnits={selectedUnits}
                onUnitsChange={setSelectedUnits}
                semester={semester}
                year={year}
              />
            </CardContent>
          </Card>

          <Button 
            onClick={handleSave} 
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? "Saving..." : "Complete Setup"}
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}