import { describe, expect, it } from 'vitest';
import { calculateBMI, calculateIdealWeight, calculateTDEE, calculateBMR } from '../src/utils/fitnessUtils';

describe('Fitness Utilities', () => {
  describe('calculateBMI', () => {
    it('should correctly calculate BMI for standard values', () => {
      // 80kg, 180cm -> 80 / (1.8 * 1.8) = 24.69...
      expect(calculateBMI(80, 180)).toBe(24.7);
    });

    it('should return 0 for zero height', () => {
      expect(calculateBMI(80, 0)).toBe(0);
    });
  });

  describe('calculateIdealWeight', () => {
    it('should correctly calculate ideal weight for a male', () => {
      // 180cm male
      expect(calculateIdealWeight(180, 'Male')).toBe(75);
    });

    it('should correctly calculate ideal weight for a female', () => {
      // 165cm female
      expect(calculateIdealWeight(165, 'Female')).toBe(57);
    });
  });

  describe('calculateTDEE', () => {
    it('should correctly calculate TDEE for a male with muscle gain goal', () => {
      // 30yo male, 80kg, 180cm, 300kcal surplus
      const bmr = calculateBMR('Male', 80, 180, 30); // 1780
      const tdee = calculateTDEE(bmr, 1.55, 300); // 1780 * 1.55 + 300 = 3059
      expect(tdee).toBe(3059);
    });
  });
});
