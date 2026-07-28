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

const CRMContext = createContext();

export const useCRM = () => {
  const context = useContext(CRMContext);
  if (!context) {
    throw new Error("useCRM must be used within a CRMProvider");
  }
  return context;
};

export const CRMProvider = ({ children }) => {
  // Load initial states from localStorage or use initial dummy data
  const [clients, setClients] = useState(() => {
    const saved = localStorage.getItem("gym_clients");
    return saved ? JSON.parse(saved) : INITIAL_CLIENTS;
  });

  const [workouts, setWorkouts] = useState(() => {
    const saved = localStorage.getItem("gym_workouts");
    const loaded = saved ? JSON.parse(saved) : INITIAL_WORKOUTS;
    
    const updated = { ...loaded };
    INITIAL_CLIENTS.forEach((c) => {
      if (!updated[c.id] || Object.keys(updated[c.id]).length === 0 || !updated[c.id].monday || updated[c.id].monday.muscleGroup === "Rest Day") {
        updated[c.id] = getWorkoutPlanForGoal(c.goal);
      }
    });
    return updated;
  });

  const [diets, setDiets] = useState(() => {
    const saved = localStorage.getItem("gym_diets");
    const loaded = saved ? JSON.parse(saved) : INITIAL_DIETS;
    
    const updated = { ...loaded };
    INITIAL_CLIENTS.forEach((c) => {
      if (!updated[c.id] || Object.keys(updated[c.id]).length === 0 || !updated[c.id].monday || !updated[c.id].monday.breakfast || updated[c.id].monday.breakfast.meal === "") {
        updated[c.id] = getDietPlanForGoal(c.goal);
      }
    });
    return updated;
  });

  const [attendance, setAttendance] = useState(() => {
    const saved = localStorage.getItem("gym_attendance");
    return saved ? JSON.parse(saved) : INITIAL_ATTENDANCE;
  });

  const [payments, setPayments] = useState(() => {
    const saved = localStorage.getItem("gym_payments");
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [measurements, setMeasurements] = useState(() => {
    const saved = localStorage.getItem("gym_measurements");
    return saved ? JSON.parse(saved) : INITIAL_MEASUREMENTS;
  });

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("gym_settings");
    return saved ? JSON.parse(saved) : INITIAL_SETTINGS;
  });

  const [notifications, setNotifications] = useState(() => {
    const saved = localStorage.getItem("gym_notifications");
    return saved ? JSON.parse(saved) : INITIAL_NOTIFICATIONS;
  });

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
    localStorage.setItem("gym_payments", JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem("gym_measurements", JSON.stringify(measurements));
  }, [measurements]);

  useEffect(() => {
    localStorage.setItem("gym_settings", JSON.stringify(settings));
  }, [settings]);

  useEffect(() => {
    localStorage.setItem("gym_notifications", JSON.stringify(notifications));
  }, [notifications]);

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
  const addClient = (newClient) => {
    const clientId = `client_${Date.now()}`;
    const clientRecord = {
      id: clientId,
      status: "Active",
      joinDate: newClient.joinDate || new Date().toISOString().split("T")[0],
      ...newClient
    };

    setClients((prev) => [clientRecord, ...prev]);

    // Seed personalized weekly workout plan for new client
    const defaultWorkout = getWorkoutPlanForGoal(newClient.goal);
    setWorkouts((prev) => ({ ...prev, [clientId]: defaultWorkout }));

    // Seed personalized diet template based on client goal
    const defaultDiet = getDietPlanForGoal(newClient.goal);
    setDiets((prev) => ({ ...prev, [clientId]: defaultDiet }));

    // Seed initial measurements
    const initialMeasurement = {
      date: clientRecord.joinDate,
      weight: parseFloat(newClient.currentWeight) || 0,
      bmi: parseFloat(newClient.bmi) || 0,
      bodyFat: parseFloat(newClient.bodyFat) || 0,
      chest: parseFloat(newClient.chest) || 0,
      waist: parseFloat(newClient.waist) || 0,
      arms: parseFloat(newClient.arms) || 0,
      thigh: parseFloat(newClient.thigh) || 0
    };
    setMeasurements((prev) => ({ ...prev, [clientId]: [initialMeasurement] }));

    // Add automatic payment trigger
    const newPayment = {
      id: `pay_${Date.now()}`,
      clientId: clientId,
      clientName: newClient.name,
      amount: parseFloat(newClient.monthlyFees) || 80,
      date: clientRecord.joinDate,
      method: "Cash",
      status: "Unpaid",
      membershipPlan: newClient.membership || "Standard Monthly",
      invoiceNumber: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`
    };
    setPayments((prev) => [newPayment, ...prev]);

    // Create Notification
    const newNotification = {
      id: `notif_${Date.now()}`,
      type: "registration",
      title: "New Client Onboarded",
      message: `${newClient.name} has joined under the ${newClient.membership} membership.`,
      date: new Date().toISOString().split("T")[0],
      read: false,
      clientId: clientId
    };
    setNotifications((prev) => [newNotification, ...prev]);

    return clientId;
  };

  const updateClient = (clientId, updatedFields) => {
    setClients((prev) =>
      prev.map((c) => {
        if (c.id === clientId) {
          const merged = { ...c, ...updatedFields };
          // If weight changes, automatically record a new measurement point
          if (updatedFields.currentWeight && parseFloat(updatedFields.currentWeight) !== c.currentWeight) {
            const newMeas = {
              date: new Date().toISOString().split("T")[0],
              weight: parseFloat(updatedFields.currentWeight),
              bmi: parseFloat(updatedFields.bmi) || merged.bmi,
              bodyFat: parseFloat(updatedFields.bodyFat) || merged.bodyFat,
              chest: parseFloat(updatedFields.chest) || merged.chest,
              waist: parseFloat(updatedFields.waist) || merged.waist,
              arms: parseFloat(updatedFields.arms) || merged.arms,
              thigh: parseFloat(updatedFields.thigh) || merged.thigh
            };
            setMeasurements((mPrev) => {
              const currentClientMeas = mPrev[clientId] || [];
              // Prevent multiple entries for the same day
              const filtered = currentClientMeas.filter((m) => m.date !== newMeas.date);
              return {
                ...mPrev,
                [clientId]: [...filtered, newMeas].sort((a, b) => new Date(a.date) - new Date(b.date))
              };
            });
          }
          return merged;
        }
        return c;
      })
    );
  };

  const deleteClient = (clientId) => {
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
  };

  // 2. Workout Planner Actions
  const updateWorkout = (clientId, day, muscleGroup, restTime, duration, notes, exercises) => {
    setWorkouts((prev) => {
      const clientWorkouts = prev[clientId] || {};
      return {
        ...prev,
        [clientId]: {
          ...clientWorkouts,
          [day.toLowerCase()]: {
            muscleGroup,
            restTime,
            duration,
            notes,
            exercises
          }
        }
      };
    });
  };

  const duplicateWorkoutWeek = (fromClientId, toClientId) => {
    const sourceWeek = workouts[fromClientId];
    if (sourceWeek) {
      setWorkouts((prev) => ({
        ...prev,
        [toClientId]: JSON.parse(JSON.stringify(sourceWeek))
      }));
    }
  };

  // 3. Diet Planner Actions
  const updateDiet = (clientId, day, mealKey, mealData) => {
    setDiets((prev) => {
      const clientDiet = prev[clientId] || { template: "General Fitness", waterGoal: 3.0 };
      const dayMeals = clientDiet[day.toLowerCase()] || {};
      return {
        ...prev,
        [clientId]: {
          ...clientDiet,
          [day.toLowerCase()]: {
            ...dayMeals,
            [mealKey]: mealData
          }
        }
      };
    });
  };

  const updateDietTemplate = (clientId, template, waterGoal) => {
    setDiets((prev) => {
      const clientDiet = prev[clientId] || {};
      return {
        ...prev,
        [clientId]: {
          ...clientDiet,
          template,
          waterGoal: parseFloat(waterGoal) || 3.0
        }
      };
    });
  };

  const applyDietTemplatePreset = (clientId, templateName) => {
    // Generate preset meals depending on template name
    const water = templateName === "Muscle Gain" ? 4.5 : templateName === "Weight Loss" ? 3.0 : 3.5;
    
    // Setup presets for the week
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
      // General Fitness
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

    setDiets((prev) => ({
      ...prev,
      [clientId]: {
        template: templateName,
        waterGoal: water,
        monday: { ...meals },
        tuesday: { ...meals },
        wednesday: { ...meals },
        thursday: { ...meals },
        friday: { ...meals },
        saturday: { ...meals },
        sunday: { ...meals }
      }
    }));
  };

  // 4. Attendance Actions
  const markClientAttendance = (clientId, date, status, timeIn) => {
    const existingIndex = attendance.findIndex((a) => a.clientId === clientId && a.date === date);

    if (existingIndex > -1) {
      setAttendance((prev) =>
        prev.map((a, idx) => (idx === existingIndex ? { ...a, status, timeIn } : a))
      );
    } else {
      const newAtt = {
        id: `att_${Date.now()}`,
        clientId,
        date,
        status,
        timeIn
      };
      setAttendance((prev) => [newAtt, ...prev]);
    }

    // Add activity notification
    if (status === "Present" || status === "Late") {
      const client = clients.find((c) => c.id === clientId);
      const name = client ? client.name : "Client";
      setNotifications((prev) => [
        {
          id: `notif_${Date.now()}`,
          type: "attendance",
          title: "Attendance Recorded",
          message: `${name} marked ${status.toLowerCase()} at ${timeIn} on ${date}.`,
          date: new Date().toISOString().split("T")[0],
          read: false,
          clientId
        },
        ...prev
      ]);
    }
  };

  // 5. Payments Actions
  const recordClientPayment = (paymentData) => {
    const paymentRecord = {
      id: `pay_${Date.now()}`,
      invoiceNumber: paymentData.invoiceNumber || `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      date: paymentData.date || new Date().toISOString().split("T")[0],
      status: paymentData.status || "Paid",
      ...paymentData
    };

    setPayments((prev) => [paymentRecord, ...prev]);

    // Update corresponding client payment status to "Active" if fully paid
    if (paymentRecord.status === "Paid") {
      updateClient(paymentRecord.clientId, { status: "Active" });
      
      // Update any unpaid placeholder payments for this client
      setPayments((prev) =>
        prev.map((p) => {
          if (p.clientId === paymentRecord.clientId && p.status === "Unpaid") {
            return { ...p, status: "Paid", date: paymentRecord.date, method: paymentRecord.method };
          }
          return p;
        })
      );
    }

    // Create Notification
    setNotifications((prev) => [
      {
        id: `notif_${Date.now()}`,
        type: "payment",
        title: "Payment Received",
        message: `Payment of $${paymentRecord.amount} recorded for ${paymentRecord.clientName}.`,
        date: new Date().toISOString().split("T")[0],
        read: false,
        clientId: paymentRecord.clientId
      },
      ...prev
    ]);
  };

  // 6. Settings Actions
  const updateGymSettings = (newSettings) => {
    setSettings((prev) => ({ ...prev, ...newSettings }));
  };

  // 7. Notification Actions
  const markNotificationAsRead = (notifId) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notifId ? { ...n, read: true } : n))
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
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
        clearAllNotifications,
        restoreDatabase
      }}
    >
      {children}
    </CRMContext.Provider>
  );
};
