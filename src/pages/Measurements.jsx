import React, { useState, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Scale,
  User,
  Plus,
  TrendingDown,
  TrendingUp,
  Activity,
  AlertCircle
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend
} from "recharts";
import { toast } from "sonner";

const Measurements = () => {
  const { clients, measurements, updateClient } = useCRM();

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  
  // New measurement log state
  const [newMeasure, setNewMeasure] = useState({
    weight: "", bodyFat: "", chest: "", waist: "", arms: "", thigh: ""
  });

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientMeasurements = activeClient ? measurements[activeClient.id] || [] : [];

  // Sort measurements oldest to newest for the trend charts
  const sortedMeasurements = useMemo(() => {
    return [...clientMeasurements].sort((a, b) => new Date(a.date) - new Date(b.date));
  }, [clientMeasurements]);

  const chartData = useMemo(() => {
    return sortedMeasurements.map((m) => ({
      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      Weight: m.weight,
      BodyFat: m.bodyFat
    }));
  }, [sortedMeasurements]);

  const handleAddMeasurement = (e) => {
    e.preventDefault();
    if (!newMeasure.weight) {
      toast.warning("Weight is required.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const newPoint = {
      date: today,
      weight: parseFloat(newMeasure.weight),
      bmi: (parseFloat(newMeasure.weight) / ((activeClient.height / 100) * (activeClient.height / 100))).toFixed(1),
      bodyFat: parseFloat(newMeasure.bodyFat) || activeClient.bodyFat,
      chest: parseFloat(newMeasure.chest) || activeClient.chest,
      waist: parseFloat(newMeasure.waist) || activeClient.waist,
      arms: parseFloat(newMeasure.arms) || activeClient.arms,
      thigh: parseFloat(newMeasure.thigh) || activeClient.thigh
    };

    updateClient(activeClient.id, {
      currentWeight: newPoint.weight,
      bodyFat: newPoint.bodyFat,
      bmi: newPoint.bmi,
      chest: newPoint.chest,
      waist: newPoint.waist,
      arms: newPoint.arms,
      thigh: newPoint.thigh
    });

    toast.success("New stats logged successfully!");
    setMeasurementModalOpen(false);
    setNewMeasure({ weight: "", bodyFat: "", chest: "", waist: "", arms: "", thigh: "" });
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Measurements Tracker
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Monitor athletic body transformations, BMI indexes, and circumferences.
          </p>
        </div>
        
        {/* Client Selector & Add Button */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm flex-1 sm:flex-initial">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select Athlete</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {activeClient && (
            <button
              onClick={() => setMeasurementModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow cursor-pointer transition"
            >
              <Plus className="w-4 h-4" />
              <span>Log Stats</span>
            </button>
          )}
        </div>
      </div>

      {activeClient ? (
        <div className="space-y-6">
          {/* Athlete Info Bar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex items-center gap-3">
            <img src={activeClient.photo} alt={activeClient.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" />
            <div>
              <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">{activeClient.name}</h3>
              <span className="text-[10px] text-slate-400 font-semibold uppercase">Height: {activeClient.height} cm • Current BMI: {activeClient.bmi}</span>
            </div>
          </div>

          {/* Graphs Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Weight Line Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Weight Progression (kg)</h3>
              <div className="h-60">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="Weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No weight records loaded</div>
                )}
              </div>
            </div>

            {/* Body Fat Line Chart */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Body Fat Progression (%)</h3>
              <div className="h-60">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                      <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                      <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                      <Tooltip />
                      <Line type="monotone" dataKey="BodyFat" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-full flex items-center justify-center text-xs text-slate-400">No body fat records loaded</div>
                )}
              </div>
            </div>

          </div>

          {/* Historical Tape Dimensions list */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Measurements Log History</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3 px-6">Date Logged</th>
                    <th className="py-3 px-4">Weight (kg)</th>
                    <th className="py-3 px-4">BMI</th>
                    <th className="py-3 px-4">Body Fat (%)</th>
                    <th className="py-3 px-4">Chest (cm)</th>
                    <th className="py-3 px-4">Waist (cm)</th>
                    <th className="py-3 px-4">Arms (cm)</th>
                    <th className="py-3 px-4">Thigh (cm)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs text-slate-700 dark:text-zinc-300">
                  {[...clientMeasurements].reverse().map((m, i) => (
                    <tr key={i} className="hover:bg-slate-50/40 dark:hover:bg-zinc-800/20">
                      <td className="py-3 px-6 font-bold text-slate-800 dark:text-zinc-200">{m.date}</td>
                      <td className="py-3 px-4 font-semibold text-blue-600 dark:text-blue-400">{m.weight} kg</td>
                      <td className="py-3 px-4">{m.bmi}</td>
                      <td className="py-3 px-4 font-medium text-emerald-600 dark:text-emerald-400">{m.bodyFat}%</td>
                      <td className="py-3 px-4">{m.chest || "-"} cm</td>
                      <td className="py-3 px-4">{m.waist || "-"} cm</td>
                      <td className="py-3 px-4">{m.arms || "-"} cm</td>
                      <td className="py-3 px-4">{m.thigh || "-"} cm</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl">
          <AlertCircle className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No Clients Registered</h3>
          <p className="text-xs text-slate-400 mt-1">Please add a client from the Client Directory before tracking measurements.</p>
        </div>
      )}

      {/* --- ADD MEASUREMENT DIALOG --- */}
      {measurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMeasurementModalOpen(false)} />
          <form onSubmit={handleAddMeasurement} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display">Log Body Measurements</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Weight (kg) *</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMeasure.weight}
                    onChange={(e) => setNewMeasure({ ...newMeasure, weight: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasure.bodyFat}
                    onChange={(e) => setNewMeasure({ ...newMeasure, bodyFat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.chest}
                    onChange={(e) => setNewMeasure({ ...newMeasure, chest: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.waist}
                    onChange={(e) => setNewMeasure({ ...newMeasure, waist: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.arms}
                    onChange={(e) => setNewMeasure({ ...newMeasure, arms: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Thigh (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.thigh}
                    onChange={(e) => setNewMeasure({ ...newMeasure, thigh: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setMeasurementModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition"
              >
                Record Stats
              </button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
};

export default Measurements;
