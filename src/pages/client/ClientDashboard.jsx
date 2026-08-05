import React, { useState, useEffect } from "react";
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
  Settings as SettingsIcon,
  LogOut,
  Menu,
  X,
  Flame,
  Droplet,
  ChevronRight,
  TrendingDown,
  Target,
  Sparkles,
  MessageSquare,
  Activity,
  Heart,
  Award,
  Zap,
  TrendingUp,
  Download,
  Check,
  Lock
} from "lucide-react";
import { toast } from "sonner";
import { useCRM } from "../../context/CRMContext";

const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const weeklyWorkouts = {
  Monday: {
    name: "Chest",
    exercises: [
      { id: "ex_bench", name: "Bench Press", sets: 4, reps: 12, weight: "80 kg", rest: "90s", notes: "Warm up with bar, increase weight incrementally. Focus on barbell control." },
      { id: "ex_incline", name: "Incline Dumbbell Press", sets: 3, reps: 10, weight: "26 kg DBs", rest: "90s", notes: "Keep elbows at 45 degrees, squeeze pectorals at top contraction point." },
      { id: "ex_fly", name: "Cable Fly", sets: 3, reps: 15, weight: "15 kg", rest: "60s", notes: "Keep slight bend in elbows, control the negative portion of fly movement." },
      { id: "ex_pushdown", name: "Tricep Pushdown", sets: 3, reps: 12, weight: "25 kg", rest: "60s", notes: "V-bar attachment. Lock elbows by side, extend arms completely down." }
    ]
  },
  Tuesday: {
    name: "Back",
    exercises: [
      { id: "ex_lat", name: "Lat Pulldown", sets: 4, reps: 12, weight: "60 kg", rest: "90s", notes: "Pull down to upper chest, squeeze shoulder blades together." },
      { id: "ex_row", name: "Bent-Over Row", sets: 3, reps: 10, weight: "50 kg", rest: "90s", notes: "Keep spine neutral, pull barbell to lower chest." },
      { id: "ex_pullup", name: "Pull-ups", sets: 3, reps: "Max", weight: "Bodyweight", rest: "120s", notes: "Full range of motion, dead hang to chin over bar." },
      { id: "ex_facepull", name: "Face Pulls", sets: 3, reps: 15, weight: "20 kg", rest: "60s", notes: "Pull rope towards ears, focus on rear delts and rotator cuffs." }
    ]
  },
  Wednesday: {
    name: "Legs",
    exercises: [
      { id: "ex_squat", name: "Barbell Squats", sets: 4, reps: 10, weight: "100 kg", rest: "120s", notes: "Break parallel, drive through your heels." },
      { id: "ex_rdl", name: "Romanian Deadlifts", sets: 3, reps: 12, weight: "80 kg", rest: "90s", notes: "Hinge at hips, keep bar close to shins, feel hamstrings stretch." },
      { id: "ex_press", name: "Leg Press", sets: 3, reps: 15, weight: "160 kg", rest: "90s", notes: "Do not lock out knees at the top of movement." },
      { id: "ex_calf", name: "Standing Calf Raises", sets: 4, reps: 15, weight: "40 kg", rest: "60s", notes: "Pause at peak contraction, stretch calves fully at bottom." }
    ]
  },
  Thursday: {
    name: "Shoulders",
    exercises: [
      { id: "ex_ohp", name: "Overhead Barbell Press", sets: 4, reps: 8, weight: "45 kg", rest: "90s", notes: "Keep core tight, press directly overhead, lock out elbows." },
      { id: "ex_latraise", name: "Dumbbell Lateral Raises", sets: 3, reps: 15, weight: "10 kg", rest: "60s", notes: "Raise dumbbells to shoulder height, pinkies slightly up." },
      { id: "ex_rear", name: "Rear Delt Fly", sets: 3, reps: 12, weight: "8 kg", rest: "60s", notes: "Keep slight bend in elbows, pull shoulder blades apart." },
      { id: "ex_shrug", name: "Dumbbell Shrugs", sets: 3, reps: 12, weight: "30 kg", rest: "60s", notes: "Squeeze traps at the top, do not roll shoulders." }
    ]
  },
  Friday: {
    name: "Arms",
    exercises: [
      { id: "ex_curl", name: "Barbell Bicep Curls", sets: 3, reps: 12, weight: "30 kg", rest: "60s", notes: "Keep elbows pinned to sides, control negative phase." },
      { id: "ex_inccurl", name: "Incline Dumbbell Curls", sets: 3, reps: 10, weight: "12 kg", rest: "60s", notes: "Stretch bicep fully at bottom of movement." },
      { id: "ex_ham", name: "Dumbbell Hammer Curls", sets: 3, reps: 12, weight: "14 kg", rest: "60s", notes: "Neutral grip, target brachialis." },
      { id: "ex_skull", name: "Skull Crushers", sets: 3, reps: 12, weight: "25 kg", rest: "60s", notes: "Lower EZ bar to forehead, extend elbows upward." }
    ]
  },
  Saturday: {
    name: "Cardio",
    exercises: [
      { id: "ex_hiit", name: "Treadmill HIIT", sets: 1, reps: "20 Mins", weight: "N/A", rest: "N/A", notes: "30s sprint / 60s jog cycles. Maintain maximum effort on sprints." },
      { id: "ex_rowing", name: "Rowing Machine", sets: 1, reps: "15 Mins", weight: "N/A", rest: "N/A", notes: "Moderate pace, focus on leg drive and back pull." },
      { id: "ex_rope", name: "Jump Rope", sets: 3, reps: "3 Mins", weight: "N/A", rest: "60s", notes: "Maintain steady rhythm, stay on toes." }
    ]
  },
};

