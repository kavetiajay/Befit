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
import { EmptyState, SkeletonLoader } from "../components/FeedbackStates";

const Notifications = () => {
  const { 
    notifications: contextNotifications, 
    markNotificationAsRead, 
    clearAllNotifications,
    fetchNotifications,
    loading 
  } = useCRM();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Combine system alerts from CRM Context into the operational feed
  const combinedNotifications = useMemo(() => {
    return contextNotifications.map((c) => {
      let styleType = c.type;
      if (c.type === "payment") styleType = "payment_due";
      
      return {
        id: c.id,
        type: styleType,
        title: c.title,
        message: c.message,
        time: c.time,
        read: c.read,
        clientId: c.clientId
      };
    });
  }, [contextNotifications]);

  // Handle Mark as Read
  const handleMarkRead = async (id) => {
    const toastId = toast.loading("Marking notification as read...");
    try {
      await markNotificationAsRead(id);
      toast.success("Notification marked as read", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status", { id: toastId });
    }
  };

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    const toastId = toast.loading("Marking all notifications as read...");
    try {
      await clearAllNotifications();
      toast.success("All notifications marked as read", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notifications", { id: toastId });
    }
  };

  // Handle Clear All
  const handleClearAll = async () => {
    await handleMarkAllRead();
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
      {loading ? (
        <SkeletonLoader type="table" count={4} />
      ) : (
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
            <EmptyState
              title="All Caught Up!"
              description="All check-ins, payments, and member renewals are cleared. No new system notifications."
              icon={Bell}
            />
          )}
        </div>
      )}

    </div>
  );
};

export default Notifications;
