import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  User,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Phone,
  Calendar,
  MapPin,
  Heart,
  Scale,
  Activity,
  Flame,
  TrendingUp,
  Dumbbell,
  ShieldAlert,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ShieldCheck
} from "lucide-react";
import { toast } from "sonner";
import { api } from "../services/api";

const GOALS = [
  { name: "Weight Loss", desc: "Reduce overall body mass & fat index", icon: Flame, color: "text-orange-500 border-orange-200/50 bg-orange-500/5" },
  { name: "Weight Gain", desc: "Increase lean mass and healthy weight", icon: TrendingUp, color: "text-blue-500 border-blue-200/50 bg-blue-500/5" },
  { name: "Muscle Gain", desc: "Build muscle size, strength, and tone", icon: Dumbbell, color: "text-emerald-500 border-emerald-200/50 bg-emerald-500/5" },
  { name: "Fat Loss", desc: "Optimize lean ratio while preserving muscles", icon: Sparkles, color: "text-amber-500 border-amber-200/50 bg-amber-500/5" },
  { name: "Strength Training", desc: "Focus on lift totals, power, & raw strength", icon: ShieldAlert, color: "text-rose-500 border-rose-200/50 bg-rose-500/5" },
  { name: "General Fitness", desc: "Enhance health, cardiovascular rate & stamina", icon: Heart, color: "text-purple-500 border-purple-200/50 bg-purple-500/5" }
];

