
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PhoneOff } from "lucide-react";
import { Call } from "./CallManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface OutgoingCallModalProps {
  call: Call;
  onEndCall: () => void;
}

export function OutgoingCallModal({ call, onEndCall }: OutgoingCallModalProps) {
  const [receiver, setReceiver] = useState<{ full_name: string; avatar_url: string } | null>(null);

  useEffect(() => {
    const fetchReceiverProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', call.receiver_id)
        .single();
      if (!error) {
        setReceiver(data);
      }
    };
    fetchReceiverProfile();
  }, [call.receiver_id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-96 text-center">
        <CardHeader>
          <CardTitle>Calling...</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
                <AvatarImage src={receiver?.avatar_url} />
                <AvatarFallback>{receiver?.full_name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">{receiver?.full_name || 'Unknown'}</p>
            <p className="text-muted-foreground">Ringing</p>
            <div className="mt-6">
                <Button variant="destructive" size="lg" onClick={onEndCall} className="rounded-full">
                    <PhoneOff className="h-6 w-6 mr-2" />
                    End Call
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
