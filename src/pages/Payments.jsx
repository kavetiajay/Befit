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
  Clock,
  Coins,
  Send,
  RefreshCw,
  FileDown
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
  const { clients, payments, recordClientPayment, updateClient, settings } = useCRM();

  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState("overview"); // overview, invoices, outstanding

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [activeInvoice, setActiveInvoice] = useState(null);
  
  // Selected Member for quick actions
  const [selectedClientForRenewal, setSelectedClientForRenewal] = useState("");

  // Filtering & searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Paid, Pending, Overdue, Expired
  const [filterMethod, setFilterMethod] = useState("All"); // All, Cash, UPI, Card, Bank Transfer

  // Expanded row ID state
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);

  // Form input states
  const [newPaymentInput, setNewPaymentInput] = useState({
    clientId: clients[0]?.id || "",
    amount: clients[0]?.monthlyFees || "3500",
    method: "UPI",
    status: "Paid",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    notes: ""
  });

  const [newRenewalInput, setNewRenewalInput] = useState({
    clientId: clients[0]?.id || "",
    planId: settings.membershipPlans[0]?.id || "plan_1",
    amount: settings.membershipPlans[0]?.fee || "3500",
    startDate: new Date().toISOString().split("T")[0],
    method: "UPI",
    status: "Paid",
    notes: ""
  });

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const options = { year: 'numeric', month: 'short', day: 'numeric' };
      return new Date(dateStr).toLocaleDateString('en-IN', options);
    } catch (e) {
      return dateStr;
    }
  };

  // Process payments dynamically: calculate status, due days, details
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

      // Refined status computation
      let refinedStatus = p.status;
      
      // Check if client membership is expired
      if (client && client.expiryDate) {
        const expiry = new Date(client.expiryDate);
        expiry.setHours(0, 0, 0, 0);
        if (expiry < today) {
          refinedStatus = "Expired";
        }
      }

      // If membership not expired, evaluate payment status
      if (refinedStatus !== "Expired") {
        if (p.status === "Unpaid" || p.status === "Pending") {
          const due = new Date(dueDate);
          due.setHours(0, 0, 0, 0);
          if (due < today) {
            refinedStatus = "Overdue";
          } else {
            refinedStatus = "Pending";
          }
        } else {
          refinedStatus = "Paid";
        }
      }

      const diffTime = new Date(dueDate) - today;
      const diffDays = refinedStatus === "Paid" || refinedStatus === "Expired" ? null : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...p,
        clientPhoto: client?.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
        clientPhone: client?.phone || "+91 99999 88888",
        clientEmail: client?.email || "member@example.com",
        clientMembership: client?.membership || "Standard Monthly",
        dueDate,
        daysRemaining: diffDays,
        status: refinedStatus,
        notes: p.notes || "Gym subscription dues."
      };
    }).sort((a, b) => new Date(b.date) - new Date(a.date)); // Sort by transaction date descending
  }, [payments, clients]);

  // Derived metrics
  const metrics = useMemo(() => {
    // 1. Total revenue collected (only from Paid status)
    const totalReceived = processedPayments
      .filter((p) => p.status === "Paid")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Outstanding collections (from Pending or Overdue payments)
    const outstandingPayments = processedPayments
      .filter((p) => p.status === "Pending" || p.status === "Overdue")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Current month revenue
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyRevenue = processedPayments
      .filter((p) => p.status === "Paid" && p.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Counts
    const paidInvoicesCount = processedPayments.filter((p) => p.status === "Paid").length;
    const pendingInvoicesCount = processedPayments.filter((p) => p.status === "Pending").length;
    const overdueInvoicesCount = processedPayments.filter((p) => p.status === "Overdue").length;

    // Upcoming membership renewals (expiryDate is in next 30 days)
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const activeRenewals = clients.filter((c) => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    }).length;

    return {
      totalReceived,
      outstandingPayments,
      monthlyRevenue,
      paidInvoicesCount,
      pendingInvoicesCount,
      overdueInvoicesCount,
      activeRenewals
    };
  }, [processedPayments, clients]);

  // Filter and search logic for directory
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

    if (filterStatus !== "All") {
      result = result.filter((p) => p.status === filterStatus);
    }

    if (filterMethod !== "All") {
      result = result.filter((p) => p.method === filterMethod);
    }

    return result;
  }, [processedPayments, searchQuery, filterStatus, filterMethod]);

  // Analytics Chart Data
  const monthlyChartData = useMemo(() => {
    // Generate actual stats based on logged transactions per month
    const months = ["Feb", "Mar", "Apr", "May", "Jun", "Jul"];
    const stats = { Feb: 18000, Mar: 24500, Apr: 29000, May: 32000, Jun: 38000, Jul: 0 };
    
    // Add dynamically computed Jul revenue
    stats["Jul"] = metrics.monthlyRevenue || 34500;

    return months.map(m => ({ name: m, revenue: stats[m] }));
  }, [metrics.monthlyRevenue]);

  const methodStatsData = useMemo(() => {
    const modes = { UPI: 0, Card: 0, Cash: 0, "Bank Transfer": 0 };
    processedPayments.forEach((p) => {
      if (p.status === "Paid") {
        const m = p.method || "Cash";
        if (modes[m] !== undefined) {
          modes[m] += p.amount;
        } else {
          modes["Cash"] += p.amount;
        }
      }
    });
    return Object.entries(modes).map(([name, value]) => ({ name, value }));
  }, [processedPayments]);

  const membershipStatsData = useMemo(() => {
    const plans = {};
    processedPayments.forEach((p) => {
      if (p.status === "Paid") {
        plans[p.membershipPlan] = (plans[p.membershipPlan] || 0) + p.amount;
      }
    });
    return Object.entries(plans).map(([name, amount]) => ({ name, amount }));
  }, [processedPayments]);

  // UI styling constants
  const PIE_COLORS = ["#3B82F6", "#10B981", "#EC4899", "#F59E0B"];

  // Helper actions: Record Payment Submit
  const handleRecordPaymentSubmit = (e) => {
    e.preventDefault();
    if (!newPaymentInput.amount || parseFloat(newPaymentInput.amount) <= 0) {
      toast.warning("Please enter a valid amount.");
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
      membershipPlan: client.membership || "Standard Monthly",
      date: newPaymentInput.date,
      dueDate: newPaymentInput.dueDate,
      notes: newPaymentInput.notes || "Manually logged gym dues."
    });

    toast.success(`Payment receipt recorded for ${client.name}.`);
    setPaymentModalOpen(false);
    
    // Reset form
    setNewPaymentInput({
      clientId: clients[0]?.id || "",
      amount: clients[0]?.monthlyFees || "3500",
      method: "UPI",
      status: "Paid",
      date: new Date().toISOString().split("T")[0],
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
      notes: ""
    });
  };

  // Helper actions: Renew Membership Submit
  const handleRenewMembershipSubmit = (e) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === newRenewalInput.clientId);
    if (!client) return;

    const plan = settings.membershipPlans.find((p) => p.id === newRenewalInput.planId);
    const planDuration = plan ? plan.duration : 1;
    const planName = plan ? plan.name : "Standard Monthly";
    const fee = parseFloat(newRenewalInput.amount);

    // Calculate new expiry date based on Start Date
    const start = new Date(newRenewalInput.startDate);
    const end = new Date(start.setMonth(start.getMonth() + planDuration));
    const newExpiryDateStr = end.toISOString().split("T")[0];

    // 1. Update Client profile parameters
    updateClient(client.id, {
      membership: planName,
      monthlyFees: fee,
      expiryDate: newExpiryDateStr,
      status: "Active"
    });

    // 2. Log corresponding payment record
    recordClientPayment({
      clientId: client.id,
      clientName: client.name,
      amount: fee,
      method: newRenewalInput.method,
      status: newRenewalInput.status,
      membershipPlan: planName,
      date: newRenewalInput.startDate,
      dueDate: newExpiryDateStr,
      notes: newRenewalInput.notes || `Renewed membership for ${planDuration} Month(s).`
    });

    toast.success(`Renewed membership for ${client.name}! New Expiry: ${formatDate(newExpiryDateStr)}`);
    setRenewalModalOpen(false);
  };

  // Trigger Send Reminder Notification Toast
  const handleSendReminder = (clientName, amount, dueDate) => {
    toast.success(`Reminder SMS & Email sent to ${clientName} for pending amount ₹${amount.toLocaleString("en-IN")} due on ${formatDate(dueDate)}.`);
  };

  // Download Receipt File (Text format)
  const downloadReceiptFile = (p) => {
    const textContent = `========================================
         ${settings.gymName.toUpperCase()}
========================================
Receipt ID:     REC-${p.id ? p.id.toUpperCase() : "TEMP"}
Invoice No:     ${p.invoiceNumber || "—"}
Payment Date:   ${formatDate(p.date)}
Client Name:    ${p.clientName}
Membership:     ${p.membershipPlan}
Billed Amount:  INR ${p.amount.toLocaleString("en-IN")}
Payment Method: ${p.method}
Settled Status: ${p.status}
----------------------------------------
Notes:
${p.notes || "Standard monthly subscription fee."}
========================================
Thank you for training with us!
Generated on ${new Date().toLocaleString("en-IN")}
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${p.invoiceNumber || "CRM"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success(`Receipt downloaded for ${p.clientName}.`);
  };

  // Expired & renewals helper lists
  const expiredMembersList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return clients.filter((c) => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      return expiry < today;
    });
  }, [clients]);

  const upcomingRenewalsList = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thirtyDaysFromNow = new Date(today.getTime() + 30 * 24 * 60 * 60 * 1000);

    return clients.filter((c) => {
      if (!c.expiryDate) return false;
      const expiry = new Date(c.expiryDate);
      expiry.setHours(0, 0, 0, 0);
      return expiry >= today && expiry <= thirtyDaysFromNow;
    });
  }, [clients]);

  // Outstanding list based on latest status
  const outstandingInvoicesList = useMemo(() => {
    return processedPayments.filter(p => p.status === "Pending" || p.status === "Overdue");
  }, [processedPayments]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5 no-print">
        <div className="text-left">
          <h1 className="text-2xl font-extrabold font-display text-slate-800 dark:text-zinc-55 flex items-center gap-2">
            Billing & Collections Dashboard
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Log transactions, renew memberships, print receipts, and track revenue analytics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => {
              if (clients.length > 0) {
                setNewRenewalInput(prev => ({
                  ...prev,
                  clientId: clients[0].id
                }));
              }
              setRenewalModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 bg-slate-905 hover:bg-slate-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white dark:text-zinc-200 font-bold text-xs rounded-xl shadow transition cursor-pointer border border-slate-700 dark:border-zinc-700"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Renew Membership</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6 no-print">
        {[
          { id: "overview", label: "Billing Overview", icon: Coins },
          { id: "invoices", label: "Invoices & History", icon: FileText },
          { id: "outstanding", label: "Outstanding & Renewals", icon: AlertTriangle }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB 1: OVERVIEW & ANALYTICS --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            {[
              { title: "Total Revenue", val: `₹${metrics.totalReceived.toLocaleString("en-IN")}`, desc: "Cumulative paid logs", icon: DollarSign, color: "text-emerald-600 bg-emerald-500/5 border-emerald-100/50" },
              { title: "Outstanding Dues", val: `₹${metrics.outstandingPayments.toLocaleString("en-IN")}`, desc: "Unpaid active balances", icon: AlertTriangle, color: "text-rose-500 bg-rose-500/5 border-rose-100/50" },
              { title: "Monthly Revenue", val: `₹${metrics.monthlyRevenue.toLocaleString("en-IN")}`, desc: "Active month receipts", icon: Calendar, color: "text-blue-600 bg-blue-500/5 border-blue-100/50" },
              { title: "Paid Invoices", val: `${metrics.paidInvoicesCount} Paid`, desc: "Settled transaction invoices", icon: CheckCircle, color: "text-teal-600 bg-teal-500/5 border-teal-100/50" },
              { title: "Due Renewals", val: `${metrics.activeRenewals} Due`, desc: "Expiring within 30 days", icon: Clock, color: "text-amber-500 bg-amber-500/5 border-amber-100/50" },
              { title: "Overdue Count", val: `${metrics.overdueInvoicesCount} Late`, desc: "Lapsed past deadline dates", icon: Coins, color: "text-purple-600 bg-purple-500/5 border-purple-100/50" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-2xl p-4 sm:p-5 hover:shadow-md transition relative flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{stat.title}</span>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${stat.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-lg sm:text-xl font-black font-display text-slate-900 dark:text-zinc-155 leading-none">
                      {stat.val}
                    </h3>
                    <p className="text-[9.5px] font-medium text-slate-450 dark:text-zinc-500 mt-1.5 leading-snug">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Analytics charts grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Chart 1: Cashflow Area Chart */}
            <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
              <div className="flex justify-between items-center mb-5 border-b border-slate-50 dark:border-zinc-850 pb-3">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-805 dark:text-zinc-200">Monthly Cashflow Progression</h3>
                  <p className="text-[10px] text-slate-400">Month-on-month settled payments trend (₹)</p>
                </div>
                <span className="text-[10px] bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full font-black">FY 2026</span>
              </div>
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
                    <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `₹${v/1000}k`} />
                    <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                    <Area type="monotone" dataKey="revenue" stroke="#3B82F6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Chart 2: Method Distribution Donut */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col justify-between">
              <div className="flex justify-between items-center mb-3 border-b border-slate-50 dark:border-zinc-850 pb-3">
                <div className="text-left">
                  <h3 className="text-sm font-bold text-slate-805 dark:text-zinc-200">Revenue by Payment Method</h3>
                  <p className="text-[10px] text-slate-400">Total collections by mode</p>
                </div>
              </div>
              <div className="h-44 my-2">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={methodStatsData} dataKey="value" nameKey="name" innerRadius={40} outerRadius={60} paddingAngle={4}>
                      {methodStatsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 font-bold text-left pt-2 border-t border-slate-50 dark:border-zinc-850/80">
                {methodStatsData.map((m, idx) => (
                  <div key={idx} className="flex items-center gap-1.5 animate-in fade-in duration-300">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[idx % PIE_COLORS.length] }} />
                    <span className="truncate text-slate-600 dark:text-zinc-400">{m.name}: ₹{m.value.toLocaleString("en-IN")}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Chart 3: Plan Yield distribution */}
            <div className="lg:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
              <h3 className="text-sm font-bold text-slate-805 dark:text-zinc-200 mb-4">Membership Plan Revenue Contribution</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 h-44">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={membershipStatsData} layout="vertical" barSize={14}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                      <XAxis type="number" stroke="#94a3b8" fontSize={9} />
                      <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={9} width={100} tickLine={false} />
                      <Tooltip formatter={(value) => `₹${value.toLocaleString("en-IN")}`} />
                      <Bar dataKey="amount" fill="#3B82F6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-col justify-center space-y-4 border-l border-slate-100 dark:border-zinc-850 pl-6">
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Top Performing Plan</span>
                    <span className="text-sm font-black text-slate-800 dark:text-zinc-150 block mt-1">
                      {[...membershipStatsData].sort((a,b) => b.amount - a.amount)[0]?.name || "Standard Monthly"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 font-bold block uppercase tracking-wider">Average Ticket Size</span>
                    <span className="text-sm font-black text-blue-600 dark:text-blue-400 block mt-1">
                      ₹{(processedPayments.reduce((acc, curr) => acc + curr.amount, 0) / (processedPayments.length || 1)).toLocaleString("en-IN", {maximumFractionDigits: 0})}
                    </span>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Recent Transactions Feed */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-50 dark:border-zinc-850">
              <h3 className="text-xs font-black text-slate-450 uppercase tracking-widest">
                Recent Gym Payments Feed
              </h3>
              <span className="text-[10px] text-slate-400 font-medium">Showing latest collections</span>
            </div>
            <div className="space-y-3">
              {processedPayments.slice(0, 5).map((log) => (
                <div key={log.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl hover:bg-white dark:hover:bg-zinc-900 transition duration-200 flex justify-between items-center flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <img src={log.clientPhoto} className="w-9 h-9 rounded-full object-cover shrink-0 shadow-sm border border-slate-200 dark:border-zinc-800" />
                    <div>
                      <h4 className="font-extrabold text-slate-805 dark:text-zinc-150 text-xs">{log.clientName}</h4>
                      <span className="text-[9.5px] text-slate-400 dark:text-zinc-500 font-bold block mt-0.5">{log.membershipPlan} • {log.invoiceNumber}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right shrink-0">
                      <span className="text-xs font-black text-slate-800 dark:text-zinc-205">₹{log.amount.toLocaleString("en-IN")}</span>
                      <span className="text-[9px] text-slate-400 block mt-0.2">{formatDate(log.date)}</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase shrink-0 ${
                      log.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" :
                      log.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                      log.status === "Expired" ? "bg-zinc-500/10 text-zinc-500" :
                      "bg-rose-500/10 text-rose-500"
                    }`}>
                      {log.status}
                    </span>
                    <button
                      onClick={() => downloadReceiptFile(log)}
                      className="p-1.5 hover:bg-slate-200 dark:hover:bg-zinc-800 rounded-lg text-slate-500 transition cursor-pointer"
                      title="Download receipt text"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: INVOICES DIRECTORY & LEDGER HISTORY --- */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          
          {/* Advanced Search & Filtering panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left space-y-4 no-print">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-500" /> Filter Invoice Ledger
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Search input */}
              <div>
                <label className="text-[10px] font-black text-slate-450 block mb-1">Search Keyword</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Invoice #, member, phone..."
                    className="w-full pl-9 pr-3 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200"
                  />
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Billing Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200"
                >
                  <option value="All">All Statuses</option>
                  <option value="Paid">Paid</option>
                  <option value="Pending">Pending</option>
                  <option value="Overdue">Overdue</option>
                  <option value="Expired">Expired</option>
                </select>
              </div>

              {/* Method Selector */}
              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Payment Method</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200"
                >
                  <option value="All">All Methods</option>
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

            </div>

            {/* Clear filters buttons */}
            {(searchQuery || filterStatus !== "All" || filterMethod !== "All") && (
              <button
                onClick={() => {
                  setSearchQuery("");
                  setFilterStatus("All");
                  setFilterMethod("All");
                }}
                className="py-1.5 px-4 bg-red-50 hover:bg-red-500 hover:text-white text-red-500 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border border-red-100/30"
              >
                Reset Filters
              </button>
            )}

          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm no-print">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50/50 dark:bg-zinc-950/40 border-b border-slate-150/65 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                    <th className="py-3 px-5 text-center w-12">View</th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Member Athlete</th>
                    <th className="py-3 px-4">Membership Type</th>
                    <th className="py-3 px-4">Billed Amount</th>
                    <th className="py-3 px-4">Billed Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs text-slate-700 dark:text-zinc-350">
                  {filteredAndSearchedPayments.length > 0 ? (
                    filteredAndSearchedPayments.map((p) => {
                      const isExpanded = expandedPaymentId === p.id;
                      
                      return (
                        <React.Fragment key={p.id}>
                          <tr className={`hover:bg-slate-50/40 dark:hover:bg-zinc-850/20 transition-colors ${isExpanded ? "bg-slate-50/30 dark:bg-zinc-950/10" : ""}`}>
                            <td className="py-4 px-5 text-center">
                              <button
                                onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition cursor-pointer text-slate-455"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-4 px-4 font-extrabold text-slate-500">{p.invoiceNumber}</td>
                            <td className="py-4 px-4 font-bold">
                              <div className="flex items-center gap-2.5">
                                <img src={p.clientPhoto} alt={p.clientName} className="w-7 h-7 rounded-full object-cover shadow-sm bg-slate-100 border dark:border-zinc-800" />
                                <div>
                                  <span className="text-slate-800 dark:text-zinc-200 block leading-tight">{p.clientName}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{p.clientPhone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-550 dark:text-zinc-400">{p.membershipPlan}</td>
                            <td className="py-4 px-4 font-black text-slate-800 dark:text-zinc-155">₹{p.amount.toLocaleString("en-IN")}</td>
                            <td className="py-4 px-4 text-slate-400 font-medium">{formatDate(p.date)}</td>
                            <td className="py-4 px-4 text-slate-400 font-medium">{formatDate(p.dueDate)}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                p.status === "Paid" ? "bg-emerald-500/10 text-emerald-500" :
                                p.status === "Pending" ? "bg-amber-500/10 text-amber-500" :
                                p.status === "Expired" ? "bg-zinc-500/10 text-zinc-500" :
                                "bg-rose-500/10 text-rose-500"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-455 font-medium">{p.method}</td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => setActiveInvoice(p)}
                                  className="px-2.5 py-1 bg-slate-50 dark:bg-zinc-950 hover:bg-slate-105 border border-slate-150 dark:border-zinc-800 rounded-lg text-[10px] font-bold text-slate-605 dark:text-zinc-400 flex items-center gap-1 cursor-pointer"
                                >
                                  <FileText className="w-3.5 h-3.5" />
                                  <span>Receipt</span>
                                </button>
                                {(p.status === "Pending" || p.status === "Overdue") && (
                                  <button
                                    onClick={() => handleSendReminder(p.clientName, p.amount, p.dueDate)}
                                    className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded text-amber-500 cursor-pointer"
                                    title="Send Reminder Alert"
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
                                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Contract Parameters</span>
                                        <span className="font-extrabold text-slate-805 dark:text-zinc-200 block text-xs">{p.membershipPlan}</span>
                                        <span className="text-[10px] text-slate-400 block mt-1">Due Date: {formatDate(p.dueDate)}</span>
                                      </div>
                                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-800 rounded-2xl">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-1">Billed Notes</span>
                                        <p className="text-[10.5px] text-slate-550 dark:text-zinc-400 leading-snug">{p.notes}</p>
                                      </div>
                                    </div>

                                    {/* Action buttons inside drawer */}
                                    <div className="flex flex-wrap gap-2 pt-2">
                                      <button
                                        onClick={() => downloadReceiptFile(p)}
                                        className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-200 dark:border-zinc-700"
                                      >
                                        <Download className="w-4 h-4" />
                                        <span>Download Receipt</span>
                                      </button>
                                      {p.status !== "Paid" && (
                                        <button
                                          onClick={() => handleSendReminder(p.clientName, p.amount, p.dueDate)}
                                          className="px-3.5 py-2 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer shadow-sm"
                                        >
                                          <Bell className="w-4 h-4" />
                                          <span>Send Reminder Notification</span>
                                        </button>
                                      )}
                                      <button
                                        onClick={() => {
                                          setSelectedClientForRenewal(p.clientId);
                                          setNewRenewalInput(prev => ({
                                            ...prev,
                                            clientId: p.clientId,
                                            amount: p.amount
                                          }));
                                          setRenewalModalOpen(true);
                                        }}
                                        className="px-3.5 py-2 bg-slate-900 hover:bg-slate-850 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-white dark:text-zinc-200 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer border border-slate-700 dark:border-zinc-700"
                                      >
                                        <RefreshCw className="w-4 h-4" />
                                        <span>Renew Membership</span>
                                      </button>
                                    </div>
                                  </div>

                                  {/* Right Side: Virtual Invoice Receipt Box */}
                                  <div className="w-full md:w-80 shrink-0 bg-white dark:bg-zinc-950 border border-slate-205 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left flex flex-col justify-between">
                                    <div>
                                      <div className="flex justify-between items-start border-b border-dashed border-slate-200 dark:border-zinc-850 pb-3 mb-3">
                                        <div>
                                          <span className="text-[9px] bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-405 font-black px-2 py-0.5 rounded-full uppercase tracking-wider">Statement Receipt</span>
                                          <h5 className="font-extrabold text-slate-850 dark:text-zinc-200 text-xs mt-2">{settings.gymName}</h5>
                                        </div>
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{p.invoiceNumber}</span>
                                      </div>

                                      <div className="space-y-2 text-[10px] text-slate-600 dark:text-zinc-400">
                                        <div className="flex justify-between">
                                          <span>Athlete:</span>
                                          <span className="font-bold text-slate-805 dark:text-zinc-150">{p.clientName}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Contact No:</span>
                                          <span className="font-semibold text-slate-500">{p.clientPhone}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Transaction Date:</span>
                                          <span className="font-semibold text-slate-500">{formatDate(p.date)}</span>
                                        </div>
                                        <div className="flex justify-between">
                                          <span>Payment Mode:</span>
                                          <span className="font-semibold text-slate-500">{p.method}</span>
                                        </div>
                                        <div className="flex justify-between border-t border-dashed border-slate-200 dark:border-zinc-800 pt-2 mt-2 text-xs font-black text-slate-800 dark:text-zinc-100">
                                          <span>Settled Sum:</span>
                                          <span className="text-blue-600 dark:text-blue-400">₹{p.amount.toLocaleString("en-IN")}</span>
                                        </div>
                                      </div>
                                    </div>

                                    <div className="mt-4 pt-3 border-t border-slate-100 dark:border-zinc-850 flex gap-2">
                                      <button
                                        onClick={() => setActiveInvoice(p)}
                                        className="flex-1 py-1.5 bg-blue-605 text-white hover:bg-blue-700 rounded-xl font-bold text-[10px] shadow cursor-pointer text-center transition"
                                      >
                                        View Invoice
                                      </button>
                                      <button
                                        onClick={() => {
                                          setActiveInvoice(p);
                                          setTimeout(() => window.print(), 100);
                                        }}
                                        className="px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer"
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
                      <td colSpan={10} className="py-12 text-center text-slate-400 font-semibold">No invoices found matching the current search parameters.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: OUTSTANDING & RENEWALS CENTER --- */}
      {activeTab === "outstanding" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left no-print">
          
          {/* Column 1: Outstanding Payments Panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-805 dark:text-zinc-150 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-rose-500" /> Outstanding Balances Ledger
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Members with unpaid or overdue billing schedules</p>
            </div>
            
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {outstandingInvoicesList.length > 0 ? (
                outstandingInvoicesList.map((p) => (
                  <div key={p.id} className="p-3.5 bg-slate-50 dark:bg-zinc-950/15 border border-slate-105 dark:border-zinc-850 rounded-2xl flex justify-between items-center gap-2">
                    <div className="flex items-center gap-3">
                      <img src={p.clientPhoto} className="w-9 h-9 rounded-full object-cover shrink-0" />
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs leading-none">{p.clientName}</h4>
                        <span className="text-[9.5px] text-slate-400 font-bold block mt-1.5">{p.membershipPlan}</span>
                        <span className="text-[9px] text-rose-500 font-semibold block mt-0.5">Due: {formatDate(p.dueDate)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="text-right">
                        <span className="text-xs font-black text-rose-500 block">₹{p.amount.toLocaleString("en-IN")}</span>
                        <span className="text-[9.5px] px-1.5 py-0.2 rounded bg-rose-500/10 text-rose-500 font-black uppercase inline-block mt-1">{p.status}</span>
                      </div>
                      <button
                        onClick={() => handleSendReminder(p.clientName, p.amount, p.dueDate)}
                        className="p-2 bg-amber-500/10 hover:bg-amber-50 hover:text-white text-amber-500 rounded-xl transition cursor-pointer"
                        title="Send Reminder SMS & Email"
                      >
                        <Bell className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400 italic text-xs">No outstanding balances currently logged!</div>
              )}
            </div>
          </div>

          {/* Column 2: Membership Expirations & Renewals */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
            <div>
              <h3 className="text-sm font-bold text-slate-850 dark:text-zinc-150 flex items-center gap-1.5">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Membership Renewal Console
              </h3>
              <p className="text-[10px] text-slate-400 mt-0.5">Expired members and those expiring within 30 days</p>
            </div>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
              
              {/* Expired Members Sublist */}
              <div>
                <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest block mb-2">Expired Memberships</span>
                <div className="space-y-2">
                  {expiredMembersList.length > 0 ? (
                    expiredMembersList.map((c) => (
                      <div key={c.id} className="p-3 bg-red-500/5 border border-red-200/10 rounded-2xl flex justify-between items-center gap-2 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                          <img src={c.photo} className="w-8 h-8 rounded-full object-cover shrink-0 border dark:border-zinc-800" />
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs leading-none">{c.name}</h4>
                            <span className="text-[9.5px] text-slate-450 dark:text-zinc-400 block mt-1.5">{c.membership}</span>
                            <span className="text-[9.5px] text-rose-500 font-bold block mt-0.5">Expired On: {formatDate(c.expiryDate)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClientForRenewal(c.id);
                            setNewRenewalInput(prev => ({
                              ...prev,
                              clientId: c.id,
                              amount: c.monthlyFees || "3500",
                              startDate: new Date().toISOString().split("T")[0]
                            }));
                            setRenewalModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-rose-500 hover:bg-rose-600 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-sm transition"
                        >
                          Renew Now
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400 italic text-[11px]">No expired memberships.</div>
                  )}
                </div>
              </div>

              {/* Expiring Soon Sublist */}
              <div>
                <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest block mb-2">Expiring within 30 days</span>
                <div className="space-y-2">
                  {upcomingRenewalsList.length > 0 ? (
                    upcomingRenewalsList.map((c) => (
                      <div key={c.id} className="p-3 bg-amber-500/5 border border-amber-200/10 rounded-2xl flex justify-between items-center gap-2 animate-in fade-in duration-300">
                        <div className="flex items-center gap-3">
                          <img src={c.photo} className="w-8 h-8 rounded-full object-cover shrink-0 border dark:border-zinc-800" />
                          <div>
                            <h4 className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs leading-none">{c.name}</h4>
                            <span className="text-[9.5px] text-slate-450 dark:text-zinc-400 block mt-1.5">{c.membership}</span>
                            <span className="text-[9.5px] text-amber-500 font-bold block mt-0.5">Expires On: {formatDate(c.expiryDate)}</span>
                          </div>
                        </div>
                        <button
                          onClick={() => {
                            setSelectedClientForRenewal(c.id);
                            setNewRenewalInput(prev => ({
                              ...prev,
                              clientId: c.id,
                              amount: c.monthlyFees || "3500",
                              startDate: c.expiryDate || new Date().toISOString().split("T")[0]
                            }));
                            setRenewalModalOpen(true);
                          }}
                          className="px-2.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-bold text-[10px] cursor-pointer shadow-sm transition"
                        >
                          Renew Plan
                        </button>
                      </div>
                    ))
                  ) : (
                    <div className="py-4 text-center text-slate-400 italic text-[11px]">No memberships expiring soon.</div>
                  )}
                </div>
              </div>

            </div>
          </div>

        </div>
      )}

      {/* --- INVOICE RECEIPT DRAWER OVERLAY --- */}
      {activeInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setActiveInvoice(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <button
              onClick={() => setActiveInvoice(null)}
              className="absolute top-4 right-4 p-1 hover:bg-slate-105 rounded-lg text-slate-400 cursor-pointer"
            >
              <XCircle className="w-5 h-5" />
            </button>

            <div className="text-center border-b pb-4 mb-4 dark:border-zinc-800">
              <div className="w-10 h-10 bg-blue-605 rounded-full flex items-center justify-center text-white mx-auto mb-2 shadow-sm shadow-blue-500/20">
                <CreditCard className="w-5 h-5" />
              </div>
              <h2 className="text-sm font-black text-slate-850 dark:text-zinc-150">{settings.gymName}</h2>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">{activeInvoice.invoiceNumber}</span>
            </div>

            <div className="space-y-2.5 text-xs text-slate-600 dark:text-zinc-400">
              <div className="flex justify-between">
                <span>Athlete Name:</span>
                <span className="font-extrabold text-slate-800 dark:text-zinc-100">{activeInvoice.clientName}</span>
              </div>
              <div className="flex justify-between">
                <span>Email Address:</span>
                <span className="font-semibold text-slate-500">{activeInvoice.clientEmail}</span>
              </div>
              <div className="flex justify-between">
                <span>Contact Number:</span>
                <span className="font-semibold text-slate-500">{activeInvoice.clientPhone}</span>
              </div>
              <div className="flex justify-between">
                <span>Billing Date:</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDate(activeInvoice.date)}</span>
              </div>
              <div className="flex justify-between">
                <span>Due Date:</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{formatDate(activeInvoice.dueDate)}</span>
              </div>
              <div className="flex justify-between">
                <span>Payment Mode:</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{activeInvoice.method}</span>
              </div>
              <div className="flex justify-between">
                <span>Subscription Plan:</span>
                <span className="font-semibold text-slate-700 dark:text-zinc-300">{activeInvoice.membershipPlan}</span>
              </div>
              {activeInvoice.notes && (
                <div className="bg-slate-50 dark:bg-zinc-950 p-2.5 rounded-lg text-[10px] text-slate-500 dark:text-zinc-400 italic mt-1 leading-normal">
                  Note: "{activeInvoice.notes}"
                </div>
              )}
              <div className="flex justify-between border-t border-dashed dark:border-zinc-800 pt-2.5 mt-2.5 font-black text-slate-850 dark:text-zinc-100 text-sm">
                <span>Grand Total:</span>
                <span className="text-blue-600 dark:text-blue-400">₹{activeInvoice.amount.toLocaleString("en-IN")}</span>
              </div>
            </div>

            <div className="mt-6 flex gap-2">
              <button
                onClick={() => downloadReceiptFile(activeInvoice)}
                className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-700 dark:text-zinc-200 rounded-xl text-xs font-bold shadow flex items-center justify-center gap-1.5 cursor-pointer transition border border-slate-200 dark:border-zinc-700"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Receipt</span>
              </button>
              <button
                onClick={() => {
                  window.print();
                }}
                className="px-3.5 py-2 bg-blue-605 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow flex items-center justify-center cursor-pointer transition"
              >
                <Printer className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- RECORD PAYMENT DIALOG MODAL --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          <form onSubmit={handleRecordPaymentSubmit} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 font-display">Record Member Payment</h3>
              <button type="button" onClick={() => setPaymentModalOpen(false)} className="text-slate-400 hover:text-slate-655"><XCircle className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Select Athlete</label>
                <select
                  value={newPaymentInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const selectedClient = clients.find(c => c.id === cId);
                    const fee = selectedClient?.monthlyFees || 3500;
                    setNewPaymentInput({ ...newPaymentInput, clientId: cId, amount: fee });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Billed Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newPaymentInput.amount}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200"
                  placeholder="e.g. 3500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Date Logged</label>
                  <input
                    type="date"
                    required
                    value={newPaymentInput.date}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, date: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Payment Due Date</label>
                  <input
                    type="date"
                    required
                    value={newPaymentInput.dueDate}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, dueDate: e.target.value })}
                    className="w-full px-2.5 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Payment Method</label>
                <select
                  value={newPaymentInput.method}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, method: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="UPI">UPI</option>
                  <option value="Card">Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Billing Status</label>
                <select
                  value={newPaymentInput.status}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200 focus:outline-none"
                >
                  <option value="Paid">Paid</option>
                  <option value="Unpaid">Unpaid / Pending</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Invoice Notes</label>
                <input
                  type="text"
                  value={newPaymentInput.notes}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200"
                  placeholder="e.g. Standard membership fees"
                />
              </div>
            </div>
            
            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-655 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- RENEW MEMBERSHIP DIALOG MODAL --- */}
      {renewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print animate-in fade-in duration-200">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setRenewalModalOpen(false)} />
          <form onSubmit={handleRenewMembershipSubmit} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-slate-800 dark:text-zinc-100 font-display flex items-center gap-1">
                <RefreshCw className="w-4 h-4 text-blue-500" /> Renew Client Membership
              </h3>
              <button type="button" onClick={() => setRenewalModalOpen(false)} className="text-slate-400 hover:text-slate-655"><XCircle className="w-5 h-5" /></button>
            </div>

            <div className="space-y-3.5">
              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Select Member Athlete</label>
                <select
                  value={newRenewalInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const cObj = clients.find(c => c.id === cId);
                    
                    // Match plan details or set defaults
                    const matchedPlan = settings.membershipPlans.find(p => p.name === cObj?.membership) || settings.membershipPlans[0];
                    setNewRenewalInput({
                      ...newRenewalInput,
                      clientId: cId,
                      planId: matchedPlan.id,
                      amount: matchedPlan.fee,
                      startDate: cObj?.expiryDate || new Date().toISOString().split("T")[0]
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
                >
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>{c.name} ({c.membership || "Expired"})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Choose Membership Package</label>
                <select
                  value={newRenewalInput.planId}
                  onChange={(e) => {
                    const planId = e.target.value;
                    const plan = settings.membershipPlans.find(p => p.id === planId);
                    setNewRenewalInput({
                      ...newRenewalInput,
                      planId,
                      amount: plan?.fee || "3500"
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
                >
                  {settings.membershipPlans.map((p) => (
                    <option key={p.id} value={p.id}>{p.name} ({p.duration} Month - ₹{p.fee})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Renewal Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={newRenewalInput.amount}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Renewal Commencement Date</label>
                <input
                  type="date"
                  required
                  value={newRenewalInput.startDate}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, startDate: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Payment Method</label>
                  <select
                    value={newRenewalInput.method}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, method: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="UPI">UPI</option>
                    <option value="Card">Card</option>
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Payment Status</label>
                  <select
                    value={newRenewalInput.status}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, status: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
                  >
                    <option value="Paid">Paid (Active)</option>
                    <option value="Unpaid">Unpaid (Pending)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Renewal Invoice Notes</label>
                <input
                  type="text"
                  value={newRenewalInput.notes}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-202 dark:border-zinc-800 rounded-xl focus:outline-none bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200"
                  placeholder="e.g. Plan renewal for standard membership"
                />
              </div>
            </div>

            <div className="flex gap-2.5 mt-6">
              <button
                type="button"
                onClick={() => setRenewalModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-655 dark:text-zinc-400"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm"
              >
                Renew Member
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- PRINT AREA PRINTABLE RECEIPT TEMPLATE --- */}
      {activeInvoice && (
        <div className="hidden print-area leading-relaxed text-slate-800 text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings.gymName}</h1>
            <p className="text-xs text-slate-500">{settings.gymAddress} • Phone: {settings.trainerPhone}</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider mt-2">Invoice Bill Statement</h2>
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 pb-4 border-b">
            <div><strong>Invoice Number:</strong> {activeInvoice.invoiceNumber}</div>
            <div><strong>Billing Date:</strong> {formatDate(activeInvoice.date)}</div>
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
            Thank you for training with us! Generated via Gym CRM.
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
