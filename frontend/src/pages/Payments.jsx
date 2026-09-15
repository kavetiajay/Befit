import React, { useState, useMemo, useEffect } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Plus,
  DollarSign,
  Calendar,
  AlertTriangle,
  CheckCircle,
  FileText,
  Search,
  Download,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Coins,
  Send,
  RefreshCw,
  X,
  Edit2,
  UserCheck
} from "lucide-react";
import { toast } from "sonner";
import { AnimatedNumber } from "../components/AnimatedNumber";
import { SkeletonLoader } from "../components/FeedbackStates";

const Payments = () => {
  const { 
    clients, 
    payments, 
    recordClientPayment, 
    updateClient, 
    settings,
    fetchPayments,
    updateClientPayment,
    loading
  } = useCRM();

  // Navigation Tabs state
  const [activeTab, setActiveTab] = useState("overview"); // overview, invoices, outstanding

  // Modals state
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [editPaymentModalOpen, setEditPaymentModalOpen] = useState(false);
  const [renewalModalOpen, setRenewalModalOpen] = useState(false);
  const [editingPayment, setEditingPayment] = useState(null);

  // Filtering & searching states
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("All"); // All, Paid, Pending, Overdue, Expired
  const [filterMethod, setFilterMethod] = useState("All"); // All, UPI, Card, Cash, Bank Transfer

  // Expanded row ID state
  const [expandedPaymentId, setExpandedPaymentId] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  // Form input states for New Payment
  const [newPaymentInput, setNewPaymentInput] = useState({
    clientId: "",
    amount: "3500",
    method: "UPI",
    status: "Paid",
    date: new Date().toISOString().split("T")[0],
    dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    membershipStart: new Date().toISOString().split("T")[0],
    membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    transactionId: "",
    notes: ""
  });

  // Form input states for Edit Payment
  const [editPaymentInput, setEditPaymentInput] = useState({
    id: "",
    clientId: "",
    clientName: "",
    amount: "3500",
    method: "UPI",
    status: "Paid",
    date: "",
    dueDate: "",
    membershipStart: "",
    membershipEnd: "",
    transactionId: "",
    notes: ""
  });

  // Form input states for Membership Renewal
  const [newRenewalInput, setNewRenewalInput] = useState({
    clientId: "",
    planId: settings?.membershipPlans?.[0]?.id || "plan_1",
    amount: settings?.membershipPlans?.[0]?.fee || "3500",
    startDate: new Date().toISOString().split("T")[0],
    method: "UPI",
    status: "Paid",
    transactionId: "",
    notes: ""
  });

  // Set default client selection when clients load
  useEffect(() => {
    if (clients.length > 0 && !newPaymentInput.clientId) {
      const first = clients[0];
      setNewPaymentInput((prev) => ({
        ...prev,
        clientId: first.id,
        amount: String(first.monthlyFees || 3500)
      }));
      setNewRenewalInput((prev) => ({
        ...prev,
        clientId: first.id
      }));
    }
  }, [clients]);

  // Helper: Format Date
  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    try {
      const options = { year: "numeric", month: "short", day: "numeric" };
      return new Date(dateStr).toLocaleDateString("en-IN", options);
    } catch {
      return dateStr;
    }
  };

  // Process payments dynamically: ensure consistent status evaluation
  const processedPayments = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return payments.map((p) => {
      const client = clients.find((c) => c.id === p.clientId);
      
      const dueDateStr = p.dueDate || (p.date ? new Date(new Date(p.date).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0] : new Date().toISOString().split("T")[0]);
      
      // Determine status faithfully
      let resolvedStatus = p.status || "Paid";
      if (resolvedStatus === "Pending" || resolvedStatus === "Unpaid") {
        const due = new Date(dueDateStr);
        due.setHours(0, 0, 0, 0);
        if (due < today) {
          resolvedStatus = "Overdue";
        } else {
          resolvedStatus = "Pending";
        }
      }

      const diffTime = new Date(dueDateStr).getTime() - today.getTime();
      const diffDays = resolvedStatus === "Paid" ? null : Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      return {
        ...p,
        clientName: p.clientName || client?.name || "Client",
        clientPhoto: p.clientPhoto || client?.photo || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=100",
        clientPhone: p.clientPhone || client?.phone || "—",
        clientEmail: p.clientEmail || client?.email || "—",
        clientMembership: client?.membership || p.membershipPlan || "Standard Monthly",
        dueDate: dueDateStr,
        membershipStart: p.membershipStart || p.date,
        membershipEnd: p.membershipEnd || dueDateStr,
        daysRemaining: diffDays,
        status: resolvedStatus,
        notes: p.notes || "Gym membership fee."
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [payments, clients]);

  // Derived metrics
  const metrics = useMemo(() => {
    // 1. Total revenue collected (from Paid status)
    const totalReceived = processedPayments
      .filter((p) => p.status === "Paid")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 2. Outstanding pending balances
    const pendingAmount = processedPayments
      .filter((p) => p.status === "Pending")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 3. Overdue collections
    const overdueAmount = processedPayments
      .filter((p) => p.status === "Overdue")
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 4. Current month revenue
    const currentMonth = new Date().toISOString().substring(0, 7);
    const monthlyRevenue = processedPayments
      .filter((p) => p.status === "Paid" && p.date && p.date.startsWith(currentMonth))
      .reduce((acc, curr) => acc + curr.amount, 0);

    // 5. Counts
    const paidInvoicesCount = processedPayments.filter((p) => p.status === "Paid").length;
    const pendingInvoicesCount = processedPayments.filter((p) => p.status === "Pending").length;
    const overdueInvoicesCount = processedPayments.filter((p) => p.status === "Overdue").length;
    const expiredInvoicesCount = processedPayments.filter((p) => p.status === "Expired").length;

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
      pendingAmount,
      overdueAmount,
      monthlyRevenue,
      paidInvoicesCount,
      pendingInvoicesCount,
      overdueInvoicesCount,
      expiredInvoicesCount,
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
          p.clientName?.toLowerCase().includes(q) ||
          p.clientEmail?.toLowerCase().includes(q) ||
          p.invoiceNumber?.toLowerCase().includes(q) ||
          p.transactionId?.toLowerCase().includes(q) ||
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

  // Quick mark payment as paid
  const handleMarkPaymentPaid = async (payment) => {
    const toastId = toast.loading("Marking invoice as Paid...");
    try {
      await updateClientPayment(payment.id, {
        status: "Paid",
        payment_date: new Date().toISOString().split("T")[0]
      });
      toast.success(`Invoice ${payment.invoiceNumber} marked as Paid!`, { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update invoice: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  // Open Edit Payment Modal
  const handleOpenEditPayment = (payment) => {
    setEditingPayment(payment);
    setEditPaymentInput({
      id: payment.id,
      clientId: payment.clientId,
      clientName: payment.clientName,
      amount: String(payment.amount),
      method: payment.method || "UPI",
      status: payment.status || "Paid",
      date: payment.date || new Date().toISOString().split("T")[0],
      dueDate: payment.dueDate || "",
      membershipStart: payment.membershipStart || payment.date || "",
      membershipEnd: payment.membershipEnd || payment.dueDate || "",
      transactionId: payment.transactionId === "-" ? "" : (payment.transactionId || ""),
      notes: payment.notes || ""
    });
    setEditPaymentModalOpen(true);
  };

  // Submit Edit Payment
  const handleEditPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!editPaymentInput.amount || parseFloat(editPaymentInput.amount) <= 0) {
      toast.warning("Please enter a positive payment amount.");
      return;
    }

    if (editPaymentInput.membershipStart && editPaymentInput.membershipEnd) {
      if (editPaymentInput.membershipStart > editPaymentInput.membershipEnd) {
        toast.warning("Membership start date cannot be later than end date.");
        return;
      }
    }

    setSubmitting(true);
    const toastId = toast.loading("Updating payment record...");
    try {
      await updateClientPayment(editPaymentInput.id, {
        amount: parseFloat(editPaymentInput.amount),
        method: editPaymentInput.method,
        status: editPaymentInput.status,
        payment_date: editPaymentInput.status === "Paid" ? (editPaymentInput.date || new Date().toISOString().split("T")[0]) : null,
        due_date: editPaymentInput.dueDate || editPaymentInput.membershipEnd,
        membership_start: editPaymentInput.membershipStart,
        membership_end: editPaymentInput.membershipEnd,
        transaction_id: editPaymentInput.transactionId ? editPaymentInput.transactionId.trim() : null,
        notes: editPaymentInput.notes
      });
      toast.success("Payment record updated successfully!", { id: toastId });
      setEditPaymentModalOpen(false);
      setEditingPayment(null);
    } catch (err) {
      console.error(err);
      toast.error(`Update failed: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper actions: Record Payment Submit
  const handleRecordPaymentSubmit = async (e) => {
    e.preventDefault();
    if (!newPaymentInput.clientId) {
      toast.warning("Please select a valid Client.");
      return;
    }
    if (!newPaymentInput.amount || parseFloat(newPaymentInput.amount) <= 0) {
      toast.warning("Please enter a valid positive amount.");
      return;
    }
    if (newPaymentInput.membershipStart && newPaymentInput.membershipEnd) {
      if (newPaymentInput.membershipStart > newPaymentInput.membershipEnd) {
        toast.warning("Membership start date cannot be later than end date.");
        return;
      }
    }

    const client = clients.find((c) => c.id === newPaymentInput.clientId);
    if (!client) {
      toast.error("Selected Client record not found.");
      return;
    }

    setSubmitting(true);
    const toastId = toast.loading(`Recording payment receipt...`);
    try {
      await recordClientPayment({
        clientId: client.id,
        clientName: client.name,
        amount: parseFloat(newPaymentInput.amount),
        method: newPaymentInput.method,
        status: newPaymentInput.status,
        membershipPlan: client.membership || "Standard Monthly",
        date: newPaymentInput.date,
        paymentDate: newPaymentInput.status === "Paid" ? newPaymentInput.date : null,
        dueDate: newPaymentInput.dueDate,
        membershipStart: newPaymentInput.membershipStart,
        membershipEnd: newPaymentInput.membershipEnd,
        transactionId: newPaymentInput.transactionId ? newPaymentInput.transactionId.trim() : `TXN${Date.now()}`,
        notes: newPaymentInput.notes || "Gym subscription dues."
      });
      toast.success(`Payment receipt recorded for ${client.name}.`, { id: toastId });
      setPaymentModalOpen(false);
      
      // Reset form
      setNewPaymentInput({
        clientId: clients[0]?.id || "",
        amount: String(clients[0]?.monthlyFees || "3500"),
        method: "UPI",
        status: "Paid",
        date: new Date().toISOString().split("T")[0],
        dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        membershipStart: new Date().toISOString().split("T")[0],
        membershipEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
        transactionId: "",
        notes: ""
      });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to record payment: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Helper actions: Renew Membership Submit
  const handleRenewMembershipSubmit = async (e) => {
    e.preventDefault();
    const client = clients.find((c) => c.id === newRenewalInput.clientId);
    if (!client) {
      toast.error("Please select a valid Client.");
      return;
    }

    const plan = settings?.membershipPlans?.find((p) => p.id === newRenewalInput.planId);
    const planDuration = plan ? plan.duration : 1;
    const planName = plan ? plan.name : "Standard Monthly";
    const fee = parseFloat(newRenewalInput.amount);

    if (isNaN(fee) || fee <= 0) {
      toast.warning("Please enter a valid positive renewal fee.");
      return;
    }

    // Calculate new expiry date based on Start Date
    const start = new Date(newRenewalInput.startDate);
    const end = new Date(start);
    end.setMonth(end.getMonth() + planDuration);
    const newExpiryDateStr = end.toISOString().split("T")[0];

    setSubmitting(true);
    const toastId = toast.loading(`Renewing membership subscription...`);
    try {
      // 1. Update Client profile parameters
      await updateClient(client.id, {
        membership: planName,
        monthlyFees: fee,
        expiryDate: newExpiryDateStr,
        status: "Active"
      });

      // 2. Log corresponding payment record
      await recordClientPayment({
        clientId: client.id,
        clientName: client.name,
        amount: fee,
        method: newRenewalInput.method,
        status: newRenewalInput.status,
        membershipPlan: planName,
        date: newRenewalInput.startDate,
        paymentDate: newRenewalInput.status === "Paid" ? newRenewalInput.startDate : null,
        dueDate: newExpiryDateStr,
        membershipStart: newRenewalInput.startDate,
        membershipEnd: newExpiryDateStr,
        transactionId: newRenewalInput.transactionId ? newRenewalInput.transactionId.trim() : `RNW${Date.now()}`,
        notes: newRenewalInput.notes || `Renewed membership (${planName}, ${planDuration}M).`
      });

      toast.success(`Renewed membership for ${client.name}! New Expiry: ${formatDate(newExpiryDateStr)}`, { id: toastId });
      setRenewalModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to renew membership: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      setSubmitting(false);
    }
  };

  // Trigger Send Reminder Notification Toast
  const handleSendReminder = (clientName, amount, dueDate) => {
    toast.success(`Payment reminder sent to ${clientName} for pending amount ₹${amount.toLocaleString("en-IN")} due on ${formatDate(dueDate)}.`);
  };

  // Download Receipt File (Text format)
  const downloadReceiptFile = (p) => {
    const textContent = `================================================
          ${(settings?.gymName || "BEFIT FITNESS CRM").toUpperCase()}
================================================
Receipt ID:         REC-${p.id ? p.id.slice(0, 8).toUpperCase() : "TEMP"}
Invoice Number:     ${p.invoiceNumber || "—"}
Transaction ID:     ${p.transactionId || "—"}
Client Name:        ${p.clientName}
Client Email:       ${p.clientEmail || "—"}
Client Phone:       ${p.clientPhone || "—"}
------------------------------------------------
Membership Plan:    ${p.membershipPlan || "Standard Monthly"}
Membership Period:  ${formatDate(p.membershipStart)} to ${formatDate(p.membershipEnd)}
Payment Date:       ${p.status === "Paid" ? formatDate(p.paymentDate || p.date) : "Pending"}
Due Date:           ${formatDate(p.dueDate)}
Billed Amount:      INR ${p.amount.toLocaleString("en-IN")}
Payment Method:     ${p.method}
Settlement Status:  ${p.status}
------------------------------------------------
Notes:
${p.notes || "Gym membership subscription dues."}
================================================
Thank you for training with us!
Generated on ${new Date().toLocaleString("en-IN")}
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${p.invoiceNumber || "BeFit"}.txt`;
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
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-900 dark:text-zinc-50 flex items-center gap-2">
            Payments Ledger
          </h1>
          <p className="text-slate-500 dark:text-zinc-400 text-xs mt-1">
            Track revenue collections, manage client invoices, record membership renewals, and issue receipts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <button
            onClick={() => setPaymentModalOpen(true)}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Record Payment</span>
          </button>
          <button
            onClick={() => {
              if (clients.length > 0) {
                setNewRenewalInput(prev => ({
                  ...prev,
                  clientId: clients[0].id,
                  amount: String(clients[0].monthlyFees || 3500)
                }));
              }
              setRenewalModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-white hover:bg-slate-50 dark:bg-zinc-900 dark:hover:bg-zinc-800 text-slate-700 dark:text-zinc-300 font-bold text-xs rounded-2xl shadow cursor-pointer border border-slate-200 dark:border-zinc-800 transition"
          >
            <RefreshCw className="w-4 h-4 text-blue-500" />
            <span>Renew Membership</span>
          </button>
        </div>
      </div>

      {/* Tabs Switcher Navigation */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800/80 gap-6 no-print overflow-x-auto">
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
              className={`pb-3 text-xs sm:text-sm font-bold flex items-center gap-2 border-b-2 transition cursor-pointer whitespace-nowrap ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 font-black"
                  : "border-transparent text-slate-400 hover:text-slate-600 dark:text-zinc-500 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {loading && payments.length === 0 ? (
        <SkeletonLoader type="table" count={5} />
      ) : (
        <>

      {/* --- TAB 1: OVERVIEW --- */}
      {activeTab === "overview" && (
        <div className="space-y-6">
          
          {/* Key Metrics Cards Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 text-left">
            {[
              { title: "Total Revenue", val: `₹${metrics.totalReceived.toLocaleString("en-IN")}`, desc: "Settled paid logs", icon: DollarSign, color: "text-emerald-600 bg-emerald-500/10 border-emerald-500/20" },
              { title: "Pending Dues", val: `₹${metrics.pendingAmount.toLocaleString("en-IN")}`, desc: `${metrics.pendingInvoicesCount} invoices pending`, icon: Clock, color: "text-amber-600 bg-amber-500/10 border-amber-500/20" },
              { title: "Overdue Amount", val: `₹${metrics.overdueAmount.toLocaleString("en-IN")}`, desc: `${metrics.overdueInvoicesCount} overdue dues`, icon: AlertTriangle, color: "text-rose-600 bg-rose-500/10 border-rose-500/20" },
              { title: "Monthly Revenue", val: `₹${metrics.monthlyRevenue.toLocaleString("en-IN")}`, desc: "Active month receipts", icon: Calendar, color: "text-blue-600 bg-blue-500/10 border-blue-500/20" },
              { title: "Paid Invoices", val: `${metrics.paidInvoicesCount} Paid`, desc: "Cleared records", icon: CheckCircle, color: "text-teal-600 bg-teal-500/10 border-teal-500/20" },
              { title: "Due Renewals", val: `${metrics.activeRenewals} Due`, desc: "Expiring in 30 days", icon: UserCheck, color: "text-purple-600 bg-purple-500/10 border-purple-500/20" }
            ].map((stat, idx) => {
              const Icon = stat.icon;
              return (
                <div
                  key={idx}
                  className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-4 sm:p-5 hover:shadow-md transition relative flex flex-col justify-between"
                >
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{stat.title}</span>
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${stat.color} shrink-0`}>
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <div className="mt-4">
                    <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-zinc-50 leading-none">
                      {stat.val.startsWith("₹") ? (
                        <>₹<AnimatedNumber value={parseInt(stat.val.replace(/[^0-9]/g, "")) || 0} /></>
                      ) : stat.val.includes(" ") ? (
                        <><AnimatedNumber value={parseInt(stat.val) || 0} /> {stat.val.split(" ")[1]}</>
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100">
                  Recent Transactions Feed
                </h3>
                <p className="text-xs text-slate-500 dark:text-zinc-400 mt-0.5">Showing latest gym membership collections and ledger updates</p>
              </div>
              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-black uppercase">
                Active Feed
              </span>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/40">
                    <th className="py-2.5 px-4">Client</th>
                    <th className="py-2.5 px-4">Membership Plan</th>
                    <th className="py-2.5 px-4">Invoice #</th>
                    <th className="py-2.5 px-4">Transaction ID</th>
                    <th className="py-2.5 px-4">Payment Date</th>
                    <th className="py-2.5 px-4">Status</th>
                    <th className="py-2.5 px-4">Amount</th>
                    <th className="py-2.5 px-4 text-right">Receipt</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800/40">
                  {processedPayments.slice(0, 8).map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors">
                      <td className="py-3 px-4 flex items-center gap-3">
                        <img src={log.clientPhoto} alt={log.clientName} className="w-8 h-8 rounded-xl object-cover shrink-0 shadow-sm border border-slate-200 dark:border-zinc-700 bg-slate-100" />
                        <div>
                          <span className="font-extrabold text-slate-800 dark:text-zinc-200 block">{log.clientName}</span>
                          <span className="text-[9px] text-slate-400 dark:text-zinc-500 block mt-0.5">{log.clientPhone}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-semibold text-slate-700 dark:text-zinc-300">{log.membershipPlan}</td>
                      <td className="py-3 px-4 font-mono font-bold text-slate-500 dark:text-zinc-400">{log.invoiceNumber}</td>
                      <td className="py-3 px-4 font-mono text-slate-500 dark:text-zinc-400">{log.transactionId || "—"}</td>
                      <td className="py-3 px-4 text-slate-500 dark:text-zinc-400 font-medium">{log.status === "Paid" ? formatDate(log.paymentDate || log.date) : `Due: ${formatDate(log.dueDate)}`}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                          log.status === "Paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                          log.status === "Pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                          log.status === "Expired" ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20" :
                          "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-black text-slate-900 dark:text-zinc-50">₹{log.amount.toLocaleString("en-IN")}</td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => downloadReceiptFile(log)}
                          className="p-1.5 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-500 hover:text-blue-600 dark:text-zinc-400 dark:hover:text-blue-400 rounded-lg transition-colors cursor-pointer"
                          title="Download receipt text"
                        >
                          <Download className="w-4 h-4" />
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm text-left space-y-4 no-print">
            <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 dark:text-zinc-500 flex items-center gap-1.5">
              <Search className="w-4 h-4 text-blue-500" /> Filter Invoice Ledger
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Search input */}
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 block mb-1">Search Client / Invoice / Transaction</label>
                <div className="relative">
                  <Search className="absolute left-3 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Invoice #, client name, phone, TXN..."
                    className="w-full pl-9 pr-8 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-2.5 top-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Status Selector */}
              <div>
                <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 block mb-1">Billing Status</label>
                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500"
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
                <label className="text-[10px] font-black text-slate-500 dark:text-zinc-400 block mb-1">Payment Method</label>
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="w-full px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-xs focus:outline-none text-slate-800 dark:text-zinc-200 focus:ring-1 focus:ring-blue-500"
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
                className="py-1.5 px-4 bg-rose-50 hover:bg-rose-500 hover:text-white dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 font-extrabold text-[10px] uppercase rounded-xl transition cursor-pointer border border-rose-200 dark:border-rose-900"
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
                  <tr className="bg-slate-50/60 dark:bg-zinc-950/40 border-b border-slate-200 dark:border-zinc-800 text-[10px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider select-none">
                    <th className="py-3 px-4 text-center w-10"></th>
                    <th className="py-3 px-4">Invoice #</th>
                    <th className="py-3 px-4">Client</th>
                    <th className="py-3 px-4">Membership Plan</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Due Date</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4">Method</th>
                    <th className="py-3 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/50 text-xs text-slate-700 dark:text-zinc-300">
                  {filteredAndSearchedPayments.length > 0 ? (
                    filteredAndSearchedPayments.map((p) => {
                      const isExpanded = expandedPaymentId === p.id;
                      
                      return (
                        <React.Fragment key={p.id}>
                          <tr className={`hover:bg-slate-50/50 dark:hover:bg-zinc-800/20 transition-colors ${isExpanded ? "bg-slate-50/40 dark:bg-zinc-950/20" : ""}`}>
                            <td className="py-4 px-4 text-center">
                              <button
                                onClick={() => setExpandedPaymentId(isExpanded ? null : p.id)}
                                className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded transition cursor-pointer text-slate-400"
                              >
                                {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                              </button>
                            </td>
                            <td className="py-4 px-4 font-mono font-bold text-slate-500 dark:text-zinc-400">{p.invoiceNumber}</td>
                            <td className="py-4 px-4 font-bold">
                              <div className="flex items-center gap-2.5">
                                <img src={p.clientPhoto} alt={p.clientName} className="w-8 h-8 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200 dark:border-zinc-700" />
                                <div>
                                  <span className="text-slate-900 dark:text-zinc-100 block leading-tight">{p.clientName}</span>
                                  <span className="text-[9px] text-slate-400 dark:text-zinc-500 font-semibold block mt-0.5">{p.clientPhone}</span>
                                </div>
                              </div>
                            </td>
                            <td className="py-4 px-4 font-semibold text-slate-700 dark:text-zinc-300">{p.membershipPlan}</td>
                            <td className="py-4 px-4 font-black text-slate-900 dark:text-zinc-50">₹{p.amount.toLocaleString("en-IN")}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-zinc-400 font-medium">{p.status === "Paid" ? formatDate(p.paymentDate || p.date) : "—"}</td>
                            <td className="py-4 px-4 text-slate-500 dark:text-zinc-400 font-medium">{formatDate(p.dueDate)}</td>
                            <td className="py-4 px-4 text-center">
                              <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                                p.status === "Paid" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20" :
                                p.status === "Pending" ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20" :
                                p.status === "Expired" ? "bg-zinc-500/10 text-zinc-500 border border-zinc-500/20" :
                                "bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20"
                              }`}>
                                {p.status}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-slate-600 dark:text-zinc-400 font-medium">{p.method}</td>
                            <td className="py-4 px-5 text-right">
                              <div className="flex justify-end gap-1.5">
                                <button
                                  onClick={() => handleOpenEditPayment(p)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl transition cursor-pointer"
                                  title="Edit Payment"
                                >
                                  <Edit2 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => downloadReceiptFile(p)}
                                  className="p-2 bg-slate-50 hover:bg-slate-100 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-slate-600 dark:text-zinc-300 rounded-xl transition cursor-pointer"
                                  title="Download receipt text"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                </button>
                                {p.status !== "Paid" && p.status !== "Expired" && (
                                  <>
                                    <button
                                      onClick={() => handleSendReminder(p.clientName, p.amount, p.dueDate)}
                                      className="p-2 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-950/40 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 rounded-xl transition cursor-pointer"
                                      title="Send payment reminder alert"
                                    >
                                      <Send className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      onClick={() => handleMarkPaymentPaid(p)}
                                      className="p-2 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-950/40 dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-400 rounded-xl transition cursor-pointer"
                                      title="Mark as Paid"
                                    >
                                      <Check className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded Notes row */}
                          {isExpanded && (
                            <tr className="bg-slate-50/40 dark:bg-zinc-950/30">
                              <td colSpan="10" className="py-4 px-8 text-left animate-in slide-in-from-top-1 duration-150">
                                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                  <div>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-wide block">Client Contact</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mt-1">{p.clientEmail}</span>
                                    <span className="text-xs text-slate-500 dark:text-zinc-400 block">{p.clientPhone}</span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-wide block">Membership Period</span>
                                    <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mt-1">
                                      {formatDate(p.membershipStart)} → {formatDate(p.membershipEnd)}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-wide block">Transaction ID & Notes</span>
                                    <span className="text-xs font-mono font-bold text-slate-700 dark:text-zinc-300 block mt-1">{p.transactionId || "—"}</span>
                                    <p className="text-xs text-slate-500 dark:text-zinc-400 mt-1 italic">{p.notes}</p>
                                  </div>
                                  <div className="text-right flex flex-col justify-between">
                                    <div>
                                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 uppercase font-black tracking-wide block">Settlement Status</span>
                                      <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 block mt-1">
                                        {p.status === "Paid" ? `Paid on ${formatDate(p.paymentDate || p.date)}` : p.daysRemaining !== null ? (p.daysRemaining < 0 ? `${Math.abs(p.daysRemaining)} days overdue` : `${p.daysRemaining} days remaining`) : "Expired"}
                                      </span>
                                    </div>
                                    <div className="mt-2">
                                      <button
                                        onClick={() => handleOpenEditPayment(p)}
                                        className="inline-flex items-center gap-1.5 px-3 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg text-xs font-bold transition cursor-pointer"
                                      >
                                        <Edit2 className="w-3 h-3" /> Edit Record
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
                      <td colSpan="10" className="py-12 text-center text-slate-400 dark:text-zinc-500 italic">
                        No matching transactions logged in database.
                      </td>
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
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Outstanding Dues</span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 mt-1">Pending Invoice Alerts</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {outstandingInvoicesList.length > 0 ? (
                outstandingInvoicesList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.clientPhoto} alt={item.clientName} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200 dark:border-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs block truncate leading-none mb-1">{item.clientName}</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">{item.clientMembership}</span>
                        <span className="text-[9px] text-rose-500 font-bold block mt-0.5 leading-none">Due: {formatDate(item.dueDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex flex-col items-end gap-1.5">
                      <span className="text-xs font-black text-slate-900 dark:text-zinc-100">₹{item.amount.toLocaleString("en-IN")}</span>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => handleSendReminder(item.clientName, item.amount, item.dueDate)}
                          className="p-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-600 hover:text-white rounded-lg transition cursor-pointer shadow-sm border border-blue-100 dark:border-blue-900/40"
                          title="Send reminder alert"
                        >
                          <Send className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => handleMarkPaymentPaid(item)}
                          className="p-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-600 hover:text-white rounded-lg transition cursor-pointer shadow-sm border border-emerald-100 dark:border-emerald-900/40"
                          title="Mark as Paid"
                        >
                          <Check className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 dark:text-zinc-500 italic text-xs">All pending fee collections cleared.</div>
              )}
            </div>
          </div>

          {/* Column 2: Expired memberships */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-rose-500 uppercase tracking-wider block">Expired Memberships</span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 mt-1">Requires Immediate Renewal</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {expiredMembersList.length > 0 ? (
                expiredMembersList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.photo} alt={item.name} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200 dark:border-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs block truncate leading-none mb-1">{item.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">{item.membership}</span>
                        <span className="text-[9px] text-rose-500 font-bold block mt-0.5 leading-none">Expired: {formatDate(item.expiryDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <button
                        onClick={() => {
                          setNewRenewalInput(prev => ({
                            ...prev,
                            clientId: item.id,
                            amount: String(item.monthlyFees || 3500)
                          }));
                          setRenewalModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-blue-400 border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 dark:text-zinc-500 italic text-xs">No expired active profiles registered.</div>
              )}
            </div>
          </div>

          {/* Column 3: Upcoming Renewals */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm flex flex-col h-[520px]">
            <div className="mb-4 pb-2 border-b border-slate-100 dark:border-zinc-800">
              <span className="text-[10px] font-black text-amber-600 uppercase tracking-wider block">Expiring Soon</span>
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-zinc-100 mt-1">Expiring within 30 Days</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto space-y-3 pr-1 scrollbar-thin">
              {upcomingRenewalsList.length > 0 ? (
                upcomingRenewalsList.map(item => (
                  <div key={item.id} className="p-3.5 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-800 rounded-2xl flex justify-between items-start gap-2 hover:bg-white dark:hover:bg-zinc-900 hover:shadow-sm transition duration-150">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img src={item.photo} alt={item.name} className="w-8.5 h-8.5 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200 dark:border-zinc-700 shrink-0" />
                      <div className="min-w-0">
                        <span className="font-extrabold text-slate-800 dark:text-zinc-200 text-xs block truncate leading-none mb-1">{item.name}</span>
                        <span className="text-[9px] text-slate-400 dark:text-zinc-500 block truncate">{item.membership}</span>
                        <span className="text-[9px] text-amber-600 font-bold block mt-0.5 leading-none">Expires: {formatDate(item.expiryDate)}</span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <button
                        onClick={() => {
                          setNewRenewalInput(prev => ({
                            ...prev,
                            clientId: item.id,
                            amount: String(item.monthlyFees || 3500)
                          }));
                          setRenewalModalOpen(true);
                        }}
                        className="px-2.5 py-1 bg-white hover:bg-blue-600 hover:text-white text-blue-600 dark:bg-zinc-900 dark:hover:bg-blue-600 dark:text-blue-400 border border-slate-200 dark:border-zinc-800 rounded-xl text-[10px] font-extrabold transition shadow-sm cursor-pointer"
                      >
                        Renew
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-20 text-slate-400 dark:text-zinc-500 italic text-xs">No active memberships expiring soon.</div>
              )}
            </div>
          </div>

        </div>
      )}

      {/* --- RECORD PAYMENT MODAL POPUP --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && setPaymentModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 font-display">Record Client Payment</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Log an invoice receipt for an assigned gym client</p>
              </div>
              <button onClick={() => !submitting && setPaymentModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Select Client *</label>
                <select
                  value={newPaymentInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = clients.find(cl => cl.id === cId);
                    setNewPaymentInput({ ...newPaymentInput, clientId: cId, amount: String(c?.monthlyFees || "3500") });
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.membership || "Standard Monthly"} - ₹{(c.monthlyFees || 3500).toLocaleString("en-IN")})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newPaymentInput.amount}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    placeholder="e.g. 3500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Method *</label>
                  <select
                    value={newPaymentInput.method}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Status *</label>
                  <select
                    value={newPaymentInput.status}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Transaction ID</label>
                  <input
                    type="text"
                    value={newPaymentInput.transactionId}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, transactionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional (auto-generated if empty)"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Date</label>
                  <input
                    type="date"
                    value={newPaymentInput.date}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={newPaymentInput.dueDate}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Membership Start</label>
                  <input
                    type="date"
                    value={newPaymentInput.membershipStart}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, membershipStart: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Membership End</label>
                  <input
                    type="date"
                    value={newPaymentInput.membershipEnd}
                    onChange={(e) => setNewPaymentInput({ ...newPaymentInput, membershipEnd: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Ledger Notes</label>
                <textarea
                  value={newPaymentInput.notes}
                  onChange={(e) => setNewPaymentInput({ ...newPaymentInput, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Standard monthly subscription fees paid via UPI."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Saving..." : "Log Payment Receipt"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- EDIT PAYMENT MODAL POPUP --- */}
      {editPaymentModalOpen && editingPayment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && setEditPaymentModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 font-display">Edit Payment Record</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Update payment details for {editPaymentInput.clientName}</p>
              </div>
              <button onClick={() => !submitting && setEditPaymentModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditPaymentSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Amount (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={editPaymentInput.amount}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Method *</label>
                  <select
                    value={editPaymentInput.method}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Status *</label>
                  <select
                    value={editPaymentInput.status}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                    <option value="Overdue">Overdue</option>
                    <option value="Expired">Expired</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Transaction ID</label>
                  <input
                    type="text"
                    value={editPaymentInput.transactionId}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, transactionId: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-mono"
                    placeholder="e.g. TXN17283921"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Date</label>
                  <input
                    type="date"
                    value={editPaymentInput.date}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, date: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Due Date</label>
                  <input
                    type="date"
                    value={editPaymentInput.dueDate}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, dueDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Membership Start</label>
                  <input
                    type="date"
                    value={editPaymentInput.membershipStart}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, membershipStart: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Membership End</label>
                  <input
                    type="date"
                    value={editPaymentInput.membershipEnd}
                    onChange={(e) => setEditPaymentInput({ ...editPaymentInput, membershipEnd: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Notes</label>
                <textarea
                  value={editPaymentInput.notes}
                  onChange={(e) => setEditPaymentInput({ ...editPaymentInput, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditPaymentModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Updating..." : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- RENEW MEMBERSHIP MODAL POPUP --- */}
      {renewalModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={() => !submitting && setRenewalModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-slate-100 dark:border-zinc-800">
              <div>
                <h2 className="text-base font-extrabold text-slate-900 dark:text-zinc-100 font-display">Renew Client Subscription</h2>
                <p className="text-xs text-slate-400 dark:text-zinc-500">Extend membership terms and record renewal invoice</p>
              </div>
              <button onClick={() => !submitting && setRenewalModalOpen(false)} className="p-1 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-lg text-slate-400 cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRenewMembershipSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Select Client *</label>
                <select
                  value={newRenewalInput.clientId}
                  onChange={(e) => {
                    const cId = e.target.value;
                    const c = clients.find(cl => cl.id === cId);
                    setNewRenewalInput({ ...newRenewalInput, clientId: cId, amount: String(c?.monthlyFees || "3500") });
                  }}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 text-xs focus:outline-none focus:ring-1 focus:ring-blue-500"
                  required
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} (Current Expiry: {c.expiryDate ? formatDate(c.expiryDate) : "None"})
                    </option>
                  ))}
                </select>
              </div>

              {/* Current Expiry Banner */}
              {(() => {
                const selectedClient = clients.find(c => c.id === newRenewalInput.clientId);
                if (!selectedClient) return null;
                const isExpired = selectedClient.expiryDate && new Date(selectedClient.expiryDate) < new Date();
                return (
                  <div className={`p-3 rounded-2xl border text-xs flex justify-between items-center ${
                    isExpired
                      ? "bg-rose-500/10 border-rose-500/20 text-rose-700 dark:text-rose-400"
                      : "bg-blue-500/10 border-blue-500/20 text-blue-700 dark:text-blue-400"
                  }`}>
                    <div>
                      <span className="font-extrabold block">Current Status: {isExpired ? "Expired" : "Active"}</span>
                      <span className="text-[10px] opacity-80">Plan: {selectedClient.membership || "Standard Monthly"}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold block opacity-80">Expiration Date</span>
                      <span className="font-mono font-black">{selectedClient.expiryDate ? formatDate(selectedClient.expiryDate) : "Not Set"}</span>
                    </div>
                  </div>
                );
              })()}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Select Renewal Plan *</label>
                  <select
                    value={newRenewalInput.planId}
                    onChange={(e) => {
                      const pId = e.target.value;
                      const plan = settings?.membershipPlans?.find(pl => pl.id === pId);
                      setNewRenewalInput({ ...newRenewalInput, planId: pId, amount: String(plan?.fee || "3500") });
                    }}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    {(settings?.membershipPlans || [
                      { id: "plan_1", name: "Standard Monthly", duration: 1, fee: 3500 },
                      { id: "plan_2", name: "Quarterly Pro", duration: 3, fee: 9500 },
                      { id: "plan_3", name: "Annual VIP", duration: 12, fee: 32000 }
                    ]).map(pl => (
                      <option key={pl.id} value={pl.id}>{pl.name} ({pl.duration} Month{pl.duration > 1 ? "s" : ""} - ₹{Number(pl.fee).toLocaleString("en-IN")})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Renewal Fee (INR) *</label>
                  <input
                    type="number"
                    min="1"
                    step="any"
                    value={newRenewalInput.amount}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500 font-bold"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Renewal Start Date *</label>
                  <input
                    type="date"
                    value={newRenewalInput.startDate}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, startDate: e.target.value })}
                    className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Calculated New Expiry</label>
                  {(() => {
                    const plan = settings?.membershipPlans?.find(p => p.id === newRenewalInput.planId);
                    const duration = plan ? plan.duration : 1;
                    const start = new Date(newRenewalInput.startDate);
                    const end = new Date(start);
                    end.setMonth(end.getMonth() + duration);
                    return (
                      <div className="px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-100/60 dark:bg-zinc-950 text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
                        {formatDate(end.toISOString().split("T")[0])}
                      </div>
                    );
                  })()}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Method *</label>
                  <select
                    value={newRenewalInput.method}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, method: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="UPI">UPI Transfer</option>
                    <option value="Card">Credit / Debit Card</option>
                    <option value="Cash">Cash Handover</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Payment Status *</label>
                  <select
                    value={newRenewalInput.status}
                    onChange={(e) => setNewRenewalInput({ ...newRenewalInput, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Paid">Paid</option>
                    <option value="Pending">Pending</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Transaction ID (Optional)</label>
                <input
                  type="text"
                  value={newRenewalInput.transactionId}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, transactionId: e.target.value })}
                  className="w-full px-3.5 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. RNW9823412"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block mb-1 uppercase tracking-wide">Renewal Notes</label>
                <textarea
                  value={newRenewalInput.notes}
                  onChange={(e) => setNewRenewalInput({ ...newRenewalInput, notes: e.target.value })}
                  rows={2}
                  className="w-full px-3.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50 dark:bg-zinc-950 text-xs text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-1 focus:ring-blue-500"
                  placeholder="e.g. Client opted for standard monthly renewal."
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRenewalModalOpen(false)}
                  disabled={submitting}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-zinc-700 text-slate-600 dark:text-zinc-300 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-2xl text-xs font-bold transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-bold shadow-md hover:shadow-lg transition cursor-pointer disabled:opacity-50"
                >
                  {submitting ? "Processing..." : "Confirm & Renew Subscription"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

        </>
      )}

    </div>
  );
};

export default Payments;
