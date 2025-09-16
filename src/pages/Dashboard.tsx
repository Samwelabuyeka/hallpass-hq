"use client"

import { motion } from "framer-motion"
import { Calendar, Clock, BookOpen, Trophy, TrendingUp, Bell } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

const stats = [
  {
    title: "Active Units",
    value: "6",
    description: "This semester",
    icon: BookOpen,
    trend: "+2 from last semester"
  },
  {
    title: "Classes Today",
    value: "3",
    description: "Next: Math at 2:00 PM",
    icon: Calendar,
    trend: "2 hours remaining"
  },
  {
    title: "Upcoming Exams",
    value: "2",
    description: "Next week",
    icon: Trophy,
    trend: "Physics & Chemistry"
  },
  {
    title: "Study Hours",
    value: "24h",
    description: "This week",
    icon: Clock,
    trend: "+6h from last week"
  }
]

const todaySchedule = [
  {
    time: "09:00 - 11:00",
    unit: "MATH101",
    title: "Calculus I",
    venue: "Room A1",
    status: "completed"
  },
  {
    time: "14:00 - 16:00",
    unit: "PHY103",
    title: "Physics I",
    venue: "Lab B2",
    status: "upcoming"
  },
  {
    time: "16:30 - 18:00",
    unit: "CS102",
    title: "Programming I",
    venue: "Computer Lab",
    status: "upcoming"
  }
]

const recentAnnouncements = [
  {
    title: "Mid-term Exam Schedule Released",
    description: "Check your examination timetable for updates",
    time: "2 hours ago",
    type: "exam"
  },
  {
    title: "Library Extended Hours",
    description: "Open until 10 PM during exam period",
    time: "1 day ago",
    type: "info"
  },
  {
    title: "Assignment Deadline Reminder",
    description: "CS102 project due next Friday",
    time: "2 days ago",
    type: "assignment"
  }
]

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8 max-w-7xl mx-auto">
      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold mb-2">Good afternoon, John! 👋</h1>
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
        {stats.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3, delay: 0.1 * index }}
          >
            <Card className="card-gradient shadow-soft hover:shadow-elegant transition-smooth">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <stat.icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
                <p className="text-xs text-accent font-medium mt-1">
                  {stat.trend}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        ))}
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
              {todaySchedule.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className={`flex items-center space-x-4 p-3 rounded-lg border ${
                    item.status === 'completed' 
                      ? 'bg-muted/50 opacity-60' 
                      : 'bg-background'
                  }`}
                >
                  <div className="flex-shrink-0">
                    <div className={`w-3 h-3 rounded-full ${
                      item.status === 'completed' ? 'bg-accent' : 'bg-primary'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium">
                          {item.unit} - {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {item.venue}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium">{item.time}</p>
                        <Badge 
                          variant={item.status === 'completed' ? 'secondary' : 'default'}
                          className="text-xs"
                        >
                          {item.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Announcements */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
        >
          <Card className="shadow-soft">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="h-5 w-5" />
                Recent Announcements
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {recentAnnouncements.map((announcement, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 * index }}
                  className="space-y-2 p-3 rounded-lg border bg-background/50"
                >
                  <div className="flex items-start justify-between">
                    <h4 className="text-sm font-medium leading-tight">
                      {announcement.title}
                    </h4>
                    <Badge variant="outline" className="text-xs">
                      {announcement.type}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {announcement.description}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {announcement.time}
                  </p>
                </motion.div>
              ))}
              <Button variant="outline" size="sm" className="w-full">
                View All Announcements
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
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Calendar className="h-6 w-6" />
                <span className="text-xs">View Timetable</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <BookOpen className="h-6 w-6" />
                <span className="text-xs">Manage Units</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <Trophy className="h-6 w-6" />
                <span className="text-xs">Exam Schedule</span>
              </Button>
              <Button variant="outline" className="h-20 flex-col gap-2">
                <TrendingUp className="h-6 w-6" />
                <span className="text-xs">View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  )
}