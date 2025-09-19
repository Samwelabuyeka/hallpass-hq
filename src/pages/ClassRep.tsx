import { AppLayout } from "@/components/layout/app-layout"
import { ClassRepPanel } from "@/components/class-rep/class-rep-panel"

export default function ClassRep() {
  return (
    <AppLayout>
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Class Representative</h1>
          <p className="text-muted-foreground">
            Register as a class representative and communicate with your classmates
          </p>
        </div>
        
        <ClassRepPanel />
      </div>
    </AppLayout>
  )
}