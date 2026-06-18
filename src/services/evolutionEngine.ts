import { 
    User, UserBodyState, FitnessGoalType, Realm, 
    NutritionLog, RecoveryLog, HabitLog, SupplementLog, WeeklyCheckIn 
} from '../../types';
import { calculateBMR, calculateTDEE, calculateBMI } from '../utils/fitnessUtils';

export class EvolutionEngine {
    /**
     * Step 1: User Body State Diagnosis
     */
    static diagnoseBodyState(user: User): UserBodyState {
        const bmi = calculateBMI(user.bodyMetrics.currentWeight, user.bodyMetrics.height);
        
        if (user.isInjuryMode) return UserBodyState.Injured;
        
        // Simple BMI-based classification for initial diagnosis
        if (bmi > 35) return UserBodyState.SeverelyOverweight;
        if (bmi > 30) return UserBodyState.Overweight;
        if (bmi < 18.5) return UserBodyState.Underweight;
        
        // Contextual analysis
        if (user.level_overall < 5) return UserBodyState.Beginner;
        
        // Skill-based classification
        const avgSkillLevel = Object.values(user.skill_tree).reduce((acc, s) => acc + s.level, 0) / Object.keys(user.skill_tree).length;
        if (avgSkillLevel > 15) return UserBodyState.AdvancedAthlete;
        if (avgSkillLevel > 8) return UserBodyState.Athletic;
        
        // Default to recomposition priority for mid-range BMI
        return UserBodyState.SkinnyFat;
    }

    /**
     * Step 2: Metabolic & Energy Calculation
     */
    static calculateMetabolics(user: User, currentSteps: number = 0) {
        const bmr = calculateBMR(
            user.bodyMetrics.gender,
            user.bodyMetrics.currentWeight,
            user.bodyMetrics.height,
            user.bodyMetrics.age
        );

        // Derive activity factor from experience and movement
        let activityFactor = 1.2; // Sedentary
        if (user.bodyMetrics.experienceLevel === 'Intermediate') activityFactor = 1.375;
        if (user.bodyMetrics.experienceLevel === 'Advanced') activityFactor = 1.55;
        
        // Step adjustment
        if (currentSteps > 10000) activityFactor += 0.1;
        if (currentSteps > 15000) activityFactor += 0.2;

        const tdee = calculateTDEE(bmr, activityFactor);
        
        return { bmr, tdee, activityFactor };
    }

    /**
     * Step 3: Goal Pathway Determination
     */
    static determineProtocol(user: User, bodyState: UserBodyState) {
        const goal = user.primaryGoal;
        
        if (bodyState === UserBodyState.Injured) return "Injury / Recovery Protocol";
        if (bodyState === UserBodyState.SeverelyOverweight || goal === FitnessGoalType.FatLoss) return "Fat Loss Protocol";
        if (goal === FitnessGoalType.MuscleGain) return "Muscle Gain Protocol";
        if (goal === FitnessGoalType.Recomposition || bodyState === UserBodyState.SkinnyFat) return "Body Recomposition Protocol";
        
        return "General Performance Protocol";
    }

    /**
     * Step 7: Recovery Score Calculation
     */
    static calculateRecoveryScore(recoveryLogs: RecoveryLog[], moodLogs: any[]): number {
        if (recoveryLogs.length === 0) return 70; // Default baseline

        const latest = recoveryLogs[recoveryLogs.length - 1];
        // Weighted composite
        const sleepScore = (latest.sleepHours / 8) * 40; // 40% weight
        const qualityScore = (latest.sleepQuality / 10) * 20; // 20% weight
        const sorenessPenalty = (latest.soreness / 10) * 20; // 20% weight (negative)
        const fatiguePenalty = (latest.fatigue / 10) * 20; // 20% weight (negative)

        let score = sleepScore + qualityScore + (20 - sorenessPenalty) + (20 - fatiguePenalty);
        return Math.max(0, Math.min(100, score));
    }

    /**
     * Generate the Status Block
     */
    static generateStatusBlock(
        user: User, 
        nutritionLogs: NutritionLog[], 
        currentSteps: number = 0,
        recoveryLogs: RecoveryLog[] = [],
        eventType?: string,
        eventData?: any
    ): string {
        const bodyState = this.diagnoseBodyState(user);
        const { tdee } = this.calculateMetabolics(user, currentSteps);
        const protocol = this.determineProtocol(user, bodyState);
        const recoveryScore = this.calculateRecoveryScore(recoveryLogs, []);

        const today = new Date().toISOString().split('T')[0];
        const todaysLogs = nutritionLogs.filter(log => log.date.startsWith(today));
        const consumedCals = todaysLogs.reduce((acc, log) => acc + log.calories, 0);
        const consumedProtein = todaysLogs.reduce((acc, log) => acc + log.protein, 0);

        let calorieTarget = tdee;
        let proteinTarget = user.bodyMetrics.currentWeight * 2;

        if (protocol === "Fat Loss Protocol") calorieTarget -= 500;
        if (protocol === "Muscle Gain Protocol") calorieTarget += 300;
        if (protocol === "Body Recomposition Protocol") {
            calorieTarget -= 200;
            proteinTarget = user.bodyMetrics.currentWeight * 2.2;
        }

        const calsRemaining = calorieTarget - consumedCals;
        const proteinRemaining = proteinTarget - consumedProtein;

        // If it's a weekly check-in or progress request, provide the full status dashboard
        if (eventType === 'WEEKLY_CHECKIN' || eventType === 'PROGRESS_CHECK' || eventType === 'STATUS_REQUEST') {
            return `📊 Body State: ${bodyState}
🎯 Primary Goal: ${user.primaryGoal}
🔥 Daily Calorie Target: ${Math.round(calorieTarget)} kcal (${Math.round(calsRemaining)} kcal remaining)
🍗 Protein Target: ${Math.round(proteinTarget)} g (${Math.round(proteinRemaining)} g remaining)
💧 Hydration: ${todaysLogs.reduce((acc, l) => acc + (l.hydration_ml || 0), 0)}/${user.waterIntakeGoal_ml || 3000} ml
🚶 Movement: ${currentSteps.toLocaleString()}/${user.dailyStepGoal.toLocaleString()} steps
⛑️ Recovery: ${Math.round(recoveryScore)}/100
🏆 Level: ${user.level_overall} | Streak: ${user.streaks.daily_streak} days`;
        }

        // Return light, natural RPG/game flavor update
        switch (eventType) {
            case 'MEAL_LOG':
                return `🥗 Meal logged\n🔥 Streak: ${user.streaks.daily_streak} Days`;
            case 'HABIT_COMPLETE':
                return `✨ Habit Completed | +20 XP`;
            case 'WORKOUT_COMPLETE':
                return `💪 +100 XP\n🔥 Workout Streak: ${user.streaks.daily_streak} Days`;
            case 'STEP_GOAL_MET':
                return `🏃 +50 XP | Steps Goal Met`;
            case 'MISSION_FAILURE':
            case 'PENALTY_PROTOCOL':
                return `⚠️ Mission Failure: -1000 XP`;
            default:
                return '';
        }
    }
}
