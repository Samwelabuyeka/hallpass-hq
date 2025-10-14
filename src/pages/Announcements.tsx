import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AppLayout } from "@/components/layout/app-layout"
import { Bell } from "lucide-react"

export default function Announcements() {
  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Announcements
          </h2>
          <p className="text-muted-foreground">
            Stay updated with university announcements
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Announcements Coming Soon</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12">
              <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">Feature Under Development</h3>
              <p className="text-muted-foreground">
                The announcements feature is currently being developed and will be available soon.
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  )
}
