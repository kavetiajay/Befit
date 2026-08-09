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
  Sparkles,
  Award,
  ChevronRight as ArrowIcon,
  Heart,
  Droplet
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";
import { EmptyState } from "../components/FeedbackStates";

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
    payments 
  } = useCRM();
  const navigate = useNavigate();

  // Search & Filters state
  const [search, setSearch] = useState("");
  const [selectedChips, setSelectedChips] = useState([]);
  
  // Sorting state
  const [sortField, setSortField] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc"); // 'asc' or 'desc'

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Row items layout fit 8 per page perfectly

  // Edit Modal State
  const [editingClient, setEditingClient] = useState(null);
  const [editFormData, setEditFormData] = useState({});

  // Delete Confirmation State
  const [deletingClientId, setDeletingClientId] = useState(null);

  // Print client modal state
  const [printClientInfo, setPrintClientInfo] = useState(null);

  // Detail Modal / Profile Popup State
  const [selectedClient, setSelectedClient] = useState(null);
  const [modalActiveTab, setModalActiveTab] = useState("Overview");
  const [modalWorkoutDay, setModalWorkoutDay] = useState("monday");
  const [modalDietDay, setModalDietDay] = useState("monday");

  // Filter chips options
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
    if (clientAtt.length === 0) return 85; 
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
    e.stopPropagation(); // prevent opening the view modal
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
    // If current selected client is being edited, update modal contents as well
    if (selectedClient && selectedClient.id === editingClient.id) {
      setSelectedClient({ ...selectedClient, ...editFormData });
    }
  };

  // Print summary sheet
  const handlePrintClient = (e, client) => {
    e.stopPropagation(); // prevent opening the view modal
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

  return (
    <div className="space-y-6 animate-in fade-in duration-300 relative pb-12">
      
      {/* Header Banner - Desktop */}
      <div className="hidden lg:flex justify-between items-center no-print border-b border-slate-100 dark:border-zinc-800 pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Client Directory
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
            Monitor member profiles, track bodyweight progressions, and trigger training operations.
          </p>
        </div>
        <button
          onClick={() => navigate("/clients/add")}
          className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-2xl shadow-md transition cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Member</span>
        </button>
      </div>

      {/* Improved Search & Filter Chips Panel */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl p-5 shadow-sm space-y-4 no-print text-left">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          
          {/* Enhanced Search Input */}
          <div className="relative flex-1">
            <Search className="w-[18px] h-[18px] text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search by name, phone, plan or goal..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              style={{ paddingLeft: "48px", paddingRight: "40px" }}
              className="w-full border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 text-slate-805 dark:text-zinc-150 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500/15 focus:border-blue-500/50 transition-all"
            />
            {search && (
              <button
                onClick={() => {
                  setSearch("");
                  setCurrentPage(1);
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-655 dark:hover:text-zinc-300 cursor-pointer flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </button>
            )}
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
              className="px-3 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 text-xs focus:outline-none text-slate-805"
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
                      : "bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-850/60 text-slate-505 hover:text-slate-700 dark:text-zinc-400 dark:hover:text-zinc-200"
                  }`}
                >
                  {chip}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Directory Table Layout (Mindbody Inspired Compact List) */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-850 rounded-3xl overflow-hidden shadow-soft no-print">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead className="sticky top-0 bg-white dark:bg-zinc-900 z-10">
              <tr className="border-b border-slate-200 dark:border-zinc-800 text-slate-400 dark:text-zinc-500 font-black uppercase tracking-wider text-[10px] bg-slate-50/60 dark:bg-zinc-950/40">
                <th className="py-4.5 px-5">Member</th>
                <th className="py-4.5 px-5">Billing Status</th>
                <th className="py-4.5 px-5">Workout Goal</th>
                <th className="py-4.5 px-5 text-right">Quick Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-850/40">
              {paginatedClients.length > 0 ? (
                paginatedClients.map((client) => {
                  const isOnline = client.status === "Active";
                  const isPending = client.status === "Pending Payment";
                  
                  // Goal color badge mapping
                  let goalBg = "bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-500/10";
                  if (client.goal === "Muscle Gain" || client.goal === "Strength Training") {
                    goalBg = "bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-500/10";
                  } else if (client.goal === "Fat Loss" || client.goal === "Weight Loss") {
                    goalBg = "bg-pink-500/5 text-pink-600 dark:text-pink-400 border-pink-500/10";
                  }

                  return (
                    <tr 
                      key={client.id} 
                      onClick={() => handleOpenClientModal(client)}
                      className="odd:bg-white dark:odd:bg-zinc-900 even:bg-slate-50/15 dark:even:bg-zinc-950/15 hover:bg-blue-50/30 dark:hover:bg-blue-900/10 border-b border-slate-150 dark:border-zinc-850/40 transition-colors cursor-pointer group"
                    >
                      {/* Member Info */}
                      <td className="py-3 px-5 flex items-center gap-3.5">
                        <img 
                          src={client.photo} 
                          alt={client.name} 
                          className="w-10 h-10 rounded-xl object-cover shadow-sm bg-slate-100 border border-slate-200/50 dark:border-zinc-800 group-hover:scale-105 transition-transform"
                        />
                        <div className="text-left">
                          <span className="font-extrabold text-slate-805 dark:text-zinc-150 text-sm group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors block leading-tight">
                            {client.name}
                          </span>
                          <span className="text-[10px] text-slate-400 dark:text-zinc-500 font-medium block mt-0.5">{client.membership}</span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td className="py-3 px-5 text-left">
                        <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider inline-block ${
                          isOnline ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                          isPending ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                          "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                        }`}>
                          {client.status === "Active" ? "Active" : client.status === "Pending Payment" ? "Pending" : "Expired"}
                        </span>
                      </td>

                      {/* Workout goal indicator */}
                      <td className="py-3 px-5 text-left">
                        <span className={`px-2 py-0.5 rounded border text-[9px] font-bold inline-block ${goalBg}`}>
                          {client.goal}
                        </span>
                      </td>

                      {/* Row actions */}
                      <td className="py-3 px-5 text-right">
                        <div className="flex gap-1 justify-end items-center" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => handleOpenClientModal(client)}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-blue-600 hover:text-white dark:hover:bg-blue-650 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95"
                            title="View Profile Modal"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handleEditClick(e, client)}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-750 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95"
                            title="Edit Profile"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => handlePrintClient(e, client)}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-indigo-50 dark:hover:bg-indigo-950 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95"
                            title="Print Summary Sheet"
                          >
                            <Printer className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeletingClientId(client.id); }}
                            className="p-2 bg-slate-50 dark:bg-zinc-800 hover:bg-red-500 hover:text-white dark:hover:bg-red-655 text-slate-500 dark:text-zinc-400 rounded-xl transition cursor-pointer active:scale-95"
                            title="Delete Record"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan="4" className="p-0 border-none">
                    <EmptyState
                      title="No Members Found"
                      description="Try modifying search phrases, toggling different filter chips, or onboarding a new gym member."
                      actionText="Clear Search & Filters"
                      onAction={handleClearFilters}
                      icon={Search}
                    />
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
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
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 hover:bg-blue-750 text-white rounded-full flex items-center justify-center shadow-lg shadow-blue-500/25 z-40 active:scale-95 hover:scale-105 transition-all duration-200 cursor-pointer no-print"
        title="Add Member"
      >
        <Plus className="w-6 h-6" />
      </button>

      {/* --- DETAIL PROFILE POPUP MODAL (Mindbody Inspired tabbed popup) --- */}
      {selectedClient && (() => {
        const client = selectedClient;
        const isOnline = client.status === "Active";
        const isPending = client.status === "Pending Payment";
        
        // Context collections fallbacks
        const clientWorkout = workouts[client.id] || {};
        const clientDiet = diets[client.id] || {};
        const clientMeasurements = measurements[client.id] || [];
        const clientPayments = payments.filter(p => p.clientId === client.id) || [];
        const clientAttendance = attendance.filter(a => a.clientId === client.id) || [];
        
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
              <div className="p-6 bg-slate-50/60 dark:bg-zinc-950/20 border-b border-slate-100 dark:border-zinc-850 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <img 
                    src={client.photo} 
                    alt={client.name} 
                    className="w-14 h-14 rounded-2xl object-cover shadow-sm bg-slate-100 border border-slate-200/50" 
                  />
                  <div>
                    <h2 className="text-lg sm:text-xl font-black text-slate-850 dark:text-zinc-100 leading-none">
                      {client.name}
                    </h2>
                    <div className="flex items-center gap-2 mt-2 flex-wrap">
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                        isOnline ? "bg-emerald-500/10 text-emerald-600 border border-emerald-500/20" :
                        isPending ? "bg-amber-500/10 text-amber-600 border border-amber-500/20" :
                        "bg-rose-500/10 text-rose-600 border border-rose-500/20"
                      }`}>
                        {client.status}
                      </span>
                      <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-500/5 border border-blue-500/10 px-2 py-0.5 rounded">
                        Goal: {client.goal}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => handleEditClick({ stopPropagation: () => {} }, client)}
                    className="p-2 border border-slate-200 dark:border-zinc-800 text-slate-500 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800 rounded-xl transition cursor-pointer"
                    title="Edit Athlete Profile"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setSelectedClient(null)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Modal Tabs Navigation */}
              <div className="border-b border-slate-100 dark:border-zinc-850 px-6 bg-white dark:bg-zinc-900 overflow-x-auto scrollbar-none shrink-0 flex">
                {["Overview", "Workout", "Diet", "Attendance", "Payments", "Progress"].map((tab) => {
                  const isActive = modalActiveTab === tab;
                  return (
                    <button
                      key={tab}
                      onClick={() => setModalActiveTab(tab)}
                      className={`py-3.5 px-4 text-xs font-bold transition-all border-b-2 whitespace-nowrap cursor-pointer ${
                        isActive
                          ? "border-blue-600 text-blue-600"
                          : "border-transparent text-slate-500 hover:text-slate-700 dark:text-zinc-450 dark:hover:text-zinc-250"
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
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-5">
                      {[
                        { label: "Age", val: `${client.age} years`, icon: User },
                        { label: "Gender", val: client.gender, icon: UserCheck },
                        { label: "Blood Group", val: client.bloodGroup || "O+", icon: Droplet },
                        { label: "Join Date", val: client.joinDate, icon: Calendar },
                        { label: "Height", val: `${client.height} cm`, icon: Scale },
                        { label: "Current Weight", val: `${client.currentWeight} kg`, icon: Scale },
                        { label: "Target Weight", val: `${client.targetWeight} kg`, icon: Award },
                        { label: "BMI Value", val: client.bmi || "22.5", icon: Heart }
                      ].map((item, i) => {
                        const Icon = item.icon;
                        return (
                          <div key={i} className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-500/5 text-blue-600 dark:text-blue-400 border border-blue-500/10 flex items-center justify-center shrink-0">
                              <Icon className="w-4.5 h-4.5" />
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
                      <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm space-y-3.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-850">
                          Contact & Emergency Info
                        </span>
                        <div className="grid grid-cols-2 gap-3.5 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Phone Number</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">{client.phone}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Email Address</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350 truncate block">{client.email || "N/A"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-400 block font-semibold">Home Address</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">{client.address || "N/A"}</span>
                          </div>
                          <div className="col-span-2">
                            <span className="text-[9px] text-slate-400 block font-semibold">Emergency Contact Link</span>
                            <span className="font-bold text-rose-500 dark:text-rose-400">{client.emergencyContact || "N/A"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Subscription Box */}
                      <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm space-y-3.5">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-850">
                          Membership Configuration
                        </span>
                        <div className="grid grid-cols-2 gap-3.5 text-xs">
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Active Plan</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">{client.membership}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Monthly Rates</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">₹{client.monthlyFees || 3500}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Expiration Date</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">{client.expiryDate || "N/A"}</span>
                          </div>
                          <div>
                            <span className="text-[9px] text-slate-400 block font-semibold">Assigned Trainer</span>
                            <span className="font-bold text-slate-700 dark:text-zinc-350">{client.assignedTrainer || settings.trainerName || "Coach Marcus"}</span>
                          </div>
                        </div>
                      </div>

                    </div>

                    {/* Trainer Bio notes */}
                    <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block mb-2">Coach's Core Notes</span>
                      <p className="text-slate-600 dark:text-zinc-400 italic bg-slate-50 dark:bg-zinc-950/40 p-3 rounded-xl border border-slate-100 dark:border-zinc-850/60 leading-relaxed">
                        {client.trainerNotes || "No custom logs registered for this athlete."}
                      </p>
                    </div>

                  </div>
                )}

                {/* 2. WORKOUT TAB */}
                {modalActiveTab === "Workout" && (
                  <div className="space-y-5 animate-in fade-in duration-200">
                    
                    {/* Day Selector Navigation */}
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-zinc-900 p-1.5 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setModalWorkoutDay(d)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer shrink-0 ${
                            modalWorkoutDay === d
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-955 text-slate-500 dark:text-zinc-400"
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
                          <div className="py-12 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                            <Sparkles className="w-8 h-8 text-slate-300" />
                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">Scheduled Rest Day</span>
                            <p className="text-[10px] text-slate-400">No active physical blocks configured for this day.</p>
                          </div>
                        );
                      }

                      return (
                        <div className="space-y-4 text-xs">
                          {/* Day summary block */}
                          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm flex justify-between items-center">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Target Muscle Group</span>
                              <span className="text-sm font-black text-slate-805 dark:text-zinc-150 block mt-0.5">{dayPlan.muscleGroup}</span>
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
                          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
                            <table className="w-full text-left text-xs border-collapse">
                              <thead>
                                <tr className="border-b border-slate-100 dark:border-zinc-850 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/20">
                                  <th className="py-2.5 px-4">Exercise Name</th>
                                  <th className="py-2.5 px-4">Sets</th>
                                  <th className="py-2.5 px-4">Repetitions</th>
                                  <th className="py-2.5 px-4 text-right">Load Weight</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-850/40">
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
                              <span className="text-[9px] font-black text-purple-600 block uppercase mb-1">Trainer Split Directives</span>
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
                    <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none bg-white dark:bg-zinc-900 p-1.5 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                      {["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"].map(d => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setModalDietDay(d)}
                          className={`px-3 py-1.5 text-[10px] font-black uppercase rounded-xl transition cursor-pointer shrink-0 ${
                            modalDietDay === d
                              ? "bg-blue-600 text-white shadow-sm"
                              : "hover:bg-slate-50 dark:hover:bg-zinc-955 text-slate-500 dark:text-zinc-400"
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
                          <div className="py-12 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl text-center text-slate-400 shadow-sm flex flex-col items-center justify-center gap-2">
                            <Apple className="w-8 h-8 text-slate-350" />
                            <span className="text-xs font-bold text-slate-600 dark:text-zinc-400">No Diet Configured</span>
                            <p className="text-[10px] text-slate-400">No nutritional templates assigned for this weekday.</p>
                          </div>
                        );
                      }

                      // Dynamic calculations from meal calorie indicators
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
                          <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm flex flex-col sm:flex-row justify-between sm:items-center gap-3">
                            <div>
                              <span className="text-[9px] font-bold text-slate-400 block uppercase">Active Nutrition Profile</span>
                              <span className="text-sm font-black text-slate-805 dark:text-zinc-150 block mt-0.5">{clientDiet.template || "Standard Meal Plan"}</span>
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
                          <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl p-4 shadow-sm space-y-3">
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-850">
                              Daily Meal Distribution
                            </span>
                            
                            <div className="divide-y divide-slate-100/60 dark:divide-zinc-850/40">
                              {mealKeys.map(k => {
                                const m = dayDiet[k];
                                if (!m || !m.meal) return null;
                                
                                // Label mapper
                                const formattedLabel = k
                                  .replace(/([A-Z])/g, " $1")
                                  .replace(/^./, str => str.toUpperCase());

                                return (
                                  <div key={k} className="py-2.5 flex items-start justify-between gap-4">
                                    <div>
                                      <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-350 block leading-tight">{formattedLabel}</span>
                                      <p className="text-slate-700 dark:text-zinc-200 mt-1 leading-snug">{m.meal}</p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <span className="text-[10px] font-extrabold text-slate-805 dark:text-zinc-300 block">{m.calories} kcal</span>
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
                            <span className="text-xs font-bold text-slate-700 dark:text-zinc-350 flex items-center gap-1.5">
                              <Droplet className="w-4 h-4 text-blue-500" />
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
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                        <span className="text-lg font-black text-blue-600 dark:text-blue-450 block mt-1">{attendanceRate}%</span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Present Count</span>
                        <span className="text-lg font-black text-emerald-600 block mt-1">
                          {clientAttendance.filter(a => a.status === "Present").length} Days
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Late Entries</span>
                        <span className="text-lg font-black text-amber-600 block mt-1">
                          {clientAttendance.filter(a => a.status === "Late").length} Logs
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Absent Count</span>
                        <span className="text-lg font-black text-rose-500 block mt-1">
                          {clientAttendance.filter(a => a.status === "Absent").length} Days
                        </span>
                      </div>
                    </div>

                    {/* July 2026 calendar checker */}
                    <div className="p-5 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm text-xs">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2 mb-4 border-slate-100 dark:border-zinc-850">
                        Monthly Checked In Grid (July 2026)
                      </span>
                      
                      {/* Weekday indicator */}
                      <div className="grid grid-cols-7 gap-1.5 text-center font-bold text-[9px] text-slate-400 uppercase mb-2">
                        <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                      </div>
                      
                      {/* 31 days with offset 3 (Wed start) */}
                      <div className="grid grid-cols-7 gap-1.5">
                        {Array.from({ length: 3 }).map((_, idx) => (
                          <div key={`offset-${idx}`} className="aspect-square" />
                        ))}
                        {Array.from({ length: 31 }).map((_, idx) => {
                          const dayNum = idx + 1;
                          const dateStr = `2026-07-${dayNum.toString().padStart(2, "0")}`;
                          const log = clientAttendance.find(a => a.date === dateStr);

                          let cellColor = "border-slate-100 dark:border-zinc-850 text-slate-650 bg-slate-50 dark:bg-zinc-950/20";
                          if (log?.status === "Present") cellColor = "bg-emerald-500/15 border-emerald-500/30 text-emerald-600 font-extrabold";
                          if (log?.status === "Late") cellColor = "bg-amber-500/15 border-amber-500/30 text-amber-600 font-extrabold";
                          if (log?.status === "Absent") cellColor = "bg-rose-500/15 border-rose-500/30 text-rose-500 font-extrabold";

                          return (
                            <div 
                              key={dayNum} 
                              className={`aspect-square rounded-xl border flex flex-col items-center justify-center text-[10px] transition-transform hover:scale-105 select-none ${cellColor}`}
                              title={log ? `${log.date}: ${log.status} (In: ${log.timeIn})` : `${dateStr}: No log`}
                            >
                              <span>{dayNum}</span>
                            </div>
                          );
                        })}
                      </div>

                      {/* Legend colors */}
                      <div className="flex gap-4 justify-center items-center mt-5 pt-3.5 border-t border-slate-100 dark:border-zinc-850/50 text-[10px] font-bold">
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" /><span>Present</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30" /><span>Late</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/30" /><span>Absent</span></div>
                        <div className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded bg-slate-50 border border-slate-100" /><span>No Record</span></div>
                      </div>

                    </div>

                    {/* Detailed history logs list */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm text-xs text-left">
                      <div className="p-4 border-b border-slate-105 dark:border-zinc-850">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">History check-in feed</span>
                      </div>
                      <div className="divide-y divide-slate-100/60 dark:divide-zinc-850/40 max-h-48 overflow-y-auto">
                        {clientAttendance.length > 0 ? (
                          clientAttendance.map(log => (
                            <div key={log.id} className="p-3.5 flex justify-between items-center hover:bg-slate-50/50 dark:hover:bg-zinc-850/15">
                              <div>
                                <span className="font-bold text-slate-700 dark:text-zinc-350">{log.date}</span>
                                <span className="text-[10px] text-slate-450 block mt-0.5">Check-in Log Point</span>
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
                          <div className="p-6 text-center text-slate-400 italic">No historical logs compiled.</div>
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
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Total Collections Paid</span>
                        <span className="text-lg font-black text-emerald-600 block mt-1">
                          ₹{clientPayments.filter(p => p.status === "Paid").reduce((sum, curr) => sum + curr.amount, 0)}
                        </span>
                      </div>
                      <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm">
                        <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">Outstanding Unpaid Fees</span>
                        <span className="text-lg font-black text-rose-500 block mt-1">
                          ₹{clientPayments.filter(p => p.status === "Unpaid").reduce((sum, curr) => sum + curr.amount, 0)}
                        </span>
                      </div>
                    </div>

                    {/* Transactions Ledger Table */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-100 dark:border-zinc-850 text-slate-400 font-bold uppercase tracking-wider text-[9px] bg-slate-50/50 dark:bg-zinc-950/20">
                            <th className="py-2.5 px-4">Invoice No</th>
                            <th className="py-2.5 px-4">Date</th>
                            <th className="py-2.5 px-4">Amount</th>
                            <th className="py-2.5 px-4">Method</th>
                            <th className="py-2.5 px-4 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100/60 dark:divide-zinc-850/40">
                          {clientPayments.length > 0 ? (
                            clientPayments.map((p) => (
                              <tr key={p.id} className="hover:bg-slate-50/25 dark:hover:bg-zinc-850/15">
                                <td className="py-3 px-4 font-bold text-slate-805 dark:text-zinc-200">{p.invoiceNumber}</td>
                                <td className="py-3 px-4 text-slate-500 dark:text-zinc-400">{p.date}</td>
                                <td className="py-3 px-4 font-black text-slate-850 dark:text-zinc-100">₹{p.amount}</td>
                                <td className="py-3 px-4 font-medium text-slate-600 dark:text-zinc-350">{p.method}</td>
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
                    <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm text-xs space-y-3.5">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-slate-100 dark:border-zinc-850">
                        Renewals & Billing status
                      </span>
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Membership Validity</span>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-black uppercase inline-block mt-1 ${
                            isOnline ? "bg-emerald-500/10 text-emerald-600" :
                            isPending ? "bg-amber-500/10 text-amber-600" :
                            "bg-rose-500/10 text-rose-600"
                          }`}>
                            {isOnline ? "Current" : isPending ? "Action Required" : "Expired"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-400 block font-bold uppercase">Due Expiration Date</span>
                          <span className="font-extrabold text-slate-700 dark:text-zinc-300 block mt-1">{client.expiryDate || "N/A"}</span>
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
                      // Filter and format dimensions points
                      const points = clientMeasurements.map(m => m.weight);
                      const maxVal = Math.max(...points, client.targetWeight) + 5;
                      const minVal = Math.max(Math.min(...points, client.targetWeight) - 5, 0);
                      const valRange = maxVal - minVal || 1;

                      // Build SVG Coordinates (Width 400, Height 120)
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

                      // Construct path coordinates
                      let pathD = "";
                      points.forEach((val, i) => {
                        const px = mapX(i);
                        const py = mapY(val);
                        if (i === 0) pathD = `M ${px} ${py}`;
                        else pathD += ` L ${px} ${py}`;
                      });

                      // Target Weight horizontal helper line
                      const targetY = mapY(client.targetWeight);

                      return (
                        <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm text-xs space-y-4">
                          <div>
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Athlete Bodyweight Progress Trend</span>
                            <p className="text-[9px] text-slate-450 mt-0.5">Plotting weights progress against target weight threshold</p>
                          </div>
                          
                          {/* Inline SVG Chart */}
                          <div className="relative">
                            <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                              {/* Background Grid Lines */}
                              <line x1={paddingX} y1={mapY(maxVal - 5)} x2={chartW - paddingX} y2={mapY(maxVal - 5)} stroke="rgba(156,163,175,0.08)" strokeDasharray="3 3" />
                              <line x1={paddingX} y1={mapY(minVal + 5)} x2={chartW - paddingX} y2={mapY(minVal + 5)} stroke="rgba(156,163,175,0.08)" strokeDasharray="3 3" />
                              
                              {/* Target line (Dotted red/rose) */}
                              <line 
                                x1={paddingX} 
                                y1={targetY} 
                                x2={chartW - paddingX} 
                                y2={targetY} 
                                stroke="#f43f5e" 
                                strokeWidth="1.5" 
                                strokeDasharray="4 3" 
                              />
                              <text x={chartW - paddingX - 45} y={targetY - 4} fill="#f43f5e" fontSize="7" fontWeight="bold">Target: {client.targetWeight}kg</text>

                              {/* Progress line */}
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

                              {/* Node Dots */}
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

                              {/* Dates Labels */}
                              {clientMeasurements.map((m, i) => {
                                const px = mapX(i);
                                const py = chartH - 6;
                                return (
                                  <text key={i} x={px} y={py} fill="#9ca3af" fontSize="6" fontWeight="bold" textAnchor="middle">
                                    {m.date.substring(5)}
                                  </text>
                                );
                              })}
                            </svg>
                          </div>
                        </div>
                      );
                    })() : (
                      <div className="py-8 text-center text-slate-400 bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl shadow-sm italic text-xs">
                        No progression weight charts logged.
                      </div>
                    )}

                    {/* Detailed Dimensions list */}
                    <div className="bg-white dark:bg-zinc-900 border border-slate-150 dark:border-zinc-850 rounded-2xl overflow-hidden shadow-sm text-xs text-left">
                      <div className="p-4 border-b border-slate-105 dark:border-zinc-850 flex justify-between items-center">
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">Historical Body Dimensions Logs</span>
                      </div>
                      <div className="divide-y divide-slate-100/60 dark:divide-zinc-850/40 max-h-48 overflow-y-auto">
                        {clientMeasurements.length > 0 ? (
                          clientMeasurements.map((m, idx) => (
                            <div key={idx} className="p-4 space-y-2 hover:bg-slate-50/50 dark:hover:bg-zinc-850/15">
                              <div className="flex justify-between items-center">
                                <span className="font-extrabold text-blue-600 text-xs">{m.date} Check-in</span>
                                <span className="text-[10px] text-slate-450">Weight: <strong className="text-slate-805 dark:text-zinc-200">{m.weight} kg</strong></span>
                              </div>
                              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 text-[10px] text-slate-550 dark:text-zinc-400 font-semibold">
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
                          <div className="p-6 text-center text-slate-400 italic">No dimensions metrics registered.</div>
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-200 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-205 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-205 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-205 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-205 focus:outline-none"
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
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={editFormData.medicalConditions || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955 text-slate-850 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContact || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955 text-slate-855 dark:text-zinc-205 focus:outline-none"
                  />
                </div>

                {/* Trainer Notes */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Trainer Notes</label>
                  <textarea
                    value={editFormData.trainerNotes || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, trainerNotes: e.target.value })}
                    rows={2}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-955 text-slate-850 dark:text-zinc-205 focus:outline-none focus:ring-0"
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
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-center text-left">
            <div className="w-12 h-12 bg-red-150/50 dark:bg-red-955/25 text-red-605 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-805 dark:text-zinc-150 mb-2">Delete Client Record?</h3>
            <p className="text-xs text-slate-400 dark:text-zinc-550 mb-6 leading-relaxed">
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
                className="flex-1 py-2 bg-red-650 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shadow-sm transition cursor-pointer"
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
