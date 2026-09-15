import React, { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  Search,
  Filter,
  ArrowUpDown,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit2,
  Trash2,
  Printer,
  X,
  Check,
  AlertCircle,
  MessageSquare,
  Dumbbell,
  Apple,
  CreditCard,
  UserCheck,
  User,
  Scale,
  Calendar,
  Clock,
  Sparkles,
  Award,
  ChevronRight as ArrowIcon,
  Heart,
  Droplet,
  ExternalLink,
  Mail,
  Phone,
  CheckCircle2,
  AlertTriangle,
  Clock3,
  TrendingUp,
  RefreshCw
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";
import { EmptyState, SkeletonLoader, ErrorState } from "../components/FeedbackStates";

// Helper: Calculate membership status & expiry details
export const computeClientMembership = (client, payments = []) => {
  const expiryStr = client?.expiryDate;
  const clientPayments = (payments || []).filter(p => p.clientId === client?.id) || [];
  const latestPayment = clientPayments.length > 0
    ? [...clientPayments].sort((a, b) => new Date(b.date || b.created_at || 0) - new Date(a.date || a.created_at || 0))[0]
    : null;

  const isPending = client?.status === "Pending Payment" || latestPayment?.status === "Unpaid" || latestPayment?.status === "Pending";

  let status = "Active";
  let diffDays = null;
  let formattedExpiry = expiryStr || "Not specified";

  if (isPending) {
    status = "Pending Payment";
  } else if (expiryStr) {
    try {
      const expDate = new Date(expiryStr);
      if (!isNaN(expDate.getTime())) {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        expDate.setHours(0, 0, 0, 0);
        diffDays = Math.ceil((expDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        formattedExpiry = expDate.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric"
        });

        if (diffDays < 0) {
          status = "Expired";
        } else if (diffDays <= 7) {
          status = "Expiring Soon";
        } else {
          status = "Active";
        }
      }
    } catch {
      status = client?.status || "Active";
    }
  } else {
    status = client?.status || "Active";
  }

  return {
    status,
    expiryDate: formattedExpiry,
    rawExpiryDate: expiryStr,
    diffDays,
    plan: client?.membership || "Standard Monthly"
  };
};

const Clients = () => {
  const { 
    clients, 
    deleteClient, 
    updateClient, 
    attendance, 
    settings,
    workouts,
    diets,
    measurements,
    payments,
    loading,
    error,
    fetchClients,
    fetchAttendance,
    fetchPayments,
    assignClient
  } = useCRM();
  const navigate = useNavigate();

  // Search & Primary Status Tabs state
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'active', 'expiring_soon', 'expired', 'pending_payment'
  const [selectedChips, setSelectedChips] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // View Layout state: 'table' or 'cards' (on desktop, toggleable; auto-responsive on mobile)
  const [viewMode, setViewMode] = useState("table");

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Edit Modal State
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState(null);

  // Assign Existing Client Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [assignClientId, setAssignClientId] = useState("");

  // Print client modal state
  const [printClientInfo, setPrintClientInfo] = useState(null);

  // Detail Modal / Profile Popup State
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("Overview");
  const [modalWorkoutDay, setModalWorkoutDay] = useState("monday");
  const [modalDietDay, setModalDietDay] = useState("monday");

  // Fetch clients, attendance, and payments on mount
  useEffect(() => {
    fetchClients();
    if (fetchAttendance) fetchAttendance();
    if (fetchPayments) fetchPayments();
  }, []);

  // Quick Goal & Plan Filter Chips
  const filterChipsList = [
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Premium",
    "Standard"
  ];

  // Helper: calculate client attendance rate dynamically
  const getClientAttendanceRate = (clientId) => {
    const clientAtt = (attendance || []).filter((a) => a.clientId === clientId);
    if (clientAtt.length === 0) return null; 
    const present = clientAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
    return Math.round((present / clientAtt.length) * 100);
  };

  // Submit assign form
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignClientId.trim()) {
      toast.warning("A valid client UUID is required.");
      return;
    }
    
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(assignClientId.trim())) {
      toast.error("Invalid client ID format. It must be a valid UUID.");
      return;
    }

    try {
      await assignClient(assignClientId.trim());
      setAssignModalOpen(false);
      setAssignClientId("");
    } catch (err) {
      console.error("Assignment error:", err);
    }
  };

  // Map each client to computed membership info
  const clientMembershipMap = useMemo(() => {
    const map = new Map();
    (clients || []).forEach(c => {
      map.set(c.id, computeClientMembership(c, payments));
    });
    return map;
  }, [clients, payments]);

  // Compute status counter badges for tabs
  const statusCounts = useMemo(() => {
    let active = 0;
    let expiringSoon = 0;
    let expired = 0;
    let pendingPayment = 0;

    (clients || []).forEach(c => {
      const info = clientMembershipMap.get(c.id);
      if (!info) return;
      if (info.status === "Active") active++;
      else if (info.status === "Expiring Soon") expiringSoon++;
      else if (info.status === "Expired") expired++;
      else if (info.status === "Pending Payment") pendingPayment++;
    });

    return {
      all: (clients || []).length,
      active,
      expiringSoon,
      expired,
      pendingPayment
    };
  }, [clients, clientMembershipMap]);

  // Toggle filter chip selection handler
  const handleToggleChip = (chip) => {
    setCurrentPage(1);
    setSelectedChips(prev => 
      prev.includes(chip) 
        ? prev.filter(c => c !== chip) 
        : [...prev, chip]
    );
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearch("");
    setStatusFilter("all");
    setSelectedChips([]);
    setCurrentPage(1);
  };

  // Process search, filters, and sorting
  const processedClients = useMemo(() => {
    let result = [...(clients || [])];

    // 1. Primary Status Filter Tab
    if (statusFilter !== "all") {
      result = result.filter(c => {
        const info = clientMembershipMap.get(c.id);
        if (statusFilter === "active") return info?.status === "Active";
        if (statusFilter === "expiring_soon") return info?.status === "Expiring Soon";
        if (statusFilter === "expired") return info?.status === "Expired";
        if (statusFilter === "pending_payment") return info?.status === "Pending Payment";
        return true;
      });
    }

    // 2. Search Query (Matches Name, Email, Phone, Plan, Goal)
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter((c) => {
        const name = (c.name || "").toLowerCase();
        const email = (c.email || "").toLowerCase();
        const phone = (c.phone || "").toLowerCase();
        const goal = (c.goal || "").toLowerCase();
        const plan = (c.membership || "").toLowerCase();
        return name.includes(q) || email.includes(q) || phone.includes(q) || goal.includes(q) || plan.includes(q);
      });
    }

    // 3. Multi-Select Chip Filters
    if (selectedChips.length > 0) {
      const selectedGoals = selectedChips.filter(chip => ["Weight Loss", "Muscle Gain", "Maintenance"].includes(chip));
      const selectedPlans = selectedChips.filter(chip => ["Premium", "Standard"].includes(chip));

      result = result.filter((c) => {
        // Goal Group match
        if (selectedGoals.length > 0) {
          const matchesGoal = selectedGoals.some(goal => {
            if (goal === "Weight Loss") return c.goal === "Weight Loss" || c.goal === "Fat Loss";
            if (goal === "Muscle Gain") return c.goal === "Muscle Gain" || c.goal === "Weight Gain" || c.goal === "Strength Training";
            if (goal === "Maintenance") return c.goal === "General Fitness" || c.goal === "Maintenance";
            return false;
          });
          if (!matchesGoal) return false;
        }

        // Plan Group match
        if (selectedPlans.length > 0) {
          const matchesPlan = selectedPlans.some(plan => {
            if (plan === "Premium") return (c.membership || "").toLowerCase().includes("premium") || (c.membership || "").toLowerCase().includes("vip");
            if (plan === "Standard") return (c.membership || "").toLowerCase().includes("standard");
            return false;
          });
          if (!matchesPlan) return false;
        }

        return true;
      });
    }

    // 4. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "attendance") {
        valA = getClientAttendanceRate(a.id) ?? -1;
        valB = getClientAttendanceRate(b.id) ?? -1;
      } else if (sortField === "expiryDate") {
        valA = new Date(a.expiryDate || 0).getTime();
        valB = new Date(b.expiryDate || 0).getTime();
      } else if (sortField === "monthlyFees" || sortField === "age" || sortField === "currentWeight") {
        valA = parseFloat(valA) || 0;
        valB = parseFloat(valB) || 0;
      } else {
        valA = (valA || "").toString().toLowerCase();
        valB = (valB || "").toString().toLowerCase();
      }

      if (valA < valB) return sortOrder === "asc" ? -1 : 1;
      if (valA > valB) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });

    return result;
  }, [clients, search, statusFilter, selectedChips, sortField, sortOrder, clientMembershipMap, attendance]);

  // Pagination logic
  const totalPages = Math.ceil(processedClients.length / itemsPerPage) || 1;
  const paginatedClients = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    return processedClients.slice(startIndex, startIndex + itemsPerPage);
  }, [processedClients, currentPage]);

  const handlePageChange = (newPage) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setCurrentPage(newPage);
    }
  };

  // Delete Action
  const handleDeleteConfirm = () => {
    if (deletingClientId) {
      deleteClient(deletingClientId);
      toast.error("Client record permanently deleted.");
      setDeletingClientId(null);
      if (selectedClient?.id === deletingClientId) {
        setSelectedClient(null);
      }
      if (paginatedClients.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Edit Action Trigger
  const handleEditClick = (e, client) => {
    e.stopPropagation();
    setEditingClient(client);
    setEditFormData({ ...client });
  };

  // Submit edit form
  const handleEditSubmit = (e) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.phone) {
      toast.warning("Name and Phone fields are required.");
      return;
    }
    updateClient(editingClient.id, editFormData);
    toast.success(`Updated details for ${editFormData.name}.`);
    setEditingClient(null);
    if (selectedClient && selectedClient.id === editingClient.id) {
      setSelectedClient({ ...selectedClient, ...editFormData });
    }
  };

  // Print summary sheet
  const handlePrintClient = (e, client) => {
    e.stopPropagation();
    setPrintClientInfo(client);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  // Modal open handler
  const handleOpenClientModal = (client) => {
    setSelectedClient(client);
    setModalActiveTab("Overview");
    setModalWorkoutDay("monday");
    setModalDietDay("monday");
  };

  // Status Badge UI Component
  const renderStatusBadge = (membershipInfo) => {
    const { status } = membershipInfo;
    
    if (status === "Active") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
          <span>Active</span>
        </span>
      );
    }
    
    if (status === "Expiring Soon") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
          <Clock3 className="w-3 h-3 text-amber-500 shrink-0" />
          <span>Expiring Soon</span>
        </span>
      );
    }

    if (status === "Expired") {
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20">
          <AlertTriangle className="w-3 h-3 text-rose-500 shrink-0" />
          <span>Expired</span>
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20">
        <AlertCircle className="w-3 h-3 text-orange-500 shrink-0" />
        <span>Pending</span>
      </span>
    );
  };

  // Attendance rate UI Component
  const renderAttendanceBadge = (rate) => {
    if (rate === null || rate === undefined) {
      return (
        <span className="text-[10px] text-slate-400 dark:text-zinc-500 italic font-medium">
          No logs
        </span>
      );
    }

    let colorClass = "text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
    let barColor = "bg-emerald-500";
    if (rate < 50) {
      colorClass = "text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20";
      barColor = "bg-rose-500";
    } else if (rate < 75) {
      colorClass = "text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20";
      barColor = "bg-amber-500";
    }

    return (
      <div className="flex items-center gap-2">
        <div className="w-12 h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden hidden sm:block">
          <div
            className={`h-full ${barColor} rounded-full transition-all duration-300`}
            style={{ width: `${Math.min(rate, 100)}%` }}
          />
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black border ${colorClass}`}>
          {rate}%
        </span>
      </div>
    );
  };

  // Goal badge styling mapper
  const getGoalBadgeStyle = (goal) => {
    if (goal === "Muscle Gain" || goal === "Strength Training" || goal === "Weight Gain") {
      return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20";
    }
    if (goal === "Fat Loss" || goal === "Weight Loss") {
      return "bg-pink-500/10 text-pink-600 dark:text-pink-400 border-pink-500/20";
    }
    return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative pb-12">
      
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
              Client Management
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 font-bold text-xs border border-blue-200/50 dark:border-blue-800/40">
              {clients.length} Total
            </span>
          </div>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-1">
            Monitor client profiles, manage memberships, track attendance, and assign training programs.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full sm:w-auto">
          <button
            onClick={() => setAssignModalOpen(true)}
            aria-label="Assign Client"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 bg-white dark:bg-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 border border-slate-200 dark:border-zinc-700 font-bold text-xs rounded-2xl shadow-sm transition cursor-pointer"
          >
            <UserCheck className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Assign Client</span>
          </button>
          <button
            onClick={() => navigate("/clients/add")}
            aria-label="Add New Client"
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Add New Client</span>
          </button>
        </div>
      </div>

      {/* Error state message if backend fetch failed */}
      {error && (
        <div className="p-4 bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-2xl flex items-center justify-between gap-4 text-rose-700 dark:text-rose-300 text-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0" />
            <span>Failed to synchronize clients with backend: {error}</span>
          </div>
          <button
            onClick={() => fetchClients()}
            className="px-3 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg font-bold text-[11px] transition shrink-0 cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Search & Filter Controls Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 no-print text-left">
        
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none border-b border-slate-100 dark:border-zinc-800">
          {[
            { id: "all", label: "All Clients", count: statusCounts.all },
            { id: "active", label: "Active", count: statusCounts.active },
            { id: "expiring_soon", label: "Expiring Soon", count: statusCounts.expiringSoon },
            { id: "expired", label: "Expired", count: statusCounts.expired },
            { id: "pending_payment", label: "Pending Payment", count: statusCounts.pendingPayment }
          ].map((tab) => {
            const isActive = statusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setStatusFilter(tab.id);
                  setCurrentPage(1);
                }}
                className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
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

        {/* Search, Sort, & Mode controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-1">
          
          {/* Enhanced Search Input (Name, Email, Phone) */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by client name, email, phone, goal, or plan..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "42px", paddingRight: "36px" }}
              className="w-full py-2.5 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-800 dark:text-zinc-100 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/50 transition-all placeholder:text-slate-400"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 cursor-pointer p-1"
                title="Clear Search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort By</span>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 text-xs focus:outline-none cursor-pointer"
            >
              <option value="name">Name (A-Z)</option>
              <option value="joinDate">Join Date</option>
              <option value="expiryDate">Membership Expiry</option>
              <option value="attendance">Attendance Rate</option>
              <option value="currentWeight">Current Weight</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-slate-500 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-800 cursor-pointer"
              title={`Sorting ${sortOrder === "asc" ? "Ascending" : "Descending"}`}
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Secondary Filter Chips list */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-slate-100/80 dark:border-zinc-800">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Goal & Plan:</span>
            {filterChipsList.map((chip) => {
              const isSelected = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => handleToggleChip(chip)}
                  className={`px-3 py-1 rounded-full text-[11px] font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-800 text-slate-600 hover:text-slate-800 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>

          {(search || selectedChips.length > 0 || statusFilter !== "all") && (
            <button
              onClick={handleClearFilters}
              className="text-[10px] text-red-500 font-extrabold uppercase hover:underline cursor-pointer"
            >
              Reset All Filters
            </button>
          )}
        </div>
      </div>

      {/* Main Client Content: Table Layout on Desktop, Card Layout on Mobile/Tablet */}
      {loading ? (
        <SkeletonLoader type="table" count={5} />
      ) : (
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-soft no-print">
          
          {/* Desktop Table View (Hidden on small mobile screens) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
                <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] bg-slate-50/60 dark:bg-zinc-950/40">
                  <th className="py-4 px-5">Client Info</th>
                  <th className="py-4 px-5">Fitness Goal</th>
                  <th className="py-4 px-5">Membership & Expiry</th>
                  <th className="py-4 px-5">Status</th>
                  <th className="py-4 px-5">Attendance</th>
                  <th className="py-4 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800">
                {paginatedClients.length > 0 ? (
                  paginatedClients.map((client) => {
                    const membershipInfo = clientMembershipMap.get(client.id) || computeClientMembership(client, payments);
                    const attendanceRate = getClientAttendanceRate(client.id);

                    return (
                      <tr 
                        key={client.id} 
                        onClick={() => handleOpenClientModal(client)}
                        className="odd:bg-white dark:odd:bg-zinc-900 even:bg-slate-50/15 dark:even:bg-zinc-950/15 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-b border-slate-100 dark:border-zinc-800 transition-colors cursor-pointer group"
                      >
                        {/* Client Info (Photo, Name, Email, Phone) */}
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-3.5">
                            <img 
                              src={client.photo} 
                              alt={client.name} 
                              className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200/50 dark:border-zinc-800 group-hover:scale-105 transition-transform shrink-0"
                            />
                            <div className="text-left min-w-0">
                              <span className="font-extrabold text-slate-800 dark:text-zinc-100 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block leading-tight truncate">
                                {client.name}
                              </span>
                              <div className="flex items-center gap-2 text-[10px] text-slate-400 dark:text-zinc-500 mt-1 truncate">
                                {client.email && (
                                  <span className="flex items-center gap-1 truncate" title={client.email}>
                                    <Mail className="w-2.5 h-2.5 shrink-0" />
                                    <span className="truncate">{client.email}</span>
                                  </span>
                                )}
                                {client.phone && (
                                  <span className="flex items-center gap-1 shrink-0">
                                    <Phone className="w-2.5 h-2.5 shrink-0" />
                                    <span>{client.phone}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Goal Badge */}
                        <td className="py-3.5 px-5 text-left">
                          <span className={`px-2.5 py-1 rounded-lg border text-[10px] font-bold inline-block ${getGoalBadgeStyle(client.goal)}`}>
                            {client.goal || "General Fitness"}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 block mt-1">
                            {client.currentWeight ? `${client.currentWeight} kg` : ""} {client.targetWeight ? `→ ${client.targetWeight} kg` : ""}
                          </span>
                        </td>

                        {/* Membership Plan & Expiry Date */}
                        <td className="py-3.5 px-5 text-left">
                          <span className="font-bold text-slate-700 dark:text-zinc-200 text-xs block">
                            {membershipInfo.plan}
                          </span>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 dark:text-zinc-500">
                              Expires: {membershipInfo.expiryDate}
                            </span>
                            {membershipInfo.diffDays !== null && (
                              <span className={`text-[9px] font-bold px-1.5 py-0.2 rounded ${
                                membershipInfo.diffDays < 0
                                  ? "bg-rose-500/10 text-rose-600 dark:text-rose-400"
                                  : membershipInfo.diffDays <= 7
                                  ? "bg-amber-500/10 text-amber-600 dark:text-amber-400 font-extrabold"
                                  : "text-slate-400 dark:text-zinc-500"
                              }`}>
                                {membershipInfo.diffDays < 0
                                  ? `(${Math.abs(membershipInfo.diffDays)}d ago)`
                                  : membershipInfo.diffDays === 0
                                  ? "(Today)"
                                  : `(${membershipInfo.diffDays}d left)`}
                              </span>
                            )}
                          </div>
                        </td>

                        {/* Membership Status Badge */}
                        <td className="py-3.5 px-5 text-left">
                          {renderStatusBadge(membershipInfo)}
                        </td>

                        {/* Attendance Rate */}
                        <td className="py-3.5 px-5 text-left">
                          {renderAttendanceBadge(attendanceRate)}
                        </td>

                        {/* Row Actions */}
                        <td className="py-3.5 px-5 text-right">
                          <div className="flex gap-1 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => navigate(`/clients/${client.id}`)}
                              aria-label={`Open full profile for ${client.name}`}
                              className="p-2 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-blue-600 dark:text-blue-400 rounded-xl transition cursor-pointer active:scale-95 inline-flex items-center justify-center"
                              title="Open Full Profile Page"
                            >
                              <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            <button
                              onClick={() => handleOpenClientModal(client)}
                              aria-label={`Quick preview modal for ${client.name}`}
                              className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-600 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95 inline-flex items-center justify-center"
                              title="Quick Preview Modal"
                            >
                              <Eye className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            <button
                              onClick={(e) => handleEditClick(e, client)}
                              aria-label={`Edit ${client.name}`}
                              className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-700 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95 inline-flex items-center justify-center"
                              title="Edit Client"
                            >
                              <Edit2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            <button
                              onClick={(e) => handlePrintClient(e, client)}
                              aria-label={`Print summary sheet for ${client.name}`}
                              className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95 inline-flex items-center justify-center"
                              title="Print Summary Sheet"
                            >
                              <Printer className="w-3.5 h-3.5 shrink-0" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); setDeletingClientId(client.id); }}
                              aria-label={`Delete ${client.name}`}
                              className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-600 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95 inline-flex items-center justify-center"
                              title="Delete Client"
                            >
                              <Trash2 className="w-3.5 h-3.5 shrink-0" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="6" className="p-0 border-none">
                      <EmptyState
                        title="No Clients Found"
                        description="Try modifying your search phrase, clearing active filters, or adding a new client to your gym directory."
                        actionText="Reset All Filters"
                        onAction={handleClearFilters}
                        icon={Search}
                      />
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile & Tablet Card List View (Visible on small screens < md) */}
          <div className="block md:hidden divide-y divide-slate-100 dark:divide-zinc-800">
            {paginatedClients.length > 0 ? (
              paginatedClients.map((client) => {
                const membershipInfo = clientMembershipMap.get(client.id) || computeClientMembership(client, payments);
                const attendanceRate = getClientAttendanceRate(client.id);

                return (
                  <div
                    key={client.id}
                    onClick={() => handleOpenClientModal(client)}
                    className="p-4 space-y-3.5 hover:bg-slate-50/50 dark:hover:bg-zinc-800/30 transition-colors cursor-pointer"
                  >
                    {/* Top card row: Avatar, Name, Email, Status */}
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={client.photo}
                          alt={client.name}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200/50 dark:border-zinc-800 shrink-0"
                        />
                        <div>
                          <h3 className="font-extrabold text-slate-800 dark:text-zinc-100 text-sm leading-tight">
                            {client.name}
                          </h3>
                          <div className="text-[10px] text-slate-400 dark:text-zinc-500 space-y-0.5 mt-1">
                            {client.email && <div className="truncate max-w-[180px]">{client.email}</div>}
                            {client.phone && <div>{client.phone}</div>}
                          </div>
                        </div>
                      </div>
                      <div className="shrink-0">
                        {renderStatusBadge(membershipInfo)}
                      </div>
                    </div>

                    {/* Middle card metrics: Goal, Plan & Expiry, Attendance */}
                    <div className="grid grid-cols-2 gap-2 bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-2xl border border-slate-100 dark:border-zinc-800 text-xs">
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Goal</span>
                        <span className="font-bold text-slate-700 dark:text-zinc-300 mt-0.5 block truncate">
                          {client.goal || "General Fitness"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attendance</span>
                        <div className="mt-0.5">
                          {renderAttendanceBadge(attendanceRate)}
                        </div>
                      </div>
                      <div className="col-span-2 pt-1 border-t border-slate-100 dark:border-zinc-800">
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Membership</span>
                        <div className="flex items-center justify-between mt-0.5">
                          <span className="font-bold text-slate-700 dark:text-zinc-300">
                            {membershipInfo.plan}
                          </span>
                          <span className="text-[10px] text-slate-500 dark:text-zinc-400">
                            Expires: {membershipInfo.expiryDate}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom Actions Row */}
                    <div className="flex items-center justify-between gap-2 pt-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => navigate(`/clients/${client.id}`)}
                        aria-label={`View full profile for ${client.name}`}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
                      >
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span>View Profile</span>
                      </button>
                      <button
                        onClick={() => handleOpenClientModal(client)}
                        aria-label={`Quick view for ${client.name}`}
                        className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl hover:bg-slate-200 transition inline-flex items-center justify-center"
                        title="Quick View"
                      >
                        <Eye className="w-4 h-4 shrink-0" />
                      </button>
                      <button
                        onClick={(e) => handleEditClick(e, client)}
                        className="p-2 bg-slate-100 dark:bg-zinc-800 text-slate-600 dark:text-zinc-300 rounded-xl hover:bg-slate-200 transition"
                        title="Edit Details"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); setDeletingClientId(client.id); }}
                        className="p-2 bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-400 rounded-xl hover:bg-rose-100 transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-4">
                <EmptyState
                  title="No Clients Found"
                  description="Try modifying search phrases, clearing active filters, or adding a new gym client."
                  actionText="Reset All Filters"
                  onAction={handleClearFilters}
                  icon={Search}
                />
              </div>
            )}
          </div>

        </div>
      )}

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm no-print text-xs">
          <span className="text-slate-400 dark:text-zinc-500 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, processedClients.length)} of{" "}
            {processedClients.length} clients
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-950 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="flex items-center px-3 font-bold text-slate-700 dark:text-zinc-300">
              Page {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl disabled:opacity-30 cursor-pointer hover:bg-slate-50 dark:hover:bg-zinc-950 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Floating Action Button (FAB) for quick add */}
      <button
        onClick={() => navigate("/clients/add")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 z-40 active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer no-print"
        title="Add New Client"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* --- QUICK DETAIL PROFILE PREVIEW MODAL --- */}
      {selectedClient && (() => {
        const client = selectedClient;
        const membershipInfo = clientMembershipMap.get(client.id) || computeClientMembership(client, payments);
        const isOnline = membershipInfo.status === "Active";
        const isPending = membershipInfo.status === "Pending Payment";
        
        // Context collections fallbacks
        const clientWorkout = workouts[client.id] || {};
        const clientDiet = diets[client.id] || {};
        const clientMeasurements = measurements[client.id] || [];
        const clientPayments = (payments || []).filter(p => p.clientId === client.id) || [];
        const clientAttendance = (attendance || []).filter(a => a.clientId === client.id) || [];
        
        const attendanceRate = getClientAttendanceRate(client.id);

        return (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
            {/* Blurred background overlay */}
            <div 
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-md transition-opacity duration-300"
              onClick={() => setSelectedClient(null)}
            />
            
            {/* Modal Box */}
            <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-4xl w-full h-[90vh] sm:h-[82vh] flex flex-col shadow-2xl animate-in scale-in duration-300 overflow-hidden text-left z-10">
              
              {/* Modal Top Header Banner */}
              <div className="p-6 bg-slate-50/60 dark:bg-zinc-950/20 border-b border-slate-100 dark:border-zinc-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                  <img 
                    src={client.photo} 
                    alt={client.name} 
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-slate-100 border border-slate-200/50 shrink-0" 
                  />
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-zinc-100 leading-none">
                      {client.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      {renderStatusBadge(membershipInfo)}
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                        Goal: {client.goal || "General Fitness"}
                      </span>
                      <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium">
                        Expires: {membershipInfo.expiryDate}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                  <button
                    onClick={() => {
                      setSelectedClient(null);
                      navigate(`/clients/${client.id}`);
                    }}
                    aria-label={`Open full profile for ${client.name}`}
                    className="flex items-center gap-1.5 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs shadow-sm transition cursor-pointer"
                    title="Navigate to Full Client Profile"
                  >
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    <span>Open Full Profile</span>
                  </button>
                  <button 
                    onClick={() => handleEditClick({ stopPropagation: () => {} }, client)}
                    aria-label={`Edit details for ${client.name}`}
                    className="p-2 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer inline-flex items-center justify-center"
                    title="Edit Client Details"
                  >
                    <Edit2 className="w-4 h-4 shrink-0" />
                  </button>
                  <button
                    onClick={() => setSelectedClient(null)}
                    aria-label="Close client modal"
                    className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-xl transition cursor-pointer inline-flex items-center justify-center"
                    title="Close Modal"
                  >
                    <X className="w-5 h-5 shrink-0" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="border-b border-slate-100 dark:border-zinc-800 px-6 bg-white dark:bg-zinc-900 overflow-x-auto scrollbar-none shrink-0 flex">
                {["Overview", "Workout", "Diet", "Attendance", "Payments", "Progress"].map((tab) => {
                  const isActive = modalActiveTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setModalActiveTab(tab)}
                      className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                      }`}
                    >
                      {tab}
                    </button>
                  );
                })}
              </div>

              {/* Modal Tabs Content Wrapper */}
              <div className="flex-1 overflow-y-auto p-6 bg-slate-50/20 dark:bg-zinc-950/10">
                
                {/* 1. OVERVIEW TAB */}
                {modalActiveTab === "Overview" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Primary metadata grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                      {[
                        { label: "Age", val: `${client.age || 25} years`, icon: User },
                        { label: "Gender", val: client.gender || "Male", icon: UserCheck },
                        { label: "Blood Group", val: client.bloodGroup || "O+", icon: Droplet },
                        { label: "Join Date", val: client.joinDate || "N/A", icon: Calendar },
                        { label: "Height", val: `${client.height || 170} cm`, icon: Scale },
                        { label: "Current Weight", val: `${client.currentWeight || 70} kg`, icon: Scale },
                        { label: "Target Weight", val: `${client.targetWeight || 70} kg`, icon: Award },
                        { label: "BMI Value", val: client.bmi || "22.5", icon: Heart }
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4 h-4" />
                            </div>
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider block">{item.label}</span>
                              <span className="text-xs font-black text-slate-800 dark:text-zinc-200 mt-0.5 block">{item.val}</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Contacts and Plan Info */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      
                      {/* Contacts Box */}
                      <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-800">
                          Contact & Emergency Info
                        </span>
                        <div className="grid grid-cols-2 gap-3.5 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Phone Number</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{client.phone || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Email Address</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300 truncate block">{client.email || "N/A"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-400 block font-semibold">Home Address</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{client.address || "N/A"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-400 block font-semibold">Emergency Contact</span>
                            <span className="font-bold text-rose-500 dark:text-rose-400">{client.emergencyContact || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Box */}
                      <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm space-y-3.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-800">
                          Membership Configuration
                        </span>
                        <div className="grid grid-cols-2 gap-3.5 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Active Plan</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{membershipInfo.plan}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Monthly Rates</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">₹{client.monthlyFees || 3500}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Expiration Date</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{membershipInfo.expiryDate}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Assigned Trainer</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-300">{client.assignedTrainer || settings.trainerName || "Head Coach"}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Trainer Notes */}
                    <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Coach's Core Notes</span>
                      <p className="text-slate-600 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-800 leading-relaxed">
                        {client.trainerNotes || "No custom logs registered for this client."}
                      </p>
                    </div>

                  </div>
                )}

                {/* 2. WORKOUT TAB */}
                {modalActiveTab === "Workout" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Day Selector Navigation */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-zinc-900 p-1.5 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setModalWorkoutDay(d)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer shrink-0 ${
                            modalWorkoutDay === d
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                          }`}
                        >
                          {d.substring(0, 3)}
                        </button>
                      ))}
                    </div>

                    {/* Specific Day Workout Panel */}
                    {(() => {
                      const dayPlan = clientWorkout[modalWorkoutDay];
                      if (!dayPlan || dayPlan.muscleGroup === "Rest Day") {
                        return (
                          <div className="py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                            <Sparkles className="w-8 h-8 text-slate-300 shrink-0" />
                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Scheduled Rest Day</span>
                            <p className="text-[10px] text-slate-400">No active physical blocks configured for this day.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-xs">
                          {/* Day summary block */}
                          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Target Muscle Group</span>
                              <span className="text-sm font-black text-slate-800 dark:text-zinc-100 block mt-0.5">{dayPlan.muscleGroup}</span>
                            </div>
                            <div className="flex gap-4 text-right">
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Splits Rest</span>
                                <span className="font-bold text-slate-700 dark:text-zinc-300">{dayPlan.restTime}</span>
                              </div>
                              <div>
                                <span className="text-[9px] font-bold text-slate-400 block uppercase">Duration</span>
                                <span className="font-bold text-slate-700 dark:text-zinc-300">{dayPlan.duration}</span>
                              </div>
                            </div>
                          </div>

                          {/* Exercise List */}
                          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/20">
                                  <th className="py-2.5 px-4">Exercise Name</th>
                                  <th className="py-2.5 px-4">Sets</th>
                                  <th className="py-2.5 px-4">Repetitions</th>
                                  <th className="py-2.5 px-4 text-right">Load Weight</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800">
                                {dayPlan.exercises && dayPlan.exercises.length > 0 ? (
                                  dayPlan.exercises.map((ex, i) => (
                                    <tr key={i} className="hover:bg-slate-50/20 dark:hover:bg-zinc-800/10">
                                      <td className="py-3 px-4 font-bold text-slate-800 dark:text-zinc-200">{ex.name}</td>
                                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-zinc-300">{ex.sets}</td>
                                      <td className="py-3 px-4 font-medium text-slate-600 dark:text-zinc-300">{ex.reps}</td>
                                      <td className="py-3 px-4 font-bold text-blue-600 dark:text-blue-400 text-right">{ex.weight}</td>
                                    </tr>
                                  ))
                                ) : (
                                  <tr>
                                    <td colSpan="4" className="p-4 text-center text-slate-400 italic">No exercises logged.</td>
                                  </tr>
                                )}
                              </tbody>
                            </table>
                          </div>

                          {/* Notes */}
                          {dayPlan.notes && (
                            <div className="p-4 bg-purple-500/5 border border-purple-500/10 rounded-2xl">
                              <span className="text-[9px] font-black text-purple-600 block uppercase mb-1">Trainer Directives</span>
                              <p className="text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">{dayPlan.notes}</p>
                            </div>
                          )}

                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* 3. DIET TAB */}
                {modalActiveTab === "Diet" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Day Selector Navigation */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-zinc-900 p-1.5 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setModalDietDay(d)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer shrink-0 ${
                            modalDietDay === d
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-500 dark:text-zinc-400"
                          }`}
                        >
                          {d.substring(0, 3)}
                        </button>
                      ))}
                    </div>

                    {/* Specific Day Diet Panel */}
                    {(() => {
                      const dayDiet = clientDiet[modalDietDay];
                      if (!dayDiet) {
                        return (
                          <div className="py-12 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                            <Apple className="w-8 h-8 text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">No Diet Configured</span>
                            <p className="text-[10px] text-slate-400">No nutritional templates assigned for this weekday.</p>
                          </div>
                        );
                      }

                      const mealKeys = [
                        "earlyMorning", "breakfast", "midMorning", "lunch", "eveningSnack", "preWorkout", "postWorkout", "dinner", "beforeBed"
                      ];
                      let totalKcal = 0;
                      let totalP = 0;
                      let totalC = 0;
                      let totalF = 0;
                      
                      mealKeys.forEach(k => {
                        const m = dayDiet[k];
                        if (m) {
                          totalKcal += parseFloat(m.calories) || 0;
                          totalP += parseFloat(m.protein) || 0;
                          totalC += parseFloat(m.carbs) || 0;
                          totalF += parseFloat(m.fat) || 0;
                        }
                      });

                      return (
                        <div className="space-y-4 text-xs">
                          {/* Nutritional metrics header */}
                          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Nutrition Profile</span>
                              <span className="text-sm font-black text-slate-800 dark:text-zinc-100 block mt-0.5">{clientDiet.template || "Standard Meal Plan"}</span>
                            </div>
                            <div className="grid grid-cols-4 gap-3.5 text-center shrink-0">
                              <div className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                                <span className="text-[8px] text-slate-400 block uppercase font-bold">Calories</span>
                                <span className="font-extrabold text-blue-600 text-xs">{totalKcal} kcal</span>
                              </div>
                              <div className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                                <span className="text-[8px] text-slate-400 block uppercase font-bold">Protein</span>
                                <span className="font-extrabold text-emerald-600 text-xs">{totalP}g</span>
                              </div>
                              <div className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                                <span className="text-[8px] text-slate-400 block uppercase font-bold">Carbs</span>
                                <span className="font-extrabold text-amber-600 text-xs">{totalC}g</span>
                              </div>
                              <div className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 rounded-lg">
                                <span className="text-[8px] text-slate-400 block uppercase font-bold">Fat</span>
                                <span className="font-extrabold text-rose-500 text-xs">{totalF}g</span>
                              </div>
                            </div>
                          </div>

                          {/* Meal Blocks Timeline */}
                          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-800">
                              Daily Meal Distribution
                            </span>
                            
                            <div className="divide-y divide-slate-100/60 dark:divide-zinc-800">
                              {mealKeys.map(k => {
                                const m = dayDiet[k];
                                if (!m || !m.meal) return null;
                                
                                const formattedLabel = k
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, str => str.toUpperCase());

                                return (
                                  <div key={k} className="py-2.5 flex items-start justify-between gap-4">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 block leading-tight">{formattedLabel}</span>
                                      <p className="text-slate-700 dark:text-zinc-200 mt-1 leading-snug">{m.meal}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] font-extrabold text-slate-800 dark:text-zinc-300 block">{m.calories} kcal</span>
                                      <span className="text-[9px] text-slate-400 block mt-0.5">
                                        P: {m.protein}g | C: {m.carbs}g | F: {m.fat}g
                                      </span>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>

                          </div>

                          {/* Water goal */}
                          <div className="p-4 bg-blue-500/5 border border-blue-500/10 rounded-2xl flex items-center justify-between">
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-400 flex items-center gap-1.5">
                              <Droplet className="w-4 h-4 text-blue-500 shrink-0" />
                              <span>Hydration Intake Target</span>
                            </span>
                            <span className="text-xs font-black text-blue-600 dark:text-blue-400">{clientDiet.waterGoal || 3.5} Liters / Day</span>
                          </div>

                        </div>
                      );
                    })()}

                  </div>
                )}

                {/* 4. ATTENDANCE TAB */}
                {modalActiveTab === "Attendance" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* Metrics strip */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                        <span className="text-lg font-black text-blue-600 dark:text-blue-400 block mt-1">
                          {attendanceRate !== null ? `${attendanceRate}%` : "—"}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Present Count</span>
                        <span className="text-lg font-black text-emerald-600 block mt-1">
                          {clientAttendance.filter(a => a.status === "Present").length} Days
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Late Entries</span>
                        <span className="text-lg font-black text-amber-600 block mt-1">
                          {clientAttendance.filter(a => a.status === "Late").length} Logs
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Absent Count</span>
                        <span className="text-lg font-black text-rose-500 block mt-1">
                          {clientAttendance.filter(a => a.status === "Absent").length} Days
                        </span>
                      </div>
                    </div>

                    {/* Detailed history logs list */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm text-xs text-left">
                      <div className="p-4 border-b border-slate-100 dark:border-zinc-800">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">History check-in feed</span>
                      </div>
                      <div className="divide-y divide-slate-100/60 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                        {clientAttendance.length > 0 ? (
                          clientAttendance.map(log => (
                            <div key={log.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-zinc-300">{log.date}</span>
                                <span className="text-[10px] text-slate-400 block mt-0.5">Check-in Log Point</span>
                              </div>
                              <div className="text-right shrink-0 flex items-center gap-3">
                                <span className="text-slate-500 font-semibold">{log.status === "Absent" ? "—" : `In: ${log.timeIn}`}</span>
                                <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                                  log.status === "Present" ? "bg-emerald-500/10 text-emerald-600" :
                                  log.status === "Late" ? "bg-amber-500/10 text-amber-600" :
                                  "bg-rose-500/10 text-rose-500"
                                }`}>
                                  {log.status}
                                </span>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 italic">No historical attendance logs recorded.</div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

                {/* 5. PAYMENTS TAB */}
                {modalActiveTab === "Payments" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Payments summary indicators */}
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Collections Paid</span>
                        <span className="text-lg font-black text-emerald-600 block mt-1">
                          ₹{clientPayments.filter(p => p.status === "Paid").reduce((sum, curr) => sum + (curr.amount || 0), 0)}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Unpaid Fees</span>
                        <span className="text-lg font-black text-rose-500 block mt-1">
                          ₹{clientPayments.filter(p => p.status === "Unpaid" || p.status === "Pending").reduce((sum, curr) => sum + (curr.amount || 0), 0)}
                        </span>
                      </div>
                    </div>

                    {/* Transactions Ledger Table */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-zinc-800 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/20">
                            <th className="py-2.5 px-4">Invoice No</th>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Method</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-800">
                          {clientPayments.length > 0 ? (
                            clientPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/25 dark:hover:bg-zinc-800/15">
                                <td className="py-3 px-4 font-bold text-slate-800 dark:text-zinc-200">{p.invoiceNumber}</td>
                                <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">{p.date}</td>
                                <td className="py-3 px-4 font-black text-slate-900 dark:text-zinc-100">₹{p.amount}</td>
                                <td className="py-3 px-4 font-medium text-slate-600 dark:text-zinc-300">{p.method}</td>
                                <td className="py-3 px-4 text-right">
                                  <span className={`px-2 py-0.5 rounded text-[8.5px] font-black uppercase ${
                                    p.status === "Paid" ? "bg-emerald-500/10 text-emerald-600" : "bg-rose-500/10 text-rose-500"
                                  }`}>
                                    {p.status}
                                  </span>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="5" className="p-4 text-center text-slate-400 italic">No transaction records registered.</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Subscription billing details */}
                    <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm text-xs space-y-3.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-800">
                        Renewals & Billing status
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Membership Validity</span>
                          <div className="mt-1">
                            {renderStatusBadge(membershipInfo)}
                          </div>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Due Expiration Date</span>
                          <span className="font-extrabold text-slate-700 dark:text-zinc-300 block mt-1">{membershipInfo.expiryDate}</span>
                        </div>
                      </div>
                    </div>

                  </div>
                )}

                {/* 6. PROGRESS TAB */}
                {modalActiveTab === "Progress" && (
                  <div className="space-y-6 animate-in fade-in duration-200">
                    
                    {/* SVG Progress chart */}
                    {clientMeasurements.length > 0 ? (() => {
                      const points = clientMeasurements.map(m => m.weight);
                      const target = client.targetWeight || 70;
                      const maxVal = Math.max(...points, target) + 5;
                      const minVal = Math.max(Math.min(...points, target) - 5, 0);
                      const valRange = maxVal - minVal || 1;

                      const chartW = 400;
                      const chartH = 120;
                      const paddingX = 40;
                      const paddingY = 20;
                      const plotW = chartW - paddingX * 2;
                      const plotH = chartH - paddingY * 2;

                      const mapX = (index) => {
                        if (points.length <= 1) return paddingX + plotW / 2;
                        return paddingX + (index / (points.length - 1)) * plotW;
                      };

                      const mapY = (val) => {
                        return chartH - paddingY - ((val - minVal) / valRange) * plotH;
                      };

                      let pathD = "";
                      points.forEach((val, i) => {
                        const px = mapX(i);
                        const py = mapY(val);
                        if (i === 0) pathD = `M ${px} ${py}`;
                        else pathD += ` L ${px} ${py}`;
                      });

                      const targetY = mapY(target);

                      return (
                        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm text-xs space-y-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Client Bodyweight Progress Trend</span>
                            <p className="text-[9px] text-slate-400 mt-0.5">Plotting weights progress against target weight threshold</p>
                          </div>
                          
                          <div className="relative">
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                              <line x1={paddingX} y1={mapY(maxVal - 5)} x2={chartW - paddingX} y2={mapY(maxVal - 5)} stroke="rgba(156,163,175,0.08)" strokeDasharray="3 3" />
                              <line x1={paddingX} y1={mapY(minVal + 5)} x2={chartW - paddingX} y2={mapY(minVal + 5)} stroke="rgba(156,163,175,0.08)" strokeDasharray="3 3" />
                              
                              <line 
                                x1={paddingX} 
                                y1={targetY} 
                                x2={chartW - paddingX} 
                                y2={targetY} 
                                stroke="#f43f5e" 
                                strokeWidth="1.5" 
                                strokeDasharray="4 3" 
                              />
                              <text x={chartW - paddingX - 45} y={targetY - 4} fill="#f43f5e" fontSize="7" fontWeight="bold">Target: {target}kg</text>

                              {pathD && (
                                <path 
                                  d={pathD} 
                                  fill="none" 
                                  stroke="#2563eb" 
                                  strokeWidth="2.5" 
                                  strokeLinecap="round" 
                                  strokeLinejoin="round"
                                />
                              )}

                              {clientMeasurements.map((m, i) => {
                                const px = mapX(i);
                                const py = mapY(m.weight);
                                return (
                                  <g key={i} className="group cursor-pointer">
                                    <circle cx={px} cy={py} r="4.5" fill="#2563eb" stroke="#ffffff" strokeWidth="1.5" />
                                    <text x={px} y={py - 8} fill="#4b5563" fontSize="6.5" fontWeight="bold" textAnchor="middle">
                                      {m.weight}kg
                                    </text>
                                  </g>
                                );
                              })}

                              {clientMeasurements.map((m, i) => {
                                const px = mapX(i);
                                const py = chartH - 6;
                                return (
                                  <text key={i} x={px} y={py} fill="#9ca3af" fontSize="6" fontWeight="bold" textAnchor="middle">
                                    {m.date ? m.date.substring(5) : ""}
                                  </text>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="py-8 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-sm italic text-xs">
                        No progression weight charts logged.
                      </div>
                    )}

                    {/* Detailed Dimensions list */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl overflow-hidden shadow-sm text-xs text-left">
                      <div className="p-4 border-b border-slate-100 dark:border-zinc-800 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Historical Body Dimensions Logs</span>
                      </div>
                      <div className="divide-y divide-slate-100/60 dark:divide-zinc-800 max-h-48 overflow-y-auto">
                        {clientMeasurements.length > 0 ? (
                          clientMeasurements.map((m, idx) => (
                            <div key={idx} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-zinc-800/20">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-blue-600 text-xs">{m.date} Check-in</span>
                                <span className="text-[10px] text-slate-400">Weight: <strong className="text-slate-800 dark:text-zinc-200">{m.weight} kg</strong></span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-slate-500 dark:text-zinc-400 font-semibold">
                                <div>Chest: <strong className="text-slate-700 dark:text-zinc-200">{m.chest || "—"} cm</strong></div>
                                <div>Waist: <strong className="text-slate-700 dark:text-zinc-200">{m.waist || "—"} cm</strong></div>
                                <div>Arms: <strong className="text-slate-700 dark:text-zinc-200">{m.arms || "—"} cm</strong></div>
                                <div>Thigh: <strong className="text-slate-700 dark:text-zinc-200">{m.thigh || "—"} cm</strong></div>
                                <div>BMI: <strong className="text-slate-700 dark:text-zinc-200">{m.bmi || "—"}</strong></div>
                                <div>Fat: <strong className="text-slate-700 dark:text-zinc-200">{m.bodyFat || "—"} %</strong></div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="p-6 text-center text-slate-400 italic">No body dimension metrics registered.</div>
                        )}
                      </div>
                    </div>

                  </div>
                )}

              </div>
              
            </div>
          </div>
        );
      })()}

      {/* --- EDIT CLIENT PROFILE MODAL --- */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEditingClient(null)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 p-6 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 text-left">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 font-display">
                  Edit Client Details
                </h2>
                <button
                  onClick={() => setEditingClient(null)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4 overflow-y-auto max-h-[78vh] pr-1">
                {/* Name */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                  <input
                    type="text"
                    value={editFormData.name || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none"
                    required
                  />
                </div>

                {/* Age & Gender */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Age</label>
                    <input
                      type="number"
                      value={editFormData.age || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, age: parseInt(e.target.value) || "" })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                    <select
                      value={editFormData.gender || "Male"}
                      onChange={(e) => setEditFormData({ ...editFormData, gender: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                </div>

                {/* Height & Weight */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Height (cm)</label>
                    <input
                      type="number"
                      value={editFormData.height || ""}
                      onChange={(e) => {
                        const h = parseFloat(e.target.value) || 0;
                        const w = parseFloat(editFormData.currentWeight) || 0;
                        const bmiVal = h > 0 ? (w / ((h / 100) * (h / 100))).toFixed(1) : 0;
                        setEditFormData({ ...editFormData, height: h, bmi: bmiVal });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.currentWeight || ""}
                      onChange={(e) => {
                        const w = parseFloat(e.target.value) || 0;
                        const h = parseFloat(editFormData.height) || 160;
                        const bmiVal = h > 0 ? (w / ((h / 100) * (h / 100))).toFixed(1) : 0;
                        setEditFormData({ ...editFormData, currentWeight: w, bmi: bmiVal });
                      }}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone *</label>
                    <input
                      type="text"
                      value={editFormData.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Membership Plan & Expiry Date */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Membership Plan</label>
                    <select
                      value={editFormData.membership || "Standard Monthly"}
                      onChange={(e) => setEditFormData({ ...editFormData, membership: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none"
                    >
                      <option value="Standard Monthly">Standard Monthly</option>
                      <option value="Premium Annual">Premium Annual</option>
                      <option value="VIP Coaching">VIP Coaching</option>
                      <option value="Quarterly Plan">Quarterly Plan</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Expiry Date</label>
                    <input
                      type="date"
                      value={editFormData.expiryDate || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, expiryDate: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Goal */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Fitness Goal</label>
                  <select
                    value={editFormData.goal || "General Fitness"}
                    onChange={(e) => setEditFormData({ ...editFormData, goal: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none"
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Muscle Gain">Muscle Gain</option>
                    <option value="General Fitness">General Fitness</option>
                    <option value="Strength Training">Strength Training</option>
                    <option value="Maintenance">Maintenance</option>
                  </select>
                </div>

                {/* Address */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={editFormData.medicalConditions || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContact || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none"
                  />
                </div>

                {/* Trainer Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trainer Notes</label>
                  <textarea
                    value={editFormData.trainerNotes || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, trainerNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-200 focus:outline-none focus:ring-0"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 mt-6 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleEditSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ASSIGN EXISTING CLIENT DIALOG --- */}
      {assignModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print animate-fade-in">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setAssignModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 flex items-center gap-2">
                <UserCheck className="w-5 h-5 text-blue-600 shrink-0" />
                <span>Assign Existing Client</span>
              </h3>
              <button onClick={() => setAssignModalOpen(false)} aria-label="Close assign modal" className="text-slate-400 hover:text-slate-600 cursor-pointer inline-flex items-center justify-center p-1">
                <X className="w-5 h-5 shrink-0" />
              </button>
            </div>
            
            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                  Client ID (UUID) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 123e4567-e89b-12d3-a456-426614174000"
                  value={assignClientId}
                  onChange={(e) => setAssignClientId(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setAssignModalOpen(false)}
                  className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-800 transition cursor-pointer text-center"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer text-center"
                >
                  Assign Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {deletingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingClientId(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-center text-left">
            <div className="w-12 h-12 bg-red-500/10 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-500/20">
              <AlertCircle className="w-6 h-6 shrink-0" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-100 mb-2">Delete Client Record?</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-400 mb-6 leading-relaxed">
              This action cannot be undone. All workout plans, diet schedules, payments, and history logs related to this client will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingClientId(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Delete Client
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINT SHEET TEMPLATE (Matches @media print) --- */}
      {printClientInfo && (
        <div className="hidden print-area leading-relaxed text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings.gymName || "BeFit Gym"}</h1>
            <p className="text-xs text-slate-500">{settings.gymAddress} • Phone: {settings.trainerPhone}</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider mt-2">Client Summary Sheet</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><strong>Client Name:</strong> {printClientInfo.name}</div>
            <div><strong>Age / Gender:</strong> {printClientInfo.age} / {printClientInfo.gender}</div>
            <div><strong>Contact:</strong> {printClientInfo.phone}</div>
            <div><strong>Email:</strong> {printClientInfo.email}</div>
            <div><strong>Join Date:</strong> {printClientInfo.joinDate}</div>
            <div><strong>Membership:</strong> {printClientInfo.membership}</div>
            <div><strong>Fitness Goal:</strong> {printClientInfo.goal}</div>
            <div><strong>Status:</strong> {printClientInfo.status}</div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Initial Dimensions</h3>
            <table className="w-full text-left text-xs border">
              <thead>
                <tr className="bg-slate-100">
                  <th className="p-2 border">Height</th>
                  <th className="p-2 border">Current Weight</th>
                  <th className="p-2 border">Target Weight</th>
                  <th className="p-2 border">BMI</th>
                  <th className="p-2 border">Body Fat %</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className="p-2 border">{printClientInfo.height} cm</td>
                  <td className="p-2 border">{printClientInfo.currentWeight} kg</td>
                  <td className="p-2 border">{printClientInfo.targetWeight} kg</td>
                  <td className="p-2 border">{printClientInfo.bmi}</td>
                  <td className="p-2 border">{printClientInfo.bodyFat}%</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-6">
            <h3 className="text-xs font-bold uppercase tracking-wider mb-2">Trainer's Notes</h3>
            <p className="text-xs border p-3 bg-slate-50 rounded-lg">{printClientInfo.trainerNotes || "No notes registered."}</p>
          </div>
          <div className="mt-12 text-center text-[10px] text-slate-400 border-t pt-4">
            Generated on {new Date().toLocaleDateString()} via BeFit Gym CRM
          </div>
        </div>
      )}

    </div>
  );
};

export default Clients;
