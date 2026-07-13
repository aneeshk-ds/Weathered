export interface ReminderSlot {
  hour: number;
  minute: number;
  title: string;
  body: string;
}

/**
 * The four gentle daily check-in reminders: morning, afternoon, evening, night.
 * A check-in can still happen at any time; these are only nudges.
 */
export function reminderSchedule(): ReminderSlot[] {
  return [
    { hour: 9, minute: 0, title: "Good morning", body: "A 20-second Weathered check-in?" },
    { hour: 13, minute: 0, title: "Midday check-in", body: "How is the day going so far?" },
    { hour: 18, minute: 0, title: "Evening check-in", body: "How are you feeling now?" },
    { hour: 21, minute: 0, title: "Winding down", body: "One quick check-in before the day ends." },
  ];
}
