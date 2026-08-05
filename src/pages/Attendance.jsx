import React, { useState, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Search,
  User,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  X,
  Plus
} from "lucide-react";
import { toast } from "sonner";

const Attendance = () => {
  const todayStr = "2026-07-22"; // Anchor date to match database
  const { clients, attendance, markClientAttendance } = useCRM();

  // Search input state
  const [searchQuery, setSearchQuery] = useState("");

  // Modal target client state
  const [selectedClient, setSelectedClient] = useState(null);

  // History query date state
  const [historyDate, setHistoryDate] = useState(todayStr);

  // Filter clients by search keyword
  const filteredClients = useMemo(() => {
    if (!searchQuery.trim()) return clients;
    const q = searchQuery.toLowerCase();
    return clients.filter((c) => c.name.toLowerCase().includes(q));
  }, [clients, searchQuery]);

  // Handle marking attendance
  const handleMarkAttendance = (clientId, status) => {
    const timeIn = status === "Present" ? "08:00 AM" : "-";
    markClientAttendance(clientId, todayStr, status, timeIn);
    toast.success(`Attendance updated for today: ${status}`);
  };

  // Format historical date display
  const formatDateFriendly = (dateString) => {
    if (!dateString) return "";
    try {
      const parts = dateString.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Panel */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5 text-left">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-805 dark:text-zinc-50 flex items-center gap-2">
            Attendance Tracker
          </h1>
          <p className="text-slate-400 dark:text-zinc-550 text-xs mt-0.5">
            Mark daily check-ins, record absences, and view member attendance sheets.
          </p>
        </div>
        
        {/* Modern Compact Search */}
        <div className="relative w-full sm:w-72">
          <Search className="w-[18px] h-[18px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search member name..."
            style={{ paddingLeft: "48px", paddingRight: "32px" }}
            className="w-full border border-slate-205 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-slate-805 dark:text-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-350 cursor-pointer flex items-center justify-center"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Simplified Grid of Member Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5 text-left">
        {filteredClients.length > 0 ? (
          filteredClients.map((client) => {
            const isActive = client.status === "Active";
            return (
              <div
                key={client.id}
                onClick={() => setSelectedClient(client)}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-2xl p-4.5 shadow-sm hover:shadow-md hover:border-slate-300 dark:hover:border-zinc-700 transition duration-200 cursor-pointer flex items-center gap-4 group"
              >
                <img
                  src={client.photo}
                  alt={client.name}
                  className="w-12 h-12 rounded-xl object-cover shadow-sm bg-slate-50 shrink-0 border border-slate-200/30 group-hover:scale-105 transition duration-200"
                />
                <div className="min-w-0">
                  <h4 className="font-extrabold text-slate-805 dark:text-zinc-150 text-sm truncate leading-snug group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    {client.name}
                  </h4>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 bg-blue-500/5 px-2 py-0.5 rounded font-bold inline-block mt-1">
                    {client.goal}
                  </span>
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <span className={`w-1.5 h-1.5 rounded-full ${isActive ? "bg-emerald-500" : "bg-rose-500"}`} />
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      {isActive ? "Active" : "Expired"}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 rounded-3xl flex flex-col items-center justify-center gap-2">
            <XCircle className="w-8 h-8 text-slate-300" />
            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">No Members Match Search</span>
            <p className="text-[10px] text-slate-405">Try typing another query name.</p>
          </div>
        )}
      </div>

      {/* --- ATTENDANCE OVERLAY POPUP MODAL --- */}
      {selectedClient && (() => {
        const client = selectedClient;
        
        // Find today's log entry
        const todayLog = attendance.find(a => a.clientId === client.id && a.date === todayStr);
        const todayStatus = todayLog ? todayLog.status : null; // "Present", "Absent", "Late", or null

        // Lookup history query log entry
        const historyLog = attendance.find(a => a.clientId === client.id && a.date === historyDate);
        const historyStatus = historyLog ? historyLog.status : null;

        // Statistics computations
        const clientLogs = attendance.filter(a => a.clientId === client.id);
        const totalWorkingDays = clientLogs.length || 0;
        const presentDays = clientLogs.filter(a => a.status === "Present" || a.status === "Late").length;
        const absentDays = clientLogs.filter(a => a.status === "Absent").length;
        const attendancePct = totalWorkingDays > 0 ? Math.round((presentDays / totalWorkingDays) * 100) : 100;

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Blurred background overlay */}
            <div
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setSelectedClient(null)}
            />

            {/* Modal Box */}
            <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left flex flex-col max-h-[90vh] overflow-y-auto z-10 gap-6">
              
              {/* Top Close Row */}
              <button
                onClick={() => setSelectedClient(null)}
                className="absolute top-4 right-4 p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl text-slate-450 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              {/* Top Member Profile Banner */}
              <div className="flex items-center gap-4.5 border-b border-slate-100 dark:border-zinc-850 pb-5">
                <img
                  src={client.photo}
                  alt={client.name}
                  className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-slate-50 border border-slate-200/50"
                />
                <div>
                  <h2 className="text-base font-black text-slate-805 dark:text-zinc-50 leading-snug">
                    {client.name}
                  </h2>
                  <span className="text-[10px] text-slate-450 block mt-0.5">Plan: {client.membership}</span>
                  <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold block mt-1">Goal: {client.goal}</span>
                </div>
              </div>

              {/* Section 1: Today's Attendance Check-in */}
              <div className="space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Today's Attendance</span>
                
                <div className="grid grid-cols-2 gap-4">
                  <button
                    onClick={() => handleMarkAttendance(client.id, "Present")}
                    className={`py-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      todayStatus === "Present" || todayStatus === "Late"
                        ? "bg-emerald-500 text-white border-emerald-600 shadow-md shadow-emerald-500/10 scale-[1.02]"
                        : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>✅ Present</span>
                  </button>

                  <button
                    onClick={() => handleMarkAttendance(client.id, "Absent")}
                    className={`py-3 rounded-2xl text-xs font-black uppercase flex items-center justify-center gap-2 border transition-all cursor-pointer ${
                      todayStatus === "Absent"
                        ? "bg-rose-500 text-white border-rose-600 shadow-md shadow-rose-500/10 scale-[1.02]"
                        : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100"
                    }`}
                  >
                    <span>❌ Absent</span>
                  </button>
                </div>
              </div>

              {/* Section 2: Attendance History Lookup */}
              <div className="p-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl space-y-3.5">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-black text-slate-450 uppercase tracking-wider">Attendance History</span>
                  
                  {/* Date Input */}
                  <input
                    type="date"
                    value={historyDate}
                    onChange={(e) => setHistoryDate(e.target.value)}
                    className="px-2 py-1 text-[10px] border border-slate-205 dark:border-zinc-800 rounded bg-white dark:bg-zinc-900 text-slate-700 dark:text-zinc-350 focus:outline-none"
                  />
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 dark:border-zinc-850/60 pt-3.5 text-xs">
                  <span className="font-bold text-slate-500 dark:text-zinc-450">{formatDateFriendly(historyDate)}</span>
                  
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    historyStatus === "Present" || historyStatus === "Late"
                      ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                    historyStatus === "Absent"
                      ? "bg-rose-500/10 text-rose-600 border border-rose-500/20" :
                    "bg-slate-100 dark:bg-zinc-950 text-slate-450 border border-slate-200/50"
                  }`}>
                    {historyStatus === "Present" || historyStatus === "Late" ? "✅ Present" : historyStatus === "Absent" ? "❌ Absent" : "No Record"}
                  </span>
                </div>
              </div>

              {/* Section 3: Overall Attendance Summary */}
              <div className="space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Overall Attendance</span>
                
                <div className="flex flex-col sm:flex-row justify-between items-center gap-5 p-4 bg-white dark:bg-zinc-905 border border-slate-200/60 dark:border-zinc-850 rounded-2xl shadow-sm">
                  {/* Circle SVG progress bar */}
                  <div className="relative w-18 h-18 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(226,232,240,0.4)" strokeWidth="3" />
                      <circle
                        cx="18"
                        cy="18"
                        r="15.915"
                        fill="none"
                        stroke="#2563eb"
                        strokeWidth="3"
                        strokeDasharray={`${attendancePct} 100`}
                      />
                    </svg>
                    <span className="absolute text-xs font-black text-slate-805 dark:text-zinc-150">{attendancePct}%</span>
                  </div>

                  {/* Summary Counters */}
                  <div className="grid grid-cols-3 gap-3.5 text-xs text-center flex-1">
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Present</span>
                      <span className="font-extrabold text-slate-705 dark:text-zinc-350">{presentDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Absent</span>
                      <span className="font-extrabold text-slate-705 dark:text-zinc-350">{absentDays} Days</span>
                    </div>
                    <div>
                      <span className="text-[9px] font-bold text-slate-400 block uppercase">Total</span>
                      <span className="font-extrabold text-slate-750 dark:text-zinc-300">{totalWorkingDays} Days</span>
                    </div>
                  </div>
                </div>
              </div>

            </div>
          </div>
        );
      })()}

    </div>
  );
};

export default Attendance;
