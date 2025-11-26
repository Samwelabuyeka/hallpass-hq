
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Send, Phone, Check, CheckCheck, Paperclip } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { CallWindow } from "./call-window";
import SimplePeer from 'simple-peer';

export function ChatWindow({ chat }) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [typingUser, setTypingUser] = useState(null);
  const [inCall, setInCall] = useState(false);
  const [callOffer, setCallOffer] = useState(null);
  const [peer, setPeer] = useState(null);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const signalingChannelRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  const markMessagesAsRead = async () => {
    if(!chat || !user) return;
    try {
        await supabase.rpc('mark_messages_as_read', { chat_id_param: chat.id, user_id_param: user.id });
    } catch (error) {
        console.error('Error marking messages as read:', error);
    }
  };

  useEffect(() => {
    if (!chat) return;

    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from("messages")
          .select("*, author:profiles(username, avatar_url), attachment:attachments(*)")
          .eq("chat_id", chat.id)
          .order("created_at");

        if (error) throw error;
        setMessages(data);
        markMessagesAsRead();
      } catch (error) {
        console.error("Error fetching messages:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMessages();
    
    const messagesSubscription = supabase
      .channel(`public:messages:chat_id=eq.${chat.id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages', filter: `chat_id=eq.${chat.id}` }, (payload) => {
        if (payload.eventType === 'INSERT') {
            const fetchNewMessage = async () => {
                const { data: author, error: authorError } = await supabase
                    .from('profiles')
                    .select('username, avatar_url')
                    .eq('user_id', payload.new.user_id)
                    .single();

                const { data: attachment, error: attachmentError } = await supabase
                    .from('attachments')
                    .select('*')
                    .eq('id', payload.new.attachment_id)
                    .single();
                
                if(authorError || attachmentError) throw authorError || attachmentError;

                setMessages((prevMessages) => [...prevMessages, {...payload.new, author, attachment}]);
                markMessagesAsRead();
            }
            fetchNewMessage();
        } else if (payload.eventType === 'UPDATE'){
            setMessages(currentMessages => currentMessages.map(msg => msg.id === payload.new.id ? {...msg, ...payload.new} : msg));
        }
      })
      .subscribe();

    const typingChannel = supabase.channel(`typing-${chat.id}`);
    typingChannel
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.user_id !== user.id) {
          setTypingUser(payload.payload.username);
          if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
          }
          typingTimeoutRef.current = setTimeout(() => {
            setTypingUser(null);
          }, 3000);
        }
      })
      .subscribe();

    signalingChannelRef.current = supabase.channel(`signaling-${chat.id}`);
    signalingChannelRef.current
      .on('broadcast', { event: 'call-offer' }, ({ payload }) => {
        if (payload.recipientId === user.id) {
          setCallOffer({ from: payload.from, signal: payload.signal });
        }
      })
      .on('broadcast', { event: 'call-answer' }, ({ payload }) => {
        if (payload.recipientId === user.id) {
          peer?.signal(payload.signal);
        }
      })
      .on('broadcast', { event: 'ice-candidate' }, ({ payload }) => {
        if (payload.recipientId === user.id) {
          peer?.signal({ candidate: payload.candidate });
        }
      })
      .on('broadcast', { event: 'hang-up' }, () => {
        handleHangUp(false);
      })
      .subscribe();
      
    return () => {
      supabase.removeChannel(messagesSubscription);
      supabase.removeChannel(typingChannel);
      if(signalingChannelRef.current) supabase.removeChannel(signalingChannelRef.current);
      if(typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };

  }, [chat, user, peer]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!newMessage.trim() && !attachment) || !user) return;

    try {
        let attachmentId = null;
        if(attachment){
            const { data: fileData, error: fileError } = await supabase.storage.from('chat-attachments').upload(`${chat.id}/${Date.now()}_${attachment.name}`, attachment);
            if(fileError) throw fileError;

            const { data: attachmentData, error: attachmentError } = await supabase.from('attachments').insert({
                message_id: null, // we will update this later
                file_name: attachment.name,
                file_type: attachment.type,
                file_path: fileData.path
            }).select().single();

            if(attachmentError) throw attachmentError;
            attachmentId = attachmentData.id;
        }

      const { data: messageData, error } = await supabase.from("messages").insert([
        {
          chat_id: chat.id,
          user_id: user.id,
          content: newMessage,
          attachment_id: attachmentId
        },
      ]).select().single();

      if (error) throw error;

      if(attachmentId){
          await supabase.from('attachments').update({ message_id: messageData.id }).eq('id', attachmentId);
      }

      setNewMessage("");
      setAttachment(null);
      if(fileInputRef.current) fileInputRef.current.value = "";

    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const handleTyping = (e) => {
    setNewMessage(e.target.value);
    const typingChannel = supabase.channel(`typing-${chat.id}`);
    typingChannel.send({
      type: 'broadcast',
      event: 'typing',
      payload: { user_id: user.id, username: user.user_metadata.username },
    });
  };

  const handleFileChange = (e) => {
      if(e.target.files && e.target.files.length > 0){
          setAttachment(e.target.files[0]);
      }
  }

  const handleCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const newPeer = new SimplePeer({
        initiator: true,
        stream: stream,
        trickle: true,
      });

      newPeer.on('signal', signal => {
        if(signal.renegotiate || signal.transceiverRequest) return;
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'call-offer',
          payload: { 
            from: user.id, 
            recipientId: chat.other_user_id, // Assuming chat object has other_user_id
            signal 
          },
        });
      });

      setPeer(newPeer);
      setInCall(true);
    } catch (error) {
      console.error('Error starting call:', error);
      toast({ title: "Error", description: "Could not start call. Please check camera and microphone permissions.", variant: "destructive" });
    }
  }

  const handleAcceptCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const newPeer = new SimplePeer({
        initiator: false,
        stream: stream,
        trickle: true,
      });

      newPeer.on('signal', signal => {
         if(signal.renegotiate || signal.transceiverRequest) return;
        signalingChannelRef.current.send({
          type: 'broadcast',
          event: 'call-answer',
          payload: { from: user.id, recipientId: callOffer.from, signal },
        });
      });

      newPeer.signal(callOffer.signal);
      setPeer(newPeer);
      setInCall(true);
      setCallOffer(null);
    } catch (error) {
      console.error('Error accepting call:', error);
      toast({ title: "Error", description: "Could not accept call. Please check camera and microphone permissions.", variant: "destructive" });
    }
  }

  const handleHangUp = (notify = true) => {
    peer?.destroy();
    setPeer(null);
    setInCall(false);
    setCallOffer(null);
    if (notify) {
      signalingChannelRef.current.send({ type: 'broadcast', event: 'hang-up' });
    }
  }

  if (!chat) {
    return <div className="h-full flex items-center justify-center text-muted-foreground">Select a chat to start messaging</div>;
  }

  if (inCall) {
    return <CallWindow chat={chat} peer={peer} onHangUp={() => handleHangUp()} />;
  }

  return (
    <div className="h-full flex flex-col">
        {callOffer && (
            <div className="p-4 bg-green-500 text-white flex justify-between items-center">
                <span>{callOffer.from} is calling...</span>
                <div>
                    <Button variant="ghost" onClick={handleAcceptCall}>Accept</Button>
                    <Button variant="ghost" onClick={() => setCallOffer(null)}>Decline</Button>
                </div>
            </div>
        )}
      <div className="p-4 border-b flex justify-between items-center">
        <h2 className="text-xl font-semibold">{chat.display_name}</h2>
        <Button size="icon" variant="ghost" onClick={handleCall}>
          <Phone />
        </Button>
      </div>
      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {loading ? (
          <div className="text-center">Loading messages...</div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.user_id === user.id ? "justify-end" : ""}`}>
              {message.user_id !== user.id && (
                <Avatar>
                  <AvatarImage src={message.author?.avatar_url} />
                  <AvatarFallback>{message.author?.username?.[0].toUpperCase()}</AvatarFallback>
                </Avatar>
              )}
              <div className={`p-3 rounded-lg max-w-xs lg:max-w-md ${message.user_id === user.id ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
                {message.attachment && (
                    <a href={supabase.storage.from('chat-attachments').getPublicUrl(message.attachment.file_path).data.publicUrl} target="_blank" rel="noreferrer" className="underline">
                        {message.attachment.file_name}
                    </a>
                )}
                <p className="text-sm">{message.content}</p>
                <div className="flex items-center justify-end mt-1">
                    <p className="text-xs text-muted-foreground mr-1">{new Date(message.created_at).toLocaleTimeString()}</p>
                    {message.user_id === user.id && (
                        message.read_at ? <CheckCheck size={16} className="text-blue-500" /> : <Check size={16} />
                    )}
                </div>
              </div>
            </div>
          ))
        )}
         {typingUser && (
          <div className="p-2 text-sm text-muted-foreground">
            {typingUser} is typing...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Button size="icon" variant="ghost" onClick={() => fileInputRef.current.click()}>
                <Paperclip />
            </Button>
            <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" />
          <Input
            placeholder="Type a message..."
            value={newMessage}
            onChange={handleTyping}
            className="flex-grow"
          />
          <Button type="submit" size="icon">
            <Send />
          </Button>
        </form>
        {attachment && (
            <div className="text-sm text-muted-foreground mt-2">Attachment: {attachment.name}</div>
        )}
      </div>
    </div>
  );
}
