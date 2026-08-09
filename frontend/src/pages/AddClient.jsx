import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import {
  User,
  Scale,
  Activity,
  CreditCard,
  Target,
  ArrowRight,
  ArrowLeft,
  Check,
  Flame,
  TrendingUp,
  Dumbbell,
  ShieldAlert,
  Sparkles,
  Heart
} from "lucide-react";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";

const AddClient = () => {
  const { addClient, settings } = useCRM();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);

  // Default avatars list to let users choose or use a fallback
  const mockAvatars = [
    "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200",
    "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=200"
  ];

  const goals = [
    { name: "Weight Loss", desc: "Reduce overall body mass & fat index", icon: Flame, color: "text-orange-500 border-orange-200/50 bg-orange-500/5" },
    { name: "Weight Gain", desc: "Increase lean mass and healthy weight", icon: TrendingUp, color: "text-blue-500 border-blue-200/50 bg-blue-500/5" },
    { name: "Muscle Gain", desc: "Build muscle size, strength, and tone", icon: Dumbbell, color: "text-emerald-500 border-emerald-200/50 bg-emerald-500/5" },
    { name: "Fat Loss", desc: "Optimize lean ratio while preserving muscles", icon: Sparkles, color: "text-amber-500 border-amber-200/50 bg-amber-500/5" },
    { name: "Strength Training", desc: "Focus on lift totals, power, & raw strength", icon: ShieldAlert, color: "text-rose-500 border-rose-200/50 bg-rose-500/5" },
    { name: "General Fitness", desc: "Enhance health, cardiovascular rate & stamina", icon: Heart, color: "text-purple-500 border-purple-200/50 bg-purple-500/5" }
  ];

  // React Hook Form setup
  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger
  } = useForm({
    defaultValues: {
      name: "",
      age: "",
      gender: "Male",
      phone: "",
      email: "",
      address: "",
      emergencyContact: "",
      photo: mockAvatars[0],
      height: "",
      currentWeight: "",
      targetWeight: "",
      bmi: "",
      bodyFat: "",
      chest: "",
      waist: "",
      arms: "",
      thigh: "",
      medicalConditions: "",
      allergies: "",
      injuries: "",
      trainerNotes: "",
      membership: "Standard Monthly",
      joinDate: new Date().toISOString().split("T")[0],
      expiryDate: "",
      monthlyFees: 80,
      goal: "General Fitness"
    }
  });

  const watchHeight = watch("height");
  const watchWeight = watch("currentWeight");
  const watchMembership = watch("membership");

  // Auto-calculate BMI
  React.useEffect(() => {
    const h = parseFloat(watchHeight);
    const w = parseFloat(watchWeight);
    if (h > 0 && w > 0) {
      const calculatedBmi = (w / ((h / 100) * (h / 100))).toFixed(1);
      setValue("bmi", calculatedBmi);
    }
  }, [watchHeight, watchWeight, setValue]);

  // Auto-update price when membership shifts
  React.useEffect(() => {
    const selectedPlan = settings.membershipPlans.find((p) => p.name === watchMembership);
    if (selectedPlan) {
      setValue("monthlyFees", selectedPlan.fee);
      
      // Auto-calculate expiry date
      const jDate = watch("joinDate");
      if (jDate) {
        const join = new Date(jDate);
        join.setMonth(join.getMonth() + selectedPlan.duration);
        setValue("expiryDate", join.toISOString().split("T")[0]);
      }
    }
  }, [watchMembership, watch, setValue, settings]);

  const handleNextStep = async () => {
    let isValid = false;

    if (step === 1) {
      isValid = await trigger(["name", "age", "phone", "email"]);
    } else if (step === 2) {
      isValid = await trigger(["height", "currentWeight", "targetWeight", "bodyFat"]);
    } else if (step === 3) {
      isValid = true; // Medical is optional
    } else if (step === 4) {
      isValid = await trigger(["membership", "joinDate", "expiryDate", "monthlyFees"]);
    }

    if (isValid) {
      setStep((prev) => prev + 1);
    } else {
      toast.warning("Please correct any errors before moving forward.");
    }
  };

  const handleBackStep = () => {
    setStep((prev) => prev - 1);
  };

  const onSubmit = (data) => {
    const newId = addClient(data);
    toast.success(`Athlete ${data.name} enrolled successfully!`);
    navigate(`/clients/${newId}`);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
          New Athlete Onboarding
        </h1>
        <p className="text-slate-400 dark:text-zinc-500 text-sm">
          Follow the 5-step wizard to register and build a fitness roadmap.
        </p>
      </div>

      {/* Progress Steps Header */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm">
        <div className="flex justify-between items-center relative">
          {/* Background connectors */}
          <div className="absolute top-1/2 left-4 right-4 h-0.5 bg-slate-100 dark:bg-zinc-800 -translate-y-1/2 z-0" />
          
          {/* Active Connector Progress */}
          <div
            className="absolute top-1/2 left-4 h-0.5 bg-blue-600 -translate-y-1/2 z-0 transition-all duration-300"
            style={{ width: `${((step - 1) / 4) * 92}%` }}
          />

          {[
            { stepNum: 1, icon: User, label: "Info" },
            { stepNum: 2, icon: Scale, label: "Stats" },
            { stepNum: 3, icon: Activity, label: "Medical" },
            { stepNum: 4, icon: CreditCard, label: "Plan" },
            { stepNum: 5, icon: Target, label: "Goal" }
          ].map((s) => {
            const Icon = s.icon;
            const isCompleted = step > s.stepNum;
            const isActive = step === s.stepNum;

            return (
              <div key={s.stepNum} className="flex flex-col items-center z-10 relative">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center border font-bold text-xs transition-all duration-300 ${
                    isCompleted
                      ? "bg-blue-600 border-blue-600 text-white"
                      : isActive
                      ? "bg-white dark:bg-zinc-900 border-blue-600 text-blue-600 shadow-md shadow-blue-500/10 scale-110"
                      : "bg-white dark:bg-zinc-900 border-slate-200 dark:border-zinc-800 text-slate-400"
                  }`}
                >
                  {isCompleted ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span
                  className={`text-[9px] font-bold uppercase tracking-wider mt-1.5 ${
                    isActive ? "text-blue-600" : "text-slate-400"
                  }`}
                >
                  {s.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main wizard forms */}
      <form onSubmit={handleSubmit(onSubmit)} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-6 shadow-sm">
        
        {/* STEP 1: Personal Info */}
        {step === 1 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <User className="w-4 h-4 text-blue-500" /> Personal Information
            </h3>

            {/* Profile Photo selector */}
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Select Avatar</label>
              <div className="flex gap-3 mb-2">
                {mockAvatars.map((url, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setValue("photo", url)}
                    className={`w-12 h-12 rounded-full border-2 overflow-hidden shrink-0 transition ${
                      watch("photo") === url ? "border-blue-600 scale-105" : "border-transparent opacity-70"
                    }`}
                  >
                    <img src={url} alt="avatar" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Jenkins"
                  {...register("name", { required: "Name is required" })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.name && <span className="text-[10px] text-red-500 block mt-1">{errors.name.message}</span>}
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Age *</label>
                <input
                  type="number"
                  placeholder="e.g. 28"
                  {...register("age", { required: "Age is required", min: { value: 10, message: "Min age 10" } })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.age && <span className="text-[10px] text-red-500 block mt-1">{errors.age.message}</span>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Gender</label>
                <select
                  {...register("gender")}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Phone Number *</label>
                <input
                  type="text"
                  placeholder="e.g. +1 (555) 019-2834"
                  {...register("phone", { required: "Phone is required" })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
                {errors.phone && <span className="text-[10px] text-red-500 block mt-1">{errors.phone.message}</span>}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email Address</label>
              <input
                type="email"
                placeholder="e.g. sarah.j@example.com"
                {...register("email")}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Residential Address</label>
              <input
                type="text"
                placeholder="e.g. 742 Evergreen Terrace"
                {...register("address")}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-100 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact Info</label>
              <input
                type="text"
                placeholder="e.g. John Jenkins (+1 555-019-2835)"
                {...register("emergencyContact")}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-100 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 2: Body Measurements */}
        {step === 2 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" /> Body Dimensions
            </h3>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Height (cm) *</label>
                <input
                  type="number"
                  placeholder="e.g. 168"
                  {...register("height", { required: "Height is required", min: 1 })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Current Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 68.5"
                  {...register("currentWeight", { required: "Weight is required", min: 1 })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Target Weight (kg) *</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 60.0"
                  {...register("targetWeight", { required: "Target weight is required", min: 1 })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Body Mass Index (BMI)</label>
                <input
                  type="text"
                  placeholder="Auto-calculated"
                  {...register("bmi")}
                  disabled
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-100 dark:bg-zinc-900 text-slate-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Body Fat %</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 26.5"
                  {...register("bodyFat")}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            {/* Circumferences */}
            <div className="border-t border-slate-100 dark:border-zinc-800/40 pt-4 mt-2">
              <span className="text-xs font-semibold text-slate-500 block mb-3">Tape Measurements (Optional)</span>
              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Chest (cm)</label>
                  <input type="number" {...register("chest")} className="w-full px-2.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-slate-50 text-center" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Waist (cm)</label>
                  <input type="number" {...register("waist")} className="w-full px-2.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-slate-50 text-center" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Arms (cm)</label>
                  <input type="number" {...register("arms")} className="w-full px-2.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-slate-50 text-center" />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Thigh (cm)</label>
                  <input type="number" {...register("thigh")} className="w-full px-2.5 py-2 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-slate-50 text-center" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Medical Information */}
        {step === 3 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" /> Medical Background
            </h3>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Conditions</label>
              <textarea
                placeholder="e.g. Mild asthma, cardiac risk history, hypertension, etc."
                {...register("medicalConditions")}
                rows={2}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Allergies</label>
              <textarea
                placeholder="e.g. Food allergies, penicillin, nuts, latex..."
                {...register("allergies")}
                rows={2}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Injuries (Past / Current)</label>
              <textarea
                placeholder="e.g. Lower back stiffness, knee meniscus tear history..."
                {...register("injuries")}
                rows={2}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
              />
            </div>

            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Personal Trainer Private Notes</label>
              <textarea
                placeholder="Core focus notes, motivational details..."
                {...register("trainerNotes")}
                rows={3}
                className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
              />
            </div>
          </div>
        )}

        {/* STEP 4: Membership Plan */}
        {step === 4 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-500" /> Membership Tier Configuration
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Plan Tier</label>
                <select
                  {...register("membership")}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-850 dark:text-zinc-100 focus:outline-none"
                >
                  {settings.membershipPlans.map((p) => (
                    <option key={p.id} value={p.name}>
                      {p.name} (${p.fee}/mo)
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Monthly Subscription Fee ($)</label>
                <input
                  type="number"
                  {...register("monthlyFees", { required: true, min: 1 })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Membership Join Date</label>
                <input
                  type="date"
                  {...register("joinDate", { required: true })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Membership Expiry Date</label>
                <input
                  type="date"
                  {...register("expiryDate", { required: true })}
                  className="w-full px-3.5 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-800 focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* STEP 5: Fitness Goal Selection */}
        {step === 5 && (
          <div className="space-y-4 animate-in fade-in duration-200">
            <h3 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-2">
              <Target className="w-4 h-4 text-blue-500" /> Fitness Target Definition
            </h3>
            <p className="text-slate-400 dark:text-zinc-500 text-xs mb-4">
              Selecting the primary objective pre-configures recommended diet logs and workout cycles.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {goals.map((g) => {
                const Icon = g.icon;
                const isSelected = watch("goal") === g.name;

                return (
                  <button
                    key={g.name}
                    type="button"
                    onClick={() => setValue("goal", g.name)}
                    className={`flex items-start text-left p-4 rounded-xl border transition-all cursor-pointer ${
                      isSelected
                        ? "border-blue-600 bg-blue-500/10 shadow-sm"
                        : "border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700 bg-slate-50/30 dark:bg-zinc-900/30"
                    }`}
                  >
                    <div className={`p-2.5 rounded-xl border ${g.color} shrink-0 mr-4 mt-0.5`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 dark:text-zinc-200">{g.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-snug">{g.desc}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Navigation Buttons inside forms */}
        <div className="flex gap-3 mt-8 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBackStep}
              className="flex items-center justify-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-700 dark:text-zinc-300 hover:bg-slate-50 transition cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back</span>
            </button>
          )}

          {step < 5 ? (
            <button
              type="button"
              onClick={handleNextStep}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition ml-auto cursor-pointer"
            >
              <span>Continue</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="submit"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow-sm transition ml-auto cursor-pointer"
            >
              <Check className="w-4 h-4" />
              <span>Enroll Athlete</span>
            </button>
          )}
        </div>

      </form>
    </div>
  );
};

export default AddClient;