const ClientInviteRegister = () => {
  const navigate = useNavigate();

  // Verification states
  const [isVerifying, setIsVerifying] = useState(true);
  const [verifyError, setVerifyError] = useState("");
  const [invitationData, setInvitationData] = useState(null);
  const [token, setToken] = useState(null);

  // Form states
  const [formData, setFormData] = useState({
    fullName: "",
    password: "",
    confirmPassword: "",
    phone: "",
    dob: "",
    gender: "Male",
    address: "",
    emergencyContact: "",
    goal: "General Fitness",
    height: "",
    currentWeight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    arms: "",
    thigh: "",
    medicalConditions: "",
    allergies: "",
    injuries: ""
  });

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validation errors
  const [errors, setErrors] = useState({});

  // Helper to extract invitation token from URL query or hash
  const getInviteToken = () => {
    const hash = window.location.hash || "";
    const search = window.location.search || "";
    const match = hash.match(/[?&]token=([^&]+)/) || search.match(/[?&]token=([^&]+)/);
    return match ? decodeURIComponent(match[1]) : null;
  };

  useEffect(() => {
    const rawToken = getInviteToken();
    if (!rawToken) {
      setIsVerifying(false);
      setVerifyError("No invitation token found in the link. Please ask your trainer for a valid invite link.");
      return;
    }

    setToken(rawToken);

    const verifyToken = async () => {
      setIsVerifying(true);
      setVerifyError("");
      try {
        const res = await api.get(`/api/invitations/verify?token=${encodeURIComponent(rawToken)}`);
        if (res.success && res.invitation) {
          setInvitationData(res.invitation);
        } else {
          setVerifyError(res.message || "This invitation is invalid or has expired.");
        }
      } catch (err) {
        const message = err instanceof Error ? err.message : "This invitation is invalid or has expired. Please contact your trainer for a new invitation.";
        setVerifyError(message);
      } finally {
        setIsVerifying(false);
      }
    };

    verifyToken();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Clear error for field upon typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required.";
    }

    if (!formData.password) {
      newErrors.password = "Password is required.";
    } else if (formData.password.length < 8) {
      newErrors.password = "Password must be at least 8 characters long.";
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = "Confirm password is required.";
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match.";
    }

    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required.";
    }

    if (!formData.dob) {
      newErrors.dob = "Date of birth is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields properly.");
      return;
    }

    if (!token) {
      toast.error("Invitation token is missing or invalid.");
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        token,
        full_name: formData.fullName.trim(),
        phone: formData.phone.trim() || undefined,
        dob: formData.dob || undefined,
        gender: formData.gender || undefined,
        address: formData.address.trim() || undefined,
        emergency_contact: formData.emergencyContact.trim() || undefined,
        goal: formData.goal || undefined,
        height: formData.height || undefined,
        current_weight: formData.currentWeight || undefined,
        body_fat: formData.bodyFat || undefined,
        chest: formData.chest || undefined,
        waist: formData.waist || undefined,
        arms: formData.arms || undefined,
        thigh: formData.thigh || undefined,
        medical_conditions: formData.medicalConditions.trim() || undefined,
        allergies: formData.allergies.trim() || undefined,
        injuries: formData.injuries.trim() || undefined,
        password: formData.password,
        confirm_password: formData.confirmPassword,
      };

      const res = await api.post("/api/auth/register/client-invite", payload);

      if (res.success) {
        toast.success(res.message || "Account created successfully! Please log in.");
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        toast.error(res.message || "Failed to create account. Please check your details.");
      }
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Failed to create account. Please try again.";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 1. Loading state
  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-slate-800 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-4 p-8 bg-white dark:bg-zinc-900/80 rounded-2xl border border-slate-200/80 dark:border-zinc-800 shadow-xl shadow-blue-500/5 max-w-md w-full text-center">
          <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
          <h3 className="text-lg font-black tracking-tight">Checking your invitation...</h3>
          <p className="text-xs text-slate-500 dark:text-zinc-400">
            Please wait while we securely verify your BeFit invitation credentials.
          </p>
        </div>
      </div>
    );
  }

  // 2. Error / Expired state
  if (verifyError || !invitationData) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-zinc-950 p-6 text-slate-800 dark:text-zinc-100">
        <div className="flex flex-col items-center gap-5 p-8 sm:p-10 bg-white dark:bg-zinc-900/80 rounded-3xl border border-red-100 dark:border-red-950/40 shadow-xl shadow-red-500/5 max-w-lg w-full text-center">
          <div className="w-16 h-16 rounded-2xl bg-red-50 dark:bg-red-950/30 flex items-center justify-center text-red-500">
            <AlertCircle className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black tracking-tight text-slate-900 dark:text-zinc-50">
              Invalid or Expired Invitation
            </h2>
            <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed font-medium">
              {verifyError || "This invitation link is no longer valid or has expired. Please contact your trainer for a new invitation link."}
            </p>
          </div>
          <button
            onClick={() => navigate("/login")}
            className="mt-4 px-6 py-3 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
          >
            Back to Login
          </button>
        </div>
      </div>
    );
  }

  // 3. Valid invitation registration form
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header Branding */}
        <div className="flex flex-col items-center text-center space-y-3">
          <div className="flex items-center gap-3 bg-gradient-to-tr from-blue-600 to-cyan-500 text-white px-5 py-2.5 rounded-2xl shadow-lg shadow-blue-500/10">
            <span className="text-2xl leading-none">🏋️</span>
            <div>
              <h1 className="text-base font-black tracking-tight leading-none text-white">BEFIT</h1>
              <span className="text-[9px] text-blue-100 font-bold uppercase tracking-wider block mt-0.5">
                Client Portal Onboarding
              </span>
            </div>
          </div>
          <h2 className="text-3xl font-black text-slate-900 dark:text-zinc-50 tracking-tight">
            Activate Your Client Account
          </h2>
          <p className="text-sm text-slate-500 dark:text-zinc-400 max-w-lg font-medium">
            You've been invited by your trainer to join BeFit. Complete your profile below to start tracking your workouts and nutrition.
          </p>
        </div>

        {/* Main Onboarding Card */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-zinc-900/80 border border-slate-200/80 dark:border-zinc-800/80 shadow-2xl shadow-blue-500/5 rounded-3xl p-6 sm:p-10 space-y-10">
          
          {/* SECTION 1: ACCOUNT CREDENTIALS */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <ShieldCheck className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                1. Account Credentials
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              
              {/* Email (Read-only, pre-filled) */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Email Address <span className="text-blue-500 text-[10px] font-bold">(Locked to Invitation)</span>
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="email"
                    value={invitationData.client_email}
                    disabled
                    readOnly
                    className="w-full h-12 pl-11 pr-4 rounded-xl bg-slate-100 dark:bg-zinc-800/80 border border-slate-200 dark:border-zinc-700 text-sm font-semibold text-slate-600 dark:text-zinc-300 cursor-not-allowed select-none"
                  />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="At least 8 characters"
                    className={`w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                      errors.password ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-100"
                    } text-sm focus:outline-none focus:ring-4 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-rose-500 font-semibold">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Confirm Password <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat your password"
                    className={`w-full h-12 pl-11 pr-11 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                      errors.confirmPassword ? "border-rose-500 focus:ring-rose-100" : "border-slate-200 dark:border-zinc-800 focus:border-blue-500 focus:ring-blue-100"
                    } text-sm focus:outline-none focus:ring-4 transition-all`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-rose-500 font-semibold">{errors.confirmPassword}</p>}
              </div>
            </div>
          </div>

          {/* SECTION 2: PERSONAL INFORMATION */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <User className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                2. Personal Details
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              
              {/* Full Name */}
              <div className="sm:col-span-2 space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="John Doe"
                  className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                    errors.fullName ? "border-rose-500" : "border-slate-200 dark:border-zinc-800"
                  } text-sm focus:outline-none focus:border-blue-500`}
                />
                {errors.fullName && <p className="text-xs text-rose-500 font-semibold">{errors.fullName}</p>}
              </div>

              {/* Gender */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Gender <span className="text-rose-500">*</span>
                </label>
                <select
                  name="gender"
                  value={formData.gender}
                  onChange={handleChange}
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              {/* Phone */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Phone Number <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  placeholder="+1 (555) 000-0000"
                  className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                    errors.phone ? "border-rose-500" : "border-slate-200 dark:border-zinc-800"
                  } text-sm focus:outline-none focus:border-blue-500`}
                />
                {errors.phone && <p className="text-xs text-rose-500 font-semibold">{errors.phone}</p>}
              </div>

              {/* DOB */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Date of Birth <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  name="dob"
                  value={formData.dob}
                  onChange={handleChange}
                  className={`w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border ${
                    errors.dob ? "border-rose-500" : "border-slate-200 dark:border-zinc-800"
                  } text-sm focus:outline-none focus:border-blue-500`}
                />
                {errors.dob && <p className="text-xs text-rose-500 font-semibold">{errors.dob}</p>}
              </div>

              {/* Emergency Contact */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Emergency Contact
                </label>
                <input
                  type="text"
                  name="emergencyContact"
                  value={formData.emergencyContact}
                  onChange={handleChange}
                  placeholder="Name & Phone"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Address */}
              <div className="sm:col-span-3 space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Street Address
                </label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleChange}
                  placeholder="City, State, Zip"
                  className="w-full h-12 px-4 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: FITNESS GOAL & BASELINE METRICS */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <Activity className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                3. Fitness Goal & Baseline Metrics
              </h3>
            </div>

            {/* Goal Cards Selection */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                Primary Goal <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {GOALS.map((g) => {
                  const Icon = g.icon;
                  const isSelected = formData.goal === g.name;
                  return (
                    <div
                      key={g.name}
                      onClick={() => setFormData((p) => ({ ...p, goal: g.name }))}
                      className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all duration-200 flex flex-col justify-between gap-2 ${
                        isSelected
                          ? "border-blue-600 bg-blue-500/5 dark:border-cyan-400 dark:bg-cyan-500/10 shadow-md shadow-blue-500/10"
                          : "border-slate-100 dark:border-zinc-800/80 bg-slate-50/50 dark:bg-zinc-800/20 hover:border-slate-300 dark:hover:border-zinc-700"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-extrabold text-sm text-slate-900 dark:text-zinc-100">{g.name}</span>
                        <div className={`p-1.5 rounded-xl border ${g.color}`}>
                          <Icon className="w-4 h-4" />
                        </div>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-zinc-400 leading-tight">{g.desc}</p>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Body Metrics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Height (cm)
                </label>
                <input
                  type="number"
                  name="height"
                  value={formData.height}
                  onChange={handleChange}
                  placeholder="e.g. 175"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  name="currentWeight"
                  value={formData.currentWeight}
                  onChange={handleChange}
                  placeholder="e.g. 72"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Body Fat (%)
                </label>
                <input
                  type="number"
                  name="bodyFat"
                  value={formData.bodyFat}
                  onChange={handleChange}
                  placeholder="e.g. 18"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Waist (cm)
                </label>
                <input
                  type="number"
                  name="waist"
                  value={formData.waist}
                  onChange={handleChange}
                  placeholder="e.g. 82"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: HEALTH & MEDICAL HISTORY */}
          <div className="space-y-6">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100 dark:border-zinc-800/80">
              <Heart className="w-5 h-5 text-blue-600 dark:text-cyan-400" />
              <h3 className="text-base font-black uppercase tracking-wider text-slate-900 dark:text-zinc-100">
                4. Health & Medical Background
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Medical Conditions
                </label>
                <input
                  type="text"
                  name="medicalConditions"
                  value={formData.medicalConditions}
                  onChange={handleChange}
                  placeholder="Asthma, Diabetes, etc. (or None)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Allergies
                </label>
                <input
                  type="text"
                  name="allergies"
                  value={formData.allergies}
                  onChange={handleChange}
                  placeholder="Peanuts, Dairy, etc. (or None)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-black text-slate-500 dark:text-zinc-400 uppercase tracking-wider block">
                  Past Injuries
                </label>
                <input
                  type="text"
                  name="injuries"
                  value={formData.injuries}
                  onChange={handleChange}
                  placeholder="Lower back, knee, etc. (or None)"
                  className="w-full h-11 px-3.5 rounded-xl bg-slate-50 dark:bg-zinc-800/40 border border-slate-200 dark:border-zinc-800 text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-slate-100 dark:border-zinc-800/80">
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-xs font-black text-slate-400 hover:text-slate-600 dark:hover:text-zinc-300 uppercase tracking-wider transition-colors cursor-pointer"
            >
              Already have an account? Log in
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full sm:w-auto px-8 h-12 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-white rounded-xl text-xs font-black uppercase tracking-wider shadow-lg shadow-blue-500/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ClientInviteRegister;
