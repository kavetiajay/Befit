import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  Apple,
  Calendar,
  Scale,
  CreditCard,
  Trophy,
  User,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Flame,
  Droplet,
  ChevronRight,
  TrendingDown,
  Target,
  Sparkles,
  MessageSquare,
  Activity,
  Heart,
  Award,
  Zap,
  TrendingUp,
  Download,
  Check
} from "lucide-react";
import { toast } from "sonner";

const ClientDashboard = () => {
  const navigate = useNavigate();

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    localStorage.setItem("gym_role", "client");
  }, []);

  const handleSwitchRole = (newRole) => {
    localStorage.setItem("gym_role", newRole);
    setShowRoleDropdown(false);
    if (newRole === "client") {
      navigate("/client/dashboard");
      toast.success("Switched to Client View Portal 👤");
    } else {
      navigate("/trainer/dashboard");
      toast.success("Switched to Trainer View Portal 👨‍🏫");
    }
  };
  
  // Navigation active tab
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Today's Mission Status state
  const [missionProgress, setMissionProgress] = useState(75);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // AI assistant status state
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Payments / History expanded state
  const [selectedInvoice, setSelectedInvoice] = useState(null);

  // Attendance Heatmap date hover state
  const [hoveredDate, setHoveredDate] = useState(null);

  // Quick settings state
  const [waterCount, setWaterCount] = useState(2); // 2 Liters drunk today

  // Exercise completions check list
  const [exerciseCompletions, setExerciseCompletions] = useState({
    ex1: true,
    ex2: true,
    ex3: false,
    ex4: false
  });

  const toggleExercise = (key) => {
    const newVal = !exerciseCompletions[key];
    setExerciseCompletions(prev => {
      const updated = { ...prev, [key]: newVal };
      // Recalculate mission progress dynamically:
      // Steps (25%), Water (25%), Exercises (50% split)
      const completedExercisesCount = Object.values(updated).filter(Boolean).length;
      const exerciseProgress = (completedExercisesCount / 4) * 50;
      const totalPct = 25 + 15 + exerciseProgress; // base steps + partial water + exercises
      setMissionProgress(Math.min(Math.round(totalPct), 100));
      return updated;
    });
  };

  const handleStartWorkout = () => {
    if (workoutCompleted) {
      toast.info("You've already completed today's workout splits!");
      return;
    }
    setWorkoutStarted(true);
    toast.success("Today's Chest + Triceps split active. Let's lift!");
  };

  const handleCompleteWorkout = () => {
    setWorkoutStarted(false);
    setWorkoutCompleted(true);
    setExerciseCompletions({ ex1: true, ex2: true, ex3: true, ex4: true });
    setMissionProgress(100);
    toast.success("Workout completed! 100% of Today's Mission cleared. 🏆");
  };

  const triggerAskAi = () => {
    setLoadingAi(true);
    setTimeout(() => {
      setAiResponse(
        "Based on your 14-day streak and current rate, your metabolism is peak. I suggest increasing your water intake to 3.5L tomorrow to optimize fat oxidation. Keep up the Chest split load!"
      );
      setLoadingAi(false);
      toast.success("AI Fitness Coach analysis compiled.");
    }, 1200);
  };

  const formatDateFriendly = (dateString) => {
    if (!dateString) return "";
    try {
      const parts = dateString.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  // Mock invoice data
  const invoiceList = [
    { id: "inv_1", number: "INV-072601", date: "2026-07-25", plan: "BeFit Premium Annual", amount: 28000, method: "UPI", status: "Paid" },
    { id: "inv_2", number: "INV-062604", date: "2026-06-25", plan: "BeFit Premium Monthly", amount: 3500, method: "Card", status: "Paid" },
    { id: "inv_3", number: "INV-052609", date: "2026-05-25", plan: "BeFit Premium Monthly", amount: 3500, method: "UPI", status: "Paid" }
  ];

  // Mock weight history
  const weightProgressList = [
    { date: "May 10", weight: 75 },
    { date: "May 25", weight: 74.2 },
    { date: "Jun 10", weight: 73 },
    { date: "Jun 25", weight: 71.5 },
    { date: "Jul 10", weight: 70.8 },
    { date: "Jul 22", weight: 70 }
  ];

  // Mock July 2026 heatmap calendar
  // 1 = Present (Green), 2 = Absent (Red), 3 = Holiday (Grey)
  const attendanceHeatmap = [
    { day: 1, status: 1 }, { day: 2, status: 1 }, { day: 3, status: 1 }, { day: 4, status: 3 },
    { day: 5, status: 1 }, { day: 6, status: 1 }, { day: 7, status: 1 }, { day: 8, status: 1 },
    { day: 9, status: 1 }, { day: 10, status: 1 }, { day: 11, status: 3 }, { day: 12, status: 2 },
    { day: 13, status: 1 }, { day: 14, status: 1 }, { day: 15, status: 1 }, { day: 16, status: 1 },
    { day: 17, status: 1 }, { day: 18, status: 3 }, { day: 19, status: 1 }, { day: 20, status: 1 },
    { day: 21, status: 1 }, { day: 22, status: 1 }, { day: 23, status: 2 }, { day: 24, status: 1 },
    { day: 25, status: 3 }, { day: 26, status: 1 }, { day: 27, status: 1 }, { day: 28, status: 1 },
    { day: 29, status: 1 }, { day: 30, status: 1 }, { day: 31, status: 1 }
  ];

  // Menu items list
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Workout", icon: Dumbbell },
    { name: "My Diet", icon: Apple },
    { name: "Attendance", icon: Calendar },
    { name: "Progress", icon: Scale },
    { name: "Payments", icon: CreditCard },
    { name: "Achievements", icon: Trophy }
  ];

  const handleLogout = () => {
    toast.error("Signed out from BeFit Companion (demo mode)");
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 flex font-sans selection:bg-blue-600/35 selection:text-white transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-68 bg-[#0b101c] border-r border-[#1e293b]/50 p-6 sticky top-0 h-screen justify-between z-20 shrink-0">
        <div>
          {/* Logo brand */}
          <div className="flex items-center gap-3.5 mb-9 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <Dumbbell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                BeFit
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                Personal Companion
              </span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => { setActiveTab(item.name); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-205 cursor-pointer text-left ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5 font-black"
                      : "text-slate-400 hover:text-slate-205 hover:bg-[#111827]/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar layout */}
        <div className="space-y-4 pt-5 border-t border-[#1e293b]/40">
          <Link
            to="/"
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-black text-purple-400 bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-cyan-455" />
            <span>Switch to Trainer View</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE COLLAPSIBLE DRAWER --- */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="fixed inset-0 bg-[#080B14]/80 backdrop-blur-md" onClick={() => setMobileMenuOpen(false)} />
          <div className="relative flex flex-col w-64 max-w-xs bg-[#0b101c] border-r border-[#1e293b]/60 p-5 h-full animate-in slide-in-from-left duration-300 text-left">
            <button
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-4.5 right-4.5 p-1 rounded-xl bg-[#111827] border border-zinc-800 text-slate-400 hover:bg-zinc-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Logo */}
            <div className="flex items-center gap-3 mb-8 mt-2">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-md">
                <Dumbbell className="w-4.5 h-4.5" />
              </div>
              <span className="font-black text-sm bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                BeFit App
              </span>
            </div>

            {/* Links list */}
            <nav className="flex-1 space-y-1.5">
              {sidebarItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.name;
                return (
                  <button
                    key={item.name}
                    onClick={() => { setActiveTab(item.name); setMobileMenuOpen(false); }}
                    className={`w-full flex items-center gap-3.5 px-4 py-2.5 rounded-2xl text-xs font-bold transition-all cursor-pointer text-left ${
                      isActive
                        ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/20"
                        : "text-slate-400 hover:bg-zinc-850/40"
                    }`}
                  >
                    <Icon className="w-4.5 h-4.5" />
                    <span>{item.name}</span>
                  </button>
                );
              })}
            </nav>

            <div className="pt-4 border-t border-[#1e293b]/50 mt-auto space-y-3">
              <Link
                to="/"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-black text-purple-400 bg-purple-500/5 border border-purple-500/15"
              >
                <User className="w-3.5 h-3.5" />
                <span>Trainer Portal</span>
              </Link>
              <button
                onClick={handleLogout}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold text-rose-500 border border-[#1e293b] hover:bg-rose-500/5 cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE VIEWPORT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B14] p-4.5 sm:p-6 lg:p-8 overflow-y-auto max-h-screen">
        
        {/* Mobile Navbar Header */}
        <div className="flex lg:hidden justify-between items-center bg-[#0b101c]/80 border border-[#1e293b]/50 rounded-2xl p-4.5 mb-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">BeFit Portal</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile Avatar Mobile toggle trigger */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-8.5 h-8.5 rounded-xl overflow-hidden border border-[#1e293b]/70 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
                  alt="Client avatar"
                  className="w-full h-full object-cover"
                />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-10 right-0 w-48 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#1e293b]/30 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-display">Role</span>
                    <span className="text-xs font-black text-white block mt-0.5">Client Portal</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleSwitchRole("trainer")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-zinc-850 text-slate-350 rounded-xl transition text-left"
                    >
                      <span>👨‍🏫</span>
                      <span>Switch to Trainer</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole("client")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-600/10 text-cyan-400 rounded-xl transition text-left mt-0.5"
                    >
                      <span>👤</span>
                      <span>Switch to Client</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="p-2 bg-[#111827] border border-zinc-800 rounded-xl text-slate-350 cursor-pointer hover:bg-zinc-800 transition animate-in duration-200"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* --- TABS LAYOUT CONTROLLER --- */}

        {/* 1. DASHBOARD HOME TAB */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Hero Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-8 bg-gradient-to-br from-[#111827] via-[#0b101c] to-[#0c0f1c] border border-zinc-850 rounded-3xl relative overflow-hidden text-left gap-4">
              <div className="relative z-10 space-y-2">
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20">
                  Ready to achieve your fitness goals today?
                </span>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white mt-1">
                  Good Morning, Ajay 👋
                </h1>
                <p className="text-xs text-slate-400 max-w-md font-medium leading-relaxed">
                  Welcome back! You are pacing well on your fat loss milestones. Stay fueled, hydra-charged, and crush today's lift split.
                </p>
              </div>

              {/* Float Metadata Summary Block with Role Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-4 bg-zinc-900/60 backdrop-blur-md border border-[#1e293b]/40 p-4 rounded-2xl relative z-10 shrink-0 shadow-xl hover:bg-zinc-800 transition cursor-pointer text-left"
                >
                  <img
                    src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"
                    alt="Ajay avatar"
                    className="w-14 h-14 rounded-xl object-cover border border-blue-500/20"
                  />
                  <div className="text-left text-xs space-y-0.5">
                    <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Client Mode 👤</span>
                    <span className="font-extrabold text-blue-400 flex items-center gap-1 mt-0.5">🔥 Ajay</span>
                    <div className="flex items-center gap-3.5 mt-1.5 text-[10px] font-semibold text-slate-350">
                      <div>Goal: <strong className="text-white">Fat Loss</strong></div>
                    </div>
                  </div>
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-20 right-0 w-52 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#1e293b]/30 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    <div className="px-3 py-2">
                      <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Current Role</span>
                      <span className="text-xs font-black text-white block mt-0.5">Client Portal</span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => handleSwitchRole("trainer")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-[#111827] text-slate-300 rounded-xl transition text-left"
                      >
                        <span className="text-sm">👨‍🏫</span>
                        <span>Switch to Trainer</span>
                      </button>
                      <button
                        onClick={() => handleSwitchRole("client")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-600/10 text-cyan-400 rounded-xl transition text-left mt-0.5"
                      >
                        <span className="text-sm">👤</span>
                        <span>Switch to Client</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Background gradient flares */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Highlighted Today's Mission & AI Coach Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Today's Mission Card */}
              <div className="lg:col-span-2 bg-[#111827] border border-[#1e293b]/40 rounded-3xl p-6 relative overflow-hidden text-left flex flex-col justify-between group shadow-xl">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest bg-rose-500/10 px-2.5 py-1 rounded-full border border-rose-500/20 flex items-center gap-1">
                      <Target className="w-3.5 h-3.5" /> Today's Mission 🎯
                    </span>
                    <span className="text-xs font-black text-white">{missionProgress}% Completed</span>
                  </div>

                  {/* Splits info grid */}
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 py-3 border-t border-b border-[#1e293b]/35 mt-4">
                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                      <span className="text-[8.5px] text-slate-500 font-bold block uppercase tracking-wide">Workout</span>
                      <span className="font-extrabold text-white text-xs block truncate mt-1">Chest + Tri</span>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                      <span className="text-[8.5px] text-slate-500 font-bold block uppercase tracking-wide">Duration</span>
                      <span className="font-extrabold text-white text-xs block truncate mt-1">60 Min</span>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                      <span className="text-[8.5px] text-slate-500 font-bold block uppercase tracking-wide">Protein</span>
                      <span className="font-extrabold text-cyan-400 text-xs block truncate mt-1">120g Target</span>
                    </div>
                    <div className="p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                      <span className="text-[8.5px] text-slate-500 font-bold block uppercase tracking-wide">Water Goal</span>
                      <span className="font-extrabold text-blue-400 text-xs block truncate mt-1">3 Litres</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1 p-3 bg-zinc-950/40 rounded-xl border border-zinc-850">
                      <span className="text-[8.5px] text-slate-500 font-bold block uppercase tracking-wide">Steps Target</span>
                      <span className="font-extrabold text-purple-400 text-xs block truncate mt-1">8,000 Steps</span>
                    </div>
                  </div>

                  {/* Progress Line */}
                  <div className="space-y-1.5 mt-4">
                    <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 rounded-full transition-all duration-350"
                        style={{ width: `${missionProgress}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button 
                    onClick={handleStartWorkout}
                    disabled={workoutCompleted}
                    className="flex-1 py-3 bg-gradient-to-r from-blue-600 via-cyan-500 to-cyan-600 disabled:from-zinc-800 disabled:to-zinc-800 hover:opacity-95 text-white text-xs font-black uppercase rounded-2xl shadow-lg shadow-blue-600/10 tracking-widest cursor-pointer transition active:scale-95 text-center disabled:cursor-not-allowed"
                  >
                    {workoutCompleted ? "Mission Completed" : workoutStarted ? "Workout In Progress..." : "Start Workout"}
                  </button>
                  {workoutStarted && (
                    <button
                      onClick={handleCompleteWorkout}
                      className="px-6 py-3 bg-[#1e293b] border border-cyan-400/35 hover:bg-[#2e3b4e] text-white text-xs font-black uppercase rounded-2xl cursor-pointer transition"
                    >
                      Complete Split
                    </button>
                  )}
                </div>
              </div>

              {/* AI Fitness Coach Glowing Card */}
              <div className="bg-gradient-to-br from-[#111827] to-[#121021] border border-purple-500/25 rounded-3xl p-6 relative overflow-hidden text-left flex flex-col justify-between shadow-xl group">
                <div className="space-y-3.5">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> AI Fitness Coach 🤖
                  </span>
                  
                  <p className="text-xs text-slate-350 leading-relaxed font-semibold italic bg-zinc-950/30 p-3 rounded-2xl border border-zinc-900 mt-2">
                    {aiResponse ? aiResponse : '"Your weight reduced by 1.5kg this month. Keep maintaining your protein intake."'}
                  </p>
                </div>

                <div className="mt-5">
                  <button 
                    onClick={triggerAskAi}
                    disabled={loadingAi}
                    className="w-full py-2.5 bg-purple-600/15 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 hover:border-purple-600 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm relative overflow-hidden group flex items-center justify-center gap-2"
                  >
                    <span>{loadingAi ? "Analyzing metrics..." : "Ask AI Coach"}</span>
                  </button>
                </div>
                
                {/* Glowing neon background circle */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>

            </div>

            {/* Quick Fitness Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { title: "Weight Progress", val: "70 kg", sub: "↓ 2kg this month", icon: Scale, color: "from-blue-600 to-cyan-500 text-blue-400" },
                { title: "Attendance Rate", val: "92%", sub: "Excellent records", icon: Calendar, color: "from-emerald-500 to-teal-400 text-emerald-450" },
                { title: "Workout Completed", val: "18 Sessions", sub: "Month activity logs", icon: Dumbbell, color: "from-purple-600 to-pink-500 text-purple-400" },
                { title: "Membership Period", val: "Active Plan", sub: "25 Days Remaining", icon: CreditCard, color: "from-amber-500 to-orange-400 text-amber-500" }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-[#111827] border border-[#1e293b]/40 rounded-3xl p-5 hover:border-zinc-800 transition duration-200 shadow-lg relative flex flex-col justify-between overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">{card.title}</span>
                      <div className="w-8 h-8 bg-zinc-950/60 rounded-xl flex items-center justify-center border border-zinc-850 shrink-0 text-slate-400">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <h4 className="text-lg sm:text-xl font-black text-white">{card.val}</h4>
                      <span className="text-[9.5px] font-bold text-slate-400 mt-1 block leading-none">{card.sub}</span>
                    </div>
                    
                    {/* Glowing highlight border bottom */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                  </div>
                );
              })}
            </div>

            {/* Grid for workout list summary & Diet Summary */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 text-left">
              
              {/* Daily splits exercises */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Today's Workout Splitting</h3>
                    <span className="text-[10px] text-cyan-400 font-bold">Chest + Triceps</span>
                  </div>

                  <div className="space-y-2">
                    {[
                      { name: "Bench Press", sets: 4, reps: 12, target: "Heavy load bar", key: "ex1" },
                      { name: "Incline Dumbbell Press", sets: 3, reps: 10, target: "Medium load DB", key: "ex2" },
                      { name: "Cable Fly", sets: 3, reps: 15, target: "Isolation squeeze", key: "ex3" },
                      { name: "Tricep Pushdown", sets: 3, reps: 12, target: "V-bar extension", key: "ex4" }
                    ].map((ex) => (
                      <div 
                        key={ex.key} 
                        onClick={() => toggleExercise(ex.key)}
                        className="p-3 bg-zinc-950/30 hover:bg-zinc-950/60 border border-zinc-900 rounded-2xl flex items-center justify-between transition duration-150 cursor-pointer"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-5 h-5 rounded-lg border flex items-center justify-center transition-colors shrink-0 ${
                            exerciseCompletions[ex.key]
                              ? "bg-cyan-500 border-cyan-600 text-white"
                              : "border-zinc-800 text-transparent"
                          }`}>
                            <Check className="w-3 h-3" />
                          </div>
                          <div>
                            <span className="font-extrabold text-white text-xs">{ex.name}</span>
                            <span className="text-[9.5px] text-slate-500 block font-medium mt-0.5">{ex.target}</span>
                          </div>
                        </div>
                        <span className="text-xs font-bold text-slate-400">{ex.sets} Sets × {ex.reps} Reps</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6">
                  <button 
                    onClick={handleStartWorkout}
                    disabled={workoutCompleted}
                    className="w-full py-3 bg-[#1e293b] hover:bg-[#2d3a52] text-white border border-[#1e293b] rounded-2xl text-xs font-black uppercase tracking-wider cursor-pointer transition text-center"
                  >
                    {workoutCompleted ? "All Sets Cleared" : workoutStarted ? "Start Next Exercise Set" : "Start Workout"}
                  </button>
                </div>
              </div>

              {/* Nutrition trackers */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Diet & Nutrition Intake</h3>
                    <span className="text-[10px] text-emerald-400 font-extrabold">Score: 88%</span>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center mb-5">
                    <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">Calories</span>
                      <span className="font-black text-white text-xs mt-0.5 block">2,400 kcal</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">Protein</span>
                      <span className="font-black text-emerald-450 text-xs mt-0.5 block">120g</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">Carbs</span>
                      <span className="font-black text-amber-500 text-xs mt-0.5 block">250g</span>
                    </div>
                    <div className="p-2.5 bg-zinc-950/40 rounded-xl border border-zinc-900">
                      <span className="text-[8px] text-slate-500 font-bold block uppercase">Hydration</span>
                      <span className="font-black text-blue-400 text-xs mt-0.5 block">{waterCount}L / 3L</span>
                    </div>
                  </div>

                  <div className="space-y-2 text-xs">
                    {[
                      { meal: "Breakfast", items: "Eggs, Oats porridge with banana, whey scoop" },
                      { meal: "Lunch", items: "Brown Rice, Protein (Grilled Chicken/Paneer), Mixed Green Salad" },
                      { meal: "Dinner", items: "Sautéed Broccoli, Salmon fillet / Tofu steaks, sweet potato mash" }
                    ].map((m, idx) => (
                      <div key={idx} className="p-3 bg-zinc-950/30 border border-zinc-900 rounded-2xl">
                        <span className="text-[10px] font-extrabold text-slate-400 block mb-0.5">{m.meal}</span>
                        <p className="text-slate-205 leading-snug">{m.items}</p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hydration quick update counter */}
                <div className="mt-5 pt-4 border-t border-[#1e293b]/40 flex items-center justify-between">
                  <span className="text-[11px] text-slate-450 font-bold flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-blue-400 animate-pulse" /> Hydrated target counter
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setWaterCount(prev => Math.max(prev - 0.5, 0))}
                      className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded text-slate-400 text-xs font-bold cursor-pointer"
                    >
                      -0.5L
                    </button>
                    <span className="text-xs font-black text-white">{waterCount}L</span>
                    <button 
                      onClick={() => {
                        setWaterCount(prev => Math.min(prev + 0.5, 6));
                        toast.success("Hydration log tracked successfully.");
                      }}
                      className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-bold cursor-pointer"
                    >
                      +0.5L
                    </button>
                  </div>
                </div>
              </div>

            </div>

            {/* Achievements, Trainer feedback and Membership summary grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Badges preview */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Achievements Badges</h3>
                    <span className="text-[10px] text-cyan-405 font-bold">4 / 5 Unlocked</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2.5 py-2">
                    {[
                      { icon: "🏆", name: "First Workout", status: true },
                      { icon: "🔥", name: "7 Day Streak", status: true },
                      { icon: "💪", name: "30 Workouts", status: true },
                      { icon: "🎯", name: "Goal Achieved", status: false },
                      { icon: "⭐", name: "Perfect Attendance", status: true }
                    ].map((badge, idx) => (
                      <div 
                        key={idx} 
                        className={`aspect-square rounded-2xl flex flex-col items-center justify-center text-xl transition duration-150 relative ${
                          badge.status 
                            ? "bg-blue-500/10 border border-blue-500/20 text-white" 
                            : "bg-zinc-950/40 border border-zinc-900 opacity-20"
                        }`}
                        title={badge.name}
                      >
                        <span>{badge.icon}</span>
                        {badge.status && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-455 border-2 border-[#111827] rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Achievements")}
                  className="w-full mt-6 py-2.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer text-center"
                >
                  View Achievement Showcase
                </button>
              </div>

              {/* Trainer Feedback */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Coach Feedback</h3>
                    <span className="text-[10px] text-purple-400 font-bold">Active Chat</span>
                  </div>

                  <div className="flex items-center gap-3 mb-4 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-900">
                    <img 
                      src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=100" 
                      alt="Rahul Sharma" 
                      className="w-10 h-10 rounded-xl object-cover border border-[#1e293b]"
                    />
                    <div>
                      <span className="font-extrabold text-white text-xs block">Rahul Sharma</span>
                      <span className="text-[9.5px] text-slate-500 block font-bold mt-0.5">Head Gym Coach</span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-350 bg-zinc-950/20 border border-zinc-900/60 p-3.5 rounded-2xl italic leading-relaxed">
                    "Increase cardio intensity and stay consistent. Keep loading the bench sets progressively."
                  </p>
                </div>

                <button
                  onClick={() => toast.success("Chat channel opened with Trainer Rahul Sharma.")}
                  className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer text-center"
                >
                  Message Trainer
                </button>
              </div>

              {/* Membership validity */}
              <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#121b2d] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left relative overflow-hidden group">
                <div className="space-y-4 relative z-10">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20">
                      BEFIT PREMIUM ⭐
                    </span>
                    <span className="text-xs font-black text-slate-400">Valid</span>
                  </div>

                  <div className="space-y-3.5 mt-5">
                    <div className="grid grid-cols-2 gap-3.5 text-xs">
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Expiration Date</span>
                        <span className="font-extrabold text-white mt-1 block">25 August 2026</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Days Remaining</span>
                        <span className="font-extrabold text-cyan-400 mt-1 block">28 Days</span>
                      </div>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setActiveTab("Payments")}
                  className="w-full mt-6 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-[#1e293b] rounded-2xl text-xs font-bold transition duration-150 cursor-pointer text-center relative z-10"
                >
                  View Payment History
                </button>
                
                {/* Flares background */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>

            </div>

          </div>
        )}

        {/* 2. WORKOUT TAB */}
        {activeTab === "My Workout" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Header info */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <h2 className="text-lg font-black text-white">Daily Workout Schedule</h2>
                <p className="text-xs text-slate-400 mt-1">Mark sets as completed during your physical fitness workouts splits.</p>
              </div>
              <div className="flex gap-3 bg-zinc-950/60 p-2 rounded-2xl border border-zinc-850 shrink-0">
                <span className="text-xs font-bold text-slate-450 block px-3 py-1">Active Routine: Chest + Triceps</span>
              </div>
            </div>

            {/* Exercise splits rows */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                Lifting Exercise Splits
              </span>
              
              <div className="space-y-3 text-xs">
                {[
                  { id: "ex1", name: "Bench Press", sets: "4 Sets", reps: "12 Reps", targetWeight: "80 kg", desc: "Warm up with bar, increase weight incrementally. Focus on barbell control.", videoUrl: "#" },
                  { id: "ex2", name: "Incline Dumbbell Press", sets: "3 Sets", reps: "10 Reps", targetWeight: "26 kg DBs", desc: "Keep elbows at 45 degrees, squeeze pectorals at top contraction point.", videoUrl: "#" },
                  { id: "ex3", name: "Cable Fly", sets: "3 Sets", reps: "15 Reps", targetWeight: "15 kg", desc: "Keep slight bend in elbows, control the negative portion of fly movement.", videoUrl: "#" },
                  { id: "ex4", name: "Tricep Pushdown", sets: "3 Sets", reps: "12 Reps", targetWeight: "25 kg", desc: "V-bar attachment. Lock elbows by side, extend arms completely down.", videoUrl: "#" }
                ].map((ex) => (
                  <div 
                    key={ex.id} 
                    onClick={() => toggleExercise(ex.id)}
                    className="p-4 bg-zinc-950/30 hover:bg-zinc-950/50 border border-zinc-900 rounded-2xl flex flex-col sm:flex-row justify-between sm:items-center gap-4 transition duration-150 cursor-pointer"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                        exerciseCompletions[ex.id] 
                          ? "bg-cyan-500 border-cyan-600 text-white" 
                          : "border-zinc-800 text-transparent"
                      }`}>
                        <Check className="w-3.5 h-3.5" />
                      </div>
                      <div className="space-y-1">
                        <span className="font-extrabold text-white text-sm">{ex.name}</span>
                        <p className="text-slate-450 leading-relaxed max-w-xl text-[11px] font-semibold">{ex.desc}</p>
                      </div>
                    </div>
                    
                    <div className="flex sm:flex-col items-center sm:items-end justify-between shrink-0 border-t sm:border-t-0 border-zinc-850/60 pt-3 sm:pt-0 gap-1">
                      <span className="text-xs font-black text-cyan-400">{ex.sets} × {ex.reps}</span>
                      <span className="text-[10px] text-slate-400 font-bold bg-[#111827] px-2.5 py-0.5 rounded border border-zinc-800 mt-1">Load: {ex.targetWeight}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 flex justify-between items-center text-xs">
                <span className="text-slate-400">Completions checklist: {Object.values(exerciseCompletions).filter(Boolean).length} / 4 splits</span>
                {workoutStarted ? (
                  <button 
                    onClick={handleCompleteWorkout}
                    className="px-6 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-extrabold rounded-xl transition cursor-pointer"
                  >
                    Submit Completed splits
                  </button>
                ) : (
                  <button 
                    onClick={handleStartWorkout}
                    disabled={workoutCompleted}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-800 text-white font-extrabold rounded-xl transition cursor-pointer disabled:cursor-not-allowed"
                  >
                    {workoutCompleted ? "Completed" : "Start Split Timer"}
                  </button>
                )}
              </div>
            </div>

          </div>
        )}

        {/* 3. DIET TAB */}
        {activeTab === "My Diet" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Calories indicators */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                { label: "Target Calories", val: "2,400 kcal", desc: "Energy expenditure limit", icon: Zap, color: "text-amber-500 bg-amber-500/5" },
                { label: "Total Protein", val: "120 g", desc: "Muscle rebuild blocks", icon: Heart, color: "text-emerald-505 bg-emerald-500/5" },
                { label: "Total Carbs", val: "250 g", desc: "Glycogen energy fuels", icon: Activity, color: "text-cyan-455 bg-cyan-500/5" },
                { label: "Diet Compliance", val: "88%", desc: "Nutritional profile compliance", icon: Award, color: "text-purple-500 bg-purple-500/5" }
              ].map((card, idx) => {
                const Icon = card.icon;
                return (
                  <div key={idx} className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg flex flex-col justify-between">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">{card.label}</span>
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${card.color} shrink-0`}>
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <h4 className="text-lg sm:text-xl font-black text-white">{card.val}</h4>
                      <p className="text-[9px] text-slate-400 mt-1 block font-semibold leading-normal">{card.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Diet distribution sheets */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                Nutritional Plan Details
              </span>
              
              <div className="divide-y divide-[#1e293b]/35 space-y-4">
                {[
                  { meal: "Breakfast (08:00 AM)", items: "4 Boiled Eggs (2 whole, 2 whites), 60g Rolled Oats with warm almond milk, 1 medium banana, 1 scoop Whey Protein isolate.", kcal: "650 kcal", macros: "P: 42g | C: 65g | F: 12g" },
                  { meal: "Lunch (01:30 PM)", items: "150g Grilled Chicken Breast fillets, 80g Steamed Brown Rice, 1 bowl raw baby spinach & cucumber salad with lemon squeeze.", kcal: "580 kcal", macros: "P: 45g | C: 55g | F: 8g" },
                  { meal: "Pre-Workout Snack (05:00 PM)", items: "1 slice Whole Wheat Toast with 1 tbsp unsweetened peanut butter, 1 small apple.", kcal: "280 kcal", macros: "P: 8g | C: 35g | F: 10g" },
                  { meal: "Dinner (08:30 PM)", items: "120g pan-seared Salmon fillet or Grilled Organic Tofu block, 150g mashed sweet potatoes, steamed asparagus tips with garlic.", kcal: "610 kcal", macros: "P: 35g | C: 60g | F: 16g" },
                  { meal: "Before Bed (10:00 PM)", items: "150g low-fat Greek Yogurt, handful of mixed raw almonds.", kcal: "180 kcal", macros: "P: 15g | C: 8g | F: 10g" }
                ].map((m, i) => (
                  <div key={i} className={`pt-4 ${i === 0 ? "pt-0" : ""} flex flex-col sm:flex-row justify-between sm:items-start gap-3.5 text-xs`}>
                    <div className="space-y-1">
                      <span className="font-extrabold text-white text-sm block leading-none">{m.meal}</span>
                      <p className="text-slate-205 leading-relaxed font-semibold max-w-xl mt-1.5">{m.items}</p>
                    </div>
                    <div className="text-right shrink-0 border-t sm:border-t-0 border-zinc-850 pt-2.5 sm:pt-0">
                      <span className="font-black text-white block">{m.kcal}</span>
                      <span className="text-[10px] text-cyan-400 block mt-0.5">{m.macros}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

        {/* 4. ATTENDANCE TAB */}
        {activeTab === "Attendance" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Heatmap calendar */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Attendance Calendar Heatmap</h3>
                <p className="text-[10px] text-slate-400 mt-1">Overview grid of checked in sessions for July 2026</p>
              </div>

              {/* Heatmap Grid */}
              <div className="py-4 text-xs">
                {/* Weekdays names */}
                <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-black text-slate-500 uppercase mb-3">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                
                {/* 31 days with offset 3 (starts on Wed) */}
                <div className="grid grid-cols-7 gap-2.5">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-square bg-transparent" />
                  ))}
                  {attendanceHeatmap.map((item) => {
                    let cellBg = "bg-zinc-950/45 border-zinc-900 text-slate-500";
                    let label = "Holiday";
                    if (item.status === 1) {
                      cellBg = "bg-emerald-500/10 border-emerald-500/35 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5";
                      label = "Present";
                    }
                    if (item.status === 2) {
                      cellBg = "bg-rose-500/10 border-rose-500/35 text-rose-500 font-extrabold shadow-sm shadow-rose-500/5";
                      label = "Absent";
                    }

                    return (
                      <div
                        key={item.day}
                        onMouseEnter={() => setHoveredDate({ day: item.day, label })}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`aspect-square border rounded-2xl flex flex-col items-center justify-center text-xs relative transition duration-150 hover:scale-105 select-none ${cellBg}`}
                      >
                        <span>{item.day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Date Hover Label overlay */}
                {hoveredDate && (
                  <div className="mt-4 p-2.5 bg-zinc-900 border border-zinc-800 text-slate-205 rounded-xl text-center font-bold text-[10.5px] animate-in fade-in duration-100">
                    22 July 2026 — Day {hoveredDate.day} status: <strong className="text-white">{hoveredDate.label}</strong>
                  </div>
                )}

                {/* Legend panel */}
                <div className="flex gap-4 justify-center items-center mt-6 pt-4 border-t border-zinc-850/60 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" /><span className="text-slate-400">Present</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30" /><span className="text-slate-400">Absent</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-zinc-950/45 border border-zinc-900" /><span className="text-slate-400">Holiday</span></div>
                </div>
              </div>
            </div>

            {/* Counters cards row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Present Days</span>
                <span className="text-lg font-black text-emerald-450 mt-1 block">23 Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Absent Days</span>
                <span className="text-lg font-black text-rose-500 mt-1 block">2 Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Tracked</span>
                <span className="text-lg font-black text-blue-400 mt-1 block">25 Days</span>
              </div>
            </div>

          </div>
        )}

        {/* 5. PROGRESS TAB */}
        {activeTab === "Progress" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* SVG Weight Progression Line graph */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Weight Progression Trend</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Tracking body weight parameters against goal weight targets</p>
              </div>

              {/* Custom SVG Line Chart */}
              {(() => {
                const points = weightProgressList.map(item => item.weight);
                const maxVal = 76;
                const minVal = 64;
                const valRange = maxVal - minVal;

                // Canvas coordinates
                const chartW = 500;
                const chartH = 140;
                const paddingX = 40;
                const paddingY = 20;
                const plotW = chartW - paddingX * 2;
                const plotH = chartH - paddingY * 2;

                const mapX = (index) => paddingX + (index / (points.length - 1)) * plotW;
                const mapY = (val) => chartH - paddingY - ((val - minVal) / valRange) * plotH;

                let pathD = "";
                points.forEach((val, i) => {
                  const px = mapX(i);
                  const py = mapY(val);
                  if (i === 0) pathD = `M ${px} ${py}`;
                  else pathD += ` L ${px} ${py}`;
                });

                // Target weight horizontal helper line (65kg)
                const targetY = mapY(65);

                return (
                  <div className="relative pt-2">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                      {/* Gridline guidelines */}
                      <line x1={paddingX} y1={mapY(75)} x2={chartW - paddingX} y2={mapY(75)} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1={paddingX} y1={mapY(70)} x2={chartW - paddingX} y2={mapY(70)} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

                      {/* Target line (Dotted Rose) */}
                      <line x1={paddingX} y1={targetY} x2={chartW - paddingX} y2={targetY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x={chartW - paddingX - 60} y={targetY - 5} fill="#f43f5e" fontSize="7" fontWeight="bold">Target Limit: 65kg</text>

                      {/* Weight progress path line */}
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Plot Nodes dots */}
                      {weightProgressList.map((item, i) => {
                        const px = mapX(i);
                        const py = mapY(item.weight);
                        return (
                          <g key={i} className="cursor-pointer">
                            <circle cx={px} cy={py} r="4" fill="#2563eb" stroke="#0b101c" strokeWidth="1.5" />
                            <text x={px} y={py - 8} fill="#ffffff" fontSize="7" fontWeight="bold" textAnchor="middle">{item.weight}kg</text>
                          </g>
                        );
                      })}

                      {/* Date Axis labels */}
                      {weightProgressList.map((item, i) => {
                        const px = mapX(i);
                        const py = chartH - 4;
                        return (
                          <text key={i} x={px} y={py} fill="#6b7280" fontSize="7.5" fontWeight="bold" textAnchor="middle">{item.date}</text>
                        );
                      })}
                    </svg>
                  </div>
                );
              })()}
            </div>

            {/* Calculations layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* BMI Card */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  BMI Calculator Index
                </span>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">BMI VALUE</span>
                    <span className="text-xl font-black text-white mt-1 block">22.8</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Normal Weight
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2 pt-2 border-t border-zinc-850/60">
                  Your BMI index is within normal health parameters. Keep maintain weight delta split.
                </p>
              </div>

              {/* Goals statistics progress */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  Goal Completion Progress
                </span>
                <div className="flex items-center gap-4 text-xs">
                  {/* Progress Ring */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeDasharray="75 100" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-white">75%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">REDUCED WEIGHT</span>
                    <span className="font-extrabold text-white block text-sm mt-0.5">5.0 kg Lost</span>
                    <span className="text-[9px] text-slate-500 block">5.0 kg remaining to target</span>
                  </div>
                </div>
              </div>

              {/* Dimensions logs summary */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  Athlete Starting Stats
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Starting Weight</span>
                    <strong className="text-slate-350 block mt-1">75.0 kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Current Weight</span>
                    <strong className="text-slate-350 block mt-1">70.0 kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Fitness Goal Weight</span>
                    <strong className="text-cyan-400 block mt-1">65.0 kg</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 6. PAYMENTS TAB */}
        {activeTab === "Payments" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Membership Header */}
            <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/25 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-wide">
                  Active BEFIT PREMIUM Membership ⭐
                </span>
                <h2 className="text-lg font-black text-white mt-3.5">BeFit Gym Subscription Billed Status</h2>
                <div className="flex gap-4 mt-2 text-xs text-slate-400 font-semibold">
                  <div>Billed Rates: <strong className="text-white">₹3,500 / month</strong></div>
                  <div>Expiration: <strong className="text-white">25 August 2026</strong></div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 shrink-0 text-center">
                <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Days Remaining</span>
                <span className="text-xl font-black text-cyan-400 block mt-1">28 Days</span>
              </div>
            </div>

            {/* Invoices ledger */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                Payment History Ledgers
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b]/35 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Billed Date</th>
                      <th className="py-2.5 px-4">Billed Plan</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/20 text-slate-350">
                    {invoiceList.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-950/20 transition duration-150">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{item.number}</td>
                        <td className="py-3.5 px-4 text-slate-405 font-medium">{formatDateFriendly(item.date)}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">{item.plan}</td>
                        <td className="py-3.5 px-4 font-black text-white">₹{item.amount.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-450">{item.method}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedInvoice(item);
                              toast.success("Receipt invoice downloaded.");
                            }}
                            className="p-1.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition cursor-pointer"
                            title="Download invoice summary text"
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

        {/* 7. ACHIEVEMENTS TAB */}
        {activeTab === "Achievements" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Gamification title */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-black text-white">Personal Achievements Showcase</h2>
              <p className="text-xs text-slate-400 mt-1">Unlock gamification milestone badges by logging daily training sessions consistent splits.</p>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { icon: "🏆", name: "First Workout", status: true, desc: "Successfully completed your first gym workout splits.", reward: "100 XP" },
                { icon: "🔥", name: "7 Day Streak", status: true, desc: "Completed gym sessions for 7 consecutive days.", reward: "250 XP" },
                { icon: "💪", name: "30 Workouts Completed", status: true, desc: "Logged 30 physical training checkins.", reward: "500 XP" },
                { icon: "🎯", name: "Goal Completed", status: false, desc: "Reached target bodyweight reduction goals.", reward: "1000 XP" },
                { icon: "⭐", name: "Perfect Attendance", status: true, desc: "Maintained 90%+ attendance checklist rate.", reward: "300 XP" }
              ].map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-3xl p-5 hover:-translate-y-1 transition duration-200 shadow-lg relative overflow-hidden flex flex-col justify-between h-44 group ${
                    badge.status 
                      ? "bg-gradient-to-br from-[#111827] via-[#0f1524] to-[#121c2d] border-blue-500/25 text-white" 
                      : "bg-[#111827]/40 border-[#1e293b]/35 opacity-25"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        badge.status ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-slate-500"
                      }`}>
                        {badge.status ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{badge.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[200px]">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-850/60 pt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Reward points</span>
                    <strong className="text-cyan-400">{badge.reward}</strong>
                  </div>
                  
                  {/* Glowing background light */}
                  {badge.status && (
                    <div className="absolute -bottom-8 -right-8 w-18 h-18 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

      </main>

    </div>
  );
};

export default ClientDashboard;
