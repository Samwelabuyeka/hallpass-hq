import { useState, useEffect } from "react"
import { AppLayout } from "@/components/layout/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { supabase } from "@/integrations/supabase/client"
import { useAuth } from "@/components/auth/auth-provider"
import { useToast } from "@/hooks/use-toast"
import { Megaphone, Search, Calendar } from "lucide-react"
import { motion } from "framer-motion"

interface Announcement {
  id: string
  title: string
  message: string
  type: string
  unit_code?: string
  created_at: string
  sender_id: string
  university_id: string
}

export default function Announcements() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadAnnouncements()
  }, [user])

  useEffect(() => {
    filterAnnouncements()
  }, [searchQuery, announcements])

  const loadAnnouncements = async () => {
    if (!user) return

    try {
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('user_id', user.id)
        .maybeSingle()

      if (profileError) throw profileError
      if (!profile?.university_id) return

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error: any) {
      console.error('Error loading announcements:', error)
      toast({
        title: "Error",
        description: "Failed to load announcements",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterAnnouncements = () => {
    if (!searchQuery.trim()) {
      setFilteredAnnouncements(announcements)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = announcements.filter(announcement =>
      announcement.title.toLowerCase().includes(query) ||
      announcement.message.toLowerCase().includes(query) ||
      announcement.unit_code?.toLowerCase().includes(query) ||
      announcement.type.toLowerCase().includes(query)
    )
    setFilteredAnnouncements(filtered)
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

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading announcements...</p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Megaphone className="h-8 w-8" />
            Announcements
          </h2>
          <p className="text-muted-foreground">
            Stay updated with the latest announcements from your university
          </p>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search announcements by title, message, course code..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  {searchQuery ? "No announcements found matching your search" : "No announcements yet"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement, index) => (
              <motion.div
                key={announcement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <Card className="shadow-soft hover:shadow-elegant transition-smooth">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1 flex-1">
                        <CardTitle className="text-lg">{announcement.title}</CardTitle>
                        <CardDescription className="flex items-center gap-2 text-xs">
                          <Calendar className="h-3 w-3" />
                          {new Date(announcement.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2">
                        <Badge variant={getTypeColor(announcement.type)}>
                          {announcement.type}
                        </Badge>
                        {announcement.unit_code && (
                          <Badge variant="outline">{announcement.unit_code}</Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                      {announcement.message}
                    </p>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AppLayout>
  )
}
