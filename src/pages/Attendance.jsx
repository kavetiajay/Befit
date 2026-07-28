import React, { useState, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  CalendarDays,
  User,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  AlertTriangle,
  UserCheck,
  Percent,
  Filter,
  Sparkles,
  FileDown,
  Flame,
  Search,
  Check,
  TrendingUp,
  RotateCcw,
  Trophy,
  ArrowRight,
  LogOut,
  LogIn
} from "lucide-react";
import { toast } from "sonner";

const Attendance = () => {
  const todayStr = "2026-07-22"; // Anchor date to match mockup database
  const { clients, attendance, markClientAttendance } = useCRM();

  // Selected states for logger
  const [clientIdInput, setClientIdInput] = useState(clients[0]?.id || "");
  const [dateInput, setDateInput] = useState(todayStr);
  const [statusInput, setStatusInput] = useState("Present");
  const [timeInInput, setTimeInInput] = useState("08:00 AM");
  const [timeOutInput, setTimeOutInput] = useState("09:30 AM");

  // Search state for Today's section
  const [todaySearch, setTodaySearch] = useState("");

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");
  const [searchMemberQuery, setSearchMemberQuery] = useState("");

  // Selected Calendar Date state (default to July 22, 2026 matching mock data)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState("2026-07-22");

  // Persistent Check-out Time State
  const [checkouts, setCheckouts] = useState(() => {
    const saved = localStorage.getItem("gym_attendance_checkouts");
    return saved ? JSON.parse(saved) : {};
  });

  // Helper: Map client to batch dynamically based on workout goal
  const getClientBatch = (client) => {
    if (!client) return "General Fitness";
    if (client.goal === "Weight Loss" || client.goal === "Fat Loss") return "Weight Loss Batch";
    if (client.goal === "Strength Training") return "Strength Training";
    if (client.goal === "Muscle Gain" || client.goal === "Weight Gain") return "Muscle Hypertrophy";
    return "CrossFit Circuit";
  };

  // Helper: Calculate checkout time
  const getCheckoutTime = (log) => {
    if (log.status === "Absent") return "—";
    const key = `${log.clientId}-${log.date}`;
    if (checkouts[key]) return checkouts[key];
    
    // Default simulated checkout (Check-in time + 1.5 hours)
    const timeIn = log.timeIn;
    if (!timeIn || timeIn === "-") return "—";
    
    try {
      const parts = timeIn.split(" ");
      const hm = parts[0].split(":");
      let h = parseInt(hm[0]);
      let m = parseInt(hm[1]);
      const ampm = parts[1];
      
      m += 30;
      if (m >= 60) {
        m -= 60;
        h += 1;
      }
      h += 1;
      if (h > 12) h -= 12;
      
      return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")} ${ampm}`;
    } catch (e) {
      return "09:30 AM";
    }
  };

  // Helper: Calculate Streak
  const getMemberStreak = (memberId) => {
    const logs = attendance
      .filter(a => (memberId === "All" || a.clientId === memberId) && (a.status === "Present" || a.status === "Late"))
      .sort((a, b) => new Date(a.date) - new Date(b.date));
      
    if (logs.length === 0) return 0;
    
    let maxStreak = 0;
    let currentStreak = 0;
    let prevDate = null;
    
    logs.forEach((log) => {
      const currentDate = new Date(log.date);
      if (!prevDate) {
        currentStreak = 1;
      } else {
        const diffTime = Math.abs(currentDate - prevDate);
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          currentStreak += 1;
        } else if (diffDays > 1) {
          if (currentStreak > maxStreak) maxStreak = currentStreak;
          currentStreak = 1;
        }
      }
      prevDate = currentDate;
    });
    
    return Math.max(maxStreak, currentStreak);
  };

  // Mark Attendance submit handler
  const handleMarkAttendanceSubmit = (e) => {
    e.preventDefault();
    if (!clientIdInput) {
      toast.warning("Please select a client.");
      return;
    }
    
    const client = clients.find((c) => c.id === clientIdInput);
    if (!client) return;

    markClientAttendance(
      clientIdInput,
      dateInput,
      statusInput,
      statusInput === "Absent" ? "-" : timeInInput
    );

    // Persist Check-out Time locally
    if (statusInput !== "Absent") {
      const key = `${clientIdInput}-${dateInput}`;
      const updatedCheckouts = { ...checkouts, [key]: timeOutInput };
      setCheckouts(updatedCheckouts);
      localStorage.setItem("gym_attendance_checkouts", JSON.stringify(updatedCheckouts));
    }

    toast.success(`Recorded attendance: ${client.name} - ${statusInput}`);
  };

  // Quick Action Check-in from live panel
  const handleQuickCheckin = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    
    const timeIn = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    
    markClientAttendance(clientId, todayStr, "Present", timeIn);
    
    // Simulate check-out 1.5 hours later
    const checkOutTime = "09:30 AM";
    const key = `${clientId}-${todayStr}`;
    const updatedCheckouts = { ...checkouts, [key]: checkOutTime };
    setCheckouts(updatedCheckouts);
    localStorage.setItem("gym_attendance_checkouts", JSON.stringify(updatedCheckouts));
    
    toast.success(`Checked in ${client.name} successfully!`);
  };

  // Quick Action Check-out from live panel
  const handleQuickCheckout = (clientId) => {
    const client = clients.find((c) => c.id === clientId);
    if (!client) return;
    
    const timeOut = new Date().toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
    
    const key = `${clientId}-${todayStr}`;
    const updatedCheckouts = { ...checkouts, [key]: timeOut };
    setCheckouts(updatedCheckouts);
    localStorage.setItem("gym_attendance_checkouts", JSON.stringify(updatedCheckouts));
    
    toast.success(`Checked out ${client.name} at ${timeOut}`);
  };

  // Processed Historical Logs (filtered by Date, Member, Batch, Search Query)
  const filteredAttendance = useMemo(() => {
    return attendance.filter((log) => {
      // 1. Date Filter
      if (filterDate && log.date !== filterDate) return false;

      // 2. Member Filter
      if (filterMember !== "All" && log.clientId !== filterMember) return false;

      // 3. Batch Filter
      if (filterBatch !== "All") {
        const clientObj = clients.find(c => c.id === log.clientId);
        const clientBatch = getClientBatch(clientObj);
        if (clientBatch !== filterBatch) return false;
      }

      // 4. Search Filter
      if (searchMemberQuery.trim()) {
        const clientObj = clients.find(c => c.id === log.clientId);
        if (!clientObj?.name.toLowerCase().includes(searchMemberQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  }, [attendance, filterDate, filterMember, filterBatch, searchMemberQuery, clients]);

  // Summary Metrics based on filters
  const summary = useMemo(() => {
    const targetLogs = filteredAttendance;
    const totalLogs = targetLogs.length;
    if (totalLogs === 0) return { present: 0, late: 0, absent: 0, rate: 0, streak: 0 };
    
    const present = targetLogs.filter((a) => a.status === "Present").length;
    const late = targetLogs.filter((a) => a.status === "Late").length;
    const absent = targetLogs.filter((a) => a.status === "Absent").length;
    const rate = Math.round(((present + late) / totalLogs) * 100);

    const activeMemberId = filterMember !== "All" ? filterMember : "All";
    const streak = getMemberStreak(activeMemberId);

    return { present, late, absent, rate, total: totalLogs, streak };
  }, [filteredAttendance, filterMember]);

  // Today's live attendance summary
  const todaySummary = useMemo(() => {
    const todayLogs = attendance.filter(a => a.date === todayStr);
    const present = todayLogs.filter(a => a.status === "Present").length;
    const late = todayLogs.filter(a => a.status === "Late").length;
    const absent = todayLogs.filter(a => a.status === "Absent").length;
    const totalExpected = clients.length;
    const pending = totalExpected - (present + late + absent);

    return { present, late, absent, pending, totalExpected };
  }, [attendance, clients]);

  // Selected date logs for Calendar detail box
  const selectedDateLogs = useMemo(() => {
    return attendance.filter(a => a.date === selectedCalendarDate);
  }, [attendance, selectedCalendarDate]);

  // Calendar setup for July 2026 (Starts on Wednesday -> offset 3)
  const calendarDays = useMemo(() => {
    const days = [];
    const startOffset = 3; 
    for (let i = 1; i <= 31; i++) {
      const dateStr = `2026-07-${i.toString().padStart(2, "0")}`;
      const logs = attendance.filter((a) => a.date === dateStr);
      days.push({ day: i, dateStr, logs });
    }
    return { days, startOffset };
  }, [attendance]);

  // Batch analysis calculations
  const batchAnalytics = useMemo(() => {
    const batches = [
      "Weight Loss Batch",
      "Strength Training",
      "General Fitness",
      "Muscle Hypertrophy",
      "CrossFit Circuit"
    ];

    return batches.map(batchName => {
      const batchClients = clients.filter(c => getClientBatch(c) === batchName);
      const clientIds = batchClients.map(c => c.id);
      
      const totalLogs = attendance.filter(log => clientIds.includes(log.clientId)).length;
      const presentLogs = attendance.filter(log => clientIds.includes(log.clientId) && (log.status === "Present" || log.status === "Late")).length;
      
      const percent = totalLogs > 0 ? Math.round((presentLogs / totalLogs) * 100) : 0;
      return { name: batchName, percent, count: batchClients.length };
    });
  }, [clients, attendance]);

  // Leaderboard of Top Attendees
  const topAttendees = useMemo(() => {
    return clients.map(client => {
      const clientLogs = attendance.filter(log => log.clientId === client.id);
      const totalDays = clientLogs.length;
      const presentDays = clientLogs.filter(log => log.status === "Present" || log.status === "Late").length;
      const streak = getMemberStreak(client.id);
      const rate = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

      return {
        ...client,
        presentDays,
        streak,
        rate
      };
    })
    .sort((a, b) => b.presentDays - a.presentDays || b.streak - a.streak)
    .slice(0, 3);
  }, [clients, attendance]);

  // Export Trigger Simulation
  const handleExportMonthlyReport = () => {
    toast.success("Monthly attendance report compiled and downloaded successfully as CSV!");
  };

  // Filter today's list of clients by search input
  const searchedTodayClients = useMemo(() => {
    if (!todaySearch.trim()) return clients;
    return clients.filter(c => c.name.toLowerCase().includes(todaySearch.toLowerCase()));
  }, [clients, todaySearch]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-zinc-800 pb-5 gap-4 no-print">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Attendance Matrix
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Log scanning entries, configure check-out cycles, track multipliers, and analyze batch percentages.
          </p>
        </div>
        <button
          onClick={handleExportMonthlyReport}
          className="flex items-center gap-2 px-5 py-2.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-2xl text-xs font-bold text-slate-700 dark:text-zinc-355 transition-all shadow-sm hover:shadow-md cursor-pointer shrink-0"
        >
          <FileDown className="w-4 h-4 text-blue-500" />
          <span>Export Monthly Feed</span>
        </button>
      </div>

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 no-print">
        
        {/* Attendance Rate Circular Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 relative text-left flex items-center gap-4 overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          
          {/* Circular SVG Progress Meter */}
          <div className="relative flex items-center justify-center shrink-0">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                className="text-slate-100 dark:text-zinc-800"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                stroke="currentColor"
                strokeWidth="5"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 26}
                strokeDashoffset={2 * Math.PI * 26 * (1 - summary.rate / 100)}
                className="text-blue-600 transition-all duration-500"
              />
            </svg>
            <span className="absolute text-xs font-black text-slate-800 dark:text-zinc-200">
              {summary.rate}%
            </span>
          </div>
          <div>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider leading-none">
              Attendance Rate
            </p>
            <h3 className="text-base font-black text-slate-850 dark:text-zinc-100 mt-1 leading-tight">
              {summary.rate >= 80 ? "Excellent" : summary.rate >= 50 ? "Moderate" : "Needs Review"}
            </h3>
            <p className="text-[9px] text-slate-400 mt-1">Checked on-time ratios</p>
          </div>
        </div>

        {/* Present Days Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 relative text-left group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <CheckCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black bg-emerald-500/10 text-emerald-605 px-2 py-0.5 rounded-full">Active</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 leading-none">
              {summary.present} Days
            </h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
              On-Time Scans
            </p>
          </div>
        </div>

        {/* Absent Days Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 relative text-left group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-rose-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-rose-500/10 text-rose-500 border border-rose-500/20">
              <XCircle className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black bg-rose-500/10 text-rose-605 px-2 py-0.5 rounded-full">Missed</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 leading-none">
              {summary.absent} Days
            </h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
              Missed Sessions
            </p>
          </div>
        </div>

        {/* Late Entries Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 relative text-left group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-amber-500/10 text-amber-500 border border-amber-500/20">
              <Clock className="w-5 h-5" />
            </div>
            <span className="text-[10px] font-black bg-amber-500/10 text-amber-605 px-2 py-0.5 rounded-full">Delayed</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 leading-none">
              {summary.late} Entries
            </h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
              Late Check-ins
            </p>
          </div>
        </div>

        {/* Attendance Streak Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 hover:shadow-lg transition-all duration-300 relative text-left group overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-purple-500/5 rounded-full translate-x-8 -translate-y-8 group-hover:scale-110 transition-transform duration-500" />
          <div className="flex justify-between items-start">
            <div className="w-10 h-10 rounded-2xl flex items-center justify-center bg-purple-500/10 text-purple-600 border border-purple-500/20">
              <Flame className="w-5 h-5 animate-pulse text-purple-500" />
            </div>
            <span className="text-[10px] font-black bg-purple-500/10 text-purple-605 px-2 py-0.5 rounded-full">Streak</span>
          </div>
          <div className="mt-4">
            <h3 className="text-2xl font-black text-slate-900 dark:text-zinc-50 leading-none flex items-center gap-1.5">
              {summary.streak} Days
            </h3>
            <p className="text-[10px] font-black text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
              Highest Multiplier
            </p>
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Attendance Calendar Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm text-left">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-6 pb-4 border-b border-slate-100 dark:border-zinc-850 gap-2">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <CalendarDays className="w-5 h-5 text-blue-500" /> Attendance Ledger
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">Click any calendar cell to view check-in details for that date.</p>
              </div>
              <div className="flex items-center gap-2 self-start sm:self-auto">
                <span className="text-[11px] font-extrabold text-slate-600 dark:text-zinc-350 bg-slate-100 dark:bg-zinc-800 border border-slate-200 dark:border-zinc-750 px-3 py-1 rounded-xl">
                  July 2026
                </span>
              </div>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-3 text-center font-black text-[10px] text-slate-400 dark:text-zinc-500 uppercase mb-3">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-3">
              {Array.from({ length: calendarDays.startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="aspect-square" />
              ))}

              {calendarDays.days.map((dayData) => {
                const logs = dayData.logs;
                const hasAbsent = logs.some(l => l.status === "Absent");
                const hasLate = logs.some(l => l.status === "Late");
                const hasPresent = logs.some(l => l.status === "Present");

                let cellClass = "";
                let indicatorDot = "";
                
                if (hasAbsent) {
                  cellClass = "border-rose-200/60 dark:border-rose-900/30 bg-rose-50/20 dark:bg-rose-950/10 text-rose-600";
                  indicatorDot = "bg-rose-500";
                } else if (hasLate) {
                  cellClass = "border-amber-200/60 dark:border-amber-900/30 bg-amber-50/20 dark:bg-amber-950/10 text-amber-600";
                  indicatorDot = "bg-amber-500";
                } else if (hasPresent) {
                  cellClass = "border-emerald-200/60 dark:border-emerald-900/30 bg-emerald-50/20 dark:bg-emerald-950/10 text-emerald-605";
                  indicatorDot = "bg-emerald-500";
                } else {
                  cellClass = "border-slate-100 dark:border-zinc-850 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-700 dark:text-zinc-400";
                }

                const isSelected = selectedCalendarDate === dayData.dateStr;
                const isAnchorToday = dayData.day === 22; // July 22, 2026 is today

                return (
                  <div
                    key={dayData.day}
                    onClick={() => setSelectedCalendarDate(dayData.dateStr)}
                    className={`aspect-square rounded-2xl flex flex-col items-center justify-center relative cursor-pointer select-none transition-all duration-300 border ${cellClass} ${
                      isSelected 
                        ? "bg-blue-600 border-blue-600 text-white font-black shadow-lg shadow-blue-500/20 scale-110 z-10" 
                        : isAnchorToday 
                        ? "ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-zinc-900 font-extrabold" 
                        : "hover:scale-105"
                    }`}
                  >
                    <span className="text-xs">{dayData.day}</span>
                    {indicatorDot && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? "bg-white" : indicatorDot}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Summary details box */}
            <div className="mt-6 p-5 bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-150/60 dark:border-zinc-850 rounded-3xl space-y-4">
              <div className="flex justify-between items-center border-b pb-3 border-slate-100 dark:border-zinc-850">
                <div>
                  <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">
                    Activity logs on {selectedCalendarDate}
                  </span>
                  <p className="text-[10px] text-slate-400 mt-0.5">Showing checked members</p>
                </div>
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-3 py-1 rounded-xl border border-blue-100 dark:border-blue-900/30">
                  {selectedDateLogs.length} Checked In
                </span>
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-52 overflow-y-auto pr-1">
                {selectedDateLogs.length > 0 ? (
                  selectedDateLogs.map((log) => {
                    const client = clients.find(c => c.id === log.clientId);
                    return (
                      <div key={log.id} className="flex justify-between items-center p-3 bg-white dark:bg-zinc-900 border border-slate-150/70 dark:border-zinc-800 rounded-2xl shadow-sm hover:scale-[1.01] transition-transform">
                        <div className="flex items-center gap-3">
                          <img src={client?.photo} className="w-8 h-8 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200/60" />
                          <div>
                            <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs block">{client?.name}</span>
                            <span className="text-[9px] text-slate-400">{getClientBatch(client)}</span>
                          </div>
                        </div>
                        <div className="text-right shrink-0 flex flex-col items-end gap-1">
                          <span className={`px-2 py-0.5 rounded-lg text-[8px] font-bold ${
                            log.status === "Present" ? "bg-emerald-500/10 text-emerald-500" :
                            log.status === "Late" ? "bg-amber-500/10 text-amber-500" :
                            "bg-rose-500/10 text-rose-500"
                          }`}>
                            {log.status}
                          </span>
                          <span className="text-slate-450 dark:text-zinc-500 text-[8.5px] font-semibold">
                            {log.status === "Absent" ? "Absent" : `In: ${log.timeIn}`}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="col-span-2 text-center py-6 text-slate-400 text-xs italic">
                    No attendance records registered on this calendar date.
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* Mark Attendance Logger Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm text-left no-print">
            <h3 className="text-sm font-extrabold text-slate-800 dark:text-zinc-100 mb-4 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-500" /> Log Custom Member Session
            </h3>
            <form onSubmit={handleMarkAttendanceSubmit} className="space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">Select Athlete</label>
                  <select
                    value={clientIdInput}
                    onChange={(e) => setClientIdInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>{c.name} ({getClientBatch(c)})</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">Log Date</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 block mb-2 uppercase tracking-wider">Attendance Status</label>
                <div className="grid grid-cols-3 gap-3">
                  {["Present", "Late", "Absent"].map((status) => {
                    const isActive = statusInput === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusInput(status)}
                        className={`py-3 text-xs font-bold border rounded-2xl transition-all cursor-pointer ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-500/10"
                            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-600 dark:text-zinc-400"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              {statusInput !== "Absent" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2 duration-200">
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">Check-in Time</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={timeInInput}
                        onChange={(e) => setTimeInInput(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. 08:00 AM"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-[10px] font-extrabold text-slate-400 dark:text-zinc-500 block mb-1.5 uppercase tracking-wider">Check-out Time</label>
                    <div className="relative">
                      <Clock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                      <input
                        type="text"
                        value={timeOutInput}
                        onChange={(e) => setTimeOutInput(e.target.value)}
                        className="w-full pl-9 pr-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        placeholder="e.g. 09:30 AM"
                      />
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition-all cursor-pointer text-center"
              >
                Log Entry
              </button>
            </form>
          </div>

          {/* Monthly Report Summary & Batch breakdown */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-sm text-left">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h3 className="text-base font-extrabold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-blue-500" /> Batch & Monthly Analytics
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">Average attendance levels per client batch</p>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full font-black border border-emerald-500/20 uppercase tracking-widest">
                Analytics
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Batch bars */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">Attendance Rate by Training Batch</span>
                <div className="space-y-3">
                  {batchAnalytics.map((batch) => (
                    <div key={batch.name} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-300">
                        <span>{batch.name} ({batch.count} Active)</span>
                        <span>{batch.percent}%</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-blue-500 rounded-full transition-all duration-1000" 
                          style={{ width: `${batch.percent}%` }} 
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Leaderboard of Top Attendees */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider block flex items-center gap-1">
                  <Trophy className="w-3.5 h-3.5 text-amber-500" /> Monthly Leaderboard (Top 3)
                </span>
                
                <div className="space-y-3">
                  {topAttendees.map((attendee, index) => (
                    <div key={attendee.id} className="flex items-center justify-between p-2.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 transition-colors">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <img src={attendee.photo} className="w-9 h-9 rounded-xl object-cover shadow-sm bg-slate-100 border" />
                          <span className={`absolute -top-1.5 -left-1.5 w-5.5 h-5.5 rounded-full flex items-center justify-center text-[9px] font-black text-white ${
                            index === 0 ? "bg-amber-500" : index === 1 ? "bg-slate-450" : "bg-amber-700"
                          }`}>
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <span className="text-xs font-extrabold text-slate-805 dark:text-zinc-200 block">{attendee.name}</span>
                          <span className="text-[9px] text-slate-400">{getClientBatch(attendee)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <span className="text-xs font-black text-slate-850 dark:text-zinc-200 block">{attendee.presentDays} Days</span>
                        <span className="text-[9px] text-purple-650 dark:text-purple-400 font-extrabold flex items-center justify-end gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> {attendee.streak}d Streak
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Right Column: Today's Summary & Filter panels */}
        <div className="space-y-6">
          
          {/* Today's Attendance Summary & Check-In Trigger Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <h3 className="text-sm font-extrabold text-slate-850 dark:text-zinc-100 mb-1 flex items-center gap-2">
              <Sparkles className="w-4.5 h-4.5 text-blue-500" /> Today's Live Dashboard
            </h3>
            <p className="text-[10px] text-slate-400 mb-4">Checked slots for {todayStr}</p>
            
            {/* Visual Progress Bar */}
            <div className="space-y-3 text-xs bg-slate-50/50 dark:bg-zinc-950/20 p-4 border border-slate-100 dark:border-zinc-850 rounded-2xl mb-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Expected Attendance Density</span>
                <span className="font-extrabold text-slate-805 dark:text-zinc-200">{todaySummary.totalExpected} Members</span>
              </div>
              <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500 transition-all" style={{ width: `${(todaySummary.present / todaySummary.totalExpected) * 100}%` }} title="Present" />
                <div className="h-full bg-amber-500 transition-all" style={{ width: `${(todaySummary.late / todaySummary.totalExpected) * 100}%` }} title="Late" />
                <div className="h-full bg-rose-500 transition-all" style={{ width: `${(todaySummary.absent / todaySummary.totalExpected) * 100}%` }} title="Absent" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-2 text-[10px] font-black">
                <div className="text-emerald-500">Pres: {todaySummary.present}</div>
                <div className="text-amber-500">Late: {todaySummary.late}</div>
                <div className="text-rose-500">Abs: {todaySummary.absent}</div>
                <div className="text-slate-400">Pend: {todaySummary.pending}</div>
              </div>
            </div>

            {/* List checklist with search */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Quick search athlete..."
                  value={todaySearch}
                  onChange={(e) => setTodaySearch(e.target.value)}
                  className="w-full pl-9 pr-3.5 py-2 border border-slate-150 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-[11px] focus:outline-none focus:ring-1 focus:ring-blue-500 transition-all"
                />
              </div>

              <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
                {searchedTodayClients.length > 0 ? (
                  searchedTodayClients.map((client) => {
                    const todayLog = attendance.find(a => a.clientId === client.id && a.date === todayStr);
                    const checkout = getCheckoutTime({ clientId: client.id, date: todayStr, status: todayLog?.status, timeIn: todayLog?.timeIn });
                    const isCheckedOut = todayLog?.status && todayLog.status !== "Absent" && checkouts[`${client.id}-${todayStr}`];

                    return (
                      <div key={client.id} className="flex justify-between items-center p-2.5 bg-white dark:bg-zinc-900 border border-slate-100 dark:border-zinc-800 rounded-xl hover:scale-[1.01] transition-transform">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <img src={client.photo} className="w-8 h-8 rounded-lg object-cover shrink-0 border" />
                          <div className="min-w-0">
                            <span className="text-[11px] font-extrabold text-slate-805 dark:text-zinc-200 block truncate leading-none mb-0.5">{client.name}</span>
                            <span className="text-[9px] text-slate-400 block truncate">{getClientBatch(client)}</span>
                          </div>
                        </div>

                        {/* Interactive status badge or triggers */}
                        <div className="shrink-0 flex items-center gap-1.5">
                          {todayLog ? (
                            <div className="flex items-center gap-1.5 text-right">
                              <div>
                                <span className={`px-1.5 py-0.5 rounded text-[8px] font-black ${
                                  todayLog.status === "Present" ? "bg-emerald-500/10 text-emerald-505" :
                                  todayLog.status === "Late" ? "bg-amber-500/10 text-amber-505" :
                                  "bg-rose-500/10 text-rose-500"
                                }`}>
                                  {todayLog.status}
                                </span>
                                {todayLog.status !== "Absent" && (
                                  <span className="text-[8px] text-slate-400 block mt-0.5">
                                    In: {todayLog.timeIn}
                                  </span>
                                )}
                              </div>
                              {todayLog.status !== "Absent" && (
                                isCheckedOut ? (
                                  <span className="text-[8px] text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/15 border border-blue-200/50 dark:border-blue-900/40 px-1.5 py-0.5 rounded">
                                    Out: {checkout}
                                  </span>
                                ) : (
                                  <button
                                    onClick={() => handleQuickCheckout(client.id)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                                    title="Check out now"
                                  >
                                    <LogOut className="w-3.5 h-3.5" />
                                  </button>
                                )
                              )}
                            </div>
                          ) : (
                            <div className="flex items-center gap-1">
                              <span className="px-1.5 py-0.5 bg-slate-100 dark:bg-zinc-800 text-slate-450 rounded text-[8px] font-extrabold uppercase">
                                Pending
                              </span>
                              <button
                                onClick={() => handleQuickCheckin(client.id)}
                                className="p-1 hover:bg-emerald-505/10 text-slate-450 hover:text-emerald-505 rounded-lg transition-colors cursor-pointer"
                                title="Quick check in"
                              >
                                <LogIn className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400 text-[11px] italic">No athletes match.</div>
                )}
              </div>
            </div>

          </div>

          {/* Filtering Card Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left space-y-4 no-print">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-500" /> Filter Check-ins
            </h3>
            
            {/* Filter Date */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-450 dark:text-zinc-500 block mb-1 uppercase tracking-wider">Filter Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-850 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200"
              />
            </div>

            {/* Filter Member Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-455 dark:text-zinc-500 block mb-1 uppercase tracking-wider">Filter Member</label>
              <select
                value={filterMember}
                onChange={(e) => setFilterMember(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-850 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-805 dark:text-zinc-200"
              >
                <option value="All">All Members</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Batch Dropdown */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-455 dark:text-zinc-500 block mb-1 uppercase tracking-wider">Filter Training Batch</label>
              <select
                value={filterBatch}
                onChange={(e) => setFilterBatch(e.target.value)}
                className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-850 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-805 dark:text-zinc-200"
              >
                <option value="All">All Batches</option>
                <option value="Weight Loss Batch">Weight Loss Batch</option>
                <option value="Strength Training">Strength Training</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Muscle Hypertrophy">Muscle Hypertrophy</option>
                <option value="CrossFit Circuit">CrossFit Circuit</option>
              </select>
            </div>

            {/* Filter Search String */}
            <div>
              <label className="text-[10px] font-extrabold text-slate-455 dark:text-zinc-500 block mb-1 uppercase tracking-wider">Search Name</label>
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Type name..."
                  value={searchMemberQuery}
                  onChange={(e) => setSearchMemberQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-zinc-850 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200"
                />
              </div>
            </div>

            {/* Clear filters buttons */}
            {(filterDate || filterMember !== "All" || filterBatch !== "All" || searchMemberQuery) && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterMember("All");
                  setFilterBatch("All");
                  setSearchMemberQuery("");
                }}
                className="w-full py-2 bg-rose-50 hover:bg-rose-500 text-rose-500 hover:text-white font-bold text-[10px] uppercase rounded-xl transition-all cursor-pointer border border-rose-105 dark:border-rose-900/25 flex items-center justify-center gap-1.5"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Filters</span>
              </button>
            )}

          </div>

          {/* Historical check-in log table card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col h-[420px]">
            <div className="flex justify-between items-center mb-3 pb-2 border-b border-slate-50 dark:border-zinc-850">
              <h3 className="text-xs font-bold text-slate-455 dark:text-zinc-400 uppercase tracking-wider text-left">
                Check-In History Feed
              </h3>
              <span className="text-[8px] font-black text-slate-400 bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md">
                {filteredAttendance.length} Logs
              </span>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-thin select-none text-left">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((log) => {
                  const client = clients.find(c => c.id === log.clientId);
                  const clientBatch = getClientBatch(client);
                  const checkout = getCheckoutTime(log);
                  const isCheckedOut = log.status !== "Absent" && (checkouts[`${log.clientId}-${log.date}`] || checkout !== "—");

                  return (
                    <div key={log.id} className="p-3 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 transition flex justify-between items-start gap-2.5 hover:shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={client?.photo} className="w-9 h-9 rounded-xl object-cover shrink-0 shadow-sm bg-slate-100" />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-805 dark:text-zinc-150 text-xs truncate leading-snug">{client?.name}</h4>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block truncate">{clientBatch}</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block font-medium mt-0.5">{log.date}</span>
                        </div>
                      </div>
                      
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                          log.status === "Present" ? "bg-emerald-500/10 text-emerald-505" :
                          log.status === "Late" ? "bg-amber-500/10 text-amber-505" :
                          "bg-red-500/10 text-red-500"
                        }`}>
                          {log.status}
                        </span>
                        {log.status !== "Absent" && (
                          <div className="text-[8px] text-slate-455 dark:text-zinc-500 font-semibold leading-normal">
                            <div>In: {log.timeIn}</div>
                            {isCheckedOut && <div>Out: {checkouts[`${log.clientId}-${log.date}`] || checkout}</div>}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-12 text-slate-400 italic text-xs">
                  No attendance records matched the search filters.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Attendance;
