// Default workout splits and diet plans based on fitness goals for BeFit Gym CRM

export const getWorkoutPlanForGoal = (goal) => {
  const normalizedGoal = (goal || "").toLowerCase();
  
  // Standard split structures based on goals
  if (normalizedGoal.includes("muscle") || normalizedGoal.includes("gain") && !normalizedGoal.includes("weight loss")) {
    // Muscle Gain split
    return {
      monday: {
        muscleGroup: "Chest & Triceps",
        restTime: "90 sec",
        duration: "55 min",
        notes: "Target hypertrophy. Keep 2 reps in reserve.",
        exercises: [
          { name: "Flat Barbell Bench Press", category: "Compound", sets: 4, reps: "8-10", weight: "60 kg" },
          { name: "Incline Dumbbell Flyes", category: "Isolation", sets: 3, reps: "10-12", weight: "14 kg each" },
          { name: "Weighted Chest Dips", category: "Compound", sets: 3, reps: "8-12", weight: "Bodyweight" },
          { name: "Overhead Dumbbell Extension", category: "Isolation", sets: 3, reps: "10-12", weight: "16 kg" },
          { name: "Tricep Rope Pushdown", category: "Isolation", sets: 3, reps: "12-15", weight: "22 kg" }
        ]
      },
      tuesday: {
        muscleGroup: "Back & Biceps",
        restTime: "90 sec",
        duration: "60 min",
        notes: "Squeeze shoulder blades on pulls.",
        exercises: [
          { name: "Conventional Deadlifts", category: "Compound", sets: 4, reps: "6-8", weight: "90 kg" },
          { name: "Wide-Grip Lat Pulldowns", category: "Compound", sets: 3, reps: "10-12", weight: "45 kg" },
          { name: "Barbell Rows (Underhand)", category: "Compound", sets: 3, reps: "8-10", weight: "50 kg" },
          { name: "Incline Dumbbell Bicep Curls", category: "Isolation", sets: 3, reps: "10-12", weight: "12 kg each" },
          { name: "Standing Hammer Curls", category: "Isolation", sets: 3, reps: "12", weight: "10 kg each" }
        ]
      },
      wednesday: {
        muscleGroup: "Quads & Calves",
        restTime: "120 sec",
        duration: "50 min",
        notes: "Focus on knee alignment and full depth.",
        exercises: [
          { name: "Barbell Back Squats", category: "Compound", sets: 4, reps: "8-10", weight: "70 kg" },
          { name: "Leg Press (High Stance)", category: "Compound", sets: 3, reps: "10-12", weight: "120 kg" },
          { name: "Dumbbell Goblet Squats", category: "Compound", sets: 3, reps: "12", weight: "24 kg" },
          { name: "Seated Calf Raises", category: "Isolation", sets: 4, reps: "15", weight: "40 kg" }
        ]
      },
      thursday: {
        muscleGroup: "Shoulders & Trap",
        restTime: "90 sec",
        duration: "45 min",
        notes: "Maintain neutral spine posture.",
        exercises: [
          { name: "Overhead Barbell Press", category: "Compound", sets: 4, reps: "8", weight: "40 kg" },
          { name: "Standing Lateral Raises", category: "Isolation", sets: 4, reps: "12-15", weight: "8 kg each" },
          { name: "Dumbbell Shrugs", category: "Isolation", sets: 3, reps: "12", weight: "20 kg each" },
          { name: "Cable Face Pulls", category: "Isolation", sets: 3, reps: "15", weight: "18 kg" }
        ]
      },
      friday: {
        muscleGroup: "Hamstrings & Arms",
        restTime: "75 sec",
        duration: "50 min",
        notes: "Squeeze biceps at peak contraction.",
        exercises: [
          { name: "Romanian Deadlifts (RDLs)", category: "Compound", sets: 4, reps: "10", weight: "60 kg" },
          { name: "Lying Leg Curls", category: "Isolation", sets: 3, reps: "12", weight: "30 kg" },
          { name: "Preacher Bench Barbell Curls", category: "Isolation", sets: 3, reps: "10", weight: "25 kg" },
          { name: "Lying EZ-Bar Skull Crushers", category: "Isolation", sets: 3, reps: "10", weight: "22 kg" }
        ]
      },
      saturday: {
        muscleGroup: "Core & Abs",
        restTime: "60 sec",
        duration: "40 min",
        notes: "Strict form, focus on breathing.",
        exercises: [
          { name: "Hanging Leg Raises", category: "Core", sets: 3, reps: "15", weight: "Bodyweight" },
          { name: "Cable Russian Twists", category: "Core", sets: 3, reps: "15", weight: "14 kg" },
          { name: "Weighted Ab Crunches", category: "Core", sets: 3, reps: "20", weight: "10 kg" },
          { name: "Plank Hold", category: "Core", sets: 3, reps: "60 sec", weight: "Bodyweight" }
        ]
      },
      sunday: { muscleGroup: "Rest Day", restTime: "N/A", duration: "N/A", notes: "Dedicated Muscle Recovery. Get 8+ hours of sleep.", exercises: [] }
    };
  } else if (normalizedGoal.includes("loss") || normalizedGoal.includes("fat") || normalizedGoal.includes("weight loss")) {
    // Weight Loss & Fat Loss split
    return {
      monday: {
        muscleGroup: "Full Body Circuit",
        restTime: "45 sec",
        duration: "50 min",
        notes: "Metabolic conditioning. High heart rate.",
        exercises: [
          { name: "Dumbbell Thrusters", category: "Compound", sets: 4, reps: "15", weight: "10 kg each" },
          { name: "Bodyweight Pushups", category: "Compound", sets: 3, reps: "15", weight: "Bodyweight" },
          { name: "Kettlebell Swings", category: "Compound", sets: 3, reps: "20", weight: "16 kg" },
          { name: "Mountain Climbers", category: "Cardio", sets: 3, reps: "30 sec", weight: "Bodyweight" },
          { name: "Plank Jack to Jump", category: "Cardio", sets: 3, reps: "12", weight: "Bodyweight" }
        ]
      },
      tuesday: {
        muscleGroup: "HIIT & Cardio",
        restTime: "30 sec",
        duration: "45 min",
        notes: "Maximum calorie output.",
        exercises: [
          { name: "Burpees", category: "Cardio", sets: 4, reps: "12", weight: "Bodyweight" },
          { name: "Jump Squats", category: "Cardio", sets: 3, reps: "15", weight: "Bodyweight" },
          { name: "Rowing Machine", category: "Cardio", sets: 1, reps: "15 min", weight: "Level 8" },
          { name: "Bicycle Crunches", category: "Core", sets: 3, reps: "20", weight: "Bodyweight" },
          { name: "Hanging Knee Raises", category: "Core", sets: 3, reps: "15", weight: "Bodyweight" }
        ]
      },
      wednesday: {
        muscleGroup: "Legs & Glutes Focus",
        restTime: "60 sec",
        duration: "50 min",
        notes: "Targeting large muscle groups for caloric burn.",
        exercises: [
          { name: "Goblet Squats", category: "Compound", sets: 4, reps: "15", weight: "16 kg" },
          { name: "Walking Lunges", category: "Compound", sets: 3, reps: "24 steps", weight: "8 kg each" },
          { name: "Hip Thrusts", category: "Compound", sets: 3, reps: "15", weight: "40 kg" },
          { name: "Hamstring Curls", category: "Isolation", sets: 3, reps: "15", weight: "25 kg" }
        ]
      },
      thursday: {
        muscleGroup: "Upper Body Endurance",
        restTime: "60 sec",
        duration: "45 min",
        notes: "High reps, minimal rest.",
        exercises: [
          { name: "Dumbbell Shoulder Press", category: "Compound", sets: 3, reps: "15", weight: "8 kg each" },
          { name: "Lat Pulldown (Wide Grip)", category: "Compound", sets: 3, reps: "15", weight: "35 kg" },
          { name: "Incline Dumbbell Press", category: "Compound", sets: 3, reps: "15", weight: "12 kg each" },
          { name: "Seated Cable Rows", category: "Compound", sets: 3, reps: "15", weight: "30 kg" }
        ]
      },
      friday: {
        muscleGroup: "Core & Metabolic Conditioning",
        restTime: "45 sec",
        duration: "40 min",
        notes: "Focus on midsection compression.",
        exercises: [
          { name: "Russian Twists", category: "Core", sets: 3, reps: "20 each side", weight: "6 kg" },
          { name: "Flutter Kicks", category: "Core", sets: 3, reps: "40 sec", weight: "Bodyweight" },
          { name: "Assault Bike Sprint", category: "Cardio", sets: 5, reps: "30 sec sprint", weight: "N/A" },
          { name: "Medicine Ball Slams", category: "Cardio", sets: 3, reps: "15", weight: "8 kg" }
        ]
      },
      saturday: {
        muscleGroup: "Steady State Cardio",
        restTime: "N/A",
        duration: "45 min",
        notes: "Keep heart rate between 130-145 BPM.",
        exercises: [
          { name: "Incline Treadmill Walk", category: "Cardio", sets: 1, reps: "30 min", weight: "Incline 8 / Speed 5.5" },
          { name: "Stairmaster", category: "Cardio", sets: 1, reps: "15 min", weight: "Level 6" }
        ]
      },
      sunday: { muscleGroup: "Rest Day", restTime: "N/A", duration: "N/A", notes: "Calorie Recovery. Hydrate and do active stretching.", exercises: [] }
    };
  } else if (normalizedGoal.includes("strength") || normalizedGoal.includes("power")) {
    // Strength Training split
    return {
      monday: {
        muscleGroup: "Power Squats",
        restTime: "180 sec",
        duration: "65 min",
        notes: "Heavy load focus. Take full rest.",
        exercises: [
          { name: "Barbell Back Squats", category: "Compound", sets: 5, reps: "5", weight: "100 kg" },
          { name: "Leg Press (Heavy)", category: "Compound", sets: 3, reps: "6-8", weight: "200 kg" },
          { name: "Romanian Deadlifts", category: "Compound", sets: 3, reps: "8", weight: "75 kg" },
          { name: "Plank Crunches", category: "Core", sets: 3, reps: "15", weight: "Bodyweight" }
        ]
      },
      tuesday: {
        muscleGroup: "Power Bench Press",
        restTime: "180 sec",
        duration: "60 min",
        notes: "Keep shoulders packed back.",
        exercises: [
          { name: "Flat Barbell Bench Press", category: "Compound", sets: 5, reps: "5", weight: "80 kg" },
          { name: "Close Grip Bench Press", category: "Compound", sets: 3, reps: "8", weight: "60 kg" },
          { name: "Weighted Chest Dips", category: "Compound", sets: 3, reps: "8", weight: "+15 kg" },
          { name: "Tricep Overhead Press", category: "Isolation", sets: 3, reps: "10", weight: "20 kg" }
        ]
      },
      wednesday: {
        muscleGroup: "Active Mobility & Rest",
        restTime: "60 sec",
        duration: "30 min",
        notes: "Focus on joint decompression and dynamic stretching.",
        exercises: [
          { name: "Dead Hangs", category: "Stretching", sets: 3, reps: "45 sec", weight: "Bodyweight" },
          { name: "Hip Mobility Drills", category: "Stretching", sets: 1, reps: "15 min", weight: "N/A" }
        ]
      },
      thursday: {
        muscleGroup: "Power Deadlift",
        restTime: "180 sec",
        duration: "70 min",
        notes: "Strict back alignment, explode upward.",
        exercises: [
          { name: "Barbell Deadlifts", category: "Compound", sets: 5, reps: "3", weight: "130 kg" },
          { name: "Weighted Pull-Ups", category: "Compound", sets: 4, reps: "6", weight: "+10 kg" },
          { name: "Barbell Pendlay Rows", category: "Compound", sets: 3, reps: "6", weight: "70 kg" },
          { name: "Heavy Shrugs", category: "Isolation", sets: 3, reps: "8", weight: "30 kg each" }
        ]
      },
      friday: {
        muscleGroup: "Overhead Strength",
        restTime: "150 sec",
        duration: "55 min",
        notes: "Brace core tightly.",
        exercises: [
          { name: "Standing Overhead Press", category: "Compound", sets: 5, reps: "5", weight: "50 kg" },
          { name: "Incline Dumbbell Chest Press", category: "Compound", sets: 3, reps: "8", weight: "24 kg each" },
          { name: "Dumbbell Lateral Raises", category: "Isolation", sets: 3, reps: "10", weight: "12 kg each" },
          { name: "Rear Delt Facepulls", category: "Isolation", sets: 3, reps: "12", weight: "23 kg" }
        ]
      },
      saturday: {
        muscleGroup: "Posterior Chain Accessories",
        restTime: "90 sec",
        duration: "50 min",
        notes: "Build structural strength.",
        exercises: [
          { name: "Barbell Good Mornings", category: "Compound", sets: 3, reps: "8", weight: "40 kg" },
          { name: "Barbell Hip Thrusts", category: "Compound", sets: 3, reps: "8", weight: "100 kg" },
          { name: "Heavy Farmer's Walks", category: "Core", sets: 3, reps: "50 meters", weight: "32 kg each" }
        ]
      },
      sunday: { muscleGroup: "Rest Day", restTime: "N/A", duration: "N/A", notes: "Heavy CNS recovery. Foam roll and hydrate.", exercises: [] }
    };
  } else {
    // General Fitness & Weight Gain default split
    return {
      monday: {
        muscleGroup: "Upper Body Balance",
        restTime: "75 sec",
        duration: "45 min",
        notes: "Functional posture split.",
        exercises: [
          { name: "Dumbbell Bench Press", category: "Compound", sets: 3, reps: "12", weight: "16 kg each" },
          { name: "Lat Pulldown (Medium)", category: "Compound", sets: 3, reps: "12", weight: "40 kg" },
          { name: "Dumbbell Arnold Press", category: "Compound", sets: 3, reps: "10", weight: "12 kg each" },
          { name: "Cable Bicep Curls", category: "Isolation", sets: 3, reps: "12", weight: "18 kg" }
        ]
      },
      tuesday: {
        muscleGroup: "Lower Body Conditioning",
        restTime: "75 sec",
        duration: "45 min",
        notes: "Focus on basic mechanics.",
        exercises: [
          { name: "Dumbbell Goblet Squats", category: "Compound", sets: 3, reps: "12", weight: "18 kg" },
          { name: "Romanian Deadlifts", category: "Compound", sets: 3, reps: "10", weight: "50 kg" },
          { name: "Lying Leg Curls", category: "Isolation", sets: 3, reps: "12", weight: "22 kg" },
          { name: "Calf Raises (Leg Press)", category: "Isolation", sets: 3, reps: "15", weight: "80 kg" }
        ]
      },
      wednesday: {
        muscleGroup: "Core & Cardiovascular Focus",
        restTime: "60 sec",
        duration: "40 min",
        notes: "Conditioning and breath work.",
        exercises: [
          { name: "Treadmill Run", category: "Cardio", sets: 1, reps: "20 min", weight: "Moderate pace" },
          { name: "Ab Crunches", category: "Core", sets: 3, reps: "15", weight: "Bodyweight" },
          { name: "Plank Hold", category: "Core", sets: 3, reps: "60 sec", weight: "Bodyweight" }
        ]
      },
      thursday: {
        muscleGroup: "Push / Pull Core",
        restTime: "75 sec",
        duration: "45 min",
        notes: "Upper body structural conditioning.",
        exercises: [
          { name: "Incline Dumbbell Press", category: "Compound", sets: 3, reps: "12", weight: "14 kg each" },
          { name: "Seated Cable Rows", category: "Compound", sets: 3, reps: "12", weight: "30 kg" },
          { name: "Dumbbell Tricep Kickbacks", category: "Isolation", sets: 3, reps: "12", weight: "8 kg each" },
          { name: "Hammer Curls", category: "Isolation", sets: 3, reps: "12", weight: "10 kg each" }
        ]
      },
      friday: {
        muscleGroup: "Legs & Core",
        restTime: "90 sec",
        duration: "45 min",
        notes: "Focus on balance.",
        exercises: [
          { name: "Walking Lunges", category: "Compound", sets: 3, reps: "20 steps", weight: "Bodyweight" },
          { name: "Leg Extensions", category: "Isolation", sets: 3, reps: "12", weight: "25 kg" },
          { name: "Glute Bridges", category: "Core", sets: 3, reps: "15", weight: "Bodyweight" },
          { name: "Russian Twists", category: "Core", sets: 3, reps: "20 total", weight: "6 kg" }
        ]
      },
      saturday: {
        muscleGroup: "Active Recreation",
        restTime: "N/A",
        duration: "30 min",
        notes: "Stretching and foam rolling session.",
        exercises: [
          { name: "Elliptical Machine", category: "Cardio", sets: 1, reps: "20 min", weight: "Moderate resistance" },
          { name: "Hamstring Stretch", category: "Stretching", sets: 2, reps: "30 sec", weight: "N/A" }
        ]
      },
      sunday: { muscleGroup: "Rest Day", restTime: "N/A", duration: "N/A", notes: "Weekly rest and recovery day.", exercises: [] }
    };
  }
};

