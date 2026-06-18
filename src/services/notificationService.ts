import { LocalNotifications } from '@capacitor/local-notifications';

export const notificationService = {
  async requestPermissions() {
    const { display } = await LocalNotifications.requestPermissions();
    return display === 'granted';
  },

  async scheduleNotification(title: string, body: string, id: number = Math.floor(Math.random() * 10000)) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id,
            schedule: { at: new Date(Date.now() + 1000) },
            sound: 'default',
            attachments: [],
            actionTypeId: '',
            extra: null,
          },
        ],
      });
    } catch (error) {
      console.warn('Local notifications not supported on this platform', error);
    }
  },

  async scheduleDailyReminder(hour: number, minute: number, title: string, body: string) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            title,
            body,
            id: 1,
            schedule: {
              on: {
                hour,
                minute,
              },
              repeats: true,
            },
          },
        ],
      });
    } catch (error) {
      console.warn('Daily reminders not supported', error);
    }
  },

  async scheduleHabitReminder(habitName: string, hour: number, minute: number) {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Math.floor(Math.random() * 1_000_000),
            title: 'Habit Reminder',
            body: `Time for ${habitName}`,
            schedule: {
              on: { hour, minute },
              repeats: true,
            },
          },
        ],
      });
    } catch (error) {
      console.warn('Habit reminder scheduling not supported', error);
    }
  },

  async scheduleWeeklyCheckInReminder() {
    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: 7001,
            title: 'Weekly Check-In',
            body: 'Log your weekly check-in to recalibrate your plan.',
            schedule: {
              on: {
                weekday: 1,
                hour: 9,
                minute: 0,
              },
              repeats: true,
            },
          },
        ],
      });
    } catch (error) {
      console.warn('Weekly check-in reminders not supported', error);
    }
  }
};
