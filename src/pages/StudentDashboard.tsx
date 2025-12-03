
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Bell, BookOpen, Calendar, FileText } from "lucide-react";
import { Link } from "react-router-dom";

const notifications = [
  {
    id: 1,
    title: "New announcement in COMP SCI 101",
    time: "10 minutes ago",
    read: false,
  },
  {
    id: 2,
    title: "Upcoming deadline for Assignment 2",
    time: "1 hour ago",
    read: false,
  },
  {
    id: 3,
    title: "Class Rep meeting rescheduled",
    time: "Yesterday",
    read: true,
  },
];

const courses = [
  {
    id: 1,
    name: "Introduction to Computer Science",
    code: "COMP SCI 101",
    lecturer: "Dr. Smith",
  },
  {
    id: 2,
    name: "Data Structures and Algorithms",
    code: "COMP SCI 201",
    lecturer: "Prof. Jones",
  },
  {
    id: 3,
    name: "Software Engineering",
    code: "COMP SCI 301",
    lecturer: "Dr. Williams",
  },
];

const StudentDashboard = () => {
  return (
    <div className="p-4 md:p-8">
      <h1 className="text-3xl font-bold mb-6">Student Dashboard</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  My Courses
                </CardTitle>
                <BookOpen className="w-4 h-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {courses.map((course) => (
                    <div
                      key={course.id}
                      className="flex items-center justify-between"
                    >
                      <div>
                        <p className="font-semibold">{course.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {course.code} - {course.lecturer}
                        </p>
                      </div>
                      <Button variant="outline" size="sm" asChild>
                        <Link to={`/courses/${course.id}`}>
                          View <ArrowRight className="w-4 h-4 ml-2" />
                        </Link>
                      </Button>
                    </div>
                  ))}
                </div>
                <Button className="w-full mt-4">
                  Manage My Courses
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium">
                  Quick Links
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-2 gap-4">
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/timetable">
                    <Calendar className="w-4 h-4 mr-2" />
                    My Timetable
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/exams">
                    <FileText className="w-4 h-4 mr-2" />
                    Exam Timetable
                  </Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link to="/announcements">
                    <Bell className="w-4 h-4 mr-2" />
                    Announcements
                  </Link>
                </Button>
                 <Button variant="outline" className="w-full" asChild>
                  <Link to="/units">
                    <BookOpen className="w-4 h-4 mr-2" />
                    All Units
                  </Link>
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {notifications.map((notification) => (
                <div key={notification.id} className="flex items-start">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src="/placeholder.svg" alt="Avatar" />
                    <AvatarFallback>
                      {notification.title.substring(0, 2).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="ml-4 flex-1">
                    <p className="text-sm font-medium leading-none">
                      {notification.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {notification.time}
                    </p>
                  </div>
                  {!notification.read && (
                    <Badge variant="solid" className="ml-auto">
                      New
                    </Badge>
                  )}
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              View All Notifications
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default StudentDashboard;
