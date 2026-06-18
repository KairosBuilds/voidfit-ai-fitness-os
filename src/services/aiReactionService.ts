import { db } from '../db/database';
import { User, ChatMessage } from '../../types';
import { generateSystemReaction, analyzeMeal } from '../../services/geminiService';
import { EvolutionEngine } from './evolutionEngine';

const getLocalFallbackResponse = (eventType: string, eventData: any): string => {
    switch (eventType) {
        case 'MEAL_LOG':
            return "I've logged your meal. Since the image analysis is taking a moment, focus on getting enough protein and staying hydrated today. You can add a manual estimate on the dashboard.";
        case 'MISSION_FAILURE':
        case 'PENALTY_PROTOCOL':
            return "You missed a few commitments recently. It happens to the best of us. Let's reset, adjust, and focus on what you can do next.";
        case 'WORKOUT_COMPLETE':
            return "Workout complete. Excellent effort today! Make sure to focus on your recovery now.";
        case 'STEP_GOAL_MET':
            return "You hit your daily step goal! Great job staying active and consistent.";
        case 'FORM_SCAN':
            return "I've checked your form. The online connection is taking a brief moment, but remember to keep your core engaged and maintain controlled repetitions.";
        default:
            return "I'm checking your progress. Keep showing up, stay consistent, and let's focus on the next step.";
    }
};

export const reportEventToAi = async (
    apiKey: string,
    user: User,
    eventType: string,
    eventData: Record<string, unknown>,
    imageUrl?: string
) => {
    // 1. Create Player message
    let userText = `Activity logged: ${eventType.toLowerCase().replace(/_/g, ' ')}`;
    if (eventType === 'MEAL_LOG') {
        userText = `Logged my meal: ${eventData.name || 'Meal'}.`;
    } else if (eventType === 'INJURY_REPORT') {
        userText = `Reported pain or injury: ${eventData.details}.`;
    } else if (eventType === 'HABIT_COMPLETE') {
        userText = `Completed my habit: ${eventData.habitName}.`;
    } else if (eventType === 'FORM_SCAN') {
        userText = `Checked my form for ${eventData.exercise || 'Exercise'}.`;
    } else if (eventType === 'WORKOUT_COMPLETE') {
        userText = `Finished workout: ${eventData.missionTitle || 'Daily Session'}.`;
    } else if (eventType === 'STEP_GOAL_MET') {
        userText = `Hit my step goal today!`;
    } else if (eventType === 'MISSION_FAILURE') {
        userText = `Missed today's daily mission.`;
    } else if (eventType === 'PENALTY_PROTOCOL') {
        userText = `Missed some commitments.`;
    } else if (eventType === 'WEEKLY_CHECKIN') {
        userText = `Completed my weekly check-in.`;
    }

    const userMsg: ChatMessage = {
        id: `event-user-${Date.now()}`,
        text: userText,
        sender: 'user',
        timestamp: new Date().toISOString(),
        imageUrl
    };

    await db.chatLogs.put(userMsg);

    // 2. Fetch only recent context for Evolution Engine (avoid full table scans)
    const todayStr = new Date().toISOString().split('T')[0];
    const nutritionLogs = await db.nutritionLogs.where('date').startsWith(todayStr).toArray();
    const recoveryLogs = await db.recoveryLogs.orderBy('date').reverse().limit(7).toArray();

    // 3. Generate AI Reaction
    let aiResponse = "";
    
    // STRICT AI FILTERING: Only use AI for critical analysis
    const criticalEvents = ['MEAL_LOG', 'INJURY_REPORT', 'WEEKLY_CHECKIN', 'FORM_SCAN'];
    const useAi = criticalEvents.includes(eventType);

    if (eventType === 'MEAL_LOG' && imageUrl) {
        // High-level meal analysis
        const analysisRaw = eventData.analysisResult ? String(eventData.analysisResult) : await analyzeMeal(apiKey, imageUrl.split(',')[1]);
        try {
            const analysis = JSON.parse(analysisRaw.replace(/```json|```/g, "").trim());
            
            if (analysis.error) {
                // Show specific error messages based on what failed
                const errorMessages: Record<string, string> = {
                    'NO_API_KEY': 'To scan meals, please add your Gemini API key in Settings. Once added, your coach will be able to analyze what you eat!',
                    'NO_IMAGE': 'No image was provided for the scan. Try again with a clear photo of your meal.',
                    'QUOTA_EXCEEDED': 'Your AI quota is full for now — try again in a few minutes. In the meantime, log your meal manually using the tracker.',
                    'INVALID_KEY': 'There seems to be an issue with your API key. Head to Settings and double-check it.',
                    'NETWORK_ERROR': "Looks like you're offline right now. Log the meal manually and I'll keep tracking your progress.",
                    'SCAN_FAILED': "The meal scan couldn't complete right now. Try again or log the calories manually — either way, I've got you.",
                };
                aiResponse = errorMessages[analysis.error] ?? `I'm having trouble analyzing your meal image right now. Let's focus on logging it manually, staying hydrated, and aiming for your targets today.`;
            } else {
                aiResponse = `**Meal Analysis: ${analysis.items_identified?.map((i: any) => i.name).join(', ') || 'Meal'}**

Estimated Calories: ${analysis.total_calories_in_plate || 0} kcal | Protein: ${analysis.total_protein || 0}g

**Coaching Observation:**
${analysis.advice_if_exceeded || "Nice selection. Keep hydration high and hit your macro targets today."}

**Detected Items:**
${analysis.items_identified?.map((i: any) => `- ${i.name} (${i.calories} kcal, ${i.protein}g protein)`).join('\n') || 'No items identified.'}`;
            }
        } catch (e) {
            // If analysisRaw is not JSON (e.g. raw model text), show it directly if meaningful
            aiResponse = typeof analysisRaw === 'string' && analysisRaw.length > 20
                ? analysisRaw
                : `I'm having trouble analyzing your meal right now. Log it manually and I'll keep tracking your progress.`;
        }
    } else if (eventType === 'FORM_SCAN') {
        if (eventData.analysisResult) {
            aiResponse = String(eventData.analysisResult);
        } else {
            aiResponse = await generateSystemReaction(apiKey, user, eventType, eventData);
        }
    } else if (useAi) {
        aiResponse = await generateSystemReaction(apiKey, user, eventType, eventData);
    }

    // 4. Append Status Block from Evolution Engine
    const currentSteps = user.currentSteps || 0;
    const statusBlock = EvolutionEngine.generateStatusBlock(user, nutritionLogs, currentSteps, recoveryLogs, eventType, eventData);
    
    // 5. Create AI message (Only if we have a real response or it's a critical error we want to show)
    const isErrorResponse = !aiResponse || aiResponse.includes('Neural Link Capacity Reached') || aiResponse.includes('Connection unstable') || aiResponse.includes('NEURAL_LINK_CONGESTED') || aiResponse.includes('COACH_OFFLINE') || aiResponse.includes('COACH OFFLINE');
    
    const displayResponse = isErrorResponse 
        ? getLocalFallbackResponse(eventType, eventData)
        : aiResponse;

    const finalResponse = statusBlock 
        ? `${displayResponse}\n\n***\n${statusBlock}` 
        : displayResponse;
    
    const aiMsg: ChatMessage = {
        id: `event-ai-${Date.now()}`,
        text: finalResponse,
        sender: 'ai',
        timestamp: new Date().toISOString()
    };

    await db.chatLogs.put(aiMsg);
};
