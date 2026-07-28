import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM } from "../context/CRMContext";
import {
  Bell,
  Check,
  Trash2,
  LogIn,
  LogOut,
  DollarSign,
  Clock,
  AlertTriangle,
  UserPlus,
  Dumbbell,
  Apple,
  CalendarCheck,
  RefreshCw,
  Eye,
  CheckCheck
} from "lucide-react";
import { toast } from "sonner";

const Notifications = () => {
  const { notifications: contextNotifications, markNotificationAsRead, clearAllNotifications } = useCRM();
  const navigate = useNavigate();

  // Local persistent state for operational activity updates merged with context alerts
  const [operationalNotifs, setOperationalNotifs] = useState(() => {
    const saved = localStorage.getItem("gym_operational_notifications");
    if (saved) return JSON.parse(saved);
    
    // Seed initial operational notifications
    return [
      {
        id: "op_notif_1",
        type: "checkin",
        title: "Member Checked In",
        memberName: "Rahul Sharma",
        message: "Rahul Sharma checked in at 08:15 AM for Weight Loss Morning Batch.",
        time: "2 min ago",
        read: false,
        clientId: "client_1"
      },
      {
        id: "op_notif_2",
        type: "checkout",
        title: "Member Checked Out",
        memberName: "Priya Patel",
        message: "Priya Patel completed workout and checked out at 07:30 PM.",
        time: "15 min ago",
        read: false,
        clientId: "client_2"
      },
      {
        id: "op_notif_3",
        type: "payment",
        title: "Payment Received",
        memberName: "Arjun Mehta",
        message: "Fee collection of ₹4,500 successfully recorded via UPI payment transfer.",
        time: "45 min ago",
        read: false,
        clientId: "client_3"
      },
      {
        id: "op_notif_4",
        type: "payment_due",
        title: "Payment Due Today",
        memberName: "Sneha Reddy",
        message: "Monthly membership fees payment of ₹3,500 is due today.",
        time: "Today, 10:30 AM",
        read: false,
        clientId: "client_4"
      },
      {
        id: "op_notif_5",
        type: "expiry",
        title: "Membership Expiring Soon",
        memberName: "Rohan Gupta",
        message: "Rohan Gupta's VIP Personal Training membership expires in 5 days.",
        time: "Today, 08:15 AM",
        read: false,
        clientId: "client_5"
      },
      {
        id: "op_notif_6",
        type: "registration",
        title: "New Member Registered",
        memberName: "Neha Verma",
        message: "Neha Verma successfully onboarded under Standard Monthly membership plan.",
        time: "Yesterday, 04:15 PM",
        read: true,
        clientId: "client_6"
      },
      {
        id: "op_notif_7",
        type: "workout",
        title: "Workout Plan Assigned",
        memberName: "Rahul Sharma",
        message: "Coach Marcus assigned Leg Hypertrophy & Active Recovery weekly split.",
        time: "Yesterday, 11:30 AM",
        read: true,
        clientId: "client_1"
      },
      {
        id: "op_notif_8",
        type: "diet",
        title: "Diet Plan Assigned",
        memberName: "Priya Patel",
        message: "Priya Patel was assigned a custom 1800 kcal clean calorie-deficit diet chart.",
        time: "2 days ago",
        read: true,
        clientId: "client_2"
      },
      {
        id: "op_notif_9",
        type: "attendance",
        title: "Attendance Marked",
        memberName: "Arjun Mehta",
        message: "Logged late check-in entry at 08:10 AM (10 min delayed).",
        time: "3 days ago",
        read: true,
        clientId: "client_3"
      },
      {
        id: "op_notif_10",
        type: "renewal",
        title: "Membership Renewed",
        memberName: "Rahul Sharma",
        message: "Renewed Premium Elite membership for an additional 6 months.",
        time: "4 days ago",
        read: true,
        clientId: "client_1"
      }
    ];
  });

  // Sync operational notifications to localStorage
  useEffect(() => {
    localStorage.setItem("gym_operational_notifications", JSON.stringify(operationalNotifs));
  }, [operationalNotifs]);

  // Combine system alerts from CRM Context into the operational feed
  const combinedNotifications = useMemo(() => {
    const formattedContext = contextNotifications.map((c) => {
      // Map context types to icons/styling classes
      let type = "attendance";
      if (c.type === "payment") type = "payment_due";
      if (c.type === "expiry") type = "expiry";
      if (c.type === "registration") type = "registration";
      if (c.type === "birthday") type = "registration"; // fallback

      // Extract member name from title/message
      let memberName = "Member";
      if (c.message) {
        const parts = c.message.split(" ");
        memberName = `${parts[0] || ""} ${parts[1] || ""}`.replace("'s", "").trim();
      }

      return {
        id: c.id,
        type,
        title: c.title,
        memberName,
        message: c.message,
        time: c.date === new Date().toISOString().split("T")[0] ? "Today" : c.date,
        read: c.read,
        clientId: c.clientId
      };
    });

    // Remove duplicates if the IDs overlap, then sort unread first, then relative time
    const merged = [...formattedContext, ...operationalNotifs];
    const unique = merged.reduce((acc, curr) => {
      if (!acc.find((item) => item.id === curr.id)) acc.push(curr);
      return acc;
    }, []);

    return unique;
  }, [contextNotifications, operationalNotifs]);

  // Handle Mark as Read
  const handleMarkRead = (id) => {
    // If it is from the context, trigger CRM Context action
    if (contextNotifications.find((n) => n.id === id)) {
      markNotificationAsRead(id);
    } else {
      // Update local operational state
      setOperationalNotifs((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
    }
    toast.success("Notification marked as read");
  };

  // Handle Mark All as Read
  const handleMarkAllRead = () => {
    // Mark CRM context notifications as read
    contextNotifications.forEach((n) => {
      if (!n.read) markNotificationAsRead(n.id);
    });

    // Mark local notifications as read
    setOperationalNotifs((prev) =>
      prev.map((n) => ({ ...n, read: true }))
    );
    toast.success("All notifications marked as read");
  };

  // Handle Clear All
  const handleClearAll = () => {
    clearAllNotifications();
    setOperationalNotifs([]);
    toast.error("Cleared all system and activity notifications");
  };

  // Helper: Return CSS styling color maps for each notification type
  const getNotificationColors = (type) => {
    switch (type) {
      case "checkin":
        return {
          iconBg: "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-emerald-500"
        };
      case "checkout":
        return {
          iconBg: "bg-amber-500/10 text-amber-500 border border-amber-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-amber-500"
        };
      case "payment":
        return {
          iconBg: "bg-teal-500/10 text-teal-500 border border-teal-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-teal-500"
        };
      case "payment_due":
        return {
          iconBg: "bg-rose-500/10 text-rose-500 border border-rose-500/20",
          border: "border-rose-100 dark:border-rose-950",
          indicator: "bg-rose-500"
        };
      case "expiry":
        return {
          iconBg: "bg-orange-500/10 text-orange-500 border border-orange-500/20",
          border: "border-amber-100 dark:border-amber-950",
          indicator: "bg-orange-500"
        };
      case "registration":
        return {
          iconBg: "bg-blue-500/10 text-blue-500 border border-blue-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-blue-500"
        };
      case "workout":
        return {
          iconBg: "bg-purple-500/10 text-purple-500 border border-purple-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-purple-500"
        };
      case "diet":
        return {
          iconBg: "bg-pink-500/10 text-pink-500 border border-pink-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-pink-500"
        };
      case "attendance":
        return {
          iconBg: "bg-indigo-500/10 text-indigo-500 border border-indigo-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-indigo-500"
        };
      case "renewal":
        return {
          iconBg: "bg-cyan-500/10 text-cyan-500 border border-cyan-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-cyan-500"
        };
      default:
        return {
          iconBg: "bg-slate-500/10 text-slate-500 border border-slate-500/20",
          border: "border-slate-100 dark:border-zinc-850",
          indicator: "bg-slate-400"
        };
    }
  };

  // Helper: Return Icon component for type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "checkin": return LogIn;
      case "checkout": return LogOut;
      case "payment": return DollarSign;
      case "payment_due": return Clock;
      case "expiry": return AlertTriangle;
      case "registration": return UserPlus;
      case "workout": return Dumbbell;
      case "diet": return Apple;
      case "attendance": return CalendarCheck;
      case "renewal": return RefreshCw;
      default: return Bell;
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Notification Center
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Monitor check-ins, record collections, review renewals, and track profile updates.
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          {combinedNotifications.some(n => !n.read) && (
            <button
              onClick={handleMarkAllRead}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition shadow-sm cursor-pointer"
            >
              <CheckCheck className="w-4 h-4 text-emerald-500" />
              <span>Mark All Read</span>
            </button>
          )}
          {combinedNotifications.length > 0 && (
            <button
              onClick={handleClearAll}
              className="flex items-center gap-1.5 px-4 py-2 bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 hover:bg-rose-50 hover:border-rose-100 text-rose-600 rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-rose-500" />
              <span>Clear Feed</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications List Wrapper */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm space-y-3 max-h-[680px] overflow-y-auto pr-1">
        {combinedNotifications.length > 0 ? (
          combinedNotifications.map((notif) => {
            const isRead = notif.read;
            const style = getNotificationColors(notif.type);
            const Icon = getNotificationIcon(notif.type);

            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition-all duration-200 flex gap-4 text-left items-start hover:shadow-sm ${style.border} ${
                  isRead
                    ? "bg-slate-50/10 dark:bg-zinc-950/5 opacity-70"
                    : "bg-blue-50/5 dark:bg-blue-900/5 ring-1 ring-blue-500/5"
                }`}
              >
                {/* Custom Left indicator strip */}
                <div className={`w-1 h-10 rounded-full shrink-0 ${isRead ? "bg-slate-200 dark:bg-zinc-800" : style.indicator}`} />

                {/* Event Type Icon */}
                <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${style.iconBg}`}>
                  <Icon className="w-4.5 h-4.5" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className={`text-xs font-black leading-snug truncate ${
                      isRead ? "text-slate-500 dark:text-zinc-400" : "text-slate-805 dark:text-zinc-150"
                    }`}>
                      {notif.title}
                    </h3>
                    <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold shrink-0">{notif.time}</span>
                  </div>
                  <p className="text-[10px] text-slate-450 dark:text-zinc-400 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  
                  {/* Action Link to Member Profile details */}
                  {notif.clientId && (
                    <button
                      onClick={() => navigate(`/clients/${notif.clientId}`)}
                      className="text-[9px] text-blue-600 dark:text-blue-400 font-bold hover:underline mt-2 flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>View Profile</span>
                      <Eye className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Mark as read action */}
                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1.5 border border-blue-200 dark:border-zinc-800 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 rounded-lg transition shrink-0 cursor-pointer shadow-sm"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-20 text-slate-405 flex flex-col items-center gap-3">
            <div className="w-14 h-14 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-2xl flex items-center justify-center text-slate-400">
              <Bell className="w-6 h-6 text-slate-350" />
            </div>
            <div className="space-y-1">
              <span className="text-xs font-bold block text-slate-600 dark:text-zinc-400">No operational alerts logged</span>
              <p className="text-[10px] text-slate-400">All check-ins, payments, and renewals are cleared.</p>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};

export default Notifications;
