import { AppLayout } from "@/components/layout/app-layout"
import { FileStorage } from "@/components/files/file-storage"

export default function Files() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">File Storage</h1>
          <p className="text-muted-foreground">
            Upload, organize, and manage your academic files and documents
          </p>
        </div>
        
        <FileStorage />
      </div>
    </AppLayout>
  )
}