import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { AppLayout } from "@/components/layout/app-layout"
import { useToast } from "@/hooks/use-toast"
import { supabase } from "@/lib/supabase"
import { Bell, Plus, Calendar, User, Search } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

interface Announcement {
  id: string
  title: string
  content: string
  type: 'general' | 'urgent' | 'academic' | 'event'
  created_at: string
  author_name: string
  university_id: string
}

export default function Announcements() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedType, setSelectedType] = useState<string>("all")
  const { toast } = useToast()

  useEffect(() => {
    loadAnnouncements()
  }, [])

  const loadAnnouncements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      // Get user's university
      const { data: profile } = await supabase
        .from('profiles')
        .select('university_id')
        .eq('id', user.id)
        .single()

      if (!profile?.university_id) {
        setAnnouncements([])
        return
      }

      // Load announcements for the university
      const { data, error } = await supabase
        .from('announcements')
        .select('*')
        .eq('university_id', profile.university_id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setAnnouncements(data || [])
    } catch (error) {
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

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'urgent': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
      case 'academic': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
      case 'event': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300'
    }
  }

  const filteredAnnouncements = announcements.filter(announcement => {
    const matchesSearch = announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         announcement.content.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesType = selectedType === "all" || announcement.type === selectedType
    return matchesSearch && matchesType
  })

  const typeOptions = [
    { value: "all", label: "All Types" },
    { value: "general", label: "General" },
    { value: "urgent", label: "Urgent" },
    { value: "academic", label: "Academic" },
    { value: "event", label: "Events" }
  ]

  if (loading) {
    return (
      <AppLayout>
        <div className="flex-1 p-8 pt-6">
          <div className="text-center">Loading announcements...</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex-1 space-y-6 p-8 pt-6">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Bell className="h-8 w-8" />
            Announcements
          </h2>
          <p className="text-muted-foreground">
            Stay updated with the latest news and updates from your university
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search announcements..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9"
            />
          </div>
          <div className="flex gap-2">
            {typeOptions.map((option) => (
              <Button
                key={option.value}
                variant={selectedType === option.value ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedType(option.value)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {filteredAnnouncements.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <Bell className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Announcements</h3>
                <p className="text-muted-foreground text-center">
                  {searchTerm || selectedType !== "all" 
                    ? "No announcements match your current filters" 
                    : "No announcements available at the moment"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredAnnouncements.map((announcement) => (
              <Card key={announcement.id} className="animate-fade-in">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <Badge className={getTypeColor(announcement.type)}>
                          {announcement.type.charAt(0).toUpperCase() + announcement.type.slice(1)}
                        </Badge>
                        {announcement.type === 'urgent' && (
                          <Badge variant="destructive" className="animate-pulse">
                            URGENT
                          </Badge>
                        )}
                      </div>
                      <CardTitle className="text-xl">{announcement.title}</CardTitle>
                    </div>
                  </div>
                  <CardDescription className="flex items-center gap-4 text-sm">
                    <span className="flex items-center gap-1">
                      <User className="h-3 w-3" />
                      {announcement.author_name}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {formatDistanceToNow(new Date(announcement.created_at), { addSuffix: true })}
                    </span>
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <p className="text-foreground whitespace-pre-wrap">{announcement.content}</p>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Floating notification for urgent announcements */}
        {announcements.some(a => a.type === 'urgent') && (
          <div className="fixed bottom-4 right-4 max-w-sm">
            <Card className="border-red-200 dark:border-red-800 shadow-lg">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                  <Bell className="h-4 w-4 animate-pulse" />
                  Urgent Announcements
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <p className="text-xs text-muted-foreground">
                  You have {announcements.filter(a => a.type === 'urgent').length} urgent announcement(s)
                </p>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </AppLayout>
  )
}