import type { SyncBackend, SyncSnapshot } from "./sync";
import { supabase } from "./supabase";
import {
  fromRemoteCheckIn,
  fromRemoteFeedback,
  toRemoteCheckIn,
  toRemoteFeedback,
  type RemoteCheckIn,
  type RemoteFeedback,
} from "./syncMappers";

/**
 * Resolve the current user id, creating an anonymous session on first use.
 * Anonymous auth gives each device a stable auth.uid() so row-level security
 * can isolate data without asking the user for credentials.
 */
async function ensureUserId(): Promise<string | null> {
  const { data: sessionData } = await supabase.auth.getSession();
  const existing = sessionData.session?.user.id;
  if (existing) {
    return existing;
  }
  const { data, error } = await supabase.auth.signInAnonymously();
  if (error) {
    return null;
  }
  return data.user?.id ?? null;
}

/** Cloud sync backed by Supabase with per-user row-level security. */
export const supabaseSync: SyncBackend = {
  id: "supabase",
  async push(snapshot: SyncSnapshot): Promise<boolean> {
    const userId = await ensureUserId();
    if (!userId) {
      return false;
    }
    if (snapshot.entries.length > 0) {
      const rows = snapshot.entries.map((entry) => toRemoteCheckIn(entry, userId));
      const { error } = await supabase.from("check_ins").upsert(rows, { onConflict: "user_id,id" });
      if (error) {
        return false;
      }
    }
    if (snapshot.feedback.length > 0) {
      const rows = snapshot.feedback.map((item) => toRemoteFeedback(item, userId));
      const { error } = await supabase.from("nudge_feedback").upsert(rows, { onConflict: "user_id,nudge_id" });
      if (error) {
        return false;
      }
    }
    return true;
  },
  async pull(): Promise<SyncSnapshot | null> {
    const userId = await ensureUserId();
    if (!userId) {
      return null;
    }
    const checkIns = await supabase.from("check_ins").select("*");
    const feedback = await supabase.from("nudge_feedback").select("*");
    if (checkIns.error || feedback.error) {
      return null;
    }
    return {
      entries: (checkIns.data as RemoteCheckIn[]).map(fromRemoteCheckIn),
      feedback: (feedback.data as RemoteFeedback[]).map(fromRemoteFeedback),
    };
  },
};

/** Delete one synced check-in for the current user so deletions propagate. */
export async function deleteRemoteCheckIn(id: string): Promise<boolean> {
  const userId = await ensureUserId();
  if (!userId) {
    return false;
  }
  const { error } = await supabase.from("check_ins").delete().eq("user_id", userId).eq("id", id);
  return !error;
}

/** Delete every synced row for the current user. Used when clearing all data. */
export async function clearRemoteData(): Promise<boolean> {
  const userId = await ensureUserId();
  if (!userId) {
    return false;
  }
  const checkIns = await supabase.from("check_ins").delete().eq("user_id", userId);
  const feedback = await supabase.from("nudge_feedback").delete().eq("user_id", userId);
  return !checkIns.error && !feedback.error;
}
