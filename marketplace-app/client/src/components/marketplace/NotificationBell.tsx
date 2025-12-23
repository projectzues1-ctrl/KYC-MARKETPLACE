import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Bell } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { fetchWithAuth } from "@/lib/auth";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationBell() {
  const [, setLocation] = useLocation();
  const [open, setOpen] = useState(false);

  const { data: unreadCount } = useQuery<{ count: number }>({
    queryKey: ["unreadNotifications"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/notifications/unread-count");
      return res.json();
    },
    refetchInterval: 30000,
  });

  const { data: notifications } = useQuery<Notification[]>({
    queryKey: ["recentNotifications"],
    queryFn: async () => {
      const res = await fetchWithAuth("/api/notifications?limit=5");
      return res.json();
    },
    enabled: open,
  });

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      order: "📦",
      payment: "💰",
      dispute: "⚠️",
      chat: "💬",
      kyc: "🔐",
      system: "ℹ️",
    };
    return icons[type] || "📌";
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="relative text-gray-400 hover:text-white"
          data-testid="notification-bell"
        >
          <Bell className="h-5 w-5" />
          {unreadCount && unreadCount.count > 0 && (
            <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs text-white flex items-center justify-center">
              {unreadCount.count > 9 ? "9+" : unreadCount.count}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="w-80 p-0 bg-gray-900 border-gray-800"
        align="end"
      >
        <div className="p-3 border-b border-gray-800 flex items-center justify-between">
          <h3 className="font-medium text-white">Notifications</h3>
          {unreadCount && unreadCount.count > 0 && (
            <span className="text-xs text-purple-400">
              {unreadCount.count} unread
            </span>
          )}
        </div>
        <ScrollArea className="h-[300px]">
          {notifications && notifications.length > 0 ? (
            <div className="divide-y divide-gray-800">
              {notifications.map((notif) => (
                <div
                  key={notif.id}
                  className={`p-3 hover:bg-gray-800/50 cursor-pointer ${
                    !notif.isRead ? "bg-purple-900/10" : ""
                  }`}
                  data-testid={`notification-${notif.id}`}
                >
                  <div className="flex gap-3">
                    <span className="text-xl">{getTypeIcon(notif.type)}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-white truncate">
                        {notif.title}
                      </p>
                      <p className="text-xs text-gray-400 line-clamp-2">
                        {notif.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatTime(notif.createdAt)}
                      </p>
                    </div>
                    {!notif.isRead && (
                      <div className="w-2 h-2 rounded-full bg-purple-500 mt-1" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-gray-500">
              <Bell className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p>No notifications</p>
            </div>
          )}
        </ScrollArea>
        <div className="p-2 border-t border-gray-800">
          <Button
            variant="ghost"
            className="w-full text-purple-400 hover:text-purple-300"
            onClick={() => {
              setOpen(false);
              setLocation("/notifications");
            }}
            data-testid="button-view-all-notifications"
          >
            View all notifications
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
