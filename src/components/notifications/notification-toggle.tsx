import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Bell, BellOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { requestNotificationPermission, checkAndNotifyUpcomingClasses } from "@/lib/notifications";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

export const NotificationToggle = () => {
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (!("Notification" in window)) {
      setIsSupported(false);
      return;
    }

    setNotificationsEnabled(Notification.permission === "granted");

    if (Notification.permission === "granted") {
      checkAndNotifyUpcomingClasses();
    }
  }, []);

  const handleToggleNotifications = async () => {
    if (!isSupported) {
      toast({
        title: "Not Supported",
        description: "Your browser doesn't support notifications",
        variant: "destructive",
      });
      return;
    }

    if (Notification.permission === "denied") {
      toast({
        title: "Permission Denied",
        description: "Please enable notifications in your browser settings",
        variant: "destructive",
      });
      return;
    }

    const granted = await requestNotificationPermission();
    
    if (granted) {
      setNotificationsEnabled(true);
      checkAndNotifyUpcomingClasses();
      toast({
        title: "Notifications Enabled",
        description: "You'll receive alerts 15 minutes before your classes",
      });

      // Show a test notification
      new Notification("HallPass HQ 🎓", {
        body: "Notifications are now enabled! You'll be reminded before your classes.",
        icon: '/icon-192.png',
      });
    } else {
      setNotificationsEnabled(false);
      toast({
        title: "Permission Required",
        description: "Please allow notifications to receive class reminders",
        variant: "destructive",
      });
    }
  };

  if (!isSupported) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {notificationsEnabled ? <Bell className="h-5 w-5" /> : <BellOff className="h-5 w-5" />}
          Class Notifications
        </CardTitle>
        <CardDescription>
          Get notified 15 minutes before your classes start
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <Label htmlFor="notifications" className="flex flex-col gap-1">
            <span className="font-medium">Enable Notifications</span>
            <span className="text-sm text-muted-foreground">
              {notificationsEnabled ? "Notifications are active" : "Turn on to receive alerts"}
            </span>
          </Label>
          <Switch
            id="notifications"
            checked={notificationsEnabled}
            onCheckedChange={handleToggleNotifications}
          />
        </div>

        {Notification.permission === "denied" && (
          <div className="text-sm text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 p-3 rounded-md">
            Notifications are blocked. Please enable them in your browser settings.
          </div>
        )}

        {notificationsEnabled && (
          <div className="text-sm text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-950 p-3 rounded-md">
            ✓ You'll receive notifications before your classes
          </div>
        )}
      </CardContent>
    </Card>
  );
};
