
import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/components/auth/auth-provider';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { PhoneOff, Mic, MicOff } from 'lucide-react';

export function CallWindow({ chat, peer, onHangUp }) {
  const { user } = useAuth();
  const [remoteStream, setRemoteStream] = useState(null);
  const [isMuted, setIsMuted] = useState(false);
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);

  useEffect(() => {
    if (peer) {
      peer.on('stream', stream => {
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });

      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
          peer.addStream(stream);
        })
        .catch(err => {
          console.error('Failed to get local stream', err);
        });
    }
  }, [peer]);

  const handleMute = () => {
    if (localVideoRef.current && localVideoRef.current.srcObject) {
      const audioTracks = localVideoRef.current.srcObject.getAudioTracks();
      if (audioTracks.length > 0) {
        audioTracks[0].enabled = !isMuted;
        setIsMuted(!isMuted);
      }
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex flex-col items-center justify-center z-50">
      <div className="relative w-full h-full flex items-center justify-center">
        <video ref={localVideoRef} autoPlay muted className="absolute bottom-4 right-4 w-1/4 h-1/4 object-cover rounded-lg" />
        <video ref={remoteVideoRef} autoPlay className="w-full h-full object-cover" />
      </div>
      <div className="absolute bottom-8 flex gap-4">
        <Button size="icon" variant={isMuted ? "destructive" : "default"} onClick={handleMute}>
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button size="icon" variant="destructive" onClick={onHangUp}>
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
