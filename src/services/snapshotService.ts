import { db } from '../db/database';
import { useUserStore } from '../store/useUserStore';
import { User, Realm } from '../../types';

export const generateUserStateSnapshot = async (user: User) => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    
    // Calculate dates for the last 7 days
    const last7Days: string[] = [];
    for (let i = 1; i <= 7; i++) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        last7Days.push(d.toISOString().split('T')[0]);
    }
    const yesterdayStr = last7Days[0];

    // Fetch logs
    const [
        nutritionLogs,
        activityLogs,
        recoveryLogs,
        habitLogs,
        waterLogs,
        checkIns
    ] = await Promise.all([
        db.nutritionLogs.where('date').between(last7Days[6], todayStr, true, false).toArray(),
        db.activityLogs.where('date').between(last7Days[6], todayStr, true, false).toArray(),
        db.recoveryLogs.where('date').between(last7Days[6], todayStr, true, false).toArray(),
        db.habitLogs.where('date').between(last7Days[6], todayStr, true, false).toArray(),
        db.waterLogs.where('date').between(last7Days[6], todayStr, true, false).toArray(),
        db.checkInLogs.toArray()
    ]);

    // Aggregate Yesterday's Logs
    const yesterdayNutrition = nutritionLogs.filter(l => l.date === yesterdayStr);
    const yesterdayActivity = activityLogs.filter(l => l.date === yesterdayStr);
    const yesterdayRecovery = recoveryLogs.find(l => l.date === yesterdayStr);
    const yesterdayHabits = habitLogs.filter(l => l.date === yesterdayStr);
    const yesterdayWater = waterLogs.filter(l => l.date === yesterdayStr);

    // Trend Analysis (Last 7 Days)
    const dailyStats = last7Days.map(date => {
        const dayNutrition = nutritionLogs.filter(l => l.date === date);
        const daySteps = activityLogs.filter(l => l.date === date && l.skillId === 'endurance');
        return {
            date,
            calories: dayNutrition.reduce((acc, l) => acc + (l.calories || 0), 0),
            steps: daySteps.reduce((acc, l) => acc + (l.reps || 0), 0), // Assuming reps stores steps for endurance
            weight: user.bodyMetrics.currentWeight // Simplification: use current weight for all if not tracked daily
        };
    }).reverse();

    return {
        request_type: "DAILY_GENESIS",
        timestamp_utc: now.toISOString(),
        local_time: now.toLocaleTimeString(),
        local_date: todayStr,
        day_of_week: now.toLocaleDateString('en-US', { weekday: 'long' }),
        days_since_first_onboarding: 0, // Placeholder
        user_profile: {
            gender: user.bodyMetrics.gender.toLowerCase(),
            age: user.bodyMetrics.age,
            height_cm: user.bodyMetrics.height,
            current_weight_kg: user.bodyMetrics.currentWeight,
            target_weight_kg: user.bodyMetrics.targetWeight,
            body_fat_percent_estimate: 20, // Placeholder
            training_experience: user.bodyMetrics.experienceLevel.toLowerCase(),
            physical_attributes: {
                stamina: user.bodyMetrics.stamina,
                flexibility: user.bodyMetrics.flexibility,
                power: user.bodyMetrics.strengthLevel
            },
            benchmarks: {
                max_pushups: user.bodyMetrics.pushupsMax,
                max_pullups: user.bodyMetrics.pullupsMax,
                running_efficiency: user.bodyMetrics.runningAbility.toLowerCase(),
                global_power_level: user.level_overall
            }
        },
        current_state: {
            injuries: user.bodyMetrics.injuries,
            pain_points: [],
            sleep_schedule: user.bodyMetrics.sleepSchedule,
            average_stress_level: user.bodyMetrics.stressLevel,
            gym_access: user.bodyMetrics.gymAccess,
            home_equipment: user.bodyMetrics.equipment,
            typical_daily_schedule: user.bodyMetrics.dailySchedule,
            food_preferences: user.bodyMetrics.foodPreferences,
            food_dislikes: user.bodyMetrics.foodDislikes || [],
            allergies: user.bodyMetrics.allergies,
            coach_personality: user.personality.toLowerCase()
        },
        yesterday_logs: {
            calories_consumed: yesterdayNutrition.reduce((acc, l) => acc + (l.calories || 0), 0),
            protein_consumed_g: yesterdayNutrition.reduce((acc, l) => acc + (l.protein || 0), 0),
            water_ml: yesterdayWater.reduce((acc, l) => acc + (l.amount_ml || 0), 0),
            steps: user.currentSteps || 0, // Yesterday's steps should be captured at midnight
            workouts_completed: yesterdayActivity.map(a => ({
                type: a.skillId,
                duration_min: a.duration_min || 0,
                intensity: "medium"
            })),
            sleep_hours: yesterdayRecovery?.sleepHours || 0,
            sleep_quality: yesterdayRecovery?.sleepQuality || 0,
            soreness_level: yesterdayRecovery?.soreness || 0,
            fatigue_level: yesterdayRecovery?.fatigue || 0,
            mood_scores: {}, // Placeholder
            habits_completed: yesterdayHabits.map(h => h.habitId),
            habits_missed: [],
            supplements_taken: [],
            additional_notes: ""
        },
        historical_7_day_trend: {
            avg_calories: dailyStats.map(s => s.calories),
            avg_steps: dailyStats.map(s => s.steps),
            weight_kg: dailyStats.map(s => s.weight)
        },
        weekly_check_in_data: checkIns.length > 0 ? checkIns[checkIns.length - 1] : null,
        lab_results: {},
        territory: {
            current_xp: user.xp_total,
            territory_level: Math.floor(user.level_overall / 10) + 1,
            territory_size_km2: (user.currentDistance || 0) / 1000
        },
        system_flags: {
            today_is_deload: false,
            manual_goal_override: null,
            user_changed_goal: false
        }
    };
};
