
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Phone, Video, PhoneOff } from "lucide-react";
import { Call } from "./CallManager";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface IncomingCallModalProps {
  call: Call;
  onAnswer: () => void;
  onDecline: () => void;
}

export function IncomingCallModal({ call, onAnswer, onDecline }: IncomingCallModalProps) {
  const [caller, setCaller] = useState<{ full_name: string; avatar_url: string } | null>(null);

  useEffect(() => {
    const fetchCallerProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name, avatar_url')
        .eq('user_id', call.caller_id)
        .single();
      if (!error) {
        setCaller(data);
      }
    };
    fetchCallerProfile();
  }, [call.caller_id]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <Card className="w-96 text-center">
        <CardHeader>
          <CardTitle>Incoming {call.call_type === 'video' ? 'Video' : 'Audio'} Call</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <Avatar className="w-24 h-24">
                <AvatarImage src={caller?.avatar_url} />
                <AvatarFallback>{caller?.full_name[0]}</AvatarFallback>
            </Avatar>
            <p className="text-xl font-semibold">{caller?.full_name || 'Unknown Caller'}</p>
            <p className="text-muted-foreground">is calling you...</p>
            <div className="flex justify-around w-full mt-6">
                <Button variant="destructive" size="lg" onClick={onDecline} className="rounded-full">
                    <PhoneOff className="h-6 w-6 mr-2" />
                    Decline
                </Button>
                <Button variant="success" size="lg" onClick={onAnswer} className="rounded-full">
                    {call.call_type === 'video' ? <Video className="h-6 w-6 mr-2" /> : <Phone className="h-6 w-6 mr-2" />}
                    Answer
                </Button>
            </div>
        </CardContent>
      </Card>
    </div>
  );
}
