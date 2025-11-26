
import { useState, useEffect } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Users } from "lucide-react";

export function MyConnections() {
  const { user } = useAuth();
  const [connections, setConnections] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchConnections = async () => {
    if(!user) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('user_connections')
        .select('id, user_b:profiles!user_connections_user_b_id_fkey(user_id, username)')
        .eq('user_a_id', user.id)
        .eq('status', 'accepted');
        
      if(error) throw error;
      setConnections(data);

    } catch(error) {
      console.error("Error fetching connections:", error);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchConnections();

    const subscription = supabase
        .channel('public:user_connections')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'user_connections', filter: `user_a_id=eq.${user.id}` }, fetchConnections)
        .subscribe();
        
    return () => {
      supabase.removeChannel(subscription);
    };
  }, [user]);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Users /> My Connections</CardTitle>
        <CardDescription>Your network of connected users.</CardDescription>
      </CardHeader>
      <CardContent>
        {loading && <p>Loading connections...</p>}
        {!loading && connections.length === 0 && <p className="text-muted-foreground">You have no connections yet.</p>}
        <div className="space-y-3">
          {connections.map(conn => (
            <div key={conn.id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{conn.user_b.username}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
