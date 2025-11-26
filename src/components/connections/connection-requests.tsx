
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { UserCheck, UserX, Mail } from "lucide-react";

export function ConnectionRequests() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = async () => {
    if(!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('id, user_a:profiles!user_connections_user_a_id_fkey(user_id, username)')
        .eq('user_b_id', user.id)
        .eq('status', 'pending');
        
      if(error) throw error;
      setRequests(data);

    } catch(error) {
      console.error("Error fetching requests:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRequests();
    
    const subscription = supabase
        .channel('public:user_connections')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_connections', filter: `user_b_id=eq.${user.id}` }, fetchRequests)
        .subscribe();
        
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  const handleRequest = async (requestId: string, newStatus: 'accepted' | 'declined') => {
    try {
      const { error } = await supabase
        .from('user_connections')
        .update({ status: newStatus })
        .eq('id', requestId);

      if (error) throw error;
      
      // If accepted, create a corresponding connection for the other user
      if(newStatus === 'accepted'){
          const request = requests.find(r => r.id === requestId);
          await supabase.from('user_connections').insert({
              user_a_id: user.id,
              user_b_id: request.user_a.user_id,
              status: 'accepted'
          });
      }

      toast({ title: "Success", description: `Request ${newStatus}.` });
      fetchRequests(); // Refresh the list

    } catch (error: any) {
      console.error("Error handling request:", error);
      toast({ title: "Error", description: error.message || "Failed to process request.", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Mail /> Connection Requests</CardTitle>
        <CardDescription>Accept or decline requests from other users.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading requests...</p>}
        {!loading && requests.length === 0 && <p className="text-muted-foreground">No pending requests.</p>}
        <div className="space-y-3">
          {requests.map(request => (
            <div key={request.id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{request.user_a.username} wants to connect</span>
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={() => handleRequest(request.id, 'declined')}>
                    <UserX className="h-4 w-4 mr-2"/> Decline
                </Button>
                <Button size="sm" onClick={() => handleRequest(request.id, 'accepted')}>
                    <UserCheck className="h-4 w-4 mr-2"/> Accept
                </Button>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
