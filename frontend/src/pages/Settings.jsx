import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import {
  User,
  Building,
  CreditCard,
  Bell,
  Lock,
  Plus,
  Trash2,
  CheckCircle,
  HelpCircle,
  Clock,
  Shield,
  Download,
  Upload,
  UserCheck,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";

const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  try {
    const options = { year: "numeric", month: "short", day: "numeric" };
    return new Date(dateStr).toLocaleDateString("en-IN", options);
  } catch (e) {
    return dateStr;
  }
};

const Settings = () => {
  const { clients, workouts, diets, attendance, payments, measurements, notifications, settings, updateGymSettings, restoreDatabase } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState("profile");

  // Fallbacks for default values if not defined in stale settings
  const initialTrainers = [
    { id: "trainer_1", name: "Coach Marcus", email: "marcus@gymcrm.com", phone: "+91 99999 88888", role: "Head Trainer", speciality: "Strength & Conditioning", joinDate: "2024-01-15", status: "Active" },
    { id: "trainer_2", name: "Rohan Das", email: "rohan@gymcrm.com", phone: "+91 98888 77777", role: "Nutrition Coach", speciality: "Dietetics & Fat Loss", joinDate: "2025-03-10", status: "Active" },
    { id: "trainer_3", name: "Ananya Iyer", email: "ananya@gymcrm.com", phone: "+91 97777 66666", role: "Yoga Trainer", speciality: "Mindfulness & Flexibility", joinDate: "2025-06-01", status: "Active" }
  ];

  const trainersList = settings.trainers || initialTrainers;

  // 1. Trainer Profile states
  const [profileInput, setProfileInput] = useState({
    trainerName: settings.trainerName || "Coach Marcus",
    trainerEmail: settings.trainerEmail || "marcus@gymcrm.com",
    trainerPhone: settings.trainerPhone || "+91 99999 88888",
    trainerSpeciality: settings.trainerSpeciality || "Strength & Conditioning",
    trainerBio: settings.trainerBio || "Over 10 years of personal training experience helping athletes reach their absolute peak performance.",
    trainerPhoto: settings.trainerPhoto || "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=150"
  });

  // 2. Gym Details states
  const [gymInput, setGymInput] = useState({
    gymName: settings.gymName || "Apex Strength India",
    gymAddress: settings.gymAddress || "Connaught Place, New Delhi, Delhi 110001",
    gymCurrency: settings.gymCurrency || "₹",
    gymLogo: settings.gymLogo || "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&q=80&w=100",
    businessHoursWeekdays: settings.businessHours?.weekdays || "06:00 AM - 10:00 PM",
    businessHoursWeekends: settings.businessHours?.weekends || "08:00 AM - 04:00 PM"
  });

  // 3. Plan Editor states
  const [plans, setPlans] = useState(settings.membershipPlans || []);
  const [newPlan, setNewPlan] = useState({ name: "", fee: "", duration: "" });

  // 4. Trainer CRUD states
  const [newTrainer, setNewTrainer] = useState({
    name: "",
    email: "",
    phone: "",
    role: "Nutrition Coach",
    speciality: "",
    joinDate: new Date().toISOString().split("T")[0],
    status: "Active"
  });

  // 5. Notifications Config
  const [notifConfig, setNotifConfig] = useState({
    notificationsEnabled: settings.notificationsEnabled ?? true,
    smsRemindersEnabled: settings.smsRemindersEnabled ?? true,
    autoInvoiceEnabled: settings.autoInvoiceEnabled ?? true,
    whatsappAlertsEnabled: settings.whatsappAlertsEnabled ?? true
  });

  // 6. Security states
  const [passwordInput, setPasswordInput] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Save profile changes
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateGymSettings(profileInput);
    toast.success("Trainer profile preferences updated.");
  };

  // Save Gym branch modifications
  const handleSaveGym = (e) => {
    e.preventDefault();
    updateGymSettings({
      gymName: gymInput.gymName,
      gymAddress: gymInput.gymAddress,
      gymCurrency: gymInput.gymCurrency,
      gymLogo: gymInput.gymLogo,
      businessHours: {
        weekdays: gymInput.businessHoursWeekdays,
        weekends: gymInput.businessHoursWeekends
      }
    });
    toast.success("Gym details configuration saved successfully.");
  };

  // Plans Management
  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.fee || !newPlan.duration) {
      toast.warning("Please fill out all fields to create a plan.");
      return;
    }
    const updatedPlans = [
      ...plans,
      {
        id: `plan_${Date.now()}`,
        name: newPlan.name,
        fee: parseFloat(newPlan.fee),
        duration: parseInt(newPlan.duration)
      }
    ];
    setPlans(updatedPlans);
    updateGymSettings({ membershipPlans: updatedPlans });
    toast.success(`Subscription plan '${newPlan.name}' added successfully!`);
    setNewPlan({ name: "", fee: "", duration: "" });
  };

  const handleDeletePlan = (id) => {
    const updatedPlans = plans.filter((p) => p.id !== id);
    setPlans(updatedPlans);
    updateGymSettings({ membershipPlans: updatedPlans });
    toast.error("Membership plan deleted.");
  };

  // Trainers Management
  const handleAddTrainerSubmit = (e) => {
    e.preventDefault();
    if (!newTrainer.name || !newTrainer.email || !newTrainer.phone) {
      toast.warning("Please fill out all fields to onboard a trainer.");
      return;
    }

    const updatedTrainers = [
      ...trainersList,
      {
        id: `trainer_${Date.now()}`,
        ...newTrainer
      }
    ];
    updateGymSettings({ trainers: updatedTrainers });
    toast.success(`Trainer ${newTrainer.name} onboarding completed.`);
    
    // Reset Form
    setNewTrainer({
      name: "",
      email: "",
      phone: "",
      role: "Nutrition Coach",
      speciality: "",
      joinDate: new Date().toISOString().split("T")[0],
      status: "Active"
    });
  };

  const handleDeleteTrainer = (id, name) => {
    const updatedTrainers = trainersList.filter((t) => t.id !== id);
    updateGymSettings({ trainers: updatedTrainers });
    toast.error(`Removed trainer ${name} from roster.`);
  };

  // Save notifications config
  const handleSaveNotifConfig = () => {
    updateGymSettings(notifConfig);
    toast.success("Notification dispatch options updated.");
  };

  // Password modification demo confirmation
  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordInput.newPassword !== passwordInput.confirmPassword) {
      toast.warning("Password confirmations do not match.");
      return;
    }
    toast.success("Master credentials updated successfully.");
    setPasswordInput({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  // backup CRM Database into JSON download
  const handleBackupDatabase = () => {
    const dataBackup = {
      clients,
      workouts,
      diets,
      attendance,
      payments,
      measurements,
      notifications,
      settings
    };

    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(dataBackup, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `Befit_CRM_Backup_${new Date().toISOString().split("T")[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    document.body.removeChild(downloadAnchor);
    toast.success("Gym database backup downloaded successfully as JSON.");
  };

  // restore database from uploader JSON
  const handleRestoreDatabase = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const fileReader = new FileReader();
    fileReader.onload = (event) => {
      try {
        const parsedData = JSON.parse(event.target.result);
        
        // Simple sanity check
        if (!parsedData.clients || !parsedData.settings) {
          toast.error("Invalid database backup file format. Must contain clients and settings metadata.");
          return;
        }

        const success = restoreDatabase(parsedData);
        if (success) {
          toast.success("Gym database restored successfully! Reloading CRM state...");
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          toast.error("Failed to restore database from backup.");
        }
      } catch (err) {
        toast.error("Error reading JSON file. Make sure the file format is correct.");
      }
    };
    fileReader.readAsText(file);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 text-left">
      {/* Page Title Header */}
      <div className="border-b border-slate-100 dark:border-zinc-800 pb-5">
        <h1 className="text-2xl font-extrabold font-display text-slate-800 dark:text-zinc-55 flex items-center gap-2">
          CRM Studio Settings
        </h1>
        <p className="text-slate-400 dark:text-zinc-500 text-xs mt-0.5">
          Configure physical branches, design subscription plans, manage trainer roles, adjust alerts, and export system backups.
        </p>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar Menu Options */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-3 shadow-soft space-y-1">
          {[
            { id: "profile", label: "Trainer Profile", icon: User },
            { id: "gym", label: "Gym Information", icon: Building },
            { id: "plans", label: "Membership Plans", icon: CreditCard },
            { id: "trainers", label: "Trainer Management", icon: UserCheck },
            { id: "notifications", label: "Notifications & Alerts", icon: Bell },
            { id: "security", label: "Security & Backup", icon: Lock }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer active:scale-98 ${
                  isActive
                    ? "bg-blue-600 text-white shadow-md shadow-blue-500/10"
                    : "text-slate-500 hover:bg-slate-50 dark:text-zinc-400 dark:hover:bg-zinc-850/50"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Sheet Panels */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200/80 dark:border-zinc-800 rounded-3xl p-6 shadow-soft">
          
          {/* TAB 1: Trainer Profile */}
          {activeSubTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-500" /> Trainer Personal Profile
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure profile details visible on billing worksheets and headers.</p>
              </div>
              
              {/* Profile Photo selector */}
              <div className="flex items-center gap-4">
                <img
                  src={profileInput.trainerPhoto}
                  alt={profileInput.trainerName}
                  className="w-16 h-16 rounded-full object-cover shadow border dark:border-zinc-800"
                />
                <div className="space-y-1.5 text-xs text-left">
                  <span className="text-[10px] font-black text-slate-450 uppercase block">Avatar Photo URL</span>
                  <input
                    type="text"
                    value={profileInput.trainerPhoto}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerPhoto: e.target.value })}
                    className="w-full sm:w-80 px-3 py-1.5 border border-slate-202 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-[10px]"
                    placeholder="Enter image link URL..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Trainer Name</label>
                  <input
                    type="text"
                    value={profileInput.trainerName}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:bg-white dark:focus:bg-zinc-900 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Trainer Speciality</label>
                  <input
                    type="text"
                    value={profileInput.trainerSpeciality}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerSpeciality: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:bg-white dark:focus:bg-zinc-900 transition"
                    placeholder="e.g. Strength & HIIT"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Trainer Email Address</label>
                  <input
                    type="email"
                    value={profileInput.trainerEmail}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerEmail: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:bg-white dark:focus:bg-zinc-900 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profileInput.trainerPhone}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerPhone: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:bg-white dark:focus:bg-zinc-900 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Biography / Trainer Notes</label>
                <textarea
                  value={profileInput.trainerBio}
                  onChange={(e) => setProfileInput({ ...profileInput, trainerBio: e.target.value })}
                  rows={3}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 focus:bg-white dark:focus:bg-zinc-900 transition"
                />
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
              >
                Save Profile Preferences
              </button>
            </form>
          )}

          {/* TAB 2: Gym Branch Details */}
          {activeSubTab === "gym" && (
            <form onSubmit={handleSaveGym} className="space-y-5 animate-in fade-in duration-200">
              <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Building className="w-4 h-4 text-blue-500" /> Gym Branch Configuration
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Define settings for branch details, operating schedules, and currencies.</p>
              </div>

              {/* Logo Row */}
              <div className="flex items-center gap-4">
                <img
                  src={gymInput.gymLogo}
                  alt="Gym Logo"
                  className="w-14 h-14 rounded-2xl object-cover shadow border dark:border-zinc-800 bg-slate-50"
                />
                <div className="space-y-1.5 text-xs text-left">
                  <span className="text-[10px] font-black text-slate-450 uppercase block">Gym Logo Image URL</span>
                  <input
                    type="text"
                    value={gymInput.gymLogo}
                    onChange={(e) => setGymInput({ ...gymInput, gymLogo: e.target.value })}
                    className="w-full sm:w-80 px-3 py-1.5 border border-slate-202 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-[10px]"
                    placeholder="Enter gym logo URL..."
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Gym Name</label>
                  <input
                    type="text"
                    value={gymInput.gymName}
                    onChange={(e) => setGymInput({ ...gymInput, gymName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={gymInput.gymCurrency}
                    onChange={(e) => setGymInput({ ...gymInput, gymCurrency: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-slate-455 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={gymInput.gymAddress}
                  onChange={(e) => setGymInput({ ...gymInput, gymAddress: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 dark:text-zinc-150 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                  required
                />
              </div>

              {/* Business Hours */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-100 dark:border-zinc-850 p-4 rounded-2xl">
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Weekday Business Hours</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={gymInput.businessHoursWeekdays}
                      onChange={(e) => setGymInput({ ...gymInput, businessHoursWeekdays: e.target.value })}
                      placeholder="e.g. 06:00 AM - 10:00 PM"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Weekend Business Hours</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-3 w-4 h-4 text-slate-400" />
                    <input
                      type="text"
                      value={gymInput.businessHoursWeekends}
                      onChange={(e) => setGymInput({ ...gymInput, businessHoursWeekends: e.target.value })}
                      placeholder="e.g. 08:00 AM - 04:00 PM"
                      className="w-full pl-9 pr-3 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow-md transition cursor-pointer active:scale-95"
              >
                Save Details Configuration
              </button>
            </form>
          )}

          {/* TAB 3: Membership Plans */}
          {activeSubTab === "plans" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Active Membership Packages
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure active subscription package durations, monthly yields, and names.</p>
              </div>

              {/* List Plans */}
              <div className="divide-y divide-slate-100 dark:divide-zinc-850/50">
                {plans.length > 0 ? (
                  plans.map((p) => (
                    <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <h4 className="font-extrabold text-slate-800 dark:text-zinc-200">{p.name}</h4>
                        <p className="text-[10px] text-slate-400 dark:text-zinc-500 font-bold block mt-0.5">{p.duration} Month(s)</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="font-black text-slate-800 dark:text-zinc-150">₹{p.fee.toLocaleString("en-IN")}/month</span>
                        <button
                          onClick={() => handleDeletePlan(p.id)}
                          className="p-1.5 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-xl transition cursor-pointer"
                          title="Delete Package Option"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 italic">No membership plans configured.</div>
                )}
              </div>

              {/* Add Plan Widget */}
              <form onSubmit={handleAddPlan} className="bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-250/60 dark:border-zinc-850 rounded-2xl p-4.5 space-y-4">
                <span className="text-xs font-bold text-slate-550 dark:text-zinc-400 block border-b pb-2 dark:border-zinc-850">Add Subscription Package</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-450 block mb-1">Package Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Quarterly Gold"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Monthly Fee (₹)</label>
                    <input
                      type="number"
                      placeholder="e.g. 4000"
                      value={newPlan.fee}
                      onChange={(e) => setNewPlan({ ...newPlan, fee: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Onboard Package Option</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Trainer Management */}
          {activeSubTab === "trainers" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-blue-500" /> Gym Trainer Management
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Manage secondary coaching rosters, nutritionist logs, and role designations.</p>
              </div>

              {/* Trainers List Table */}
              <div className="overflow-x-auto border border-slate-100 dark:border-zinc-850 rounded-2xl">
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-zinc-955/20 border-b border-slate-100 dark:border-zinc-850 text-[9px] font-black text-slate-400 dark:text-zinc-550 uppercase tracking-wider">
                      <th className="py-2.5 px-4">Trainer</th>
                      <th className="py-2.5 px-4">Role / Speciality</th>
                      <th className="py-2.5 px-4">Contact</th>
                      <th className="py-2.5 px-4">Joined Date</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Delete</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-850/50 text-slate-700 dark:text-zinc-350">
                    {trainersList.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-50/50 dark:hover:bg-zinc-900/30 transition">
                        <td className="py-3 px-4 font-bold text-slate-800 dark:text-zinc-200">{t.name}</td>
                        <td className="py-3 px-4">
                          <span className="font-semibold text-slate-600 dark:text-zinc-350 block">{t.role}</span>
                          <span className="text-[9.5px] text-slate-400 block">{t.speciality}</span>
                        </td>
                        <td className="py-3 px-4 text-slate-450">
                          <div>{t.email}</div>
                          <div>{t.phone}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-400 font-medium">{formatDate(t.joinDate)}</td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                            t.status === "Active" ? "bg-emerald-500/10 text-emerald-500" : "bg-zinc-500/10 text-zinc-400"
                          }`}>
                            {t.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={() => handleDeleteTrainer(t.id, t.name)}
                            className="p-1 hover:bg-red-50 dark:hover:bg-red-500/10 text-red-500 rounded-lg cursor-pointer"
                            title="Delete Trainer"
                            disabled={t.id === "trainer_1"} // Prevent self deletion
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Trainer Form */}
              <form onSubmit={handleAddTrainerSubmit} className="bg-slate-50/50 dark:bg-zinc-950/20 border border-slate-205 dark:border-zinc-850 rounded-2xl p-4.5 space-y-4">
                <span className="text-xs font-bold text-slate-550 dark:text-zinc-400 block border-b pb-2 dark:border-zinc-850">Onboard Gym Trainer</span>
                
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Trainer Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Sandeep Singh"
                      value={newTrainer.name}
                      onChange={(e) => setNewTrainer({ ...newTrainer, name: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Email Address</label>
                    <input
                      type="email"
                      placeholder="e.g. sandeep@gym.com"
                      value={newTrainer.email}
                      onChange={(e) => setNewTrainer({ ...newTrainer, email: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Contact Phone</label>
                    <input
                      type="text"
                      placeholder="e.g. +91 99999 77777"
                      value={newTrainer.phone}
                      onChange={(e) => setNewTrainer({ ...newTrainer, phone: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Coaching Role</label>
                    <select
                      value={newTrainer.role}
                      onChange={(e) => setNewTrainer({ ...newTrainer, role: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="Head Trainer">Head Trainer</option>
                      <option value="Personal Trainer">Personal Trainer</option>
                      <option value="Nutrition Coach">Nutrition Coach</option>
                      <option value="Yoga Trainer">Yoga Trainer</option>
                      <option value="Floor Trainer">Floor Trainer</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Speciality / Focus</label>
                    <input
                      type="text"
                      placeholder="e.g. Calisthenics, HIIT"
                      value={newTrainer.speciality}
                      onChange={(e) => setNewTrainer({ ...newTrainer, speciality: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-black text-slate-455 block mb-1">Status</label>
                    <select
                      value={newTrainer.status}
                      onChange={(e) => setNewTrainer({ ...newTrainer, status: e.target.value })}
                      className="w-full px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs bg-white dark:bg-zinc-950 text-slate-700 dark:text-zinc-200 focus:outline-none"
                    >
                      <option value="Active">Active</option>
                      <option value="Inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-755 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Register Gym Trainer</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 5: Notifications Preferences */}
          {activeSubTab === "notifications" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" /> Notifications Settings
                </h3>
                <p className="text-[10px] text-slate-400 mt-1">Configure channels for member alerts and payment scheduling reports.</p>
              </div>

              <div className="space-y-4">
                {[
                  { key: "notificationsEnabled", title: "Enable Portal Notifications", desc: "Allow system warning alerts inside the top notifications header feed." },
                  { key: "smsRemindersEnabled", title: "Enable SMS Client Alerts", desc: "Automate SMS-based reminders for pending monthly fees." },
                  { key: "autoInvoiceEnabled", title: "Automated Invoice Generation", desc: "Instantly draft invoice records upon member onboarding." },
                  { key: "whatsappAlertsEnabled", title: "WhatsApp Reminders Integration", desc: "Push monthly diet logs or workouts to client WhatsApp mobile logs." }
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between p-3.5 rounded-2xl hover:bg-slate-50 dark:hover:bg-zinc-950/20 transition border border-transparent hover:border-slate-100 dark:hover:border-zinc-850">
                    <div className="pr-4">
                      <h4 className="text-xs font-extrabold text-slate-800 dark:text-zinc-200">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-normal">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifConfig[item.key]}
                      onChange={(e) => setNotifConfig({ ...notifConfig, [item.key]: e.target.checked })}
                      className="w-4.5 h-4.5 text-blue-600 border-slate-200 rounded-lg focus:ring-blue-500 cursor-pointer accent-blue-650"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveNotifConfig}
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer active:scale-95"
              >
                Save Dispatch Settings
              </button>
            </div>
          )}

          {/* TAB 6: Security & Backup */}
          {activeSubTab === "security" && (
            <div className="space-y-6 animate-in fade-in duration-200 text-left">
              
              {/* Change Password Panel */}
              <form onSubmit={handleChangePassword} className="space-y-4">
                <div className="border-b pb-3 mb-4 dark:border-zinc-850">
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-blue-500" /> Master Password Credentials
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Change authentication credentials used to access gym dashboards.</p>
                </div>

                <div>
                  <label className="text-[10px] font-black text-slate-455 block mb-1">Current Password</label>
                  <input
                    type="password"
                    value={passwordInput.oldPassword}
                    onChange={(e) => setPasswordInput({ ...passwordInput, oldPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-455 block mb-1">New Password</label>
                    <input
                      type="password"
                      value={passwordInput.newPassword}
                      onChange={(e) => setPasswordInput({ ...passwordInput, newPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-455 block mb-1">Confirm New Password</label>
                    <input
                      type="password"
                      value={passwordInput.confirmPassword}
                      onChange={(e) => setPasswordInput({ ...passwordInput, confirmPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-855 focus:outline-none focus:ring-2 focus:ring-blue-550 transition"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-5 py-2.5 bg-blue-600 hover:bg-blue-750 text-white rounded-xl text-xs font-bold shadow transition cursor-pointer active:scale-95"
                >
                  Update Account Password
                </button>
              </form>

              {/* Backup & Restore Panel */}
              <div className="border-t border-slate-100 dark:border-zinc-850 pt-6 space-y-4">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-slate-800 dark:text-zinc-200 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-emerald-500" /> Database Backup & Restore Center
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-1">Download a full JSON snapshot of your athletes, workouts, diets, billing logs, and preferences.</p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Backup Card */}
                  <div className="p-4 bg-slate-50/60 dark:bg-zinc-955/15 border border-slate-105 dark:border-zinc-850 rounded-2xl flex flex-col justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">Export Backup Data</span>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">Save the complete CRM state as a local backup file on your machine.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleBackupDatabase}
                      className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition active:scale-95"
                    >
                      <Download className="w-4 h-4" />
                      <span>Download Backup JSON</span>
                    </button>
                  </div>

                  {/* Restore Card */}
                  <div className="p-4 bg-slate-50/60 dark:bg-zinc-955/15 border border-slate-105 dark:border-zinc-850 rounded-2xl flex flex-col justify-between items-start gap-4">
                    <div>
                      <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block">Restore Database Backup</span>
                      <p className="text-[10px] text-slate-400 dark:text-zinc-500 mt-1 leading-relaxed">Restore previous data states by uploading a valid backup JSON file.</p>
                    </div>
                    <div className="w-full relative">
                      <label
                        htmlFor="restore-file-input"
                        className="w-full flex items-center justify-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-750 text-white text-xs font-bold rounded-xl shadow cursor-pointer transition active:scale-95"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Upload Backup file</span>
                      </label>
                      <input
                        id="restore-file-input"
                        type="file"
                        accept=".json"
                        onChange={handleRestoreDatabase}
                        className="hidden"
                      />
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default Settings;
