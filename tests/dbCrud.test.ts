import { describe, expect, it, beforeEach } from 'vitest';
import { db } from '../src/db/database';

describe('Database CRUD Operations', () => {
  beforeEach(async () => {
    // Clear the database tables we use
    await db.nutritionLogs.clear();
  });

  it('should successfully add and retrieve a nutrition log', async () => {
    const log = {
      id: 'test-log-1',
      date: new Date().toISOString(),
      calories: 2000,
      protein: 150,
      hydration_ml: 2500,
      meals: [{ name: 'Test Meal', calories: 2000, protein: 150 }]
    };

    await db.nutritionLogs.add(log);
    const retrieved = await db.nutritionLogs.get('test-log-1');
    
    expect(retrieved).toBeDefined();
    expect(retrieved?.calories).toBe(2000);
    expect(retrieved?.meals[0].name).toBe('Test Meal');
  });

  it('should successfully delete a log', async () => {
    const log = {
      id: 'test-log-2',
      date: new Date().toISOString(),
      calories: 1500,
      protein: 100,
      hydration_ml: 2000,
      meals: []
    };

    await db.nutritionLogs.add(log);
    await db.nutritionLogs.delete('test-log-2');
    
    const retrieved = await db.nutritionLogs.get('test-log-2');
    expect(retrieved).toBeUndefined();
  });
});
