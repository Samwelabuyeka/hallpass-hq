import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FolderOpen } from "lucide-react"

export function FileStorage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FolderOpen className="h-5 w-5" />
          File Storage
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-center py-12">
          <FolderOpen className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">File Storage Coming Soon</h3>
          <p className="text-muted-foreground">
            The file storage feature is currently under development and will be available soon.
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
