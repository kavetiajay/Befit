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
  FileDown,
  X
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "../components/AnimatedNumber";

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
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 65 * 1000).toISOString().split("T")[0],
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
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 dark:border-zinc-800 pb-5 no-print">
        <div className="text-left">
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-805 dark:text-zinc-50 flex items-center gap-2">
            Billing Ledger
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Log transactions, renew memberships, print receipts, and track revenue metrics.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white font-bold text-xs rounded-2xl shadow transition cursor-pointer"
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
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-850 text-slate-700 dark:text-zinc-350 font-bold text-xs rounded-2xl shadow cursor-pointer border border-slate-205 dark:border-zinc-800 transition"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
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

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            {[
              { title: "Total Revenue", val: `₹${metrics.totalReceived.toLocaleString("en-IN")}`, desc: "Cumulative paid logs", icon: DollarSign, color: "text-emerald-650 bg-emerald-500/5 border-emerald-100/50" },
              { title: "Outstanding Dues", val: `₹${metrics.outstandingPayments.toLocaleString("en-IN")}`, desc: "Unpaid active balances", icon: AlertTriangle, color: "text-rose-600 bg-rose-500/5 border-rose-100/50" },
              { title: "Monthly Revenue", val: `₹${metrics.monthlyRevenue.toLocaleString("en-IN")}`, desc: "Active month receipts", icon: Calendar, color: "text-blue-600 bg-blue-500/5 border-blue-100/50" },
              { title: "Paid Invoices", val: `${metrics.paidInvoicesCount} Paid`, desc: "Settled invoices", icon: CheckCircle, color: "text-teal-650 bg-teal-500/5 border-teal-100/50" },
              { title: "Due Renewals", val: `${metrics.activeRenewals} Due`, desc: "Expires in 30 days", icon: Clock, color: "text-amber-600 bg-amber-500/5 border-amber-100/50" },
              { title: "Overdue Count", val: `${metrics.overdueInvoicesCount} Late`, desc: "Lapsed past deadline", icon: Coins, color: "text-purple-600 bg-purple-500/5 border-purple-100/50" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 hover:shadow-md transition relative flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">{stat.title}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color} shrink-0`}>
                      <Icon className="w-4.5 h-4.5" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-50 leading-none">
                      {stat.val.startsWith("₹") ? (
                        <>₹<AnimatedNumber value={parseInt(stat.val.replace(/[^0-9]/g, ''))} /></>
                      ) : stat.val.includes(" ") ? (
                        <><AnimatedNumber value={parseInt(stat.val)} /> {stat.val.split(" ")[1]}</>
                      ) : (
                        stat.val
                      )}
                    </h3>
                    <p className="text-[9px] text-slate-400 dark:text-zinc-500 mt-2 font-semibold leading-normal">
                      {stat.desc}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Transactions Feed Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-850">
              <div>
                <h3 className="text-sm font-extrabold text-slate-805 dark:text-zinc-100">
                  Recent Transactions Feed
                </h3>
                <p className="text-xs text-slate-450 mt-0.5">Showing latest gym membership collections and ledger updates</p>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-550 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase">
                Active Feed
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-850 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/20">
                    <th className="py-2.5 px-4">Member</th>
                    <th className="py-2.5 px-4">Membership Plan</th>
                    <th className="py-2.5 px-4">Invoice No</th>
                    <th className="py-2.5 px-4">Billed Date</th>
                    <th className="py-2.5 px-4">Settled Status</th>
                    <th className="py-2.5 px-4">Billed Amount</th>
                    <th className="py-2.5 px-4 text-right">Invoice</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-850/40">
                  {processedPayments.slice(0, 8).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-850/15">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={log.clientPhoto} className="w-8.5 h-8.5 rounded-xl object-cover shrink-0 shadow-sm border bg-slate-100" />
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200 block">{log.clientName}</span>
                          <span className="text-[9px] text-slate-400 block mt-0.5">{log.clientPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-650 dark:text-zinc-400">{log.membershipPlan}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-500">{log.invoiceNumber}</td>
                      <td className="py-3 px-4 text-slate-400 font-medium">{formatDate(log.date)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                          log.status === "Paid" ? "bg-emerald-500/10 text-emerald-550" :
                          log.status === "Pending" ? "bg-amber-500/10 text-amber-550" :
                          log.status === "Expired" ? "bg-zinc-500/10 text-zinc-500" :
                          "bg-rose-500/10 text-rose-500"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-850 dark:text-zinc-100">₹{log.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => downloadReceiptFile(log)}
                          className="p-1.5 hover:bg-slate-105 dark:hover:bg-zinc-800 text-slate-450 hover:text-blue-600 rounded-lg transition-colors cursor-pointer"
                          title="Download receipt text"
                        >
                          <Download className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 2: INVOICES DIRECTORY --- */}
      {activeTab === "invoices" && (
        <div className="space-y-6">
          
          {/* Advanced Search & Filtering panel */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm text-left space-y-4 no-print">
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
                    placeholder="Invoice #, member name, phone..."
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-805 dark:text-zinc-200"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-3 text-slate-405 hover:text-slate-600 dark:hover:text-slate-355 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Billing Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955 text-xs focus:outline-none text-slate-805 dark:text-zinc-200"
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
                  className="w-full px-3 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955 text-xs focus:outline-none text-slate-805 dark:text-zinc-200"
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
                className="py-1.5 px-4 bg-rose-50 hover:bg-rose-500 hover:text-white text-rose-500 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border border-rose-100/30"
              >
                Reset Filters
              </button>
            )}
          </div>

          {/* Transactions Ledger Table */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-850 rounded-3xl overflow-hidden shadow-sm no-print">
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
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-850 rounded transition cursor-pointer text-slate-455"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-500">{p.invoiceNumber}</td>
                            <td className="py-4 px-4 font-bold">
                              <div className="flex items-center gap-2.5">
                                <img src={p.clientPhoto} alt={p.clientName} className="w-7 h-7 rounded-xl object-cover shadow-sm bg-slate-100 border dark:border-zinc-800" />
                                <div>
                                  <span className="text-slate-800 dark:text-zinc-200 block leading-tight">{p.clientName}</span>
                                  <span className="text-[9px] text-slate-400 font-semibold block mt-0.5">{p.clientPhone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-550 dark:text-zinc-400">{p.membershipPlan}</td>
                            <td className="py-4 px-4 font-black text-slate-800 dark:text-zinc-155">₹{p.amount.toLocaleString("en-IN")}</td>
                            <td className="py-4 px-4 text-slate-405 font-medium">{formatDate(p.date)}</td>
                            <td className="py-4 px-4 text-slate-405 font-medium">{formatDate(p.dueDate)}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                p.status === "Paid" ? "bg-emerald-500/10 text-emerald-650" :
                                p.status === "Pending" ? "bg-amber-500/10 text-amber-650" :
                                p.status === "Expired" ? "bg-zinc-500/10 text-zinc-500" :
                                "bg-rose-500/10 text-rose-650"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-455 font-medium">{p.method}</td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => downloadReceiptFile(p)}
                                  className="p-2 bg-slate-50 hover:bg-slate-150 dark:bg-zinc-800 dark:hover:bg-zinc-750 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer"
                                  title="Download receipt text"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {p.status !== "Paid" && p.status !== "Expired" && (
                                  <button
                                    onClick={() => handleSendReminder(p.clientName, p.amount, p.dueDate)}
                                    className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/10 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 rounded-xl transition cursor-pointer"
                                    title="Send payment alert"
                                  >
                                    <Send className="w-3.5 h-3.5" />
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Notes row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/20 dark:bg-zinc-950/5">
                              <td colSpan="10" className="py-4 px-8 text-left animate-in slide-in-from-top-1 duration-150">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Client Contact email</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 block mt-1">{p.clientEmail}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Associated Notes</span>
                                    <p className="text-xs text-slate-650 dark:text-zinc-400 mt-1 leading-relaxed italic">{p.notes}</p>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-[10px] text-slate-400 uppercase font-black tracking-wide block">Status remaining</span>
                                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 block mt-1">
                                      {p.status === "Paid" ? "Cleared" : p.daysRemaining ? `${p.daysRemaining} days remaining` : "Expired"}
                                    </span>
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
                      <td colSpan="10" className="py-12 text-center text-slate-400 italic">No matching transactions logged in database.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      )}

      {/* --- TAB 3: OUTSTANDING & RENEWALS --- */}
      {activeTab === "outstanding" && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left no-print animate-in fade-in duration-200">
          
          {/* Column 1: Outstanding balances */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Outstanding dues ledger</span>
              <h3 className="text-sm font-extrabold text-slate-805 dark:text-zinc-150 mt-1">Pending Invoice Alerts</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {outstandingInvoicesList.length > 0 ? (
                outstandingInvoicesList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.clientPhoto} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-150 text-xs block truncate leading-none mb-1">{item.clientName}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{item.clientMembership}</span>
                        <span className="text-[9px] text-rose-500 font-bold block mt-0.5 leading-none">Due: {formatDate(item.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-xs font-black text-slate-850 dark:text-zinc-100">₹{item.amount}</span>
                      <button
                        onClick={() => handleSendReminder(item.clientName, item.amount, item.dueDate)}
                        className="p-1.5 bg-blue-50 dark:bg-blue-900/10 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition cursor-pointer shadow-sm border border-blue-50"
                        title="Send collection warning"
                      >
                        <Send className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 italic text-xs">All pending fees collection cleared.</div>
              )}
            </div>
          </div>

          {/* Column 2: Expired memberships */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Expired membership list</span>
              <h3 className="text-sm font-extrabold text-slate-805 dark:text-zinc-150 mt-1">Requires Immediate Renewal</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {expiredMembersList.length > 0 ? (
                expiredMembersList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.photo} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-150 text-xs block truncate leading-none mb-1">{item.name}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{item.membership}</span>
                        <span className="text-[9px] text-rose-500 font-bold block mt-0.5 leading-none">Expired: {formatDate(item.expiryDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <button
                        onClick={() => {
                          setNewRenewalInput(prev => ({
                            ...prev,
                            clientId: item.id
                          }));
                          setRenewalModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-blue-400 border border-slate-205 dark:border-zinc-800 rounded-xl text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 italic text-xs">No expired active profiles registered.</div>
              )}
            </div>
          </div>

          {/* Column 3: Upcoming Renewals */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-850">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Upcoming expiration blocks</span>
              <h3 className="text-sm font-extrabold text-slate-805 dark:text-zinc-150 mt-1">Expiring within 30 Days</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {upcomingRenewalsList.length > 0 ? (
                upcomingRenewalsList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.photo} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-150 text-xs block truncate leading-none mb-1">{item.name}</span>
                        <span className="text-[9px] text-slate-400 block truncate">{item.membership}</span>
                        <span className="text-[9px] text-amber-600 font-bold block mt-0.5 leading-none">Expires: {formatDate(item.expiryDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <button
                        onClick={() => {
                          setNewRenewalInput(prev => ({
                            ...prev,
                            clientId: item.id
                          }));
                          setRenewalModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-blue-400 border border-slate-205 dark:border-zinc-800 rounded-xl text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 italic text-xs">No active memberships expiring soon.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- RECORD PAYMENT MODAL POPUP --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          {/* Blurred background overlay */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setPaymentModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in scale-in duration-300 text-left">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-extrabold text-slate-805 dark:text-zinc-100 font-display">Record Client Payment</h2>
              <button onClick={() => setPaymentModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Select Athlete</label>
                <select
                  value={newPaymentInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = clients.find(cl => cl.id === cId);
                    setNewPaymentInput({ ...newPaymentInput, clientId: cId, amount: c?.monthlyFees || "3500" });
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none"
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Amount (INR)</label>
                  <input
                    type="number"
                    value={newPaymentInput.amount}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Payment Method</label>
                  <select
                    value={newPaymentInput.method}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-805 focus:outline-none"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Billed Date</label>
                  <input
                    type="date"
                    value={newPaymentInput.date}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Payment Status</label>
                  <select
                    value={newPaymentInput.status}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-805 focus:outline-none"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Unpaid">Unpaid</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Ledger Notes</label>
                <textarea
                  value={newPaymentInput.notes}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-0"
                  placeholder="Standard monthly subscription fees."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer mt-4"
              >
                Log Payment Receipt
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- RENEW MEMBERSHIP MODAL POPUP --- */}
      {renewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          {/* Blurred background overlay */}
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-md" onClick={() => setRenewalModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in scale-in duration-300 text-left">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-base font-extrabold text-slate-850 dark:text-zinc-100 font-display">Renew Membership Subscription</h2>
              <button onClick={() => setRenewalModalOpen(false)} className="p-1 hover:bg-slate-100 rounded-lg text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewMembershipSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Select Athlete</label>
                <select
                  value={newRenewalInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = clients.find(cl => cl.id === cId);
                    setNewRenewalInput({ ...newRenewalInput, clientId: cId, amount: c?.monthlyFees || "3500" });
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none"
                >
                  {clients.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Select New Plan</label>
                  <select
                    value={newRenewalInput.planId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const plan = settings.membershipPlans.find(pl => pl.id === pId);
                      setNewRenewalInput({ ...newRenewalInput, planId: pId, amount: plan?.fee || "3500" });
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-805 focus:outline-none"
                  >
                    {settings.membershipPlans.map(pl => <option key={pl.id} value={pl.id}>{pl.name} ({pl.duration}M)</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Renewal Fee (INR)</label>
                  <input
                    type="number"
                    value={newRenewalInput.amount}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-808 dark:text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Start Date</label>
                  <input
                    type="date"
                    value={newRenewalInput.startDate}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Payment Method</label>
                  <select
                    value={newRenewalInput.method}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-805 focus:outline-none"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Card">Credit/Debit Card</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1 uppercase tracking-wide">Renewal Notes</label>
                <textarea
                  value={newRenewalInput.notes}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-955 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-0"
                  placeholder="Athlete renewal logged."
                />
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-755 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer mt-4"
              >
                Log Subscription Renewal
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};

export default Payments;
