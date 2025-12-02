
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/components/auth/auth-provider";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Textarea } from "@/components/ui/textarea";

interface FormData {
  fullName: string;
  studentId: string;
  email: string;
  yearOfStudy: string;
  contactNumber: string;
  reasonForApplying: string;
}

const ClassRepresentativeRegistration = () => {
  const [formData, setFormData] = useState<FormData>({
    fullName: "",
    studentId: "",
    email: "",
    yearOfStudy: "",
    contactNumber: "",
    reasonForApplying: "",
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
        setFormData(prev => ({...prev, email: user.email || ''}));
    }
  }, [user]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id: keyof FormData, value: string) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
        toast.error("You must be logged in to apply.");
        return;
    }

    setLoading(true);
    try {
        const { error } = await supabase.from('class_rep_applications').insert({
            user_id: user.id,
            full_name: formData.fullName,
            student_id: formData.studentId,
            email: formData.email,
            year_of_study: formData.yearOfStudy,
            contact_number: formData.contactNumber,
            reason_for_applying: formData.reasonForApplying,
            status: 'pending' // Default status
        });

        if (error) throw error;

        toast.success("Registration successful!", {
            description: `Thank you for applying, ${formData.fullName}. We will be in touch.`,
        });
        navigate("/dashboard");

    } catch (error: any) {
        toast.error("Registration failed.", {
            description: error.message || "An unexpected error occurred."
        });
        console.error("Error submitting class representative application:", error);
    } finally {
        setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen text-center">
        <h1 className="text-3xl font-bold mb-4">Access Denied</h1>
        <p className="mb-8">You must be logged in to access this page.</p>
        <Button onClick={() => navigate("/login")}>Go to Login</Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-center text-primary">
            Class Representative Registration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  placeholder="John Doe"
                  required
                  value={formData.fullName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="studentId">Student ID</Label>
                <Input
                  id="studentId"
                  placeholder="S123456"
                  required
                  value={formData.studentId}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="john.doe@university.com"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="contactNumber">Contact Number</Label>
                <Input
                  id="contactNumber"
                  placeholder="+1234567890"
                  required
                  value={formData.contactNumber}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="yearOfStudy">Year of Study</Label>
                <Select
                  onValueChange={(value) => handleSelectChange("yearOfStudy", value)}
                  defaultValue={formData.yearOfStudy}
                >
                  <SelectTrigger id="yearOfStudy">
                    <SelectValue placeholder="Select your year" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">First Year</SelectItem>
                    <SelectItem value="2">Second Year</SelectItem>
                    <SelectItem value="3">Third Year</SelectItem>
                    <SelectItem value="4">Fourth Year</SelectItem>
                    <SelectItem value="5">Postgraduate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="reasonForApplying">Why do you want to be a class representative?</Label>
              <Textarea
                id="reasonForApplying"
                placeholder="Briefly explain your motivation"
                required
                value={formData.reasonForApplying}
                onChange={handleChange}
                className="min-h-[100px]"
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Submitting..." : "Register"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default ClassRepresentativeRegistration;
