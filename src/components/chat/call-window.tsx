
import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { PhoneOff } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export function CallWindow({ chat, peer, onHangUp }) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const [remoteStream, setRemoteStream] = useState(null);

  useEffect(() => {
    if (peer) {
      // Display local stream
      if (localVideoRef.current && peer.stream) {
        localVideoRef.current.srcObject = peer.stream;
      }

      peer.on('stream', (stream) => {
        // Display remote stream
        setRemoteStream(stream);
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = stream;
        }
      });
    }
  }, [peer]);

  return (
    <div className="h-full flex flex-col items-center justify-center bg-black text-white p-4">
      <div className="relative w-full h-full flex items-center justify-center">
        {/* Remote Video */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className={`w-full h-full object-cover ${!remoteStream ? 'hidden' : ''}`}
        />
        {!remoteStream && (
             <div className="flex flex-col items-center">
                <Avatar className="w-24 h-24">
                    <AvatarImage src={chat.avatar_url} />
                    <AvatarFallback>{chat.display_name?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
                <p className="mt-4 text-xl">Connecting to {chat.display_name}...</p>
             </div>
        )}

        {/* Local Video Preview */}
        <video
          ref={localVideoRef}
          autoPlay
          playsInline
          muted
          className="absolute bottom-4 right-4 w-1/4 max-w-[200px] rounded-lg border-2 border-white"
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-10">
        <Button
          onClick={onHangUp}
          variant="destructive"
          size="lg"
          className="rounded-full h-16 w-16"
        >
          <PhoneOff size={32} />
        </Button>
      </div>
    </div>
  );
}
