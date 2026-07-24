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
  HelpCircle
} from "lucide-react";
import { toast } from "sonner";

const Settings = () => {
  const { settings, updateGymSettings } = useCRM();

  const [activeSubTab, setActiveSubTab] = useState("profile");

  // 1. Trainer profile states
  const [profileInput, setProfileInput] = useState({
    trainerName: settings.trainerName || "",
    trainerEmail: settings.trainerEmail || "",
    trainerPhone: settings.trainerPhone || ""
  });

  // 2. Gym details states
  const [gymInput, setGymInput] = useState({
    gymName: settings.gymName || "",
    gymAddress: settings.gymAddress || "",
    gymCurrency: settings.gymCurrency || "$"
  });

  // 3. Plan editor states
  const [plans, setPlans] = useState(settings.membershipPlans || []);
  const [newPlan, setNewPlan] = useState({ name: "", fee: "", duration: "" });

  // 4. Notifications config
  const [notifConfig, setNotifConfig] = useState({
    notificationsEnabled: settings.notificationsEnabled ?? true,
    smsRemindersEnabled: settings.smsRemindersEnabled ?? false,
    autoInvoiceEnabled: settings.autoInvoiceEnabled ?? true
  });

  // 5. Change Password state
  const [passwordInput, setPasswordInput] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  // Save Handlers
  const handleSaveProfile = (e) => {
    e.preventDefault();
    updateGymSettings(profileInput);
    toast.success("Trainer profile updated.");
  };

  const handleSaveGym = (e) => {
    e.preventDefault();
    updateGymSettings(gymInput);
    toast.success("Gym details configuration saved.");
  };

  const handleAddPlan = (e) => {
    e.preventDefault();
    if (!newPlan.name || !newPlan.fee || !newPlan.duration) {
      toast.warning("Please fill out all plan fields.");
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
    toast.success(`New subscription plan '${newPlan.name}' added.`);
    setNewPlan({ name: "", fee: "", duration: "" });
  };

  const handleDeletePlan = (id) => {
    const updatedPlans = plans.filter((p) => p.id !== id);
    setPlans(updatedPlans);
    updateGymSettings({ membershipPlans: updatedPlans });
    toast.error("Subscription plan deleted.");
  };

  const handleSaveNotifConfig = () => {
    updateGymSettings(notifConfig);
    toast.success("Notification preferences updated.");
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    if (passwordInput.newPassword !== passwordInput.confirmPassword) {
      toast.warning("New password confirmations do not match.");
      return;
    }
    toast.success("Password changed successfully (Demo confirmation).");
    setPasswordInput({ oldPassword: "", newPassword: "", confirmPassword: "" });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
          System Settings
        </h1>
        <p className="text-slate-400 dark:text-zinc-500 text-sm">
          Modify CRM configuration, configure gym plans, set credentials, and tweak preferences.
        </p>
      </div>

      {/* Main Container Grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 items-start">
        
        {/* Left Sidebar Menu Options */}
        <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-3 shadow-sm space-y-1">
          {[
            { id: "profile", label: "Trainer Profile", icon: User },
            { id: "gym", label: "Gym Info", icon: Building },
            { id: "plans", label: "Membership Plans", icon: CreditCard },
            { id: "notifications", label: "Notifications", icon: Bell },
            { id: "password", label: "Security", icon: Lock }
          ].map((item) => {
            const Icon = item.icon;
            const isActive = activeSubTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveSubTab(item.id)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  isActive
                    ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
                    : "text-slate-500 hover:bg-slate-50 dark:hover:bg-zinc-800/40"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>

        {/* Right Settings Sheet Panels */}
        <div className="md:col-span-3 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm">
          
          {/* TAB 1: Trainer Profile */}
          {activeSubTab === "profile" && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <User className="w-4 h-4 text-blue-500" /> Trainer Personal Profile
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Trainer Name</label>
                  <input
                    type="text"
                    value={profileInput.trainerName}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Contact Phone</label>
                  <input
                    type="text"
                    value={profileInput.trainerPhone}
                    onChange={(e) => setProfileInput({ ...profileInput, trainerPhone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Trainer Email Address</label>
                <input
                  type="email"
                  value={profileInput.trainerEmail}
                  onChange={(e) => setProfileInput({ ...profileInput, trainerEmail: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Save Profile
              </button>
            </form>
          )}

          {/* TAB 2: Gym Info */}
          {activeSubTab === "gym" && (
            <form onSubmit={handleSaveGym} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Building className="w-4 h-4 text-blue-500" /> Gym Branch Details
              </h3>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Gym Name</label>
                  <input
                    type="text"
                    value={gymInput.gymName}
                    onChange={(e) => setGymInput({ ...gymInput, gymName: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Currency Symbol</label>
                  <input
                    type="text"
                    value={gymInput.gymCurrency}
                    onChange={(e) => setGymInput({ ...gymInput, gymCurrency: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Physical Address</label>
                <input
                  type="text"
                  value={gymInput.gymAddress}
                  onChange={(e) => setGymInput({ ...gymInput, gymAddress: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-855 focus:outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Save Details
              </button>
            </form>
          )}

          {/* TAB 3: Membership Plans */}
          {activeSubTab === "plans" && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-500" /> Active Membership Plans
                </h3>
                <p className="text-slate-400 text-xs">Manage active membership fees and monthly duration rates.</p>
              </div>

              {/* List Plans */}
              <div className="divide-y divide-slate-100 dark:divide-zinc-800/40">
                {plans.map((p) => (
                  <div key={p.id} className="py-3 flex justify-between items-center text-xs">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-zinc-200">{p.name}</h4>
                      <p className="text-[10px] text-slate-400">Duration: {p.duration} Months</p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-slate-700 dark:text-zinc-300">${p.fee}/month</span>
                      <button
                        onClick={() => handleDeletePlan(p.id)}
                        className="p-1.5 hover:bg-red-50 text-red-500 rounded transition cursor-pointer"
                        title="Delete Subscription"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Add Plan Widget */}
              <form onSubmit={handleAddPlan} className="bg-slate-50 dark:bg-zinc-950/20 border border-slate-200/60 dark:border-zinc-800/80 rounded-2xl p-4 space-y-4">
                <span className="text-xs font-bold text-slate-500 block">Add Subscription Option</span>
                
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 block mb-1">Plan Name</label>
                    <input
                      type="text"
                      placeholder="e.g. Bronze Package"
                      value={newPlan.name}
                      onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 block mb-1">Monthly Fee ($)</label>
                    <input
                      type="number"
                      placeholder="e.g. 50"
                      value={newPlan.fee}
                      onChange={(e) => setNewPlan({ ...newPlan, fee: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[9px] font-bold text-slate-450 block mb-1">Duration (Months)</label>
                    <input
                      type="number"
                      placeholder="e.g. 3"
                      value={newPlan.duration}
                      onChange={(e) => setNewPlan({ ...newPlan, duration: e.target.value })}
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs bg-white"
                      required
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Plan Option</span>
                </button>
              </form>
            </div>
          )}

          {/* TAB 4: Notifications Preferences */}
          {activeSubTab === "notifications" && (
            <div className="space-y-6">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-blue-500" /> Notifications Settings
              </h3>

              <div className="space-y-4">
                {[
                  { key: "notificationsEnabled", title: "Enable Portal Notifications", desc: "Allow system warnings regarding memberships, payments and registrations to trigger alerts." },
                  { key: "smsRemindersEnabled", title: "SMS Client Alerts", desc: "Allow gym software to simulate text-based reminders for delayed payments." },
                  { key: "autoInvoiceEnabled", title: "Automated Invoice Generation", desc: "Automatically draft unpaid billing receipts upon client onboarding." }
                ].map((item) => (
                  <div key={item.key} className="flex items-start justify-between p-3 rounded-2xl hover:bg-slate-50 transition">
                    <div className="pr-4">
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{item.title}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifConfig[item.key]}
                      onChange={(e) => setNotifConfig({ ...notifConfig, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 border-slate-200 rounded focus:ring-blue-500 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              <button
                type="button"
                onClick={handleSaveNotifConfig}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Save Preferences
              </button>
            </div>
          )}

          {/* TAB 5: Change Password */}
          {activeSubTab === "password" && (
            <form onSubmit={handleChangePassword} className="space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
                <Lock className="w-4 h-4 text-blue-500" /> System Authentication Security
              </h3>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Current Password</label>
                <input
                  type="password"
                  value={passwordInput.oldPassword}
                  onChange={(e) => setPasswordInput({ ...passwordInput, oldPassword: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">New Password</label>
                  <input
                    type="password"
                    value={passwordInput.newPassword}
                    onChange={(e) => setPasswordInput({ ...passwordInput, newPassword: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-800 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordInput.confirmPassword}
                    onChange={(e) => setPasswordInput({ ...passwordInput, confirmPassword: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 text-slate-855 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Update Credentials
              </button>
            </form>
          )}

        </div>

      </div>
    </div>
  );
};

export default Settings;
