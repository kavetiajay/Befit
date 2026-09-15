import React, { useState, useEffect, useMemo } from "react";
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
  Plus,
  LogOut,
  Sparkles,
  Heart,
  Award,
  Zap,
  Download,
  Check,
  Lock,
  Bell,
  CheckCheck,
  ChevronRight,
  Droplet,
  Activity,
  ShieldCheck,
  Edit3,
  Info
} from "lucide-react";
import { toast } from "sonner";
import { useCRM } from "../../context/CRMContext";
import { api } from "../../services/api";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const DEFAULT_WEEKLY_WORKOUTS = {
  Monday: {
    muscleGroup: "Chest & Triceps",
    notes: "Focus on controlled eccentrics on all pressing movements. Keep shoulder blades retracted.",
    exercises: [
      { id: "ex_bench", name: "Barbell Bench Press", sets: "4", reps: "10-12", weight: "75 kg", rest: "90s", notes: "Full range of motion, touch chest lightly without bouncing." },
      { id: "ex_incline", name: "Incline Dumbbell Press", sets: "3", reps: "12", weight: "24 kg DBs", rest: "75s", notes: "Set bench to 30 degrees, squeeze upper pecs at peak." },
      { id: "ex_fly", name: "Cable Chest Fly", sets: "3", reps: "15", weight: "15 kg", rest: "60s", notes: "Slight elbow bend, focus on chest contraction." },
      { id: "ex_pushdown", name: "Tricep Rope Pushdown", sets: "3", reps: "12-15", weight: "22 kg", rest: "60s", notes: "Lock elbows at sides, spread rope at bottom." },
      { id: "ex_dips", name: "Chest Dips", sets: "3", reps: "10-12", weight: "Bodyweight", rest: "60s", notes: "Lean torso slightly forward to bias chest over shoulders." }
    ]
  },
  Tuesday: {
    muscleGroup: "Back & Biceps",
    notes: "Engage lats before initiating pulling movements. Drive with your elbows.",
    exercises: [
      { id: "ex_lat", name: "Lat Pulldown (Wide Grip)", sets: "4", reps: "10-12", weight: "55 kg", rest: "90s", notes: "Pull down smoothly to upper collarbone, squeeze shoulder blades." },
      { id: "ex_row", name: "Barbell Bent-Over Row", sets: "4", reps: "10", weight: "60 kg", rest: "90s", notes: "Hinge at hips with neutral spine, pull bar to lower ribcage." },
      { id: "ex_seatedrow", name: "Seated Cable Row", sets: "3", reps: "12", weight: "50 kg", rest: "75s", notes: "Keep torso upright, pause for 1s at full contraction." },
      { id: "ex_facepull", name: "Face Pulls", sets: "3", reps: "15", weight: "20 kg", rest: "60s", notes: "Pull rope to ear height, focus on rear deltoids and external rotators." },
      { id: "ex_curl", name: "Incline Dumbbell Bicep Curls", sets: "3", reps: "12", weight: "12 kg DBs", rest: "60s", notes: "Full supination at peak contraction, slow 3s eccentric." }
    ]
  },
  Wednesday: {
    muscleGroup: "Legs & Calves",
    notes: "Ensure adequate warm-up for hip flexors and ankles before heavy loading.",
    exercises: [
      { id: "ex_squat", name: "Barbell Back Squat", sets: "4", reps: "8-10", weight: "90 kg", rest: "120s", notes: "Break parallel with chest high, drive up through midfoot and heels." },
      { id: "ex_rdl", name: "Romanian Deadlift (RDL)", sets: "3", reps: "10-12", weight: "75 kg", rest: "90s", notes: "Push hips back, feel intense hamstring stretch before driving hips forward." },
      { id: "ex_press", name: "Leg Press", sets: "3", reps: "12-15", weight: "160 kg", rest: "90s", notes: "Do not lock out knees at top, keep feet shoulder-width apart." },
      { id: "ex_legcurl", name: "Lying Leg Curls", sets: "3", reps: "15", weight: "40 kg", rest: "60s", notes: "Controlled movement without hip lifting off bench." },
      { id: "ex_calf", name: "Standing Calf Raises", sets: "4", reps: "15-20", weight: "45 kg", rest: "45s", notes: "Pause 2s at bottom stretch and 1s at peak contraction." }
    ]
  },
  Thursday: {
    muscleGroup: "Shoulders & Core",
    notes: "Maintain tight core and neutral spine on overhead pressing.",
    exercises: [
      { id: "ex_ohp", name: "Overhead Barbell Military Press", sets: "4", reps: "8-10", weight: "40 kg", rest: "90s", notes: "Brace core and glutes, press straight up overhead." },
      { id: "ex_latraise", name: "Dumbbell Lateral Raises", sets: "4", reps: "15", weight: "10 kg DBs", rest: "60s", notes: "Lead with elbows, keep pinkies slightly elevated." },
      { id: "ex_reardelt", name: "Rear Delt Dumbbell Fly", sets: "3", reps: "15", weight: "8 kg DBs", rest: "60s", notes: "Hinge forward 45 degrees, sweep arms out wide." },
      { id: "ex_plank", name: "Weighted Plank Hold", sets: "3", reps: "60 sec", weight: "10 kg plate", rest: "45s", notes: "Keep glutes and abs maximally contracted throughout hold." },
      { id: "ex_hangingleg", name: "Hanging Leg Raises", sets: "3", reps: "12-15", weight: "Bodyweight", rest: "60s", notes: "Roll pelvis up to engage lower abdominal wall." }
    ]
  },
  Friday: {
    muscleGroup: "Arms & Abs",
    notes: "High pump intensity day with supersets. Keep rest intervals brief.",
    exercises: [
      { id: "ex_barbellcurl", name: "EZ-Bar Bicep Curls", sets: "4", reps: "10-12", weight: "30 kg", rest: "60s", notes: "Strict form, pin elbows against ribcage." },
      { id: "ex_skullcrusher", name: "Lying Skull Crushers", sets: "4", reps: "10-12", weight: "27.5 kg", rest: "60s", notes: "Lower bar toward crown of head, extend through triceps." },
      { id: "ex_hammer", name: "Dumbbell Hammer Curls", sets: "3", reps: "12", weight: "14 kg DBs", rest: "60s", notes: "Neutral palms grip to target brachialis and forearm flexors." },
      { id: "ex_overheadtri", name: "Overhead Cable Tricep Extension", sets: "3", reps: "15", weight: "25 kg", rest: "60s", notes: "Full tricep long-head stretch at bottom of repetition." },
      { id: "ex_cablecrunch", name: "Kneeling Cable Crunches", sets: "4", reps: "15-20", weight: "35 kg", rest: "45s", notes: "Flex spine smoothly, pull elbows down toward knees." }
    ]
  },
  Saturday: {
    muscleGroup: "Cardio, Conditioning & Mobility",
    notes: "Aerobic conditioning and functional endurance to burn fat and boost stamina.",
    exercises: [
      { id: "ex_hiit", name: "Treadmill Incline Intervals", sets: "1", reps: "25 min", weight: "N/A", rest: "N/A", notes: "1 min fast jog at 6% incline / 1 min brisk walk recovery." },
      { id: "ex_rowing", name: "Rowing Machine Intervals", sets: "5", reps: "500m", weight: "Damper 6", rest: "60s", notes: "Drive with legs first, lean torso, pull handle to lower chest." },
      { id: "ex_jumprope", name: "Jump Rope Conditioning", sets: "4", reps: "2 min", weight: "Speed rope", rest: "45s", notes: "Stay light on balls of feet, keep rhythm consistent." },
      { id: "ex_stretch", name: "Full Body Mobility Routine", sets: "1", reps: "15 min", weight: "Bodyweight", rest: "N/A", notes: "Pigeon pose, hip openers, thoracic spine rotations, foam rolling." }
    ]
  },
  Sunday: {
    muscleGroup: "Rest & Recovery Day",
    notes: "Active recovery and rest. Prioritize hydration, nutritious food, light walking, and 8 hours of quality sleep.",
    exercises: []
  }
};