export const getDietPlanForGoal = (goal) => {
  const normalizedGoal = (goal || "").toLowerCase();

  // Helper template structure based on goals
  if (normalizedGoal.includes("loss") || normalizedGoal.includes("fat") || normalizedGoal.includes("weight loss")) {
    // Weight Loss / Fat Loss Plan (High protein, low calories, high hydration)
    const activeDayDiet = {
      earlyMorning: { meal: "Warm lemon water + 1 tbsp Chia Seeds", quantity: "1 glass", calories: 30, protein: 1, carbs: 5, fat: 1, notes: "Kickstart metabolism." },
      breakfast: { meal: "Egg White Omelet (4 whites) with Spinach & Mushroom + Green Tea", quantity: "1 serving", calories: 180, protein: 20, carbs: 6, fat: 2, notes: "High protein start." },
      midMorning: { meal: "Sliced Cucumber & Celery with Hummus", quantity: "100g", calories: 95, protein: 3, carbs: 12, fat: 4, notes: "Hydrating high-fiber snack." },
      lunch: { meal: "Grilled Chicken Breast (150g) + Steamed Broccoli + Light Green Salad", quantity: "1 bowl", calories: 340, protein: 38, carbs: 10, fat: 6, notes: "Strictly low-carb." },
      eveningSnack: { meal: "Roasted Bengal Gram (Chana) + Warm Water", quantity: "30g", calories: 110, protein: 6, carbs: 18, fat: 2, notes: "High fiber, keeps full." },
      preWorkout: { meal: "Black Coffee (sugar-free) + 3-4 Strawberries", quantity: "1 serving", calories: 25, protein: 0, carbs: 6, fat: 0, notes: "No sugars, high antioxidants." },
      postWorkout: { meal: "Whey Protein Isolate in water", quantity: "1 scoop", calories: 110, protein: 25, carbs: 1, fat: 0, notes: "Fast absorbing proteins." },
      dinner: { meal: "Pan-Seared Salmon (140g) or Steamed Tofu (150g) + Asparagus & Garlic", quantity: "1 plate", calories: 260, protein: 28, carbs: 8, fat: 12, notes: "Omega-3 and high protein." },
      beforeBed: { meal: "Chamomile Herbal Tea (organic)", quantity: "1 cup", calories: 0, protein: 0, carbs: 0, fat: 0, notes: "Relax and improve sleep." }
    };
    
    return {
      monday: { ...activeDayDiet, waterGoal: 3.5 },
      tuesday: { ...activeDayDiet, waterGoal: 3.5 },
      wednesday: { ...activeDayDiet, waterGoal: 3.5 },
      thursday: { ...activeDayDiet, waterGoal: 3.5 },
      friday: { ...activeDayDiet, waterGoal: 3.5 },
      saturday: { ...activeDayDiet, waterGoal: 3.5 },
      sunday: {
        earlyMorning: { meal: "Warm Mint Water", quantity: "1 glass", calories: 5, protein: 0, carbs: 1, fat: 0, notes: "Detox hydration." },
        breakfast: { meal: "Oatmeal with Almond Milk & Blueberries", quantity: "1 bowl", calories: 220, protein: 8, carbs: 38, fat: 4, notes: "Digestive recovery." },
        midMorning: { meal: "Green Tea + 5 Almonds", quantity: "1 serving", calories: 40, protein: 1, carbs: 2, fat: 3, notes: "Antioxidant boost." },
        lunch: { meal: "Quinoa Salad with Bell Peppers, Onions, and Lime dressing", quantity: "1 plate", calories: 280, protein: 9, carbs: 46, fat: 5, notes: "Light and alkaline." },
        eveningSnack: { meal: "Sliced Apple with Cinnamon", quantity: "1 apple", calories: 95, protein: 0, carbs: 22, fat: 0, notes: "Natural sweet fix." },
        preWorkout: { meal: "Detox Green Juice (Celery, Spinach, Ginger)", quantity: "1 glass", calories: 45, protein: 1, carbs: 10, fat: 0, notes: "Mineral loading." },
        postWorkout: { meal: "Hydration Electrolyte Coconut Water", quantity: "250ml", calories: 45, protein: 0, carbs: 11, fat: 0, notes: "Rebalance potassium." },
        dinner: { meal: "Clear Lentil Soup (Moong Dal) + Steamed Zucchini", quantity: "1 bowl", calories: 180, protein: 12, carbs: 24, fat: 1, notes: "Easy on the gut." },
        beforeBed: { meal: "Warm water with Lemon and Ginger", quantity: "1 cup", calories: 8, protein: 0, carbs: 2, fat: 0, notes: "Calms stomach." },
        waterGoal: 4.0
      }
    };
  } else if (normalizedGoal.includes("gain") && !normalizedGoal.includes("weight loss")) {
    // Weight Gain Plan (High calorie, high protein, complex carbs, healthy fats)
    const activeDayDiet = {
      earlyMorning: { meal: "Soaked Almonds (10) + Walnuts (4) + 1 glass Whole Milk", quantity: "1 serving", calories: 280, protein: 12, carbs: 16, fat: 18, notes: "Healthy fats to start." },
      breakfast: { meal: "Peanut Butter Oatmeal with 1 sliced Banana & Honey + 3 Scrambled Eggs", quantity: "1 serving", calories: 650, protein: 32, carbs: 70, fat: 26, notes: "Massive calorie breakfast." },
      midMorning: { meal: "Avocado Toast on Whole Wheat Sourdough (2 slices)", quantity: "2 slices", calories: 380, protein: 8, carbs: 42, fat: 20, notes: "Healthy calorie dense fats." },
      lunch: { meal: "Basmati Rice (2 cups) + Grilled Salmon (150g) + Cooked Lentils (Dal)", quantity: "1 bowl", calories: 680, protein: 44, carbs: 85, fat: 16, notes: "High complex carbohydrates." },
      eveningSnack: { meal: "Mixed Nuts & Dry Fruits (Raisins, Cashews, Dates)", quantity: "50g", calories: 240, protein: 5, carbs: 32, fat: 12, notes: "Quick energy boost." },
      preWorkout: { meal: "Sweet Potato (200g) with Cinnamon + Black Coffee", quantity: "1 bowl", calories: 210, protein: 3, carbs: 46, fat: 0, notes: "Sustained carbohydrate release." },
      postWorkout: { meal: "Whey Protein Shake + 1 High Calorie Banana & Oat Smoothie", quantity: "1 serving", calories: 450, protein: 35, carbs: 62, fat: 8, notes: "Fast replenishment." },
      dinner: { meal: "Grilled Beef Tenderloin (180g) or Extra Firm Paneer Tikka (200g) + Mash Potatoes", quantity: "1 plate", calories: 590, protein: 42, carbs: 55, fat: 22, notes: "Sufficient protein for growth." },
      beforeBed: { meal: "Casein Protein Shake or Warm Milk with Turmeric & Almonds", quantity: "1 mug", calories: 200, protein: 18, carbs: 12, fat: 8, notes: "Slow release muscle repair." }
    };

    return {
      monday: { ...activeDayDiet, waterGoal: 3.5 },
      tuesday: { ...activeDayDiet, waterGoal: 3.5 },
      wednesday: { ...activeDayDiet, waterGoal: 3.5 },
      thursday: { ...activeDayDiet, waterGoal: 3.5 },
      friday: { ...activeDayDiet, waterGoal: 3.5 },
      saturday: { ...activeDayDiet, waterGoal: 3.5 },
      sunday: {
        earlyMorning: { meal: "Warm Milk with Dates", quantity: "1 cup", calories: 180, protein: 6, carbs: 32, fat: 4, notes: "Sustained energy." },
        breakfast: { meal: "Pancakes with Maple Syrup & Mixed Berries", quantity: "2 pancakes", calories: 340, protein: 6, carbs: 64, fat: 6, notes: "Sunday treat." },
        midMorning: { meal: "Chia Seed Pudding with Mango Puree", quantity: "1 cup", calories: 210, protein: 4, carbs: 30, fat: 8, notes: "Fibre and minerals." },
        lunch: { meal: "Mixed Vegetable Pulao with Raita + Roasted Paneer Tikka", quantity: "1 plate", calories: 520, protein: 24, carbs: 70, fat: 15, notes: "Balanced recovery lunch." },
        eveningSnack: { meal: "Banana Milkshake", quantity: "250ml", calories: 290, protein: 8, carbs: 45, fat: 8, notes: "Hydration and carbs." },
        preWorkout: { meal: "Sliced Apple + Peanut Butter", quantity: "1 serving", calories: 200, protein: 5, carbs: 20, fat: 12, notes: "Fats and carbs." },
        postWorkout: { meal: "Coconut Water + 1 Energy Bar", quantity: "1 pack", calories: 230, protein: 6, carbs: 35, fat: 6, notes: "Refuel electrolytes." },
        dinner: { meal: "Baked Tofu or Grilled Chicken + Steamed Rice & Veggies", quantity: "1 plate", calories: 410, protein: 32, carbs: 50, fat: 8, notes: "Easy digestion growth." },
        beforeBed: { meal: "Warm Turmeric Milk", quantity: "1 glass", calories: 130, protein: 5, carbs: 12, fat: 6, notes: "Anti-inflammatory." },
        waterGoal: 4.0
      }
    };
  } else if (normalizedGoal.includes("muscle") || normalizedGoal.includes("hypertrophy")) {
    // Muscle Gain Plan (High protein, balanced carbs, healthy fats, recovery nutrients)
    const activeDayDiet = {
      earlyMorning: { meal: "5 Egg Whites (boiled) + 1 Whole Egg", quantity: "6 eggs", calories: 150, protein: 26, carbs: 1, fat: 5, notes: "Pure morning protein load." },
      breakfast: { meal: "Oats with Whey Protein, Flax Seeds & Strawberry slices", quantity: "1 bowl", calories: 440, protein: 35, carbs: 50, fat: 10, notes: "Perfect muscle fueling." },
      midMorning: { meal: "Greek Yogurt (200g) with Blueberries and Walnuts", quantity: "1 cup", calories: 220, protein: 18, carbs: 14, fat: 8, notes: "Slow digestion casein base." },
      lunch: { meal: "Lean Chicken Breast (180g) + Brown Rice + Mixed Veggies", quantity: "1 serving", calories: 490, protein: 46, carbs: 48, fat: 7, notes: "Clean lunch builders." },
      eveningSnack: { meal: "Canned Tuna (150g) or Roasted Tofu (150g) in Salad", quantity: "1 plate", calories: 210, protein: 28, carbs: 4, fat: 8, notes: "Lean and high amino." },
      preWorkout: { meal: "Oatmeal (50g) + 1 tbsp Almond Butter + Black Coffee", quantity: "1 cup", calories: 260, protein: 7, carbs: 32, fat: 11, notes: "Solid fuel blocks." },
      postWorkout: { meal: "Whey Protein Shake + Dextrose/Creatine in Water + 1 Banana", quantity: "1 serving", calories: 250, protein: 27, carbs: 32, fat: 1, notes: "Insulin spike for protein synthesis." },
      dinner: { meal: "Grilled Turkey Breast (160g) or Paneer Steak (150g) + Baked Potato + Spinach", quantity: "1 plate", calories: 380, protein: 36, carbs: 38, fat: 8, notes: "No heavy fats before sleep." },
      beforeBed: { meal: "Micellar Casein Protein Shake or Low Fat Cottage Cheese", quantity: "1 serving", calories: 160, protein: 24, carbs: 3, fat: 2, notes: "8-hour nitrogen retention." }
    };

    return {
      monday: { ...activeDayDiet, waterGoal: 3.5 },
      tuesday: { ...activeDayDiet, waterGoal: 3.5 },
      wednesday: { ...activeDayDiet, waterGoal: 3.5 },
      thursday: { ...activeDayDiet, waterGoal: 3.5 },
      friday: { ...activeDayDiet, waterGoal: 3.5 },
      saturday: { ...activeDayDiet, waterGoal: 3.5 },
      sunday: {
        earlyMorning: { meal: "Wheatgrass juice + 5 Soaked Almonds", quantity: "1 serving", calories: 60, protein: 2, carbs: 4, fat: 4, notes: "Alkalize body." },
        breakfast: { meal: "Whole wheat French Toast (2 slices) with Honey & Cinnamon", quantity: "2 slices", calories: 290, protein: 10, carbs: 50, fat: 5, notes: "Easy carbs." },
        midMorning: { meal: "Fresh Watermelon Slices", quantity: "200g", calories: 60, protein: 1, carbs: 14, fat: 0, notes: "L-citrulline loading for pump." },
        lunch: { meal: "Brown Lentil (Khichdi) with Ghee + Paneer Bhurji", quantity: "1 plate", calories: 430, protein: 22, carbs: 55, fat: 12, notes: "Nutrient-dense digestion." },
        eveningSnack: { meal: "Roasted Pumpkin Seeds + Green Tea", quantity: "30g", calories: 160, protein: 9, carbs: 4, fat: 12, notes: "Magnesium rich recovery." },
        preWorkout: { meal: "Beetroot & Ginger Detox juice", quantity: "1 glass", calories: 50, protein: 1, carbs: 11, fat: 0, notes: "Nitric oxide booster." },
        postWorkout: { meal: "BCAA Hydration Fluid", quantity: "500ml", calories: 10, protein: 5, carbs: 0, fat: 0, notes: "Direct muscle uptake." },
        dinner: { meal: "Lentil Soup (Dal) + Rice + Sautéed Broccolini", quantity: "1 bowl", calories: 310, protein: 15, carbs: 52, fat: 3, notes: "Gentle recovery protein." },
        beforeBed: { meal: "Chamomile Tea with Honey", quantity: "1 cup", calories: 30, protein: 0, carbs: 8, fat: 0, notes: "Sleep hormone support." },
        waterGoal: 4.0
      }
    };
  } else {
    // General Fitness / Strength Training Default Plan
    const activeDayDiet = {
      earlyMorning: { meal: "Lemon Water + Handful of Almonds", quantity: "1 glass", calories: 90, protein: 3, carbs: 4, fat: 7, notes: "Basic hydration." },
      breakfast: { meal: "Scrambled Eggs (3 eggs) + Whole Wheat Toast (2) + Orange Juice", quantity: "1 plate", calories: 450, protein: 22, carbs: 48, fat: 16, notes: "Balanced breakfast." },
      midMorning: { meal: "Mixed Fruit Bowl (Apple, Banana, Orange)", quantity: "1 bowl", calories: 180, protein: 2, carbs: 42, fat: 1, notes: "Natural vitamins." },
      lunch: { meal: "Grilled Tofu (150g) or Chicken (150g) + Brown Rice + Salad", quantity: "1 bowl", calories: 420, protein: 36, carbs: 45, fat: 8, notes: "Balanced macronutrients." },
      eveningSnack: { meal: "Green Tea + High Fiber Digestive Biscuits", quantity: "2 pieces", calories: 120, protein: 2, carbs: 20, fat: 4, notes: "Light tea time." },
      preWorkout: { meal: "Oatmeal with Honey", quantity: "1 cup", calories: 200, protein: 6, carbs: 40, fat: 2, notes: "Pre-training fuel." },
      postWorkout: { meal: "Whey Protein shake", quantity: "1 scoop", calories: 120, protein: 25, carbs: 2, fat: 1, notes: "Protein uptake." },
      dinner: { meal: "Sautéed Vegetables with Cottage Cheese (150g) or Fish (150g)", quantity: "1 plate", calories: 320, protein: 26, carbs: 12, fat: 14, notes: "Protein and fiber." },
      beforeBed: { meal: "Warm Milk", quantity: "1 glass", calories: 120, protein: 8, carbs: 11, fat: 5, notes: "Promotes deep sleep." }
    };

    return {
      monday: { ...activeDayDiet, waterGoal: 3.0 },
      tuesday: { ...activeDayDiet, waterGoal: 3.0 },
      wednesday: { ...activeDayDiet, waterGoal: 3.0 },
      thursday: { ...activeDayDiet, waterGoal: 3.0 },
      friday: { ...activeDayDiet, waterGoal: 3.0 },
      saturday: { ...activeDayDiet, waterGoal: 3.0 },
      sunday: {
        earlyMorning: { meal: "Warm Honey & Lemon water", quantity: "1 glass", calories: 30, protein: 0, carbs: 8, fat: 0, notes: "Morning hydration." },
        breakfast: { meal: "Oats with chia seeds and strawberry slices", quantity: "1 bowl", calories: 250, protein: 8, carbs: 45, fat: 4, notes: "Healthy fiber." },
        midMorning: { meal: "Buttermilk (Chaas)", quantity: "1 glass", calories: 60, protein: 3, carbs: 6, fat: 2, notes: "Digestive cooling." },
        lunch: { meal: "Khichdi + Salad + Roasted Papad", quantity: "1 plate", calories: 350, protein: 12, carbs: 60, fat: 5, notes: "Alkalizing lunch." },
        eveningSnack: { meal: "Green Tea + Handful of Walnut halves", quantity: "1 serving", calories: 120, protein: 2, carbs: 3, fat: 11, notes: "Healthy brain fats." },
        preWorkout: { meal: "Detox Mint Cooler juice", quantity: "1 glass", calories: 40, protein: 0, carbs: 9, fat: 0, notes: "Light minerals." },
        postWorkout: { meal: "Coconut Water", quantity: "1 glass", calories: 45, protein: 0, carbs: 11, fat: 0, notes: "Rehydrate." },
        dinner: { meal: "Lentil Soup with dry wheat chapati (1) + cooked greens", quantity: "1 serving", calories: 260, protein: 14, carbs: 42, fat: 3, notes: "Simple and light dinner." },
        beforeBed: { meal: "Chamomile tea", quantity: "1 cup", calories: 0, protein: 0, carbs: 0, fat: 0, notes: "Restful sleep." },
        waterGoal: 3.5
      }
    };
  }
};
