import { describe, expect, it } from 'vitest';
import { getXpThresholdForLevel } from '../constants';

describe('XP thresholds', () => {
  it('level 1 threshold should be base level XP', () => {
    expect(getXpThresholdForLevel(1)).toBe(1000);
  });

  it('thresholds should compound at 10%', () => {
    const lvl2 = getXpThresholdForLevel(2);
    const lvl3 = getXpThresholdForLevel(3);
    expect(lvl3).toBe(Math.floor(lvl2 * 1.1));
  });
});