const DEFAULT_DIET_PLAN = {
  template: "Weight Management & Performance",
  calories: "2,050 kcal",
  protein: "145g",
  carbs: "190g",
  fats: "58g",
  water: "3.5L",
  days: {
    Monday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (70g) with skimmed milk, 3 boiled egg whites + 1 whole egg, 1 fresh green apple", kcal: "460 kcal", macros: "P: 32g | C: 54g | F: 11g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (12 pieces) with 1 cup hot unsweetened green tea", kcal: "160 kcal", macros: "P: 5g | C: 6g | F: 14g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (160g) or tofu steak, 1 cup steamed brown rice, cucumber-tomato salad", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 9g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds & fresh sliced strawberries", kcal: "190 kcal", macros: "P: 18g | C: 16g | F: 4g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared fish (160g) or grilled paneer (120g), 1 bowl hot vegetable lentil soup, steamed broccoli", kcal: "490 kcal", macros: "P: 38g | C: 36g | F: 12g" }
    ],
    Tuesday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Whole wheat toast (2 slices) with avocado spread, 3 scrambled eggs, and 1 fresh orange", kcal: "470 kcal", macros: "P: 28g | C: 42g | F: 16g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in water with 1 banana", kcal: "220 kcal", macros: "P: 25g | C: 28g | F: 2g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled turkey breast or paneer chunks (150g), 1 cup cooked quinoa, mixed bell pepper stir-fry", kcal: "530 kcal", macros: "P: 42g | C: 46g | F: 11g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "Roasted chickpeas (1 bowl) with a squeeze of lemon and green tea", kcal: "170 kcal", macros: "P: 9g | C: 24g | F: 3g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Grilled chicken breast or tofu (150g), large bowl of mixed garden greens with olive oil vinaigrette", kcal: "460 kcal", macros: "P: 40g | C: 20g | F: 14g" }
    ],
    Wednesday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (70g) with skimmed milk, 3 boiled egg whites + 1 whole egg, 1 fresh green apple", kcal: "460 kcal", macros: "P: 32g | C: 54g | F: 11g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (12 pieces) with 1 cup hot unsweetened green tea", kcal: "160 kcal", macros: "P: 5g | C: 6g | F: 14g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (160g) or tofu steak, 1 cup steamed brown rice, cucumber-tomato salad", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 9g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds & fresh sliced strawberries", kcal: "190 kcal", macros: "P: 18g | C: 16g | F: 4g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared fish (160g) or grilled paneer (120g), 1 bowl hot vegetable lentil soup, steamed broccoli", kcal: "490 kcal", macros: "P: 38g | C: 36g | F: 12g" }
    ],
    Thursday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Whole wheat toast (2 slices) with avocado spread, 3 scrambled eggs, and 1 fresh orange", kcal: "470 kcal", macros: "P: 28g | C: 42g | F: 16g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in water with 1 banana", kcal: "220 kcal", macros: "P: 25g | C: 28g | F: 2g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled turkey breast or paneer chunks (150g), 1 cup cooked quinoa, mixed bell pepper stir-fry", kcal: "530 kcal", macros: "P: 42g | C: 46g | F: 11g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "Roasted chickpeas (1 bowl) with a squeeze of lemon and green tea", kcal: "170 kcal", macros: "P: 9g | C: 24g | F: 3g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Grilled chicken breast or tofu (150g), large bowl of mixed garden greens with olive oil vinaigrette", kcal: "460 kcal", macros: "P: 40g | C: 20g | F: 14g" }
    ],
    Friday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (70g) with skimmed milk, 3 boiled egg whites + 1 whole egg, 1 fresh green apple", kcal: "460 kcal", macros: "P: 32g | C: 54g | F: 11g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (12 pieces) with 1 cup hot unsweetened green tea", kcal: "160 kcal", macros: "P: 5g | C: 6g | F: 14g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (160g) or tofu steak, 1 cup steamed brown rice, cucumber-tomato salad", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 9g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds & fresh sliced strawberries", kcal: "190 kcal", macros: "P: 18g | C: 16g | F: 4g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared fish (160g) or grilled paneer (120g), 1 bowl hot vegetable lentil soup, steamed broccoli", kcal: "490 kcal", macros: "P: 38g | C: 36g | F: 12g" }
    ],
    Saturday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "Whole wheat toast (2 slices) with avocado spread, 3 scrambled eggs, and 1 fresh orange", kcal: "470 kcal", macros: "P: 28g | C: 42g | F: 16g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in water with 1 banana", kcal: "220 kcal", macros: "P: 25g | C: 28g | F: 2g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled turkey breast or paneer chunks (150g), 1 cup cooked quinoa, mixed bell pepper stir-fry", kcal: "530 kcal", macros: "P: 42g | C: 46g | F: 11g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "Roasted chickpeas (1 bowl) with a squeeze of lemon and green tea", kcal: "170 kcal", macros: "P: 9g | C: 24g | F: 3g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Grilled chicken breast or tofu (150g), large bowl of mixed garden greens with olive oil vinaigrette", kcal: "460 kcal", macros: "P: 40g | C: 20g | F: 14g" }
    ],
    Sunday: [
      { type: "Breakfast", label: "🍽 Breakfast", items: "2 scrambled egg whites + 1 whole egg, 1 slice whole wheat toast, 1 fresh kiwi fruit", kcal: "290 kcal", macros: "P: 18g | C: 26g | F: 9g" },
      { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "1 cup green tea with sliced fresh cucumbers and mint leaves", kcal: "35 kcal", macros: "P: 1g | C: 7g | F: 0g" },
      { type: "Lunch", label: "🍛 Lunch", items: "Grilled paneer (120g) or grilled chicken (140g), 1 bowl mixed salad, 1 small sweet potato", kcal: "420 kcal", macros: "P: 30g | C: 38g | F: 12g" },
      { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with raw honey drizzle", kcal: "150 kcal", macros: "P: 14g | C: 15g | F: 3g" },
      { type: "Dinner", label: "🍽 Dinner", items: "Light vegetable lentil soup with steamed asparagus and carrots", kcal: "310 kcal", macros: "P: 16g | C: 44g | F: 3g" }
    ]
  }
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const {
    clients,
    workouts,
    diets,
    fetchClients,
    fetchWorkoutPlanForClient,
    fetchDietPlanForClient,
    attendance,
    measurements,
    fetchAttendance,
    fetchWeightProgress,
    addWeightProgress,
    payments,
    fetchPayments,
    notifications,
    fetchNotifications,
    markNotificationAsRead,
    clearAllNotifications,
    updateClient
  } = useCRM();

  // Retrieve authenticated client with safe fallbacks
  const client = useMemo(() => {
    const savedId = localStorage.getItem("gym_client_id") || sessionStorage.getItem("gym_client_id");
    if (savedId) {
      const match = clients?.find((c) => c.id === savedId);
      if (match) return match;
    }
    return clients?.find((c) => c.name === "Ajay Kaveti" || c.email === "ajay@befit.com") || clients?.[0];
  }, [clients]);

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  const motivationalQuote = "Consistency beats motivation. Small daily improvements lead to massive results!";

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [clientNotifCategory, setClientNotifCategory] = useState("all");
  const [clientNotifSearch, setClientNotifSearch] = useState("");

  const todayName = daysOfWeek[new Date().getDay()];
  const [selectedWorkoutDay, setSelectedWorkoutDay] = useState(todayName);
  const [selectedDietDay, setSelectedDietDay] = useState(todayName);

  // AI assistant status state
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Attendance Heatmap date hover state
  const [hoveredDate, setHoveredDate] = useState(null);

  // Quick settings state
  const [waterCount, setWaterCount] = useState(2.5);

  // Weight logging modal state
  const [measurementModalOpen, setMeasurementModalOpen] = useState(false);
  const [newMeasure, setNewMeasure] = useState({
    weight: "",
    bodyFat: "",
    chest: "",
    waist: "",
    arms: "",
    thigh: ""
  });

  // Profile editing modal state
  const [editProfileModalOpen, setEditProfileModalOpen] = useState(false);
  const [profileForm, setProfileForm] = useState({
    phone: "",
    gender: "Male",
    address: "",
    emergencyContact: "",
    height: 170
  });
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Exercise completion tracking
  const [exerciseCompletions, setExerciseCompletions] = useState({});

  const [isWorkoutLoading, setIsWorkoutLoading] = useState(false);

  // Load backend data on mount
  useEffect(() => {
    localStorage.setItem("gym_role", "client");
    fetchClients();
    fetchWorkoutPlanForClient();
    fetchDietPlanForClient();
    fetchAttendance();
    fetchPayments();
    fetchNotifications();
  }, []);

  useEffect(() => {
    if (client?.id) {
      fetchWeightProgress(client.id);
      setProfileForm({
        phone: client.phone || "",
        gender: client.gender || "Male",
        address: client.address || "",
        emergencyContact: client.emergencyContact || "",
        height: client.height || 170
      });
    }
  }, [client?.id]);

  useEffect(() => {
    if (activeTab === "My Workout") {
      setIsWorkoutLoading(true);
      const timer = setTimeout(() => {
        setIsWorkoutLoading(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

  const unreadNotifications = useMemo(() => notifications.filter((n) => !n.read), [notifications]);

  const filteredClientNotifications = useMemo(() => {
    return notifications.filter((notif) => {
      if (clientNotifCategory === "unread" && notif.read) return false;
      if (clientNotifCategory !== "all" && clientNotifCategory !== "unread" && notif.type !== clientNotifCategory) return false;
      if (clientNotifSearch.trim()) {
        const query = clientNotifSearch.toLowerCase().trim();
        const matchTitle = notif.title?.toLowerCase().includes(query);
        const matchMsg = notif.message?.toLowerCase().includes(query);
        return matchTitle || matchMsg;
      }
      return true;
    });
  }, [notifications, clientNotifCategory, clientNotifSearch]);

  const handleMarkNotifRead = async (notifId) => {
    try {
      await markNotificationAsRead(notifId);
      toast.success("Notification marked as read");
    } catch (e) {
      console.error(e);
      toast.error("Failed to update notification.");
    }
  };

  const handleMarkAllClientNotifs = async () => {
    try {
      await clearAllNotifications();
      toast.success("All notifications marked as read.");
    } catch (e) {
      console.error(e);
      toast.error("Failed to mark notifications read.");
    }
  };

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

  const triggerAskAi = () => {
    setLoadingAi(true);
    setTimeout(() => {
      setAiResponse(
        "Based on your recent workout consistency and goal milestone pace, your metabolic rate is peaking! Ensure you maintain a minimum of 3.5L hydration daily to accelerate recovery and muscle fiber repair."
      );
      setLoadingAi(false);
      toast.success("AI Fitness Coach analysis compiled.");
    }, 900);
  };

  const handleClientAddMeasurement = async (e) => {
    e.preventDefault();
    if (!newMeasure.weight) {
      toast.warning("Weight value is required.");
      return;
    }
    const today = new Date().toISOString().split("T")[0];
    const newPoint = {
      date: today,
      weight: parseFloat(newMeasure.weight),
      bodyFat: parseFloat(newMeasure.bodyFat) || client?.bodyFat || null,
      chest: parseFloat(newMeasure.chest) || client?.chest || null,
      waist: parseFloat(newMeasure.waist) || client?.waist || null,
      arms: parseFloat(newMeasure.arms) || client?.arms || null,
      thigh: parseFloat(newMeasure.thigh) || client?.thigh || null
    };

    const toastId = toast.loading("Saving weight progress log...");
    try {
      await addWeightProgress(client.id, newPoint);
      toast.success("New stats logged successfully!", { id: toastId });
      setMeasurementModalOpen(false);
      setNewMeasure({ weight: "", bodyFat: "", chest: "", waist: "", arms: "", thigh: "" });
    } catch (err) {
      console.error(err);
      toast.error(`Failed to save measurements: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    }
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setIsUpdatingProfile(true);
    const toastId = toast.loading("Updating profile details...");
    try {
      await updateClient(client.id, {
        phone: profileForm.phone,
        gender: profileForm.gender,
        address: profileForm.address,
        emergencyContact: profileForm.emergencyContact,
        height: parseFloat(profileForm.height) || client.height
      });
      toast.success("Profile updated successfully!", { id: toastId });
      setEditProfileModalOpen(false);
    } catch (err) {
      console.error(err);
      toast.error(`Failed to update profile: ${err instanceof Error ? err.message : String(err)}`, { id: toastId });
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const formatDateFriendly = (dateString) => {
    if (!dateString) return "—";
    try {
      const parts = dateString.split("-");
      if (parts.length === 3) {
        const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
        return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
      }
      const d = new Date(dateString);
      return isNaN(d.getTime()) ? dateString : d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" });
    } catch (_err) {
      return dateString;
    }
  };

  // Dynamic client payments & invoices
  const clientPayments = useMemo(() => {
    const cid = client?.id || localStorage.getItem("gym_client_id") || "logged_in_client";
    return payments.filter((p) => p.clientId === cid || p.client_id === cid);
  }, [payments, client?.id]);

  const invoiceList = useMemo(() => {
    return clientPayments.map((p) => ({
      id: p.id,
      number: p.invoiceNumber || (p.transactionId ? `INV-${p.transactionId}` : `INV-2026-${String(p.id).slice(0, 4).toUpperCase()}`),
      transactionId: p.transactionId || "—",
      date: p.paymentDate || p.date,
      dueDate: p.dueDate,
      membershipStart: p.membershipStart || p.date,
      membershipEnd: p.membershipEnd || p.dueDate,
      plan: p.membershipPlan || client?.membership || "Standard Monthly",
      amount: Number(p.amount) || 0,
      method: p.method || "Cash",
      status: p.status || "Paid",
      notes: p.notes || ""
    }));
  }, [clientPayments, client]);

  const downloadClientReceipt = (inv) => {
    const textContent = `================================================
              BEFIT FITNESS CRM
================================================
Receipt ID:         REC-${inv.id ? String(inv.id).slice(0, 8).toUpperCase() : "TEMP"}
Invoice Number:     ${inv.number}
Transaction ID:     ${inv.transactionId}
Client Name:        ${client?.name || "Client"}
Client Email:       ${client?.email || "—"}
------------------------------------------------
Membership Plan:    ${inv.plan}
Membership Period:  ${inv.membershipStart ? formatDateFriendly(inv.membershipStart) : "—"} to ${inv.membershipEnd ? formatDateFriendly(inv.membershipEnd) : "—"}
Payment Date:       ${inv.status === "Paid" ? formatDateFriendly(inv.date) : "Pending"}
Due Date:           ${inv.dueDate ? formatDateFriendly(inv.dueDate) : "—"}
Billed Amount:      INR ${inv.amount.toLocaleString("en-IN")}
Payment Method:     ${inv.method}
Settlement Status:  ${inv.status}
------------------------------------------------
Notes:
${inv.notes || "Gym membership subscription dues."}
================================================
Thank you for training with BeFit!
Generated on ${new Date().toLocaleString("en-IN")}
`;
    const element = document.createElement("a");
    const file = new Blob([textContent], { type: "text/plain" });
    element.href = URL.createObjectURL(file);
    element.download = `Receipt_${inv.number || "BeFit"}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
    toast.success("Receipt invoice downloaded.");
  };

  const daysRemaining = useMemo(() => {
    if (!client?.expiryDate) return 28;
    const expiry = new Date(client.expiryDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const diffTime = expiry - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  }, [client?.expiryDate]);

  // Dynamic client weight progress
  const clientMeasurements = useMemo(() => {
    const cid = client?.id || localStorage.getItem("gym_client_id") || "logged_in_client";
    return measurements[cid] || [];
  }, [measurements, client?.id]);

  const clientProgressStats = useMemo(() => {
    const sorted = [...clientMeasurements].sort((a, b) => new Date(a.date) - new Date(b.date));
    const latest = sorted.length > 0 ? sorted[sorted.length - 1] : null;
    const baseline = sorted.length > 0 ? sorted[0] : null;

    const currentWeight = latest ? Number(latest.weight) : Number(client?.currentWeight || 70);
    const startingWeight = baseline ? Number(baseline.weight) : currentWeight;
    const weightChange = Number((currentWeight - startingWeight).toFixed(1));
    const targetWeight = Number(client?.targetWeight || 68);
    const remainingToTarget = Number(Math.abs(currentWeight - targetWeight).toFixed(1));

    const heightM = (client?.height || 170) / 100;
    const bmi = Number((currentWeight / (heightM * heightM)).toFixed(1));

    const bodyFat = latest?.bodyFat !== null && latest?.bodyFat !== undefined && latest?.bodyFat > 0
      ? Number(latest.bodyFat)
      : (client?.bodyFat ? Number(client.bodyFat) : null);

    const chest = latest?.chest || client?.chest || null;
    const waist = latest?.waist || client?.waist || null;
    const biceps = latest?.arms || client?.arms || null;
    const thigh = latest?.thigh || client?.thigh || null;
    const latestDate = latest?.date || client?.joinDate || "—";

    let progressPct = 0;
    const totalGoalDistance = Math.abs(startingWeight - targetWeight);
    if (totalGoalDistance > 0) {
      const distanceCovered = Math.abs(currentWeight - startingWeight);
      progressPct = Math.min(Math.round((distanceCovered / totalGoalDistance) * 100), 100);
    } else {
      progressPct = 100;
    }

    return {
      sorted,
      latest,
      baseline,
      currentWeight,
      startingWeight,
      weightChange,
      targetWeight,
      remainingToTarget,
      bmi,
      bodyFat,
      chest,
      waist,
      biceps,
      thigh,
      latestDate,
      progressPct
    };
  }, [clientMeasurements, client]);

  const [clientAttendanceMonth, setClientAttendanceMonth] = useState(() => new Date().toISOString().slice(0, 7));

  // Dynamic client attendance logs & monthly heatmap
  const clientAttendanceLogs = useMemo(() => {
    return attendance.filter((a) => a.clientId === client?.id || a.clientId === "logged_in_client");
  }, [attendance, client?.id]);

  const clientAttendanceHeatmap = useMemo(() => {
    const [yearStr, monthStr] = clientAttendanceMonth.split("-");
    const year = parseInt(yearStr, 10);
    const month = parseInt(monthStr, 10);
    const daysInMonth = new Date(year, month, 0).getDate();
    const startDayOffset = new Date(year, month - 1, 1).getDay();

    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const dateStr = `${yearStr}-${monthStr.padStart(2, "0")}-${dayNum.toString().padStart(2, "0")}`;
      const log = clientAttendanceLogs.find((a) => a.date === dateStr);

      let status = 3; // default: No record
      if (log) {
        status = log.status === "Present" ? 1 : log.status === "Late" ? 4 : 2;
      }
      return { day: dayNum, dateStr, status, log };
    });

    return { days, startDayOffset, daysInMonth, year, month };
  }, [clientAttendanceLogs, clientAttendanceMonth]);

  const attendanceStats = useMemo(() => {
    const present = clientAttendanceLogs.filter((a) => a.status === "Present" || a.status === "Late").length;
    const absent = clientAttendanceLogs.filter((a) => a.status === "Absent").length;
    const total = clientAttendanceLogs.length;
    const rate = total > 0 ? Math.round((present / total) * 100) : 92;
    return {
      present: present || 18,
      absent: absent || 2,
      total: total || 20,
      rate
    };
  }, [clientAttendanceLogs]);

  // Sidebar navigation items
  const sidebarItems = [
    { name: "Dashboard", tab: "Dashboard", icon: LayoutDashboard },
    { name: "My Workout", tab: "My Workout", icon: Dumbbell },
    { name: "My Diet", tab: "My Diet", icon: Apple },
    { name: "Attendance", tab: "Attendance", icon: Calendar },
    { name: "Progress", tab: "Progress", icon: Scale },
    { name: "Payments", tab: "Payments", icon: CreditCard },
    { name: "Notifications", tab: "Notifications", icon: Bell, badge: unreadNotifications.length },
    { name: "Achievements", tab: "Achievements", icon: Trophy },
    { name: "Profile", tab: "Profile", icon: User }
  ];

  const handleLogout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout request failed:", err);
    } finally {
      localStorage.removeItem("gym_auth");
      localStorage.removeItem("gym_role");
      localStorage.removeItem("gym_token");
      localStorage.removeItem("gym_client_id");
      sessionStorage.removeItem("gym_auth");
      sessionStorage.removeItem("gym_role");
      sessionStorage.removeItem("gym_token");
      sessionStorage.removeItem("gym_client_id");
      toast.success("Successfully signed out");
      navigate("/login");
    }
  };

  // Workout data resolution for active client
  const activeWorkoutPlan = useMemo(() => {
    const backendWorkout = client ? (workouts?.[client.id] || workouts?.["logged_in_client"]) : null;
    if (backendWorkout && Object.keys(backendWorkout).length > 0) {
      return backendWorkout;
    }
    return DEFAULT_WEEKLY_WORKOUTS;
  }, [workouts, client]);

  // Diet data resolution for active client
  const activeDietPlan = useMemo(() => {
    const backendDiet = client ? (diets?.[client.id] || diets?.["logged_in_client"]) : null;
    if (backendDiet && Object.keys(backendDiet).length > 0) {
      return backendDiet;
    }
    return DEFAULT_DIET_PLAN;
  }, [diets, client]);

  if (!client) {
    return (
      <div className="min-h-screen bg-[#080B14] text-slate-100 flex items-center justify-center font-sans p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-lg">
            <Dumbbell className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-white animate-pulse">Loading Client Portal...</h2>
          <p className="text-xs text-slate-400">Retrieving your personalized workout schedules, diet blueprints, and membership records.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 flex font-sans selection:bg-blue-600/35 selection:text-white transition-colors duration-300">
      
      {/* --- DESKTOP SIDEBAR --- */}
      <aside className="hidden lg:flex flex-col w-68 bg-[#0b101c] border-r border-[#1e293b]/50 p-6 sticky top-0 h-screen justify-between z-20 shrink-0">
        <div>
          {/* Logo brand */}
          <div className="flex items-center gap-3.5 mb-8 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <Dumbbell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                BeFit
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                Client Portal
              </span>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.tab;
              return (
                <button
                  key={item.name}
                  onClick={() => setActiveTab(item.tab)}
                  className={`w-full flex items-center justify-between px-4.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 cursor-pointer text-left ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/25 shadow-md shadow-blue-500/5 font-black"
                      : "text-slate-400 hover:text-slate-200 hover:bg-[#111827]/50 border border-transparent"
                  }`}
                >
                  <div className="flex items-center gap-3.5">
                    <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
                    <span>{item.name}</span>
                  </div>
                  {item.badge > 0 && (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-rose-500 text-white animate-pulse">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar controls */}
        <div className="space-y-3 pt-5 border-t border-[#1e293b]/40">
          <Link
            to="/trainer/dashboard"
            onClick={() => {
              localStorage.setItem("gym_role", "trainer");
              toast.success("Switched to Trainer View Portal 👨‍🏫");
            }}
            className="w-full flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl text-xs font-black text-purple-400 bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-purple-400" />
            <span>Switch to Trainer View</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4.5 py-2.5 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN CONTENT VIEWPORT --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B14] p-4.5 sm:p-6 lg:p-8 pb-24 lg:pb-8 overflow-y-auto max-h-screen">
        
        {/* Mobile Header Bar */}
        <div className="flex lg:hidden justify-between items-center bg-[#0b101c]/85 border border-[#1e293b]/50 rounded-2xl p-4 mb-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">BeFit Portal</span>
          </div>

          <div className="flex items-center gap-2">
            {/* Notification Bell Mobile */}
            <div className="relative">
              <button
                onClick={() => { setShowNotifications(!showNotifications); setShowRoleDropdown(false); }}
                className="w-9 h-9 rounded-xl bg-zinc-900/80 border border-[#1e293b]/70 flex items-center justify-center text-slate-300 relative cursor-pointer"
                title="Notifications"
              >
                <Bell className="w-4 h-4" />
                {unreadNotifications.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-500 text-white rounded-full text-[8px] font-black flex items-center justify-center border border-[#0b101c]">
                    {unreadNotifications.length}
                  </span>
                )}
              </button>

              {showNotifications && (
                <div className="absolute top-11 right-0 w-72 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-2xl z-50 p-3 animate-in fade-in duration-150 text-left">
                  <div className="flex items-center justify-between pb-2 border-b border-[#1e293b]/40">
                    <span className="text-xs font-black text-white">Notifications</span>
                    <button
                      onClick={() => { setActiveTab("Notifications"); setShowNotifications(false); }}
                      className="text-[10px] text-cyan-400 font-bold hover:underline"
                    >
                      View All
                    </button>
                  </div>
                  <div className="py-2 max-h-60 overflow-y-auto space-y-2 divide-y divide-[#1e293b]/20">
                    {notifications.length === 0 ? (
                      <p className="text-[11px] text-slate-400 text-center py-4">No notifications yet 🎉</p>
                    ) : (
                      notifications.slice(0, 5).map((n) => (
                        <div key={n.id} className="pt-2 first:pt-0 flex justify-between items-start gap-2">
                          <div>
                            <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                            <p className="text-[10px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                            <span className="text-[9px] text-slate-500 mt-1 block">{n.time}</span>
                          </div>
                          {!n.read && (
                            <button
                              onClick={() => handleMarkNotifRead(n.id)}
                              className="p-1 text-cyan-400 hover:text-cyan-300 rounded shrink-0"
                              title="Mark read"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Avatar Mobile toggle */}
            <div className="relative">
              <button
                onClick={() => { setShowRoleDropdown(!showRoleDropdown); setShowNotifications(false); }}
                className="w-9 h-9 rounded-xl overflow-hidden border border-[#1e293b]/70 cursor-pointer"
              >
                <img
                  src={client?.photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"}
                  alt={client?.name || "Client"}
                  className="w-full h-full object-cover"
                />
              </button>

              {showRoleDropdown && (
                <div className="absolute top-11 right-0 w-48 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#1e293b]/30 animate-in fade-in duration-150 text-left">
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Role</span>
                    <span className="text-xs font-black text-white block mt-0.5">Client Portal</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleSwitchRole("trainer")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-zinc-800 text-slate-300 rounded-xl transition text-left"
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
          </div>
        </div>

        {/* ========================================================================= */}
        {/* 1. DASHBOARD OVERVIEW TAB */}
        {/* ========================================================================= */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Hero Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-8 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#09090b] border border-zinc-800 rounded-3xl relative overflow-hidden text-left gap-4">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-2.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  ✨ {currentTime.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {timeGreeting}, {client?.name?.split(" ")[0] || "Client"} 👋
                </h1>
                <p className="text-xs text-slate-400 max-w-lg font-medium leading-relaxed">
                  Welcome back! You are pacing strong toward your <strong className="text-white font-bold">{client?.goal || "Fitness"}</strong> goal. Today's scheduled focus: <strong className="text-cyan-300 font-bold">{activeWorkoutPlan[todayName]?.muscleGroup || "Workout Split"}</strong>.
                </p>
                <div className="pt-2 border-t border-slate-800/50 max-w-lg">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mb-0.5">DAILY MOTIVATION</span>
                  <p className="text-xs text-cyan-400 italic font-bold">"{motivationalQuote}"</p>
                </div>
              </div>

              {/* Float Metadata Summary Block */}
              <div className="flex items-center gap-3 relative z-10 shrink-0">
                <div className="relative">
                  <button
                    onClick={() => { setShowNotifications(!showNotifications); setShowRoleDropdown(false); }}
                    className="w-12 h-12 rounded-2xl bg-zinc-900/70 backdrop-blur-md border border-[#1e293b]/60 flex items-center justify-center text-slate-300 hover:text-white hover:bg-zinc-800 transition cursor-pointer shadow-xl relative"
                    title="Notifications"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadNotifications.length > 0 && (
                      <span className="absolute -top-1 -right-1 w-5 h-5 bg-rose-500 text-white rounded-full text-[9px] font-black flex items-center justify-center border-2 border-[#0b101c]">
                        {unreadNotifications.length}
                      </span>
                    )}
                  </button>

                  {showNotifications && (
                    <div className="absolute top-14 right-0 w-80 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-2xl z-50 p-4 animate-in fade-in duration-150 text-left">
                      <div className="flex items-center justify-between pb-2.5 border-b border-[#1e293b]/40">
                        <span className="text-xs font-black text-white">Notifications Feed</span>
                        <button
                          onClick={() => { setActiveTab("Notifications"); setShowNotifications(false); }}
                          className="text-[10px] text-cyan-400 font-bold hover:underline"
                        >
                          View All ({notifications.length})
                        </button>
                      </div>
                      <div className="py-2.5 max-h-72 overflow-y-auto space-y-2.5 divide-y divide-[#1e293b]/20">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-slate-400 text-center py-6">No notifications yet 🎉</p>
                        ) : (
                          notifications.slice(0, 6).map((n) => (
                            <div key={n.id} className="pt-2.5 first:pt-0 flex justify-between items-start gap-2.5">
                              <div>
                                <p className="text-xs font-bold text-white leading-tight">{n.title}</p>
                                <p className="text-[11px] text-slate-400 mt-0.5 leading-snug">{n.message}</p>
                                <span className="text-[9px] text-slate-500 mt-1 block">{n.date} • {n.time}</span>
                              </div>
                              {!n.read && (
                                <button
                                  onClick={() => handleMarkNotifRead(n.id)}
                                  className="p-1 bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 rounded-lg shrink-0 transition"
                                  title="Mark as Read"
                                >
                                  <CheckCheck className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex items-center gap-3.5 bg-zinc-900/70 backdrop-blur-md border border-[#1e293b]/60 p-3 rounded-2xl shrink-0 shadow-xl">
                  <img
                    src={client?.photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"}
                    alt={client?.name || "Client"}
                    className="w-12 h-12 rounded-xl object-cover border border-blue-500/30"
                  />
                  <div className="text-left text-xs space-y-0.5">
                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider block">Client ID: #{String(client?.id || "").slice(0, 6)}</span>
                    <span className="font-extrabold text-blue-400 block">{client?.name}</span>
                    <span className="text-[10px] text-slate-400 font-semibold block">{client?.membership || "Standard"} • {daysRemaining}d left</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Overview Metric Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { title: "Current Weight", val: `${clientProgressStats.currentWeight} kg`, sub: `Target: ${clientProgressStats.targetWeight} kg`, icon: Scale, color: "from-blue-600 to-cyan-500 text-blue-400", tab: "Progress" },
                { title: "Attendance Consistency", val: `${attendanceStats.rate}%`, sub: `${attendanceStats.present} sessions logged`, icon: Calendar, color: "from-emerald-500 to-teal-400 text-emerald-400", tab: "Attendance" },
                { title: "Today's Split", val: activeWorkoutPlan[todayName]?.muscleGroup || "Workout Split", sub: `${activeWorkoutPlan[todayName]?.exercises?.length || 0} exercises assigned`, icon: Dumbbell, color: "from-purple-600 to-pink-500 text-purple-400", tab: "My Workout" },
                { title: "Membership Status", val: daysRemaining > 0 ? "Active Plan" : "Renewal Due", sub: `${daysRemaining} Days Remaining`, icon: CreditCard, color: "from-amber-500 to-orange-400 text-amber-400", tab: "Payments" }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveTab(card.tab)}
                    className="bg-[#111827] border border-[#1e293b]/50 rounded-3xl p-5 hover:border-zinc-700 transition duration-200 shadow-lg relative flex flex-col justify-between overflow-hidden group cursor-pointer"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide block">{card.title}</span>
                      <div className="w-8 h-8 bg-zinc-950/80 rounded-xl flex items-center justify-center border border-zinc-800 shrink-0 text-slate-300">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-4">
                      <h4 className="text-lg sm:text-xl font-black text-white">{card.val}</h4>
                      <span className="text-[10.5px] font-bold text-slate-400 mt-1 block leading-tight">{card.sub}</span>
                    </div>
                    
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-30 group-hover:opacity-100 transition-opacity`} />
                  </div>
                );
              })}
            </div>

            {/* Quick Action Navigation Shortcuts Grid */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4 text-left">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
                <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                  <Zap className="w-4 h-4 text-cyan-400" />
                  <span>Quick Access Portal Hub</span>
                </h3>
                <span className="text-[10px] font-bold text-slate-500">Jump directly to your dedicated workspaces</span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
                {[
                  { name: "My Workout", tab: "My Workout", icon: Dumbbell, desc: "Daily routines & splits", color: "hover:border-blue-500/40 text-blue-400" },
                  { name: "My Diet", tab: "My Diet", icon: Apple, desc: "Macros & meal schedule", color: "hover:border-emerald-500/40 text-emerald-400" },
                  { name: "Attendance", tab: "Attendance", icon: Calendar, desc: "Monthly check-in logs", color: "hover:border-indigo-500/40 text-indigo-400" },
                  { name: "Progress", tab: "Progress", icon: Scale, desc: "Weight & body metrics", color: "hover:border-cyan-500/40 text-cyan-400" },
                  { name: "Payments", tab: "Payments", icon: CreditCard, desc: "Invoices & receipts", color: "hover:border-amber-500/40 text-amber-400" },
                  { name: "Notifications", tab: "Notifications", icon: Bell, desc: `${unreadNotifications.length} unread updates`, color: "hover:border-rose-500/40 text-rose-400" },
                  { name: "My Profile", tab: "Profile", icon: User, desc: "Account & settings", color: "hover:border-purple-500/40 text-purple-400" }
                ].map((action, idx) => {
                  const ActionIcon = action.icon;
                  return (
                    <button
                      key={idx}
                      onClick={() => setActiveTab(action.tab)}
                      className={`p-4 bg-zinc-950/50 hover:bg-zinc-900 border border-zinc-800 rounded-2xl flex flex-col justify-between transition-all duration-200 cursor-pointer text-left group ${action.color}`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                        <ActionIcon className="w-4 h-4 shrink-0" />
                      </div>
                      <div className="mt-3">
                        <span className="text-xs font-black text-white block group-hover:text-cyan-300 transition-colors">{action.name}</span>
                        <span className="text-[9.5px] text-slate-500 font-medium block mt-0.5">{action.desc}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* AI Coach & Badges Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
              {/* AI Fitness Coach Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#111827] to-[#121021] border border-purple-500/25 rounded-3xl p-6 relative overflow-hidden flex flex-col justify-between shadow-xl group">
                <div className="space-y-3">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin shrink-0" /> AI Fitness Coach 🤖
                  </span>
                  
                  <h3 className="text-sm font-black text-white">Daily Workout & Nutrition Optimization</h3>
                  <p className="text-xs text-slate-400 leading-relaxed font-semibold italic bg-zinc-950/40 p-4 rounded-2xl border border-zinc-900">
                    {aiResponse ? aiResponse : `"Your attendance consistency is strong at ${attendanceStats.rate}%. Keep up progressive overload on compound lifts and stay on track with your ${activeDietPlan.calories} target calories."`}
                  </p>
                </div>

                <div className="mt-5">
                  <button 
                    onClick={triggerAskAi}
                    disabled={loadingAi}
                    className="w-full py-2.5 bg-purple-600/15 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/20 hover:border-purple-600 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm flex items-center justify-center gap-2"
                  >
                    <span>{loadingAi ? "Compiling personalized metrics..." : "Ask AI Coach for Tips"}</span>
                  </button>
                </div>
                
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>

              {/* Badges preview */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Achievement Badges</h3>
                    <span className="text-[10px] text-cyan-400 font-bold">4 / 5 Unlocked</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2 py-2">
                    {[
                      { icon: "🏆", name: "First Workout", status: true },
                      { icon: "🔥", name: "7 Day Streak", status: true },
                      { icon: "💪", name: "30 Workouts", status: true },
                      { icon: "🎯", name: "Goal Achieved", status: false },
                      { icon: "⭐", name: "Consistency", status: true }
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
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-400 border-2 border-[#111827] rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Achievements")}
                  className="w-full mt-5 py-2.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer text-center"
                >
                  View Achievement Showcase
                </button>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 2. WORKOUT EXPERIENCE TAB */}
        {/* ========================================================================= */}
        {activeTab === "My Workout" && (() => {
          const isSelectedSunday = selectedWorkoutDay === "Sunday";
          const dayPlan = activeWorkoutPlan[selectedWorkoutDay] || { muscleGroup: "Rest Day", exercises: [], notes: "" };
          const exercises = dayPlan.exercises || [];
          const isRestDay = isSelectedSunday || dayPlan.muscleGroup === "Rest Day" || dayPlan.muscleGroup?.toLowerCase().includes("rest");

          if (isWorkoutLoading) {
            return (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-sm font-black text-white animate-pulse">Loading daily workout splits...</h3>
              </div>
            );
          }

          const completedCount = exercises.filter((ex) => exerciseCompletions[`${selectedWorkoutDay}_${ex.id || ex.name}`]).length;
          const totalCount = exercises.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">
                      🏋️ Client Workout Hub (Read-Only)
                    </span>
                    {selectedWorkoutDay === todayName && (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                        Today
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {selectedWorkoutDay}'s Routine: <span className="text-blue-400">{dayPlan.muscleGroup}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Workout plans are prescribed by your head coach. Use checkmarks to track personal session completion.
                  </p>
                </div>

                {!isRestDay && totalCount > 0 && (
                  <div className="p-4 bg-[#080B14] rounded-2xl border border-zinc-800 shrink-0 text-center min-w-[140px]">
                    <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Session Progress</span>
                    <span className="text-sm font-black text-cyan-400 block mt-1">{completedCount} / {totalCount} Done</span>
                  </div>
                )}
              </div>

              {/* Weekly Day Selector */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-xl space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2 border-zinc-800">
                  Weekly Training Schedule (Monday – Saturday Split • Sunday Rest)
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                  {weekdayOrder.map((day) => {
                    const isToday = day === todayName;
                    const isSelected = day === selectedWorkoutDay;
                    const isSun = day === "Sunday";
                    const muscle = activeWorkoutPlan[day]?.muscleGroup || (isSun ? "Rest Day" : "Training");
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedWorkoutDay(day)}
                        className={`p-3 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[92px] ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-blue-400 font-black shadow-md shadow-blue-500/10"
                            : isToday
                            ? "bg-zinc-900 border-zinc-700 text-slate-200 border-dashed"
                            : "bg-zinc-950/40 border-zinc-900 text-slate-400 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-black tracking-wider">{day.slice(0, 3)}</span>
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center my-1 border border-zinc-800 text-xs">
                          {isSun ? "🏖" : "🏋️"}
                        </div>
                        <span className="text-[8.5px] font-bold block truncate max-w-[80px] uppercase tracking-tighter text-slate-400">
                          {muscle}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Sunday Rest Day View */}
              {isRestDay ? (
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-8 shadow-xl text-center space-y-4">
                  <span className="text-5xl block animate-bounce">🏖</span>
                  <h3 className="text-lg font-black text-white">Scheduled Rest & Recovery Day</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Sunday is your active recovery day. Focus on hydration, mobility stretching, light walking, nutritious meals, and 8 hours of restorative sleep to rebuild muscle tissue for tomorrow's split!
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 max-w-lg mx-auto pt-2 text-xs">
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="font-bold text-cyan-400 block">💧 Hydration</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">Drink 3.5L+ water</span>
                    </div>
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="font-bold text-purple-400 block">🧘 Mobility</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">15 min stretching</span>
                    </div>
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="font-bold text-emerald-400 block">😴 Sleep</span>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">8 hours deep rest</span>
                    </div>
                  </div>
                </div>
              ) : exercises.length === 0 ? (
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-8 shadow-xl text-center space-y-4">
                  <span className="text-5xl block animate-bounce">🏋️</span>
                  <h3 className="text-lg font-black text-white">No Exercises Configured for {selectedWorkoutDay}</h3>
                  <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                    Your trainer has not added exercises for this day yet. Please check back soon or message your trainer.
                  </p>
                </div>
              ) : (
                <>
                  {/* Trainer Notes */}
                  {dayPlan.notes && (
                    <div className="bg-zinc-950/60 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
                      <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Trainer Guidance Notes</span>
                        <p className="text-xs text-slate-300 mt-0.5 leading-relaxed font-medium italic">
                          "{dayPlan.notes}"
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Completion Progress Bar */}
                  <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-xl space-y-2.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-extrabold text-slate-400 uppercase tracking-wider">{selectedWorkoutDay} Session Completion</span>
                      <span className="font-black text-cyan-400">{progressPercent}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>

                  {/* Exercise Cards Checklist */}
                  <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800">
                      Exercise Routine Checklist ({exercises.length} Exercises)
                    </span>

                    <div className="space-y-3">
                      {exercises.map((ex, index) => {
                        const exKey = `${selectedWorkoutDay}_${ex.id || ex.name}`;
                        const isCompleted = !!exerciseCompletions[exKey];
                        return (
                          <div 
                            key={ex.id || index}
                            onClick={() => {
                              setExerciseCompletions((prev) => {
                                const nextState = !prev[exKey];
                                if (nextState) {
                                  toast.success(`Completed ${ex.name}! 💪`);
                                }
                                return { ...prev, [exKey]: nextState };
                              });
                            }}
                            className={`p-4 rounded-2xl border transition-all duration-150 flex flex-col md:flex-row justify-between md:items-center gap-3 cursor-pointer ${
                              isCompleted
                                ? "bg-blue-600/10 border-blue-500/30"
                                : "bg-zinc-950/40 hover:bg-zinc-950/70 border-zinc-900"
                            }`}
                          >
                            <div className="flex items-start gap-3.5">
                              <div className={`w-6 h-6 rounded-xl border flex items-center justify-center transition-colors shrink-0 mt-0.5 ${
                                isCompleted 
                                  ? "bg-cyan-500 border-cyan-600 text-white" 
                                  : "border-zinc-800 text-transparent"
                              }`}>
                                <Check className="w-3.5 h-3.5" />
                              </div>
                              <div className="space-y-1">
                                <span className={`font-extrabold text-sm block leading-none ${isCompleted ? "text-cyan-300 line-through" : "text-white"}`}>
                                  {index + 1}. {ex.name}
                                </span>
                                {ex.notes && (
                                  <p className="text-slate-400 leading-relaxed text-[11px] font-semibold mt-1 max-w-xl">
                                    <strong className="text-slate-300">Form Note:</strong> {ex.notes}
                                  </p>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between shrink-0 border-t md:border-t-0 border-zinc-800 pt-2.5 md:pt-0 gap-2">
                              <span className="text-xs font-black text-cyan-400">
                                {ex.sets ? `${ex.sets} Sets` : ""} {ex.reps ? `× ${ex.reps} Reps` : ""}
                              </span>
                              <div className="flex gap-2">
                                {ex.weight && ex.weight !== "N/A" && (
                                  <span className="text-[9.5px] text-cyan-300 font-bold bg-[#111827] px-2 py-0.5 rounded border border-zinc-800">
                                    Wt: {ex.weight}
                                  </span>
                                )}
                                <span className="text-[9.5px] text-slate-400 font-bold bg-[#111827] px-2 py-0.5 rounded border border-zinc-800">
                                  Rest: {ex.rest || "60s"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 3. DIET EXPERIENCE TAB */}
        {/* ========================================================================= */}
        {activeTab === "My Diet" && (() => {
          const clientDietObj = activeDietPlan?.days?.[selectedDietDay] || activeDietPlan?.[selectedDietDay.toLowerCase()] || [];
          
          let dayMeals = [];
          if (Array.isArray(clientDietObj)) {
            dayMeals = clientDietObj;
          } else if (typeof clientDietObj === "object") {
            const mealsConfig = [
              { key: "earlyMorning", label: "🍽 Early Morning" },
              { key: "breakfast", label: "🍽 Breakfast" },
              { key: "midMorning", label: "🍎 Mid-Morning Snack" },
              { key: "lunch", label: "🍛 Lunch" },
              { key: "eveningSnack", label: "☕ Evening Snack" },
              { key: "preWorkout", label: "⚡ Pre-Workout Snack" },
              { key: "postWorkout", label: "🥤 Post-Workout Shake" },
              { key: "dinner", label: "🍽 Dinner" },
              { key: "beforeBed", label: "🌙 Before Bed" }
            ];
            dayMeals = mealsConfig.map((meal) => {
              const m = clientDietObj[meal.key] || {};
              return {
                label: meal.label,
                items: m.meal || "No meal planned",
                kcal: m.calories ? `${m.calories} kcal` : "0 kcal",
                macros: `P: ${m.protein || 0}g | C: ${m.carbs || 0}g | F: ${m.fat || 0}g`
              };
            }).filter((m) => m.items !== "No meal planned");
          }

          if (dayMeals.length === 0 && DEFAULT_DIET_PLAN.days[selectedDietDay]) {
            dayMeals = DEFAULT_DIET_PLAN.days[selectedDietDay];
          }

          const displayCalories = activeDietPlan?.calories || "2,050 kcal";
          const displayProtein = activeDietPlan?.protein || "145g";
          const displayCarbs = activeDietPlan?.carbs || "190g";
          const displayFats = activeDietPlan?.fats || "58g";
          const displayWater = activeDietPlan?.water || "3.5L";

          return (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              {/* Header */}
              <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">
                      🥗 Client Nutritional Blueprint (Read-Only)
                    </span>
                    {selectedDietDay === todayName && (
                      <span className="text-[10px] font-black text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 uppercase tracking-widest">
                        Today
                      </span>
                    )}
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-white">
                    {selectedDietDay}'s Meal Plan — <span className="text-blue-400">{activeDietPlan?.template || "Curated Diet"}</span>
                  </h2>
                  <p className="text-xs text-slate-400 font-medium">
                    Follow your prescribed caloric and macronutrient targets to accelerate muscle synthesis and recovery.
                  </p>
                </div>
                
                <div className="p-4 bg-[#080B14] rounded-2xl border border-zinc-800 shrink-0 text-center">
                  <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Hydration Level</span>
                  <span className="text-sm font-black text-blue-400 block mt-1">{waterCount}L / {displayWater}</span>
                </div>
              </div>

              {/* Weekly Day Selector */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-xl space-y-3">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2 border-zinc-800">
                  Weekly Meal Plan Days
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
                  {weekdayOrder.map((day) => {
                    const isToday = day === todayName;
                    const isSelected = day === selectedDietDay;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDietDay(day)}
                        className={`p-3 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[92px] ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-blue-400 font-black shadow-md shadow-blue-500/10"
                            : isToday
                            ? "bg-zinc-900 border-zinc-700 text-slate-200 border-dashed"
                            : "bg-zinc-950/40 border-zinc-900 text-slate-400 hover:border-zinc-800"
                        }`}
                      >
                        <div className="flex items-center gap-1">
                          <span className="text-[10px] uppercase font-black tracking-wider">{day.slice(0, 3)}</span>
                          {isToday && <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />}
                        </div>
                        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center my-1 border border-zinc-800 text-xs">
                          🥗
                        </div>
                        <span className="text-[8.5px] font-bold block truncate max-w-[80px] uppercase tracking-tighter text-slate-400">
                          {displayCalories}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Macro Targets Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
                {[
                  { label: "Target Calories", val: displayCalories, desc: "Daily energy target", icon: Zap, color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
                  { label: "Total Protein", val: displayProtein, desc: "Lean muscle repair", icon: Heart, color: "text-rose-400 bg-rose-500/10 border-rose-500/20" },
                  { label: "Total Carbs", val: displayCarbs, desc: "Glycogen restoration", icon: Activity, color: "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" },
                  { label: "Total Fats", val: displayFats, desc: "Hormone regulation", icon: Award, color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
                  { label: "Water Target", val: displayWater, desc: "Hydration ceiling", icon: Droplet, color: "text-blue-400 bg-blue-400/10 border-blue-400/20" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-[#111827] border border-[#1e293b]/45 rounded-2xl p-4 flex flex-col justify-between text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">{card.label}</span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-3">
                        <h4 className="text-base font-black text-white">{card.val}</h4>
                        <p className="text-[9px] text-slate-400 mt-0.5 leading-snug font-semibold">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Meal Details */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800">
                  {selectedDietDay} Meal Blueprint Schedule
                </span>
                
                <div className="divide-y divide-[#1e293b]/35 space-y-4">
                  {dayMeals.length > 0 ? (
                    dayMeals.map((m, i) => (
                      <div key={i} className={`pt-4 ${i === 0 ? "pt-0" : ""} flex flex-col sm:flex-row justify-between sm:items-start gap-3.5 text-xs`}>
                        <div className="space-y-1">
                          <span className="font-extrabold text-white text-sm block leading-none">{m.label || m.type}</span>
                          <p className="text-slate-200 leading-relaxed font-semibold max-w-xl mt-1.5">{m.items}</p>
                        </div>
                        <div className="text-right shrink-0 border-t sm:border-t-0 border-zinc-800 pt-2.5 sm:pt-0">
                          <span className="font-black text-white block">{m.kcal}</span>
                          <span className="text-[10px] text-cyan-400 block mt-0.5 font-bold">{m.macros}</span>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="py-8 text-center text-xs text-slate-400 border border-dashed border-[#1e293b]/40 rounded-2xl">
                      No diet meals configured for {selectedDietDay}.
                    </div>
                  )}
                </div>

                {/* Hydration Tracker Footer */}
                <div className="mt-6 pt-4 border-t border-[#1e293b]/40 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                  <span className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                    <Droplet className="w-4 h-4 text-blue-400 animate-pulse" /> Hydration Log Tracker
                  </span>
                  <div className="flex items-center gap-2">
                    <button 
                      onClick={() => setWaterCount((prev) => Math.max(Number((prev - 0.5).toFixed(1)), 0))}
                      className="px-3 py-1.5 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded-xl text-slate-300 text-xs font-bold cursor-pointer transition active:scale-95"
                    >
                      -0.5L
                    </button>
                    <span className="text-xs font-black text-white px-2">{waterCount} L</span>
                    <button 
                      onClick={() => {
                        setWaterCount((prev) => Math.min(Number((prev + 0.5).toFixed(1)), 8));
                        toast.success("Hydration intake updated.");
                      }}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-xl text-white text-xs font-bold cursor-pointer transition active:scale-95"
                    >
                      +0.5L
                    </button>
                  </div>
                </div>
              </div>

            </div>
          );
        })()}

        {/* ========================================================================= */}
        {/* 4. ATTENDANCE EXPERIENCE TAB */}
        {/* ========================================================================= */}
        {activeTab === "Attendance" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Top Attendance Stats Strip */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Attendance Rate</span>
                <span className="text-xl font-black text-blue-400 mt-1 block">{attendanceStats.rate}%</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Present Sessions</span>
                <span className="text-xl font-black text-emerald-400 mt-1 block">{attendanceStats.present} Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Absent Logs</span>
                <span className="text-xl font-black text-rose-500 mt-1 block">{attendanceStats.absent} Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block">Total Recorded</span>
                <span className="text-xl font-black text-slate-200 mt-1 block">{attendanceStats.total} Logs</span>
              </div>
            </div>

            {/* Heatmap calendar */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3 border-b border-zinc-800 pb-3">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Attendance Calendar Heatmap (Read-Only)</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5">Overview of your official gym training check-in logs</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Month:</span>
                  <input
                    type="month"
                    value={clientAttendanceMonth}
                    onChange={(e) => setClientAttendanceMonth(e.target.value)}
                    className="px-2.5 py-1 text-xs border border-zinc-800 rounded-xl bg-zinc-950 font-bold text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              {/* Heatmap Grid */}
              <div className="py-2 text-xs">
                <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-black text-slate-500 uppercase mb-3">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                
                <div className="grid grid-cols-7 gap-2.5">
                  {Array.from({ length: clientAttendanceHeatmap.startDayOffset }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-square bg-transparent" />
                  ))}
                  {clientAttendanceHeatmap.days.map((item) => {
                    let cellBg = "bg-zinc-950/45 border-zinc-900 text-slate-500";
                    let label = "No Session Recorded";
                    if (item.status === 1) {
                      cellBg = "bg-emerald-500/15 border-emerald-500/35 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5";
                      label = `Present (In: ${item.log?.timeIn || "08:00 AM"})`;
                    } else if (item.status === 4) {
                      cellBg = "bg-amber-500/15 border-amber-500/35 text-amber-400 font-extrabold shadow-sm shadow-amber-500/5";
                      label = `Late Entry (In: ${item.log?.timeIn || "09:30 AM"})`;
                    } else if (item.status === 2) {
                      cellBg = "bg-rose-500/15 border-rose-500/35 text-rose-500 font-extrabold shadow-sm shadow-rose-500/5";
                      label = "Absent";
                    }

                    return (
                      <div
                        key={item.day}
                        onMouseEnter={() => setHoveredDate({ day: item.day, label, dateStr: item.dateStr })}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`aspect-square border rounded-2xl flex flex-col items-center justify-center text-xs relative transition duration-150 hover:scale-105 select-none cursor-default ${cellBg}`}
                      >
                        <span>{item.day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Date Hover Label */}
                {hoveredDate && (
                  <div className="mt-4 p-2.5 bg-zinc-900 border border-zinc-800 text-slate-200 rounded-xl text-center font-bold text-[10.5px] animate-in fade-in duration-100">
                    {hoveredDate.dateStr || `Day ${hoveredDate.day}`} — <strong className="text-white">{hoveredDate.label}</strong>
                  </div>
                )}

                {/* Legend */}
                <div className="flex flex-wrap gap-4 justify-center items-center mt-6 pt-4 border-t border-zinc-800 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/20 border border-emerald-500/30" /><span className="text-slate-400">Present</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-amber-500/20 border border-amber-500/30" /><span className="text-slate-400">Late</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/20 border border-rose-500/30" /><span className="text-slate-400">Absent</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-zinc-950/45 border border-zinc-900" /><span className="text-slate-400">No Record</span></div>
                </div>
              </div>
            </div>

            {/* Historical Check-in Feed */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800">
                Recent Attendance History Logs
              </span>
              <div className="divide-y divide-zinc-800 max-h-60 overflow-y-auto">
                {clientAttendanceLogs.length > 0 ? (
                  [...clientAttendanceLogs]
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .slice(0, 15)
                    .map((log) => (
                      <div key={log.id} className="py-3 flex items-center justify-between gap-4 text-xs">
                        <div>
                          <span className="font-bold text-white block">{formatDateFriendly(log.date)}</span>
                          <span className="text-[10px] text-slate-400 block mt-0.5">
                            {log.timeIn && log.timeIn !== "-" ? `Entry Time: ${log.timeIn}` : "Scheduled Check-in"}
                          </span>
                        </div>
                        <div className="shrink-0">
                          {log.status === "Present" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
                              Present
                            </span>
                          ) : log.status === "Late" ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-amber-500/10 text-amber-400 border border-amber-500/30">
                              Late
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-rose-500/10 text-rose-400 border border-rose-500/30">
                              Absent
                            </span>
                          )}
                        </div>
                      </div>
                    ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No attendance logs recorded yet.
                  </div>
                )}
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 5. PROGRESS & MEASUREMENTS TAB */}
        {/* ========================================================================= */}
        {activeTab === "Progress" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Top KPI Overview Bar */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-blue-400" />
                    <span>Weight & Body Progress Overview</span>
                  </h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">
                    Tracking body composition and metric changes against target of {clientProgressStats.targetWeight} kg
                  </p>
                </div>
                <button
                  onClick={() => setMeasurementModalOpen(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black text-[10px] uppercase tracking-wider rounded-xl shadow cursor-pointer transition active:scale-95"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Log Weight & Stats</span>
                </button>
              </div>

              {/* Metric Badges Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 pt-2">
                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Current Weight</span>
                  <div className="mt-2">
                    <span className="text-base font-black text-white">{clientProgressStats.currentWeight}</span>
                    <span className="text-[10px] text-slate-400 ml-1">kg</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Starting Weight</span>
                  <div className="mt-2">
                    <span className="text-base font-black text-slate-300">{clientProgressStats.startingWeight}</span>
                    <span className="text-[10px] text-slate-400 ml-1">kg</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Total Delta</span>
                  <div className="mt-2">
                    <span className={`text-base font-black ${
                      clientProgressStats.weightChange < 0
                        ? "text-emerald-400"
                        : clientProgressStats.weightChange > 0
                        ? "text-blue-400"
                        : "text-slate-400"
                    }`}>
                      {clientProgressStats.weightChange > 0 ? `+${clientProgressStats.weightChange}` : clientProgressStats.weightChange}
                    </span>
                    <span className="text-[10px] text-slate-400 ml-1">kg</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Body Fat</span>
                  <div className="mt-2">
                    <span className="text-base font-black text-emerald-400">
                      {clientProgressStats.bodyFat ? `${clientProgressStats.bodyFat}%` : "—"}
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Chest</span>
                  <div className="mt-2">
                    <span className="text-base font-black text-white">{clientProgressStats.chest ? `${clientProgressStats.chest} cm` : "—"}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Waist</span>
                  <div className="mt-2">
                    <span className="text-base font-black text-white">{clientProgressStats.waist ? `${clientProgressStats.waist} cm` : "—"}</span>
                  </div>
                </div>

                <div className="p-3 bg-zinc-950/60 rounded-2xl border border-zinc-800 flex flex-col justify-between">
                  <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Biceps / Thigh</span>
                  <div className="mt-2">
                    <span className="text-xs font-black text-white">
                      {clientProgressStats.biceps ? `${clientProgressStats.biceps}cm` : "—"} / {clientProgressStats.thigh ? `${clientProgressStats.thigh}cm` : "—"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* SVG Weight Progression Line graph */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Weight Progression Trend</h3>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Tracking body weight parameters against goal target of {clientProgressStats.targetWeight} kg</p>
                </div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Target: {clientProgressStats.targetWeight} kg
                </span>
              </div>

              {/* Custom SVG Line Chart */}
              {(() => {
                const points = clientProgressStats.sorted.length > 0 
                  ? clientProgressStats.sorted.map((item) => Number(item.weight))
                  : [clientProgressStats.currentWeight];

                const targetWeight = clientProgressStats.targetWeight;
                const allValues = [...points, targetWeight];
                const maxVal = Math.max(...allValues) + 3;
                const minVal = Math.max(Math.min(...allValues) - 3, 0);
                const valRange = (maxVal - minVal) || 1;

                const chartW = 500;
                const chartH = 140;
                const paddingX = 40;
                const paddingY = 20;
                const plotW = chartW - paddingX * 2;
                const plotH = chartH - paddingY * 2;

                const mapX = (index) => {
                  if (points.length <= 1) return paddingX + plotW / 2;
                  return paddingX + (index / (points.length - 1)) * plotW;
                };

                const mapY = (val) => chartH - paddingY - ((val - minVal) / valRange) * plotH;

                let pathD = "";
                points.forEach((val, i) => {
                  const px = mapX(i);
                  const py = mapY(val);
                  if (i === 0) pathD = `M ${px} ${py}`;
                  else pathD += ` L ${px} ${py}`;
                });

                const targetY = mapY(targetWeight);

                const renderList = clientProgressStats.sorted.length > 0 
                  ? clientProgressStats.sorted.map((m) => ({
                      date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                      weight: Number(m.weight)
                    }))
                  : [{ date: "Baseline", weight: clientProgressStats.currentWeight }];

                return (
                  <div className="relative pt-2">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                      <line x1={paddingX} y1={mapY(maxVal - 1)} x2={chartW - paddingX} y2={mapY(maxVal - 1)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                      <line x1={paddingX} y1={mapY(minVal + 1)} x2={chartW - paddingX} y2={mapY(minVal + 1)} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />

                      {/* Target line */}
                      <line x1={paddingX} y1={targetY} x2={chartW - paddingX} y2={targetY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x={chartW - paddingX - 65} y={targetY - 5} fill="#f43f5e" fontSize="7" fontWeight="bold">Target: {targetWeight}kg</text>

                      {/* Weight progress path line */}
                      {points.length > 1 && (
                        <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      )}

                      {/* Plot Nodes */}
                      {renderList.map((item, i) => {
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
                      {renderList.map((item, i) => {
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
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-zinc-800">
                  BMI Calculator Index
                </span>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">BMI SCORE</span>
                    <span className="text-xl font-black text-white mt-1 block">{clientProgressStats.bmi}</span>
                  </div>
                  <span className={`px-3 py-1 text-[10px] font-black rounded-lg uppercase tracking-wider border ${
                    clientProgressStats.bmi < 18.5
                      ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
                      : clientProgressStats.bmi <= 24.9
                      ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      : "bg-purple-500/10 text-purple-400 border-purple-500/20"
                  }`}>
                    {clientProgressStats.bmi < 18.5 ? "Underweight" : clientProgressStats.bmi <= 24.9 ? "Normal Weight" : "Overweight"}
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2 pt-2 border-t border-zinc-800">
                  Calculated based on height of {client?.height || 170} cm and current body mass of {clientProgressStats.currentWeight} kg.
                </p>
              </div>

              {/* Goals completion progress */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-zinc-800">
                  Goal Completion Progress
                </span>
                <div className="flex items-center gap-4 text-xs">
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3.5" />
                      <circle 
                        cx="18" 
                        cy="18" 
                        r="15.915" 
                        fill="none" 
                        stroke="#06b6d4" 
                        strokeWidth="3.5" 
                        strokeDasharray={`${clientProgressStats.progressPct} 100`} 
                      />
                    </svg>
                    <span className="absolute text-[10px] font-black text-white">{clientProgressStats.progressPct}%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold uppercase">Weight Delta</span>
                    <span className="font-extrabold text-white block text-sm mt-0.5">
                      {clientProgressStats.weightChange > 0 ? `+${clientProgressStats.weightChange}` : clientProgressStats.weightChange} kg from Start
                    </span>
                    <span className="text-[9px] text-slate-400 block">
                      {clientProgressStats.remainingToTarget} kg remaining to target ({clientProgressStats.targetWeight} kg)
                    </span>
                  </div>
                </div>
              </div>

              {/* Starting stats */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-400 uppercase tracking-wider block border-b pb-1.5 border-zinc-800">
                  Starting Profile Baseline
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Starting Weight</span>
                    <strong className="text-slate-300 block mt-1">{clientProgressStats.startingWeight} kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Current Weight</span>
                    <strong className="text-slate-300 block mt-1">{clientProgressStats.currentWeight} kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Goal Target</span>
                    <strong className="text-cyan-400 block mt-1">{clientProgressStats.targetWeight} kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Latest Log Date</span>
                    <strong className="text-slate-300 block mt-1">{clientProgressStats.latestDate}</strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Measurements Timeline Feed */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800">
                Measurement Timeline Logs ({clientProgressStats.sorted.length})
              </span>
              <div className="divide-y divide-zinc-800 max-h-60 overflow-y-auto">
                {clientProgressStats.sorted.length > 0 ? (
                  [...clientProgressStats.sorted].reverse().map((log) => (
                    <div key={log.id || log.date} className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <div>
                        <span className="font-bold text-white block">{formatDateFriendly(log.date)}</span>
                        <div className="flex flex-wrap items-center gap-3 text-[10px] text-slate-400 mt-1">
                          {log.bodyFat ? <span>Body Fat: <strong className="text-emerald-400">{log.bodyFat}%</strong></span> : null}
                          {log.chest ? <span>Chest: <strong className="text-slate-300">{log.chest}cm</strong></span> : null}
                          {log.waist ? <span>Waist: <strong className="text-slate-300">{log.waist}cm</strong></span> : null}
                          {log.arms ? <span>Biceps: <strong className="text-slate-300">{log.arms}cm</strong></span> : null}
                          {log.thigh ? <span>Thigh: <strong className="text-slate-300">{log.thigh}cm</strong></span> : null}
                          {log.notes && <span className="italic text-slate-500">"{log.notes}"</span>}
                        </div>
                      </div>
                      <div className="shrink-0">
                        <span className="px-3 py-1 rounded-full text-xs font-black bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          {log.weight} kg
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="py-6 text-center text-slate-400 text-xs italic">
                    No measurement history logged yet.
                  </div>
                )}
              </div>
            </div>

            {/* LOG WEIGHT MODAL */}
            {measurementModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setMeasurementModalOpen(false)} />
                
                <form 
                  onSubmit={handleClientAddMeasurement} 
                  className="relative bg-[#0b101c]/95 border border-[#1e293b]/70 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left"
                >
                  <h3 className="text-sm font-black text-white mb-4 font-display uppercase tracking-wider">Log Weight Progress</h3>
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Weight (kg) *</label>
                      <input
                        type="number"
                        step="0.1"
                        required
                        value={newMeasure.weight}
                        onChange={(e) => setNewMeasure({ ...newMeasure, weight: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        placeholder="e.g. 72.5"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Body Fat (%)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasure.bodyFat}
                          onChange={(e) => setNewMeasure({ ...newMeasure, bodyFat: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="e.g. 15.4"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Waist (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasure.waist}
                          onChange={(e) => setNewMeasure({ ...newMeasure, waist: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="e.g. 82"
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Chest (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasure.chest}
                          onChange={(e) => setNewMeasure({ ...newMeasure, chest: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="e.g. 96"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Arms (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasure.arms}
                          onChange={(e) => setNewMeasure({ ...newMeasure, arms: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="e.g. 34"
                        />
                      </div>
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Thigh (cm)</label>
                        <input
                          type="number"
                          step="0.1"
                          value={newMeasure.thigh}
                          onChange={(e) => setNewMeasure({ ...newMeasure, thigh: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="e.g. 52"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 border-t border-zinc-900 pt-4">
                    <button
                      type="button"
                      onClick={() => setMeasurementModalOpen(false)}
                      className="flex-1 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-black text-slate-400 uppercase tracking-wider cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-600/10 transition"
                    >
                      Submit Log
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 6. PAYMENTS & MEMBERSHIP TAB */}
        {/* ========================================================================= */}
        {activeTab === "Payments" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Membership Header */}
            <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/25 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border uppercase tracking-wide inline-block ${
                  daysRemaining > 0 
                    ? "text-cyan-400 bg-cyan-400/10 border-cyan-400/20" 
                    : "text-rose-400 bg-rose-400/10 border-rose-400/20"
                }`}>
                  {daysRemaining > 0 ? "Active" : "Expired"} {client?.membership ? client.membership.toUpperCase() : "STANDARD"} Membership ⭐
                </span>
                <h2 className="text-lg font-black text-white mt-3">BeFit Gym Subscription & Billing Status</h2>
                <div className="flex flex-wrap gap-4 mt-2 text-xs text-slate-400 font-semibold">
                  <div>Monthly Fee: <strong className="text-white">₹{(Number(client?.monthlyFees) || 3500).toLocaleString("en-IN")}</strong></div>
                  <div>Joined: <strong className="text-white">{client?.joinDate ? formatDateFriendly(client.joinDate) : "—"}</strong></div>
                  <div>Expires: <strong className="text-white">{client?.expiryDate ? formatDateFriendly(client.expiryDate) : "—"}</strong></div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-800 shrink-0 text-center min-w-[120px]">
                <span className="text-[9px] text-slate-400 font-bold block uppercase tracking-wider">Days Remaining</span>
                <span className={`text-xl font-black block mt-1 ${daysRemaining > 7 ? "text-cyan-400" : daysRemaining > 0 ? "text-amber-400" : "text-rose-500"}`}>
                  {daysRemaining} Days
                </span>
              </div>
            </div>

            {/* Invoices Ledger */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div className="flex justify-between items-center pb-2.5 border-b border-zinc-800">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                  Payment History & Invoices (Read-Only)
                </span>
                <span className="text-[10px] font-bold text-slate-400">
                  {invoiceList.length} Record{invoiceList.length !== 1 ? "s" : ""}
                </span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b]/35 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-4">Invoice #</th>
                      <th className="py-2.5 px-4">Plan / Period</th>
                      <th className="py-2.5 px-4">Payment Date</th>
                      <th className="py-2.5 px-4">Due Date</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4 text-center">Status</th>
                      <th className="py-2.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/20 text-slate-300">
                    {invoiceList.length > 0 ? (
                      invoiceList.map((item) => (
                        <tr key={item.id} className="hover:bg-zinc-950/20 transition duration-150">
                          <td className="py-3.5 px-4">
                            <span className="font-mono font-bold text-white block">{item.number}</span>
                            {item.transactionId && item.transactionId !== "—" && (
                              <span className="text-[9px] font-mono text-slate-500 block mt-0.5">{item.transactionId}</span>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-slate-200 block">{item.plan}</span>
                            <span className="text-[9px] text-slate-500 block mt-0.5">
                              {item.membershipStart ? formatDateFriendly(item.membershipStart) : "—"} → {item.membershipEnd ? formatDateFriendly(item.membershipEnd) : "—"}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-medium">
                            {item.status === "Paid" ? formatDateFriendly(item.date) : "—"}
                          </td>
                          <td className="py-3.5 px-4 text-slate-400 font-medium">
                            {item.dueDate ? formatDateFriendly(item.dueDate) : "—"}
                          </td>
                          <td className="py-3.5 px-4 font-black text-white">₹{item.amount.toLocaleString("en-IN")}</td>
                          <td className="py-3.5 px-4 font-medium text-slate-400">{item.method}</td>
                          <td className="py-3.5 px-4 text-center">
                            <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider ${
                              item.status === "Paid" ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" :
                              item.status === "Pending" ? "bg-amber-500/10 text-amber-400 border border-amber-500/20" :
                              item.status === "Expired" ? "bg-zinc-500/10 text-zinc-400 border border-zinc-500/20" :
                              "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                            }`}>
                              {item.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => downloadClientReceipt(item)}
                              className="p-1.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition cursor-pointer"
                              title="Download invoice receipt"
                            >
                              <Download className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="8" className="py-8 text-center text-slate-400 italic">
                          No payment records found for your account.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* ========================================================================= */}
        {/* 7. ACHIEVEMENTS TAB */}
        {/* ========================================================================= */}
        {activeTab === "Achievements" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-black text-white">Personal Achievements Showcase</h2>
              <p className="text-xs text-slate-400 mt-1">Unlock gamification milestone badges by logging daily training sessions and maintaining consistent check-ins.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { icon: "🏆", name: "First Workout", status: true, desc: "Successfully completed your first gym workout routine.", reward: "100 XP" },
                { icon: "🔥", name: "7 Day Streak", status: true, desc: "Completed gym sessions for 7 consecutive days.", reward: "250 XP" },
                { icon: "💪", name: "30 Workouts Completed", status: true, desc: "Logged 30 physical training check-ins.", reward: "500 XP" },
                { icon: "🎯", name: "Goal Completed", status: false, desc: "Reached target bodyweight reduction goal.", reward: "1000 XP" },
                { icon: "⭐", name: "Perfect Attendance", status: true, desc: "Maintained 90%+ monthly attendance rate.", reward: "300 XP" }
              ].map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-3xl p-5 hover:-translate-y-1 transition duration-200 shadow-lg relative overflow-hidden flex flex-col justify-between h-44 group ${
                    badge.status 
                      ? "bg-gradient-to-br from-[#111827] via-[#0f1524] to-[#121c2d] border-blue-500/25 text-white" 
                      : "bg-[#111827]/40 border-[#1e293b]/35 opacity-30"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        badge.status ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-zinc-800 text-slate-500"
                      }`}>
                        {badge.status ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{badge.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[200px]">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-800 pt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-400">Reward points</span>
                    <strong className="text-cyan-400">{badge.reward}</strong>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* 8. CLIENT PROFILE TAB */}
        {/* ========================================================================= */}
        {activeTab === "Profile" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200 pb-8">
            
            {/* Profile Header Card */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl relative overflow-hidden flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                <img
                  src={client.photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"}
                  alt={client.name}
                  className="w-20 h-20 rounded-2xl object-cover border-2 border-blue-500/20"
                />
                <div className="text-center sm:text-left space-y-1 mt-2 sm:mt-0">
                  <h2 className="text-xl font-black text-white">{client.name}</h2>
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Client ID: #{String(client.id || "").slice(0, 8)}</span>
                  
                  <div className="flex flex-wrap gap-2 mt-3 justify-center sm:justify-start">
                    <span className={`px-2.5 py-0.5 text-[9px] font-black uppercase tracking-wider rounded-lg border ${
                      client.status === "Active"
                        ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                        : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                    }`}>
                      {client.status || "Active"}
                    </span>
                    <span className="px-2.5 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[9px] font-black uppercase tracking-wider rounded-lg">
                      Goal: {client.goal || "General Fitness"}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-md shadow-blue-500/15"
                >
                  <Edit3 className="w-4 h-4" />
                  <span>Edit Profile</span>
                </button>
              </div>
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Personal Info & Medical Info */}
              <div className="space-y-6">
                
                {/* Personal Information */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                  <div className="flex justify-between items-center border-b pb-2.5 border-zinc-800">
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block">
                      Personal Information
                    </span>
                    <button
                      onClick={() => setEditProfileModalOpen(true)}
                      className="text-[10px] font-bold text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Edit3 className="w-3 h-3 shrink-0" /> <span>Edit</span>
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Full Name</span>
                      <span className="text-white font-extrabold mt-1 block">{client.name}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Phone Number</span>
                      <span className="text-white font-extrabold mt-1 block">{client.phone || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Email Address</span>
                      <span className="text-white font-extrabold mt-1 block">{client.email || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Gender</span>
                      <span className="text-white font-extrabold mt-1 block">{client.gender || "Male"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Height</span>
                      <span className="text-white font-extrabold mt-1 block">{client.height ? `${client.height} cm` : "170 cm"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Emergency Contact</span>
                      <span className="text-white font-extrabold mt-1 block">{client.emergencyContact || "N/A"}</span>
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-slate-500 font-bold block text-[10px]">Address</span>
                      <span className="text-white font-extrabold mt-1 block">{client.address || "N/A"}</span>
                    </div>
                  </div>
                </div>

                {/* Protected Health & Medical Background */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800 flex items-center gap-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    <span>Health & Medical Safety Profile</span>
                  </span>
                  <div className="space-y-3 text-xs">
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Medical Conditions</span>
                      <span className="text-white font-semibold mt-0.5 block">{client.medicalConditions || "None reported"}</span>
                    </div>
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Allergies</span>
                      <span className="text-white font-semibold mt-0.5 block">{client.allergies || "None reported"}</span>
                    </div>
                    <div className="p-3 bg-zinc-950/60 rounded-xl border border-zinc-800">
                      <span className="text-[10px] font-bold text-slate-400 block uppercase">Physical Injuries / Rehab Notes</span>
                      <span className="text-white font-semibold mt-0.5 block">{client.injuries || "None reported"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Membership Card & Coach Feedback */}
              <div className="space-y-6">
                
                {/* Membership validity */}
                <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#121b2d] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left relative overflow-hidden group">
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20">
                        BEFIT {client.membership?.toUpperCase() || "PREMIUM"} ⭐
                      </span>
                      <span className="text-xs font-black text-slate-300">{client.status || "Active"}</span>
                    </div>

                    <div className="space-y-3 mt-4">
                      <div className="grid grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Join Date</span>
                          <span className="font-extrabold text-white mt-1 block">
                            {client.joinDate ? formatDateFriendly(client.joinDate) : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Expiration Date</span>
                          <span className="font-extrabold text-white mt-1 block">
                            {client.expiryDate ? formatDateFriendly(client.expiryDate) : "—"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Days Remaining</span>
                          <span className="font-extrabold text-cyan-400 mt-1 block">{daysRemaining} Days</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider">Monthly Fee</span>
                          <span className="font-extrabold text-white mt-1 block">₹{(Number(client.monthlyFees) || 3500).toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-800 pt-4 mt-2">
                      <span className="text-[9px] text-slate-400 font-black block uppercase tracking-wider mb-2">Plan Privileges</span>
                      <ul className="text-[11px] text-slate-300 font-semibold space-y-1.5">
                        <li className="flex items-center gap-1.5">🏋️ Unlimited Gym access</li>
                        <li className="flex items-center gap-1.5">🧘 Free group fitness classes</li>
                        <li className="flex items-center gap-1.5">🚿 Luxury locker & steam room access</li>
                        <li className="flex items-center gap-1.5">🥤 1 Guest pass per month</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Coach Feedback */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left font-sans">
                  <div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                      <h3 className="text-xs font-black uppercase text-slate-300 tracking-wider">Coach Feedback & Notes</h3>
                      <span className="text-[10px] text-purple-400 font-bold">Assigned Trainer</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-900">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 to-blue-500 flex items-center justify-center text-white font-black text-sm">
                        RS
                      </div>
                      <div>
                        <span className="font-extrabold text-white text-xs block">Rahul Sharma</span>
                        <span className="text-[9.5px] text-slate-400 block font-bold mt-0.5">Head Gym Coach</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-300 bg-zinc-950/20 border border-zinc-900/60 p-3.5 rounded-2xl italic leading-relaxed">
                      "{client.trainerNotes || "Great progress this month. Focus on progressive overload on your compound lifts and maintain consistent post-workout protein intake."}"
                    </p>
                  </div>

                  <button
                    onClick={() => toast.success("Coach channel notification sent.")}
                    className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer text-center"
                  >
                    Message Trainer
                  </button>
                </div>

              </div>

            </div>

            {/* Account Actions */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-800">
                Account Settings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => setEditProfileModalOpen(true)}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-xs font-black text-white transition duration-150 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Edit Profile Details</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => toast.info("To change your password, use the Reset Password option on the login screen or contact gym staff.")}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-xs font-black text-white transition duration-150 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <Lock className="w-4 h-4 text-purple-400" />
                    <span>Change Password</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={handleLogout}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-rose-500/20 rounded-2xl text-xs font-black text-rose-500 transition duration-150 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <LogOut className="w-4 h-4 text-rose-500" />
                    <span>Sign Out</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
            </div>

            {/* EDIT PROFILE MODAL */}
            {editProfileModalOpen && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm" onClick={() => setEditProfileModalOpen(false)} />
                
                <form 
                  onSubmit={handleSaveProfile} 
                  className="relative bg-[#0b101c]/95 border border-[#1e293b]/70 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in scale-in duration-200 text-left"
                >
                  <h3 className="text-sm font-black text-white mb-4 uppercase tracking-wider">Edit Profile Information</h3>
                  <p className="text-xs text-slate-400 mb-4">You can update your contact and personal information below.</p>
                  
                  <div className="space-y-3.5">
                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Phone Number</label>
                      <input
                        type="text"
                        value={profileForm.phone}
                        onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        placeholder="+91 98765 43210"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Gender</label>
                        <select
                          value={profileForm.gender}
                          onChange={(e) => setProfileForm({ ...profileForm, gender: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        >
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>

                      <div>
                        <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Height (cm)</label>
                        <input
                          type="number"
                          step="0.5"
                          value={profileForm.height}
                          onChange={(e) => setProfileForm({ ...profileForm, height: e.target.value })}
                          className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                          placeholder="175"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Emergency Contact</label>
                      <input
                        type="text"
                        value={profileForm.emergencyContact}
                        onChange={(e) => setProfileForm({ ...profileForm, emergencyContact: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25"
                        placeholder="Name - +91 98765 00000"
                      />
                    </div>

                    <div>
                      <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Address</label>
                      <textarea
                        rows={2}
                        value={profileForm.address}
                        onChange={(e) => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full px-3 py-2 text-xs border border-zinc-800 rounded-xl bg-zinc-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/25 resize-none"
                        placeholder="Apartment, Street, City"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 mt-6 border-t border-zinc-900 pt-4">
                    <button
                      type="button"
                      onClick={() => setEditProfileModalOpen(false)}
                      className="flex-1 py-2 border border-zinc-800 hover:bg-zinc-900 rounded-xl text-xs font-black text-slate-400 uppercase tracking-wider cursor-pointer transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isUpdatingProfile}
                      className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-blue-600/10 transition disabled:opacity-50"
                    >
                      {isUpdatingProfile ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </form>
              </div>
            )}

          </div>
        )}

        {/* ========================================================================= */}
        {/* 9. NOTIFICATIONS TAB */}
        {/* ========================================================================= */}
        {activeTab === "Notifications" && (
          <div className="space-y-6 animate-in fade-in duration-300 text-left">
            {/* Header Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#09090b] border border-zinc-800 rounded-3xl relative overflow-hidden gap-4">
              <div className="relative z-10 space-y-1.5">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  🔔 Notification Center
                </div>
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
                  My Notifications
                </h1>
                <p className="text-xs text-slate-400 font-medium">
                  Stay updated on your diet plans, workout routines, check-in logs, and membership receipts.
                </p>
              </div>

              {unreadNotifications.length > 0 && (
                <button
                  onClick={handleMarkAllClientNotifs}
                  className="relative z-10 flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-md shadow-blue-500/20 cursor-pointer"
                >
                  <CheckCheck className="w-4 h-4" />
                  <span>Mark All Read</span>
                </button>
              )}
            </div>

            {/* Category Filter Pills & Search */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-2xl p-3.5 shadow-xl space-y-3">
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 scrollbar-none">
                {[
                  { id: "all", label: "All" },
                  { id: "unread", label: "Unread" },
                  { id: "payment", label: "Payment" },
                  { id: "workout", label: "Workout" },
                  { id: "diet", label: "Diet" },
                  { id: "attendance", label: "Attendance" },
                  { id: "general", label: "General" },
                ].map((tab) => {
                  const isActive = clientNotifCategory === tab.id;
                  const count =
                    tab.id === "all"
                      ? notifications.length
                      : tab.id === "unread"
                      ? unreadNotifications.length
                      : notifications.filter((n) => n.type === tab.id).length;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setClientNotifCategory(tab.id)}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer ${
                        isActive
                          ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                          : "text-slate-400 hover:bg-zinc-800 hover:text-white"
                      }`}
                    >
                      <span>{tab.label}</span>
                      <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-black ${
                        isActive ? "bg-white/20 text-white" : "bg-zinc-800 text-slate-400"
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              <div className="relative">
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={clientNotifSearch}
                  onChange={(e) => setClientNotifSearch(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs bg-zinc-950/60 border border-zinc-800 rounded-xl text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition"
                />
              </div>
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {filteredClientNotifications.length > 0 ? (
                filteredClientNotifications.map((notif) => {
                  const isRead = notif.read;
                  return (
                    <div
                      key={notif.id}
                      className={`p-4 rounded-2xl border transition-all duration-200 flex gap-4 items-start ${
                        isRead
                          ? "bg-[#111827]/60 border-[#1e293b]/30 opacity-75"
                          : "bg-[#111827] border-blue-500/30 ring-1 ring-blue-500/10 shadow-lg"
                      }`}
                    >
                      {/* Left accent bar */}
                      <div className={`w-1 h-10 rounded-full shrink-0 ${
                        isRead
                          ? "bg-zinc-800"
                          : notif.type === "payment"
                          ? "bg-emerald-500"
                          : notif.type === "workout"
                          ? "bg-blue-500"
                          : notif.type === "diet"
                          ? "bg-amber-500"
                          : notif.type === "attendance"
                          ? "bg-indigo-500"
                          : "bg-purple-500"
                      }`} />

                      {/* Icon */}
                      <div className={`p-2.5 rounded-xl shrink-0 mt-0.5 ${
                        isRead
                          ? "bg-zinc-800 text-slate-400"
                          : notif.type === "payment"
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                          : notif.type === "workout"
                          ? "bg-blue-500/10 text-blue-400 border border-blue-500/20"
                          : notif.type === "diet"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : notif.type === "attendance"
                          ? "bg-indigo-500/10 text-indigo-400 border border-indigo-500/20"
                          : "bg-purple-500/10 text-purple-400 border border-purple-500/20"
                      }`}>
                        {notif.type === "payment" ? (
                          <CreditCard className="w-4 h-4" />
                        ) : notif.type === "workout" ? (
                          <Dumbbell className="w-4 h-4" />
                        ) : notif.type === "diet" ? (
                          <Apple className="w-4 h-4" />
                        ) : notif.type === "attendance" ? (
                          <Calendar className="w-4 h-4" />
                        ) : (
                          <Bell className="w-4 h-4" />
                        )}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <h3 className={`text-xs font-black ${isRead ? "text-slate-400" : "text-white"}`}>
                              {notif.title}
                            </h3>
                            <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase bg-zinc-800 text-slate-300">
                              {notif.type}
                            </span>
                          </div>
                          <span className="text-[10px] text-slate-500 font-bold shrink-0">
                            {notif.date} • {notif.time}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                          {notif.message}
                        </p>
                      </div>

                      {/* Mark Read Action */}
                      {!isRead && (
                        <button
                          onClick={() => handleMarkNotifRead(notif.id)}
                          className="p-1.5 bg-blue-600/10 hover:bg-blue-600 text-blue-400 hover:text-white rounded-lg transition shrink-0 cursor-pointer"
                          title="Mark as Read"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  );
                })
              ) : (
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-12 text-center space-y-3">
                  <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 mx-auto">
                    <Bell className="w-6 h-6" />
                  </div>
                  <h3 className="text-sm font-black text-white">No Notifications Found</h3>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    {clientNotifSearch
                      ? `No notifications matching "${clientNotifSearch}".`
                      : "You have no unread notifications in this category. All caught up!"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </main>

      {/* --- MOBILE BOTTOM TAB NAVIGATION BAR --- */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-[#0b101c]/95 backdrop-blur-md border-t border-[#1e293b]/50 flex items-center justify-around z-40 px-2 pb-safe shadow-[0_-4px_12px_rgba(0,0,0,0.03)] no-print">
        {[
          { name: "Dashboard", tab: "Dashboard", icon: LayoutDashboard },
          { name: "Workout", tab: "My Workout", icon: Dumbbell },
          { name: "Diet", tab: "My Diet", icon: Apple },
          { name: "Attendance", tab: "Attendance", icon: Calendar },
          { name: "Progress", tab: "Progress", icon: Scale },
          { name: "Payments", tab: "Payments", icon: CreditCard },
          { name: "Profile", tab: "Profile", icon: User }
        ].map((item) => {
          const isActive = activeTab === item.tab;
          const Icon = item.icon;
          return (
            <button
              key={item.name}
              onClick={() => setActiveTab(item.tab)}
              className={`flex flex-col items-center justify-center flex-1 py-1 transition-all cursor-pointer ${
                isActive
                  ? "text-blue-400 font-black"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`p-1 px-2 rounded-xl flex flex-col items-center transition ${isActive ? "text-blue-400" : ""}`}>
                <Icon className="w-5 h-5" />
                <span className="text-[9px] font-bold mt-1 tracking-tight">{item.name}</span>
              </div>
            </button>
          );
        })}
      </nav>

    </div>
  );
};

export default ClientDashboard;