const DIET_PLANS = {
  "Weight Loss": {
    calories: "1,800 kcal", protein: "130g", carbs: "160g", fats: "50g", water: "3.5L",
    days: {
      Monday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled fish (150g) or pan-seared paneer (120g), 1 bowl hot vegetable soup, cucumber salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Tuesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared tofu (150g), 1 bowl hot vegetable soup, spinach salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Wednesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled fish (150g) or pan-seared paneer (120g), 1 bowl hot vegetable soup, cucumber salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Thursday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared tofu (150g), 1 bowl hot vegetable soup, spinach salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Friday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled fish (150g) or pan-seared paneer (120g), 1 bowl hot vegetable soup, cucumber salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Saturday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats with skimmed milk, 2 boiled eggs, and 1 green apple", kcal: "450 kcal", macros: "P: 30g | C: 50g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Mixed almonds & walnuts (10-12 pieces) with 1 cup unsweetened green tea", kcal: "150 kcal", macros: "P: 4g | C: 5g | F: 13g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (150g), 1 cup steamed brown rice, cucumber-carrot salad", kcal: "520 kcal", macros: "P: 42g | C: 48g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with 1 tsp chia seeds", kcal: "180 kcal", macros: "P: 18g | C: 15g | F: 4g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Pan-seared tofu (150g), 1 bowl hot vegetable soup, spinach salad", kcal: "500 kcal", macros: "P: 36g | C: 42g | F: 13g" }
      ],
      Sunday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "2 scrambled egg whites, 1 slice whole wheat toast, and 1 fresh orange slice", kcal: "250 kcal", macros: "P: 14g | C: 26g | F: 6g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "1 cup unsweetened green tea with 1 sliced cucumber", kcal: "40 kcal", macros: "P: 1g | C: 8g | F: 0g" },
        { type: "Lunch", label: "🍛 Lunch", items: "1 bowl mixed vegetable salad with grilled paneer cubes (100g)", kcal: "380 kcal", macros: "P: 22g | C: 18g | F: 20g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 medium apple with a few walnuts (4-5 pieces)", kcal: "180 kcal", macros: "P: 3g | C: 25g | F: 8g" },
        { type: "Dinner", label: "🍽 Dinner", items: "1 bowl light lentil (dal) soup with steamed broccoli and carrots", kcal: "280 kcal", macros: "P: 15g | C: 40g | F: 2g" }
      ]
    }
  },
  "Muscle Gain": {
    calories: "2,800 kcal", protein: "160g", carbs: "320g", fats: "85g", water: "4.5L",
    days: {
      Monday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon or chicken (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 15g" }
      ],
      Tuesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled paneer blocks (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 32g | C: 50g | F: 22g" }
      ],
      Wednesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon or chicken (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 15g" }
      ],
      Thursday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled paneer blocks (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 32g | C: 50g | F: 22g" }
      ],
      Friday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon or chicken (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 44g | C: 50g | F: 15g" }
      ],
      Saturday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Rolled oats (80g), 2 slices of whole wheat toast with peanut butter, 1 banana, and 4 scrambled eggs", kcal: "780 kcal", macros: "P: 42g | C: 95g | F: 28g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Whey protein shake in low-fat milk, with a handful of walnuts", kcal: "350 kcal", macros: "P: 30g | C: 22g | F: 14g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken breast (200g), 2 cups steamed white rice, 1 cup cooked dal, and steamed vegetables", kcal: "720 kcal", macros: "P: 52g | C: 85g | F: 16g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "Double turkey breast and cheddar cheese sandwich on whole wheat bread", kcal: "410 kcal", macros: "P: 28g | C: 38g | F: 12g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled paneer blocks (200g), 1 large sweet potato, and steamed asparagus", kcal: "540 kcal", macros: "P: 32g | C: 50g | F: 22g" }
      ],
      Sunday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "3 scrambled eggs, 1 slice whole wheat peanut butter toast, and 1 fresh banana", kcal: "480 kcal", macros: "P: 26g | C: 42g | F: 18g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "1 bowl low-fat Greek yogurt with mixed berries (blueberries, strawberries)", kcal: "220 kcal", macros: "P: 18g | C: 28g | F: 2g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Baked cod or grilled chicken (150g), 1 cup quinoa, and mixed grilled seasonal vegetables", kcal: "450 kcal", macros: "P: 38g | C: 35g | F: 8g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 fresh red apple with a handful of raw almonds (12-15 pieces)", kcal: "200 kcal", macros: "P: 5g | C: 25g | F: 11g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled turkey breast (150g), steamed broccoli florets, and baby carrots with olive oil drizzle", kcal: "380 kcal", macros: "P: 35g | C: 22g | F: 12g" }
      ]
    }
  },
  "Maintenance": {
    calories: "2,200 kcal", protein: "140g", carbs: "220g", fats: "70g", water: "3.5L",
    days: {
      Monday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Tuesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Wednesday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Thursday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Friday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Saturday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "Oats porridge with raw honey, 2 whole boiled eggs, and 1 fresh banana", kcal: "510 kcal", macros: "P: 22g | C: 72g | F: 12g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "Greek yogurt (150g) with fresh sliced strawberries and honey drizzle", kcal: "180 kcal", macros: "P: 14g | C: 22g | F: 3g" },
        { type: "Lunch", label: "🍛 Lunch", items: "Grilled chicken wrap or paneer roll in whole wheat tortilla, bell peppers, light yogurt spread", kcal: "580 kcal", macros: "P: 38g | C: 50g | F: 14g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 slice whole wheat toast with 1/2 mashed avocado, pinch of salt & pepper", kcal: "210 kcal", macros: "P: 5g | C: 20g | F: 13g" },
        { type: "Dinner", label: "🍽 Dinner", items: "Grilled salmon fillet (150g), 1 bowl steamed brown rice, and mixed stir-fried vegetables", kcal: "550 kcal", macros: "P: 36g | C: 48g | F: 15g" }
      ],
      Sunday: [
        { type: "Breakfast", label: "🍽 Breakfast", items: "2 scrambled eggs, 1 slice of whole wheat toast, and 1 fresh orange", kcal: "220 kcal", macros: "P: 13g | C: 18g | F: 10g" },
        { type: "Mid-Morning Snack", label: "🍎 Mid-Morning Snack", items: "1 bowl mixed fresh berries (blueberries, raspberries & strawberries)", kcal: "80 kcal", macros: "P: 1g | C: 18g | F: 0g" },
        { type: "Lunch", label: "🍛 Lunch", items: "120g grilled paneer tikka or tofu block, 1 cup steamed quinoa, and mixed grilled vegetables", kcal: "420 kcal", macros: "P: 25g | C: 35g | F: 18g" },
        { type: "Evening Snack", label: "☕ Evening Snack", items: "1 cup low-fat Greek yogurt with a light drizzle of honey", kcal: "150 kcal", macros: "P: 14g | C: 15g | F: 3g" },
        { type: "Dinner", label: "🍽 Dinner", items: "120g grilled chicken breast or tofu chunks soup with steamed broccoli", kcal: "310 kcal", macros: "P: 30g | C: 15g | F: 12g" }
      ]
    }
  }
};

const WEIGHT_LOSS_WORKOUT_PLAN = {
  Monday: {
    muscleGroup: "Chest + Cardio",
    exercises: [
      { name: "Bench Press", sets: "4", reps: "12", rest: "60s" },
      { name: "Incline Dumbbell Press", sets: "3", reps: "12", rest: "60s" },
      { name: "Chest Fly", sets: "3", reps: "15", rest: "60s" },
      { name: "Push-Ups", sets: "3", reps: "15", rest: "45s" },
      { name: "Cable Crossover", sets: "3", reps: "15", rest: "60s" },
      { name: "Treadmill Jog", sets: "1", reps: "20 Minutes", rest: "-" }
    ]
  },
  Tuesday: {
    muscleGroup: "Back + Core + Cardio",
    exercises: [
      { name: "Lat Pulldown", sets: "4", reps: "12", rest: "60s" },
      { name: "Seated Cable Row", sets: "3", reps: "12", rest: "60s" },
      { name: "One Arm Dumbbell Row", sets: "3", reps: "12", rest: "60s" },
      { name: "Straight Arm Pulldown", sets: "3", reps: "15", rest: "60s" },
      { name: "Deadlift", sets: "3", reps: "10", rest: "90s" },
      { name: "Plank (Core)", sets: "3", reps: "45 Seconds", rest: "30s" },
      { name: "Bicycle Crunch (Core)", sets: "3", reps: "20", rest: "30s" },
      { name: "Leg Raises (Core)", sets: "3", reps: "15", rest: "30s" },
      { name: "Cycling (Cardio)", sets: "1", reps: "20 Minutes", rest: "-" }
    ]
  },
  Wednesday: {
    muscleGroup: "Legs",
    exercises: [
      { name: "Squats", sets: "4", reps: "12", rest: "90s" },
      { name: "Leg Press", sets: "3", reps: "12", rest: "90s" },
      { name: "Walking Lunges", sets: "3", reps: "15", rest: "60s" },
      { name: "Leg Extension", sets: "3", reps: "15", rest: "60s" },
      { name: "Hamstring Curl", sets: "3", reps: "15", rest: "60s" },
      { name: "Standing Calf Raise", sets: "4", reps: "20", rest: "45s" },
      { name: "Stair Climber (Cardio)", sets: "1", reps: "20 Minutes", rest: "-" }
    ]
  },
  Thursday: {
    muscleGroup: "Shoulders + HIIT",
    exercises: [
      { name: "Shoulder Press", sets: "4", reps: "12", rest: "65s" },
      { name: "Lateral Raise", sets: "3", reps: "15", rest: "45s" },
      { name: "Front Raise", sets: "3", reps: "15", rest: "45s" },
      { name: "Rear Delt Fly", sets: "3", reps: "15", rest: "45s" },
      { name: "Upright Row", sets: "3", reps: "12", rest: "60s" },
      { name: "Burpees (HIIT - Repeat 5 Rounds)", sets: "5 Rounds", reps: "10 per round", rest: "30s" },
      { name: "Mountain Climbers (HIIT - Repeat 5 Rounds)", sets: "5 Rounds", reps: "30 Seconds per round", rest: "30s" },
      { name: "High Knees (HIIT - Repeat 5 Rounds)", sets: "5 Rounds", reps: "30 Seconds per round", rest: "30s" },
      { name: "Jump Rope (HIIT - Repeat 5 Rounds)", sets: "5 Rounds", reps: "1 Minute per round", rest: "60s" }
    ]
  },
  Friday: {
    muscleGroup: "Arms + Abs",
    exercises: [
      { name: "Barbell Curl (Biceps)", sets: "4", reps: "12", rest: "60s" },
      { name: "Hammer Curl (Biceps)", sets: "3", reps: "12", rest: "60s" },
      { name: "Concentration Curl (Biceps)", sets: "3", reps: "12", rest: "60s" },
      { name: "Tricep Pushdown (Triceps)", sets: "4", reps: "12", rest: "60s" },
      { name: "Overhead Extension (Triceps)", sets: "3", reps: "12", rest: "60s" },
      { name: "Bench Dips (Triceps)", sets: "3", reps: "15", rest: "45s" },
      { name: "Russian Twist (Abs)", sets: "3", reps: "20", rest: "30s" },
      { name: "Hanging Knee Raises (Abs)", sets: "3", reps: "15", rest: "30s" },
      { name: "Plank (Abs)", sets: "3", reps: "60 Seconds", rest: "45s" },
      { name: "Incline Walk (Cardio)", sets: "1", reps: "20 Minutes", rest: "-" }
    ]
  },
  Saturday: {
    muscleGroup: "Full Body Fat Burn",
    exercises: [
      { name: "Jump Squats", sets: "1", reps: "15", rest: "45s" },
      { name: "Push-Ups", sets: "1", reps: "15", rest: "45s" },
      { name: "Kettlebell Swings", sets: "1", reps: "20", rest: "45s" },
      { name: "Walking Lunges", sets: "1", reps: "20", rest: "45s" },
      { name: "Battle Ropes", sets: "1", reps: "30 Seconds", rest: "45s" },
      { name: "Burpees", sets: "1", reps: "12", rest: "45s" },
      { name: "Box Step-Ups", sets: "1", reps: "15", rest: "45s" },
      { name: "Rowing Machine (Cardio)", sets: "1", reps: "20 Minutes", rest: "-" },
      { name: "Full Body Stretch (Stretching)", sets: "1", reps: "10 Minutes", rest: "-" }
    ]
  },
  Sunday: {
    muscleGroup: "Rest Day",
    exercises: []
  }
};

