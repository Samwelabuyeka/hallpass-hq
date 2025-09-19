import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import { Bell, BellOff, Check, Clock, BookOpen, AlertCircle, Calendar, MessageSquare } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Notification {
  id: string
  title: string
  message: string
  type: 'lecture' | 'assignment' | 'exam' | 'general' | 'announcement'
  unit_id: string | null
  is_read: boolean
  created_at: string
  sender_id: string | null
  profiles?: {
    full_name: string | null
  }
  master_units?: {
    name: string
    code: string
  }
}

const notificationIcons = {
  lecture: BookOpen,
  assignment: Clock,
  exam: AlertCircle,
  general: MessageSquare,
  announcement: Bell,
}

const notificationColors = {
  lecture: "bg-blue-500",
  assignment: "bg-orange-500", 
  exam: "bg-red-500",
  general: "bg-gray-500",
  announcement: "bg-green-500",
}

export function NotificationCenter() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Fetch notifications
  const fetchNotifications = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select(`
          *,
          profiles!notifications_sender_id_fkey(full_name),
          master_units(name, code)
        `)
        .eq('recipient_id', user.id)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      
      setNotifications(data || [])
      setUnreadCount(data?.filter(n => !n.is_read).length || 0)
    } catch (error) {
      console.error('Error fetching notifications:', error)
      toast({
        title: "Error",
        description: "Failed to load notifications",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Mark notification as read
  const markAsRead = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId)

      if (error) throw error
      
      setNotifications(prev => 
        prev.map(n => 
          n.id === notificationId ? { ...n, is_read: true } : n
        )
      )
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch (error) {
      console.error('Error marking notification as read:', error)
    }
  }

  // Mark all as read
  const markAllAsRead = async () => {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('recipient_id', user?.id)
        .eq('is_read', false)

      if (error) throw error
      
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })))
      setUnreadCount(0)
      
      toast({
        title: "Success",
        description: "All notifications marked as read",
      })
    } catch (error) {
      console.error('Error marking all notifications as read:', error)
      toast({
        title: "Error",
        description: "Failed to mark notifications as read",
        variant: "destructive",
      })
    }
  }

  // Send notification (for class reps)
  const sendNotification = async (data: {
    recipientIds: string[]
    title: string
    message: string
    type: Notification['type']
    unitId?: string
  }) => {
    try {
      const notifications = data.recipientIds.map(recipientId => ({
        recipient_id: recipientId,
        sender_id: user?.id,
        title: data.title,
        message: data.message,
        type: data.type,
        unit_id: data.unitId || null,
      }))

      const { error } = await supabase
        .from('notifications')
        .insert(notifications)

      if (error) throw error
      
      toast({
        title: "Success",
        description: `Notification sent to ${data.recipientIds.length} student${data.recipientIds.length !== 1 ? 's' : ''}`,
      })
    } catch (error) {
      console.error('Error sending notification:', error)
      toast({
        title: "Error",
        description: "Failed to send notification",
        variant: "destructive",
      })
    }
  }

  // Set up real-time notifications
  useEffect(() => {
    if (!user) return

    const channel = supabase
      .channel('notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
          filter: `recipient_id=eq.${user.id}`,
        },
        (payload) => {
          // Show browser notification if permission granted
          if (Notification.permission === 'granted') {
            new Notification(payload.new.title, {
              body: payload.new.message,
              icon: '/favicon.ico',
            })
          }
          
          // Refresh notifications
          fetchNotifications()
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [user])

  // Request notification permission
  useEffect(() => {
    if (Notification.permission === 'default') {
      Notification.requestPermission()
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
  }, [user])

  const formatTimeAgo = (date: string) => {
    const now = new Date()
    const notificationDate = new Date(date)
    const diffInMinutes = Math.floor((now.getTime() - notificationDate.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes}m ago`
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}h ago`
    return `${Math.floor(diffInMinutes / 1440)}d ago`
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              <CardTitle>Notifications</CardTitle>
              {unreadCount > 0 && (
                <Badge variant="destructive" className="rounded-full">
                  {unreadCount}
                </Badge>
              )}
            </div>
            {unreadCount > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={markAllAsRead}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" />
                Mark all read
              </Button>
            )}
          </div>
          <CardDescription>
            Stay updated with lectures, assignments, and announcements
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : notifications.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <BellOff className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No notifications yet</p>
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="space-y-3">
                {notifications.map((notification) => {
                  const Icon = notificationIcons[notification.type]
                  const colorClass = notificationColors[notification.type]
                  
                  return (
                    <div
                      key={notification.id}
                      className={`p-4 border rounded-lg transition-colors ${
                        notification.is_read ? 'bg-background' : 'bg-muted/50'
                      }`}
                      onClick={() => !notification.is_read && markAsRead(notification.id)}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-full ${colorClass} text-white`}>
                          <Icon className="h-4 w-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-medium text-sm">{notification.title}</h4>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">
                                {formatTimeAgo(notification.created_at)}
                              </span>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-primary rounded-full"></div>
                              )}
                            </div>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">
                            {notification.message}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {notification.master_units && (
                              <>
                                <Badge variant="outline" className="text-xs">
                                  {notification.master_units.code}
                                </Badge>
                                <span>{notification.master_units.name}</span>
                              </>
                            )}
                            {notification.profiles?.full_name && (
                              <>
                                <Separator orientation="vertical" className="h-3" />
                                <span>From: {notification.profiles.full_name}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  )
}