import { AppLayout } from "@/components/layout/app-layout"
import { NotificationCenter } from "@/components/notifications/notification-center"

export default function Notifications() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">
            Stay updated with important announcements and messages
          </p>
        </div>
        
        <NotificationCenter />
      </div>
    </AppLayout>
  )
}