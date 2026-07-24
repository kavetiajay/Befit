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
  FileDown
} from "lucide-react";
import { toast } from "sonner";

const Attendance = () => {
  const todayStr = "2026-07-22"; // Anchor date to match mockup database
  const { clients, attendance, markClientAttendance, settings } = useCRM();

  // Selected states for logger
  const [clientIdInput, setClientIdInput] = useState(clients[0]?.id || "");
  const [dateInput, setDateInput] = useState(new Date().toISOString().split("T")[0]);
  const [statusInput, setStatusInput] = useState("Present");
  const [timeInInput, setTimeInInput] = useState("08:00 AM");
  const [timeOutInput, setTimeOutInput] = useState("09:30 AM");

  // Filter States
  const [filterDate, setFilterDate] = useState("");
  const [filterMember, setFilterMember] = useState("All");
  const [filterBatch, setFilterBatch] = useState("All");

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

  // Processed Historical Logs (filtered by Date, Member, Batch)
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

      return true;
    });
  }, [attendance, filterDate, filterMember, filterBatch, clients]);

  // Summary Metrics based on filters (or overall if unfiltered)
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

  // Today's Attendance summary data (using todayStr)
  const todaySummary = useMemo(() => {
    const todayLogs = attendance.filter(a => a.date === todayStr);
    const present = todayLogs.filter(a => a.status === "Present").length;
    const late = todayLogs.filter(a => a.status === "Late").length;
    const absent = todayLogs.filter(a => a.status === "Absent").length;
    const totalExpected = clients.length;
    const pending = totalExpected - (present + late + absent);

    return { present, late, absent, pending, totalExpected };
  }, [attendance, clients]);

  // Selected date logs for Calendar detail summary
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


  // Export Trigger Simulation
  const handleExportMonthlyReport = () => {
    toast.success("Monthly attendance report compiled and downloaded successfully as CSV!");
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Page Header */}
      <div className="hidden lg:flex justify-between items-center border-b border-slate-100 dark:border-zinc-800 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Attendance Center
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Log check-in and check-out intervals, check schedules, and monitor streak multipliers.
          </p>
        </div>
        <button
          onClick={handleExportMonthlyReport}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-205 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-semibold text-slate-650 dark:text-zinc-400 transition cursor-pointer"
        >
          <FileDown className="w-4 h-4" />
          <span>Export Monthly Report</span>
        </button>
      </div>

      {/* Summary Metrics Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 no-print">
        {[
          { title: "Attendance Rate", val: `${summary.rate}%`, desc: "Checked present/late", icon: Percent, color: "text-blue-650 bg-blue-500/5 border-blue-100/50" },
          { title: "Present Days", val: `${summary.present} Days`, desc: "On-time scan entries", icon: CheckCircle, color: "text-emerald-600 bg-emerald-500/5 border-emerald-100/50" },
          { title: "Absent Days", val: `${summary.absent} Days`, desc: "Missed training blocks", icon: XCircle, color: "text-rose-600 bg-rose-500/5 border-rose-100/50" },
          { title: "Late Entries", val: `${summary.late} Logs`, desc: "Arrived after start time", icon: Clock, color: "text-amber-600 bg-amber-500/5 border-amber-100/50" },
          { title: "Active Streak", val: `${summary.streak} Days`, desc: "Consecutive check-ins", icon: Sparkles, color: "text-purple-600 bg-purple-500/5 border-purple-100/50" }
        ].map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 hover:shadow-md transition-all duration-300 relative text-left last:col-span-2 lg:last:col-span-1"
            >
              <div className="flex justify-between items-start">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center ${stat.color}`}>
                  <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
                </div>
              </div>
              <div className="mt-4">
                <h3 className="text-xl font-black font-display text-slate-900 dark:text-zinc-55 leading-none">
                  {stat.val}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-bold text-slate-400 dark:text-zinc-500 mt-2 uppercase tracking-wider">
                  {stat.title}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column (2/3 width on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Attendance Calendar Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/85 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-50 dark:border-zinc-850">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">Attendance Calendar</h3>
                <p className="text-xs text-slate-400">Click any date to see that day's checked-in athlete logs</p>
              </div>
              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 px-3 py-1 rounded-xl">July 2026</span>
            </div>

            {/* Weekdays Row */}
            <div className="grid grid-cols-7 gap-2 text-center font-black text-[10px] text-slate-400 dark:text-zinc-500 uppercase mb-3">
              <span>Sun</span><span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span>
            </div>

            {/* Grid Days */}
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: calendarDays.startOffset }).map((_, i) => (
                <div key={`offset-${i}`} className="h-12" />
              ))}

              {calendarDays.days.map((dayData) => {
                const logs = dayData.logs;
                const hasAbsent = logs.some(l => l.status === "Absent");
                const hasLate = logs.some(l => l.status === "Late");
                const hasPresent = logs.some(l => l.status === "Present");

                let dotColor = "";
                if (hasAbsent) dotColor = "bg-rose-500";
                else if (hasLate) dotColor = "bg-amber-500";
                else if (hasPresent) dotColor = "bg-emerald-500";

                const isSelected = selectedCalendarDate === dayData.dateStr;
                const isAnchorToday = dayData.day === 22; // July 22, 2026 is today

                return (
                  <div
                    key={dayData.day}
                    onClick={() => setSelectedCalendarDate(dayData.dateStr)}
                    className={`h-12 rounded-2xl flex flex-col items-center justify-center relative cursor-pointer select-none transition-all duration-150 ${
                      isSelected 
                        ? "bg-blue-600 text-white font-extrabold shadow-md shadow-blue-500/10 scale-105" 
                        : isAnchorToday 
                        ? "bg-blue-50 dark:bg-blue-900/15 border border-blue-200 text-blue-600 dark:text-blue-400 font-extrabold" 
                        : "hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-700 dark:text-zinc-350 text-xs font-semibold border border-slate-100 dark:border-zinc-850/50"
                    }`}
                  >
                    <span>{dayData.day}</span>
                    {dotColor && (
                      <span className={`w-1.5 h-1.5 rounded-full absolute bottom-1.5 ${isSelected ? "bg-white" : dotColor}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected Date Summary details box */}
            <div className="mt-6 p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-150/60 dark:border-zinc-850 rounded-2xl space-y-3">
              <div className="flex justify-between items-center border-b pb-2 mb-2 border-slate-100 dark:border-zinc-850">
                <span className="text-xs font-bold text-slate-700 dark:text-zinc-250">Check-in Logs for {selectedCalendarDate}</span>
                <span className="text-[10px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded-full">
                  {selectedDateLogs.length} Checked In
                </span>
              </div>
              <div className="space-y-2 max-h-36 overflow-y-auto">
                {selectedDateLogs.length > 0 ? (
                  selectedDateLogs.map((log) => {
                    const client = clients.find(c => c.id === log.clientId);
                    return (
                      <div key={log.id} className="flex justify-between items-center text-xs">
                        <div className="flex items-center gap-2">
                          <img src={client?.photo} className="w-6 h-6 rounded-full object-cover shadow-sm bg-slate-100 border" />
                          <span className="font-bold text-slate-800 dark:text-zinc-200">{client?.name}</span>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-slate-400 text-[10px]">In: {log.timeIn} | Out: {getCheckoutTime(log)}</span>
                          <span className={`px-2 py-0.2 rounded text-[9px] font-bold ${
                            log.status === "Present" ? "bg-emerald-500/10 text-emerald-500" :
                            log.status === "Late" ? "bg-amber-500/10 text-amber-500" :
                            "bg-red-500/10 text-red-500"
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-4 text-slate-400 text-xs italic">No check-in entries logged on this date.</div>
                )}
              </div>
            </div>

          </div>

          {/* Mark Attendance Logger Form */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left no-print">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
              <Plus className="w-4 h-4 text-blue-500" /> Log Custom Member check-in & check-out
            </h3>
            <form onSubmit={handleMarkAttendanceSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">Select Athlete</label>
                <select
                  value={clientIdInput}
                  onChange={(e) => setClientIdInput(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 text-xs focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-450 block mb-1">Log Date</label>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={(e) => setDateInput(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none"
                    required
                  />
                </div>
                {statusInput !== "Absent" && (
                  <>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">Check-in Time</label>
                      <input
                        type="text"
                        value={timeInInput}
                        onChange={(e) => setTimeInInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none"
                        placeholder="e.g. 08:00 AM"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold text-slate-450 block mb-1">Check-out Time</label>
                      <input
                        type="text"
                        value={timeOutInput}
                        onChange={(e) => setTimeOutInput(e.target.value)}
                        className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none"
                        placeholder="e.g. 09:30 AM"
                      />
                    </div>
                  </>
                )}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-450 block mb-1">Attendance Status</label>
                <div className="grid grid-cols-3 gap-2">
                  {["Present", "Late", "Absent"].map((status) => {
                    const isActive = statusInput === status;
                    return (
                      <button
                        key={status}
                        type="button"
                        onClick={() => setStatusInput(status)}
                        className={`py-2 text-xs font-bold border rounded-xl transition cursor-pointer ${
                          isActive
                            ? "bg-blue-600 border-blue-600 text-white shadow-sm"
                            : "border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-950 text-slate-600 dark:text-zinc-400"
                        }`}
                      >
                        {status}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
              >
                Save Attendance Entry
              </button>
            </form>
          </div>

          {/* Monthly Report Summary Metrics Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-55 dark:border-zinc-850">
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Monthly Status Summary</h3>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-500 px-2 py-0.5 rounded-full font-black">July Report</span>
            </div>
            <div className="grid grid-cols-3 gap-3 text-center text-xs">
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Present Count</span>
                <span className="text-lg font-black text-emerald-600 mt-1 block">{summary.present}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Late Count</span>
                <span className="text-lg font-black text-amber-600 mt-1 block">{summary.late}</span>
              </div>
              <div className="p-3 bg-slate-50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl">
                <span className="text-[9px] text-slate-400 block font-bold uppercase tracking-wider">Absent Count</span>
                <span className="text-lg font-black text-rose-500 mt-1 block">{summary.absent}</span>
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center text-xs border-t border-slate-100 dark:border-zinc-850/60 pt-3.5">
              <span className="text-slate-450">Active Monitored Logs</span>
              <span className="font-bold text-slate-700 dark:text-zinc-300">{summary.total} Records logged</span>
            </div>
          </div>

        </div>

        {/* Right Column: Attendance History and Filter panels (1/3 width) */}
        <div className="space-y-6">
          
          {/* Today's Attendance Summary Card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200 mb-1">Today's Attendance Summary</h3>
            <p className="text-[10px] text-slate-400 mb-4">Checked slots for {todayStr}</p>
            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Expected Attendance Density</span>
                <span className="font-extrabold text-slate-800 dark:text-zinc-200">{todaySummary.totalExpected} Members</span>
              </div>
              <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${(todaySummary.present / todaySummary.totalExpected) * 100}%` }} title="Present" />
                <div className="h-full bg-amber-500" style={{ width: `${(todaySummary.late / todaySummary.totalExpected) * 100}%` }} title="Late" />
                <div className="h-full bg-rose-500" style={{ width: `${(todaySummary.absent / todaySummary.totalExpected) * 100}%` }} title="Absent" />
              </div>
              <div className="grid grid-cols-4 gap-2 text-center pt-2 text-[10px] font-bold">
                <div className="text-emerald-600">P: {todaySummary.present}</div>
                <div className="text-amber-600">L: {todaySummary.late}</div>
                <div className="text-rose-500">A: {todaySummary.absent}</div>
                <div className="text-slate-400">Left: {todaySummary.pending}</div>
              </div>
            </div>
          </div>

          {/* Filtering bar section card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left space-y-4 no-print">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Filter className="w-4 h-4 text-blue-500" /> Filter Check-ins
            </h3>
            
            {/* Filter Date */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Filter Date</label>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => { setFilterDate(e.target.value); }}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none"
              />
            </div>

            {/* Filter Member */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Filter Member</label>
              <select
                value={filterMember}
                onChange={(e) => { setFilterMember(e.target.value); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-805"
              >
                <option value="All">All Members</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            {/* Filter Batch */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 block mb-1">Filter Training Batch</label>
              <select
                value={filterBatch}
                onChange={(e) => { setFilterBatch(e.target.value); }}
                className="w-full px-3 py-2.5 border border-slate-200 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-805"
              >
                <option value="All">All Batches</option>
                <option value="Weight Loss Batch">Weight Loss Batch</option>
                <option value="Strength Training">Strength Training</option>
                <option value="General Fitness">General Fitness</option>
                <option value="Muscle Hypertrophy">Muscle Hypertrophy</option>
                <option value="CrossFit Circuit">CrossFit Circuit</option>
              </select>
            </div>

            {/* Clear filters buttons */}
            {(filterDate || filterMember !== "All" || filterBatch !== "All") && (
              <button
                onClick={() => {
                  setFilterDate("");
                  setFilterMember("All");
                  setFilterBatch("All");
                }}
                className="w-full py-2 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border border-red-100/30"
              >
                Reset Filters
              </button>
            )}

          </div>

          {/* Historical check-in log table card */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col h-[400px]">
            <h3 className="text-xs font-bold text-slate-455 uppercase tracking-wider mb-3 pb-2 border-b border-slate-50 dark:border-zinc-850 text-left">
              Historical Check-In Feed
            </h3>
            <div className="flex-1 overflow-y-auto space-y-3.5 pr-1 scrollbar-none select-none text-left">
              {filteredAttendance.length > 0 ? (
                filteredAttendance.map((log) => {
                  const client = clients.find(c => c.id === log.clientId);
                  const clientBatch = getClientBatch(client);
                  return (
                    <div key={log.id} className="p-3 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 transition flex justify-between items-start gap-2.5">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img src={client?.photo} className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm bg-slate-100" />
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-805 dark:text-zinc-150 text-xs truncate">{client?.name}</h4>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-bold block mt-0.5 truncate">{clientBatch}</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block font-medium mt-0.2">{log.date}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                        <span className={`px-2 py-0.2 rounded text-[8px] font-black uppercase ${
                          log.status === "Present" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                          log.status === "Late" ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                          "bg-red-500/10 text-red-500 border border-red-500/20"
                        }`}>
                          {log.status}
                        </span>
                        {log.status !== "Absent" && (
                          <div className="text-[8.5px] text-slate-450 dark:text-zinc-500 font-medium">
                            <div>In: {log.timeIn}</div>
                            <div>Out: {getCheckoutTime(log)}</div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="text-center py-10 text-slate-400 italic text-xs">No attendance logs match the active filter.</div>
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
};

export default Attendance;
