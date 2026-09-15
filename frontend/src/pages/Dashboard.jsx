import React, { useMemo, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  UserCheck,
  Clock3,
  AlertTriangle,
  CreditCard,
  CalendarCheck,
  UserPlus,
  Dumbbell,
  Apple,
  Bell,
  ChevronRight,
  TrendingUp,
  Activity,
  Scale,
  DollarSign,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  Target,
  Mail,
  Phone,
  FileText,
  Clock,
  Flame,
  Zap,
  ShieldCheck
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { SkeletonLoader, EmptyState } from "../components/FeedbackStates";

// Membership status calculation helper consistent with Clients page
const computeClientMembership = (client, payments = []) => {
  const expiryStr = client?.expiryDate;
  const clientPayments = (payments || []).filter(p => p.clientId === client?.id) || [];
  const latestPayment = clientPayments.length > 0
    ? [...clientPayments].sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))[0]
    : null;

  const isPending = client?.status === "Pending Payment" || latestPayment?.status === "Unpaid" || latestPayment?.status === "Pending";

  let status = "Active";
  let diffDays = null;
  let formattedExpiry = expiryStr || "Not specified";

  if (isPending) {
    status = "Pending Payment";
  } else if (expiryStr) {
    try {
      const expDate = new Date(expiryStr);
      if (!isNaN(expDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        formattedExpiry = expDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });

        if (diffDays < 0) {
          status = "Expired";
        } else if (diffDays <= 7) {
          status = "Expiring Soon";
        } else {
          status = "Active";
        }
      }
    } catch {
      status = client?.status || "Active";
    }
  } else {
    status = client?.status || "Active";
  }

  return {
    status,
    expiryDate: formattedExpiry,
    diffDays,
    plan: client?.membership || "Standard Monthly"
  };
};

