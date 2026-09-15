import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Search,
  User,
  CheckCircle2,
  XCircle,
  Clock,
  Clock3,
  Calendar,
  X,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Award,
  Sparkles,
  CalendarDays,
  Users,
  Check,
  Ban,
  RotateCcw,
  Eye,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { SkeletonLoader, EmptyState } from "../components/FeedbackStates";

const Attendance = () => {
  const { 
    clients, 
    attendance, 
    markClientAttendance, 
    deleteClientAttendance,
    fetchAttendance, 
    loading 
  } = useCRM();

  // Current real date (YYYY-MM-DD)
  const todayStr = useMemo(() => new Date().toISOString().split("T")[0], []);
  
  // Selected Date state (defaults to today)
  const [selectedDate, setSelectedDate] = useState(todayStr);

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Status Filter state: 'all', 'present', 'absent', 'unmarked'
  const [statusFilter, setStatusFilter] = useState("all");

  // Modal target client for monthly history inspection
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalMonth, setModalMonth] = useState(() => new Date().toISOString().slice(0, 7)); // 'YYYY-MM'

  // Fetch all attendance records on mount
  useEffect(() => {
    fetchAttendance();
  }, []);

  // Quick Date Navigation Handlers
  const handlePrevDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() - 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleNextDay = () => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + 1);
    setSelectedDate(d.toISOString().split("T")[0]);
  };

  const handleJumpToToday = () => {
    setSelectedDate(todayStr);
  };

  // Helper: Client lifetime attendance rate calculation
  const getClientOverallAttendance = (clientId) => {
    const clientLogs = (attendance || []).filter((a) => a.clientId === clientId);
    if (clientLogs.length === 0) return null;
    const presentCount = clientLogs.filter((a) => a.status === "Present" || a.status === "Late").length;
    return Math.round((presentCount / clientLogs.length) * 100);
  };

  // Handle marking attendance
  const handleMarkAttendance = async (client, status) => {
    const defaultTime = status === "Present" || status === "Late" 
      ? new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) 
      : "-";

    const toastId = toast.loading(`Marking ${client.name} as ${status}...`);
    try {
      await markClientAttendance(client.id, selectedDate, status, defaultTime);
      toast.success(`${client.name} marked as ${status} for ${selectedDate}.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to mark attendance: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  // Handle clearing attendance record
  const handleClearAttendance = async (client, logId) => {
    if (!logId) return;
    const toastId = toast.loading(`Clearing record for ${client.name}...`);
    try {
      if (deleteClientAttendance) {
        await deleteClientAttendance(logId, client.id);
      }
      toast.success(`Cleared attendance for ${client.name}.`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to clear log: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  // Calculate selected date summary metrics
  const dateSummary = useMemo(() => {
    const total = (clients || []).length;
    const dateLogs = (attendance || []).filter((a) => a.date === selectedDate);
    
    let present = 0;
    let late = 0;
    let absent = 0;

    dateLogs.forEach((a) => {
      if (a.status === "Present") present++;
      else if (a.status === "Late") late++;
      else if (a.status === "Absent") absent++;
    });

    const totalMarked = present + late + absent;
    const unmarked = Math.max(0, total - totalMarked);
    const presentTotal = present + late;
    const attendancePct = total > 0 ? Math.round((presentTotal / total) * 100) : 0;

    return {
      total,
      present: presentTotal,
      absent,
      unmarked,
      attendancePct
    };
  }, [clients, attendance, selectedDate]);

  // Process and filter clients list
  const processedClients = useMemo(() => {
    let result = [...(clients || [])];

    // 1. Search Query (Name, Phone, Goal, Membership)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (c) =>
          (c.name || "").toLowerCase().includes(q) ||
          (c.phone || "").includes(q) ||
          (c.goal || "").toLowerCase().includes(q) ||
          (c.membership || "").toLowerCase().includes(q)
      );
    }

    // 2. Status Filter for Selected Date
    if (statusFilter !== "all") {
      result = result.filter((client) => {
        const log = (attendance || []).find((a) => a.clientId === client.id && a.date === selectedDate);
        const status = log ? log.status : "unmarked";

        if (statusFilter === "present") return status === "Present" || status === "Late";
        if (statusFilter === "absent") return status === "Absent";
        if (statusFilter === "unmarked") return !log;
        return true;
      });
    }

    return result;
  }, [clients, attendance, selectedDate, searchQuery, statusFilter]);

  // Format date header string
  const formattedSelectedDate = useMemo(() => {
    try {
      const parts = selectedDate.split("-");
      const d = new Date(parts[0], parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
    } catch {
      return selectedDate;
    }
  }, [selectedDate]);

  const isTodaySelected = selectedDate === todayStr;

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12 text-left">
      
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-50 tracking-tight">
              Attendance Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200/50 dark:border-blue-800/40">
              {clients.length} Clients
            </span>
          </div>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">
            Track daily client check-ins, record present/absent statuses, and monitor consistency trends.
          </p>
        </div>

        {/* Date Selector Navigation Bar */}
        <div className="flex items-center gap-1.5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-1.5 shadow-sm">
          <button
            onClick={handlePrevDay}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl transition cursor-pointer"
            title="Previous Day"
          >
            <ChevronLeft className="w-4 h-4 shrink-0" />
          </button>

          <div className="flex items-center gap-2 px-2">
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="bg-transparent text-xs font-black text-slate-800 dark:text-zinc-100 focus:outline-none cursor-pointer"
            />
          </div>

          <button
            onClick={handleNextDay}
            className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl transition cursor-pointer"
            title="Next Day"
          >
            <ChevronRight className="w-4 h-4 shrink-0" />
          </button>

          <button
            onClick={handleJumpToToday}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              isTodaySelected
                ? "bg-blue-600 text-white shadow-sm"
                : "bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 text-slate-700 dark:text-zinc-300"
            }`}
            title="Jump to Today"
          >
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span>Today</span>
          </button>
        </div>
      </div>

      {/* Selected Date Metrics Summary Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {/* Present Card */}
        <div className="bg-white dark:bg-zinc-900 border border-emerald-200/80 dark:border-emerald-900/30 rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Present Today
            </span>
            <div className="w-7 h-7 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
              <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 font-display">
              {dateSummary.present}
            </span>
            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
              ({dateSummary.attendancePct}%)
            </span>
          </div>
        </div>

        {/* Absent Card */}
        <div className="bg-white dark:bg-zinc-900 border border-rose-200/80 dark:border-rose-900/30 rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-600 dark:text-rose-400">
              Absent
            </span>
            <div className="w-7 h-7 rounded-xl bg-rose-500/10 text-rose-600 dark:text-rose-400 flex items-center justify-center border border-rose-500/20">
              <XCircle className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 font-display">
              {dateSummary.absent}
            </span>
            <span className="text-[10px] font-bold text-rose-500">
              ({dateSummary.total > 0 ? Math.round((dateSummary.absent / dateSummary.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Unmarked Card */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 dark:text-zinc-400">
              Not Marked
            </span>
            <div className="w-7 h-7 rounded-xl bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 flex items-center justify-center">
              <Clock3 className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 font-display">
              {dateSummary.unmarked}
            </span>
            <span className="text-[10px] font-bold text-slate-400">
              ({dateSummary.total > 0 ? Math.round((dateSummary.unmarked / dateSummary.total) * 100) : 0}%)
            </span>
          </div>
        </div>

        {/* Total Roster Card */}
        <div className="bg-white dark:bg-zinc-900 border border-blue-200/80 dark:border-blue-900/30 rounded-3xl p-4 shadow-sm space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Total Clients
            </span>
            <div className="w-7 h-7 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
              <Users className="w-3.5 h-3.5 shrink-0" />
            </div>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-black text-slate-900 dark:text-zinc-50 font-display">
              {dateSummary.total}
            </span>
            <span className="text-[10px] font-bold text-blue-500">
              Active Roster
            </span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search Controls */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-zinc-800">
          {[
            { id: "all", label: "All Clients", count: dateSummary.total },
            { id: "present", label: "Present", count: dateSummary.present },
            { id: "absent", label: "Absent", count: dateSummary.absent },
            { id: "unmarked", label: "Not Marked", count: dateSummary.unmarked }
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                  isActive
                    ? "border-blue-600 text-blue-600 dark:text-blue-400 bg-blue-50/50 dark:bg-blue-900/10 rounded-t-xl"
                    : "border-transparent text-slate-500 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isActive
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-400"
                }`}>
                  {tab.count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search Input Bar */}
        <div className="flex items-center justify-between gap-4">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 shrink-0 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by client name, phone, or fitness goal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "42px", paddingRight: "36px" }}
              className="w-full py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                aria-label="Clear search query"
                title="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer p-1 inline-flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5 shrink-0" />
              </button>
            )}
          </div>

          <div className="text-xs font-bold text-slate-400 dark:text-zinc-500 whitespace-nowrap">
            Showing for: <span className="text-slate-700 dark:text-zinc-300 font-extrabold">{formattedSelectedDate}</span>
          </div>
        </div>
      </div>

      {/* Main Content: Table on Desktop, Cards on Mobile */}
      {loading ? (
        <SkeletonLoader type="table" count={5} />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-soft">
          
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] bg-slate-50/60 dark:bg-zinc-950/40">
                  <th className="py-4 px-5">Client Name & Info</th>
                  <th className="py-4 px-5">Date Status</th>
                  <th className="py-4 px-5">Check-in Time</th>
                  <th className="py-4 px-5">Overall Consistency</th>
                  <th className="py-4 px-5 text-right">Attendance Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800">
                {processedClients.length > 0 ? (
                  processedClients.map((client) => {
                    const log = (attendance || []).find((a) => a.clientId === client.id && a.date === selectedDate);
                    const status = log ? log.status : null;
                    const overallPct = getClientOverallAttendance(client.id);

                    return (
                      <tr 
                        key={client.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/20 transition-colors"
                      >
                        {/* Client Info */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3">
                            <img
                              src={client.photo}
                              alt={client.name}
                              className="w-10 h-10 rounded-xl object-cover bg-slate-100 border border-slate-200/50 dark:border-zinc-800 shrink-0"
                            />
                            <div className="min-w-0">
                              <span className="font-extrabold text-slate-900 dark:text-zinc-100 text-sm block leading-tight">
                                {client.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 mt-1">
                                <span className="font-semibold text-blue-600 dark:text-blue-400">
                                  {client.goal || "General Fitness"}
                                </span>
                                <span>•</span>
                                <span>{client.membership || "Standard"}</span>
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Status Badge */}
                        <td className="py-3.5 px-5">
                          {status === "Present" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                              <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                              <span>Present</span>
                            </span>
                          ) : status === "Late" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                              <Clock className="w-3 h-3 text-amber-500 shrink-0" />
                              <span>Late Entry</span>
                            </span>
                          ) : status === "Absent" ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
                              <XCircle className="w-3 h-3 text-rose-500 shrink-0" />
                              <span>Absent</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider bg-slate-100 dark:bg-zinc-800 text-slate-500 dark:text-zinc-400 border border-slate-200 dark:border-zinc-700">
                              <Clock3 className="w-3 h-3 text-slate-400 shrink-0" />
                              <span>Not Marked</span>
                            </span>
                          )}
                        </td>

                        {/* Check-in Time */}
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-700 dark:text-zinc-300 text-xs">
                            {log?.timeIn && log?.timeIn !== "-" ? log.timeIn : "—"}
                          </span>
                        </td>

                        {/* Overall Attendance Percentage */}
                        <td className="py-3.5 px-5">
                          {overallPct !== null ? (
                            <div className="flex items-center gap-2.5">
                              <div className="w-16 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                                <div
                                  className={`h-full rounded-full transition-all duration-300 ${
                                    overallPct >= 75 ? "bg-emerald-500" : overallPct >= 50 ? "bg-amber-500" : "bg-rose-500"
                                  }`}
                                  style={{ width: `${Math.min(overallPct, 100)}%` }}
                                />
                              </div>
                              <span className="font-black text-slate-700 dark:text-zinc-300 text-[11px]">
                                {overallPct}%
                              </span>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400 italic">No historical logs</span>
                          )}
                        </td>

                        {/* Action Buttons */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Mark Present */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(client, "Present")}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                status === "Present"
                                  ? "bg-emerald-600 text-white shadow-sm"
                                  : "bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                              }`}
                              title="Mark Present"
                            >
                              <Check className="w-3 h-3 shrink-0" />
                              <span>Present</span>
                            </button>

                            {/* Mark Absent */}
                            <button
                              type="button"
                              onClick={() => handleMarkAttendance(client, "Absent")}
                              className={`px-3 py-1.5 rounded-xl text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                                status === "Absent"
                                  ? "bg-rose-600 text-white shadow-sm"
                                  : "bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                              }`}
                              title="Mark Absent"
                            >
                              <X className="w-3 h-3 shrink-0" />
                              <span>Absent</span>
                            </button>

                            {/* Inspect Month / History */}
                            <button
                              type="button"
                              onClick={() => setSelectedClient(client)}
                              aria-label={`View monthly calendar for ${client.name}`}
                              title="View Monthly Calendar"
                              className="p-1.5 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer inline-flex items-center justify-center"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="5" className="p-0 border-none">
                      <EmptyState
                        title="No Clients Found"
                        description="Try modifying search keywords or clearing active filters."
                        actionText="Reset All Filters"
                        onAction={() => {
                          setSearchQuery("");
                          setStatusFilter("all");
                        }}
                        icon={CalendarDays}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
            {processedClients.length > 0 ? (
              processedClients.map((client) => {
                const log = (attendance || []).find((a) => a.clientId === client.id && a.date === selectedDate);
                const status = log ? log.status : null;
                const overallPct = getClientOverallAttendance(client.id);

                return (
                  <div key={client.id} className="p-4 space-y-3">
                    {/* Top Row: Avatar, Name, Status Badge */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3 min-w-0">
                        <img
                          src={client.photo}
                          alt={client.name}
                          className="w-11 h-11 rounded-xl object-cover bg-slate-100 border border-slate-200/50 dark:border-zinc-800 shrink-0"
                        />
                        <div className="min-w-0">
                          <span className="font-bold text-slate-900 dark:text-zinc-100 text-sm block leading-tight truncate">
                            {client.name}
                          </span>
                          <span className="text-[10px] text-blue-600 dark:text-blue-400 font-semibold block mt-0.5">
                            {client.goal || "General Fitness"}
                          </span>
                        </div>
                      </div>

                      <div className="shrink-0">
                        {status === "Present" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                            Present
                          </span>
                        ) : status === "Absent" ? (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-600 border border-rose-500/20">
                            Absent
                          </span>
                        ) : (
                          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 dark:bg-zinc-800 text-slate-500">
                            Unmarked
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Meta Row: Time In, Overall Rate */}
                    <div className="grid grid-cols-2 gap-2 text-xs bg-slate-50 dark:bg-zinc-950/40 p-2.5 rounded-xl border border-slate-100 dark:border-zinc-800">
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Check-in Time</span>
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] block mt-0.5">
                          {log?.timeIn && log?.timeIn !== "-" ? log.timeIn : "—"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 uppercase font-bold block">Consistency</span>
                        <span className="font-semibold text-slate-700 dark:text-zinc-300 text-[11px] block mt-0.5">
                          {overallPct !== null ? `${overallPct}% Rate` : "No logs"}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(client, "Present")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          status === "Present"
                            ? "bg-emerald-600 text-white"
                            : "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40"
                        }`}
                      >
                        <Check className="w-3.5 h-3.5 shrink-0" />
                        <span>Present</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleMarkAttendance(client, "Absent")}
                        className={`flex-1 py-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                          status === "Absent"
                            ? "bg-rose-600 text-white"
                            : "bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40"
                        }`}
                      >
                        <X className="w-3.5 h-3.5 shrink-0" />
                        <span>Absent</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setSelectedClient(client)}
                        aria-label={`View history for ${client.name}`}
                        className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl inline-flex items-center justify-center"
                        title="View Full History"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No Clients Found"
                  description="No clients match your filter criteria."
                  actionText="Clear Filters"
                  onAction={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                  }}
                  icon={CalendarDays}
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* --- CLIENT MONTHLY ATTENDANCE DETAIL MODAL --- */}
      {selectedClient && (() => {
        const client = selectedClient;
        const clientLogs = (attendance || []).filter((a) => a.clientId === client.id);
        const presentCount = clientLogs.filter((a) => a.status === "Present" || a.status === "Late").length;
        const absentCount = clientLogs.filter((a) => a.status === "Absent").length;
        const totalLogs = clientLogs.length;
        const overallRate = totalLogs > 0 ? Math.round((presentCount / totalLogs) * 100) : 0;

        // Parse modal month
        const [yearStr, monthStr] = modalMonth.split("-");
        const year = parseInt(yearStr, 10);
        const month = parseInt(monthStr, 10); // 1-indexed
        const daysInMonth = new Date(year, month, 0).getDate();
        const startDayOffset = new Date(year, month - 1, 1).getDay(); // 0 = Sun

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-zinc-800 pb-4">
                <div className="flex items-center gap-3">
                  <img
                    src={client.photo}
                    alt={client.name}
                    className="w-12 h-12 rounded-2xl object-cover bg-slate-100 border border-slate-200/50 shrink-0"
                  />
                  <div>
                    <h3 className="text-base font-black text-slate-900 dark:text-zinc-50 leading-tight">
                      {client.name}
                    </h3>
                    <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-0.5">
                      {client.membership} • {client.goal}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  aria-label="Close monthly history modal"
                  className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-xl transition cursor-pointer inline-flex items-center justify-center"
                >
                  <X className="w-5 h-5 shrink-0" />
                </button>
              </div>

              {/* Stats Counters */}
              <div className="grid grid-cols-3 gap-3 text-center text-xs">
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Consistency</span>
                  <span className="text-base font-black text-blue-600 dark:text-blue-400 mt-0.5 block">{overallRate}%</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Present</span>
                  <span className="text-base font-black text-emerald-600 mt-0.5 block">{presentCount} Days</span>
                </div>
                <div className="p-3 bg-slate-50 dark:bg-zinc-950/40 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                  <span className="text-[9px] font-bold text-slate-400 uppercase block">Absent</span>
                  <span className="text-base font-black text-rose-500 mt-0.5 block">{absentCount} Days</span>
                </div>
              </div>

              {/* Month Selector */}
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Monthly Grid View
                </span>
                <input
                  type="month"
                  value={modalMonth}
                  onChange={(e) => setModalMonth(e.target.value)}
                  className="px-2 py-1 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 font-bold text-slate-800 dark:text-zinc-200"
                />
              </div>

              {/* Calendar Grid */}
              <div className="space-y-2 p-3 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-200 dark:border-zinc-800 rounded-2xl">
                {/* Weekday headers */}
                <div className="grid grid-cols-7 gap-1 text-center text-[9px] font-black text-slate-400 uppercase">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>

                {/* Day Cells */}
                <div className="grid grid-cols-7 gap-1">
                  {Array.from({ length: startDayOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-square" />
                  ))}
                  {Array.from({ length: daysInMonth }).map((_, idx) => {
                    const dayNum = idx + 1;
                    const dateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
                    const log = clientLogs.find((a) => a.date === dateStr);

                    let cellStyle = "bg-white dark:bg-zinc-900 border-slate-200/60 dark:border-zinc-800 text-slate-500";
                    if (log?.status === "Present") cellStyle = "bg-emerald-500/20 border-emerald-500/40 text-emerald-600 dark:text-emerald-400 font-black";
                    if (log?.status === "Late") cellStyle = "bg-amber-500/20 border-amber-500/40 text-amber-600 dark:text-amber-400 font-black";
                    if (log?.status === "Absent") cellStyle = "bg-rose-500/20 border-rose-500/40 text-rose-500 font-black";

                    return (
                      <div
                        key={dayNum}
                        className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-[10px] transition select-none ${cellStyle}`}
                        title={log ? `${dateStr}: ${log.status} (${log.timeIn || "-"})` : dateStr}
                      >
                        <span>{dayNum}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Legend */}
                <div className="flex gap-4 justify-center items-center pt-2 border-t border-slate-200 dark:border-zinc-800 text-[10px] font-bold">
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" /><span>Present</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30" /><span>Late</span></div>
                  <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/30" /><span>Absent</span></div>
                </div>
              </div>

              {/* Close Action */}
              <div className="pt-2 border-t border-slate-100 dark:border-zinc-800">
                <button
                  type="button"
                  onClick={() => setSelectedClient(null)}
                  className="w-full py-2.5 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Close History
                </button>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Attendance;
