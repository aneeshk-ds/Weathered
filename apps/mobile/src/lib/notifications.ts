import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { reminderSchedule } from "./reminders";

const CHANNEL_ID = "reminders";

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

/** Ask for notification permission. Returns whether it is granted. */
export async function ensureRemindersPermission(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: "Check-in reminders",
      importance: Notifications.AndroidImportance.DEFAULT,
    });
  }
}

/**
 * Schedule the four daily reminders, replacing any already scheduled. Returns
 * false on web or when permission is not granted.
 */
export async function scheduleDailyReminders(): Promise<boolean> {
  if (Platform.OS === "web") {
    return false;
  }
  const granted = await ensureRemindersPermission();
  if (!granted) {
    return false;
  }
  await ensureAndroidChannel();
  await Notifications.cancelAllScheduledNotificationsAsync();
  for (const slot of reminderSchedule()) {
    await Notifications.scheduleNotificationAsync({
      content: { title: slot.title, body: slot.body },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: slot.hour,
        minute: slot.minute,
        channelId: CHANNEL_ID,
      },
    });
  }
  return true;
}

/** Cancel all scheduled reminders. */
export async function cancelDailyReminders(): Promise<void> {
  if (Platform.OS === "web") {
    return;
  }
  await Notifications.cancelAllScheduledNotificationsAsync();
}
