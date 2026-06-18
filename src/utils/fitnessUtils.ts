/**
 * Calculates BMI (Body Mass Index)
 * @param weight Weight in kg
 * @param height Height in cm
 */
export const calculateBMI = (weight: number, height: number): number => {
  const heightInMeters = height / 100;
  if (!weight || !heightInMeters) return 0;
  return parseFloat((weight / (heightInMeters * heightInMeters)).toFixed(1));
};

/**
 * Calculates Ideal Body Weight using a variant of the Devine Formula
 * @param height Height in cm
 * @param gender Gender
 */
export const calculateIdealWeight = (height: number, gender: 'Male' | 'Female' | 'Other'): number => {
  if (!height) return 0;
  const base = gender === 'Male' ? 50 : 45.5;
  const extra = (height / 2.54 - 60) * 2.3;
  return Math.round(base + (extra > 0 ? extra : 0));
};

/**
 * Calculates BMR using Mifflin-St Jeor Equation
 */
export const calculateBMR = (
    gender: 'Male' | 'Female' | 'Other',
    weight: number,
    height: number,
    age: number
): number => {
    // Mifflin-St Jeor
    const base = (10 * weight) + (6.25 * height) - (5 * age);
    return gender === 'Male' ? base + 5 : base - 161;
};

/**
 * Calculates TDEE (Total Daily Energy Expenditure)
 * @param bmr Basal Metabolic Rate
 * @param activityFactor Multiplier based on activity level
 * @param goalModifier Optional calorie adjustment for goals
 */
export const calculateTDEE = (
  bmr: number,
  activityFactor: number,
  goalModifier: number = 0
): number => {
  return Math.round(bmr * activityFactor + goalModifier);
};
