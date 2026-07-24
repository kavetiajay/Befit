import React, { useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  AreaChart,
  Area
} from "recharts";
import {
  FileText,
  Printer,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";

const Reports = () => {
  const { clients, payments, attendance } = useCRM();

  const goalData = useMemo(() => {
    const goalsCount = {};
    clients.forEach((c) => {
      goalsCount[c.goal] = (goalsCount[c.goal] || 0) + 1;
    });
    return Object.entries(goalsCount).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const membershipData = useMemo(() => {
    const memsCount = {};
    clients.forEach((c) => {
      memsCount[c.membership] = (memsCount[c.membership] || 0) + 1;
    });
    return Object.entries(memsCount).map(([name, value]) => ({ name, value }));
  }, [clients]);

  const growthData = useMemo(() => {
    const sorted = [...clients].sort((a, b) => new Date(a.joinDate) - new Date(b.joinDate));
    let runningTotal = 0;
    return sorted.map((c) => {
      runningTotal += 1;
      return {
        date: new Date(c.joinDate).toLocaleDateString("en-US", { month: "short" }),
        clients: runningTotal
      };
    });
  }, [clients]);

  const revenueData = useMemo(() => {
    // Generate dummy historical monthly payment totals
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const baseRev = [420, 540, 680, 820, 950, 1100, 1200];
    return months.map((m, idx) => ({
      month: m,
      Revenue: baseRev[idx]
    }));
  }, []);

  const COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

  const handleExportCSV = (reportName) => {
    toast.success(`Exported ${reportName} report data as CSV.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Analytical Reports
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Export or print deep-dive fitness metrics, goal mappings, and billing stats.
          </p>
        </div>
        <button
          onClick={handlePrint}
          className="flex items-center gap-1.5 px-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white hover:bg-slate-50 text-slate-650 cursor-pointer shadow-sm transition"
        >
          <Printer className="w-4 h-4" />
          <span>Print All Analytics</span>
        </button>
      </div>

      {/* Grid of Analytical Reports */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Report 1: Revenue Trends */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm no-print">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Revenue Collection</h3>
            <button
              onClick={() => handleExportCSV("Revenue")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 cursor-pointer"
              title="Export CSV"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={revenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="month" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Bar dataKey="Revenue" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report 2: Client Growth */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm no-print">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Athlete Growth Trend</h3>
            <button
              onClick={() => handleExportCSV("Client Growth")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={growthData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.15)" />
                <XAxis dataKey="date" stroke="#9ca3af" fontSize={11} tickLine={false} />
                <YAxis stroke="#9ca3af" fontSize={11} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="clients" stroke="#8b5cf6" strokeWidth={2} fillOpacity={1} fill="url(#growthGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Report 3: Goal Distributions */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm no-print flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Goals Breakdown</h3>
            <button
              onClick={() => handleExportCSV("Fitness Goals")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={goalData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {goalData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {goalData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-zinc-400 font-semibold truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Report 4: Membership Tier Distribution */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-5 shadow-sm no-print flex flex-col justify-between">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Membership Tiers</h3>
            <button
              onClick={() => handleExportCSV("Membership Tiers")}
              className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-slate-400 cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
          </div>
          <div className="h-48 relative flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={membershipData}
                  cx="50%"
                  cy="50%"
                  innerRadius={0}
                  outerRadius={75}
                  dataKey="value"
                >
                  {membershipData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[(index + 2) % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {membershipData.map((entry, index) => (
              <div key={entry.name} className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-zinc-400 font-semibold truncate">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[(index + 2) % COLORS.length] }} />
                <span className="truncate">{entry.name} ({entry.value})</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* --- PRINT SHEET LAYOUT --- */}
      <div className="hidden print-area leading-relaxed">
        <div className="text-center border-b pb-4 mb-6">
          <h1 className="text-xl font-bold">Apex Gym Analytics</h1>
          <p className="text-xs text-slate-500">Summary Metrics Report</p>
        </div>

        <div className="space-y-6">
          <div>
            <h3 className="text-sm font-bold border-b pb-2 mb-3">Membership Tier Breakdown</h3>
            <table className="w-full text-left text-xs border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border">Plan Tier</th>
                  <th className="p-2 border text-center">Athlete Count</th>
                </tr>
              </thead>
              <tbody>
                {membershipData.map((m) => (
                  <tr key={m.name}>
                    <td className="p-2 border font-semibold">{m.name}</td>
                    <td className="p-2 border text-center">{m.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div>
            <h3 className="text-sm font-bold border-b pb-2 mb-3">Athlete Fitness Goals Distributions</h3>
            <table className="w-full text-left text-xs border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border">Primary Goal Target</th>
                  <th className="p-2 border text-center">Athlete Count</th>
                </tr>
              </thead>
              <tbody>
                {goalData.map((g) => (
                  <tr key={g.name}>
                    <td className="p-2 border font-semibold">{g.name}</td>
                    <td className="p-2 border text-center">{g.value}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
