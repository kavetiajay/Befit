import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Dumbbell,
  Apple,
  Scale,
  CreditCard,
  BarChart3,
  Bell,
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Search,
  ChevronDown,
  Plus,
  Sun,
  Moon,
  TrendingUp,
  History,
  User,
  ArrowLeft
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";

const DashboardLayout = ({ children }) => {
  const { theme, toggleTheme, notifications, markNotificationAsRead, clients, settings } = useCRM();
  const location = useLocation();
  const navigate = useNavigate();
  
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  useEffect(() => {
    if (location.pathname === "/") {
      const savedRole = localStorage.getItem("gym_role") || "trainer";
      if (savedRole === "client") {
        navigate("/client/dashboard");
      } else {
        localStorage.setItem("gym_role", "trainer");
      }
    } else {
      localStorage.setItem("gym_role", "trainer");
    }
  }, [location.pathname, navigate]);

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
  
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const menuItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Clients", path: "/clients", icon: Users },
    { name: "Attendance", path: "/attendance", icon: CalendarCheck },
    { name: "Measurements", path: "/measurements", icon: Scale },
    { name: "Payments", path: "/payments", icon: CreditCard },
    { name: "Reports", path: "/reports", icon: BarChart3 },
    { name: "Notifications", path: "/notifications", icon: Bell, badge: true },
    { name: "Settings", path: "/settings", icon: SettingsIcon },
  ];

  const unreadNotifications = notifications.filter((n) => !n.read);

  // Filter clients based on search query for top navigation quick search
  const searchedClients = searchQuery
    ? clients.filter((c) => c.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];
 
  const handleSearchSelect = (clientId) => {
    setSearchQuery("");
    setShowSearchDropdown(false);
    navigate(`/clients/${clientId}`);
  };

  const handleLogout = () => {
    localStorage.removeItem("gym_role");
    toast.success("Successfully logged out");
    navigate("/login");
  };

  const handleQuickAction = (path) => {
    setShowQuickActions(false);
    navigate(path);
  };

  const bottomItems = [
    { name: "Dashboard", path: "/", icon: LayoutDashboard },
    { name: "Clients", path: "/clients", icon: Users },
    { name: "Attendance", path: "/attendance", icon: CalendarCheck },
    { name: "Payments", path: "/payments", icon: CreditCard },
    { name: "Profile", path: "/settings", icon: User }
  ];

  const renderMobileHeader = () => {
    const isDashboard = location.pathname === "/";
    const isClients = location.pathname === "/clients";
    const isAttendance = location.pathname === "/attendance";
    const isPayments = location.pathname === "/payments";
    const isSettings = location.pathname === "/settings";

    if (!isDashboard && !isClients && !isAttendance && !isPayments && !isSettings) {
      let title = "Back";
      if (location.pathname.startsWith("/clients/")) {
        title = "Client Profile";
        if (location.pathname === "/clients/add") {
          title = "Add Client";
        }
      } else if (location.pathname === "/workouts") {
        title = "Workout Planner";
      } else if (location.pathname === "/diet") {
        title = "Diet Planner";
      } else if (location.pathname === "/measurements") {
        title = "Measurements";
      } else if (location.pathname === "/reports") {
        title = "Reports";
      } else if (location.pathname === "/notifications") {
        title = "Notifications";
      }

      return (
        <div className="flex items-center gap-3 mb-5 lg:hidden no-print">
          <button
            onClick={() => navigate(-1)}
            className="w-9 h-9 rounded-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 flex items-center justify-center shadow-sm cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-slate-600 dark:text-zinc-400" />
          </button>
          <div>
            <h1 className="text-lg font-bold font-display text-slate-800 dark:text-zinc-50 leading-none">
              {title}
            </h1>
          </div>
        </div>
      );
    }

    let title = "";
    let subtitle = "";
    if (isDashboard) {
      title = `Coach ${settings.trainerName.split(" ")[1] || "Marcus"}`;
      subtitle = "Good Morning,";
    } else if (isClients) {
      title = "Clients";
      subtitle = `${clients.length} members`;
    } else if (isAttendance) {
      title = "Attendance";
      subtitle = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" });
    } else if (isPayments) {
      title = "Payments";
      subtitle = "Revenue & Invoices";
    } else if (isSettings) {
      title = settings.trainerName;
      subtitle = "Gym Admin Portal";
    }

    return (
      <div className="flex items-center justify-between mb-6 lg:hidden no-print">
        <div>
          {isDashboard ? (
            <>
              <p className="text-[11px] font-bold text-slate-400 dark:text-zinc-500 uppercase tracking-wider">{subtitle}</p>
              <h1 className="text-2xl font-black font-display text-slate-900 dark:text-zinc-50 flex items-center gap-1.5 mt-0.5">
                {title} <span className="animate-bounce inline-block">👋</span>
              </h1>
            </>
          ) : (
            <>
              <h1 className="text-2xl font-black font-display text-slate-900 dark:text-zinc-50 leading-none">{title}</h1>
              <p className="text-[11px] text-slate-400 dark:text-zinc-500 font-bold mt-1.5">{subtitle}</p>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          {/* Theme Toggle Button */}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 cursor-pointer"
            title="Toggle Theme"
          >
            {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
          </button>

          {/* Notifications Bell */}
          <Link
            to="/notifications"
            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-zinc-800 flex items-center justify-center text-slate-600 dark:text-zinc-400 relative"
          >
            <Bell className="w-4.5 h-4.5" />
            {unreadNotifications.length > 0 && (
              <span className="absolute top-2.5 right-2.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
            )}
          </Link>

          {/* Trainer Avatar mobile dropdown trigger */}
          <div className="relative">
            <button
              onClick={() => setShowRoleDropdown(!showRoleDropdown)}
              className="block shrink-0 cursor-pointer"
            >
              <img
                src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
                alt="Trainer Avatar"
                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-800 shadow-sm"
              />
            </button>
            {showRoleDropdown && (
              <div className="absolute top-11 right-0 w-48 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2 divide-y divide-slate-100 dark:divide-zinc-800/40 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                <div className="px-3 py-1.5">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Role</span>
                  <span className="text-xs font-black text-slate-805 dark:text-zinc-100 block mt-0.5">Trainer Portal</span>
                </div>
                <div className="py-1">
                  <button
                    onClick={() => handleSwitchRole("trainer")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 text-blue-605 rounded-xl transition text-left"
                  >
                    <span>👨‍🏫</span>
                    <span>Switch to Trainer</span>
                  </button>
                  <button
                    onClick={() => handleSwitchRole("client")}
                    className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-350 rounded-xl transition text-left mt-0.5"
                  >
                    <span>👤</span>
                    <span>Switch to Client</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex transition-colors duration-300">
      {/* --- DESKTOP SIDEBAR (Sticky) --- */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 sticky top-0 h-screen z-20">
        {/* Gym Brand Header */}
        <div className="h-16 px-6 border-b border-slate-100 dark:border-zinc-800 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Dumbbell className="w-5 h-5" />
          </div>
          <div>
            <h1 className="font-semibold text-slate-800 dark:text-zinc-100 text-sm tracking-tight leading-none">
              {settings.gymName || "Apex Gym CRM"}
            </h1>
            <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
              Trainer Portal
            </span>
          </div>
        </div>

        {/* Menu Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="w-4 h-4" />
                  <span>{item.name}</span>
                </div>
                {item.badge && unreadNotifications.length > 0 && (
                  <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-full">
                    {unreadNotifications.length}
                  </span>
                )}
              </Link>
            );
          })}
          <div className="border-t border-slate-100 dark:border-zinc-800 my-2 pt-2" />
          <Link
            to="/client/dashboard"
            onClick={() => {
              localStorage.setItem("gym_role", "client");
              toast.success("Switched to Client View Portal 👤");
            }}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-extrabold text-blue-600 dark:text-blue-405 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
          >
            <User className="w-4 h-4" />
            <span>Client View Portal</span>
          </Link>
        </nav>

        {/* User / Trainer Footer Profile */}
        <div className="p-4 border-t border-slate-100 dark:border-zinc-800">
          <div className="flex items-center gap-3 mb-3">
            <img
              src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
              alt="Trainer Avatar"
              className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-zinc-800"
            />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">
                {settings.trainerName}
              </p>
              <p className="text-[10px] text-slate-400 dark:text-zinc-500 truncate">
                {settings.trainerEmail}
              </p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-slate-200 dark:border-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-lg transition-all"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MOBILE/TABLET DRAWER SIDEBAR --- */}
      {mobileSidebarOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setMobileSidebarOpen(false)}
          />
          <div className="relative flex flex-col w-64 max-w-xs bg-white dark:bg-zinc-900 border-r border-slate-100 dark:border-zinc-800 p-5 h-full animate-in slide-in-from-left duration-300">
            <button
              onClick={() => setMobileSidebarOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-md text-slate-400 hover:bg-slate-100 dark:hover:bg-zinc-800"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-3 mb-6 mt-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white">
                <Dumbbell className="w-4 h-4" />
              </div>
              <span className="font-semibold text-slate-800 dark:text-zinc-100 text-sm">
                {settings.gymName}
              </span>
            </div>
            <nav className="flex-1 space-y-1">
              {menuItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    onClick={() => setMobileSidebarOpen(false)}
                    className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isActive
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                        : "text-slate-600 dark:text-zinc-400 hover:bg-slate-100 dark:hover:bg-zinc-800/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </div>
                    {item.badge && unreadNotifications.length > 0 && (
                      <span className="px-2 py-0.5 text-[10px] font-semibold bg-red-500 text-white rounded-full">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </Link>
                );
              })}
              <div className="border-t border-slate-100 dark:border-zinc-800 my-2 pt-2" />
              <Link
                to="/client/dashboard"
                onClick={() => {
                  setMobileSidebarOpen(false);
                  localStorage.setItem("gym_role", "client");
                  toast.success("Switched to Client View Portal 👤");
                }}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-extrabold text-blue-600 dark:text-blue-405 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all duration-200"
              >
                <User className="w-4 h-4" />
                <span>Client View Portal</span>
              </Link>
            </nav>
            <div className="pt-4 border-t border-slate-100 dark:border-zinc-800 mt-auto">
              <div className="flex items-center gap-3 mb-3">
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
                  alt="Trainer Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-zinc-800"
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-slate-700 dark:text-zinc-200 truncate">
                    {settings.trainerName}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-medium text-red-600 dark:text-red-400 border border-slate-200 dark:border-zinc-800 hover:bg-red-50 rounded-lg"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- MAIN PAGE WORKSPACE --- */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* --- STICKY TOP NAVIGATION BAR --- */}
        <header className="hidden lg:flex h-16 border-b border-slate-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/80 backdrop-blur-md sticky top-0 z-30 px-4 lg:px-6 items-center justify-between gap-4 no-print">
          {/* Quick Search */}
          <div className="relative flex-1 max-w-md hidden sm:block">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </div>
            <input
              type="text"
              placeholder="Search clients by name..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchDropdown(true);
              }}
              onFocus={() => setShowSearchDropdown(true)}
              className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 dark:bg-zinc-950 border border-slate-200 dark:border-zinc-800 rounded-lg text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
            />
            {showSearchDropdown && searchQuery && (
              <div className="absolute top-11 left-0 right-0 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-2">
                <div className="text-[10px] font-semibold text-slate-400 px-3 py-1 bg-slate-50 dark:bg-zinc-950/40 rounded-md mb-1">
                  CLIENT SEARCH RESULTS
                </div>
                {searchedClients.length > 0 ? (
                  searchedClients.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => handleSearchSelect(c.id)}
                      className="w-full flex items-center gap-3 px-3 py-2 hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-left transition"
                    >
                      <img src={c.photo} alt={c.name} className="w-8 h-8 rounded-full object-cover" />
                      <div>
                        <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200">{c.name}</div>
                        <div className="text-[10px] text-slate-400">{c.goal} • {c.membership}</div>
                      </div>
                    </button>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 text-center py-4">No matching clients found</div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 lg:gap-3">
            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition cursor-pointer"
              title="Toggle Theme"
            >
              {theme === "light" ? <Moon className="w-4.5 h-4.5" /> : <Sun className="w-4.5 h-4.5" />}
            </button>

            {/* Profile Avatar Role Switcher Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="flex items-center gap-2.5 p-1 px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 transition cursor-pointer text-left"
              >
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
                  alt="Trainer Avatar"
                  className="w-6.5 h-6.5 rounded-lg object-cover border border-slate-200 dark:border-zinc-800"
                />
                <span className="hidden sm:inline-block text-[10px] font-black text-slate-550 dark:text-zinc-450 uppercase tracking-wider">
                  👨‍🏫 Trainer Mode
                </span>
              </button>

              {showRoleDropdown && (
                <div className="absolute top-11 right-0 w-52 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border border-slate-200/80 dark:border-zinc-800 rounded-2xl shadow-xl z-50 p-2 divide-y divide-slate-100 dark:divide-zinc-800/40 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  <div className="px-3 py-2">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Current Role</span>
                    <span className="text-xs font-black text-slate-805 dark:text-zinc-100 block mt-0.5">Trainer Portal</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleSwitchRole("trainer")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-slate-50 dark:bg-zinc-800/40 text-blue-605 rounded-xl transition text-left"
                    >
                      <span className="text-sm">👨‍🏫</span>
                      <span>Switch to Trainer</span>
                    </button>
                    <button
                      onClick={() => handleSwitchRole("client")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-slate-50 dark:hover:bg-zinc-850 text-slate-650 dark:text-zinc-300 rounded-xl transition text-left mt-0.5"
                    >
                      <span className="text-sm">👤</span>
                      <span>Switch to Client</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Notifications Alert Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="p-2 rounded-lg border border-slate-200 dark:border-zinc-800 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-600 dark:text-zinc-400 transition relative cursor-pointer"
              >
                <Bell className="w-4.5 h-4.5" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white dark:ring-zinc-900" />
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-11 right-0 w-80 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-2 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-100 dark:border-zinc-800">
                    <span className="text-xs font-bold text-slate-700 dark:text-zinc-200">Notifications</span>
                    <button
                      onClick={() => navigate("/notifications")}
                      className="text-[10px] text-blue-600 hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="divide-y divide-slate-100 dark:divide-zinc-800/40 max-h-64 overflow-y-auto">
                    {unreadNotifications.length > 0 ? (
                      unreadNotifications.slice(0, 4).map((n) => (
                        <div
                          key={n.id}
                          onClick={() => {
                            markNotificationAsRead(n.id);
                            setShowNotifications(false);
                            if (n.clientId) navigate(`/clients/${n.clientId}`);
                          }}
                          className="p-3 hover:bg-slate-50 dark:hover:bg-zinc-800/40 cursor-pointer transition text-left"
                        >
                          <div className="text-xs font-semibold text-slate-700 dark:text-zinc-200 flex justify-between">
                            <span>{n.title}</span>
                            <span className="text-[9px] text-slate-400">{n.date}</span>
                          </div>
                          <p className="text-[10px] text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="text-xs text-slate-400 text-center py-6">No unread notifications</div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Actions Action Dropdown */}
            <div className="relative">
              <button
                onClick={() => setShowQuickActions(!showQuickActions)}
                className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/10 transition cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">Quick Action</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>

              {showQuickActions && (
                <div className="absolute top-11 right-0 w-48 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl shadow-xl z-50 p-1 divide-y divide-slate-100 dark:divide-zinc-800/40 animate-in fade-in slide-in-from-top-2 duration-200">
                  <div className="py-1">
                    <button
                      onClick={() => handleQuickAction("/clients/add")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-slate-700 dark:text-zinc-200 transition text-left"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Client</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("/attendance")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-slate-700 dark:text-zinc-200 transition text-left"
                    >
                      <CalendarCheck className="w-3.5 h-3.5" />
                      <span>Mark Attendance</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleQuickAction("/workouts")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-slate-700 dark:text-zinc-200 transition text-left"
                    >
                      <Dumbbell className="w-3.5 h-3.5" />
                      <span>Create Workout Plan</span>
                    </button>
                    <button
                      onClick={() => handleQuickAction("/diet")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-slate-700 dark:text-zinc-200 transition text-left"
                    >
                      <Apple className="w-3.5 h-3.5" />
                      <span>Create Diet Plan</span>
                    </button>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleQuickAction("/payments")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs hover:bg-slate-50 dark:hover:bg-zinc-800/50 rounded-lg text-slate-700 dark:text-zinc-200 transition text-left"
                    >
                      <CreditCard className="w-3.5 h-3.5" />
                      <span>Record Payment</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* --- MAIN PAGE CONTENT --- */}
        <main className="flex-1 p-4 lg:p-6 overflow-y-auto pb-20 lg:pb-6">
          {renderMobileHeader()}
          {children}
        </main>

        {/* --- MOBILE BOTTOM TAB NAVIGATION BAR --- */}
        <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-white/95 dark:bg-zinc-900/95 backdrop-blur-md border-t border-slate-200 dark:border-zinc-800 flex items-center justify-around z-40 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] no-print">
          {bottomItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 py-1 transition-all ${
                  isActive
                    ? "text-blue-600 dark:text-blue-400"
                    : "text-slate-400 dark:text-zinc-500 hover:text-slate-600 dark:hover:text-zinc-300"
                }`}
              >
                <div className={`p-1 px-3 rounded-2xl flex flex-col items-center transition ${isActive ? "text-blue-600 dark:text-blue-400" : ""}`}>
                  <Icon className="w-5.5 h-5.5" />
                  <span className="text-[9px] font-bold mt-1 tracking-tight">{item.name}</span>
                </div>
              </Link>
            );
          })}
        </nav>
      </div>
    </div>
  );
};

export default DashboardLayout;
