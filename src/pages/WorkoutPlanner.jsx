import React, { useState } from "react";
import { useCRM } from "../context/CRMContext";
import { useNavigate } from "react-router-dom";
import {
  Dumbbell,
  User,
  Plus,
  Printer,
  Copy,
  Edit,
  Trash2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Moon
} from "lucide-react";
import { toast } from "sonner";
import { EmptyState } from "../components/FeedbackStates";

const WorkoutPlanner = () => {
  const navigate = useNavigate();
  const {
    clients,
    workouts,
    updateWorkout,
    duplicateWorkoutWeek
  } = useCRM();

  const [selectedClientId, setSelectedClientId] = useState(clients[0]?.id || "");
  const [workoutModalOpen, setWorkoutModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState("monday");
  const [muscleGroup, setMuscleGroup] = useState("");
  const [restTime, setRestTime] = useState("");
  const [duration, setDuration] = useState("");
  const [dayNotes, setDayNotes] = useState("");
  const [dayExercises, setDayExercises] = useState([]);
  
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

  // Track session exercise completions locally
  const [completedExercises, setCompletedExercises] = useState({});

  // Duplicate week state
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [targetClientId, setTargetClientId] = useState("");

  const activeClient = clients.find((c) => c.id === selectedClientId);
  const clientWorkouts = activeClient ? workouts[activeClient.id] || {} : {};

  // Handlers for edit
  const handleEditWorkoutDay = (day) => {
    const wDay = clientWorkouts[day.toLowerCase()] || {};
    setSelectedDay(day);
    setMuscleGroup(wDay.muscleGroup || "");
    setRestTime(wDay.restTime || "");
    setDuration(wDay.duration || "");
    setDayNotes(wDay.notes || "");
    setDayExercises(wDay.exercises ? wDay.exercises.map(ex => ({ category: "Compound", ...ex })) : []);
    setWorkoutModalOpen(true);
  };

  const handleAddExerciseRow = () => {
    setDayExercises([...dayExercises, { name: "", category: "Compound", sets: "", reps: "", weight: "" }]);
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
    updateWorkout(activeClient.id, selectedDay, muscleGroup, restTime, duration, dayNotes, dayExercises);
    toast.success(`Workout schedule for ${selectedDay} updated.`);
    setWorkoutModalOpen(false);
  };

  const toggleDay = (day) => {
    setExpandedDays((prev) => ({
      ...prev,
      [day.toLowerCase()]: !prev[day.toLowerCase()]
    }));
  };

  const toggleExerciseCompletion = (day, idx) => {
    const key = `${activeClient.id}-${day.toLowerCase()}-${idx}`;
    setCompletedExercises((prev) => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleDuplicateWeek = () => {
    if (!targetClientId) {
      toast.warning("Please select a target client.");
      return;
    }
    duplicateWorkoutWeek(activeClient.id, targetClientId);
    const targetName = clients.find(c => c.id === targetClientId)?.name || "target client";
    toast.success(`Copied weekly routine from ${activeClient.name} to ${targetName}.`);
    setDuplicateModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  if (clients.length === 0) {
    return (
      <div className="space-y-6 text-left">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-805 dark:text-zinc-50 flex items-center gap-2">
            Weekly Workout Planner
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm mt-0.5">
            Map out training splits, muscle groups, sets, reps and durations.
          </p>
        </div>
        <EmptyState
          title="No Active Members Loaded"
          description="Register your gym athletes first in order to build customized weekly workout splits."
          actionText="Onboard New Member"
          onAction={() => navigate("/clients/add")}
          icon={Dumbbell}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 no-print">
        <div>
          <h1 className="text-2xl font-bold font-display text-slate-800 dark:text-zinc-50 flex items-center gap-2">
            Weekly Workout Planner
          </h1>
          <p className="text-slate-400 dark:text-zinc-500 text-sm">
            Map out training splits, muscle groups, sets, reps and durations.
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
              title="Print Weekly Routine"
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
                <span className="text-[10px] text-slate-400 font-semibold uppercase">{activeClient.goal} • {activeClient.membership}</span>
              </div>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <button
                onClick={() => setDuplicateModalOpen(true)}
                className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3 py-2 border border-slate-200 dark:border-zinc-800 rounded-xl text-xs font-semibold text-slate-600 dark:text-zinc-400 hover:bg-slate-50 cursor-pointer transition"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Duplicate Week</span>
              </button>
            </div>
          </div>          {/* Days split accordion schedule */}
          <div className="space-y-4 no-print">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const wDay = clientWorkouts[day.toLowerCase()] || { muscleGroup: "Rest Day", exercises: [], notes: "", duration: "N/A", restTime: "N/A" };
              const isRest = day.toLowerCase() === "sunday" || wDay.muscleGroup === "Rest Day" || wDay.exercises?.length === 0;
              const isExpanded = expandedDays[day.toLowerCase()];
              const exercises = wDay.exercises || [];

              // Count completed exercises
              const completedCount = exercises.filter((_, idx) => completedExercises[`${activeClient.id}-${day.toLowerCase()}-${idx}`]).length;

              return (
                <div
                  key={day}
                  className={`bg-white dark:bg-zinc-900 border border-slate-205 dark:border-zinc-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 text-left`}
                >
                  {/* Accordion Header */}
                  <div
                    onClick={() => toggleDay(day)}
                    className="p-5 flex justify-between items-center cursor-pointer hover:bg-slate-50/50 dark:hover:bg-zinc-850/50 transition-colors select-none"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2.5 rounded-2xl ${
                        isRest
                          ? "bg-purple-100/60 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400"
                          : "bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400"
                      }`}>
                        {isRest ? <Moon className="w-5 h-5" /> : <Dumbbell className="w-5 h-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{day}</span>
                          {!isRest && exercises.length > 0 && (
                            <span className="text-[10px] bg-slate-100 dark:bg-zinc-800 text-slate-500 font-bold px-2 py-0.5 rounded-full">
                              {completedCount}/{exercises.length} Completed
                            </span>
                          )}
                        </div>
                        <h4 className="text-base font-black text-slate-800 dark:text-zinc-100 font-display mt-0.5">
                          {isRest ? "Rest & Muscle Recovery" : (wDay.muscleGroup || "Workout Routine")}
                        </h4>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!isRest && wDay.duration && wDay.duration !== "N/A" && (
                        <span className="hidden sm:inline-block text-[10px] font-bold text-slate-400 dark:text-zinc-500 bg-slate-50 dark:bg-zinc-950 px-2.5 py-1 rounded-xl border border-slate-100 dark:border-zinc-800 mr-2">
                          {wDay.duration} • {wDay.restTime} Rest
                        </span>
                      )}
                      
                      {/* Edit Button */}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditWorkoutDay(day);
                        }}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-zinc-800 text-slate-400 dark:text-zinc-500 rounded-xl transition cursor-pointer"
                        title="Edit schedule"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

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
                        /* Visual distinct Sunday Recovery Card */
                        <div className="p-6 bg-gradient-to-br from-purple-50/50 to-indigo-50/50 dark:from-purple-950/10 dark:to-indigo-950/10 rounded-2xl border border-purple-100/30 dark:border-purple-950/20 text-center sm:text-left flex flex-col sm:flex-row justify-between items-center gap-6">
                          <div className="space-y-2">
                            <span className="text-[10px] bg-purple-100 dark:bg-purple-950 text-purple-600 dark:text-purple-400 font-extrabold px-2.5 py-0.5 rounded-full uppercase tracking-wider">Rest Period</span>
                            <h5 className="text-sm font-bold text-slate-800 dark:text-zinc-150">CNS & Muscle Hypertrophy Decompression</h5>
                            <p className="text-xs text-slate-500 dark:text-zinc-400 leading-relaxed max-w-lg">
                              {wDay.notes || "No exercises scheduled. Sundays are dedicated to cellular repair, muscle rebuilding, hydration, and 8+ hours of restful sleep."}
                            </p>
                          </div>
                          
                          {/* Active Recovery Suggestion Tips */}
                          <div className="p-4 bg-white dark:bg-zinc-950 rounded-xl border border-slate-100 dark:border-zinc-800 shadow-sm shrink-0 w-full sm:w-auto text-xs space-y-2 text-left">
                            <span className="font-extrabold text-slate-700 dark:text-zinc-350 block border-b pb-1.5 mb-1.5 uppercase tracking-wide text-[9px]">Recovery Checklist</span>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span>20-Min Foam Rolling & Stretching</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span>4L Alkaline Hydration Target</span>
                            </div>
                            <div className="flex items-center gap-2 text-slate-500">
                              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                              <span>Light recovery walk or mobility yoga</span>
                            </div>
                          </div>
                        </div>
                      ) : (
                        /* Normal Workout Day Exercises list */
                        <div className="space-y-4">
                          {/* Exercises Table Layout */}
                          {exercises.length > 0 ? (
                            <div className="overflow-x-auto">
                              <table className="w-full text-left text-xs border-collapse">
                                <thead>
                                  <tr className="border-b border-slate-100 dark:border-zinc-800 text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                                    <th className="py-2.5 px-3 text-center w-12">Done</th>
                                    <th className="py-2.5 px-3">Exercise Details</th>
                                    <th className="py-2.5 px-3">Type</th>
                                    <th className="py-2.5 px-3 text-center">Sets</th>
                                    <th className="py-2.5 px-3 text-center">Reps</th>
                                    <th className="py-2.5 px-3 text-right">Target Load</th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-50 dark:divide-zinc-800/20 text-slate-700 dark:text-zinc-350">
                                  {exercises.map((ex, idx) => {
                                    const compKey = `${activeClient.id}-${day.toLowerCase()}-${idx}`;
                                    const isDone = completedExercises[compKey];
                                    return (
                                      <tr
                                        key={idx}
                                        className={`hover:bg-slate-50/30 dark:hover:bg-zinc-850/20 transition ${
                                          isDone ? "opacity-60 bg-slate-50/20 dark:bg-zinc-950/10 line-through" : ""
                                        }`}
                                      >
                                        <td className="py-3 px-3 text-center">
                                          <input
                                            type="checkbox"
                                            checked={!!isDone}
                                            onChange={() => toggleExerciseCompletion(day, idx)}
                                            className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 cursor-pointer"
                                          />
                                        </td>
                                        <td className="py-3 px-3">
                                          <span className="font-bold text-slate-800 dark:text-zinc-200 block text-xs">{ex.name}</span>
                                          <span className="text-[10px] text-slate-400 font-medium">Split: {wDay.muscleGroup}</span>
                                        </td>
                                        <td className="py-3 px-3">
                                          <span className="px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-wide uppercase bg-blue-500/10 text-blue-600 dark:text-blue-400">
                                            {ex.category || "Compound"}
                                          </span>
                                        </td>
                                        <td className="py-3 px-3 text-center font-bold">{ex.sets}</td>
                                        <td className="py-3 px-3 text-center font-bold text-slate-655">{ex.reps}</td>
                                        <td className="py-3 px-3 text-right font-extrabold text-slate-850 dark:text-zinc-200">
                                          {ex.weight && ex.weight !== "N/A" ? ex.weight : "—"}
                                        </td>
                                      </tr>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            <div className="py-8 text-center text-xs text-slate-450 border border-dashed border-slate-200 dark:border-zinc-800 rounded-2xl">
                              No exercises pre-populated. Click edit to plan this workout day.
                            </div>
                          )}

                          {/* Trainer note segment inside expanded card */}
                          {wDay.notes && (
                            <div className="p-3 bg-slate-50/50 dark:bg-zinc-950/30 border border-slate-100 dark:border-zinc-850 rounded-2xl flex items-start gap-2.5 text-xs text-slate-500">
                              <span className="font-bold text-slate-700 dark:text-zinc-350 shrink-0 uppercase tracking-wide text-[9px] bg-slate-100 dark:bg-zinc-800 px-2 py-0.5 rounded">Note</span>
                              <span className="italic leading-relaxed">"{wDay.notes}"</span>
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
      ) : (
        <div className="text-center py-20 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl no-print">
          <AlertCircle className="w-12 h-12 text-slate-350 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-slate-800 dark:text-zinc-200">No Clients Registered</h3>
          <p className="text-xs text-slate-400 dark:text-zinc-500 mt-1">Please add a client from the Client Directory before planning workouts.</p>
        </div>
      )}

      {/* --- DUPLICATE WEEK MODAL --- */}
      {duplicateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setDuplicateModalOpen(false)} />
          <div className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in scale-in duration-200">
            <h3 className="text-sm font-bold text-slate-800 dark:text-zinc-100 mb-4 font-display">Duplicate Workout Program</h3>
            <p className="text-xs text-slate-450 mb-4 leading-relaxed">
              Copy this week's workout schedule from <strong>{activeClient.name}</strong> to:
            </p>
            <div className="space-y-3">
              <label className="text-[10px] font-bold text-slate-400 block">Select Target Athlete</label>
              <select
                value={targetClientId}
                onChange={(e) => setTargetClientId(e.target.value)}
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg bg-slate-50"
              >
                <option value="">Select Athlete</option>
                {clients.filter(c => c.id !== activeClient.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div className="flex gap-2 mt-6">
              <button
                type="button"
                onClick={() => setDuplicateModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                onClick={handleDuplicateWeek}
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Duplicate Program
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- EDIT WORKOUT DAY DIALOG --- */}
      {workoutModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 no-print">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setWorkoutModalOpen(false)} />
          <form onSubmit={handleSaveWorkoutDay} className="relative bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in scale-in duration-200 max-h-[85vh] flex flex-col justify-between">
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
                    placeholder="e.g. Legs Focus"
                  />
                </div>
                <div>
                  <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Rest Time</label>
                  <input
                    type="text"
                    value={restTime}
                    onChange={(e) => setRestTime(e.target.value)}
                    className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                    placeholder="e.g. 90 sec"
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
                <label className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Day Specific Notes</label>
                <input
                  type="text"
                  value={dayNotes}
                  onChange={(e) => setDayNotes(e.target.value)}
                  className="w-full px-2.5 py-1.5 border border-slate-200 rounded-lg text-xs"
                  placeholder="Warmup routines, hydration reminders, eccentric focus details..."
                />
              </div>

              <div className="border-t border-slate-100 dark:border-zinc-800/40 pt-4 mt-2">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Exercises</span>
                  <button
                    type="button"
                    onClick={handleAddExerciseRow}
                    className="text-[10px] text-blue-600 font-bold hover:underline"
                  >
                    + Add Exercise
                  </button>
                </div>

                <div className="space-y-2">
                  {dayExercises.map((ex, idx) => (
                    <div key={idx} className="flex flex-col sm:flex-row gap-2 items-stretch sm:items-center bg-slate-50/50 dark:bg-zinc-950/40 p-2 rounded-xl">
                      <input
                        type="text"
                        value={ex.name}
                        placeholder="Exercise Name"
                        onChange={(e) => handleExerciseChange(idx, "name", e.target.value)}
                        className="flex-1 min-w-[120px] px-2 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                        required
                      />
                      <select
                        value={ex.category || "Compound"}
                        onChange={(e) => handleExerciseChange(idx, "category", e.target.value)}
                        className="px-2 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs bg-white dark:bg-zinc-900 text-slate-705 dark:text-zinc-300"
                      >
                        <option value="Compound">Compound</option>
                        <option value="Isolation">Isolation</option>
                        <option value="Cardio">Cardio</option>
                        <option value="Core">Core</option>
                        <option value="Stretching">Stretching</option>
                      </select>
                      <div className="flex gap-1.5 justify-between">
                        <input
                          type="text"
                          value={ex.sets}
                          placeholder="Sets"
                          onChange={(e) => handleExerciseChange(idx, "sets", e.target.value)}
                          className="w-10 px-1 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-center bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                          required
                        />
                        <input
                          type="text"
                          value={ex.reps}
                          placeholder="Reps"
                          onChange={(e) => handleExerciseChange(idx, "reps", e.target.value)}
                          className="w-14 px-1.5 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-center bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                          required
                        />
                        <input
                          type="text"
                          value={ex.weight}
                          placeholder="Weight"
                          onChange={(e) => handleExerciseChange(idx, "weight", e.target.value)}
                          className="w-16 px-1.5 py-1 border border-slate-200 dark:border-zinc-800 rounded-lg text-xs text-center bg-white dark:bg-zinc-900 text-slate-800 dark:text-zinc-100"
                        />
                        <button
                          type="button"
                          onClick={() => handleRemoveExerciseRow(idx)}
                          className="p-1 text-red-500 hover:bg-red-55 dark:hover:bg-red-950/20 rounded-lg transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-2 mt-6 border-t border-slate-100 dark:border-zinc-800/40 pt-4">
              <button
                type="button"
                onClick={() => setWorkoutModalOpen(false)}
                className="flex-1 py-2 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-2 bg-blue-600 text-white rounded-xl text-xs font-semibold"
              >
                Save Changes
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
            <p className="text-xs text-slate-500">Weekly Workout Schedule Sheet</p>
          </div>
          <div className="grid grid-cols-2 gap-4 text-xs mb-6 border-b pb-4">
            <div><strong>Athlete Name:</strong> {activeClient.name}</div>
            <div><strong>Membership Plan:</strong> {activeClient.membership}</div>
            <div><strong>Fitness Goal:</strong> {activeClient.goal}</div>
          </div>

          <div className="space-y-6">
            {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"].map((day) => {
              const wDay = clientWorkouts[day.toLowerCase()] || { muscleGroup: "Rest Day", exercises: [] };
              const isRest = wDay.muscleGroup === "Rest Day" || wDay.exercises?.length === 0;

              return (
                <div key={day} className="border-b pb-4">
                  <h3 className="text-sm font-bold text-slate-800 mb-2">{day} - {wDay.muscleGroup || "Rest Day"}</h3>
                  {!isRest ? (
                    <table className="w-full text-left text-xs border">
                      <thead>
                        <tr className="bg-slate-100">
                          <th className="p-2 border">Exercise</th>
                          <th className="p-2 border text-center">Sets</th>
                          <th className="p-2 border text-center">Reps</th>
                          <th className="p-2 border text-center">Weight</th>
                        </tr>
                      </thead>
                      <tbody>
                        {wDay.exercises.map((ex, idx) => (
                          <tr key={idx}>
                            <td className="p-2 border font-semibold">{ex.name}</td>
                            <td className="p-2 border text-center">{ex.sets}</td>
                            <td className="p-2 border text-center">{ex.reps}</td>
                            <td className="p-2 border text-center">{ex.weight || "-"}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="text-xs text-slate-400 italic">Rest Period</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
};

export default WorkoutPlanner;
