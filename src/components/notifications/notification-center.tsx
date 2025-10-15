import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { Bell, Check, Search } from "lucide-react"
import { motion } from "framer-motion"

interface Notification {
  id: string
  title: string
  message: string
  type: string
  unit_code?: string
  created_at: string
  is_read: boolean
  read_at?: string
  recipient_id?: string
}

export function NotificationCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [filteredNotifications, setFilteredNotifications] = useState<Notification[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [activeTab, setActiveTab] = useState("all")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadNotifications()
  }, [user])

  useEffect(() => {
    filterNotifications()
  }, [searchQuery, activeTab, notifications])

  const loadNotifications = async () => {
    if (!user) return

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profile?.university_id) return

      const { data: notificationRecipients, error: recipientsError } = await supabase
        .from('notification_recipients')
        .select(`
          id,
          is_read,
          read_at,
          notification_id,
          notifications (
            id,
            title,
            message,
            type,
            unit_code,
            created_at
          )
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })

      if (recipientsError) throw recipientsError

      const formattedNotifications = (notificationRecipients || []).map((recipient: any) => ({
        id: recipient.notification_id,
        title: recipient.notifications.title,
        message: recipient.notifications.message,
        type: recipient.notifications.type,
        unit_code: recipient.notifications.unit_code,
        created_at: recipient.notifications.created_at,
        is_read: recipient.is_read,
        read_at: recipient.read_at,
        recipient_id: recipient.id
      }))

      setNotifications(formattedNotifications)
    } catch (error: any) {
      console.error('Error loading notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterNotifications = () => {
    let filtered = notifications

    if (activeTab === "unread") {
      filtered = filtered.filter(n => !n.is_read)
    } else if (activeTab === "read") {
      filtered = filtered.filter(n => n.is_read)
    }

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(n =>
        n.title.toLowerCase().includes(query) ||
        n.message.toLowerCase().includes(query) ||
        n.unit_code?.toLowerCase().includes(query)
      )
    }

    setFilteredNotifications(filtered)
  }

  const markAsRead = async (notificationId: string) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .eq('notification_id', notificationId)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n =>
          n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n
        )
      )
    } catch (error: any) {
      console.error('Error marking notification as read:', error)
      toast({
        title: "Error",
        description: "Failed to update notification",
        variant: "destructive",
      })
    }
  }

  const markAllAsRead = async () => {
    if (!user) return

    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id)
      
      const { error } = await supabase
        .from('notification_recipients')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('recipient_id', user.id)
        .in('notification_id', unreadIds)

      if (error) throw error

      setNotifications(prev =>
        prev.map(n => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
      )

      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error: any) {
      console.error('Error marking all as read:', error)
      toast({
        title: "Error",
        description: "Failed to update notifications",
        variant: "destructive",
      })
    }
  }

  const getTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'urgent':
        return 'destructive'
      case 'general':
        return 'default'
      case 'academic':
        return 'secondary'
      default:
        return 'outline'
    }
  }

  const unreadCount = notifications.filter(n => !n.is_read).length

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold flex items-center gap-2">
            <Bell className="h-6 w-6" />
            Notifications
            {unreadCount > 0 && (
              <Badge variant="destructive">{unreadCount}</Badge>
            )}
          </h3>
          <p className="text-muted-foreground">Manage your notifications</p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={markAllAsRead} variant="outline">
            <Check className="h-4 w-4 mr-2" />
            Mark All as Read
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search notifications..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="all">All ({notifications.length})</TabsTrigger>
          <TabsTrigger value="unread">Unread ({unreadCount})</TabsTrigger>
          <TabsTrigger value="read">Read ({notifications.length - unreadCount})</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="space-y-4 mt-6">
          {filteredNotifications.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No notifications found" : "No notifications yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredNotifications.map((notification, index) => (
              <motion.div
                key={notification.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className={`shadow-soft hover:shadow-elegant transition-smooth ${
                  !notification.is_read ? 'border-l-4 border-l-primary' : ''
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <CardTitle className="text-base">{notification.title}</CardTitle>
                          {!notification.is_read && (
                            <Badge variant="default" className="text-xs">New</Badge>
                          )}
                        </div>
                        <CardDescription className="text-xs">
                          {new Date(notification.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getTypeColor(notification.type)}>
                          {notification.type}
                        </Badge>
                        {notification.unit_code && (
                          <Badge variant="outline">{notification.unit_code}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4 whitespace-pre-wrap">
                      {notification.message}
                    </p>
                    {!notification.is_read && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => markAsRead(notification.id)}
                      >
                        <Check className="h-4 w-4 mr-2" />
                        Mark as Read
                      </Button>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
