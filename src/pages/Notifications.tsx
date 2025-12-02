
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNotifications, Notification } from "@/hooks/use-notifications";
import { Bell, Check, CheckCheck, Loader2 } from "lucide-react";
import { formatDistanceToNow } from 'date-fns';
import { cn } from "@/lib/utils";

export default function Notifications() {
    const { notifications, loading, unreadCount, markAsRead, markAllAsRead } = useNotifications();

    return (
        <AppLayout>
            <div className="flex-1 space-y-6 p-8 pt-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <div>
                            <CardTitle>Notifications</CardTitle>
                            <CardDescription>You have {unreadCount} unread messages.</CardDescription>
                        </div>
                        <Button size="sm" onClick={markAllAsRead} disabled={unreadCount === 0}>
                            <CheckCheck className="mr-2 h-4 w-4" />
                            Mark all as read
                        </Button>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center items-center h-64">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="text-center py-12">
                                <Bell className="mx-auto h-12 w-12 text-gray-400" />
                                <h3 className="mt-2 text-sm font-medium text-gray-900">No notifications</h3>
                                <p className="mt-1 text-sm text-gray-500">You're all caught up!</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {notifications.map((n) => (
                                    <NotificationItem key={n.id} notification={n} onMarkAsRead={() => markAsRead(n.id)} />
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}

interface NotificationItemProps {
    notification: Notification;
    onMarkAsRead: () => void;
}

function NotificationItem({ notification, onMarkAsRead }: NotificationItemProps) {
    const { notifications: details, is_read, created_at } = notification;
    
    const timeAgo = formatDistanceToNow(new Date(created_at), { addSuffix: true });

    return (
        <div className={cn(
            "flex items-start gap-4 p-4 rounded-lg border",
            is_read ? "bg-transparent" : "bg-blue-50 dark:bg-blue-900/20"
        )}>
            <div className="flex-shrink-0">
                <Bell className="h-6 w-6 text-blue-500" />
            </div>
            <div className="flex-1">
                <p className="font-semibold">{details.title}</p>
                <p className="text-sm text-muted-foreground">{details.message}</p>
                {details.unit_code && 
                    <p className="text-xs text-muted-foreground mt-1 font-mono">Unit: {details.unit_code}</p>
                }
                <p className="text-xs text-muted-foreground mt-2">{timeAgo}</p>
            </div>
            {!is_read && (
                 <Button variant="ghost" size="sm" onClick={onMarkAsRead}>
                    <Check className="h-5 w-5" />
                    <span className="sr-only">Mark as read</span>
                </Button>
            )}
        </div>
    );
}
