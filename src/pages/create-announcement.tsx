
import { AppLayout } from "@/components/layout/app-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreateAnnouncement() {
    const { user, profile } = useAuth();
    const { toast } = useToast();
    const navigate = useNavigate();
    const [title, setTitle] = useState("");
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCreateAnnouncement = async () => {
        if (!user || !profile || !title || !content) {
            toast({
                title: "Incomplete form",
                description: "Please fill out all fields.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.from("announcements").insert([
                {
                    title,
                    content,
                    author_id: user.id,
                    university_id: profile.university,
                    // course_id can be added here if needed
                },
            ]);

            if (error) throw error;

            toast({
                title: "Announcement Created",
                description: "Your announcement has been posted.",
            });

            navigate("/announcements");

        } catch (error: any) {
            toast({
                title: "Error creating announcement",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Create Announcement</CardTitle>
                        <CardDescription>Compose and post an announcement for your students.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <Input 
                            placeholder="Title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                        />
                        <Textarea 
                            placeholder="Content"
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            rows={10}
                        />
                        <Button onClick={handleCreateAnnouncement} disabled={loading}>
                            {loading ? "Posting..." : "Post Announcement"}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
