
import { AppLayout } from "@/components/layout/app-layout";
import { FindUsers } from "@/components/connections/find-users";
import { ConnectionRequests } from "@/components/connections/connection-requests";
import { MyConnections } from "@/components/connections/my-connections";

export default function ConnectionsPage() {

  return (
    <AppLayout>
      <div className="space-y-8">
        <h1 className="text-3xl font-bold">Manage Connections</h1>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <ConnectionRequests />
                <MyConnections />
            </div>
            <div className="space-y-6">
                <FindUsers />
            </div>
        </div>
      </div>
    </AppLayout>
  );
}
