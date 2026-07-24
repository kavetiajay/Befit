import React, { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  User,
  Scale,
  Dumbbell,
  Apple,
  CalendarCheck,
  CreditCard,
  TrendingUp,
  FileText,
  Plus,
  Printer,
  Trash2,
  Edit,
  Activity,
  Calculator,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Moon,
  Droplets,
  Coffee,
  Sparkles,
  ClipboardList,
  CheckCircle,
  Clock,
  XCircle,
  FileDown,
  Mail,
  Phone,
  HeartPulse
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Cell
} from "recharts";
import { useCRM } from "../context/CRMContext";
import { toast } from "sonner";

const ClientProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const {
    clients,
    workouts,
    diets,
    attendance,
    payments,
    measurements,
    updateClient,
    updateWorkout,
    duplicateWorkoutWeek,
    updateDiet,
    applyDietTemplatePreset,
    markClientAttendance,
    recordClientPayment,
    settings
  } = useCRM();

  // Find active client
  const client = useMemo(() => clients.find((c) => c.id === id), [clients, id]);

  // Tab State (Overview, Workout, Diet, Attendance, Payments, Progress)
  const [activeTab, setActiveTab] = useState("overview");

  // Accordion toggle states for Workouts split
  const [expandedWorkoutDays, setExpandedWorkoutDays] = useState({
    monday: true,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });

  const toggleWorkoutDay = (day) => {
    setExpandedWorkoutDays(prev => ({
      ...prev,
      [day.toLowerCase()]: !prev[day.toLowerCase()]
    }));
  };

  // Accordion toggle states for Diets split
  const [expandedDietDays, setExpandedDietDays] = useState({
    monday: true,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });

  const toggleDietDay = (day) => {
    setExpandedDietDays(prev => ({
      ...prev,
      [day.toLowerCase()]: !prev[day.toLowerCase()]
    }));
  };

  // Sub-states for modals
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [newMeasure, setNewMeasure] = useState({
    weight: "", bodyFat: "", chest: "", waist: "", arms: "", thigh: ""
  });

  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("monday");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [restTime, setRestTime] = useState("");
  const [duration, setDuration] = useState("");
  const [dayNotes, setDayNotes] = useState("");
  const [dayExercises, setDayExercises] = useState([]);

  const [dietModalOpen, setDietModalOpen] = useState(false);
  const [dietDay, setDietDay] = useState("monday");
  const [dietMealKey, setDietMealKey] = useState("breakfast");
  const [dietMealInput, setDietMealInput] = useState({
    meal: "", quantity: "", calories: "", protein: "", carbs: "", fat: "", waterIntake: "", supplements: "", notes: ""
  });

  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentInput, setPaymentInput] = useState({
    amount: "", method: "Credit Card", status: "Paid"
  });

  const [activeInvoice, setActiveInvoice] = useState(null);

  const [notesText, setNotesText] = useState(client ? client.trainerNotes || "" : "");
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editFormData, setEditFormData] = useState(client ? { ...client } : {});

  React.useEffect(() => {
    if (client) {
      setEditFormData({ ...client });
      setNotesText(client.trainerNotes || "");
    }
  }, [client]);

  const handleEditSubmit = (e) => {
    e.preventDefault();
    updateClient(client.id, editFormData);
    toast.success("Personal profile details updated!");
    setEditModalOpen(false);
  };

  if (!client) {
    return (
      <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl shadow-sm">
        <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">Client Not Found</h3>
        <button
          onClick={() => navigate("/clients")}
          className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
        >
          Return to Client Directory
        </button>
      </div>
    );
  }

  // --- STATS COMPUTATION ---
  const clientMeasurements = measurements[client.id] || [];
  const clientWorkouts = workouts[client.id] || {};
  const clientDiet = diets[client.id] || {};
  const clientAttendance = attendance.filter((a) => a.clientId === client.id);
  const clientPayments = payments.filter((p) => p.clientId === client.id);

  // Attendance Percentage
  const attendanceRate = (() => {
    if (clientAttendance.length === 0) return 85; // realistic fallback rate
    const present = clientAttendance.filter((a) => a.status === "Present" || a.status === "Late").length;
    return Math.round((present / clientAttendance.length) * 100);
  })();

  // Weight Trend Data
  const weightTrendData = clientMeasurements.map((m) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    Weight: m.weight,
    BodyFat: m.bodyFat
  }));

  // Calculate Progress towards Target Weight
  const weightProgressPercent = (() => {
    const current = client.currentWeight;
    const target = client.targetWeight;
    const initial = clientMeasurements[0]?.weight || current;

    if (initial === target) return 100;
    const totalDiff = Math.abs(initial - target);
    const currentDiff = Math.abs(initial - current);
    
    const progress = totalDiff > 0 ? (currentDiff / totalDiff) * 100 : 100;
    return Math.min(Math.max(Math.round(progress), 0), 100);
  })();

  // Calorie Target based on Goal
  const calorieTarget = (() => {
    if (client.goal === "Weight Loss" || client.goal === "Fat Loss") return 1800;
    if (client.goal === "Muscle Gain" || client.goal === "Weight Gain" || client.goal === "Strength Training") return 2800;
    return 2200;
  })();

  // Calculate Calorie and macros summaries for a day
  const getDayDietTotals = (dayKey) => {
    const meals = clientDiet[dayKey] || {};
    let cal = 0, p = 0, c = 0, f = 0, water = 0;
    Object.values(meals).forEach((m) => {
      if (m) {
        cal += parseFloat(m.calories) || 0;
        p += parseFloat(m.protein) || 0;
        c += parseFloat(m.carbs) || 0;
        f += parseFloat(m.fat) || 0;
        water += parseFloat(m.waterIntake) || 0;
      }
    });
    return { cal, p, c, f, water };
  };

  // --- ACTIONS ---

  // Measurement Submit
  const handleAddMeasurement = (e) => {
    e.preventDefault();
    if (!newMeasure.weight) {
      toast.warning("Weight value is required.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const newPoint = {
      date: today,
      weight: parseFloat(newMeasure.weight),
      bmi: (parseFloat(newMeasure.weight) / ((client.height / 100) * (client.height / 100))).toFixed(1),
      bodyFat: parseFloat(newMeasure.bodyFat) || client.bodyFat,
      chest: parseFloat(newMeasure.chest) || client.chest,
      waist: parseFloat(newMeasure.waist) || client.waist,
      arms: parseFloat(newMeasure.arms) || client.arms,
      thigh: parseFloat(newMeasure.thigh) || client.thigh
    };

    updateClient(client.id, {
      currentWeight: newPoint.weight,
      bodyFat: newPoint.bodyFat,
      bmi: newPoint.bmi,
      chest: newPoint.chest,
      waist: newPoint.waist,
      arms: newPoint.arms,
      thigh: newPoint.thigh
    });

    toast.success("New measurements recorded successfully.");
    setMeasurementModalOpen(false);
    setNewMeasure({ weight: "", bodyFat: "", chest: "", waist: "", arms: "", thigh: "" });
  };

  // Update exercise completion status
  const handleUpdateExerciseStatus = (day, exerciseIdx, newStatus) => {
    const wDay = clientWorkouts[day.toLowerCase()] || {};
    const exercises = wDay.exercises ? [...wDay.exercises] : [];
    if (exercises[exerciseIdx]) {
      exercises[exerciseIdx] = {
        ...exercises[exerciseIdx],
        status: newStatus
      };
      updateWorkout(
        client.id,
        day,
        wDay.muscleGroup || getDayGoalName(day),
        wDay.restTime || "60s",
        wDay.duration || "45m",
        wDay.notes || "",
        exercises
      );
      toast.success(`Exercise marked as ${newStatus}`);
    }
  };

  // Workout Edit Actions
  const handleEditWorkoutDay = (day) => {
    const wDay = clientWorkouts[day.toLowerCase()] || {};
    setSelectedDay(day);
    setMuscleGroup(wDay.muscleGroup || getDayGoalName(day));
    setRestTime(wDay.restTime || "60s");
    setDuration(wDay.duration || "45 min");
    setDayNotes(wDay.notes || "");
    setDayExercises(wDay.exercises ? wDay.exercises.map(ex => ({ status: "Pending", ...ex })) : []);
    setWorkoutModalOpen(true);
  };

  const handleAddExerciseRow = () => {
    setDayExercises([...dayExercises, { name: "", sets: "", reps: "", weight: "", restTime: "60s", status: "Pending" }]);
  };

  const handleRemoveExerciseRow = (idx) => {
    setDayExercises(dayExercises.filter((_, i) => i !== idx));
  };

  const handleExerciseChange = (idx, field, val) => {
    setDayExercises(
      dayExercises.map((ex, i) => (i === idx ? { ...ex, [field]: val } : ex))
    );
  };

  const handleSaveWorkoutDay = (e) => {
    e.preventDefault();
    updateWorkout(client.id, selectedDay, muscleGroup, restTime, duration, dayNotes, dayExercises);
    toast.success(`Workout schedule for ${selectedDay} updated.`);
    setWorkoutModalOpen(false);
  };

  // Diet Edit Actions
  const handleEditDietMeal = (day, mealKey) => {
    const meals = clientDiet[day.toLowerCase()] || {};
    const mealItem = meals[mealKey] || {};
    setDietDay(day);
    setDietMealKey(mealKey);
    setDietMealInput({
      meal: mealItem.meal || "",
      quantity: mealItem.quantity || "",
      calories: mealItem.calories || "",
      protein: mealItem.protein || "",
      carbs: mealItem.carbs || "",
      fat: mealItem.fat || "",
      waterIntake: mealItem.waterIntake || "",
      supplements: mealItem.supplements || "",
      notes: mealItem.notes || ""
    });
    setDietModalOpen(true);
  };

  const handleSaveDietMeal = (e) => {
    e.preventDefault();
    updateDiet(client.id, dietDay, dietMealKey, {
      meal: dietMealInput.meal,
      quantity: dietMealInput.quantity,
      calories: parseFloat(dietMealInput.calories) || 0,
      protein: parseFloat(dietMealInput.protein) || 0,
      carbs: parseFloat(dietMealInput.carbs) || 0,
      fat: parseFloat(dietMealInput.fat) || 0,
      waterIntake: parseFloat(dietMealInput.waterIntake) || 0,
      supplements: dietMealInput.supplements,
      notes: dietMealInput.notes
    });
    toast.success(`Meal detail for ${dietMealKey} on ${dietDay} updated.`);
    setDietModalOpen(false);
  };

  const handleApplyDietTemplate = (templateName) => {
    applyDietTemplatePreset(client.id, templateName);
    toast.success(`Loaded ${templateName} template diet plan.`);
  };

  // Payment Recorder
  const handleRecordPayment = (e) => {
    e.preventDefault();
    if (!paymentInput.amount) {
      toast.warning("Amount is required.");
      return;
    }
    recordClientPayment({
      clientId: client.id,
      clientName: client.name,
      amount: parseFloat(paymentInput.amount),
      method: paymentInput.method,
      status: paymentInput.status,
      membershipPlan: client.membership
    });
    toast.success(`Recorded fee payment of ₹${paymentInput.amount}.`);
    setPaymentModalOpen(false);
    setPaymentInput({ amount: "", method: "Credit Card", status: "Paid" });
  };

  const handleNotesSave = () => {
    updateClient(client.id, { trainerNotes: notesText });
    toast.success("Trainer private notes saved.");
  };

  const getDayGoalName = (day) => {
    const splits = {
      monday: "Chest",
      tuesday: "Back",
      wednesday: "Legs",
      thursday: "Shoulders",
      friday: "Arms",
      saturday: "Cardio",
      sunday: "Rest"
    };
    return splits[day.toLowerCase()] || "Training";
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      
      {/* --- DESKTOP PROFILE BANNER --- */}
      <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 relative overflow-hidden no-print text-left">
        
        <div className="absolute right-0 top-0 w-32 h-32 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center gap-4">
          <img
            src={client.photo}
            alt={client.name}
            className="w-16 h-16 rounded-full object-cover border-2 border-slate-200 dark:border-zinc-800 shadow-md bg-slate-100"
          />
          <div>
            <h1 className="text-xl font-bold font-display text-slate-800 dark:text-zinc-50 leading-tight">
              {client.name}
            </h1>
            <p className="text-xs text-slate-400 dark:text-zinc-500 mt-0.5">
              Goal: <span className="font-semibold text-slate-600 dark:text-zinc-350">{client.goal}</span>
            </p>
            <div className="flex items-center gap-2 mt-2">
              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                client.status === "Active" ? "bg-emerald-500/10 text-emerald-500" :
                client.status === "Pending Payment" ? "bg-amber-500/10 text-amber-500" :
                "bg-red-500/10 text-red-500"
              }`}>
                {client.status}
              </span>
              <span className="text-[10px] font-medium text-slate-400 dark:text-zinc-500">
                Plan: {client.membership}
              </span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0 w-full md:w-auto">
          <button
            onClick={() => {
              setEditFormData({ ...client });
              setEditModalOpen(true);
            }}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition"
          >
            <Edit className="w-3.5 h-3.5" />
            <span>Edit Profile</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex-1 md:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 dark:hover:bg-zinc-850 cursor-pointer transition"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Profile</span>
          </button>
        </div>
      </div>

      {/* Tabs Selector Bar (Overview, Workout, Diet, Attendance, Payments, Progress) */}
      <div className="flex border-b border-slate-200 dark:border-zinc-800 overflow-x-auto gap-2 scrollbar-none no-print">
        {[
          { id: "overview", label: "Overview", icon: User },
          { id: "workout", label: "Workout", icon: Dumbbell },
          { id: "diet", label: "Diet", icon: Apple },
          { id: "attendance", label: "Attendance", icon: CalendarCheck },
          { id: "payments", label: "Payments", icon: CreditCard },
          { id: "progress", label: "Progress", icon: TrendingUp }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 font-semibold text-xs border-b-2 whitespace-nowrap transition cursor-pointer ${
                isActive
                  ? "border-blue-600 text-blue-600 dark:text-blue-400"
                  : "border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-zinc-300"
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* --- TAB CONTENT SHEETS --- */}
      <div className="no-print">
        
        {/* 1. OVERVIEW TAB */}
        {activeTab === "overview" && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Profile Details Block */}
              <div className="lg:col-span-2 space-y-6">
                
                {/* Metrics Stats Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {[
                    { name: "Age / Gender", val: `${client.age} yrs / ${client.gender}`, sub: "General status", color: "text-blue-500" },
                    { name: "Height / Weight", val: `${client.height}cm / ${client.currentWeight}kg`, sub: `Goal: ${client.targetWeight}kg`, color: "text-teal-500" },
                    { name: "BMI", val: client.bmi, sub: client.bmi > 25 ? "Overweight" : "Normal", color: "text-amber-500" },
                    { name: "Body Fat / Blood", val: `${client.bodyFat}% / ${client.bloodGroup || "O+"}`, sub: "Tape & diagnostics", color: "text-rose-500" }
                  ].map((stat, i) => (
                    <div key={i} className="p-4 rounded-2xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex flex-col justify-between h-28 shadow-sm">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{stat.name}</span>
                      <div>
                        <h4 className="text-base sm:text-lg font-black text-slate-800 dark:text-zinc-200 leading-none mt-1">{stat.val}</h4>
                        <p className="text-[10px] text-slate-400 mt-1">{stat.sub}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Progress Bar Roadmap */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                      <TrendingUp className="w-4 h-4 text-blue-500" /> Goal Weight Progress Roadmap
                    </h3>
                    <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 dark:bg-blue-900/10 px-2 py-0.5 rounded-lg">{client.goal}</span>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs font-bold text-slate-700 dark:text-zinc-350">
                      <span>Weight Goal Accomplishment</span>
                      <span>{weightProgressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-600 rounded-full transition-all duration-500" style={{ width: `${weightProgressPercent}%` }} />
                    </div>
                    <p className="text-[10px] text-slate-400 mt-1">
                      Current weight of {client.currentWeight}kg is {Math.abs(client.currentWeight - client.targetWeight).toFixed(1)}kg away from objective target weight of {client.targetWeight}kg.
                    </p>
                  </div>
                </div>

                {/* Private Notes block */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-1.5 border-b border-slate-50 dark:border-zinc-850 pb-2">
                    <FileText className="w-4 h-4 text-blue-500" />
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">Trainer Private Log Notes</h3>
                  </div>
                  <textarea
                    rows={4}
                    value={notesText}
                    onChange={(e) => setNotesText(e.target.value)}
                    className="w-full p-3.5 text-xs border border-slate-200 dark:border-zinc-800 rounded-2xl bg-slate-50/50 dark:bg-zinc-950 text-slate-800 dark:text-zinc-150 focus:outline-none"
                    placeholder="Record notes on athlete commitments, injuries, specific targets..."
                  />
                  <button
                    onClick={handleNotesSave}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow cursor-pointer transition"
                  >
                    Save Notes
                  </button>
                </div>

              </div>

              {/* Personal Contacts & Info Column */}
              <div className="space-y-6">
                
                {/* Contact Card */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                    <HeartPulse className="w-4 h-4 text-blue-500" /> Contact & Emergency Info
                  </h3>
                  <div className="space-y-3.5 text-xs">
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                      <span className="text-slate-400">Phone</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200">{client.phone}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                      <span className="text-slate-400">Email</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 truncate max-w-[170px]">{client.email || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                      <span className="text-slate-400">Address</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 text-right max-w-[170px] truncate" title={client.address}>{client.address || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                      <span className="text-slate-400">Emergency contact</span>
                      <span className="font-semibold text-slate-800 dark:text-zinc-200 text-right max-w-[170px] truncate" title={client.emergencyContact}>{client.emergencyContact || "—"}</span>
                    </div>
                    <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                      <span className="text-slate-400">Medical notes</span>
                      <span className="font-semibold text-red-500 text-right max-w-[170px] truncate" title={client.medicalConditions}>{client.medicalConditions || "None"}</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-slate-400">Assigned Trainer</span>
                      <span className="font-bold text-slate-700 dark:text-zinc-350">{client.assignedTrainer || settings.trainerName || "Coach Marcus"}</span>
                    </div>
                  </div>
                </div>

                {/* Membership Details */}
                <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-3.5 text-xs">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-emerald-500" /> Plan & Registration Detail
                  </h3>
                  <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                    <span className="text-slate-405">Membership Tier</span>
                    <span className="font-extrabold text-slate-700 dark:text-zinc-300">{client.membership}</span>
                  </div>
                  <div className="flex justify-between border-b border-slate-50 dark:border-zinc-850/60 pb-2">
                    <span className="text-slate-405">Registration Date</span>
                    <span className="font-semibold text-slate-700 dark:text-zinc-300">{client.joinDate}</span>
                  </div>
                  <div className="flex justify-between pb-1">
                    <span className="text-slate-405">Expiry Date</span>
                    <span className="font-bold text-rose-500">{client.expiryDate || "—"}</span>
                  </div>
                </div>

              </div>

            </div>
          </div>
        )}

        {/* 2. WORKOUT TAB */}
        {activeTab === "workout" && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center pb-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">Weekly Workout Program</h3>
                <p className="text-slate-400 text-xs">Configure training routines and muscle splits</p>
              </div>
              <button
                onClick={() => handleSaveWorkoutDay({ preventDefault: () => {} })} // dummy trigger
                className="hidden sm:inline-block px-4 py-2 border border-slate-200 dark:border-zinc-800 hover:bg-slate-50 dark:hover:bg-zinc-850 rounded-xl text-xs font-bold text-slate-650 cursor-pointer"
              >
                Duplicate Routine Week
              </button>
            </div>

            <div className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                const wDay = clientWorkouts[day.toLowerCase()] || { muscleGroup: getDayGoalName(day), exercises: [], notes: "", duration: "45m", restTime: "60s" };
                const isRest = day.toLowerCase() === "sunday" || wDay.muscleGroup.toLowerCase() === "rest";
                const isExpanded = expandedWorkoutDays[day.toLowerCase()];
                const exercises = wDay.exercises || [];

                // Counts
                const completedCount = exercises.filter(ex => ex.status === "Completed").length;

                return (
                  <div key={day} className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
                    
                    {/* Header */}
                    <div
                      onClick={() => toggleWorkoutDay(day)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${
                          isRest ? "bg-purple-500/10 text-purple-600" : "bg-blue-500/10 text-blue-600"
                        }`}>
                          {isRest ? <Moon className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</span>
                            {!isRest && exercises.length > 0 && (
                              <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-500 font-extrabold px-2 py-0.2 rounded-full">
                                {completedCount} / {exercises.length} Completed
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-805 dark:text-zinc-150 mt-0.5">
                            {isRest ? "Rest & Cellular Recovery" : `${getDayGoalName(day)} split: ${wDay.muscleGroup}`}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isRest && (
                          <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 px-2 py-1 rounded-xl">
                            {wDay.duration || "45m"} • {wDay.restTime || "60s"} rest
                          </span>
                        )}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleEditWorkoutDay(day); }}
                          className="p-1.5 hover:bg-slate-50 dark:hover:bg-zinc-800 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-zinc-800/40">
                        {isRest ? (
                          <div className="p-6 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/10 dark:to-indigo-950/10 rounded-2xl border border-purple-100/30 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="space-y-1">
                              <span className="text-[9px] bg-purple-500/10 text-purple-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Rest Block</span>
                              <h5 className="text-sm font-bold text-slate-805 dark:text-zinc-200 mt-1">Muscle Protein Synthesis & Decompression</h5>
                              <p className="text-xs text-slate-500 max-w-md">Sundays are dedicated to complete physiological recovery, stretching, hydration, and cellular repair.</p>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-1.5 text-xs text-slate-500 w-full sm:w-auto">
                              <span className="font-extrabold text-slate-700 block border-b pb-1 mb-1 text-[9px] uppercase tracking-wide">Sunday Checklist</span>
                              <div>• 20-min stretching & foam roll</div>
                              <div>• 4L hydration load</div>
                              <div>• 8+ hours restorative sleep</div>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {exercises.length > 0 ? (
                              <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs border-collapse">
                                  <thead>
                                    <tr className="border-b border-slate-100 dark:border-zinc-850 pb-2 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                      <th className="py-2.5">Exercise Name</th>
                                      <th className="py-2.5 text-center">Sets</th>
                                      <th className="py-2.5 text-center">Reps</th>
                                      <th className="py-2.5 text-center">Weight</th>
                                      <th className="py-2.5 text-center">Rest Time</th>
                                      <th className="py-2.5 text-right">Completion Status</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-slate-50 dark:divide-zinc-850/50">
                                    {exercises.map((ex, idx) => (
                                      <tr key={idx} className="hover:bg-slate-50/20 dark:hover:bg-zinc-850/10">
                                        <td className="py-3 font-bold text-slate-800 dark:text-zinc-200">{ex.name}</td>
                                        <td className="py-3 text-center font-semibold">{ex.sets}</td>
                                        <td className="py-3 text-center text-slate-500">{ex.reps}</td>
                                        <td className="py-3 text-center font-bold text-slate-800 dark:text-zinc-200">{ex.weight || "—"}</td>
                                        <td className="py-3 text-center text-slate-500">{ex.restTime || "60s"}</td>
                                        <td className="py-3 text-right">
                                          <div className="flex gap-1 justify-end shrink-0">
                                            {[
                                              { status: "Pending", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" },
                                              { status: "Completed", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" },
                                              { status: "Skipped", bg: "bg-rose-500/10 text-rose-500 border-rose-500/20" }
                                            ].map((btn) => {
                                              const isCurrent = (ex.status || "Pending") === btn.status;
                                              return (
                                                <button
                                                  key={btn.status}
                                                  onClick={() => handleUpdateExerciseStatus(day, idx, btn.status)}
                                                  className={`px-2 py-0.5 rounded-lg text-[9px] font-black border transition cursor-pointer ${
                                                    isCurrent 
                                                      ? btn.status === "Pending" ? "bg-amber-500 text-white border-transparent" :
                                                        btn.status === "Completed" ? "bg-emerald-600 text-white border-transparent" :
                                                        "bg-rose-600 text-white border-transparent"
                                                      : `bg-slate-50 dark:bg-zinc-950 border-slate-200 dark:border-zinc-850/65 text-slate-400 ${btn.bg}`
                                                  }`}
                                                >
                                                  {btn.status}
                                                </button>
                                              );
                                            })}
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            ) : (
                              <div className="py-6 text-center text-xs text-slate-400 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                                No exercises populated. Click edit button to set this schedule.
                              </div>
                            )}
                            {wDay.notes && (
                              <div className="p-3 bg-slate-50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-850/60 rounded-xl text-xs text-slate-500 italic">
                                <strong>Trainer notes:</strong> "{wDay.notes}"
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 3. DIET TAB */}
        {activeTab === "diet" && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">Dietary Intake Program</h3>
                <p className="text-slate-400 text-xs">Review food logs, macro breakdown and calorie charts</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleApplyDietTemplate("Weight Loss")}
                  className="px-3 py-1.5 border border-slate-205 dark:border-zinc-800 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600"
                >
                  Load Weight Loss
                </button>
                <button
                  onClick={() => handleApplyDietTemplate("Muscle Gain")}
                  className="px-3 py-1.5 border border-slate-205 dark:border-zinc-800 hover:bg-slate-50 rounded-xl text-xs font-bold text-slate-600"
                >
                  Load Muscle Gain
                </button>
              </div>
            </div>

            {/* Daily Summary Analytics & Weekly Diet Progress */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* Daily overview */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm space-y-4">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 flex items-center gap-1.5 border-b pb-2">
                  <Apple className="w-4.5 h-4.5 text-emerald-500" /> Daily Target (Calorie Summary)
                </h3>
                
                {/* Micro metrics */}
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50">
                    <span className="text-[9px] text-slate-400 block font-bold">PROTEIN</span>
                    <span className="font-extrabold text-emerald-600 mt-0.5 block">{getDayDietTotals("monday").p}g</span>
                  </div>
                  <div className="p-2 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50">
                    <span className="text-[9px] text-slate-400 block font-bold">CARBS</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{getDayDietTotals("monday").c}g</span>
                  </div>
                  <div className="p-2 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50">
                    <span className="text-[9px] text-slate-400 block font-bold">FAT</span>
                    <span className="font-extrabold text-slate-700 mt-0.5 block">{getDayDietTotals("monday").f}g</span>
                  </div>
                </div>

                <div className="flex justify-between text-xs font-bold pt-1">
                  <span className="text-slate-400">Monday Calorie Summary</span>
                  <span className="text-slate-800 dark:text-zinc-200">{getDayDietTotals("monday").cal} / {calorieTarget} kcal</span>
                </div>
                <div className="w-full h-2 bg-slate-100 dark:bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${Math.min(Math.round((getDayDietTotals("monday").cal / calorieTarget) * 100), 100)}%` }} />
                </div>
              </div>

              {/* Weekly Diet Progress (Calorie targets checklist) */}
              <div className="lg:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-450 mb-4 flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-500" /> Weekly Diet Progress Tracker
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-3 text-center">
                  {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                    const totals = getDayDietTotals(day.toLowerCase());
                    const pct = calorieTarget > 0 ? Math.min(Math.round((totals.cal / calorieTarget) * 100), 100) : 0;
                    return (
                      <div key={day} className="p-2.5 border border-slate-100 dark:border-zinc-850 rounded-xl bg-slate-50/50 flex flex-col justify-between h-20">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight block">{day.slice(0, 3)}</span>
                        <span className="text-xs font-extrabold text-slate-800 dark:text-zinc-200 block mt-1">{totals.cal} cal</span>
                        <div className="w-full h-1 bg-slate-250 dark:bg-zinc-800 rounded-full overflow-hidden mt-1.5">
                          <div className="h-full bg-emerald-500" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Daily meals configuration details */}
            <div className="space-y-4">
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
                const dayMeals = clientDiet[day.toLowerCase()] || {};
                const isRest = day.toLowerCase() === "sunday";
                const isExpanded = expandedDietDays[day.toLowerCase()];

                const mealsConfig = [
                  { key: "breakfast", label: "Breakfast" },
                  { key: "lunch", label: "Lunch" },
                  { key: "snack", label: "Snack / Evening" },
                  { key: "dinner", label: "Dinner" }
                ];

                return (
                  <div key={day} className="bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition">
                    
                    {/* Header */}
                    <div
                      onClick={() => toggleDietDay(day)}
                      className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/30 select-none"
                    >
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-2xl ${
                          isRest ? "bg-emerald-500/10 text-emerald-600" : "bg-orange-500/10 text-orange-600"
                        }`}>
                          {isRest ? <Coffee className="w-5 h-5" /> : <Apple className="w-5 h-5" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{day}</span>
                            {!isRest && (
                              <span className="text-[9px] bg-slate-100 dark:bg-zinc-800 text-slate-505 font-extrabold px-2 py-0.2 rounded-full">
                                {getDayDietTotals(day.toLowerCase()).cal} kcal
                              </span>
                            )}
                          </div>
                          <h4 className="text-base font-black text-slate-805 dark:text-zinc-150 mt-0.5">
                            {isRest ? "Sunday Recovery & Hydration Balance" : `${client.goal} Diet Split`}
                          </h4>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {!isRest && (
                          <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 border border-slate-100 dark:border-zinc-800 px-2 py-1 rounded-xl">
                            P: {getDayDietTotals(day.toLowerCase()).p}g • C: {getDayDietTotals(day.toLowerCase()).c}g • F: {getDayDietTotals(day.toLowerCase()).f}g
                          </span>
                        )}
                        <div className="text-slate-400 p-1">
                          {isExpanded ? <ChevronUp className="w-4.5 h-4.5" /> : <ChevronDown className="w-4.5 h-4.5" />}
                        </div>
                      </div>
                    </div>

                    {/* Content */}
                    {isExpanded && (
                      <div className="px-5 pb-5 pt-1 border-t border-slate-100 dark:border-zinc-800/40">
                        {isRest ? (
                          <div className="p-6 bg-gradient-to-br from-emerald-50/50 to-teal-50/50 dark:from-emerald-950/10 dark:to-teal-950/10 border border-emerald-100/30 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-6">
                            <div className="space-y-1">
                              <span className="text-[9px] bg-emerald-500/10 text-emerald-600 font-extrabold px-2.5 py-0.5 rounded-full uppercase">Nutritional Reset</span>
                              <h5 className="text-sm font-bold text-slate-805 dark:text-zinc-200 mt-1">Decompression & Alkalinity Loading</h5>
                              <p className="text-xs text-slate-505 dark:text-zinc-400">Prioritize clear soups, raw greens, coconut water, lemons, and low protein loading to decompress liver/kidneys.</p>
                              <div className="pt-2 flex flex-wrap gap-1.5 text-[10px]">
                                <span className="bg-white/80 dark:bg-zinc-950 border px-2.5 py-1 rounded-lg">💧 Target: 4.5 Liters</span>
                                <span className="bg-white/80 dark:bg-zinc-950 border px-2.5 py-1 rounded-lg">🍵 Detox lemon warm tea</span>
                              </div>
                            </div>
                            <div className="p-3.5 bg-white dark:bg-zinc-950 border border-slate-100 dark:border-zinc-850 rounded-xl space-y-2 text-xs min-w-[200px]">
                              <span className="font-extrabold text-slate-800 block border-b pb-1 text-[9px] uppercase tracking-wide">Sunday Recovery Meals</span>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Breakfast:</span>
                                <span className="font-bold text-slate-600">Fresh fruits & oats</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-slate-400">Lunch:</span>
                                <span className="font-bold text-slate-600">Quinoa & Veg salad</span>
                              </div>
                            </div>
                          </div>
                        ) : (
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                            {mealsConfig.map((meal) => {
                              // map snack and fallback elements
                              const mealKey = meal.key === "snack" ? "eveningSnack" : meal.key;
                              const loggedMeal = dayMeals[mealKey] || {};
                              const hasFood = loggedMeal.meal;
                              return (
                                <div
                                  key={meal.key}
                                  onClick={() => handleEditDietMeal(day, mealKey)}
                                  className="group p-4 border border-slate-150/60 dark:border-zinc-800 hover:border-blue-500 rounded-2xl bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900 cursor-pointer transition flex flex-col justify-between min-h-[140px]"
                                >
                                  <div>
                                    <div className="flex justify-between items-center border-b border-slate-100 dark:border-zinc-850 pb-1.5 mb-2">
                                      <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{meal.label}</span>
                                      {loggedMeal.waterIntake > 0 && (
                                        <span className="flex items-center gap-0.5 text-[8.5px] bg-blue-500/10 text-blue-500 px-1 py-0.2 rounded font-extrabold">
                                          <Droplets className="w-2.5 h-2.5" />
                                          <span>{loggedMeal.waterIntake}L</span>
                                        </span>
                                      )}
                                    </div>
                                    {hasFood ? (
                                      <div className="space-y-1">
                                        <p className="text-xs font-bold text-slate-805 dark:text-zinc-200 leading-tight">{loggedMeal.meal}</p>
                                        {loggedMeal.quantity && <span className="text-[9.5px] text-slate-400 block">Qty: {loggedMeal.quantity}</span>}
                                        {loggedMeal.supplements && <span className="text-[9.5px] text-emerald-600 block">Supp: {loggedMeal.supplements}</span>}
                                      </div>
                                    ) : (
                                      <span className="text-xs text-slate-350 italic font-medium block">Add meal log...</span>
                                    )}
                                  </div>

                                  {hasFood && (
                                    <div className="border-t border-slate-100 dark:border-zinc-850 pt-2 mt-3 flex justify-between items-center text-[9px]">
                                      <span className="font-extrabold text-slate-750">{loggedMeal.calories} kcal</span>
                                      <div className="flex gap-1 text-slate-400 font-bold uppercase">
                                        <span>P:{loggedMeal.protein}g</span>
                                        <span>C:{loggedMeal.carbs}g</span>
                                        <span>F:{loggedMeal.fat}g</span>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}

                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 4. ATTENDANCE TAB */}
        {activeTab === "attendance" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 animate-in fade-in duration-200 text-left">
            <div className="space-y-6">
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-6 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center mx-auto mb-3 font-semibold text-lg">
                  {attendanceRate}%
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">Attendance Percentage</h3>
                <p className="text-slate-400 text-xs mt-1">Calculated from total registered logs.</p>
              </div>

              {/* Quick Logger */}
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4 flex items-center gap-1.5">
                  <CalendarCheck className="w-4 h-4 text-blue-500" /> Log Today's Entry
                </h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Check In Time</label>
                    <input
                      id="today-time-in-prof"
                      type="text"
                      defaultValue="08:00 AM"
                      className="w-full px-3 py-2 text-xs border border-slate-200 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => {
                        const time = document.getElementById("today-time-in-prof").value;
                        const today = new Date().toISOString().split("T")[0];
                        markClientAttendance(client.id, today, "Present", time);
                        toast.success("Marked client as Present.");
                      }}
                      className="py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-semibold shadow cursor-pointer"
                    >
                      Present
                    </button>
                    <button
                      onClick={() => {
                        const today = new Date().toISOString().split("T")[0];
                        markClientAttendance(client.id, today, "Absent", "-");
                        toast.error("Marked client as Absent.");
                      }}
                      className="py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow cursor-pointer"
                    >
                      Absent
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Check-ins lists */}
            <div className="md:col-span-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Historical Attendance Entries</h3>
              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100 dark:divide-zinc-850">
                {clientAttendance.length > 0 ? (
                  clientAttendance.map((att) => (
                    <div key={att.id} className="py-3 flex justify-between items-center text-xs">
                      <div>
                        <div className="font-bold text-slate-800 dark:text-zinc-200">{att.date}</div>
                        <div className="text-[10px] text-slate-400">Check-in: {att.timeIn}</div>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold ${
                        att.status === "Present" ? "bg-emerald-500/10 text-emerald-500" :
                        att.status === "Late" ? "bg-amber-500/10 text-amber-500" :
                        "bg-red-500/10 text-red-500"
                      }`}>
                        {att.status}
                      </span>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8 text-xs text-slate-400">No attendance entries recorded.</div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 5. PAYMENTS TAB */}
        {activeTab === "payments" && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">Billing & Receipts</h3>
                <p className="text-slate-400 text-xs">Record payment transactions and print invoices</p>
              </div>
              <button
                onClick={() => setPaymentModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Record Fee</span>
              </button>
            </div>

            {/* List payments */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-6">Invoice ID</th>
                      <th className="py-3 px-4">Billing Date</th>
                      <th className="py-3 px-4">Method</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-6 text-right">Receipt Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs text-slate-700 dark:text-zinc-350">
                    {clientPayments.length > 0 ? (
                      clientPayments.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/20 dark:hover:bg-zinc-850/10">
                          <td className="py-3.5 px-6 font-bold text-slate-800 dark:text-zinc-200">{p.invoiceNumber}</td>
                          <td className="py-3.5 px-4">{p.date}</td>
                          <td className="py-3.5 px-4">{p.method}</td>
                          <td className="py-3.5 px-4 font-bold text-slate-800 dark:text-zinc-100">₹{p.amount}</td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                              p.status === "Paid" ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20" : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}>
                              {p.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-6 text-right">
                            <button
                              onClick={() => {
                                setActiveInvoice(p);
                                setTimeout(() => window.print(), 100);
                              }}
                              className="px-2 py-1 bg-slate-50 dark:bg-zinc-950 border border-slate-205 hover:bg-slate-100 text-[10px] font-extrabold rounded-lg cursor-pointer"
                            >
                              Print Invoice
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-slate-400">No payment records logged.</td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 6. PROGRESS TAB (Tape & Weight metrics line chart) */}
        {activeTab === "progress" && (
          <div className="space-y-6 animate-in fade-in duration-200 text-left">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-800 dark:text-zinc-200">Tape & Weight Logs</h3>
                <p className="text-slate-400 text-xs">Track historical dimensions and weight patterns</p>
              </div>
              <button
                onClick={() => setMeasurementModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow transition"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Log Metrics</span>
              </button>
            </div>

            {/* Recharts trend graphs */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-4">Weight Trend Tracker (kg)</h4>
                <div className="h-60">
                  {weightTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.1)" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 3', 'dataMax + 3']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="Weight" stroke="#3b82f6" strokeWidth={2} dot={{ fill: "#3b82f6" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No weight points loaded</div>
                  )}
                </div>
              </div>

              <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl p-5 shadow-sm">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-455 mb-4">Body Fat Ratio Tracker (%)</h4>
                <div className="h-60">
                  {weightTrendData.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={weightTrendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(156,163,175,0.1)" />
                        <XAxis dataKey="date" stroke="#9ca3af" fontSize={10} tickLine={false} />
                        <YAxis stroke="#9ca3af" fontSize={10} tickLine={false} domain={['dataMin - 2', 'dataMax + 2']} />
                        <Tooltip />
                        <Line type="monotone" dataKey="BodyFat" stroke="#10b981" strokeWidth={2} dot={{ fill: "#10b981" }} />
                      </LineChart>
                    </ResponsiveContainer>
                  ) : (
                    <div className="h-full flex items-center justify-center text-xs text-slate-400">No body fat points loaded</div>
                  )}
                </div>
              </div>

            </div>

            {/* Stats list tape table */}
            <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/50 dark:bg-zinc-950/40 border-b border-slate-100 dark:border-zinc-800 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                      <th className="py-3.5 px-6">Record Date</th>
                      <th className="py-3.5 px-4">Weight</th>
                      <th className="py-3.5 px-4">BMI</th>
                      <th className="py-3.5 px-4">Body Fat</th>
                      <th className="py-3.5 px-4">Chest</th>
                      <th className="py-3.5 px-4">Waist</th>
                      <th className="py-3.5 px-4">Arms</th>
                      <th className="py-3.5 px-6 text-right">Thigh</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-zinc-800/40 text-xs text-slate-750 dark:text-zinc-300">
                    {[...clientMeasurements].reverse().map((m, i) => (
                      <tr key={i} className="hover:bg-slate-50/20 dark:hover:bg-zinc-850/10">
                        <td className="py-3 px-6 font-bold text-slate-805 dark:text-zinc-200">{m.date}</td>
                        <td className="py-3 px-4 font-semibold text-blue-650 dark:text-blue-400">{m.weight} kg</td>
                        <td className="py-3 px-4">{m.bmi}</td>
                        <td className="py-3 px-4 text-emerald-600">{m.bodyFat}%</td>
                        <td className="py-3 px-4">{m.chest || "—"} cm</td>
                        <td className="py-3 px-4">{m.waist || "—"} cm</td>
                        <td className="py-3 px-4">{m.arms || "—"} cm</td>
                        <td className="py-3 px-6 text-right">{m.thigh || "—"} cm</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

      </div>

      {/* --- PRINT SHEET TEMPLATE FOR SINGLE INVOICE IN PRINT MODAL --- */}
      {activeInvoice && (
        <div className="hidden print-area leading-relaxed text-left">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{settings.gymName}</h1>
            <p className="text-xs text-slate-500">{settings.gymAddress} • Phone: {settings.trainerPhone}</p>
            <h2 className="text-sm font-semibold uppercase tracking-wider mt-2">Invoice Transaction Receipt</h2>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4">
            <div><strong>Invoice Number:</strong> {activeInvoice.invoiceNumber}</div>
            <div><strong>Billing Date:</strong> {activeInvoice.date}</div>
            <div><strong>Athlete Name:</strong> {client.name}</div>
            <div><strong>Payment Method:</strong> {activeInvoice.method}</div>
            <div><strong>Membership Plan:</strong> {client.membership}</div>
            <div><strong>Payment Status:</strong> {activeInvoice.status}</div>
          </div>
          <div className="flex justify-between items-center text-sm font-bold pt-4">
            <span>Fees Paid:</span>
            <span>₹{activeInvoice.amount}</span>
          </div>
          <div className="mt-12 text-center text-[10px] text-slate-400 border-t pt-4">
            Thank you for training with us! Generated via Apex Gym CRM
          </div>
        </div>
      )}

      {/* --- ADD TAPE MEASUREMENTS DIALOG --- */}
      {measurementModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setMeasurementModalOpen(false)} />
          <form onSubmit={handleAddMeasurement} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display">Log Body Measurements</h3>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Weight (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    required
                    value={newMeasure.weight}
                    onChange={(e) => setNewMeasure({ ...newMeasure, weight: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Body Fat %</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newMeasure.bodyFat}
                    onChange={(e) => setNewMeasure({ ...newMeasure, bodyFat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Chest (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.chest}
                    onChange={(e) => setNewMeasure({ ...newMeasure, chest: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Waist (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.waist}
                    onChange={(e) => setNewMeasure({ ...newMeasure, waist: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Arms (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.arms}
                    onChange={(e) => setNewMeasure({ ...newMeasure, arms: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Thigh (cm)</label>
                  <input
                    type="number"
                    value={newMeasure.thigh}
                    onChange={(e) => setNewMeasure({ ...newMeasure, thigh: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950"
                  />
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setMeasurementModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Save Stats
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- MANAGE WORKOUT DAY DIALOG --- */}
      {workoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setWorkoutModalOpen(false)} />
          <form onSubmit={handleSaveWorkoutDay} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in scale-in duration-200 max-h-[85vh] flex flex-col justify-between text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display uppercase tracking-wider">
              Manage Exercises — {selectedDay}
            </h3>
            
            <div className="space-y-4 overflow-y-auto pr-1 flex-1">
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Muscle Group</label>
                  <input
                    type="text"
                    value={muscleGroup}
                    onChange={(e) => setMuscleGroup(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="e.g. Chest"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Rest Time</label>
                  <input
                    type="text"
                    value={restTime}
                    onChange={(e) => setRestTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="e.g. 60 sec"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Duration</label>
                  <input
                    type="text"
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="e.g. 45 min"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Routine Notes</label>
                <input
                  type="text"
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  placeholder="Focus on controlled negatives"
                />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">Exercises List</span>
                  <button
                    type="button"
                    onClick={handleAddExerciseRow}
                    className="text-[10px] text-blue-600 font-extrabold flex items-center gap-0.5 hover:underline cursor-pointer"
                  >
                    + Add Row
                  </button>
                </div>
                
                <div className="space-y-2">
                  {dayExercises.map((ex, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <input
                        type="text"
                        placeholder="Exercise Name"
                        value={ex.name}
                        onChange={(e) => handleExerciseChange(idx, "name", e.target.value)}
                        className="flex-1 px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                      />
                      <input
                        type="text"
                        placeholder="Sets"
                        value={ex.sets}
                        onChange={(e) => handleExerciseChange(idx, "sets", e.target.value)}
                        className="w-12 px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                      />
                      <input
                        type="text"
                        placeholder="Reps"
                        value={ex.reps}
                        onChange={(e) => handleExerciseChange(idx, "reps", e.target.value)}
                        className="w-12 px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                      />
                      <input
                        type="text"
                        placeholder="Load"
                        value={ex.weight}
                        onChange={(e) => handleExerciseChange(idx, "weight", e.target.value)}
                        className="w-16 px-1 py-1.5 border border-slate-200 rounded-lg text-xs text-center"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveExerciseRow(idx)}
                        className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 shrink-0 pt-4 border-t border-slate-100 dark:border-zinc-800">
              <button
                type="button"
                onClick={() => setWorkoutModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold animate-none"
              >
                Save Splits
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- EDIT DIET MEAL DIALOG --- */}
      {dietModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDietModalOpen(false)} />
          <form onSubmit={handleSaveDietMeal} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display uppercase tracking-wider">
              Meal Details — {dietMealKey}
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Meal / Food items</label>
                <input
                  type="text"
                  required
                  value={dietMealInput.meal}
                  onChange={(e) => setDietMealInput({ ...dietMealInput, meal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  placeholder="e.g. Oats, banana and whey protein"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Quantity / Serving</label>
                  <input
                    type="text"
                    value={dietMealInput.quantity}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Water Intake (L)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={dietMealInput.waterIntake}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, waterIntake: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={dietMealInput.calories}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, calories: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={dietMealInput.protein}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, protein: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Carbohydrates (g)</label>
                  <input
                    type="number"
                    value={dietMealInput.carbs}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, carbs: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={dietMealInput.fat}
                    onChange={(e) => setDietMealInput({ ...dietMealInput, fat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Supplements</label>
                <input
                  type="text"
                  value={dietMealInput.supplements}
                  onChange={(e) => setDietMealInput({ ...dietMealInput, supplements: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-850"
                  placeholder="e.g. Whey, Creatine, Multivitamin"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDietModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Save
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- RECORD PAYMENT DIALOG --- */}
      {paymentModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setPaymentModalOpen(false)} />
          <form onSubmit={handleRecordPayment} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-105 mb-4 font-display">Record Member Payment</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Amount (₹)</label>
                <input
                  type="number"
                  required
                  value={paymentInput.amount}
                  onChange={(e) => setPaymentInput({ ...paymentInput, amount: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-805"
                  placeholder={client.monthlyFees}
                />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Payment Method</label>
                <select
                  value={paymentInput.method}
                  onChange={(e) => setPaymentInput({ ...paymentInput, method: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-205 rounded-lg bg-slate-50 dark:bg-zinc-950 text-slate-805"
                >
                  <option value="UPI">UPI / GPay</option>
                  <option value="Card">Credit Card</option>
                  <option value="Cash">Cash</option>
                  <option value="Bank Transfer">Bank Transfer</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Record Payment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* --- EDIT CLIENT PROFILE DIALOG --- */}
      {editModalOpen && (
        <div className="fixed inset-0 z-50 flex justify-end no-print">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setEditModalOpen(false)}
          />
          <div className="relative w-full max-w-md bg-white dark:bg-zinc-900 border-l border-slate-200 dark:border-zinc-800 p-6 h-full flex flex-col justify-between shadow-2xl animate-in slide-in-from-right duration-300 text-left">
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-lg font-bold text-slate-800 dark:text-zinc-100 font-display">
                  Edit Personal Details
                </h2>
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="p-1 rounded-md hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 cursor-pointer"
                >
                  <XCircle className="w-5 h-5" />
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Target Weight & Blood Group */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Goal Weight (kg)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={editFormData.targetWeight || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, targetWeight: parseFloat(e.target.value) || 0 })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Blood Group</label>
                    <input
                      type="text"
                      value={editFormData.bloodGroup || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, bloodGroup: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
                      placeholder="e.g. O+"
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
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Email</label>
                    <input
                      type="email"
                      value={editFormData.email || ""}
                      onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                      className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-805 focus:outline-none"
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
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-855 focus:outline-none"
                  />
                </div>

                {/* Emergency Contact */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Emergency Contact</label>
                  <input
                    type="text"
                    value={editFormData.emergencyContact || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, emergencyContact: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-855 focus:outline-none"
                  />
                </div>

                {/* Medical Conditions */}
                <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Medical Conditions</label>
                  <input
                    type="text"
                    value={editFormData.medicalConditions || ""}
                    onChange={(e) => setEditFormData({ ...editFormData, medicalConditions: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-xl bg-slate-50 dark:bg-zinc-950 text-slate-855 focus:outline-none"
                  />
                </div>
              </form>
            </div>

            <div className="flex gap-3 mt-6 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
              <button
                type="button"
                onClick={() => setEditModalOpen(false)}
                className="flex-1 py-2 border border-slate-205 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-705 hover:bg-slate-50 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                onClick={handleEditSubmit}
                className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow transition cursor-pointer"
              >
                Save Details
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ClientProfile;