const ClientDashboard = () => {
  const navigate = useNavigate();
  const { clients, workouts } = useCRM();

  // Retrieve the logged-in/active client, falling back to the first client in the system
  const client = clients?.find(c => c.id === localStorage.getItem("gym_client_id") || c.name === "Ajay Kaveti" || c.email === "ajay@befit.com") || clients?.[0];

  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const timeGreeting = React.useMemo(() => {
    const hour = currentTime.getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 17) return "Good Afternoon";
    return "Good Evening";
  }, [currentTime]);

  const welcomeSubtitle = `Welcome back! You are pacing well on your ${client?.goal?.toLowerCase() || 'fitness'} milestones. Stay fueled, hydra-charged, and crush today's lift split.`;
  const motivationalQuote = "Consistency beats motivation. Small daily improvements lead to massive results!";

  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [activeTab, setActiveTab] = useState("Dashboard");
  
  const todayName = daysOfWeek[new Date().getDay()];
  const [selectedDietDay, setSelectedDietDay] = useState(todayName);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  // AI assistant status state
  const [aiResponse, setAiResponse] = useState("");
  const [loadingAi, setLoadingAi] = useState(false);

  // Attendance Heatmap date hover state
  const [hoveredDate, setHoveredDate] = useState(null);

  // Quick settings state
  const [waterCount, setWaterCount] = useState(2); // 2 Liters drunk today

  // Exercise completions check list
  const [exerciseCompletions, setExerciseCompletions] = useState({
    ex_bench: true,
    ex_incline: true,
    ex_fly: false,
    ex_pushdown: false
  });

  const [isWorkoutLoading, setIsWorkoutLoading] = useState(false);
  const [workoutError, setWorkoutError] = useState(null);

  useEffect(() => {
    localStorage.setItem("gym_role", "client");
  }, []);

  useEffect(() => {
    if (activeTab === "My Workout") {
      setIsWorkoutLoading(true);
      const timer = setTimeout(() => {
        setIsWorkoutLoading(false);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [activeTab]);

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
        "Based on your 14-day streak and current rate, your metabolism is peak. I suggest increasing your water intake to 3.5L tomorrow to optimize fat oxidation. Keep up the Chest split load!"
      );
      setLoadingAi(false);
      toast.success("AI Fitness Coach analysis compiled.");
    }, 1200);
  };

  const formatDateFriendly = (dateString) => {
    if (!dateString) return "";
    try {
      const parts = dateString.split("-");
      const d = new Date(parts[0], parts[1] - 1, parts[2]);
      return d.toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" });
    } catch (e) {
      return dateString;
    }
  };

  // Mock invoice data
  const invoiceList = [
    { id: "inv_1", number: "INV-072601", date: "2026-07-25", plan: "BeFit Premium Annual", amount: 28000, method: "UPI", status: "Paid" },
    { id: "inv_2", number: "INV-062604", date: "2026-06-25", plan: "BeFit Premium Monthly", amount: 3500, method: "Card", status: "Paid" },
    { id: "inv_3", number: "INV-052609", date: "2026-05-25", plan: "BeFit Premium Monthly", amount: 3500, method: "UPI", status: "Paid" }
  ];

  // Mock weight history
  const weightProgressList = [
    { date: "May 10", weight: 75 },
    { date: "May 25", weight: 74.2 },
    { date: "Jun 10", weight: 73 },
    { date: "Jun 25", weight: 71.5 },
    { date: "Jul 10", weight: 70.8 },
    { date: "Jul 22", weight: 70 }
  ];

  // Mock July 2026 heatmap calendar
  // 1 = Present (Green), 2 = Absent (Red), 3 = Holiday (Grey)
  const attendanceHeatmap = [
    { day: 1, status: 1 }, { day: 2, status: 1 }, { day: 3, status: 1 }, { day: 4, status: 3 },
    { day: 5, status: 1 }, { day: 6, status: 1 }, { day: 7, status: 1 }, { day: 8, status: 1 },
    { day: 9, status: 1 }, { day: 10, status: 1 }, { day: 11, status: 3 }, { day: 12, status: 2 },
    { day: 13, status: 1 }, { day: 14, status: 1 }, { day: 15, status: 1 }, { day: 16, status: 1 },
    { day: 17, status: 1 }, { day: 18, status: 3 }, { day: 19, status: 1 }, { day: 20, status: 1 },
    { day: 21, status: 1 }, { day: 22, status: 1 }, { day: 23, status: 2 }, { day: 24, status: 1 },
    { day: 25, status: 3 }, { day: 26, status: 1 }, { day: 27, status: 1 }, { day: 28, status: 1 },
    { day: 29, status: 1 }, { day: 30, status: 1 }, { day: 31, status: 1 }
  ];

  // Menu items list
  const sidebarItems = [
    { name: "Dashboard", icon: LayoutDashboard },
    { name: "My Workout", icon: Dumbbell },
    { name: "My Diet", icon: Apple },
    { name: "Attendance", icon: Calendar },
    { name: "Progress", icon: Scale },
    { name: "Payments", icon: CreditCard },
    { name: "Achievements", icon: Trophy },
    { name: "Profile", icon: User }
  ];

  const handleLogout = () => {
    localStorage.removeItem("gym_auth");
    localStorage.removeItem("gym_role");
    sessionStorage.removeItem("gym_auth");
    sessionStorage.removeItem("gym_role");
    toast.success("Successfully logged out");
    navigate("/login");
  };

  if (!client) {
    return (
      <div className="min-h-screen bg-[#080B14] text-slate-100 flex items-center justify-center font-sans p-6">
        <div className="text-center space-y-4 max-w-sm">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white mx-auto shadow-lg">
            <Dumbbell className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-lg font-black text-white animate-pulse">Loading Account Details...</h2>
          <p className="text-xs text-slate-400">We are retrieving your personalized gym profile. Please make sure the trainer database is initialized.</p>
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
          <div className="flex items-center gap-3.5 mb-9 px-2">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
              <Dumbbell className="w-5.5 h-5.5" />
            </div>
            <div>
              <h1 className="text-lg font-black tracking-tight leading-none bg-gradient-to-r from-blue-400 via-cyan-400 to-purple-400 bg-clip-text text-transparent">
                BeFit
              </h1>
              <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mt-1">
                Personal Companion
              </span>
            </div>
          </div>

          {/* Nav list */}
          <nav className="space-y-1.5">
            {sidebarItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.name;
              return (
                <button
                  key={item.name}
                  onClick={() => { setActiveTab(item.name); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-sm font-semibold transition-all duration-205 cursor-pointer text-left ${
                    isActive
                      ? "bg-gradient-to-r from-blue-600/20 to-cyan-500/10 text-blue-400 border border-blue-500/20 shadow-md shadow-blue-500/5 font-black"
                      : "text-slate-400 hover:text-slate-205 hover:bg-[#111827]/40 border border-transparent"
                  }`}
                >
                  <Icon className={`w-4.5 h-4.5 ${isActive ? "text-cyan-400 animate-pulse" : "text-slate-400"}`} />
                  <span>{item.name}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Sidebar layout */}
        <div className="space-y-4 pt-5 border-t border-[#1e293b]/40">
          <Link
            to="/"
            onClick={() => {
              localStorage.setItem("gym_role", "trainer");
              toast.success("Switched to Trainer View Portal 👨‍🏫");
            }}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-black text-purple-400 bg-purple-500/5 border border-purple-500/10 hover:bg-purple-500/10 transition-all cursor-pointer"
          >
            <User className="w-4 h-4 text-cyan-455" />
            <span>Switch to Trainer View</span>
          </Link>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3.5 px-4.5 py-3 rounded-2xl text-xs font-bold text-rose-500 hover:bg-rose-500/5 border border-transparent hover:border-rose-500/10 transition cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>

      {/* --- MAIN PAGE VIEWPORT AREA --- */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#080B14] p-4.5 sm:p-6 lg:p-8 pb-20 lg:pb-8 overflow-y-auto max-h-screen">
        
        {/* Mobile Navbar Header */}
        <div className="flex lg:hidden justify-between items-center bg-[#0b101c]/80 border border-[#1e293b]/50 rounded-2xl p-4.5 mb-6 backdrop-blur-md sticky top-0 z-30">
          <div className="flex items-center gap-3">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center text-white shadow-sm">
              <Dumbbell className="w-4.5 h-4.5" />
            </div>
            <span className="font-extrabold text-sm tracking-tight text-white">BeFit Portal</span>
          </div>
          <div className="flex items-center gap-2">
            {/* Profile Avatar Mobile toggle trigger */}
            <div className="relative">
              <button
                onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                className="w-8.5 h-8.5 rounded-xl overflow-hidden border border-[#1e293b]/70 cursor-pointer"
              >
                <img
                  src="https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=100"
                  alt="Client avatar"
                  className="w-full h-full object-cover"
                />
              </button>
              {showRoleDropdown && (
                <div className="absolute top-10 right-0 w-48 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#1e293b]/30 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                  <div className="px-3 py-1.5">
                    <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider font-display">Role</span>
                    <span className="text-xs font-black text-white block mt-0.5">Client Portal</span>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => handleSwitchRole("trainer")}
                      className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-zinc-850 text-slate-350 rounded-xl transition text-left"
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

        {/* --- TABS LAYOUT CONTROLLER --- */}

        {/* 1. DASHBOARD HOME TAB */}
        {activeTab === "Dashboard" && (
          <div className="space-y-6 animate-in fade-in duration-300">
            
            {/* Hero Welcome Banner */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center p-6 sm:p-8 bg-gradient-to-br from-[#1e293b] via-[#0f172a] to-[#09090b] border border-zinc-850 rounded-3xl relative overflow-hidden text-left gap-4">
              <div className="absolute -top-24 -right-24 w-60 h-60 bg-blue-600/10 rounded-full blur-3xl" />
              <div className="absolute -bottom-24 -left-24 w-60 h-60 bg-cyan-500/10 rounded-full blur-3xl" />
              
              <div className="relative z-10 space-y-3">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-550/15 border border-cyan-500/30 text-cyan-300 text-[10px] font-black uppercase tracking-wider">
                  ✨ {currentTime.toLocaleDateString("en-US", { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' })} • {currentTime.toLocaleTimeString("en-US", { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                </div>
                <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
                  {timeGreeting}, {client?.name || "Client"} 👋
                </h1>
                <p className="text-xs text-slate-355 max-w-md font-medium leading-relaxed">
                  {welcomeSubtitle}
                </p>
                <div className="pt-2 border-t border-slate-800/50 max-w-md">
                  <span className="text-[9px] text-slate-400 font-bold uppercase block tracking-wider mb-1">DAILY MOTIVATION</span>
                  <p className="text-xs text-cyan-350 italic font-bold">"{motivationalQuote}"</p>
                </div>
              </div>

              {/* Float Metadata Summary Block with Role Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowRoleDropdown(!showRoleDropdown)}
                  className="flex items-center gap-4 bg-zinc-900/60 backdrop-blur-md border border-[#1e293b]/40 p-4 rounded-2xl relative z-10 shrink-0 shadow-xl hover:bg-zinc-800 transition cursor-pointer text-left"
                >
                  <img
                    src={client?.photo || "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?auto=format&fit=crop&q=80&w=120"}
                    alt={client?.name || "Client"}
                    className="w-14 h-14 rounded-xl object-cover border border-blue-500/20"
                  />
                  <div className="text-left text-xs space-y-0.5">
                    <span className="text-[10px] font-black text-slate-500 block uppercase tracking-wider">Client Mode 👤</span>
                    <span className="font-extrabold text-blue-400 flex items-center gap-1 mt-0.5">🔥 {client?.name?.split(' ')[0] || "Client"}</span>
                    <div className="flex items-center gap-3.5 mt-1.5 text-[10px] font-semibold text-slate-350">
                      <div>Goal: <strong className="text-white">{client?.goal || 'General Fitness'}</strong></div>
                    </div>
                  </div>
                </button>

                {showRoleDropdown && (
                  <div className="absolute top-20 right-0 w-52 bg-[#0b101c]/95 backdrop-blur-md border border-[#1e293b]/70 rounded-2xl shadow-xl z-50 p-2 divide-y divide-[#1e293b]/30 animate-in fade-in slide-in-from-top-2 duration-200 text-left">
                    <div className="px-3 py-2">
                      <span className="text-[9px] text-slate-550 font-bold block uppercase tracking-wider">Current Role</span>
                      <span className="text-xs font-black text-white block mt-0.5">Client Portal</span>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => handleSwitchRole("trainer")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold hover:bg-[#111827] text-slate-300 rounded-xl transition text-left"
                      >
                        <span className="text-sm">👨‍🏫</span>
                        <span>Switch to Trainer</span>
                      </button>
                      <button
                        onClick={() => handleSwitchRole("client")}
                        className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold bg-blue-600/10 text-cyan-400 rounded-xl transition text-left mt-0.5"
                      >
                        <span className="text-sm">👤</span>
                        <span>Switch to Client</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Background gradient flares */}
              <div className="absolute top-0 right-0 w-44 h-44 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-44 h-44 bg-purple-600/10 rounded-full blur-3xl pointer-events-none" />
            </div>

            {/* Quick Fitness Stats Row */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-left">
              {[
                { title: "Weight Progress", val: "70 kg", sub: "↓ 2kg this month", icon: Scale, color: "from-blue-600 to-cyan-500 text-blue-400" },
                { title: "Attendance Rate", val: "92%", sub: "Excellent records", icon: Calendar, color: "from-emerald-500 to-teal-400 text-emerald-450" },
                { title: "Workout Completed", val: "18 Sessions", sub: "Month activity logs", icon: Dumbbell, color: "from-purple-600 to-pink-500 text-purple-400" },
                { title: "Membership Period", val: "Active Plan", sub: "28 Days Remaining", icon: CreditCard, color: "from-amber-500 to-orange-400 text-amber-500" }
              ].map((card, i) => {
                const Icon = card.icon;
                return (
                  <div key={i} className="bg-[#111827] border border-[#1e293b]/40 rounded-3xl p-5 hover:border-zinc-800 transition duration-200 shadow-lg relative flex flex-col justify-between overflow-hidden group">
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-wide block">{card.title}</span>
                      <div className="w-8 h-8 bg-zinc-950/60 rounded-xl flex items-center justify-center border border-zinc-850 shrink-0 text-slate-400">
                        <Icon className="w-4 h-4" />
                      </div>
                    </div>
                    <div className="mt-5">
                      <h4 className="text-lg sm:text-xl font-black text-white">{card.val}</h4>
                      <span className="text-[9.5px] font-bold text-slate-400 mt-1 block leading-none">{card.sub}</span>
                    </div>
                    
                    {/* Glowing highlight border bottom */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.color} opacity-20 group-hover:opacity-100 transition-opacity`} />
                  </div>
                );
              })}
            </div>

            {/* Highlighted AI Coach & Achievements Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              
              {/* AI Fitness Coach Glowing Card */}
              <div className="lg:col-span-2 bg-gradient-to-br from-[#111827] to-[#121021] border border-purple-500/25 rounded-3xl p-6 relative overflow-hidden text-left flex flex-col justify-between shadow-xl group">
                <div className="space-y-3.5">
                  <span className="text-[10px] font-black text-purple-400 uppercase tracking-widest bg-purple-500/10 px-2.5 py-1 rounded-full border border-purple-500/20 flex items-center gap-1.5 w-fit">
                    <Sparkles className="w-3.5 h-3.5 text-purple-400 animate-spin" /> AI Fitness Coach 🤖
                  </span>
                  
                  <h3 className="text-sm font-black text-white mt-1">Real-time Fitness Metrics Advice</h3>
                  <p className="text-xs text-slate-355 leading-relaxed font-semibold italic bg-zinc-950/30 p-4 rounded-2xl border border-zinc-900 mt-2">
                    {aiResponse ? aiResponse : '"Your weight reduced by 1.5kg this month. Keep maintaining your protein intake."'}
                  </p>
                </div>

                <div className="mt-5">
                  <button 
                    onClick={triggerAskAi}
                    disabled={loadingAi}
                    className="w-full py-2.5 bg-purple-600/15 hover:bg-purple-600 text-purple-400 hover:text-white border border-purple-500/20 hover:border-purple-600 rounded-2xl text-xs font-bold transition duration-200 cursor-pointer shadow-sm relative overflow-hidden group flex items-center justify-center gap-2"
                  >
                    <span>{loadingAi ? "Analyzing metrics..." : "Ask AI Coach"}</span>
                  </button>
                </div>
                
                {/* Glowing neon background circle */}
                <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-purple-600/10 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
              </div>

              {/* Badges preview */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left">
                <div>
                  <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                    <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Achievements Badges</h3>
                    <span className="text-[10px] text-cyan-405 font-bold">4 / 5 Unlocked</span>
                  </div>
                  
                  <div className="grid grid-cols-5 gap-2.5 py-2">
                    {[
                      { icon: "🏆", name: "First Workout", status: true },
                      { icon: "🔥", name: "7 Day Streak", status: true },
                      { icon: "💪", name: "30 Workouts", status: true },
                      { icon: "🎯", name: "Goal Achieved", status: false },
                      { icon: "⭐", name: "Perfect Attendance", status: true }
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
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-cyan-455 border-2 border-[#111827] rounded-full" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab("Achievements")}
                  className="w-full mt-6 py-2.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-2xl text-xs font-bold transition duration-150 cursor-pointer text-center"
                >
                  View Achievement Showcase
                </button>
              </div>

            </div>

          </div>
        )}

        {/* 2. WORKOUT TAB */}
        {activeTab === "My Workout" && (() => {
          const todayDayName = new Date().toLocaleDateString("en-US", { weekday: "long" }); // e.g. "Monday"
          const todayDayKey = todayDayName.toLowerCase(); // e.g. "monday"
          const clientWorkoutPlan = client ? workouts?.[client.id] : null;
          const todayWorkout = clientWorkoutPlan ? (clientWorkoutPlan[todayDayKey] || clientWorkoutPlan[todayDayName]) : null;

          if (isWorkoutLoading) {
            return (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                <h3 className="text-sm font-black text-white animate-pulse">Loading daily planner splits...</h3>
              </div>
            );
          }

          if (workoutError) {
            return (
              <div className="py-24 flex flex-col items-center justify-center text-center space-y-4">
                <span className="text-4xl">⚠️</span>
                <h3 className="text-base font-black text-white">Failed to load Workout Plan</h3>
                <p className="text-xs text-rose-455 font-semibold">{workoutError}</p>
                <button 
                  onClick={() => setWorkoutError(null)}
                  className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer text-xs uppercase tracking-wider"
                >
                  Retry Loading
                </button>
              </div>
            );
          }

          const isSunday = todayDayName === "Sunday";
          const isRestDay = isSunday || (todayWorkout && (todayWorkout.muscleGroup === "Rest Day" || todayWorkout.muscleGroup?.toLowerCase().includes("rest")));

          if (isRestDay) {
            return (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {/* Daily Workout Header */}
                <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest block w-fit">
                        📅 {(() => {
                          const d = new Date();
                          const dayNum = d.getDate();
                          const monthName = d.toLocaleDateString("en-US", { month: "long" });
                          const year = d.getFullYear();
                          return `${dayNum} ${monthName} ${year}`;
                        })()}
                      </span>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">📆 {todayDayName}</span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">
                          🏋️ Today's Workout: <span className="text-blue-400">Rest Day</span>
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-8 shadow-xl text-center space-y-4">
                  <span className="text-5xl block animate-bounce">🏖</span>
                  <h3 className="text-lg font-black text-white">Rest Day</h3>
                  <p className="text-xs text-slate-355 max-w-md mx-auto leading-relaxed">
                    Today is your recovery day. Focus on stretching, hydration, light walking, and proper sleep.
                  </p>
                </div>
              </div>
            );
          }

          // Empty state when no workout is assigned or it has no exercises
          if (!todayWorkout || !todayWorkout.exercises || todayWorkout.exercises.length === 0) {
            return (
              <div className="space-y-6 text-left animate-in fade-in duration-200">
                {/* Daily Workout Header */}
                <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                    <div className="space-y-2">
                      <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest block w-fit">
                        📅 {(() => {
                          const d = new Date();
                          const dayNum = d.getDate();
                          const monthName = d.toLocaleDateString("en-US", { month: "long" });
                          const year = d.getFullYear();
                          return `${dayNum} ${monthName} ${year}`;
                        })()}
                      </span>
                      
                      <div className="space-y-1">
                        <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">📆 {todayDayName}</span>
                        <h2 className="text-xl sm:text-2xl font-black text-white">
                          🏋️ Today's Workout
                        </h2>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Empty State */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-8 shadow-xl text-center space-y-4">
                  <span className="text-5xl block animate-bounce">🏋️</span>
                  <h3 className="text-lg font-black text-white">No Workout Assigned</h3>
                  <p className="text-xs text-slate-355 max-w-md mx-auto leading-relaxed">
                    You don't have a workout assigned yet. Please contact your trainer or wait until your trainer assigns a workout plan.
                  </p>
                  <button
                    onClick={() => setActiveTab("Dashboard")}
                    className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl transition cursor-pointer text-xs uppercase tracking-wider animate-pulse"
                  >
                    Back to Dashboard
                  </button>
                </div>
              </div>
            );
          }

          const todayWorkoutName = todayWorkout.muscleGroup || "Workout Split";
          const exercises = todayWorkout.exercises || [];

          // Progress calculation
          const completedCount = exercises.filter(ex => exerciseCompletions[`${todayDayName}_${ex.name}`]).length;
          const totalCount = exercises.length;
          const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

          return (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              {/* Daily Workout Header */}
              <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
                  <div className="space-y-2">
                    <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-3 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest block w-fit">
                      📅 {(() => {
                        const d = new Date();
                        const dayNum = d.getDate();
                        const monthName = d.toLocaleDateString("en-US", { month: "long" });
                        const year = d.getFullYear();
                        return `${dayNum} ${monthName} ${year}`;
                      })()}
                    </span>
                    
                    <div className="space-y-1">
                      <span className="text-xs text-slate-400 font-extrabold uppercase tracking-wider block">📆 {todayDayName}</span>
                      <h2 className="text-xl sm:text-2xl font-black text-white">
                        🏋️ Today's Workout: <span className="text-blue-400">{todayWorkoutName}</span>
                      </h2>
                    </div>
                  </div>

                  {totalCount > 0 && (
                    <div className="p-4 bg-[#080B14] rounded-2xl border border-zinc-850 shrink-0 text-center min-w-[140px]">
                      <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Completion Goal</span>
                      <span className="text-sm font-black text-cyan-400 block mt-1">{completedCount} / {totalCount} Done</span>
                    </div>
                  )}
                </div>

                {/* Trainer Notes */}
                {todayWorkout.notes && (
                  <div className="border-t border-[#1e293b]/40 pt-4 mt-2">
                    <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider block">Trainer Notes</span>
                    <p className="text-xs text-slate-300 mt-1 leading-relaxed italic">
                      "{todayWorkout.notes}"
                    </p>
                  </div>
                )}
              </div>

              {/* Progress Bar Row */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-extrabold text-slate-400 uppercase tracking-wider">Workout Progress</span>
                  <span className="font-black text-cyan-400">{progressPercent}%</span>
                </div>
                <div className="w-full h-3 bg-zinc-950 rounded-full overflow-hidden border border-zinc-900">
                  <div 
                    className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-purple-500 rounded-full transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  />
                </div>
              </div>

              {/* Exercises Checklist */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                  Exercise Routine Checklist
                </span>

                <div className="space-y-3.5">
                  {exercises.map((ex) => {
                    const exKey = `${todayDayName}_${ex.name}`;
                    const isCompleted = exerciseCompletions[exKey];
                    return (
                      <div 
                        key={exKey}
                        onClick={() => {
                          setExerciseCompletions(prev => {
                            const next = { ...prev, [exKey]: !prev[exKey] };
                            if (next[exKey]) {
                              toast.success(`Completed ${ex.name}! 💪`);
                            }
                            return next;
                          });
                        }}
                        className="p-4 bg-zinc-950/30 hover:bg-zinc-950/50 border border-zinc-900 rounded-2xl flex flex-col md:flex-row justify-between md:items-center gap-4 transition duration-150 cursor-pointer"
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
                            <span className="font-extrabold text-white text-sm block leading-none">{ex.name}</span>
                            {ex.notes && (
                              <p className="text-slate-450 leading-relaxed max-w-xl text-[11px] font-semibold mt-1">
                                <strong className="text-slate-400">Notes:</strong> {ex.notes}
                              </p>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-wrap md:flex-col items-center md:items-end justify-between shrink-0 border-t md:border-t-0 border-zinc-850/60 pt-3 md:pt-0 gap-2">
                          <span className="text-xs font-black text-cyan-400">
                            {ex.sets ? `${ex.sets} Sets` : ""} {ex.reps ? `× ${ex.reps} Reps` : ""}
                          </span>
                          <div className="flex gap-2 mt-0.5">
                            {ex.weight && ex.weight !== "N/A" && (
                              <span className="text-[9.5px] text-cyan-405 font-bold bg-[#111827] px-2 py-0.5 rounded border border-zinc-800">
                                Wt: {ex.weight}
                              </span>
                            )}
                            <span className="text-[9.5px] text-slate-404 font-bold bg-[#111827] px-2 py-0.5 rounded border border-zinc-800">
                              Rest: {ex.rest || ex.restTime || todayWorkout.restTime || todayWorkout.rest || "60s"}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

            </div>
          );
        })()}

        {/* 3. DIET TAB */}
        {activeTab === "My Diet" && (() => {
          const getGoalPlanKey = (goal) => {
            if (!goal) return "Maintenance";
            const g = goal.toLowerCase();
            if (g.includes("loss") || g.includes("cut") || g.includes("diet") || g.includes("fat")) return "Weight Loss";
            if (g.includes("gain") || g.includes("bulk") || g.includes("strength") || g.includes("muscle")) return "Muscle Gain";
            return "Maintenance";
          };

          const goalKey = getGoalPlanKey(client.goal);
          const activePlan = DIET_PLANS[goalKey] || DIET_PLANS["Maintenance"];
          const dayMeals = activePlan.days[selectedDietDay] || [];
          
          // Dynamic calories/macros based on active selection (overridden for Sunday Rest Day)
          const isSunday = selectedDietDay === "Sunday";
          const displayCalories = isSunday 
            ? (goalKey === "Weight Loss" ? "1,240 kcal" : goalKey === "Muscle Gain" ? "1,980 kcal" : "1,580 kcal")
            : activePlan.calories;
          const displayProtein = isSunday 
            ? (goalKey === "Weight Loss" ? "65g" : goalKey === "Muscle Gain" ? "120g" : "90g")
            : activePlan.protein;
          const displayCarbs = isSunday 
            ? (goalKey === "Weight Loss" ? "110g" : goalKey === "Muscle Gain" ? "190g" : "150g")
            : activePlan.carbs;
          const displayFats = isSunday 
            ? (goalKey === "Weight Loss" ? "35g" : goalKey === "Muscle Gain" ? "50g" : "40g")
            : activePlan.fats;
          const displayWater = isSunday 
            ? (goalKey === "Weight Loss" ? "2.5L" : goalKey === "Muscle Gain" ? "3.5L" : "3.0L")
            : activePlan.water;

          return (
            <div className="space-y-6 text-left animate-in fade-in duration-200">
              
              {/* Today's Header */}
              <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-widest">
                    {(() => {
                      const d = new Date();
                      const dayName = d.toLocaleDateString("en-US", { weekday: "long" });
                      const dayNum = d.getDate();
                      const monthName = d.toLocaleDateString("en-US", { month: "long" });
                      const year = d.getFullYear();
                      return `${dayName}, ${dayNum} ${monthName} ${year}`;
                    })()}
                  </span>
                  <h2 className="text-xl font-black text-white mt-3.5">Today's Diet Plan</h2>
                  <p className="text-xs text-slate-400 font-medium">Follow your curated diet blueprint to optimize recovery and gains.</p>
                </div>
                
                <div className="p-4 bg-[#080B14] rounded-2xl border border-zinc-850 shrink-0 text-center">
                  <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Hydration Level</span>
                  <span className="text-sm font-black text-blue-400 block mt-1">{waterCount}L / {displayWater}</span>
                </div>
              </div>

              {/* Weekly Schedule Row */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                  Weekly Nutritional Blueprint
                </span>
                <div className="grid grid-cols-2 sm:grid-cols-7 gap-2.5">
                  {daysOfWeek.map((day) => {
                    const isToday = day === todayName;
                    const isSelected = day === selectedDietDay;
                    const dayIsSunday = day === "Sunday";
                    const calories = dayIsSunday 
                      ? (goalKey === "Weight Loss" ? "1,240 kcal" : goalKey === "Muscle Gain" ? "1,980 kcal" : "1,580 kcal")
                      : activePlan.calories;
                    return (
                      <button
                        key={day}
                        onClick={() => setSelectedDietDay(day)}
                        className={`p-3 rounded-2xl border text-center transition duration-200 cursor-pointer flex flex-col items-center justify-between min-h-[90px] ${
                          isSelected
                            ? "bg-blue-600/20 border-blue-500 text-blue-400 font-black shadow-md shadow-blue-500/5"
                            : isToday
                            ? "bg-zinc-900 border-zinc-800 text-slate-205 border-dashed"
                            : "bg-zinc-950/40 border-zinc-900 text-slate-550 hover:border-zinc-800"
                        }`}
                      >
                        <span className="text-[10px] uppercase font-bold tracking-wider">{day.slice(0, 3)}</span>
                        <div className="w-8 h-8 rounded-full bg-zinc-950 flex items-center justify-center my-1.5 border border-zinc-900 text-xs">
                          🥗
                        </div>
                        <span className="text-[9px] font-bold block truncate max-w-[70px] uppercase tracking-tighter text-slate-400">{calories}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Macro Targets Row */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 no-print">
                {[
                  { label: "Target Calories", val: displayCalories, desc: "Energy ceiling limit", icon: Zap, color: "text-amber-500 bg-amber-500/5 border-amber-550/10" },
                  { label: "Total Protein", val: displayProtein, desc: "Lean muscle repair", icon: Heart, color: "text-rose-500 bg-rose-500/5 border-rose-550/10" },
                  { label: "Total Carbs", val: displayCarbs, desc: "Glycogen restoration", icon: Activity, color: "text-cyan-400 bg-cyan-400/5 border-cyan-455/10" },
                  { label: "Total Fats", val: displayFats, desc: "Hormone regulation", icon: Award, color: "text-purple-500 bg-purple-500/5 border-purple-550/10" },
                  { label: "Water Goal", val: displayWater, desc: "Hydration target limit", icon: Droplet, color: "text-blue-400 bg-blue-400/5 border-blue-455/10" }
                ].map((card, idx) => {
                  const Icon = card.icon;
                  return (
                    <div key={idx} className="bg-[#111827] border border-[#1e293b]/45 rounded-2xl p-4 flex flex-col justify-between text-left">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px] font-black text-slate-550 uppercase tracking-wider">{card.label}</span>
                        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${card.color} shrink-0`}>
                          <Icon className="w-3.5 h-3.5" />
                        </div>
                      </div>
                      <div className="mt-4">
                        <h4 className="text-base font-black text-white">{card.val}</h4>
                        <p className="text-[9px] text-slate-455 mt-0.5 leading-snug font-semibold">{card.desc}</p>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Diet Meal Details */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                  {selectedDietDay === todayName ? "Today's Meals Schedule" : `${selectedDietDay} Meal Blueprint`} — {goalKey} Diet
                </span>
                
                <div className="divide-y divide-[#1e293b]/35 space-y-4">
                  {dayMeals.map((m, i) => (
                    <div key={i} className={`pt-4 ${i === 0 ? "pt-0" : ""} flex flex-col sm:flex-row justify-between sm:items-start gap-3.5 text-xs`}>
                      <div className="space-y-1">
                        <span className="font-extrabold text-white text-sm block leading-none">{m.label}</span>
                        <p className="text-slate-205 leading-relaxed font-semibold max-w-xl mt-1.5">{m.items}</p>
                      </div>
                      <div className="text-right shrink-0 border-t sm:border-t-0 border-zinc-850 pt-2.5 sm:pt-0">
                        <span className="font-black text-white block">{m.kcal}</span>
                        <span className="text-[10px] text-cyan-455 block mt-0.5">{m.macros}</span>
                      </div>
                    </div>
                  ))}
                </div>

                {selectedDietDay === todayName && (
                  <div className="mt-6 pt-4 border-t border-[#1e293b]/40 flex items-center justify-between">
                    <span className="text-[11px] text-slate-450 font-bold flex items-center gap-1.5">
                      <Droplet className="w-4 h-4 text-blue-400 animate-pulse" /> Hydration Log Tracker
                    </span>
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => setWaterCount(prev => Math.max(prev - 0.5, 0))}
                        className="px-2.5 py-1 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 rounded text-slate-405 text-xs font-bold cursor-pointer"
                      >
                        -0.5L
                      </button>
                      <span className="text-xs font-black text-white">{waterCount}L</span>
                      <button 
                        onClick={() => {
                          setWaterCount(prev => Math.min(prev + 0.5, 6));
                          toast.success("Hydration log tracked successfully.");
                        }}
                        className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 rounded text-white text-xs font-bold cursor-pointer"
                      >
                        +0.5L
                      </button>
                    </div>
                  </div>
                )}
              </div>

            </div>
          );
        })()}

        {/* 4. ATTENDANCE TAB */}
        {activeTab === "Attendance" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Heatmap calendar */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Attendance Calendar Heatmap</h3>
                <p className="text-[10px] text-slate-400 mt-1">Overview grid of checked in sessions for July 2026</p>
              </div>

              {/* Heatmap Grid */}
              <div className="py-4 text-xs">
                {/* Weekdays names */}
                <div className="grid grid-cols-7 gap-2.5 text-center text-[10px] font-black text-slate-500 uppercase mb-3">
                  <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
                </div>
                
                {/* 31 days with offset 3 (starts on Wed) */}
                <div className="grid grid-cols-7 gap-2.5">
                  {Array.from({ length: 3 }).map((_, idx) => (
                    <div key={`offset-${idx}`} className="aspect-square bg-transparent" />
                  ))}
                  {attendanceHeatmap.map((item) => {
                    let cellBg = "bg-zinc-950/45 border-zinc-900 text-slate-500";
                    let label = "Holiday";
                    if (item.status === 1) {
                      cellBg = "bg-emerald-500/10 border-emerald-500/35 text-emerald-400 font-extrabold shadow-sm shadow-emerald-500/5";
                      label = "Present";
                    }
                    if (item.status === 2) {
                      cellBg = "bg-rose-500/10 border-rose-500/35 text-rose-500 font-extrabold shadow-sm shadow-rose-500/5";
                      label = "Absent";
                    }

                    return (
                      <div
                        key={item.day}
                        onMouseEnter={() => setHoveredDate({ day: item.day, label })}
                        onMouseLeave={() => setHoveredDate(null)}
                        className={`aspect-square border rounded-2xl flex flex-col items-center justify-center text-xs relative transition duration-150 hover:scale-105 select-none ${cellBg}`}
                      >
                        <span>{item.day}</span>
                      </div>
                    );
                  })}
                </div>

                {/* Date Hover Label overlay */}
                {hoveredDate && (
                  <div className="mt-4 p-2.5 bg-zinc-900 border border-zinc-800 text-slate-205 rounded-xl text-center font-bold text-[10.5px] animate-in fade-in duration-100">
                    22 July 2026 — Day {hoveredDate.day} status: <strong className="text-white">{hoveredDate.label}</strong>
                  </div>
                )}

                {/* Legend panel */}
                <div className="flex gap-4 justify-center items-center mt-6 pt-4 border-t border-zinc-850/60 text-[10px] font-bold">
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-emerald-500/10 border border-emerald-500/30" /><span className="text-slate-400">Present</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-rose-500/10 border border-rose-500/30" /><span className="text-slate-400">Absent</span></div>
                  <div className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded bg-zinc-950/45 border border-zinc-900" /><span className="text-slate-400">Holiday</span></div>
                </div>
              </div>
            </div>

            {/* Counters cards row */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Present Days</span>
                <span className="text-lg font-black text-emerald-450 mt-1 block">23 Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Absent Days</span>
                <span className="text-lg font-black text-rose-500 mt-1 block">2 Days</span>
              </div>
              <div className="p-4 bg-[#111827] border border-[#1e293b]/45 rounded-2xl shadow-sm">
                <span className="text-[9px] font-bold text-slate-500 uppercase tracking-wider block">Total Tracked</span>
                <span className="text-lg font-black text-blue-400 mt-1 block">25 Days</span>
              </div>
            </div>

          </div>
        )}

        {/* 5. PROGRESS TAB */}
        {activeTab === "Progress" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* SVG Weight Progression Line graph */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <div>
                <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Weight Progression Trend</h3>
                <p className="text-[10px] text-slate-500 mt-0.5 font-medium">Tracking body weight parameters against goal weight targets</p>
              </div>

              {/* Custom SVG Line Chart */}
              {(() => {
                const points = weightProgressList.map(item => item.weight);
                const maxVal = 76;
                const minVal = 64;
                const valRange = maxVal - minVal;

                // Canvas coordinates
                const chartW = 500;
                const chartH = 140;
                const paddingX = 40;
                const paddingY = 20;
                const plotW = chartW - paddingX * 2;
                const plotH = chartH - paddingY * 2;

                const mapX = (index) => paddingX + (index / (points.length - 1)) * plotW;
                const mapY = (val) => chartH - paddingY - ((val - minVal) / valRange) * plotH;

                let pathD = "";
                points.forEach((val, i) => {
                  const px = mapX(i);
                  const py = mapY(val);
                  if (i === 0) pathD = `M ${px} ${py}`;
                  else pathD += ` L ${px} ${py}`;
                });

                // Target weight horizontal helper line (65kg)
                const targetY = mapY(65);

                return (
                  <div className="relative pt-2">
                    <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto overflow-visible">
                      {/* Gridline guidelines */}
                      <line x1={paddingX} y1={mapY(75)} x2={chartW - paddingX} y2={mapY(75)} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                      <line x1={paddingX} y1={mapY(70)} x2={chartW - paddingX} y2={mapY(70)} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />

                      {/* Target line (Dotted Rose) */}
                      <line x1={paddingX} y1={targetY} x2={chartW - paddingX} y2={targetY} stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="4 3" />
                      <text x={chartW - paddingX - 60} y={targetY - 5} fill="#f43f5e" fontSize="7" fontWeight="bold">Target Limit: 65kg</text>

                      {/* Weight progress path line */}
                      <path d={pathD} fill="none" stroke="#2563eb" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

                      {/* Plot Nodes dots */}
                      {weightProgressList.map((item, i) => {
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
                      {weightProgressList.map((item, i) => {
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
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  BMI Calculator Index
                </span>
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">BMI VALUE</span>
                    <span className="text-xl font-black text-white mt-1 block">22.8</span>
                  </div>
                  <span className="px-3 py-1 bg-emerald-500/10 text-emerald-450 border border-emerald-500/20 text-[10px] font-black rounded-lg uppercase tracking-wider">
                    Normal Weight
                  </span>
                </div>
                <p className="text-[10px] text-slate-400 font-medium leading-relaxed mt-2 pt-2 border-t border-zinc-850/60">
                  Your BMI index is within normal health parameters. Keep maintain weight delta split.
                </p>
              </div>

              {/* Goals statistics progress */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  Goal Completion Progress
                </span>
                <div className="flex items-center gap-4 text-xs">
                  {/* Progress Ring */}
                  <div className="relative w-14 h-14 shrink-0 flex items-center justify-center">
                    <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="3.5" />
                      <circle cx="18" cy="18" r="15.915" fill="none" stroke="#06b6d4" strokeWidth="3.5" strokeDasharray="75 100" />
                    </svg>
                    <span className="absolute text-[10px] font-black text-white">75%</span>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-bold">REDUCED WEIGHT</span>
                    <span className="font-extrabold text-white block text-sm mt-0.5">5.0 kg Lost</span>
                    <span className="text-[9px] text-slate-500 block">5.0 kg remaining to target</span>
                  </div>
                </div>
              </div>

              {/* Dimensions logs summary */}
              <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-5 shadow-lg space-y-3.5">
                <span className="text-[9.5px] font-black text-slate-500 uppercase tracking-wider block border-b pb-1.5 border-zinc-850">
                  Athlete Starting Stats
                </span>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Starting Weight</span>
                    <strong className="text-slate-350 block mt-1">75.0 kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Current Weight</span>
                    <strong className="text-slate-350 block mt-1">70.0 kg</strong>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-400 block font-semibold leading-none">Fitness Goal Weight</span>
                    <strong className="text-cyan-400 block mt-1">65.0 kg</strong>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}

        {/* 6. PAYMENTS TAB */}
        {activeTab === "Payments" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Membership Header */}
            <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#141f32] border border-blue-500/25 rounded-3xl p-6 shadow-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <span className="text-[10px] font-black text-cyan-400 bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20 uppercase tracking-wide">
                  Active BEFIT PREMIUM Membership ⭐
                </span>
                <h2 className="text-lg font-black text-white mt-3.5">BeFit Gym Subscription Billed Status</h2>
                <div className="flex gap-4 mt-2 text-xs text-slate-400 font-semibold">
                  <div>Billed Rates: <strong className="text-white">₹3,500 / month</strong></div>
                  <div>Expiration: <strong className="text-white">25 August 2026</strong></div>
                </div>
              </div>
              
              <div className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 shrink-0 text-center">
                <span className="text-[9px] text-slate-450 font-bold block uppercase tracking-wider">Days Remaining</span>
                <span className="text-xl font-black text-cyan-400 block mt-1">28 Days</span>
              </div>
            </div>

            {/* Invoices ledger */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                Payment History Ledgers
              </span>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#1e293b]/35 text-slate-500 font-bold uppercase tracking-wider text-[9px]">
                      <th className="py-2.5 px-4">Invoice ID</th>
                      <th className="py-2.5 px-4">Billed Date</th>
                      <th className="py-2.5 px-4">Billed Plan</th>
                      <th className="py-2.5 px-4">Amount</th>
                      <th className="py-2.5 px-4">Method</th>
                      <th className="py-2.5 px-4 text-right">Receipt</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e293b]/20 text-slate-350">
                    {invoiceList.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-950/20 transition duration-150">
                        <td className="py-3.5 px-4 font-mono font-bold text-white">{item.number}</td>
                        <td className="py-3.5 px-4 text-slate-405 font-medium">{formatDateFriendly(item.date)}</td>
                        <td className="py-3.5 px-4 font-semibold text-slate-300">{item.plan}</td>
                        <td className="py-3.5 px-4 font-black text-white">₹{item.amount.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-4 font-medium text-slate-450">{item.method}</td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => {
                              setSelectedInvoice(item);
                              toast.success("Receipt invoice downloaded.");
                            }}
                            className="p-1.5 bg-[#1b2234] hover:bg-blue-600 hover:text-white text-blue-400 rounded-lg transition cursor-pointer"
                            title="Download invoice summary text"
                          >
                            <Download className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {/* 7. ACHIEVEMENTS TAB */}
        {activeTab === "Achievements" && (
          <div className="space-y-6 text-left animate-in fade-in duration-200">
            
            {/* Gamification title */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl">
              <h2 className="text-lg font-black text-white">Personal Achievements Showcase</h2>
              <p className="text-xs text-slate-400 mt-1">Unlock gamification milestone badges by logging daily training sessions consistent splits.</p>
            </div>

            {/* Badges Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                { icon: "🏆", name: "First Workout", status: true, desc: "Successfully completed your first gym workout splits.", reward: "100 XP" },
                { icon: "🔥", name: "7 Day Streak", status: true, desc: "Completed gym sessions for 7 consecutive days.", reward: "250 XP" },
                { icon: "💪", name: "30 Workouts Completed", status: true, desc: "Logged 30 physical training checkins.", reward: "500 XP" },
                { icon: "🎯", name: "Goal Completed", status: false, desc: "Reached target bodyweight reduction goals.", reward: "1000 XP" },
                { icon: "⭐", name: "Perfect Attendance", status: true, desc: "Maintained 90%+ attendance checklist rate.", reward: "300 XP" }
              ].map((badge, idx) => (
                <div 
                  key={idx} 
                  className={`border rounded-3xl p-5 hover:-translate-y-1 transition duration-200 shadow-lg relative overflow-hidden flex flex-col justify-between h-44 group ${
                    badge.status 
                      ? "bg-gradient-to-br from-[#111827] via-[#0f1524] to-[#121c2d] border-blue-500/25 text-white" 
                      : "bg-[#111827]/40 border-[#1e293b]/35 opacity-25"
                  }`}
                >
                  <div className="space-y-3">
                    <div className="flex justify-between items-start">
                      <span className="text-2xl">{badge.icon}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${
                        badge.status ? "bg-emerald-500/10 text-emerald-400" : "bg-zinc-800 text-slate-500"
                      }`}>
                        {badge.status ? "Unlocked" : "Locked"}
                      </span>
                    </div>
                    <div>
                      <h4 className="font-extrabold text-white text-sm">{badge.name}</h4>
                      <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold max-w-[200px]">{badge.desc}</p>
                    </div>
                  </div>

                  <div className="border-t border-zinc-850/60 pt-3 flex justify-between items-center text-[10px]">
                    <span className="text-slate-500">Reward points</span>
                    <strong className="text-cyan-400">{badge.reward}</strong>
                  </div>
                  
                  {/* Glowing background light */}
                  {badge.status && (
                    <div className="absolute -bottom-8 -right-8 w-18 h-18 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                  )}
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 8. PROFILE TAB */}
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
                  <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Member ID: {client.id}</span>
                  
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
              
              <div className="p-4 bg-[#080B14] rounded-2xl border border-zinc-850 shrink-0 text-center w-full md:w-auto">
                <span className="text-[9px] text-slate-455 font-bold block uppercase tracking-wider">Membership Plan</span>
                <span className="text-xs font-black text-cyan-400 block mt-1">{client.membership || "Premium"}</span>
              </div>
            </div>

            {/* Main Info Columns */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              
              {/* Left Column: Personal Info & Fitness Info */}
              <div className="space-y-6">
                
                {/* Personal Information */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                    Personal Information
                  </span>
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
                      <span className="text-white font-extrabold mt-1 block">{client.gender || "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Age</span>
                      <span className="text-white font-extrabold mt-1 block">{client.age ? `${client.age} years old` : "N/A"}</span>
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

                {/* Fitness Information */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                    Fitness Information
                  </span>
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Height</span>
                      <span className="text-white font-extrabold mt-1 block">{client.height ? `${client.height} cm` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Assigned Trainer</span>
                      <span className="text-white font-extrabold mt-1 block">Rahul Sharma</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Current Weight</span>
                      <span className="text-white font-extrabold mt-1 block">{client.currentWeight ? `${client.currentWeight} kg` : "N/A"}</span>
                    </div>
                    <div>
                      <span className="text-slate-500 font-bold block text-[10px]">Goal Weight</span>
                      <span className="text-cyan-400 font-extrabold mt-1 block">{client.targetWeight ? `${client.targetWeight} kg` : "N/A"}</span>
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Column: Membership Card & Coach Feedback */}
              <div className="space-y-6">
                
                {/* Membership validity (BeFit Premium Card Style) */}
                <div className="bg-gradient-to-br from-[#111827] via-[#0e1422] to-[#121b2d] border border-blue-500/20 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left relative overflow-hidden group">
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-black text-cyan-400 uppercase tracking-widest bg-cyan-400/10 px-2.5 py-1 rounded-full border border-cyan-400/20">
                        BEFIT {client.membership?.toUpperCase() || "PREMIUM"} ⭐
                      </span>
                      <span className="text-xs font-black text-slate-405">{client.status || "Active"}</span>
                    </div>

                    <div className="space-y-3.5 mt-5">
                      <div className="grid grid-cols-2 gap-3.5 text-xs">
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-display">Join Date</span>
                          <span className="font-extrabold text-white mt-1 block">
                            {client.joinDate ? new Date(client.joinDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "N/A"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-display">Expiration Date</span>
                          <span className="font-extrabold text-white mt-1 block">
                            {client.expiryDate ? new Date(client.expiryDate).toLocaleDateString("en-US", { day: "numeric", month: "long", year: "numeric" }) : "August 25, 2026"}
                          </span>
                        </div>
                        <div>
                          <span className="text-[9px] text-slate-500 font-bold block uppercase tracking-wider font-display font-display">Days Remaining</span>
                          <span className="font-extrabold text-cyan-400 mt-1 block">28 Days</span>
                        </div>
                      </div>
                    </div>

                    <div className="border-t border-zinc-850/60 pt-4 mt-2">
                      <span className="text-[9px] text-slate-500 font-black block uppercase tracking-wider mb-2">Plan Privileges</span>
                      <ul className="text-[11px] text-slate-350 font-bold space-y-1.5">
                        <li className="flex items-center gap-1.5 text-slate-205">🏋️ Unlimited Gym access</li>
                        <li className="flex items-center gap-1.5 text-slate-205">🧘 Free group fitness classes</li>
                        <li className="flex items-center gap-1.5 text-slate-205">🚿 Luxury lockers access</li>
                        <li className="flex items-center gap-1.5 text-slate-205">🥤 1 Guest pass per month</li>
                      </ul>
                    </div>
                  </div>
                  
                  {/* Flares background */}
                  <div className="absolute -bottom-8 -right-8 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl group-hover:scale-125 transition-transform" />
                </div>

                {/* Coach Feedback */}
                <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl flex flex-col justify-between text-left font-sans">
                  <div>
                    <div className="flex justify-between items-center mb-4 pb-2 border-b border-[#1e293b]/40">
                      <h3 className="text-xs font-black uppercase text-slate-400 tracking-wider">Coach Feedback</h3>
                      <span className="text-[10px] text-purple-400 font-bold">Latest Review</span>
                    </div>

                    <div className="flex items-center gap-3 mb-4 bg-zinc-950/30 p-3 rounded-2xl border border-zinc-900">
                      <img 
                        src="https://images.unsplash.com/photo-1568602471122-7832951cc4c5?auto=format&fit=crop&q=80&w=100" 
                        alt="Rahul Sharma" 
                        className="w-10 h-10 rounded-xl object-cover border border-[#1e293b]"
                      />
                      <div>
                        <span className="font-extrabold text-white text-xs block">Rahul Sharma</span>
                        <span className="text-[9.5px] text-slate-505 block font-bold mt-0.5">Head Gym Coach • July 31, 2026</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-350 bg-zinc-950/20 border border-zinc-900/60 p-3.5 rounded-2xl italic leading-relaxed">
                      "Great progress this week. Improve your squat depth and stay consistent with your cardio sessions."
                    </p>
                    <p className="text-[10px] text-slate-450 mt-3 font-semibold">
                      <strong>Remarks:</strong> Focus on progressive overload on compound lifts. Keep stretching pre-workout.
                    </p>
                  </div>

                  <button
                    onClick={() => toast.success("Chat channel opened with Trainer Rahul Sharma.")}
                    className="w-full mt-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl text-xs font-black uppercase tracking-wider transition duration-150 cursor-pointer text-center"
                  >
                    Message Trainer
                  </button>
                </div>

              </div>

            </div>

            {/* Account Actions */}
            <div className="bg-[#111827] border border-[#1e293b]/45 rounded-3xl p-6 shadow-xl space-y-4">
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-wider block border-b pb-2.5 border-zinc-850">
                Account Settings
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <button
                  onClick={() => toast.success("Edit Profile drawer coming soon.")}
                  className="px-4 py-3 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 rounded-2xl text-xs font-black text-white transition duration-150 cursor-pointer flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <User className="w-4 h-4 text-blue-400" />
                    <span>Edit Profile</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>

                <button
                  onClick={() => toast.success("Change Password option selected.")}
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
                    <span>Logout</span>
                  </div>
                  <ChevronRight className="w-4 h-4 text-slate-500" />
                </button>
              </div>
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
                  ? "text-blue-400"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              <div className={`p-1 px-3 rounded-2xl flex flex-col items-center transition ${isActive ? "text-blue-400" : ""}`}>
                <Icon className="w-5.5 h-5.5" />
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
