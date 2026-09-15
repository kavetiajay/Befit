import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Scale,
  User,
  Plus,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertCircle,
  Trash2,
  Search,
  Info
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from "recharts";
import { toast } from "sonner";
import { SkeletonLoader } from "../components/FeedbackStates";

const Measurements = () => {
  const { 
    clients, 
    measurements, 
    fetchWeightProgress, 
    addWeightProgress, 
    deleteWeightProgress,
    loading
  } = useCRM();

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [historySearch, setHistorySearch] = useState("");
  
  // New measurement form state
  const [newMeasure, setNewMeasure] = useState({
    date: new Date().toISOString().split("T")[0],
    weight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    arms: "",
    thigh: "",
    notes: ""
  });

  // Sync selected client when clients load if not already set
  useEffect(() => {
    if (!selectedClientId && clients.length > 0) {
      setSelectedClientId(clients[0].id);
    }
  }, [clients, selectedClientId]);

  // Fetch progress whenever selected client changes
  useEffect(() => {
    if (selectedClientId) {
      fetchWeightProgress(selectedClientId);
    }
  }, [selectedClientId]);

  const activeClient = useMemo(() => {
    return clients.find((c) => c.id === selectedClientId) || clients[0] || null;
  }, [clients, selectedClientId]);

  const clientMeasurements = useMemo(() => {
    if (!activeClient) return [];
    return measurements[activeClient.id] || [];
  }, [measurements, activeClient]);

  // Sort measurements chronologically (oldest to newest) for trends & analytics
  const sortedMeasurements = useMemo(() => {
    return [...clientMeasurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [clientMeasurements]);

  // Latest and baseline measurements
  const latestLog = sortedMeasurements.length > 0 ? sortedMeasurements[sortedMeasurements.length - 1] : null;
  const baselineLog = sortedMeasurements.length > 0 ? sortedMeasurements[0] : null;

  // Key stats calculations
  const stats = useMemo(() => {
    if (!activeClient) {
      return {
        currentWeight: 0,
        startingWeight: 0,
        weightChange: 0,
        weightChangePct: 0,
        targetWeight: 0,
        targetDelta: 0,
        bodyFat: null,
        bodyFatChange: null,
        chest: null,
        waist: null,
        biceps: null,
        thigh: null,
        bmi: 0,
        latestDate: "—",
        hasMultipleRecords: false
      };
    }

    const currentWeight = latestLog ? Number(latestLog.weight) : Number(activeClient.currentWeight || 70);
    const startingWeight = baselineLog ? Number(baselineLog.weight) : currentWeight;
    const weightChange = Number((currentWeight - startingWeight).toFixed(1));
    const weightChangePct = startingWeight > 0 ? Number(((weightChange / startingWeight) * 100).toFixed(1)) : 0;
    const targetWeight = Number(activeClient.targetWeight || currentWeight);
    const targetDelta = Number(Math.abs(currentWeight - targetWeight).toFixed(1));

    // Body fat calculations
    const bodyFat = latestLog?.bodyFat !== null && latestLog?.bodyFat !== undefined
      ? Number(latestLog.bodyFat)
      : (activeClient.bodyFat ? Number(activeClient.bodyFat) : null);

    const baselineBodyFat = baselineLog?.bodyFat !== null && baselineLog?.bodyFat !== undefined
      ? Number(baselineLog.bodyFat)
      : null;

    const bodyFatChange = (bodyFat !== null && baselineBodyFat !== null && sortedMeasurements.length > 1)
      ? Number((bodyFat - baselineBodyFat).toFixed(1))
      : null;

    // Circumferences
    const chest = latestLog?.chest || activeClient.chest || null;
    const waist = latestLog?.waist || activeClient.waist || null;
    const biceps = latestLog?.arms || activeClient.arms || null;
    const thigh = latestLog?.thigh || activeClient.thigh || null;

    // BMI
    const heightInMeters = (activeClient.height || 170) / 100;
    const bmi = Number((currentWeight / (heightInMeters * heightInMeters)).toFixed(1));

    return {
      currentWeight,
      startingWeight,
      weightChange,
      weightChangePct,
      targetWeight,
      targetDelta,
      bodyFat,
      bodyFatChange,
      chest,
      waist,
      biceps,
      thigh,
      bmi,
      latestDate: latestLog?.date || activeClient.joinDate || "—",
      hasMultipleRecords: sortedMeasurements.length > 1
    };
  }, [activeClient, latestLog, baselineLog, sortedMeasurements]);

  // Goal alignment indicator
  const goalProgress = useMemo(() => {
    const goal = (activeClient?.goal || "").toLowerCase();
    const isLossGoal = goal.includes("loss") || goal.includes("cut") || goal.includes("lean");
    const isGainGoal = goal.includes("gain") || goal.includes("bulk") || goal.includes("muscle");

    if (isLossGoal) {
      const isProgressing = stats.weightChange < 0;
      return {
        label: isProgressing ? "On Track (Weight Loss)" : stats.weightChange === 0 ? "Baseline Maintained" : "Weight Gain Detected",
        positive: isProgressing,
        icon: isProgressing ? TrendingDown : TrendingUp,
        colorClass: isProgressing ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
      };
    }

    if (isGainGoal) {
      const isProgressing = stats.weightChange > 0;
      return {
        label: isProgressing ? "On Track (Muscle Gain)" : stats.weightChange === 0 ? "Baseline Maintained" : "Weight Decrease Detected",
        positive: isProgressing,
        icon: isProgressing ? TrendingUp : TrendingDown,
        colorClass: isProgressing ? "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" : "text-amber-500 bg-amber-500/10 border-amber-500/20"
      };
    }

    return {
      label: "General Fitness Tracker",
      positive: true,
      icon: Activity,
      colorClass: "text-blue-500 bg-blue-500/10 border-blue-500/20"
    };
  }, [activeClient, stats.weightChange]);

  // Format chart data
  const chartData = useMemo(() => {
    return sortedMeasurements.map((m) => {
      const d = new Date(m.date);
      return {
        date: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        fullDate: m.date,
        Weight: Number(m.weight),
        BodyFat: m.bodyFat !== null && m.bodyFat !== undefined && m.bodyFat > 0 ? Number(m.bodyFat) : null,
        Chest: m.chest || null,
        Waist: m.waist || null,
        Arms: m.arms || null,
        Thigh: m.thigh || null
      };
    });
  }, [sortedMeasurements]);

  // Check if body fat data is available for chart
  const hasBodyFatData = useMemo(() => {
    return chartData.some((d) => d.BodyFat !== null && d.BodyFat > 0);
  }, [chartData]);

  // Filtered measurement history
  const filteredHistory = useMemo(() => {
    const list = [...sortedMeasurements].reverse();
    if (!historySearch.trim()) return list;
    const q = historySearch.toLowerCase();
    return list.filter((m) => {
      return (
        m.date?.toLowerCase().includes(q) ||
        String(m.weight).includes(q) ||
        String(m.bodyFat || "").includes(q) ||
        (m.notes && m.notes.toLowerCase().includes(q))
      );
    });
  }, [sortedMeasurements, historySearch]);

  const handleOpenAddModal = () => {
    setNewMeasure({
      date: new Date().toISOString().split("T")[0],
      weight: stats.currentWeight ? String(stats.currentWeight) : "",
      bodyFat: stats.bodyFat ? String(stats.bodyFat) : "",
      chest: stats.chest ? String(stats.chest) : "",
      waist: stats.waist ? String(stats.waist) : "",
      arms: stats.biceps ? String(stats.biceps) : "",
      thigh: stats.thigh ? String(stats.thigh) : "",
      notes: ""
    });
    setMeasurementModalOpen(true);
  };

  const handleAddMeasurement = async (e) => {
    e.preventDefault();
    if (!newMeasure.weight) {
      toast.warning("Weight (kg) is required.");
      return;
    }
    if (!newMeasure.date) {
      toast.warning("Measurement date is required.");
      return;
    }

    const payload = {
      date: newMeasure.date,
      weight: parseFloat(newMeasure.weight),
      bodyFat: newMeasure.bodyFat ? parseFloat(newMeasure.bodyFat) : null,
      chest: newMeasure.chest ? parseFloat(newMeasure.chest) : null,
      waist: newMeasure.waist ? parseFloat(newMeasure.waist) : null,
      arms: newMeasure.arms ? parseFloat(newMeasure.arms) : null,
      thigh: newMeasure.thigh ? parseFloat(newMeasure.thigh) : null,
      notes: newMeasure.notes.trim() || null
    };

    const toastId = toast.loading("Saving new body measurements...");
    try {
      await addWeightProgress(activeClient.id, payload);
      setMeasurementModalOpen(false);
    } catch (err) {
      console.error("Failed to add measurement:", err);
      toast.error(`Failed to record measurement: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  const handleDeleteMeasurement = async (progressId) => {
    const toastId = toast.loading("Removing measurement log...");
    try {
      await deleteWeightProgress(progressId, activeClient.id);
      setDeleteConfirmId(null);
    } catch (err) {
      console.error("Failed to delete measurement:", err);
      toast.error(`Failed to delete record: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  const GoalIcon = goalProgress.icon;

  return (
    <div className="space-y-6 text-left animate-in fade-in duration-300">
      
      {/* --- TOP HEADER & CONTROLS --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-blue-600/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
              <Scale className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl font-bold font-display text-slate-800 dark:text-zinc-50">
                Progress & Measurements
              </h1>
              <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
                Monitor Client body transformations, weight velocity, and circumferences.
              </p>
            </div>
          </div>
        </div>
        
        {/* Client Selector & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-2 shadow-sm flex-1 sm:flex-initial min-w-[200px]">
            <User className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs font-semibold text-slate-700 dark:text-zinc-200 bg-transparent border-none focus:outline-none cursor-pointer w-full"
            >
              {clients.map((c) => (
                <option key={c.id} value={c.id} className="dark:bg-zinc-900 text-slate-800 dark:text-zinc-100">
                  {c.name} ({c.goal || "Client"})
                </option>
              ))}
            </select>
          </div>

          {activeClient && (
            <button
              onClick={handleOpenAddModal}
              className="flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm cursor-pointer transition active:scale-95 shrink-0"
            >
              <Plus className="w-4 h-4" />
              <span>Record Measurement</span>
            </button>
          )}
        </div>
      </div>

      {loading && !activeClient ? (
        <SkeletonLoader type="table" count={4} />
      ) : activeClient ? (
        <div className="space-y-6">
          
          {/* --- 1. CLIENT PROGRESS OVERVIEW BAR --- */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-100 dark:border-zinc-800/80">
              <div className="flex items-center gap-3.5">
                <img 
                  src={activeClient.photo} 
                  alt={activeClient.name} 
                  className="w-12 h-12 rounded-2xl object-cover shadow-sm bg-slate-100 border border-slate-200 dark:border-zinc-800" 
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-base font-bold text-slate-800 dark:text-zinc-100">{activeClient.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300">
                      {activeClient.goal || "General Fitness"}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Height: <strong className="text-slate-700 dark:text-zinc-300">{activeClient.height} cm</strong> • BMI: <strong className="text-slate-700 dark:text-zinc-300">{stats.bmi}</strong> • Latest Log: <strong className="text-slate-700 dark:text-zinc-300">{stats.latestDate}</strong>
                  </p>
                </div>
              </div>

              {/* Goal Status Badge */}
              <div className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl border text-xs font-bold ${goalProgress.colorClass}`}>
                <GoalIcon className="w-4 h-4 shrink-0" />
                <span>{goalProgress.label}</span>
              </div>
            </div>

            {/* Comprehensive KPI Metric Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-5">
              
              {/* Current Weight */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Current Weight</span>
                <div className="mt-2">
                  <span className="text-lg font-black text-slate-800 dark:text-zinc-50">{stats.currentWeight}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">kg</span>
                </div>
              </div>

              {/* Starting Weight */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Baseline Weight</span>
                <div className="mt-2">
                  <span className="text-lg font-black text-slate-700 dark:text-zinc-300">{stats.startingWeight}</span>
                  <span className="text-[10px] font-bold text-slate-400 ml-1">kg</span>
                </div>
              </div>

              {/* Total Weight Change */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Weight Delta</span>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={`text-lg font-black ${
                    stats.weightChange < 0 
                      ? "text-emerald-600 dark:text-emerald-400" 
                      : stats.weightChange > 0 
                      ? "text-blue-600 dark:text-blue-400" 
                      : "text-slate-600 dark:text-zinc-300"
                  }`}>
                    {stats.weightChange > 0 ? `+${stats.weightChange}` : stats.weightChange}
                  </span>
                  <span className="text-[10px] font-bold text-slate-400">kg</span>
                </div>
              </div>

              {/* Body Fat */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Body Fat %</span>
                <div className="mt-2 flex items-center gap-1">
                  <span className="text-lg font-black text-emerald-600 dark:text-emerald-400">
                    {stats.bodyFat !== null ? `${stats.bodyFat}%` : "—"}
                  </span>
                </div>
              </div>

              {/* Chest */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Chest</span>
                <div className="mt-2">
                  <span className="text-base font-bold text-slate-800 dark:text-zinc-200">{stats.chest || "—"}</span>
                  <span className="text-[10px] text-slate-400 ml-1">cm</span>
                </div>
              </div>

              {/* Waist */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Waist</span>
                <div className="mt-2">
                  <span className="text-base font-bold text-slate-800 dark:text-zinc-200">{stats.waist || "—"}</span>
                  <span className="text-[10px] text-slate-400 ml-1">cm</span>
                </div>
              </div>

              {/* Arms / Biceps */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800/60 flex flex-col justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Biceps / Thigh</span>
                <div className="mt-2">
                  <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">{stats.biceps || "—"} / {stats.thigh || "—"}</span>
                  <span className="text-[10px] text-slate-400 ml-1">cm</span>
                </div>
              </div>

            </div>
          </div>

          {/* --- 2. PROGRESS TREND CHARTS --- */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Weight Progression Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Scale className="w-3.5 h-3.5 text-blue-500" />
                    <span>Weight Progression Trend (kg)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Historical bodyweight recordings over time
                  </p>
                </div>
                <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2.5 py-1 rounded-lg border border-blue-100 dark:border-blue-500/20">
                  Target: {stats.targetWeight} kg
                </span>
              </div>

              <div className="h-64 w-full">
                {chartData.length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: '#f8fafc' 
                        }} 
                      />
                      <ReferenceLine y={stats.targetWeight} stroke="#f43f5e" strokeDasharray="4 4" label={{ value: 'Target', fill: '#f43f5e', fontSize: 10 }} />
                      <Line 
                        type="monotone" 
                        dataKey="Weight" 
                        stroke="#3b82f6" 
                        strokeWidth={3} 
                        dot={{ fill: "#3b82f6", r: 4 }} 
                        activeDot={{ r: 6, fill: "#2563eb" }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : chartData.length === 1 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <Info className="w-8 h-8 text-blue-500 mb-2 opacity-80" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Baseline Weight Recorded</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      1 measurement logged ({chartData[0].Weight} kg on {chartData[0].date}). Log another measurement on your next weigh-in to display velocity curves.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <Scale className="w-8 h-8 text-slate-400 dark:text-zinc-600 mb-2" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Weight Records Available</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Click "Record Measurement" to log the initial baseline for {activeClient.name}.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Body Fat Ratio Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Body Fat Ratio Trend (%)</span>
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Adipose percentage trend tracking
                  </p>
                </div>
                {stats.bodyFat !== null && (
                  <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                    Latest: {stats.bodyFat}%
                  </span>
                )}
              </div>

              <div className="h-64 w-full">
                {hasBodyFatData && chartData.filter(d => d.BodyFat !== null).length > 1 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData.filter(d => d.BodyFat !== null)} margin={{ top: 15, right: 15, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: '#0f172a', 
                          borderColor: '#334155', 
                          borderRadius: '12px', 
                          fontSize: '12px',
                          color: '#f8fafc' 
                        }} 
                      />
                      <Line 
                        type="monotone" 
                        dataKey="BodyFat" 
                        stroke="#10b981" 
                        strokeWidth={3} 
                        dot={{ fill: "#10b981", r: 4 }} 
                        activeDot={{ r: 6, fill: "#059669" }} 
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : hasBodyFatData && chartData.filter(d => d.BodyFat !== null).length === 1 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <Info className="w-8 h-8 text-emerald-500 mb-2 opacity-80" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-200">Single Body Fat Log</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Body fat logged at {stats.bodyFat}%. Trend line will activate when 2 or more body fat logs are recorded.
                    </p>
                  </div>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-zinc-950/40 rounded-2xl border border-dashed border-slate-200 dark:border-zinc-800">
                    <Activity className="w-8 h-8 text-slate-400 dark:text-zinc-600 mb-2 shrink-0" />
                    <h4 className="text-xs font-bold text-slate-700 dark:text-zinc-300">No Body Fat Records</h4>
                    <p className="text-[11px] text-slate-400 mt-1 max-w-xs">
                      Optionally record body fat percentage when logging new measurements to track body composition.
                    </p>
                  </div>
                )}
              </div>
            </div>

          </div>

          {/* --- 3. PROGRESS MEASUREMENT HISTORY --- */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Measurements Log History ({filteredHistory.length})
                </h3>
                <p className="text-[11px] text-slate-400 mt-0.5">
                  Detailed timeline of recorded weigh-ins and body tape dimensions
                </p>
              </div>

              {/* History search filter */}
              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Filter logs by date, notes..."
                  value={historySearch}
                  onChange={(e) => setHistorySearch(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/75 dark:bg-zinc-950/60 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Weight (kg)</th>
                    <th className="py-3 px-4">BMI</th>
                    <th className="py-3 px-4">Body Fat</th>
                    <th className="py-3 px-4">Chest</th>
                    <th className="py-3 px-4">Waist</th>
                    <th className="py-3 px-4">Biceps</th>
                    <th className="py-3 px-4">Thigh</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs text-slate-700 dark:text-zinc-300">
                  {filteredHistory.length > 0 ? (
                    filteredHistory.map((m) => {
                      const heightM = (activeClient.height || 170) / 100;
                      const logBmi = (Number(m.weight) / (heightM * heightM)).toFixed(1);
                      return (
                        <tr key={m.id || m.date} className="hover:bg-slate-50/60 dark:hover:bg-zinc-800/30 transition">
                          <td className="py-3 px-4 font-bold text-slate-800 dark:text-zinc-100">
                            {m.date}
                          </td>
                          <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">
                            {m.weight} kg
                          </td>
                          <td className="py-3 px-4 text-slate-600 dark:text-zinc-400">
                            {logBmi}
                          </td>
                          <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">
                            {m.bodyFat !== null && m.bodyFat !== undefined && m.bodyFat > 0 ? `${m.bodyFat}%` : "—"}
                          </td>
                          <td className="py-3 px-4">{m.chest ? `${m.chest} cm` : "—"}</td>
                          <td className="py-3 px-4">{m.waist ? `${m.waist} cm` : "—"}</td>
                          <td className="py-3 px-4">{m.arms ? `${m.arms} cm` : "—"}</td>
                          <td className="py-3 px-4">{m.thigh ? `${m.thigh} cm` : "—"}</td>
                          <td className="py-3 px-4 text-slate-400 dark:text-zinc-500 max-w-xs truncate">
                            {m.notes || "—"}
                          </td>
                          <td className="py-3 px-4 text-right">
                            {m.id && (
                              <button
                                onClick={() => setDeleteConfirmId(m.id)}
                                className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition cursor-pointer"
                                title="Delete Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={10} className="py-10 text-center text-slate-400 text-xs">
                        No progress records found matching criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Mobile Card List View */}
            <div className="block md:hidden space-y-3">
              {filteredHistory.length > 0 ? (
                filteredHistory.map((m) => {
                  const heightM = (activeClient.height || 170) / 100;
                  const logBmi = (Number(m.weight) / (heightM * heightM)).toFixed(1);
                  return (
                    <div key={m.id || m.date} className="p-4 bg-slate-50/50 dark:bg-zinc-950/60 border border-slate-100 dark:border-zinc-800 rounded-2xl space-y-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-zinc-100 text-xs block">{m.date}</span>
                          <span className="text-[10px] text-slate-400">BMI: {logBmi}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="px-2.5 py-1 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-extrabold text-xs">
                            {m.weight} kg
                          </span>
                          {m.id && (
                            <button
                              onClick={() => setDeleteConfirmId(m.id)}
                              className="p-1 text-slate-400 hover:text-rose-500 cursor-pointer"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 text-[10.5px] text-slate-500 dark:text-zinc-400 pt-2 border-t border-slate-200/50 dark:border-zinc-800/60">
                        <div>Fat: <strong className="text-emerald-600 dark:text-emerald-400">{m.bodyFat ? `${m.bodyFat}%` : "—"}</strong></div>
                        <div>Chest: <strong className="text-slate-700 dark:text-zinc-200">{m.chest ? `${m.chest}cm` : "—"}</strong></div>
                        <div>Waist: <strong className="text-slate-700 dark:text-zinc-200">{m.waist ? `${m.waist}cm` : "—"}</strong></div>
                        <div>Biceps: <strong className="text-slate-700 dark:text-zinc-200">{m.arms ? `${m.arms}cm` : "—"}</strong></div>
                        <div>Thigh: <strong className="text-slate-700 dark:text-zinc-200">{m.thigh ? `${m.thigh}cm` : "—"}</strong></div>
                      </div>

                      {m.notes && (
                        <p className="text-[10px] text-slate-400 italic bg-white dark:bg-zinc-900 p-2 rounded-lg border border-slate-100 dark:border-zinc-800">
                          "{m.notes}"
                        </p>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No progress history found.
                </div>
              )}
            </div>

          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-8">
          <AlertCircle className="w-12 h-12 text-slate-400 dark:text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-slate-800 dark:text-zinc-200">No Clients Found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            Please register a Client from the Client Roster before tracking progress and body measurements.
          </p>
        </div>
      )}

      {/* --- RECORD MEASUREMENT MODAL DIALOG --- */}
      {measurementModalOpen && activeClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity" 
            onClick={() => setMeasurementModalOpen(false)} 
          />
          <form 
            onSubmit={handleAddMeasurement} 
            className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in scale-in duration-200 max-h-[90vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center">
                  <Scale className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 font-display">
                    Record Measurement
                  </h3>
                  <span className="text-[10px] text-slate-400">{activeClient.name}</span>
                </div>
              </div>
            </div>

            <div className="space-y-3.5">
              {/* Date & Weight */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={newMeasure.date}
                    onChange={(e) => setNewMeasure({ ...newMeasure, date: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Weight (kg) *
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    placeholder="e.g. 74.5"
                    value={newMeasure.weight}
                    onChange={(e) => setNewMeasure({ ...newMeasure, weight: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Body Fat & Chest */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Body Fat %
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 18.5"
                    value={newMeasure.bodyFat}
                    onChange={(e) => setNewMeasure({ ...newMeasure, bodyFat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Chest (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 96"
                    value={newMeasure.chest}
                    onChange={(e) => setNewMeasure({ ...newMeasure, chest: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Waist & Arms */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Waist (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 82"
                    value={newMeasure.waist}
                    onChange={(e) => setNewMeasure({ ...newMeasure, waist: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                    Biceps / Arms (cm)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 35"
                    value={newMeasure.arms}
                    onChange={(e) => setNewMeasure({ ...newMeasure, arms: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
              </div>

              {/* Thigh & Notes */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Thigh (cm)
                </label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 54"
                  value={newMeasure.thigh}
                  onChange={(e) => setNewMeasure({ ...newMeasure, thigh: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wider block mb-1">
                  Trainer Notes / Context (Optional)
                </label>
                <textarea
                  rows={2}
                  placeholder="e.g. Post-fast morning measurement, low carb phase..."
                  value={newMeasure.notes}
                  onChange={(e) => setNewMeasure({ ...newMeasure, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setMeasurementModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Save Measurement
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeleteConfirmId(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200">
            <div className="w-10 h-10 rounded-full bg-rose-500/10 text-rose-500 flex items-center justify-center mx-auto mb-3">
              <Trash2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-center text-slate-800 dark:text-zinc-100">
              Delete Measurement Record?
            </h3>
            <p className="text-xs text-center text-slate-400 mt-1 mb-5">
              This measurement entry will be permanently removed from the Client's timeline.
            </p>
            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleDeleteMeasurement(deleteConfirmId)}
                className="flex-1 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-sm cursor-pointer"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Measurements;
