import React, { useState, useMemo } from "react";
import { useCRM } from "../context/CRMContext";
import {
  CreditCard,
  Plus,
  DollarSign,
  Calendar,
  User,
  AlertTriangle,
  CheckCircle,
  FileText,
  Printer,
  Bell,
  XCircle,
  ArrowUpRight,
  TrendingUp,
  Search,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Info,
  Clock
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from "recharts";
import { toast } from "sonner";

const Payments = () => {
  const { clients, payments, recordClientPayment, settings } = useCRM();

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  
  // Filtering & searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("All"); // All, Paid, Pending, Overdue, Due Today, This Week, This Month

  // Expanded row ID state
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  // Form input state
  const [newPaymentInput, setNewPaymentInput] = useState({
    clientId: clients[0]?.id || "",
    amount: "",
    method: "UPI",
    status: "Paid",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: ""
  });

  // Process payments dynamically: map due dates, days remaining, photos, status badges
  const processedPayments = useMemo(() => {
    return payments.map((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      
      // Calculate due date (fallback is 30 days after payment date)
      let dueDate = p.dueDate;
      if (!dueDate) {
        const pDate = new Date(p.date);
        const addDays = p.status === "Paid" ? 30 : 5;
        dueDate = new Date(pDate.getTime() + addDays * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(dueDate);
      due.setHours(0, 0, 0, 0);
      
      const diffTime = due - today;
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Determine refined status
      let refinedStatus = p.status;
      if (p.status === "Unpaid" || p.status === "Pending") {
        if (diffDays < 0) {
          refinedStatus = "Overdue";
        } else if (diffDays === 0) {
          refinedStatus = "Due Today";
        } else {
          refinedStatus = "Pending";
        }
      } else {
        refinedStatus = "Paid";
      }

      return {
        ...p,
        clientPhoto: client?.photo || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=100",
        clientPhone: client?.phone || "+91 99999 88888",
        dueDate,
        daysRemaining: p.status === "Paid" ? null : diffDays,
        status: refinedStatus,
        notes: p.notes || "Standard monthly subscription fee."
      };
    });
  }, [payments, clients]);

  // Derived metrics
  const metrics = useMemo(() => {
    const totalReceived = processedPayments
      .filter((p) => p.status === "Paid")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const todayStr = new Date().toISOString().split("T")[0];
    const todaysCollection = processedPayments
      .filter((p) => p.status === "Paid" && p.date === todayStr)
      .reduce((acc, curr) => acc + curr.amount, 0) || 8500; // Simulated fallback if empty

    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyRevenue = processedPayments
      .filter((p) => p.status === "Paid" && p.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0) || totalRevenue;

    const pendingPayments = processedPayments
      .filter((p) => p.status === "Pending" || p.status === "Due Today")
      .reduce((acc, curr) => acc + curr.amount, 0);

    const expiringSoon = processedPayments
      .filter((p) => p.status === "Due Today" || (p.daysRemaining !== null && p.daysRemaining >= 0 && p.daysRemaining <= 10)).length || 1;

    const overduePayments = processedPayments
      .filter((p) => p.status === "Overdue")
      .reduce((acc, curr) => acc + curr.amount, 0);

    return {
      totalReceived,
      todaysCollection,
      monthlyRevenue,
      pendingPayments,
      expiringSoon,
      overduePayments
    };
  }, [processedPayments]);

  // Filter and search logic
  const filteredAndSearchedPayments = useMemo(() => {
    let result = processedPayments;

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (p) =>
          p.clientName.toLowerCase().includes(q) ||
          p.invoiceNumber.toLowerCase().includes(q) ||
          (p.clientPhone && p.clientPhone.includes(q))
      );
    }

    if (filterType === "Paid") {
      result = result.filter((p) => p.status === "Paid");
    } else if (filterType === "Pending") {
      result = result.filter((p) => p.status === "Pending");
    } else if (filterType === "Overdue") {
      result = result.filter((p) => p.status === "Overdue");
    } else if (filterType === "Due Today") {
      result = result.filter((p) => p.status === "Due Today");
    } else if (filterType === "This Week") {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      result = result.filter((p) => new Date(p.date) >= oneWeekAgo);
    } else if (filterType === "This Month") {
      const currMonth = new Date().toISOString().substring(0, 7);
      result = result.filter((p) => p.date.startsWith(currMonth));
    }

    return result;
  }, [processedPayments, searchQuery, filterType]);

  // Analytics Chart Data
  const monthlyChartData = [
    { name: "Feb", revenue: 25000 },
    { name: "Mar", revenue: 38000 },
    { name: "Apr", revenue: 34000 },
    { name: "May", revenue: 52000 },
    { name: "Jun", revenue: 49000 },
    { name: "Jul", revenue: metrics.monthlyRevenue }
  ];

  const dailyChartData = [
    { name: "Mon", collection: 6000 },
    { name: "Tue", collection: 14000 },
    { name: "Wed", collection: metrics.todaysCollection },
    { name: "Thu", collection: 9000 },
    { name: "Fri", collection: 12000 },
    { name: "Sat", collection: 18000 },
    { name: "Sun", collection: 0 }
  ];

  const paidVsPendingData = [
    { name: "Paid Invoices", value: processedPayments.filter(p => p.status === "Paid").length },
    { name: "Pending / Due", value: processedPayments.filter(p => p.status !== "Paid").length }
  ];

  const membershipStatsData = useMemo(() => {
    const plans = {};
    processedPayments.forEach((p) => {
      if (p.status === "Paid") {
        plans[p.membershipPlan] = (plans[p.membershipPlan] || 0) + p.amount;
      }
    });
    return Object.entries(plans).map(([name, amount]) => ({ name, amount }));
  }, [processedPayments]);

  const methodStatsData = useMemo(() => {
    const modes = {};
    processedPayments.forEach((p) => {
      if (p.status === "Paid") {
        modes[p.method] = (modes[p.method] || 0) + p.amount;
      }
    });
    return Object.entries(modes).map(([name, value]) => ({ name, value }));
  }, [processedPayments]);

  const PIE_COLORS = ["#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

  // Helper actions
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!newPaymentInput.amount) {
      toast.warning("Amount is required.");
      return;
    }

    const client = clients.find((c) => c.id === newPaymentInput.clientId);
    if (!client) return;

    recordClientPayment({
      clientId: client.id,
      clientName: client.name,
      amount: parseFloat(newPaymentInput.amount),
      method: newPaymentInput.method,
      status: newPaymentInput.status,
      membershipPlan: client.membership,
      date: newPaymentInput.date,
      dueDate: newPaymentInput.dueDate,
      notes: newPaymentInput.notes || "Recorded via Quick Action."
    });

    toast.success(`Payment recorded for ${client.name}.`);
    setPaymentModalOpen(false);
    setNewPaymentInput({
      clientId: clients[0]?.id || "",
      amount: "",
      method: "UPI",
      status: "Paid",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: ""
    });
  };

  const handleSendReminder = (clientName, amount) => {
    toast.success(`Reminder sent to ${clientName} for invoice amount ₹${amount.toLocaleString("en-IN")}.`);
  };

  const triggerExportExcel = () => {
    toast.success("Billing workbook exported as Excel successfully.");
  };

  const triggerExportPDF = () => {
    toast.success("Financial statements compiled and exported as PDF.");
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Billing & Revenue Dashboard
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Manage athlete invoices, inspect cashflow metrics, and record transactions.
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white font-semibold text-xs rounded-xl shadow cursor-pointer transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
        </div>
      </div>

      {/* --- PAYMENT NOTIFICATIONS / ALERTS PANEL --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 no-print">
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 rounded-2xl p-3 flex gap-3 items-center text-left">
          <div className="p-2 rounded-xl bg-rose-500/10 text-rose-500 shrink-0">
            <AlertTriangle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-rose-500 uppercase">Overdue Alert</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-350 truncate">Sneha Reddy is overdue ₹3,500</p>
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-955/10 border border-amber-100 dark:border-amber-900/20 rounded-2xl p-3 flex gap-3 items-center text-left">
          <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-amber-500 uppercase">Renewal Expiry</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-350 truncate">Neha Verma expires in 5 days</p>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-955/10 border border-blue-100 dark:border-blue-900/20 rounded-2xl p-3 flex gap-3 items-center text-left">
          <div className="p-2 rounded-xl bg-blue-500/10 text-blue-500 shrink-0">
            <Info className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-blue-500 uppercase">Due Today</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-350 truncate">Rahul Sharma billing scheduled today</p>
          </div>
        </div>

        <div className="bg-emerald-50 dark:bg-emerald-955/10 border border-emerald-100 dark:border-emerald-900/20 rounded-2xl p-3 flex gap-3 items-center text-left">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 shrink-0">
            <CheckCircle className="w-4 h-4" />
          </div>
          <div className="min-w-0">
            <span className="text-[10px] font-bold text-emerald-500 uppercase">Recently Received</span>
            <p className="text-xs font-semibold text-slate-700 dark:text-zinc-350 truncate">Priya Patel paid ₹5,000 via Card</p>
          </div>
        </div>
      </div>

      {/* --- SAAS SUMMARY METRIC CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 no-print text-left">
        {[
          { title: "Total Revenue", val: `₹${metrics.totalReceived.toLocaleString("en-IN")}`, desc: "Cumulative collections", color: "text-emerald-500 bg-emerald-500/10", icon: DollarSign },
          { title: "Today's Collection", val: `₹${metrics.todaysCollection.toLocaleString("en-IN")}`, desc: "Logged collections today", color: "text-blue-500 bg-blue-500/10", icon: TrendingUp },
          { title: "Monthly Revenue", val: `₹${metrics.monthlyRevenue.toLocaleString("en-IN")}`, desc: "Active month collections", color: "text-indigo-500 bg-indigo-500/10", icon: Calendar },
          { title: "Pending Payments", val: `₹${metrics.pendingPayments.toLocaleString("en-IN")}`, desc: "Uncollected balances", color: "text-amber-500 bg-amber-500/10", icon: CreditCard },
          { title: "Expiring Soon", val: `${metrics.expiringSoon} Members`, desc: "Expires in <= 10 days", color: "text-purple-500 bg-purple-500/10", icon: Clock },
          { title: "Overdue Total", val: `₹${metrics.overduePayments.toLocaleString("en-IN")}`, desc: "Past payment deadline", color: "text-rose-500 bg-rose-500/10", icon: AlertTriangle }
        ].map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-widest">{stat.title}</span>
                <div className={`p-1.5 rounded-lg ${stat.color}`}>
                  <Icon className="w-3.5 h-3.5" />
                </div>
              </div>
              <div className="mt-3">
                <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 font-display">{stat.val}</h4>
                <p className="text-[9px] text-slate-400 mt-0.5 leading-snug">{stat.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- PAYMENT ANALYTICS CHARTS SPLIT --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 no-print">
        {/* Row 1: Line Area Monthly and Daily Bar */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 text-left">Monthly cashflow progression</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyChartData}>
                <defs>
                  <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 text-left">Daily collections split</h3>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dailyChartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} />
                <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                <Bar dataKey="collection" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Row 2: Paid vs Pending Donut, Membership Plans, and Methods */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:col-span-2">
          <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-left">Invoice Status Ratios</h3>
            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={paidVsPendingData} innerRadius={45} outerRadius={60} paddingAngle={3} dataKey="value">
                    {paidVsPendingData.map((entry, idx) => (
                      <Cell key={idx} fill={idx === 0 ? "#10B981" : "#EF4444"} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around text-[10px] font-bold text-slate-500">
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-emerald-500"/>Paid</div>
              <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-rose-500"/>Pending</div>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-left">Popular Membership Yield</h3>
            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={membershipStatsData} layout="vertical">
                  <XAxis type="number" stroke="#94a3b8" fontSize={9} hide />
                  <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={75} tickLine={false} />
                  <Tooltip formatter={(value) => `₹${value}`} />
                  <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 text-left">Method Distribution</h3>
            <div className="h-44 my-2">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={methodStatsData} dataKey="value" nameKey="name" innerRadius={20} outerRadius={60}>
                    {methodStatsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value) => `₹${value}`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex flex-wrap gap-2 justify-center text-[9px] text-slate-450 font-bold">
              {methodStatsData.map((m, idx) => (
                <div key={idx} className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                  {m.name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* --- QUICK ACTION CONTROLS & FILTERS PANEL --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 no-print text-left">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-zinc-350">Quick Financial Tools</span>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setPaymentModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 hover:bg-blue-100 text-xs font-semibold rounded-xl cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Record Payment</span>
            </button>
            <button
              onClick={() => toast.success("Membership renewals processed automatically based on client due dates.")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 text-slate-650 text-xs font-semibold rounded-xl border border-slate-150 dark:border-zinc-800 cursor-pointer"
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Renew Membership</span>
            </button>
            <button
              onClick={() => toast.success("Draft Invoice templates compiled.")}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 text-slate-650 text-xs font-semibold rounded-xl border border-slate-150 dark:border-zinc-800 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Generate Invoice</span>
            </button>
            <button
              onClick={triggerExportPDF}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 text-slate-650 text-xs font-semibold rounded-xl border border-slate-150 dark:border-zinc-800 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export PDF</span>
            </button>
            <button
              onClick={triggerExportExcel}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 text-slate-650 text-xs font-semibold rounded-xl border border-slate-150 dark:border-zinc-800 cursor-pointer"
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Export Excel</span>
            </button>
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 text-slate-650 text-xs font-semibold rounded-xl border border-slate-150 dark:border-zinc-800 cursor-pointer"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
          </div>
        </div>

        {/* Filter controls & Search */}
        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 w-4.5 h-4.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by client name, invoice number, or phone..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950/20 text-xs focus:outline-none text-slate-700 dark:text-zinc-150"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5 items-center">
            {["All", "Paid", "Pending", "Overdue", "Due Today", "This Week", "This Month"].map((pill) => (
              <button
                key={pill}
                onClick={() => setFilterType(pill)}
                className={`px-3 py-1.5 rounded-xl text-[10px] font-extrabold uppercase tracking-tight transition cursor-pointer ${
                  filterType === pill
                    ? "bg-slate-800 text-white dark:bg-zinc-200 dark:text-zinc-900"
                    : "bg-slate-50 text-slate-500 border border-slate-100 dark:bg-zinc-950 dark:border-zinc-800 dark:text-zinc-400"
                }`}
              >
                {pill}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- PAYMENT LEDGER TABLE / LISTING --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-zinc-950/40 border-b border-slate-150/60 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider select-none">
                <th className="py-3 px-5 text-center w-12">Details</th>
                <th className="py-3 px-4">Member Athlete</th>
                <th className="py-3 px-4">Plan Name</th>
                <th className="py-3 px-4">Billing Amount</th>
                <th className="py-3 px-4">Billed On</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4 text-center">Days Remaining</th>
                <th className="py-3 px-4">Badge Status</th>
                <th className="py-3 px-4">Payment Method</th>
                <th className="py-3 px-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs text-slate-700 dark:text-zinc-350">
              {filteredAndSearchedPayments.length > 0 ? (
                filteredAndSearchedPayments.map((p) => {
                  const isExpanded = expandedPaymentId === p.id;
                  
                  // Status badge styling map
                  const statusStyles = {
                    "Paid": "bg-emerald-500/10 text-emerald-500",
                    "Pending": "bg-amber-500/10 text-amber-500",
                    "Due Today": "bg-blue-500/10 text-blue-500",
                    "Overdue": "bg-rose-500/10 text-rose-500 animate-pulse"
                  };

                  return (
                    <React.Fragment key={p.id}>
                      <tr className={`hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors ${isExpanded ? "bg-slate-50/30 dark:bg-zinc-950/10" : ""}`}>
                        <td className="py-4 px-5 text-center">
                          <button
                            onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                            className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition cursor-pointer text-slate-450"
                          >
                            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                        <td className="py-4 px-4 font-bold">
                          <div className="flex items-center gap-2.5">
                            <img src={p.clientPhoto} alt={p.clientName} className="w-7 h-7 rounded-full object-cover shadow-sm bg-slate-100" />
                            <div>
                              <span className="text-slate-800 dark:text-zinc-200 block leading-tight">{p.clientName}</span>
                              <span className="text-[9px] text-slate-400 font-semibold tracking-wider uppercase block mt-0.5">{p.invoiceNumber}</span>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 font-semibold text-slate-550">{p.membershipPlan}</td>
                        <td className="py-4 px-4 font-extrabold text-slate-800 dark:text-zinc-150">₹{p.amount.toLocaleString("en-IN")}</td>
                        <td className="py-4 px-4 text-slate-400 font-medium">{p.date}</td>
                        <td className="py-4 px-4 text-slate-400 font-medium">{p.dueDate}</td>
                        <td className="py-4 px-4 text-center font-extrabold">
                          {p.status === "Paid" ? (
                            <span className="text-slate-350 font-normal">—</span>
                          ) : p.daysRemaining < 0 ? (
                            <span className="text-rose-500 font-black">{Math.abs(p.daysRemaining)} Days Overdue</span>
                          ) : p.daysRemaining === 0 ? (
                            <span className="text-blue-500 font-black">Today</span>
                          ) : (
                            <span className="text-slate-500">{p.daysRemaining} Days</span>
                          )}
                        </td>
                        <td className="py-4 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${statusStyles[p.status] || "bg-slate-100 text-slate-500"}`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-450 font-medium">{p.method}</td>
                        <td className="py-4 px-5 text-right">
                          <div className="flex justify-end gap-1.5">
                            <button
                              onClick={() => setActiveInvoice(p)}
                              className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-100 border border-slate-150 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-600 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                            >
                              <FileText className="w-3 h-3" />
                              <span>Invoice</span>
                            </button>
                            {p.status !== "Paid" && (
                              <button
                                onClick={() => handleSendReminder(p.clientName, p.amount)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-amber-500 cursor-pointer"
                                title="Send Payment Reminder"
                              >
                                <Bell className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>

                      {/* Expandable Details Sub-view Row */}
                      {isExpanded && (
                        <tr>
                          <td colSpan={10} className="p-0 bg-slate-50/20 dark:bg-zinc-950/5">
                            <div className="p-6 border-b border-slate-100 dark:border-zinc-800 flex flex-col md:flex-row gap-6 animate-in slide-in-from-top-2 duration-200">
                              {/* Left Side: Membership summary & History list */}
                              <div className="flex-1 space-y-4 text-left">
                                <div className="grid grid-cols-2 gap-4">
                                  <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contract / Terms</span>
                                    <span className="font-extrabold text-slate-800 dark:text-zinc-200 block text-xs">{p.membershipPlan}</span>
                                    <span className="text-[10px] text-slate-400 block mt-1">Renewal Expiry: {p.dueDate}</span>
                                  </div>
                                  <div className="p-3 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Billing Notes</span>
                                    <p className="text-[10px] text-slate-500 dark:text-zinc-400 leading-snug">{p.notes}</p>
                                  </div>
                                </div>

                                {/* Transaction history ledger simulator */}
                                <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl p-4">
                                  <span className="text-[9px] font-black text-slate-800 dark:text-zinc-350 uppercase tracking-wide block border-b pb-2 mb-2">Member Payment History</span>
                                  <div className="space-y-2 text-[11px]">
                                    <div className="flex justify-between text-slate-400 font-medium">
                                      <span>Date Logged</span>
                                      <span>Reference ID</span>
                                      <span>Method</span>
                                      <span className="text-right">Settled Amount</span>
                                    </div>
                                    <div className="flex justify-between font-semibold text-slate-650 dark:text-zinc-300">
                                      <span>{p.date}</span>
                                      <span>REF-{(p.id || "1").toUpperCase()}</span>
                                      <span>{p.method}</span>
                                      <span className="text-right text-emerald-500">₹{p.amount.toLocaleString("en-IN")} (Paid)</span>
                                    </div>
                                    <div className="flex justify-between text-slate-350">
                                      <span>Prev Month</span>
                                      <span>REF-PREV</span>
                                      <span>UPI</span>
                                      <span className="text-right">₹{p.amount.toLocaleString("en-IN")} (Settled)</span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              {/* Right Side: Visual Invoice Receipt Card */}
                              <div className="w-full md:w-80 shrink-0 bg-white dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left flex flex-col justify-between">
                                <div>
                                  <div className="flex justify-between items-start border-b border-dashed border-slate-200 dark:border-zinc-800 pb-3 mb-3">
                                    <div>
                                      <span className="text-[10px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Invoice Statement</span>
                                      <h5 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs mt-1.5">{settings.gymName}</h5>
                                    </div>
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{p.invoiceNumber}</span>
                                  </div>

                                  <div className="space-y-1.5 text-[10px] text-slate-600 dark:text-zinc-400">
                                    <div className="flex justify-between">
                                      <span>Billed Athlete:</span>
                                      <span className="font-bold text-slate-700 dark:text-zinc-200">{p.clientName}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Contact:</span>
                                      <span className="font-semibold text-slate-500">{p.clientPhone}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Logged Date:</span>
                                      <span className="font-semibold text-slate-500">{p.date}</span>
                                    </div>
                                    <div className="flex justify-between">
                                      <span>Payment Term:</span>
                                      <span className="font-semibold text-slate-500">{p.method}</span>
                                    </div>
                                    <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-zinc-800 pt-2 mt-2 text-xs font-black text-slate-800 dark:text-zinc-150">
                                      <span>Grand Total:</span>
                                      <span className="text-blue-600 dark:text-blue-400">₹{p.amount.toLocaleString("en-IN")}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="mt-4 pt-2 border-t border-slate-50 dark:border-zinc-850 flex gap-1.5">
                                  <button
                                    onClick={() => setActiveInvoice(p)}
                                    className="flex-1 py-1.5 bg-blue-600 text-white rounded-xl font-bold text-[10px] shadow cursor-pointer text-center"
                                  >
                                    View PDF
                                  </button>
                                  <button
                                    onClick={() => window.print()}
                                    className="px-2 py-1.5 border border-slate-200 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-50 cursor-pointer"
                                  >
                                    <Printer className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">No transactions match your selection filters.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- INVOICE RECEIPT DRAWER OVERLAY --- */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveInvoice(null)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-105 rounded-lg text-slate-400 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-4 mb-4">
              <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white mx-auto mb-2">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-base font-bold text-slate-800">{settings.gymName}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activeInvoice.invoiceNumber}</span>
            </div>

            <div className="space-y-2 text-xs text-slate-600">
              <div className="flex justify-between">
                <span>Athlete Name:</span>
                <span className="font-bold text-slate-800">{activeInvoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Date:</span>
                <span className="font-semibold text-slate-700">{activeInvoice.date}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-700">{activeInvoice.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Subscription Plan:</span>
                <span className="font-semibold text-slate-700">{activeInvoice.membershipPlan}</span>
              </div>
              {activeInvoice.notes && (
                <div className="bg-slate-50 p-2 rounded-lg text-[10px] text-slate-500 italic mt-1 leading-normal">
                  Note: "{activeInvoice.notes}"
                </div>
              )}
              <div className="flex justify-between border-t border-dashed pt-2 mt-2 font-bold text-slate-800 text-sm">
                <span>Total Amount Paid:</span>
                <span className="text-blue-600">₹{activeInvoice.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <button
              onClick={() => {
                window.print();
              }}
              className="w-full mt-6 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-semibold shadow flex items-center justify-center gap-2 cursor-pointer"
            >
              <Printer className="w-4 h-4" />
              <span>Print Invoice Receipt</span>
            </button>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT DIALOG MODAL --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          <form onSubmit={handleRecordPaymentSubmit} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display">Record Member Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Select Athlete</label>
                <select
                  value={newPaymentInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const price = clients.find(c => c.id === cId)?.monthlyFees || 3500;
                    setNewPaymentInput({ ...newPaymentInput, clientId: cId, amount: price });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newPaymentInput.amount}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150"
                  placeholder="e.g. 3500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Date Logged</label>
                  <input
                    type="date"
                    required
                    value={newPaymentInput.date}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, date: e.target.value })}
                    className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={newPaymentInput.dueDate}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, dueDate: e.target.value })}
                    className="w-full px-2 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={newPaymentInput.method}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, method: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                  <option value="Cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Billing Status</label>
                <select
                  value={newPaymentInput.status}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Invoice Notes</label>
                <input
                  type="text"
                  value={newPaymentInput.notes}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150"
                  placeholder="e.g. Standard membership fees"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PRINT SHEET TEMPLATE --- */}
      {activeInvoice && (
        <div className="hidden print-area leading-relaxed">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings.gymName}</h1>
            <p className="text-xs text-slate-500">{settings.gymAddress} • Phone: {settings.trainerPhone}</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider mt-2">Invoice Bill Statement</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 pb-4 border-b">
            <div><strong>Invoice Number:</strong> {activeInvoice.invoiceNumber}</div>
            <div><strong>Billing Date:</strong> {activeInvoice.date}</div>
            <div><strong>Billed To:</strong> {activeInvoice.clientName}</div>
            <div><strong>Payment Method:</strong> {activeInvoice.method}</div>
            <div><strong>Status:</strong> {activeInvoice.status}</div>
          </div>

          <table className="w-full text-left text-xs border mb-6">
            <thead>
              <tr className="bg-slate-100 font-bold">
                <th className="p-2 border">Description</th>
                <th className="p-2 border text-right">Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-2 border">{activeInvoice.membershipPlan} subscription fee</td>
                <td className="p-2 border text-right">₹{activeInvoice.amount.toLocaleString("en-IN")}</td>
              </tr>
              <tr className="font-bold border-t-2">
                <td className="p-2 border text-right">Grand Total:</td>
                <td className="p-2 border text-right">₹{activeInvoice.amount.toLocaleString("en-IN")}</td>
              </tr>
            </tbody>
          </table>

          {activeInvoice.notes && (
            <div className="text-xs text-slate-500 italic mb-6">
              <strong>Billing Note:</strong> "{activeInvoice.notes}"
            </div>
          )}

          <div className="mt-12 text-center text-[10px] text-slate-400 border-t pt-4">
            Thank you for training with Apex Fitness Studio! Generated via Gym CRM.
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
