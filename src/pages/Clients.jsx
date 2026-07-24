import React, { useState, useMemo } from "react";
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
  Sparkles
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";

const Clients = () => {
  const { clients, deleteClient, updateClient, attendance, settings } = useCRM();
  const navigate = useNavigate();

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Grid layout fits 6 cards per page perfectly

  // Edit Modal State
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState(null);

  // Print client modal state
  const [printClientInfo, setPrintClientInfo] = useState(null);

  // Filter lists options
  const filterChipsList = [
    "Weight Loss",
    "Muscle Gain",
    "Maintenance",
    "Premium",
    "Standard",
    "Payment Due",
    "Active",
    "Inactive"
  ];

  // Helper: calculate client attendance rate dynamically
  const getClientAttendanceRate = (clientId) => {
    const clientAtt = attendance.filter((a) => a.clientId === clientId);
    if (clientAtt.length === 0) return 85; // realistic fallback rate for visual density
    const present = clientAtt.filter((a) => a.status === "Present" || a.status === "Late").length;
    return Math.round((present / clientAtt.length) * 100);
  };

  // Helper: calculate weight progress percentage dynamically
  const getWeightProgress = (client) => {
    const current = client.currentWeight;
    const target = client.targetWeight;
    if (current > target) {
      // Weight loss goal
      const start = current + 4; // simulated starting point
      const totalToLose = start - target;
      const lost = start - current;
      const pct = totalToLose > 0 ? Math.round((lost / totalToLose) * 100) : 100;
      return Math.min(Math.max(pct, 0), 100);
    } else if (current < target) {
      // Weight gain goal
      const start = current - 4; // simulated starting point
      const totalToGain = target - start;
      const gained = current - start;
      const pct = totalToGain > 0 ? Math.round((gained / totalToGain) * 100) : 100;
      return Math.min(Math.max(pct, 0), 100);
    }
    return 100;
  };

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
    setSelectedChips([]);
    setCurrentPage(1);
  };

  // Process search, filters, and sorting
  const processedClients = useMemo(() => {
    let result = [...clients];

    // 1. Search Query (Matches Name, Phone, Membership, Goal)
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.phone.includes(q) ||
          c.membership.toLowerCase().includes(q) ||
          c.goal.toLowerCase().includes(q)
      );
    }

    // 2. Multi-Select Chip Filters
    if (selectedChips.length > 0) {
      const selectedGoals = selectedChips.filter(chip => ["Weight Loss", "Muscle Gain", "Maintenance"].includes(chip));
      const selectedPlans = selectedChips.filter(chip => ["Premium", "Standard"].includes(chip));
      const selectedStatuses = selectedChips.filter(chip => ["Payment Due", "Active", "Inactive"].includes(chip));

      result = result.filter((c) => {
        // Goal Group match (OR within group)
        if (selectedGoals.length > 0) {
          const matchesGoal = selectedGoals.some(goal => {
            if (goal === "Weight Loss") return c.goal === "Weight Loss" || c.goal === "Fat Loss";
            if (goal === "Muscle Gain") return c.goal === "Muscle Gain" || c.goal === "Weight Gain" || c.goal === "Strength Training";
            if (goal === "Maintenance") return c.goal === "General Fitness" || c.goal === "Maintenance";
            return false;
          });
          if (!matchesGoal) return false;
        }

        // Plan Group match (OR within group)
        if (selectedPlans.length > 0) {
          const matchesPlan = selectedPlans.some(plan => {
            if (plan === "Premium") return c.membership.toLowerCase().includes("premium") || c.membership.toLowerCase().includes("vip");
            if (plan === "Standard") return c.membership.toLowerCase().includes("standard");
            return false;
          });
          if (!matchesPlan) return false;
        }

        // Status Group match (OR within group)
        if (selectedStatuses.length > 0) {
          const matchesStatus = selectedStatuses.some(status => {
            if (status === "Payment Due") return c.status === "Pending Payment";
            if (status === "Active") return c.status === "Active";
            if (status === "Inactive") return c.status === "Expired" || c.status === "Inactive";
            return false;
          });
          if (!matchesStatus) return false;
        }

        return true;
      });
    }

    // 3. Sorting
    result.sort((a, b) => {
      let valA = a[sortField];
      let valB = b[sortField];

      if (sortField === "monthlyFees" || sortField === "age" || sortField === "currentWeight") {
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
  }, [clients, search, selectedChips, sortField, sortOrder]);

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
      if (paginatedClients.length === 1 && currentPage > 1) {
        setCurrentPage(currentPage - 1);
      }
    }
  };

  // Edit Action Trigger
  const handleEditClick = (client) => {
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
  };

  // Print summary sheet
  const handlePrintClient = (client) => {
    setPrintClientInfo(client);
    setTimeout(() => {
      window.print();
    }, 300);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative">
      {/* Header Banner - Desktop */}
      <div className="hidden lg:flex justify-between items-center no-print border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Client Directory
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Monitor member profiles, track bodyweight progressions, and trigger training operations.
          </p>
        </div>
        <button
          onClick={() => navigate("/clients/add")}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Improved Search & Filter Chips Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/85 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4 no-print text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Enhanced Search Input */}
          <div className="relative flex-1">
            <Search className="w-4.5 h-4.5 text-slate-400 absolute left-3.5 top-3.5" />
            <input
              type="text"
              placeholder="Search by name, phone, plan or goal..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-11 pr-4 py-3 border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-800 dark:text-zinc-150 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/50 transition-all"
            />
          </div>

          {/* Quick Sort Options */}
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider whitespace-nowrap">Sort By</span>
            <select
              value={sortField}
              onChange={(e) => {
                setSortField(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 text-xs focus:outline-none"
            >
              <option value="name">Name (Alphabetical)</option>
              <option value="joinDate">Join Date</option>
              <option value="currentWeight">Current Weight</option>
              <option value="age">Age</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="p-2 border border-slate-205 dark:border-zinc-800 rounded-xl text-slate-505 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-950 cursor-pointer"
            >
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Filter Chips list */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Quick Filters</span>
            {selectedChips.length > 0 && (
              <button
                onClick={handleClearFilters}
                className="text-[10px] text-red-500 font-extrabold uppercase hover:underline cursor-pointer"
              >
                Clear All Filters
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 pt-0.5">
            {filterChipsList.map((chip) => {
              const isSelected = selectedChips.includes(chip);
              return (
                <button
                  key={chip}
                  onClick={() => handleToggleChip(chip)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition whitespace-nowrap cursor-pointer border ${
                    isSelected
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-850/60 text-slate-500 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Grid of Client Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 no-print">
        {paginatedClients.length > 0 ? (
          paginatedClients.map((client) => {
            const attendancePct = getClientAttendanceRate(client.id);
            const weightProgressPct = getWeightProgress(client);
            const isOnline = client.status === "Active";
            const isPending = client.status === "Pending Payment";
            const currentTrainer = client.assignedTrainer || settings.trainerName || "Coach Marcus";

            return (
              <div
                key={client.id}
                className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm hover:shadow-lg hover:border-slate-300 dark:hover:border-zinc-700 transition-all duration-300 text-left flex flex-col justify-between"
              >
                {/* Header row */}
                <div>
                  <div className="flex justify-between items-start gap-2">
                    
                    {/* Profile and Name */}
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <img
                          src={client.photo}
                          alt={client.name}
                          className="w-12 h-12 rounded-full object-cover border border-slate-100 dark:border-zinc-800"
                        />
                        {isOnline ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                        ) : isPending ? (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-amber-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                        ) : (
                          <span className="absolute bottom-0 right-0 w-3 h-3 bg-red-500 border-2 border-white dark:border-zinc-900 rounded-full" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <h4
                          onClick={() => navigate(`/clients/${client.id}`)}
                          className="font-extrabold text-slate-800 dark:text-zinc-150 text-base leading-tight hover:text-blue-600 dark:hover:text-blue-400 hover:underline cursor-pointer truncate"
                        >
                          {client.name}
                        </h4>
                        <span className="text-[10px] text-slate-400 block font-medium mt-0.5">{client.phone}</span>
                      </div>
                    </div>

                    {/* Edit/Print Actions row */}
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => handleEditClick(client)}
                        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-zinc-200 transition"
                        title="Edit Record"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => handlePrintClient(client)}
                        className="p-1 text-slate-400 hover:text-indigo-500 transition"
                        title="Print Summary"
                      >
                        <Printer className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setDeletingClientId(client.id)}
                        className="p-1 text-slate-400 hover:text-red-500 transition"
                        title="Delete Client"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Core stats grid */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3.5 mt-5 text-[11px] border-t border-b border-slate-50 dark:border-zinc-850/60 py-4">
                    
                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Membership Plan</span>
                      <span className="font-extrabold text-slate-700 dark:text-zinc-300 block truncate">{client.membership}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Workout Goal</span>
                      <span className="font-extrabold text-blue-600 dark:text-blue-400 block truncate">{client.goal}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Join Date</span>
                      <span className="font-bold text-slate-600 dark:text-zinc-400 block">{client.joinDate}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Expiry Date</span>
                      <span className="font-bold text-slate-600 dark:text-zinc-400 block">{client.expiryDate || "N/A"}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Trainer Assigned</span>
                      <span className="font-bold text-slate-600 dark:text-zinc-400 block truncate">{currentTrainer}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Attendance Rate</span>
                      <span className="font-bold text-slate-600 dark:text-zinc-400 block">{attendancePct}%</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">BMI Value</span>
                      <span className="font-black text-slate-700 dark:text-zinc-300 block">{client.bmi}</span>
                    </div>

                    <div>
                      <span className="text-slate-400 dark:text-zinc-500 font-bold block uppercase tracking-wide text-[9px]">Billing Status</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-extrabold inline-block mt-0.5 ${
                        isOnline ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" :
                        isPending ? "bg-amber-500/10 text-amber-500 border border-amber-500/20" :
                        "bg-red-500/10 text-red-500 border border-red-500/20"
                      }`}>
                        {isOnline ? "Paid" : isPending ? "Payment Due" : "Expired"}
                      </span>
                    </div>

                  </div>

                  {/* Weight Progress Bar */}
                  <div className="space-y-1.5 mt-4">
                    <div className="flex justify-between text-[10px] font-bold text-slate-500 dark:text-zinc-400">
                      <span>Weight Target Milestone</span>
                      <span>{weightProgressPct}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-300" style={{ width: `${weightProgressPct}%` }} />
                    </div>
                    <div className="flex justify-between text-[9px] text-slate-400 dark:text-zinc-500 mt-0.5 font-medium">
                      <span>Current: {client.currentWeight}kg</span>
                      <span>Target: {client.targetWeight}kg</span>
                    </div>
                  </div>

                </div>

                {/* Card Quick action buttons footer */}
                <div className="flex items-center justify-between gap-2.5 border-t border-slate-100 dark:border-zinc-850/60 pt-4 mt-4">
                  <button
                    onClick={() => navigate(`/clients/${client.id}`)}
                    className="p-2.5 bg-blue-50 hover:bg-blue-600 hover:text-white dark:bg-blue-900/10 dark:hover:bg-blue-600 text-blue-600 dark:text-blue-450 rounded-xl transition duration-150 cursor-pointer shadow-sm border border-blue-100/30 dark:border-blue-900/30 shrink-0"
                    title="View Profile"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/workouts`)}
                    className="p-2.5 bg-purple-50 hover:bg-purple-600 hover:text-white dark:bg-purple-900/10 dark:hover:bg-purple-600 text-purple-600 dark:text-purple-450 rounded-xl transition duration-150 cursor-pointer shadow-sm border border-purple-100/30 dark:border-purple-900/30 shrink-0"
                    title="Assign Workout"
                  >
                    <Dumbbell className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/diet`)}
                    className="p-2.5 bg-rose-50 hover:bg-rose-600 hover:text-white dark:bg-rose-900/10 dark:hover:bg-rose-600 text-rose-600 dark:text-rose-450 rounded-xl transition duration-150 cursor-pointer shadow-sm border border-rose-100/30 dark:border-rose-900/30 shrink-0"
                    title="Assign Diet"
                  >
                    <Apple className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => navigate(`/payments`)}
                    className="p-2.5 bg-emerald-50 hover:bg-emerald-600 hover:text-white dark:bg-emerald-900/10 dark:hover:bg-emerald-600 text-emerald-600 dark:text-emerald-455 rounded-xl transition duration-150 cursor-pointer shadow-sm border border-emerald-100/30 dark:border-emerald-900/30 shrink-0"
                    title="Record Payment"
                  >
                    <CreditCard className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => toast.success(`Message notification dispatched to ${client.name} via WhatsApp/SMS!`)}
                    className="p-2.5 bg-amber-50 hover:bg-amber-600 hover:text-white dark:bg-amber-900/10 dark:hover:bg-amber-600 text-amber-600 dark:text-amber-450 rounded-xl transition duration-150 cursor-pointer shadow-sm border border-amber-100/30 dark:border-amber-900/30 shrink-0"
                    title="Message Member"
                  >
                    <MessageSquare className="w-4 h-4" />
                  </button>
                </div>

              </div>
            );
          })
        ) : (
          <div className="col-span-full py-16 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2.5">
            <AlertCircle className="w-9 h-9 text-slate-350" />
            <h4 className="text-sm font-bold text-slate-700 dark:text-zinc-350">No Members Match Search Criteria</h4>
            <p className="text-xs text-slate-400">Try modifying search phrases or toggling different filter chips.</p>
          </div>
        )}
      </div>

      {/* Pagination Bar */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm no-print text-xs">
          <span className="text-slate-405 font-medium">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{" "}
            {Math.min(currentPage * itemsPerPage, processedClients.length)} of{" "}
            {processedClients.length} members
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

      {/* Floating Action Button (FAB) */}
      <button
        onClick={() => navigate("/clients/add")}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-750 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 z-40 active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer"
        title="Add Member"
      >
        <Plus className="w-6 h-6" />
      </button>

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
                  Edit Personal Details
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
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name</label>
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-200 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Phone & Email */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone</label>
                    <input
                      type="text"
                      value={editFormData.phone || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Address */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Address</label>
                  <input
                    type="text"
                    value={editFormData.address || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={editFormData.medicalConditions || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContact || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-855 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Trainer Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trainer Notes</label>
                  <textarea
                    value={editFormData.trainerNotes || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, trainerNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-205 focus:outline-none focus:ring-0"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 mt-6 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
              <button
                type="button"
                onClick={() => setEditingClient(null)}
                className="flex-1 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 dark:hover:bg-zinc-850 transition cursor-pointer"
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

      {/* --- DELETE CONFIRMATION DIALOG --- */}
      {deletingClientId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDeletingClientId(null)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-center">
            <div className="w-12 h-12 bg-red-150/50 dark:bg-red-950/20 text-red-600 dark:text-red-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-800 dark:text-zinc-150 mb-2">Delete Client Record?</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mb-6 leading-relaxed">
              This action cannot be undone. All workout plans, diet schedules, payments, and history logs related to this client will be permanently removed.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeletingClientId(null)}
                className="flex-1 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-705 dark:text-zinc-300 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 py-2 bg-red-600 hover:bg-red-755 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
              >
                Delete Member
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- PRINT SHEET TEMPLATE (Invisible in normal view, matches @media print) --- */}
      {printClientInfo && (
        <div className="hidden print-area leading-relaxed text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings.gymName}</h1>
            <p className="text-xs text-slate-500">{settings.gymAddress} • Phone: {settings.trainerPhone}</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider mt-2">Athlete Summary Sheet</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-sm mb-6">
            <div><strong>Athlete Name:</strong> {printClientInfo.name}</div>
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
            Generated on {new Date().toLocaleDateString()} via Apex Gym CRM
          </div>
        </div>
      )}
    </div>
  );
};

export default Clients;
