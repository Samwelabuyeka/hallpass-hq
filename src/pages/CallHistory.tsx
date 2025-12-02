
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Phone, Video, PhoneMissed, PhoneIncoming, PhoneOutgoing } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface CallRecord {
  id: string;
  created_at: string;
  caller_id: string;
  receiver_id: string;
  call_type: 'audio' | 'video';
  status: 'completed' | 'missed' | 'declined' | 'initiated';
  duration: number | null;
  other_user: { full_name: string; avatar_url: string };
}

export function CallHistory() {
  const { user } = useAuth();
  const [calls, setCalls] = useState<CallRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCallHistory = async () => {
      if (!user) return;
      setLoading(true);

      const { data, error } = await supabase
        .from('calls')
        .select('*, caller:profiles!calls_caller_id_fkey(full_name, avatar_url), receiver:profiles!calls_receiver_id_fkey(full_name, avatar_url)')
        .or(`caller_id.eq.${user.id},receiver_id.eq.${user.id}`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching call history:', error);
      } else {
        const formattedCalls = data.map(call => {
            const isOutgoing = call.caller_id === user.id;
            const other_user = isOutgoing ? call.receiver : call.caller;
            return { ...call, other_user };
        });
        setCalls(formattedCalls as any as CallRecord[]);
      }
      setLoading(false);
    };

    fetchCallHistory();
  }, [user]);

  const renderCallIcon = (call: CallRecord) => {
    const isOutgoing = call.caller_id === user?.id;
    if (call.status === 'missed' || call.status === 'declined') {
        return <PhoneMissed className="h-5 w-5 text-destructive" />;
    }
    return isOutgoing ? <PhoneOutgoing className="h-5 w-5 text-muted-foreground" /> : <PhoneIncoming className="h-5 w-5 text-primary" />;
  }

  if (loading) {
    return <div className="text-center p-8">Loading call history...</div>;
  }

  return (
    <div className="container mx-auto p-4">
        <Card>
            <CardHeader>
                <CardTitle>Call History</CardTitle>
            </CardHeader>
            <CardContent>
                <div className="space-y-4">
                    {calls.map(call => (
                        <div key={call.id} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                            <div className="flex items-center gap-4">
                                <Avatar className="w-12 h-12">
                                    <AvatarImage src={call.other_user.avatar_url} />
                                    <AvatarFallback>{call.other_user.full_name?.[0]}</AvatarFallback>
                                </Avatar>
                                <div>
                                    <p className="font-semibold">{call.other_user.full_name}</p>
                                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                        {renderCallIcon(call)}
                                        <span>{formatDistanceToNow(new Date(call.created_at), { addSuffix: true })}</span>
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                {call.call_type === 'video' ? <Video className="h-6 w-6" /> : <Phone className="h-6 w-6" />}
                                {call.duration && <span className="text-sm text-muted-foreground">{Math.floor(call.duration / 60)}m {call.duration % 60}s</span>}
                            </div>
                        </div>
                    ))}
                </div>
                {calls.length === 0 && <p className="text-center text-muted-foreground py-8">No calls yet.</p>}
            </CardContent>
        </Card>
    </div>
  );
}
