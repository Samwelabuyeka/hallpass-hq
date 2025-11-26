
import { useState } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, UserPlus } from "lucide-react";

export function FindUsers() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim() || !user) return;

    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('user_id, username, avatar_url')
        .ilike('username', `%${searchTerm} %`)
        .neq('user_id', user.id); // Exclude self from search
      
      if(error) throw error;
      setSearchResults(data);

    } catch (error: any) {
      console.error("Error searching users:", error);
      toast({ title: "Error", description: "Failed to search for users.", variant: "destructive"});
    } finally {
      setLoading(false);
    }
  };
  
  const sendConnectionRequest = async (recipientId: string) => {
    if (!user) return;
    try {
      // Check if a request already exists
      const { data: existing, error: existingError } = await supabase
        .from('user_connections')
        .select('id')
        .or(`(user_a_id.eq.${user.id},user_b_id.eq.${recipientId}),(user_a_id.eq.${recipientId},user_b_id.eq.${user.id})`)
        .single();

      if(existing) {
        toast({ title: "Info", description: "A connection or request already exists with this user." });
        return;
      }

      const { error } = await supabase.from('user_connections').insert({
        user_a_id: user.id,
        user_b_id: recipientId,
        status: 'pending',
      });

      if (error) throw error;
      toast({ title: "Success", description: "Connection request sent." });

    } catch (error: any) {
      console.error("Error sending connection request:", error);
      toast({ title: "Error", description: error.message || "Failed to send request.", variant: "destructive" });
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Search /> Find New Connections
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSearch} className="flex items-center gap-2 mb-4">
          <Input 
            placeholder="Search by username..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <Button type="submit" disabled={loading}>{loading ? 'Searching...' : 'Search'}</Button>
        </form>

        <div className="space-y-3">
          {searchResults.map(foundUser => (
            <div key={foundUser.user_id} className="flex items-center justify-between p-2 border rounded-md">
              <span>{foundUser.username}</span>
              <Button size="sm" onClick={() => sendConnectionRequest(foundUser.user_id)}>
                <UserPlus className="h-4 w-4 mr-2"/> Connect
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
