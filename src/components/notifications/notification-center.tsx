import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Bell } from "lucide-react"

export function NotificationCenter() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Bell className="h-5 w-5" />
          Notifications
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Notifications Coming Soon</h3>
          <p className="text-muted-foreground">
            The notification system is currently under development and will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
