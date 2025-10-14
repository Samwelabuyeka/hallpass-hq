import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Upload } from "lucide-react"

interface TimetableUploadProps {
  universityId: string
  onUploadComplete?: () => void
}

export function TimetableUpload({ universityId, onUploadComplete }: TimetableUploadProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Upload className="h-5 w-5" />
          Upload Timetable
        </CardTitle>
        <CardDescription>
          Admin feature for uploading timetable files
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <Upload className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Upload Feature Coming Soon</h3>
          <p className="text-muted-foreground">
            The timetable upload feature is currently under development.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
