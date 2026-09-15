import React, { createContext, useContext, useState, useEffect } from "react";
import {
  INITIAL_CLIENTS,
  INITIAL_WORKOUTS,
  INITIAL_DIETS,
  INITIAL_ATTENDANCE,
  INITIAL_PAYMENTS,
  INITIAL_MEASUREMENTS,
  INITIAL_SETTINGS,
  INITIAL_NOTIFICATIONS
} from "../data/mockData";
import { getWorkoutPlanForGoal, getDietPlanForGoal } from "../utils/plannerDefaults";
import { api } from "../services/api";
import { toast } from "sonner";

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};

export const CRMProvider = ({ children }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Load initial states from localStorage or use initial dummy data
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem("gym_clients");
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const calculateAge = (dobString) => {
    if (!dobString) return 25;
    const birthDate = new Date(dobString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const mapBackendClient = (apiClient) => {
    const email = apiClient.email?.toLowerCase();
    const mockClient = INITIAL_CLIENTS.find(c => c.email?.toLowerCase() === email);

    // Dynamic age calculation from dob
    const age = apiClient.dob ? calculateAge(apiClient.dob) : (mockClient?.age || 25);

    return {
      id: apiClient.id,
      name: apiClient.full_name,
      email: apiClient.email,
      phone: apiClient.phone || mockClient?.phone || "",
      photo: apiClient.profile_image_url || mockClient?.photo || "https://images.unsplash.com/photo-1548690312-e3b507d8c110?auto=format&fit=crop&q=80&w=200",
      dob: apiClient.dob || mockClient?.dob || "",
      gender: apiClient.gender || mockClient?.gender || "Male",
      address: apiClient.address || mockClient?.address || "",
      emergencyContact: apiClient.emergency_contact || mockClient?.emergencyContact || "",
      created_at: apiClient.created_at,
      updated_at: apiClient.updated_at,
      age: age,
      
      // Keep other properties from backend profile with fallbacks
      goal: apiClient.goal || mockClient?.goal || "General Fitness",
      membership: mockClient?.membership || "Standard Monthly",
      status: mockClient?.status || "Active",
      joinDate: apiClient.created_at?.split("T")[0] || mockClient?.joinDate || new Date().toISOString().split("T")[0],
      expiryDate: mockClient?.expiryDate || "2026-12-31",
      monthlyFees: mockClient?.monthlyFees || 3500,
      currentWeight: mockClient?.currentWeight || 70,
      targetWeight: mockClient?.targetWeight || 70,
      height: apiClient.height || mockClient?.height || 170,
      bmi: mockClient?.bmi || 24.2,
      bodyFat: mockClient?.bodyFat || 20,
      chest: mockClient?.chest || 90,
      waist: mockClient?.waist || 80,
      arms: mockClient?.arms || 30,
      thigh: mockClient?.thigh || 50,
      medicalConditions: apiClient.medical_conditions || mockClient?.medicalConditions || "None",
      allergies: apiClient.allergies || mockClient?.allergies || "None",
      injuries: apiClient.injuries || mockClient?.injuries || "None",
      trainerNotes: mockClient?.trainerNotes || ""
    };
  };

  const fetchClients = async () => {
    const role = localStorage.getItem("gym_role") || sessionStorage.getItem("gym_role");
    const token = localStorage.getItem("gym_token") || sessionStorage.getItem("gym_token");
    if (!token) return;

    setLoading(true);
    setError(null);
    try {
      if (role === "trainer") {
        const res = await api.get("/api/clients");
        if (res.success && res.data?.clients) {
          const mapped = res.data.clients.map(c => mapBackendClient(c));
          setClients(mapped);
        }
      } else if (role === "client") {
        const clientId = localStorage.getItem("gym_client_id") || sessionStorage.getItem("gym_client_id");
        if (clientId) {
          const res = await api.get(`/api/clients/${clientId}`);
          if (res.success && res.data?.client) {
            const mapped = mapBackendClient(res.data.client);
            setClients([mapped]);
          }
        }
      }
    } catch (err) {
      console.error("Error loading clients from backend:", err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchClientById = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get(`/api/clients/${id}`);
      if (res.success && res.data?.client) {
        const mapped = mapBackendClient(res.data.client);
        setClients(prev => {
          if (prev.some(c => c.id === mapped.id)) {
            return prev.map(c => c.id === mapped.id ? { ...c, ...mapped } : c);
          }
          return [mapped, ...prev];
        });
        return mapped;
      }
    } catch (err) {
      console.error(`Error loading client ${id} from backend:`, err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const [workouts, setWorkouts] = useState({});
  const [diets, setDiets] = useState({});
  const [exercises, setExercises] = useState([]);

  const [attendance, setAttendance] = useState([]);
  const [measurements, setMeasurements] = useState({});

  const [payments, setPayments] = useState([]);

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("gym_settings");
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [notifications, setNotifications] = useState([]);

  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("gym_theme");
    return saved ? saved : "light";
  });

  // Sync to localStorage
  useEffect(() => {
    localStorage.setItem("gym_clients", JSON.stringify(clients));
  }, [clients]);

  useEffect(() => {
    localStorage.setItem("gym_workouts", JSON.stringify(workouts));
  }, [workouts]);

  useEffect(() => {
    localStorage.setItem("gym_diets", JSON.stringify(diets));
  }, [diets]);

  useEffect(() => {
    localStorage.setItem("gym_attendance", JSON.stringify(attendance));
  }, [attendance]);



  useEffect(() => {
    localStorage.setItem("gym_measurements", JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem("gym_settings", JSON.stringify(settings));
  }, [settings]);



  useEffect(() => {
    localStorage.setItem("gym_theme", theme);
    if (theme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  };

  // State manipulation methods

  // 1. Client Management
  const addClient = async (newClient) => {
    setLoading(true);
    setError(null);
    try {
      const registerPayload = {
        email: newClient.email?.trim().toLowerCase(),
        password: "BefitPass123!", // Secure default password for new client onboarding
        fullName: newClient.name?.trim(),
        phone: newClient.phone || null,
        dob: newClient.dob || (newClient.age ? new Date(new Date().getFullYear() - parseInt(newClient.age), 0, 1).toISOString().split("T")[0] : null),
        gender: newClient.gender || null,
        address: newClient.address || null,
        emergencyContact: newClient.emergencyContact || null,
      };

      const regRes = await api.post("/api/auth/register/client", registerPayload);
      if (regRes.success && regRes.data?.user?.id) {
        const clientId = regRes.data.user.id;
        
        // Assign this newly registered client to the trainer
        await api.post("/api/trainer-clients", { client_id: clientId });

        // Fetch client profile to populate state
        const clientRes = await api.get(`/api/clients/${clientId}`);
        if (clientRes.success && clientRes.data?.client) {
          const mapped = mapBackendClient(clientRes.data.client);
          
          // Seed local state elements (workouts, diets, measurements) if they exist
          const defaultWorkout = getWorkoutPlanForGoal(newClient.goal);
          setWorkouts((prev) => ({ ...prev, [clientId]: defaultWorkout }));

          const defaultDiet = getDietPlanForGoal(newClient.goal);
          setDiets((prev) => ({ ...prev, [clientId]: defaultDiet }));

          const initialMeasurement = {
            date: mapped.joinDate,
            weight: parseFloat(newClient.currentWeight) || 70,
            bmi: parseFloat(newClient.bmi) || 24.2,
            bodyFat: parseFloat(newClient.bodyFat) || 20,
            chest: parseFloat(newClient.chest) || 90,
            waist: parseFloat(newClient.waist) || 80,
            arms: parseFloat(newClient.arms) || 30,
            thigh: parseFloat(newClient.thigh) || 50
          };
          setMeasurements((prev) => ({ ...prev, [clientId]: [initialMeasurement] }));

          setClients((prev) => [mapped, ...prev]);

          return clientId;
        }
      }
    } catch (err) {
      console.error("Backend client registration and assignment failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClient = async (clientId, updatedFields) => {
    setLoading(true);
    setError(null);
    try {
      const apiPayload = {};
      if (updatedFields.name !== undefined) apiPayload.full_name = updatedFields.name;
      if (updatedFields.phone !== undefined) apiPayload.phone = updatedFields.phone;
      if (updatedFields.dob !== undefined) apiPayload.dob = updatedFields.dob;
      if (updatedFields.gender !== undefined) apiPayload.gender = updatedFields.gender;
      if (updatedFields.address !== undefined) apiPayload.address = updatedFields.address;
      if (updatedFields.emergencyContact !== undefined) apiPayload.emergency_contact = updatedFields.emergencyContact;
      if (updatedFields.photo !== undefined) apiPayload.profile_image_url = updatedFields.photo;

      const res = await api.patch(`/api/clients/${clientId}`, apiPayload);
      if (res.success && res.data?.client) {
        const mapped = mapBackendClient(res.data.client);
        setClients((prev) =>
          prev.map((c) => (c.id === clientId ? { ...c, ...mapped, ...updatedFields } : c))
        );
        return mapped;
      }
    } catch (err) {
      console.error("Failed to update client profile:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClient = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/trainer-clients/${clientId}`);
      if (res.success) {
        setClients((prev) => prev.filter((c) => c.id !== clientId));
        
        // Clean up auxiliary client data
        setWorkouts((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
        setDiets((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
        setMeasurements((prev) => {
          const copy = { ...prev };
          delete copy[clientId];
          return copy;
        });
        setAttendance((prev) => prev.filter((att) => att.clientId !== clientId));
        setPayments((prev) => prev.filter((pay) => pay.clientId !== clientId));
        setNotifications((prev) => prev.filter((n) => n.clientId !== clientId));
      }
    } catch (err) {
      console.error("Failed to unassign client:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const assignClient = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.post("/api/trainer-clients", { client_id: clientId });
      if (res.success) {
        const clientRes = await api.get(`/api/clients/${clientId}`);
        if (clientRes.success && clientRes.data?.client) {
          const mapped = mapBackendClient(clientRes.data.client);
          setClients((prev) => {
            if (prev.some((c) => c.id === mapped.id)) return prev;
            return [mapped, ...prev];
          });
          return mapped;
        }
      }
    } catch (err) {
      console.error("Failed to assign client:", err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 2. Workout Planner Actions
  const transformBackendWorkout = (plan) => {
    if (!plan) return null;
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const weekly = { id: plan.id, name: plan.name, goal: plan.goal };
    
    // Initialize all days to Rest Day
    days.forEach(day => {
      weekly[day] = {
        muscleGroup: "Rest Day",
        restTime: "60 sec",
        duration: "45 min",
        notes: "",
        exercises: []
      };
    });

    if (plan.schedules && Array.isArray(plan.schedules)) {
      plan.schedules.forEach(sched => {
        const day = sched.day_of_week.toLowerCase();
        if (weekly[day]) {
          if (weekly[day].muscleGroup === "Rest Day") {
            weekly[day].muscleGroup = plan.name || "Workout Split";
            weekly[day].notes = sched.notes || "";
            weekly[day].duration = sched.duration_seconds ? `${Math.round(sched.duration_seconds / 60)} min` : "45 min";
            weekly[day].restTime = sched.rest_seconds ? `${sched.rest_seconds} sec` : "60 sec";
          }
          weekly[day].exercises.push({
            id: sched.id, // schedule entry id
            exercise_id: sched.exercise_id,
            name: sched.exercise?.name || "Custom Exercise",
            category: sched.exercise?.muscle_group || "Compound",
            sets: sched.sets || 3,
            reps: sched.reps || "10",
            weight: sched.weight_kg !== null && sched.weight_kg !== undefined ? `${sched.weight_kg} kg` : "N/A",
            orderIndex: sched.order_index || 0
          });
        }
      });
    }

    // Sort exercises by orderIndex
    days.forEach(day => {
      weekly[day].exercises.sort((a, b) => (a.orderIndex || 0) - (b.orderIndex || 0));
    });

    return weekly;
  };

  const transformBackendDiet = (plan) => {
    if (!plan) return null;
    const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];
    const mealKeys = [
      "earlyMorning",
      "breakfast",
      "midMorning",
      "lunch",
      "eveningSnack",
      "preWorkout",
      "postWorkout",
      "dinner",
      "beforeBed"
    ];

    const weekly = {
      id: plan.id,
      template: plan.name || "General Fitness Plan",
      waterGoal: 3.5
    };

    days.forEach(day => {
      weekly[day] = {};
      mealKeys.forEach(key => {
        weekly[day][key] = { id: "", meal: "", quantity: "", calories: "", protein: "", carbs: "", fat: "", notes: "" };
      });
    });

    if (plan.meals && Array.isArray(plan.meals)) {
      plan.meals.forEach(m => {
        const typeStr = m.meal_type || "";
        const parts = typeStr.split("_");
        if (parts.length === 2) {
          const day = parts[0].toLowerCase();
          const key = parts[1];
          if (weekly[day] && weekly[day][key]) {
            weekly[day][key] = {
              id: m.id,
              meal: m.food_name || "",
              quantity: m.quantity || "",
              calories: m.calories !== null && m.calories !== undefined ? String(m.calories) : "",
              protein: m.protein_grams !== null && m.protein_grams !== undefined ? String(m.protein_grams) : "",
              carbs: m.carbs_grams !== null && m.carbs_grams !== undefined ? String(m.carbs_grams) : "",
              fat: m.fat_grams !== null && m.fat_grams !== undefined ? String(m.fat_grams) : "",
              notes: m.notes || ""
            };
          }
        }
      });
    }

    return weekly;
  };

  const fetchExercises = async () => {
    try {
      const response = await api.get("/api/exercises");
      if (response && response.success && response.data?.exercises) {
        setExercises(response.data.exercises);
        return response.data.exercises;
      }
    } catch (err) {
      console.error("fetchExercises failed:", err);
    }
    return [];
  };

  const fetchWorkoutPlanForClient = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const url = clientId ? `/api/workouts?clientId=${clientId}` : "/api/workouts";
      const listResponse = await api.get(url);
      if (listResponse && listResponse.success && listResponse.data?.workoutPlans) {
        const plans = listResponse.data.workoutPlans;
        if (plans.length > 0) {
          const activePlan = plans.find(p => p.is_active) || plans[0];
          const detailResponse = await api.get(`/api/workouts/${activePlan.id}`);
          if (detailResponse && detailResponse.success && detailResponse.data?.workoutPlan) {
            const transformed = transformBackendWorkout(detailResponse.data.workoutPlan);
            const key = clientId || "logged_in_client";
            setWorkouts(prev => ({
              ...prev,
              [key]: transformed
            }));
            return transformed;
          }
        } else {
          const key = clientId || "logged_in_client";
          setWorkouts(prev => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
          });
        }
      }
    } catch (err) {
      console.error(`fetchWorkoutPlanForClient failed:`, err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    return null;
  };

  const fetchDietPlanForClient = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const url = clientId ? `/api/diets?clientId=${clientId}` : "/api/diets";
      const listResponse = await api.get(url);
      if (listResponse && listResponse.success && listResponse.data?.dietPlans) {
        const plans = listResponse.data.dietPlans;
        if (plans.length > 0) {
          const activePlan = plans.find(p => p.is_active) || plans[0];
          const detailResponse = await api.get(`/api/diets/${activePlan.id}`);
          if (detailResponse && detailResponse.success && detailResponse.data?.dietPlan) {
            const transformed = transformBackendDiet(detailResponse.data.dietPlan);
            const key = clientId || "logged_in_client";
            setDiets(prev => ({
              ...prev,
              [key]: transformed
            }));
            return transformed;
          }
        } else {
          const key = clientId || "logged_in_client";
          setDiets(prev => {
            const copy = { ...prev };
            delete copy[key];
            return copy;
          });
        }
      }
    } catch (err) {
      console.error(`fetchDietPlanForClient failed:`, err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
    return null;
  };

  const getOrCreateExercise = async (name, category) => {
    const existing = exercises.find(ex => ex.name.toLowerCase() === name.trim().toLowerCase());
    if (existing) return existing.id;
    
    try {
      const response = await api.post("/api/exercises", {
        name: name.trim(),
        muscle_group: category || "Compound"
      });
      if (response && response.success && response.data?.exercise) {
        setExercises(prev => [...prev, response.data.exercise]);
        return response.data.exercise.id;
      }
    } catch (err) {
      console.error("Failed to create exercise in database:", err);
    }
    return null;
  };

  const updateWorkout = async (clientId, day, muscleGroup, restTime, duration, notes, exercisesList) => {
    setLoading(true);
    setError(null);
    try {
      let planId = workouts[clientId]?.id;
      if (!planId) {
        const targetClient = clients.find(c => c.id === clientId);
        const planRes = await api.post("/api/workouts", {
          client_id: clientId,
          name: muscleGroup || "Weekly Split",
          goal: targetClient?.goal || "General Fitness",
          is_active: true
        });
        if (planRes && planRes.success && planRes.data?.workoutPlan) {
          planId = planRes.data.workoutPlan.id;
        } else {
          throw new Error("Failed to create workout plan on the backend.");
        }
      }

      const oldSchedules = workouts[clientId]?.[day.toLowerCase()]?.exercises || [];
      for (const oldEx of oldSchedules) {
        if (oldEx.id) {
          await api.delete(`/api/workouts/schedules/${oldEx.id}`);
        }
      }

      const capitalizeDay = (d) => d.charAt(0).toUpperCase() + d.slice(1).toLowerCase();
      const parseWeight = (wStr) => {
        if (!wStr) return null;
        const num = parseFloat(wStr.replace(/[^\d.]/g, ''));
        return isNaN(num) ? null : num;
      };

      const durationSec = parseInt(duration) * 60 || 2700;
      const restSec = parseInt(restTime) || 60;

      for (let i = 0; i < exercisesList.length; i++) {
        const ex = exercisesList[i];
        if (!ex.name.trim()) continue;
        
        const exerciseId = await getOrCreateExercise(ex.name, ex.category);
        if (exerciseId) {
          await api.post(`/api/workouts/${planId}/schedules`, {
            day_of_week: capitalizeDay(day),
            exercise_id: exerciseId,
            sets: Number(ex.sets) || 3,
            reps: String(ex.reps) || "10",
            weight_kg: parseWeight(ex.weight),
            duration_seconds: durationSec,
            rest_seconds: restSec,
            order_index: i,
            notes: notes || null
          });
        }
      }

      await fetchWorkoutPlanForClient(clientId);
      toast.success(`Workout schedule for ${day} updated in backend.`);
    } catch (err) {
      console.error("updateWorkout failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error(`Workout update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const duplicateWorkoutWeek = async (fromClientId, toClientId) => {
    setLoading(true);
    setError(null);
    try {
      const srcList = await api.get(`/api/workouts?clientId=${fromClientId}`);
      if (!srcList || !srcList.success || !srcList.data?.workoutPlans || srcList.data.workoutPlans.length === 0) {
        toast.error("Source client has no workout plans to duplicate.");
        return;
      }
      const srcPlan = srcList.data.workoutPlans.find(p => p.is_active) || srcList.data.workoutPlans[0];
      const srcDetail = await api.get(`/api/workouts/${srcPlan.id}`);
      if (!srcDetail || !srcDetail.success || !srcDetail.data?.workoutPlan) {
        toast.error("Failed to load source workout plan details.");
        return;
      }
      
      const schedules = srcDetail.data.workoutPlan.schedules || [];

      const targetClient = clients.find(c => c.id === toClientId);
      const newPlanRes = await api.post("/api/workouts", {
        client_id: toClientId,
        name: srcPlan.name || "Weekly Routine Split",
        goal: targetClient?.goal || srcPlan.goal || "General Fitness",
        is_active: true
      });

      if (!newPlanRes || !newPlanRes.success || !newPlanRes.data?.workoutPlan) {
        toast.error("Failed to create target workout plan.");
        return;
      }

      const newPlanId = newPlanRes.data.workoutPlan.id;

      for (const sched of schedules) {
        await api.post(`/api/workouts/${newPlanId}/schedules`, {
          day_of_week: sched.day_of_week,
          exercise_id: sched.exercise_id,
          sets: sched.sets,
          reps: sched.reps,
          weight_kg: sched.weight_kg,
          duration_seconds: sched.duration_seconds,
          rest_seconds: sched.rest_seconds,
          order_index: sched.order_index,
          notes: sched.notes
        });
      }

      await fetchWorkoutPlanForClient(toClientId);
      toast.success("Workout program duplicated successfully!");
    } catch (err) {
      console.error("duplicateWorkoutWeek failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error(`Duplication failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateDiet = async (clientId, day, mealKey, mealData) => {
    setLoading(true);
    setError(null);
    try {
      let planId = diets[clientId]?.id;
      if (!planId) {
        const targetClient = clients.find(c => c.id === clientId);
        const planRes = await api.post("/api/diets", {
          client_id: clientId,
          name: "Daily Meal Plan",
          goal: targetClient?.goal || "General Fitness",
          is_active: true
        });
        if (planRes && planRes.success && planRes.data?.dietPlan) {
          planId = planRes.data.dietPlan.id;
        } else {
          throw new Error("Failed to create diet plan on the backend.");
        }
      }

      const formattedType = `${day.toLowerCase()}_${mealKey}`;
      const existingMealId = diets[clientId]?.[day.toLowerCase()]?.[mealKey]?.id;

      if (!mealData.meal || !mealData.meal.trim()) {
        if (existingMealId) {
          await api.delete(`/api/diets/meals/${existingMealId}`);
        }
      } else {
        const payload = {
          meal_type: formattedType,
          food_name: mealData.meal,
          quantity: mealData.quantity || "1 serving",
          calories: Number(mealData.calories) || 0,
          protein_grams: Number(mealData.protein) || 0,
          carbs_grams: Number(mealData.carbs) || 0,
          fat_grams: Number(mealData.fat) || 0,
          notes: mealData.notes || null
        };

        if (existingMealId) {
          await api.patch(`/api/diets/meals/${existingMealId}`, payload);
        } else {
          await api.post(`/api/diets/${planId}/meals`, payload);
        }
      }

      await fetchDietPlanForClient(clientId);
    } catch (err) {
      console.error("updateDiet failed:", err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error(`Diet update failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  const updateDietTemplate = async (clientId, template, waterGoal) => {
    setLoading(true);
    setError(null);
    try {
      const planId = diets[clientId]?.id;
      if (!planId) {
        const targetClient = clients.find(c => c.id === clientId);
        const planRes = await api.post("/api/diets", {
          client_id: clientId,
          name: template,
          goal: targetClient?.goal || template,
          is_active: true
        });
        if (planRes && planRes.success && planRes.data?.dietPlan) {
          await fetchDietPlanForClient(clientId);
        }
      } else {
        await api.patch(`/api/diets/${planId}`, { name: template });
        await fetchDietPlanForClient(clientId);
      }
      toast.success("Diet template header updated.");
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const applyDietTemplatePreset = async (clientId, templateName) => {
    setLoading(true);
    setError(null);
    try {
      const presetMeal = (meal, c, p, carb, f) => ({ meal, calories: c, protein: p, carbs: carb, fat: f });

      let meals = {};
      if (templateName === "Weight Loss") {
        meals = {
          earlyMorning: presetMeal("Warm water with lemon & 1 tsp honey", 20, 0, 5, 0),
          breakfast: presetMeal("Egg white scramble (3 eggs) with spinach & 1 toast", 220, 18, 22, 4),
          midMorning: presetMeal("Greek yogurt (150g) with blueberries", 130, 15, 12, 0),
          lunch: presetMeal("Grilled chicken breast (150g) with broccoli & quinoa", 380, 40, 36, 4),
          eveningSnack: presetMeal("1 sliced cucumber + 10 almonds", 80, 3, 3, 7),
          preWorkout: presetMeal("Black coffee + 1 apple", 85, 0, 20, 0),
          postWorkout: presetMeal("Whey protein shake in water", 120, 25, 2, 1),
          dinner: presetMeal("Baked cod fish (150g) with stir fried beans", 250, 30, 8, 8),
          beforeBed: presetMeal("Warm chamomile tea", 0, 0, 0, 0)
        };
      } else if (templateName === "Muscle Gain") {
        meals = {
          earlyMorning: presetMeal("Water with glutamine & BCAA", 10, 2, 0, 0),
          breakfast: presetMeal("4 whole eggs scrambled, 3 toasts with peanut butter, milk", 750, 38, 55, 38),
          midMorning: presetMeal("Whey protein shake + oats (50g) + 1 banana", 450, 32, 50, 8),
          lunch: presetMeal("Grilled steak (200g) with white rice (200g) & vegetables", 720, 55, 65, 20),
          eveningSnack: presetMeal("Turkey & cheese double sandwich", 420, 35, 40, 12),
          preWorkout: presetMeal("Preworkout booster + 1 banana + black coffee", 100, 1, 24, 0),
          postWorkout: presetMeal("Whey protein (2 scoops) + 50g dextrose/karbo", 350, 48, 40, 1),
          dinner: presetMeal("Chicken thighs (200g) with sweet potato (200g) & asparagus", 680, 44, 52, 22),
          beforeBed: presetMeal("Casein protein pudding + walnuts (20g)", 320, 30, 8, 16)
        };
      } else {
        meals = {
          earlyMorning: presetMeal("Glass of water", 0, 0, 0, 0),
          breakfast: presetMeal("Oatmeal with sliced almonds & banana, 2 boiled eggs", 450, 22, 55, 14),
          midMorning: presetMeal("1 pear + protein bar", 260, 20, 25, 7),
          lunch: presetMeal("Chicken breast wrap with lettuce, tomato, light cheese", 420, 38, 32, 12),
          eveningSnack: presetMeal("Green tea + handful of mixed nuts", 160, 5, 6, 14),
          preWorkout: presetMeal("1 apple + black coffee", 85, 0, 20, 0),
          postWorkout: presetMeal("Whey protein shake", 120, 25, 2, 1),
          dinner: presetMeal("Baked salmon (150g) with brown rice & salad", 480, 35, 32, 18),
          beforeBed: presetMeal("Glass of warm milk with pinch of turmeric", 120, 8, 12, 5)
        };
      }

      const planRes = await api.post("/api/diets", {
        client_id: clientId,
        name: templateName,
        goal: templateName,
        is_active: true
      });

      if (!planRes || !planRes.success || !planRes.data?.dietPlan) {
        throw new Error("Failed to create diet plan template in the database.");
      }

      const planId = planRes.data.dietPlan.id;
      const days = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"];

      for (const day of days) {
        for (const [mealKey, mealVal] of Object.entries(meals)) {
          await api.post(`/api/diets/${planId}/meals`, {
            meal_type: `${day}_${mealKey}`,
            food_name: mealVal.meal,
            quantity: "1 serving",
            calories: mealVal.calories,
            protein_grams: mealVal.protein,
            carbs_grams: mealVal.carbs,
            fat_grams: mealVal.fat
          });
        }
      }

      await fetchDietPlanForClient(clientId);
      toast.success(`Loaded ${templateName} template diet plan.`);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      toast.error(`Preset application failed: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  // 4. Attendance & Weight Progress Actions
  const transformBackendAttendance = (att) => ({
    id: att.id,
    clientId: att.client_id,
    date: att.date,
    status: att.status === "present" ? "Present" : "Absent",
    timeIn: att.check_in_time ? new Date(att.check_in_time).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "-"
  });

  const transformBackendProgress = (p) => ({
    id: p.id,
    clientId: p.client_id,
    date: p.date,
    weight: Number(p.weight_kg),
    bodyFat: p.body_fat_pct !== null && p.body_fat_pct !== undefined ? Number(p.body_fat_pct) : null,
    chest: p.chest_cm !== null && p.chest_cm !== undefined ? Number(p.chest_cm) : null,
    waist: p.waist_cm !== null && p.waist_cm !== undefined ? Number(p.waist_cm) : null,
    arms: p.biceps_cm !== null && p.biceps_cm !== undefined ? Number(p.biceps_cm) : null,
    thigh: p.thigh_cm !== null && p.thigh_cm !== undefined ? Number(p.thigh_cm) : (p.hips_cm !== null && p.hips_cm !== undefined ? Number(p.hips_cm) : null),
    notes: p.notes || ""
  });

  const fetchAttendance = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const url = clientId ? `/api/attendance?clientId=${clientId}` : "/api/attendance";
      const res = await api.get(url);
      if (res && res.success && res.data?.attendance) {
        const transformed = res.data.attendance.map(transformBackendAttendance);
        setAttendance((prev) => {
          const otherRecords = clientId ? prev.filter(r => r.clientId !== clientId) : [];
          return [...otherRecords, ...transformed];
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchWeightProgress = async (clientId) => {
    if (!clientId) return;
    setLoading(true);
    setError(null);
    try {
      const url = `/api/progress/weight?clientId=${clientId}`;
      const res = await api.get(url);
      if (res && res.success && res.data?.weightProgress) {
        const transformed = res.data.weightProgress.map(transformBackendProgress);
        setMeasurements((prev) => ({
          ...prev,
          [clientId]: transformed
        }));
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const markClientAttendance = async (clientId, date, status, timeIn, notes) => {
    setLoading(true);
    setError(null);
    try {
      const dbStatus = status === "Present" || status === "Late" ? "present" : "absent";
      let checkInTime = null;
      if (dbStatus === "present") {
        if (timeIn && timeIn !== "-") {
          const todayIso = new Date().toISOString().split("T")[0];
          checkInTime = new Date(`${todayIso} ${timeIn}`).toISOString();
        } else {
          checkInTime = new Date().toISOString();
        }
      }

      // Check if attendance already exists for this client and date
      const existing = attendance.find(a => a.clientId === clientId && a.date === date);

      let res;
      if (existing) {
        res = await api.patch(`/api/attendance/${existing.id}`, {
          status: dbStatus,
          check_in_time: checkInTime,
          notes: notes || null
        });
      } else {
        res = await api.post("/api/attendance", {
          client_id: clientId,
          date,
          status: dbStatus,
          check_in_time: checkInTime,
          notes: notes || null
        });
      }

      if (res && res.success) {
        await fetchAttendance(clientId);
        toast.success(`Attendance successfully logged for ${date}.`);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      await fetchAttendance(clientId);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteClientAttendance = async (logId, clientId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/attendance/${logId}`);
      if (res && res.success) {
        await fetchAttendance(clientId);
        toast.success("Attendance record cleared.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const addWeightProgress = async (clientId, progressData) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {
        client_id: clientId,
        date: progressData.date || new Date().toISOString().split("T")[0],
        weight_kg: Number(progressData.weight),
        body_fat_pct: progressData.bodyFat ? Number(progressData.bodyFat) : null,
        chest_cm: progressData.chest ? Number(progressData.chest) : null,
        waist_cm: progressData.waist ? Number(progressData.waist) : null,
        biceps_cm: progressData.arms ? Number(progressData.arms) : null,
        thigh_cm: progressData.thigh ? Number(progressData.thigh) : null,
        hips_cm: progressData.thigh ? Number(progressData.thigh) : (progressData.hips ? Number(progressData.hips) : null),
        notes: progressData.notes || null
      };

      const res = await api.post("/api/progress/weight", payload);
      if (res && res.success) {
        await fetchWeightProgress(clientId);
        
        // Also update local client profile details
        setClients((prev) =>
          prev.map((c) =>
            c.id === clientId
              ? {
                  ...c,
                  currentWeight: payload.weight_kg,
                  bodyFat: payload.body_fat_pct || c.bodyFat,
                  chest: payload.chest_cm || c.chest,
                  waist: payload.waist_cm || c.waist,
                  arms: payload.biceps_cm || c.arms,
                  thigh: payload.thigh_cm || payload.hips_cm || c.thigh
                }
              : c
          )
        );
        toast.success("Progress record added successfully!");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWeightProgress = async (progressId, clientId) => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.delete(`/api/progress/weight/${progressId}`);
      if (res && res.success) {
        if (clientId) {
          await fetchWeightProgress(clientId);
        }
        toast.success("Measurement record removed.");
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 5. Payments Actions
  const transformBackendPayment = (p) => {
    const rawStatus = (p.status || "paid").toLowerCase();
    const formattedStatus = rawStatus === "paid" ? "Paid" :
                            rawStatus === "pending" ? "Pending" :
                            rawStatus === "overdue" ? "Overdue" :
                            rawStatus === "expired" ? "Expired" :
                            (rawStatus.charAt(0).toUpperCase() + rawStatus.slice(1));

    let formattedMethod = "Cash";
    if (p.payment_method) {
      const lower = p.payment_method.toLowerCase();
      if (lower === "upi") formattedMethod = "UPI";
      else if (lower === "card") formattedMethod = "Card";
      else if (lower === "bank_transfer" || lower === "bank transfer") formattedMethod = "Bank Transfer";
      else formattedMethod = "Cash";
    }

    return {
      id: p.id,
      clientId: p.client_id,
      clientName: p.client?.full_name || "Client",
      clientEmail: p.client?.email || "",
      clientPhone: p.client?.phone || "",
      clientPhoto: p.client?.profile_image_url || "",
      amount: Number(p.amount),
      date: p.payment_date ? p.payment_date.split("T")[0] : p.created_at.split("T")[0],
      paymentDate: p.payment_date ? p.payment_date.split("T")[0] : null,
      dueDate: p.due_date,
      membershipStart: p.membership_start || (p.payment_date ? p.payment_date.split("T")[0] : p.created_at.split("T")[0]),
      membershipEnd: p.membership_end || p.due_date,
      status: formattedStatus,
      rawStatus: rawStatus,
      method: formattedMethod,
      rawMethod: p.payment_method || "cash",
      transactionId: p.transaction_id || "-",
      membershipPlan: p.notes && p.notes.includes("Renewed") ? p.notes : "Standard Monthly",
      notes: p.notes || "",
      invoiceNumber: p.transaction_id ? `INV-${p.transaction_id}` : `INV-2026-${p.id.slice(0, 4).toUpperCase()}`
    };
  };

  const transformBackendNotification = (n) => ({
    id: n.id,
    userId: n.user_id,
    title: n.title,
    message: n.message,
    type: n.type,
    read: n.is_read,
    date: n.created_at ? n.created_at.split("T")[0] : new Date().toISOString().split("T")[0],
    time: n.created_at ? new Date(n.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }) : "Just now",
    clientId: n.type === "workout" || n.type === "diet" || n.type === "payment" || n.type === "attendance" ? n.user_id : null
  });

  const fetchPayments = async (clientId) => {
    setLoading(true);
    setError(null);
    try {
      const url = clientId ? `/api/payments?clientId=${clientId}` : "/api/payments";
      const res = await api.get(url);
      if (res && res.success && res.data?.payments) {
        const transformed = res.data.payments.map(transformBackendPayment);
        setPayments((prev) => {
          const otherRecords = clientId ? prev.filter(r => r.clientId !== clientId) : [];
          return [...otherRecords, ...transformed];
        });
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get("/api/notifications");
      if (res && res.success && res.data?.notifications) {
        const transformed = res.data.notifications.map(transformBackendNotification);
        setNotifications(transformed);
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const recordClientPayment = async (paymentData) => {
    setLoading(true);
    setError(null);
    try {
      let backendMethod = "cash";
      if (paymentData.method) {
        const lowerMethod = paymentData.method.toLowerCase();
        if (lowerMethod === "upi") backendMethod = "upi";
        else if (lowerMethod === "card") backendMethod = "card";
        else if (lowerMethod === "bank transfer" || lowerMethod === "bank_transfer") backendMethod = "bank_transfer";
      }

      const backendStatus = paymentData.status ? paymentData.status.toLowerCase() : "paid";
      const startDate = paymentData.membershipStart || paymentData.startDate || paymentData.date || new Date().toISOString().split("T")[0];
      const endDate = paymentData.membershipEnd || paymentData.endDate || paymentData.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const dueDate = paymentData.dueDate || endDate;

      let paymentDateVal = null;
      if (backendStatus === "paid") {
        paymentDateVal = paymentData.paymentDate || paymentData.date || new Date().toISOString().split("T")[0];
      }

      const payload = {
        client_id: paymentData.clientId,
        amount: Number(paymentData.amount),
        payment_date: paymentDateVal,
        due_date: dueDate,
        membership_start: startDate,
        membership_end: endDate,
        status: backendStatus,
        payment_method: backendMethod,
        transaction_id: paymentData.transactionId ? paymentData.transactionId.trim() : `TXN${Date.now()}`,
        notes: paymentData.notes || `Log payment for ${paymentData.membershipPlan || "Standard Monthly"}`
      };

      const res = await api.post("/api/payments", payload);
      if (res && res.success) {
        await fetchPayments(paymentData.clientId);
        
        if (backendStatus === "paid") {
          await updateClient(paymentData.clientId, { status: "Active" });
        }

        try {
          await api.post("/api/notifications", {
            user_id: paymentData.clientId,
            title: "Payment Recorded",
            message: `A payment of ₹${Number(paymentData.amount).toLocaleString("en-IN")} has been recorded for your account.`,
            type: "payment"
          });
        } catch (notifErr) {
          console.error("Failed to create payment notification record:", notifErr);
        }

        toast.success("Payment receipt logged successfully.");
        return res.data?.payment;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateClientPayment = async (paymentId, updatedFields) => {
    setLoading(true);
    setError(null);
    try {
      const payload = {};
      if (updatedFields.status !== undefined) payload.status = updatedFields.status.toLowerCase();
      if (updatedFields.amount !== undefined) payload.amount = Number(updatedFields.amount);
      if (updatedFields.method !== undefined) {
        const lower = updatedFields.method.toLowerCase();
        if (lower === "upi") payload.payment_method = "upi";
        else if (lower === "card") payload.payment_method = "card";
        else if (lower === "bank transfer" || lower === "bank_transfer") payload.payment_method = "bank_transfer";
        else payload.payment_method = "cash";
      }
      if (updatedFields.payment_date !== undefined) payload.payment_date = updatedFields.payment_date;
      if (updatedFields.due_date !== undefined) payload.due_date = updatedFields.due_date;
      if (updatedFields.membership_start !== undefined) payload.membership_start = updatedFields.membership_start;
      if (updatedFields.membership_end !== undefined) payload.membership_end = updatedFields.membership_end;
      if (updatedFields.transaction_id !== undefined) payload.transaction_id = updatedFields.transaction_id ? updatedFields.transaction_id.trim() : null;
      if (updatedFields.notes !== undefined) payload.notes = updatedFields.notes;

      const res = await api.patch(`/api/payments/${paymentId}`, payload);
      if (res && res.success) {
        await fetchPayments();
        toast.success("Payment record updated successfully.");
        return res.data?.payment;
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 6. Settings Actions
  const updateGymSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // 7. Notification Actions
  const markNotificationAsRead = async (notifId, isRead = true) => {
    try {
      const res = await api.patch(`/api/notifications/${notifId}`, { is_read: isRead });
      if (res && res.success) {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notifId ? { ...n, read: isRead } : n))
        );
      }
    } catch (err) {
      console.error(err);
      throw err;
    }
  };

  const toggleNotificationRead = async (notifId) => {
    const target = notifications.find((n) => n.id === notifId);
    const newStatus = target ? !target.read : false;
    await markNotificationAsRead(notifId, newStatus);
  };

  const clearAllNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.patch("/api/notifications");
      if (res && res.success) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      } else {
        const unreadList = notifications.filter((n) => !n.read);
        for (const n of unreadList) {
          await api.patch(`/api/notifications/${n.id}`, { is_read: true });
        }
        await fetchNotifications();
      }
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : String(err));
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const restoreDatabase = (backupData) => {
    if (!backupData) return false;
    try {
      if (backupData.clients) {
        setClients(backupData.clients);
        localStorage.setItem("gym_clients", JSON.stringify(backupData.clients));
      }
      if (backupData.workouts) {
        setWorkouts(backupData.workouts);
        localStorage.setItem("gym_workouts", JSON.stringify(backupData.workouts));
      }
      if (backupData.diets) {
        setDiets(backupData.diets);
        localStorage.setItem("gym_diets", JSON.stringify(backupData.diets));
      }
      if (backupData.attendance) {
        setAttendance(backupData.attendance);
        localStorage.setItem("gym_attendance", JSON.stringify(backupData.attendance));
      }
      if (backupData.payments) {
        setPayments(backupData.payments);
        localStorage.setItem("gym_payments", JSON.stringify(backupData.payments));
      }
      if (backupData.measurements) {
        setMeasurements(backupData.measurements);
        localStorage.setItem("gym_measurements", JSON.stringify(backupData.measurements));
      }
      if (backupData.settings) {
        setSettings(backupData.settings);
        localStorage.setItem("gym_settings", JSON.stringify(backupData.settings));
      }
      if (backupData.notifications) {
        setNotifications(backupData.notifications);
        localStorage.setItem("gym_notifications", JSON.stringify(backupData.notifications));
      }
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  return (
    <CRMContext.Provider
      value={{
        clients,
        workouts,
        diets,
        exercises,
        attendance,
        payments,
        measurements,
        settings,
        notifications,
        theme,
        toggleTheme,
        addClient,
        updateClient,
        deleteClient,
        updateWorkout,
        duplicateWorkoutWeek,
        updateDiet,
        updateDietTemplate,
        applyDietTemplatePreset,
        markClientAttendance,
        recordClientPayment,
        updateGymSettings,
        markNotificationAsRead,
        toggleNotificationRead,
        clearAllNotifications,
        restoreDatabase,
        loading,
        error,
        fetchClients,
        fetchClientById,
        assignClient,
        fetchExercises,
        fetchWorkoutPlanForClient,
        fetchDietPlanForClient,
        fetchAttendance,
        fetchWeightProgress,
        addWeightProgress,
        deleteWeightProgress,
        fetchPayments,
        fetchNotifications,
        updateClientPayment,
        deleteClientAttendance
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};
