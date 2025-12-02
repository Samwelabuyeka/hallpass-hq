
import { useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff, PhoneOff } from 'lucide-react';

interface ActiveCallUIProps {
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  onEndCall: () => void;
  isMuted: boolean;
  isVideoEnabled: boolean;
  toggleMute: () => void;
  toggleVideo: () => void;
}

export function ActiveCallUI({ 
    localStream, remoteStream, onEndCall, 
    isMuted, isVideoEnabled, toggleMute, toggleVideo
}: ActiveCallUIProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Remote Video */}
      <div className="flex-1 relative bg-gray-900">
        <video ref={remoteVideoRef} autoPlay playsInline className="w-full h-full object-cover" />
      </div>

      {/* Local Video Preview */}
      <div className="absolute top-4 right-4 w-48 h-32 bg-gray-800 border-2 border-gray-600 rounded-md overflow-hidden">
        <video ref={localVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
      </div>

      {/* Call Controls */}
      <div className="bg-gray-800 bg-opacity-75 p-4 flex justify-center items-center gap-4">
        <Button variant={isMuted ? "destructive" : "secondary"} size="icon" className="rounded-full" onClick={toggleMute}>
          {isMuted ? <MicOff /> : <Mic />}
        </Button>
        <Button variant={isVideoEnabled ? "secondary" : "destructive"} size="icon" className="rounded-full" onClick={toggleVideo}>
          {isVideoEnabled ? <Video /> : <VideoOff />}
        </Button>
        <Button variant="destructive" size="lg" className="rounded-full" onClick={onEndCall}>
          <PhoneOff />
        </Button>
      </div>
    </div>
  );
}
