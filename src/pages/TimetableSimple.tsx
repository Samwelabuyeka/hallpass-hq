import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { Calendar, Clock, MapPin, User, Settings } from "lucide-react"
import { useNavigate } from "react-router-dom"

// Simplified timetable without database dependencies for testing
export default function TimetableSimple() {
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const navigate = useNavigate()

  // Mock data for testing
  const mockTimetableEntries = [
    {
      id: "1",
      type: "lecture" as const,
      day: "Monday",
      time_start: "09:00",
      time_end: "11:00",
      venue: "Room A101",
      lecturer: "Dr. Smith",
      unit: {
        code: "MATH101",
        name: "Calculus I"
      }
    },
    {
      id: "2", 
      type: "tutorial" as const,
      day: "Tuesday",
      time_start: "14:00",
      time_end: "15:00",
      venue: "Room B202",
      lecturer: "Prof. Johnson",
      unit: {
        code: "CS102",
        name: "Programming Fundamentals"
      }
    }
  ]

  const DAYS_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']

  const groupedByDay = mockTimetableEntries.reduce((acc, entry) => {
    if (!entry.day) return acc
    if (!acc[entry.day]) acc[entry.day] = []
    acc[entry.day].push(entry)
    return acc
  }, {} as Record<string, typeof mockTimetableEntries>)

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'lecture': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'tutorial': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      case 'lab': return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300'
      case 'exam': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
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

        <div className="grid gap-6">
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
        </div>
      </div>
    </AppLayout>
  )
}