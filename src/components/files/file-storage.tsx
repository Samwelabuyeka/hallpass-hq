import React, { useState, useCallback } from "react"
import { useDropzone } from "react-dropzone"
import { useAuth } from "@/components/auth/auth-provider"
import { supabase } from "@/lib/supabase"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Upload, File, Download, Trash2, FolderOpen } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"

interface FileData {
  id: string
  file_name: string
  file_path: string
  file_type: string
  file_size: number
  unit_id: string | null
  created_at: string
}

export function FileStorage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [files, setFiles] = useState<FileData[]>([])
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)

  // Fetch user files
  const fetchFiles = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('student_files')
        .select('*')
        .eq('student_id', user.id)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFiles(data || [])
    } catch (error) {
      console.error('Error fetching files:', error)
      toast({
        title: "Error",
        description: "Failed to load files",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  // Upload files to Supabase Storage
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (!user) return
    
    setUploading(true)
    
    for (const file of acceptedFiles) {
      try {
        // Upload to Supabase Storage
        const fileExt = file.name.split('.').pop()
        const fileName = `${user.id}/${Date.now()}.${fileExt}`
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('student-files')
          .upload(fileName, file)

        if (uploadError) throw uploadError

        // Save file metadata to database
        const { error: dbError } = await supabase
          .from('student_files')
          .insert({
            student_id: user.id,
            file_name: file.name,
            file_path: uploadData.path,
            file_type: file.type,
            file_size: file.size,
          })

        if (dbError) throw dbError

        toast({
          title: "Success",
          description: `${file.name} uploaded successfully`,
        })
      } catch (error) {
        console.error('Upload error:', error)
        toast({
          title: "Error",
          description: `Failed to upload ${file.name}`,
          variant: "destructive",
        })
      }
    }
    
    setUploading(false)
    fetchFiles()
  }, [user, toast, fetchFiles])

  // Delete file
  const deleteFile = async (file: FileData) => {
    try {
      // Delete from storage
      const { error: storageError } = await supabase.storage
        .from('student-files')
        .remove([file.file_path])

      if (storageError) throw storageError

      // Delete from database
      const { error: dbError } = await supabase
        .from('student_files')
        .delete()
        .eq('id', file.id)

      if (dbError) throw dbError

      toast({
        title: "Success",
        description: "File deleted successfully",
      })
      
      fetchFiles()
    } catch (error) {
      console.error('Delete error:', error)
      toast({
        title: "Error",
        description: "Failed to delete file",
        variant: "destructive",
      })
    }
  }

  // Download file
  const downloadFile = async (file: FileData) => {
    try {
      const { data, error } = await supabase.storage
        .from('student-files')
        .download(file.file_path)

      if (error) throw error

      const url = URL.createObjectURL(data)
      const a = document.createElement('a')
      a.href = url
      a.download = file.file_name
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Download error:', error)
      toast({
        title: "Error",
        description: "Failed to download file",
        variant: "destructive",
      })
    }
  }

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    disabled: uploading,
  })

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  // Load files on component mount
  React.useEffect(() => {
    fetchFiles()
  }, [fetchFiles])

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5" />
            File Storage
          </CardTitle>
          <CardDescription>
            Upload and manage your academic files, assignments, and documents
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              isDragActive
                ? 'border-primary bg-primary/5'
                : 'border-muted-foreground/25 hover:border-primary/50'
            }`}
          >
            <input {...getInputProps()} />
            <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            {isDragActive ? (
              <p className="text-primary">Drop the files here...</p>
            ) : (
              <div>
                <p className="text-lg font-medium mb-2">
                  Drag & drop files here, or click to select
                </p>
                <p className="text-sm text-muted-foreground">
                  Supports all file types (PDFs, images, documents, etc.)
                </p>
              </div>
            )}
            {uploading && (
              <div className="mt-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary mx-auto"></div>
                <p className="text-sm text-muted-foreground mt-2">Uploading...</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your Files</CardTitle>
          <CardDescription>
            {files.length} file{files.length !== 1 ? 's' : ''} stored
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <File className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No files uploaded yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="h-8 w-8 text-muted-foreground" />
                    <div>
                      <p className="font-medium">{file.file_name}</p>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span>{formatFileSize(file.file_size)}</span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{new Date(file.created_at).toLocaleDateString()}</span>
                      </div>
                      {file.file_type && (
                        <Badge variant="secondary" className="mt-1">
                          {file.file_type}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadFile(file)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteFile(file)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}