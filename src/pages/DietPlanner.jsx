import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import {
  Apple,
  User,
  Plus,
  Printer,
  Copy,
  Edit,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Moon,
  Droplets,
  Utensils,
  Coffee
} from "lucide-react";
import { toast } from "sonner";

const DietPlanner = () => {
  const {
    clients,
    diets,
    updateDiet,
    updateDietTemplate,
    applyDietTemplatePreset
  } = useCRM();

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [dietModalOpen, setDietModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("monday");
  const [mealKey, setMealKey] = useState("breakfast");
  
  // Expanded meal inputs state
  const [mealInput, setMealInput] = useState({
    meal: "",
    quantity: "",
    calories: "",
    protein: "",
    carbs: "",
    fat: "",
    waterIntake: "",
    notes: ""
  });

  // Accordion Expand/Collapse Day states
  const [expandedDays, setExpandedDays] = useState({
    monday: true,
    tuesday: false,
    wednesday: false,
    thursday: false,
    friday: false,
    saturday: false,
    sunday: false
  });

  const toggleDay = (day) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day.toLowerCase()]: !prev[day.toLowerCase()]
    }));
  };

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientDiet = activeClient ? diets[activeClient.id] || { template: "General Fitness", waterGoal: 3.0 } : {};

  const handleEditDietMeal = (day, mKey) => {
    const meals = clientDiet[day.toLowerCase()] || {};
    const mealItem = meals[mKey] || {};
    setSelectedDay(day);
    setMealKey(mKey);
    setMealInput({
      meal: mealItem.meal || "",
      quantity: mealItem.quantity || "",
      calories: mealItem.calories || "",
      protein: mealItem.protein || "",
      carbs: mealItem.carbs || "",
      fat: mealItem.fat || "",
      waterIntake: mealItem.waterIntake || "",
      notes: mealItem.notes || ""
    });
    setDietModalOpen(true);
  };

  const handleSaveDietMeal = (e) => {
    e.preventDefault();
    updateDiet(activeClient.id, selectedDay, mealKey, {
      meal: mealInput.meal,
      quantity: mealInput.quantity,
      calories: parseFloat(mealInput.calories) || 0,
      protein: parseFloat(mealInput.protein) || 0,
      carbs: parseFloat(mealInput.carbs) || 0,
      fat: parseFloat(mealInput.fat) || 0,
      waterIntake: parseFloat(mealInput.waterIntake) || 0,
      notes: mealInput.notes
    });
    toast.success(`Meal detail for ${mealKey} on ${selectedDay} updated.`);
    setDietModalOpen(false);
  };

  const handleCopyDayPlan = (fromDay, toDay) => {
    const fromMeals = clientDiet[fromDay.toLowerCase()] || {};
    Object.entries(fromMeals).forEach(([key, val]) => {
      updateDiet(activeClient.id, toDay, key, val);
    });
    toast.success(`Copied diet plan from ${fromDay} to ${toDay}.`);
  };

  const handleApplyPreset = (templateName) => {
    applyDietTemplatePreset(activeClient.id, templateName);
    toast.success(`Loaded ${templateName} template diet plan.`);
  };

  const handlePrint = () => {
    window.print();
  };

  const mealsConfig = [
    { key: "earlyMorning", label: "Early Morning" },
    { key: "breakfast", label: "Breakfast" },
    { key: "midMorning", label: "Mid Morning" },
    { key: "lunch", label: "Lunch" },
    { key: "eveningSnack", label: "Evening Snack" },
    { key: "preWorkout", label: "Pre Workout" },
    { key: "postWorkout", label: "Post Workout" },
    { key: "dinner", label: "Dinner" },
    { key: "beforeBed", label: "Before Bed" }
  ];

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Weekly Diet Planner
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Configure macro goals, load diet templates, and customize daily client meals.
          </p>
        </div>
        
        {/* Client Selector & Print */}
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex items-center gap-2 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm flex-1 sm:flex-initial">
            <User className="w-4 h-4 text-slate-400" />
            <select
              value={selectedClientId}
              onChange={(e) => setSelectedClientId(e.target.value)}
              className="text-xs font-semibold text-slate-700 bg-transparent border-none focus:outline-none cursor-pointer"
            >
              <option value="" disabled>Select Athlete</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          {activeClient && (
            <button
              onClick={handlePrint}
              className="p-2 border border-slate-200 dark:border-zinc-800 rounded-xl bg-white hover:bg-slate-50 text-slate-600 cursor-pointer shadow-sm transition"
              title="Print Weekly Diet"
            >
              <Printer className="w-4.5 h-4.5" />
            </button>
          )}
        </div>
      </div>

      {activeClient ? (
        <div className="space-y-6">
          
          {/* Quick Toolbar */}
          <div className="bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
            <div className="flex items-center gap-3">
              <img src={activeClient.photo} alt={activeClient.name} className="w-10 h-10 rounded-full object-cover shadow-sm bg-slate-100" />
              <div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-200">{activeClient.name}</h3>
                <span className="text-[10px] text-slate-400 font-semibold uppercase">Goal: {activeClient.goal} • Template: {clientDiet.template}</span>
              </div>
            </div>
            
            {/* Presets loader buttons */}
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                onClick={() => handleApplyPreset("Weight Loss")}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Load Weight Loss
              </button>
              <button
                onClick={() => handleApplyPreset("Muscle Gain")}
                className="px-2.5 py-1.5 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs font-semibold text-slate-650 hover:bg-slate-50 cursor-pointer"
              >
                Load Muscle Gain
              </button>
            </div>
          </div>

          {/* Days split accordion schedule */}
          <div className="space-y-4 no-print">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const dayMeals = clientDiet[day.toLowerCase()] || {};
              const dayCals = Object.values(dayMeals).reduce((acc, curr) => acc + (curr?.calories || 0), 0);
              const dayProtein = Object.values(dayMeals).reduce((acc, curr) => acc + (curr?.protein || 0), 0);
              const dayCarbs = Object.values(dayMeals).reduce((acc, curr) => acc + (curr?.carbs || 0), 0);
              const dayFat = Object.values(dayMeals).reduce((acc, curr) => acc + (curr?.fat || 0), 0);
              
              const isRest = day.toLowerCase() === "sunday";
              const isExpanded = expandedDays[day.toLowerCase()];

              return (
                <div
                  key={day}
                  className={`bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 text-left`}
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleDay(day)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${
                        isRest
                          ? "bg-emerald-100/60 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                      }`}>
                        {isRest ? <Coffee className="w-5 h-5" /> : <Apple className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</span>
                          {!isRest && (
                            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                              {dayCals} kcal
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 font-display mt-0.5">
                          {isRest ? "Sunday Recovery & Hydration Diet" : `${activeClient.goal} Plan`}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {/* Macro summaries in header */}
                      {!isRest && dayCals > 0 && (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-slate-450 dark:text-zinc-550 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-800 mr-2">
                          P: {dayProtein}g • C: {dayCarbs}g • F: {dayFat}g
                        </span>
                      )}

                      {/* Copy Dropdown */}
                      <select
                        onClick={(e) => e.stopPropagation()}
                        onChange={(e) => {
                          if (e.target.value) {
                            handleCopyDayPlan(day, e.target.value);
                            e.target.value = ""; // reset
                          }
                        }}
                        className="text-[10px] text-blue-600 bg-blue-50/50 dark:bg-zinc-950 px-2 py-1 rounded-xl border border-blue-100/20 dark:border-zinc-800 focus:outline-none cursor-pointer hover:bg-blue-100/50 transition mr-2"
                      >
                        <option value="">Copy to...</option>
                        {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].filter(d => d !== day).map(d => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>

                      {/* Expand Chevron */}
                      <div className="text-slate-400 dark:text-zinc-500 p-1">
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5" />
                        ) : (
                          <ChevronDown className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Accordion Content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 pt-1 border-t border-slate-150/60 dark:border-zinc-800/40">
                      {isRest ? (
                        /* Sunday Recovery Diet View */
                        <div className="p-6 bg-gradient-to-br from-emerald-50/40 to-teal-50/40 dark:from-emerald-950/10 dark:to-teal-950/10 rounded-2xl border border-emerald-100/30 dark:border-emerald-950/20 flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-6">
                          <div className="space-y-2">
                            <span className="text-[10px] bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Recovery Diet</span>
                            <h5 className="text-sm font-bold text-slate-800 dark:text-zinc-150">Nutritional Reset & Alkaline Rebalance</h5>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-lg">
                              Sundays are configured to rest the digestive system while retaining amino acid balance. Prioritize whole fruits, coconut water, green tea, clear bone/lentil soups, and dynamic mineral loading.
                            </p>
                            <div className="pt-2 flex flex-wrap gap-2 text-xs">
                              <span className="bg-white/80 dark:bg-zinc-950 border px-3 py-1 rounded-xl text-slate-650 font-medium">💧 Water Target: 4.0 Liters</span>
                              <span className="bg-white/80 dark:bg-zinc-950 border px-3 py-1 rounded-xl text-slate-650 font-medium">🍵 Lemon Detox & Green Tea</span>
                            </div>
                          </div>
                          
                          {/* Sunday Recovery Meal list */}
                          <div className="bg-white dark:bg-zinc-950 rounded-2xl p-4 border border-slate-100 dark:border-zinc-850 shadow-sm space-y-2 text-xs min-w-[240px]">
                            <span className="font-extrabold text-slate-800 dark:text-zinc-350 block border-b pb-1.5 mb-1.5 uppercase tracking-wide text-[9px]">Sunday Meals</span>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Breakfast:</span>
                              <span className="font-semibold text-slate-600">Oats & Blueberries</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Lunch:</span>
                              <span className="font-semibold text-slate-600">Lentil Khichdi & Salad</span>
                            </div>
                            <div className="flex justify-between gap-4">
                              <span className="text-slate-400">Dinner:</span>
                              <span className="font-semibold text-slate-600">Veg/Chicken Clear Soup</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal Weekday Meal Grid split */
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                          {mealsConfig.map((meal) => {
                            const loggedMeal = dayMeals[meal.key] || {};
                            const hasFood = loggedMeal.meal;
                            return (
                              <div
                                key={meal.key}
                                onClick={() => handleEditDietMeal(day, meal.key)}
                                className="group p-3 rounded-2xl border border-slate-150/60 dark:border-zinc-800/40 hover:border-blue-500 bg-slate-50/50 dark:bg-zinc-950/20 hover:bg-white dark:hover:bg-zinc-900 cursor-pointer transition shadow-sm flex flex-col justify-between text-left"
                              >
                                <div>
                                  <div className="flex justify-between items-center mb-1 border-b border-slate-100 dark:border-zinc-850 pb-1">
                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{meal.label}</span>
                                    {loggedMeal.waterIntake > 0 && (
                                      <span className="flex items-center gap-0.5 text-[9px] bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-1.5 py-0.2 rounded-full font-bold">
                                        <Droplets className="w-2.5 h-2.5" />
                                        <span>{loggedMeal.waterIntake}L H2O</span>
                                      </span>
                                    )}
                                  </div>
                                  {hasFood ? (
                                    <div className="space-y-1 mt-1">
                                      <p className="text-xs font-black text-slate-800 dark:text-zinc-200 leading-snug">{loggedMeal.meal}</p>
                                      {loggedMeal.quantity && (
                                        <span className="text-[10px] text-slate-400 block">Qty: {loggedMeal.quantity}</span>
                                      )}
                                      {loggedMeal.notes && (
                                        <p className="text-[10px] text-slate-450 dark:text-zinc-500 italic leading-snug">"{loggedMeal.notes}"</p>
                                      )}
                                    </div>
                                  ) : (
                                    <span className="text-xs text-slate-350 italic font-medium mt-1 block">Add meal plan...</span>
                                  )}
                                </div>

                                {hasFood && (
                                  <div className="mt-3 pt-2 border-t border-slate-100 dark:border-zinc-850 flex justify-between items-center text-[10px]">
                                    <span className="font-extrabold text-slate-700 dark:text-zinc-350">{loggedMeal.calories} kcal</span>
                                    <div className="flex gap-1 text-slate-400 font-semibold uppercase tracking-wider text-[9px]">
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
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl no-print">
          <AlertCircle className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No Clients Registered</h3>
          <p className="text-xs text-slate-400 mt-1">Please add a client from the Client Directory before planning diet plans.</p>
        </div>
      )}

      {/* --- EDIT DIET MEAL DIALOG --- */}
      {dietModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDietModalOpen(false)} />
          <form onSubmit={handleSaveDietMeal} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display uppercase tracking-wider">
              Meal Details — {mealKey} ({selectedDay})
            </h3>
            
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-bold text-slate-400 block mb-1">Meal / Food items</label>
                <input
                  type="text"
                  required
                  value={mealInput.meal}
                  onChange={(e) => setMealInput({ ...mealInput, meal: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                  placeholder="e.g. Oats with sliced banana & scoop whey"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Quantity</label>
                  <input
                    type="text"
                    value={mealInput.quantity}
                    onChange={(e) => setMealInput({ ...mealInput, quantity: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                    placeholder="e.g. 150g, 2 slices"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Water Intake (Liters)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={mealInput.waterIntake}
                    onChange={(e) => setMealInput({ ...mealInput, waterIntake: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                    placeholder="e.g. 0.5"
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Calories (kcal)</label>
                  <input
                    type="number"
                    value={mealInput.calories}
                    onChange={(e) => setMealInput({ ...mealInput, calories: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Protein (g)</label>
                  <input
                    type="number"
                    value={mealInput.protein}
                    onChange={(e) => setMealInput({ ...mealInput, protein: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Carbs (g)</label>
                  <input
                    type="number"
                    value={mealInput.carbs}
                    onChange={(e) => setMealInput({ ...mealInput, carbs: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Fat (g)</label>
                  <input
                    type="number"
                    value={mealInput.fat}
                    onChange={(e) => setMealInput({ ...mealInput, fat: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-slate-400 block mb-1">Meal Notes</label>
                  <input
                    type="text"
                    value={mealInput.notes}
                    onChange={(e) => setMealInput({ ...mealInput, notes: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-205 dark:border-zinc-800 rounded-lg bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-150"
                    placeholder="Optional tips..."
                  />
                </div>
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

      {/* --- PRINT TEMPLATE SPECIFIC TO PRINT LAYOUT --- */}
      {activeClient && (
        <div className="hidden print-area leading-relaxed">
          <div className="text-center border-b pb-4 mb-6">
            <h1 className="text-xl font-bold">{clients[0]?.gymName || "Apex Gym CRM"}</h1>
            <p className="text-xs text-slate-500">Weekly Nutrition Program Sheet</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4">
            <div><strong>Athlete Name:</strong> {activeClient.name}</div>
            <div><strong>Fitness Goal:</strong> {activeClient.goal}</div>
            <div><strong>Plan Template:</strong> {clientDiet.template}</div>
          </div>

          <div className="space-y-6">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const dayMeals = clientDiet[day.toLowerCase()] || {};
              const dayCals = Object.values(dayMeals).reduce((acc, curr) => acc + (curr?.calories || 0), 0);

              return (
                <div key={day} className="border-b pb-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{day} (Total: {dayCals} kcal)</h3>
                  <table className="w-full text-left text-xs border">
                    <thead>
                      <tr className="bg-slate-100 font-bold">
                        <th className="p-2 border">Meal Time</th>
                        <th className="p-2 border">Food / Description</th>
                        <th className="p-2 border text-center">Cals</th>
                        <th className="p-2 border text-center">Protein</th>
                        <th className="p-2 border text-center">Carbs</th>
                        <th className="p-2 border text-center">Fat</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mealsConfig.map((meal) => {
                        const logged = dayMeals[meal.key] || {};
                        if (!logged.meal) return null;
                        return (
                          <tr key={meal.key}>
                            <td className="p-2 border font-semibold">{meal.label}</td>
                            <td className="p-2 border">{logged.meal}</td>
                            <td className="p-2 border text-center">{logged.calories} kcal</td>
                            <td className="p-2 border text-center">{logged.protein}g</td>
                            <td className="p-2 border text-center">{logged.carbs}g</td>
                            <td className="p-2 border text-center">{logged.fat}g</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default DietPlanner;