const Dashboard = () => {
  const { 
    clients, 
    attendance, 
    payments, 
    measurements, 
    notifications,
    settings, 
    loading,
    fetchClients,
    fetchAttendance,
    fetchPayments,
    fetchNotifications
  } = useCRM();
  
  const navigate = useNavigate();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activityFilter, setActivityFilter] = useState("all");

  // Sync data on mount if needed
  useEffect(() => {
    if (fetchClients) fetchClients();
    if (fetchAttendance) fetchAttendance();
    if (fetchPayments) fetchPayments();
    if (fetchNotifications) fetchNotifications();
  }, []);

  // Live timer for clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  const trainerFirstName = settings?.trainerName?.split(" ")?.[0] || "Coach";

  // Calculate Real KPIs
  const kpiData = useMemo(() => {
    const total = (clients || []).length;
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let pendingPayment = 0;

    (clients || []).forEach((c) => {
      const mem = computeClientMembership(c, payments);
      if (mem.status === "Active") active++;
      else if (mem.status === "Expiring Soon") expiringSoon++;
      else if (mem.status === "Expired") expired++;
      else if (mem.status === "Pending Payment") pendingPayment++;
    });

    const unpaidPayments = (payments || []).filter((p) => p.status === "Unpaid" || p.status === "Pending");
    const totalPendingCount = Math.max(pendingPayment, unpaidPayments.length);

    // Today's attendance
    const todayStr = new Date().toISOString().split("T")[0];
    const todayLogs = (attendance || []).filter((a) => a.date === todayStr);
    const presentToday = todayLogs.filter((a) => a.status === "Present" || a.status === "Late").length;
    const attendanceRate = total > 0 ? Math.round((presentToday / total) * 100) : 0;

    return {
      total,
      active,
      expiringSoon,
      expired,
      pendingPayment: totalPendingCount,
      presentToday,
      attendanceRate,
      todayLogCount: todayLogs.length
    };
  }, [clients, payments, attendance]);

  // KPI cards configuration
  const kpis = [
    { 
      title: "Total Clients", 
      val: kpiData.total, 
      subtext: "All enrolled clients",
      color: "text-blue-600 bg-blue-500/10 border-blue-500/20", 
      icon: Users,
      onClick: () => navigate("/clients")
    },
    { 
      title: "Active Clients", 
      val: kpiData.active, 
      subtext: `${kpiData.total > 0 ? Math.round((kpiData.active / kpiData.total) * 100) : 0}% of total roster`,
      color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20", 
      icon: UserCheck,
      onClick: () => navigate("/clients")
    },
    { 
      title: "Expiring Soon", 
      val: kpiData.expiringSoon, 
      subtext: "Within next 7 days",
      color: "text-amber-600 bg-amber-500/10 border-amber-500/20", 
      icon: Clock3,
      onClick: () => navigate("/clients")
    },
    { 
      title: "Expired", 
      val: kpiData.expired, 
      subtext: "Requires renewal",
      color: "text-rose-600 bg-rose-500/10 border-rose-500/20", 
      icon: AlertTriangle,
      onClick: () => navigate("/clients")
    },
    { 
      title: "Pending Payments", 
      val: kpiData.pendingPayment, 
      subtext: "Unpaid dues or fees",
      color: "text-orange-600 bg-orange-500/10 border-orange-500/20", 
      icon: CreditCard,
      onClick: () => navigate("/payments")
    },
    { 
      title: "Today's Attendance", 
      val: kpiData.presentToday, 
      subtext: `${kpiData.attendanceRate}% checked in`,
      color: "text-indigo-600 bg-indigo-500/10 border-indigo-500/20", 
      icon: CalendarCheck,
      onClick: () => navigate("/attendance")
    }
  ];

  // Quick actions list
  const quickActionsList = [
    {
      label: "Add New Client",
      path: "/clients/add",
      icon: UserPlus,
      bg: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      desc: "Register a new client profile"
    },
    {
      label: "Mark Attendance",
      path: "/attendance",
      icon: CalendarCheck,
      bg: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      desc: "Log daily checks and entry logs"
    },
    {
      label: "Create Workout",
      path: "/workouts",
      icon: Dumbbell,
      bg: "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20",
      desc: "Build & assign workout splits"
    },
    {
      label: "Create Diet Plan",
      path: "/diet",
      icon: Apple,
      bg: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      desc: "Map meal plans & macro targets"
    },
    {
      label: "Record Payment",
      path: "/payments",
      icon: CreditCard,
      bg: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      desc: "Log membership fees and receipts"
    },
    {
      label: "View Notifications",
      path: "/notifications",
      icon: Bell,
      bg: "bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20",
      desc: "Review system updates & messages"
    }
  ];

  // Goal Distribution Calculation
  const goalDistribution = useMemo(() => {
    const goals = {};
    (clients || []).forEach((c) => {
      const g = c.goal || "General Fitness";
      goals[g] = (goals[g] || 0) + 1;
    });

    const total = clients.length || 1;
    return Object.entries(goals).map(([name, count]) => ({
      name,
      count,
      pct: Math.round((count / total) * 100)
    })).sort((a, b) => b.count - a.count);
  }, [clients]);

  // Overall Attendance Metrics
  const attendanceInsights = useMemo(() => {
    const allLogs = attendance || [];
    const presentCount = allLogs.filter(a => a.status === "Present" || a.status === "Late").length;
    const absentCount = allLogs.filter(a => a.status === "Absent").length;
    const overallRate = allLogs.length > 0 ? Math.round((presentCount / allLogs.length) * 100) : 0;

    return {
      totalLogs: allLogs.length,
      presentCount,
      absentCount,
      overallRate
    };
  }, [attendance]);

  // Real Recent Activity Feed
  const recentActivities = useMemo(() => {
    const list = [];
    const clientMap = new Map();
    (clients || []).forEach(c => clientMap.set(c.id, c.name));

    // 1. Payments
    (payments || []).forEach((p) => {
      list.push({
        id: `pay-${p.id}`,
        type: "payment",
        title: `Payment ₹${p.amount} ${p.status === "Paid" ? "received" : "pending"}`,
        subtitle: `${p.clientName || clientMap.get(p.clientId) || "Client"} • Method: ${p.method || "UPI"}`,
        date: p.date,
        status: p.status,
        timestamp: new Date(p.date || 0).getTime(),
        icon: CreditCard,
        color: p.status === "Paid" ? "text-emerald-500 bg-emerald-500/10" : "text-amber-500 bg-amber-500/10",
        link: "/payments"
      });
    });

    // 2. Attendance
    (attendance || []).forEach((a) => {
      const name = clientMap.get(a.clientId) || "Client";
      list.push({
        id: `att-${a.id}`,
        type: "attendance",
        title: `${name} marked ${a.status}`,
        subtitle: a.timeIn && a.timeIn !== "-" ? `Check-in time: ${a.timeIn}` : "Attendance log",
        date: a.date,
        status: a.status,
        timestamp: new Date(a.date || 0).getTime(),
        icon: CalendarCheck,
        color: a.status === "Present" ? "text-emerald-500 bg-emerald-500/10" : "text-rose-500 bg-rose-500/10",
        link: "/attendance"
      });
    });

    // 3. New Clients
    (clients || []).forEach((c) => {
      const joinDate = c.joinDate || c.created_at?.split("T")[0];
      list.push({
        id: `client-${c.id}`,
        type: "client",
        title: `New client added: ${c.name}`,
        subtitle: `Goal: ${c.goal || "General Fitness"} • Plan: ${c.membership || "Standard"}`,
        date: joinDate,
        status: "New",
        timestamp: new Date(joinDate || 0).getTime(),
        icon: UserPlus,
        color: "text-blue-500 bg-blue-500/10",
        link: `/clients/${c.id}`
      });
    });

    // 4. Progress Updates from measurements
    Object.entries(measurements || {}).forEach(([clientId, logs]) => {
      const name = clientMap.get(clientId) || "Client";
      if (Array.isArray(logs)) {
        logs.forEach((m, idx) => {
          list.push({
            id: `prog-${clientId}-${idx}`,
            type: "progress",
            title: `${name} recorded weight check-in`,
            subtitle: `Weight: ${m.weight} kg ${m.bodyFat ? `• Body Fat: ${m.bodyFat}%` : ""}`,
            date: m.date,
            status: "Progress",
            timestamp: new Date(m.date || 0).getTime(),
            icon: Scale,
            color: "text-purple-500 bg-purple-500/10",
            link: `/clients/${clientId}`
          });
        });
      }
    });

    // Sort descending by timestamp
    return list.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [clients, payments, attendance, measurements]);

  // Filtered activities
  const filteredActivities = useMemo(() => {
    if (activityFilter === "all") return recentActivities.slice(0, 8);
    return recentActivities.filter(a => a.type === activityFilter).slice(0, 8);
  }, [recentActivities, activityFilter]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 text-left">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#09090b] text-white p-6 sm:p-8 rounded-3xl border border-slate-800/30 shadow-soft relative overflow-hidden">
        <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-wider">
            <span>✨ {currentTime.toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "short", day: "numeric" })}</span>
            <span>•</span>
            <span>{currentTime.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
          </div>
          
          <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white font-display">
            {timeGreeting}, {trainerFirstName} 👋
          </h1>
          
          <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed max-w-2xl">
            Welcome to your BeFit command center. Monitor client fitness milestones, manage active memberships, and oversee daily gym operations.
          </p>
          
          <div className="pt-2 border-t border-slate-800/60 max-w-md flex items-center justify-between gap-4">
            <div>
              <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block">Trainer Scope</span>
              <p className="text-xs text-blue-300 font-bold">{settings.gymName || "BeFit Performance Gym"}</p>
            </div>
            <button
              onClick={() => navigate("/clients")}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/80 hover:bg-blue-600 text-white rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
            >
              <span>Manage Clients</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* 1. Core KPI Cards Grid */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-xs font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">
            Gym Performance Overview
          </h2>
          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">Real-time stats</span>
        </div>

        {loading ? (
          <SkeletonLoader type="card" count={6} />
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {kpis.map((kpi, i) => {
              const Icon = kpi.icon;
              return (
                <div
                  key={i}
                  onClick={kpi.onClick}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4.5 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 text-left group cursor-pointer hover:-translate-y-0.5 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <div className={`w-9 h-9 rounded-2xl flex items-center justify-center ${kpi.color} border shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                    <ArrowUpRight className="w-3.5 h-3.5 text-slate-300 dark:text-zinc-600 group-hover:text-blue-500 transition-colors" />
                  </div>
                  <div className="mt-3">
                    <h3 className="text-2xl font-black font-display text-slate-900 dark:text-zinc-50 leading-none">
                      <AnimatedNumber value={kpi.val} />
                    </h3>
                    <p className="text-[11px] font-extrabold text-slate-700 dark:text-zinc-300 mt-1.5 leading-tight">
                      {kpi.title}
                    </p>
                    <p className="text-[9px] font-medium text-slate-400 dark:text-zinc-500 mt-0.5 truncate">
                      {kpi.subtext}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 2. Quick Operations Console */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100">
              Quick Operations Console
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">
              Fast shortcuts to primary coaching workflows
            </p>
          </div>
          <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-0.5 rounded-full border border-blue-200/40 dark:border-blue-800/40">
            6 Shortcuts
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {quickActionsList.map((action, i) => {
            const Icon = action.icon;
            return (
              <button
                key={i}
                onClick={() => navigate(action.path)}
                className="flex flex-col items-start p-3.5 rounded-2xl border border-slate-200/70 dark:border-zinc-800 bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-200 cursor-pointer group text-left w-full active:scale-95"
              >
                <div className={`p-2 rounded-xl border mb-2.5 group-hover:scale-105 transition-transform ${action.bg}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition leading-tight">
                  {action.label}
                </span>
                <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-medium mt-1 leading-snug line-clamp-2">
                  {action.desc}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Client Insights Section (Attendance, Membership Status, Goals) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Attendance Summary */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <CalendarCheck className="w-4 h-4 text-indigo-500" />
                <span>Attendance Summary</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Today & overall check-in health</p>
            </div>
            <button
              onClick={() => navigate("/attendance")}
              className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer"
            >
              Open Log
            </button>
          </div>

          <div className="space-y-3">
            {/* Today's Rate Card */}
            <div className="p-3.5 rounded-2xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-100 dark:border-indigo-900/30 flex items-center justify-between">
              <div>
                <span className="text-[9px] font-bold uppercase text-indigo-600 dark:text-indigo-400 block">Today's Check-in Rate</span>
                <span className="text-xl font-black text-indigo-950 dark:text-indigo-200 block mt-0.5">
                  {kpiData.attendanceRate}%
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-black text-indigo-700 dark:text-indigo-300 block">
                  {kpiData.presentToday} of {kpiData.total}
                </span>
                <span className="text-[9px] text-indigo-500/80 block">Clients checked in</span>
              </div>
            </div>

            {/* Attendance Metrics Strip */}
            <div className="grid grid-cols-2 gap-2 text-center text-xs">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Total Historical Logs</span>
                <span className="text-sm font-black text-slate-800 dark:text-zinc-200 mt-0.5 block">
                  {attendanceInsights.totalLogs}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800">
                <span className="text-[9px] text-slate-400 font-bold uppercase block">Overall Consistency</span>
                <span className="text-sm font-black text-emerald-600 dark:text-emerald-400 mt-0.5 block">
                  {attendanceInsights.overallRate}%
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Membership Status Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
                <span>Membership Distribution</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Roster health & expiry status</p>
            </div>
            <button
              onClick={() => navigate("/clients")}
              className="text-[10px] font-bold text-blue-600 dark:text-blue-400 hover:underline cursor-pointer"
            >
              Directory
            </button>
          </div>

          <div className="space-y-2.5">
            {[
              { label: "Active Memberships", count: kpiData.active, color: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" },
              { label: "Expiring in <= 7 days", count: kpiData.expiringSoon, color: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" },
              { label: "Expired", count: kpiData.expired, color: "bg-rose-500", text: "text-rose-600 dark:text-rose-400" },
              { label: "Pending Payments", count: kpiData.pendingPayment, color: "bg-orange-500", text: "text-orange-600 dark:text-orange-400" }
            ].map((item, idx) => {
              const total = kpiData.total || 1;
              const pct = Math.round((item.count / total) * 100);
              return (
                <div key={idx} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px]">{item.label}</span>
                    <span className={`font-bold ${item.text} text-[11px]`}>
                      {item.count} ({pct}%)
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${item.color} rounded-full transition-all duration-300`}
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Client Goal Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-3">
            <div>
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-1.5">
                <Target className="w-4 h-4 text-purple-500" />
                <span>Client Fitness Goals</span>
              </h3>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500">Program allocation breakdown</p>
            </div>
            <button
              onClick={() => navigate("/workouts")}
              className="text-[10px] font-bold text-purple-600 dark:text-purple-400 hover:underline cursor-pointer"
            >
              Workouts
            </button>
          </div>

          <div className="space-y-2.5">
            {goalDistribution.length > 0 ? (
              goalDistribution.slice(0, 4).map((goal, idx) => {
                const colors = [
                  "bg-blue-500 text-blue-600 dark:text-blue-400",
                  "bg-purple-500 text-purple-600 dark:text-purple-400",
                  "bg-emerald-500 text-emerald-600 dark:text-emerald-400",
                  "bg-pink-500 text-pink-600 dark:text-pink-400"
                ];
                const colorSet = colors[idx % colors.length].split(" ");
                const barColor = colorSet[0];
                const textColor = colorSet.slice(1).join(" ");

                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] truncate max-w-[170px]">
                        {goal.name}
                      </span>
                      <span className={`font-bold ${textColor} text-[11px]`}>
                        {goal.count} clients ({goal.pct}%)
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${barColor} rounded-full transition-all duration-300`}
                        style={{ width: `${Math.min(goal.pct, 100)}%` }}
                      />
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="py-6 text-center text-slate-400 dark:text-zinc-500 text-xs italic">
                No goal metrics available.
              </div>
            )}
          </div>
        </div>

      </div>

      {/* 4. Real Recent Activity Feed */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-zinc-800 pb-3">
          <div>
            <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-600" />
              <span>Recent Gym Activity</span>
            </h3>
            <p className="text-[10px] text-slate-400 dark:text-zinc-500">Live feed of payments, attendance, progress logs, and new clients</p>
          </div>

          {/* Activity Category Filter Chips */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
            {[
              { id: "all", label: "All" },
              { id: "payment", label: "Payments" },
              { id: "attendance", label: "Attendance" },
              { id: "client", label: "New Clients" },
              { id: "progress", label: "Progress" }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActivityFilter(tab.id)}
                className={`px-3 py-1 rounded-full text-[10px] font-bold transition whitespace-nowrap cursor-pointer border ${
                  activityFilter === tab.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                    : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 dark:text-zinc-400 hover:text-slate-900 dark:hover:text-zinc-200"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Items List */}
        <div className="divide-y divide-slate-100 dark:divide-zinc-800">
          {filteredActivities.length > 0 ? (
            filteredActivities.map((act) => {
              const Icon = act.icon;
              return (
                <div
                  key={act.id}
                  onClick={() => act.link && navigate(act.link)}
                  className="py-3 px-2 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-zinc-800/40 rounded-2xl transition cursor-pointer group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 border border-current/10 ${act.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs block truncate group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                        {act.title}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 block truncate mt-0.5">
                        {act.subtitle}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right shrink-0 flex items-center gap-2">
                    <div className="text-right">
                      <span className="text-[10px] font-bold text-slate-600 dark:text-zinc-300 block">
                        {act.date || "Recent"}
                      </span>
                      <span className="text-[9px] text-slate-400 dark:text-zinc-500 uppercase font-semibold block mt-0.5">
                        {act.type}
                      </span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300 dark:text-zinc-600 group-hover:translate-x-0.5 transition-transform" />
                  </div>
                </div>
              );
            })
          ) : (
            <div className="py-8 text-center text-slate-400 dark:text-zinc-500 text-xs italic">
              No recent {activityFilter === "all" ? "gym" : activityFilter} activities logged yet.
            </div>
          )}
        </div>

      </div>

    </div>
  );
};

export default Dashboard;
