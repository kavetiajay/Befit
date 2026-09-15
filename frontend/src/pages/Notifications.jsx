import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCRM } from "../context/CRMContext";
import {
  Bell,
  Check,
  RotateCcw,
  CreditCard,
  Clock,
  Dumbbell,
  Apple,
  CalendarCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCheck,
  SlidersHorizontal,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState, SkeletonLoader } from "../components/FeedbackStates";

const FILTER_TABS = [
  { id: "all", label: "All", type: null },
  { id: "unread", label: "Unread", type: "unread" },
  { id: "payment", label: "Payments", type: "payment" },
  { id: "workout", label: "Workout", type: "workout" },
  { id: "diet", label: "Diet", type: "diet" },
  { id: "attendance", label: "Attendance", type: "attendance" },
  { id: "general", label: "General", type: "general" },
];

const Notifications = () => {
  const { 
    notifications: contextNotifications, 
    markNotificationAsRead, 
    toggleNotificationRead,
    clearAllNotifications,
    fetchNotifications,
    clients,
    loading,
    error: contextError
  } = useCRM();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchNotifications();
      toast.success("Notifications refreshed.");
    } catch {
      toast.error("Failed to refresh notifications.");
    } finally {
      setIsRefreshing(false);
    }
  };

  // Map and attach client context where available
  const mappedNotifications = useMemo(() => {
    return contextNotifications.map((notif) => {
      // Look up client name if clientId exists
      let matchedClient = null;
      if (notif.clientId && clients?.length) {
        matchedClient = clients.find((c) => c.id === notif.clientId);
      }

      return {
        ...notif,
        clientName: matchedClient?.name || null,
        clientPhoto: matchedClient?.photo || null,
      };
    });
  }, [contextNotifications, clients]);

  // Tab counts
  const tabCounts = useMemo(() => {
    const counts = {
      all: mappedNotifications.length,
      unread: mappedNotifications.filter((n) => !n.read).length,
      payment: mappedNotifications.filter((n) => n.type === "payment").length,
      workout: mappedNotifications.filter((n) => n.type === "workout").length,
      diet: mappedNotifications.filter((n) => n.type === "diet").length,
      attendance: mappedNotifications.filter((n) => n.type === "attendance").length,
      general: mappedNotifications.filter((n) => n.type === "general").length,
    };
    return counts;
  }, [mappedNotifications]);

  // Filtered notifications based on active tab and search query
  const filteredNotifications = useMemo(() => {
    return mappedNotifications.filter((notif) => {
      // 1. Tab filter
      if (activeTab === "unread" && notif.read) return false;
      if (activeTab !== "all" && activeTab !== "unread" && notif.type !== activeTab) return false;

      // 2. Search query filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const titleMatch = notif.title?.toLowerCase().includes(query);
        const msgMatch = notif.message?.toLowerCase().includes(query);
        const clientMatch = notif.clientName?.toLowerCase().includes(query);
        return titleMatch || msgMatch || clientMatch;
      }

      return true;
    });
  }, [mappedNotifications, activeTab, searchQuery]);

  // Handle Mark as Read / Unread toggle
  const handleToggleRead = async (id, currentStatus) => {
    setActionLoadingId(id);
    try {
      if (toggleNotificationRead) {
        await toggleNotificationRead(id);
      } else {
        await markNotificationAsRead(id, !currentStatus);
      }
      toast.success(currentStatus ? "Marked as unread" : "Marked as read");
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notification status.");
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Mark All as Read
  const handleMarkAllRead = async () => {
    const toastId = toast.loading("Marking all notifications as read...");
    try {
      await clearAllNotifications();
      toast.success("All notifications marked as read.", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("Failed to update notifications.", { id: toastId });
    }
  };

  // Helper: Return CSS styling color maps for each notification type
  const getNotificationColors = (type, isRead) => {
    switch (type) {
      case "payment":
        return {
          iconBg: isRead
            ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20",
          border: isRead ? "border-slate-200/80 dark:border-zinc-800" : "border-emerald-500/30 dark:border-emerald-500/20",
          indicator: "bg-emerald-500",
          badgeBg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
          badgeLabel: "Payment",
        };
      case "workout":
        return {
          iconBg: isRead
            ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            : "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20",
          border: isRead ? "border-slate-200/80 dark:border-zinc-800" : "border-blue-500/30 dark:border-blue-500/20",
          indicator: "bg-blue-500",
          badgeBg: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
          badgeLabel: "Workout",
        };
      case "diet":
        return {
          iconBg: isRead
            ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            : "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20",
          border: isRead ? "border-slate-200/80 dark:border-zinc-800" : "border-amber-500/30 dark:border-amber-500/20",
          indicator: "bg-amber-500",
          badgeBg: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
          badgeLabel: "Diet",
        };
      case "attendance":
        return {
          iconBg: isRead
            ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            : "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20",
          border: isRead ? "border-slate-200/80 dark:border-zinc-800" : "border-indigo-500/30 dark:border-indigo-500/20",
          indicator: "bg-indigo-500",
          badgeBg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400",
          badgeLabel: "Attendance",
        };
      case "general":
      default:
        return {
          iconBg: isRead
            ? "bg-slate-100 text-slate-500 dark:bg-zinc-800 dark:text-zinc-400"
            : "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20",
          border: isRead ? "border-slate-200/80 dark:border-zinc-800" : "border-purple-500/30 dark:border-purple-500/20",
          indicator: "bg-purple-500",
          badgeBg: "bg-purple-500/10 text-purple-600 dark:text-purple-400",
          badgeLabel: "General",
        };
    }
  };

  // Helper: Return Icon component for type
  const getNotificationIcon = (type) => {
    switch (type) {
      case "payment": return CreditCard;
      case "workout": return Dumbbell;
      case "diet": return Apple;
      case "attendance": return CalendarCheck;
      default: return Bell;
    }
  };

  const hasUnread = mappedNotifications.some((n) => !n.read);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-12 animate-in fade-in duration-300">
      
      {/* Header Viewport */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-50">
              Notification Center
            </h1>
            {tabCounts.unread > 0 && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-500 text-white shadow-sm shadow-rose-500/20">
                {tabCounts.unread} unread
              </span>
            )}
          </div>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Real-time feed for client check-ins, payment logs, routine assignments, and nutrition updates.
          </p>
        </div>

        {/* Global Quick Action Buttons */}
        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
          <button
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-800 rounded-xl text-xs font-bold text-slate-700 dark:text-zinc-300 transition shadow-sm cursor-pointer disabled:opacity-50"
            title="Refresh feed"
            aria-label="Refresh feed"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? "animate-spin text-blue-500" : "text-slate-400"}`} />
            <span>Refresh</span>
          </button>

          {hasUnread && (
            <button
              onClick={handleMarkAllRead}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm shadow-blue-500/20 cursor-pointer"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Mark All Read</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar Section */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-3.5 shadow-sm space-y-3">
        {/* Category Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
          <SlidersHorizontal className="w-4 h-4 text-slate-400 shrink-0 ml-1 mr-0.5 hidden sm:block" />
          {FILTER_TABS.map((tab) => {
            const count = tabCounts[tab.id] || 0;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                  isActive
                    ? "bg-slate-900 text-white dark:bg-zinc-100 dark:text-zinc-900 shadow-sm"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
                }`}
              >
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                    isActive
                      ? "bg-white/20 text-white dark:bg-zinc-900/20 dark:text-zinc-900"
                      : "bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Keyword Search Input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            placeholder="Search by title, message, or client name..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 dark:bg-zinc-950/60 border border-slate-200/80 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>
      </div>

      {/* Error state fallback */}
      {contextError && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>Unable to sync latest notifications. {contextError}</span>
          </div>
          <button
            onClick={handleRefresh}
            className="px-3 py-1 bg-rose-600 text-white font-bold rounded-lg hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Notifications Feed Wrapper */}
      {loading && mappedNotifications.length === 0 ? (
        <SkeletonLoader type="table" count={4} />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 shadow-sm space-y-3">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map((notif) => {
              const isRead = notif.read;
              const style = getNotificationColors(notif.type, isRead);
              const Icon = getNotificationIcon(notif.type);
              const isBusy = actionLoadingId === notif.id;

              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all duration-200 flex gap-3.5 sm:gap-4 text-left items-start hover:shadow-sm ${style.border} ${
                    isRead
                      ? "bg-slate-50/40 dark:bg-zinc-950/30 opacity-75"
                      : "bg-white dark:bg-zinc-900 ring-1 ring-blue-500/10 shadow-sm"
                  }`}
                >
                  {/* Left Active Indicator Bar */}
                  <div className={`w-1 h-10 rounded-full shrink-0 ${isRead ? "bg-slate-200 dark:bg-zinc-800" : style.indicator}`} />

                  {/* Notification Type Icon */}
                  <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${style.iconBg}`}>
                    <Icon className="w-4 h-4" />
                  </div>

                  {/* Content Body */}
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 sm:gap-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className={`text-xs font-black leading-snug ${
                          isRead ? "text-slate-600 dark:text-zinc-300" : "text-slate-900 dark:text-zinc-50"
                        }`}>
                          {notif.title}
                        </h3>
                        <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider ${style.badgeBg}`}>
                          {style.badgeLabel}
                        </span>
                        {!isRead && (
                          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400 dark:text-zinc-500 font-bold shrink-0">
                        <Clock className="w-3 h-3 text-slate-400 dark:text-zinc-500 shrink-0" />
                        <span>{notif.date} • {notif.time}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-zinc-300 mt-1.5 leading-relaxed">
                      {notif.message}
                    </p>

                    {/* Client Context Tag & Profile Quick Link */}
                    {notif.clientId && (
                      <div className="mt-2.5 flex items-center gap-2 flex-wrap pt-2 border-t border-slate-100 dark:border-zinc-800/60">
                        <span className="text-[10px] font-bold text-slate-400 dark:text-zinc-500">
                          Client:
                        </span>
                        {notif.clientName ? (
                          <button
                            onClick={() => navigate(`/clients/${notif.clientId}`)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold transition cursor-pointer"
                          >
                            <span>{notif.clientName}</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        ) : (
                          <button
                            onClick={() => navigate(`/clients/${notif.clientId}`)}
                            className="inline-flex items-center gap-1 text-[10px] text-blue-600 dark:text-blue-400 font-bold hover:underline cursor-pointer"
                          >
                            <span>View Client Profile</span>
                            <Eye className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Read / Unread Status Toggle Button */}
                  <div className="shrink-0 flex items-center gap-1 self-start mt-0.5">
                    <button
                      onClick={() => handleToggleRead(notif.id, isRead)}
                      disabled={isBusy}
                      className={`p-1.5 rounded-lg border transition cursor-pointer shadow-sm ${
                        isRead
                          ? "border-slate-200 dark:border-zinc-800 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 hover:bg-slate-100 dark:hover:bg-zinc-800"
                          : "border-blue-200 dark:border-blue-900/40 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600"
                      }`}
                      title={isRead ? "Mark as Unread" : "Mark as Read"}
                    >
                      {isRead ? (
                        <RotateCcw className="w-3.5 h-3.5" />
                      ) : (
                        <Check className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <EmptyState
              title={searchQuery ? "No Matching Notifications" : "All Caught Up!"}
              description={
                searchQuery
                  ? `No notifications found matching "${searchQuery}". Try a different filter or search term.`
                  : "All check-ins, payments, routine assignments, and client renewals are cleared."
              }
              icon={Bell}
            />
          )}
        </div>
      )}

    </div>
  );
};

export default Notifications;
