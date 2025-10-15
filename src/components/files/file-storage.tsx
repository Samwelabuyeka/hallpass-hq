import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/integrations/supabase/client"
import { useToast } from "@/hooks/use-toast"
import { FileText, Upload, Download, Trash2, Search, FolderOpen } from "lucide-react"
import { motion } from "framer-motion"

interface StoredFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  uploaded_at: string
  unit_code?: string
}

export function FileStorage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [files, setFiles] = useState<StoredFile[]>([])
  const [filteredFiles, setFilteredFiles] = useState<StoredFile[]>([])
  const [searchQuery, setSearchQuery] = useState("")
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    loadFiles()
  }, [user])

  useEffect(() => {
    filterFiles()
  }, [searchQuery, files])

  const loadFiles = async () => {
    if (!user) return

    try {
      const { data, error } = await supabase
        .storage
        .from('course-files')
        .list(user.id)

      if (error) throw error

      const filesWithUrls: StoredFile[] = await Promise.all(
        (data || []).map(async (file) => {
          const { data: urlData } = await supabase
            .storage
            .from('course-files')
            .getPublicUrl(`${user.id}/${file.name}`)

          return {
            id: file.id,
            name: file.name,
            size: file.metadata?.size || 0,
            type: file.metadata?.mimetype || 'unknown',
            url: urlData.publicUrl,
            uploaded_at: file.created_at,
          }
        })
      )

      setFiles(filesWithUrls)
    } catch (error: any) {
      console.error('Error loading files:', error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const filterFiles = () => {
    if (!searchQuery.trim()) {
      setFilteredFiles(files)
      return
    }

    const query = searchQuery.toLowerCase()
    const filtered = files.filter(file =>
      file.name.toLowerCase().includes(query) ||
      file.type.toLowerCase().includes(query)
    )
    setFilteredFiles(filtered)
  }

  const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file || !user) return

    setUploading(true)
    try {
      const filePath = `${user.id}/${Date.now()}_${file.name}`
      const { error } = await supabase.storage
        .from('course-files')
        .upload(filePath, file)

      if (error) throw error

      toast({
        title: "Success",
        description: "File uploaded successfully",
      })

      loadFiles()
    } catch (error: any) {
      console.error('Error uploading file:', error)
      toast({
        title: "Error",
        description: "Failed to upload file",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (fileName: string) => {
    if (!user) return

    try {
      const { error } = await supabase.storage
        .from('course-files')
        .remove([`${user.id}/${fileName}`])

      if (error) throw error

      toast({
        title: "Success",
        description: "File deleted successfully",
      })

      loadFiles()
    } catch (error: any) {
      console.error('Error deleting file:', error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading files...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Course Files</h3>
          <p className="text-muted-foreground">Upload and manage your course materials</p>
        </div>
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
          <Button asChild disabled={uploading}>
            <label htmlFor="file-upload" className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              {uploading ? "Uploading..." : "Upload File"}
            </label>
          </Button>
        </div>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search files by name or type..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      <div className="grid gap-4">
        {filteredFiles.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <FolderOpen className="h-12 w-12 text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {searchQuery ? "No files found matching your search" : "No files uploaded yet"}
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredFiles.map((file, index) => (
            <motion.div
              key={file.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
            >
              <Card className="shadow-soft hover:shadow-elegant transition-smooth">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <FileText className="h-8 w-8 text-primary" />
                      <div>
                        <CardTitle className="text-base">{file.name}</CardTitle>
                        <CardDescription className="text-xs">
                          {formatFileSize(file.size)} • {new Date(file.uploaded_at).toLocaleDateString()}
                        </CardDescription>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(file.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Download
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(file.name)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            </motion.div>
          ))
        )}
      </div>
    </div>
  )
}
