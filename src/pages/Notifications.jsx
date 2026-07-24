import React, { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM } from "../context/CRMContext";
import {
  Bell,
  Check,
  Trash2,
  Calendar,
  AlertTriangle,
  UserPlus,
  Cake,
  MailWarning
} from "lucide-react";
import { toast } from "sonner";

const Notifications = () => {
  const { notifications, markNotificationAsRead, clearAllNotifications } = useCRM();
  const navigate = useNavigate();

  const handleMarkRead = (id) => {
    markNotificationAsRead(id);
    toast.success("Notification marked as read.");
  };

  const handleClearAll = () => {
    clearAllNotifications();
    toast.error("Cleared all system notifications.");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Top action header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Notification Panel
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Monitor client renewals, payment warnings, birthday milestones, and logs.
          </p>
        </div>
        {notifications.length > 0 && (
          <button
            onClick={handleClearAll}
            className="flex items-center gap-1 px-3 py-1.5 border border-slate-200 dark:border-zinc-805 hover:bg-red-50 hover:border-red-100 text-red-650 rounded-lg text-xs font-semibold cursor-pointer transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Logs</span>
          </button>
        )}
      </div>

      {/* Notifications list */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3">
        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const isRead = notif.read;
            return (
              <div
                key={notif.id}
                className={`p-4 rounded-2xl border transition flex gap-4 text-left items-start ${
                  isRead
                    ? "border-slate-100 dark:border-zinc-850/50 bg-slate-50/20 dark:bg-zinc-900/10 opacity-70"
                    : "border-blue-100 dark:border-blue-900/10 bg-blue-50/5 dark:bg-blue-500/5 shadow-sm"
                }`}
              >
                {/* Custom Icon */}
                <div className={`p-2 rounded-xl shrink-0 mt-0.5 ${
                  notif.type === "registration" ? "bg-blue-500/10 text-blue-500" :
                  notif.type === "attendance" ? "bg-emerald-500/10 text-emerald-500" :
                  notif.type === "payment" ? "bg-rose-500/10 text-rose-500" :
                  notif.type === "birthday" ? "bg-purple-500/10 text-purple-500" :
                  "bg-amber-500/10 text-amber-500"
                }`}>
                  {notif.type === "registration" ? <UserPlus className="w-4 h-4" /> :
                   notif.type === "attendance" ? <Calendar className="w-4 h-4" /> :
                   notif.type === "payment" ? <MailWarning className="w-4 h-4" /> :
                   notif.type === "birthday" ? <Cake className="w-4 h-4" /> :
                   <AlertTriangle className="w-4 h-4" />}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-baseline gap-2">
                    <h3 className={`text-xs font-bold truncate ${
                      isRead ? "text-slate-500" : "text-slate-800 dark:text-zinc-200"
                    }`}>
                      {notif.title}
                    </h3>
                    <span className="text-[9px] text-slate-400 font-semibold shrink-0">{notif.date}</span>
                  </div>
                  <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">
                    {notif.message}
                  </p>
                  
                  {/* Action row */}
                  {notif.clientId && (
                    <button
                      onClick={() => navigate(`/clients/${notif.clientId}`)}
                      className="text-[9px] text-blue-600 font-bold hover:underline mt-2 inline-block cursor-pointer"
                    >
                      View Profile Details
                    </button>
                  )}
                </div>

                {/* Mark as read checkbox option */}
                {!isRead && (
                  <button
                    onClick={() => handleMarkRead(notif.id)}
                    className="p-1 border border-blue-200 text-blue-650 hover:bg-blue-600 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                    title="Mark as Read"
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })
        ) : (
          <div className="text-center py-12 text-xs text-slate-400 flex flex-col items-center gap-2">
            <Bell className="w-8 h-8 text-slate-350" />
            <span>No system alerts logged.</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default Notifications;
