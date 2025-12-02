
import { useState, useEffect, useRef, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/auth-provider';
import { IncomingCallModal } from './IncomingCallModal';
import { OutgoingCallModal } from './OutgoingCallModal';
import { ActiveCallUI } from './ActiveCallUI';

// Add STUN server configuration
const pc_config = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
  ],
};

export interface Call {
    id: string;
    chat_id: string;
    caller_id: string;
    receiver_id: string;
    call_type: 'audio' | 'video';
    status: string;
}

export function CallManager() {
    const { user } = useAuth();
    const [activeCall, setActiveCall] = useState<Call | null>(null);
    const [callStatus, setCallStatus] = useState<'ringing' | 'answered' | 'declined' | 'ended' | null>(null);
    
    const pcRef = useRef<RTCPeerConnection | null>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

    const [isMuted, setIsMuted] = useState(false);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);

    const signalingChannel = useRef<any>(null);

    const cleanup = useCallback(() => {
        console.log("Cleaning up call resources...");
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        if (signalingChannel.current) {
            supabase.removeChannel(signalingChannel.current);
            signalingChannel.current = null;
        }
        setRemoteStream(null);
        setActiveCall(null);
        setCallStatus(null);
    }, []);


    const handleEndCall = useCallback(async () => {
        if (!activeCall) return;
        console.log("Ending call...");

        // Notify other user
        if (signalingChannel.current) {
            signalingChannel.current.send({ type: 'broadcast', event: 'call-ended' });
        }

        // Update DB
        await supabase.from('calls').update({ status: 'completed' }).eq('id', activeCall.id);
        cleanup();

    }, [activeCall, cleanup]);

    // Listen for new calls
    useEffect(() => {
        if (!user) return;

        const subscription = supabase.from<Call>('calls').on('INSERT', (payload) => {
            const call = payload.new;
            if (call.receiver_id === user.id) {
                setActiveCall(call);
                setCallStatus('ringing');
            } else if (call.caller_id === user.id) {
                setActiveCall(call);
                setCallStatus('ringing');
            }
        }).subscribe();

        return () => {
            supabase.removeSubscription(subscription);
        };
    }, [user]);

    // Main WebRTC Logic
    useEffect(() => {
        if (!activeCall || !callStatus) return;

        // Setup signaling channel for the active call
        const channel = supabase.channel(`signaling:${activeCall.id}`);
        signalingChannel.current = channel;

        const setupPeerConnection = async () => {
            const pc = new RTCPeerConnection(pc_config);
            pcRef.current = pc;

            pc.onicecandidate = (event) => {
                if (event.candidate) {
                    channel.send({ type: 'broadcast', event: 'ice-candidate', payload: { candidate: event.candidate } });
                }
            };

            pc.ontrack = (event) => {
                console.log("Received remote track");
                setRemoteStream(event.streams[0]);
            };

            // Get local media
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: activeCall.call_type === 'video',
                audio: true 
            });
            localStreamRef.current = stream;
            stream.getTracks().forEach(track => pc.addTrack(track, stream));
            setIsVideoEnabled(activeCall.call_type === 'video');
        };

        channel
            .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
                if (pcRef.current) {
                    pcRef.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
                }
            })
            .on('broadcast', { event: 'offer' }, async ({ payload }) => {
                if(pcRef.current) {
                    await pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
                    const answer = await pcRef.current.createAnswer();
                    await pcRef.current.setLocalDescription(answer);
                    channel.send({ type: 'broadcast', event: 'answer', payload: { answer } });
                }
            })
            .on('broadcast', { event: 'answer' }, ({ payload }) => {
                if(pcRef.current) {
                    pcRef.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
                }
            })
            .on('broadcast', { event: 'call-ended' }, () => {
                console.log("Call ended by other party.");
                cleanup();
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED' && callStatus === 'answered' && activeCall.caller_id === user?.id) {
                    await setupPeerConnection();
                    if(pcRef.current) {
                        const offer = await pcRef.current.createOffer();
                        await pcRef.current.setLocalDescription(offer);
                        channel.send({ type: 'broadcast', event: 'offer', payload: { offer } });
                    }
                }
            });
        
        if (callStatus === 'answered' && activeCall.receiver_id === user?.id) {
             setupPeerConnection();
        }

        return () => {
            // Cleanup when component unmounts or call changes
            if(signalingChannel.current) {
                supabase.removeChannel(signalingChannel.current);
            }
        };
    }, [activeCall, callStatus, user?.id, cleanup]);


    const handleAnswer = async () => {
        if (!activeCall) return;
        await supabase.from('calls').update({ status: 'answered' }).eq('id', activeCall.id);
        setCallStatus('answered');
    };

    const handleDecline = async () => {
        if (!activeCall) return;
        await supabase.from('calls').update({ status: 'declined' }).eq('id', activeCall.id);
        if(signalingChannel.current) signalingChannel.current.send({ type: 'broadcast', event: 'call-ended' });
        cleanup();
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
            setIsMuted(prev => !prev);
        }
    }

    const toggleVideo = () => {
        if (localStreamRef.current) {
            localStreamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
            setIsVideoEnabled(prev => !prev);
        }
    }

    if (!activeCall || !callStatus) return null;

    if (callStatus === 'answered') {
        return <ActiveCallUI 
            localStream={localStreamRef.current} 
            remoteStream={remoteStream}
            onEndCall={handleEndCall}
            isMuted={isMuted}
            isVideoEnabled={isVideoEnabled}
            toggleMute={toggleMute}
            toggleVideo={toggleVideo}
        />;
    }

    if (callStatus === 'ringing') {
        const isOutgoing = activeCall.caller_id === user?.id;
        return isOutgoing ? (
            <OutgoingCallModal call={activeCall} onEndCall={handleDecline} />
        ) : (
            <IncomingCallModal call={activeCall} onAnswer={handleAnswer} onDecline={handleDecline} />
        );
    }

    return null;
}
