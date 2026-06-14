import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { DecisionLogInput, RecommendationFeedback } from "@weathered/shared";

const BACKUP_VERSION = 1;

export interface BackupPayload {
  app: "weathered";
  version: number;
  exportedAt: string;
  entries: DecisionLogInput[];
  feedback: RecommendationFeedback[];
}

export interface BackupResult {
  ok: boolean;
  message: string;
}

export interface RestoreResult extends BackupResult {
  entries?: DecisionLogInput[];
  feedback?: RecommendationFeedback[];
}

export async function exportBackup(
  entries: DecisionLogInput[],
  feedback: RecommendationFeedback[],
): Promise<BackupResult> {
  try {
    const payload: BackupPayload = {
      app: "weathered",
      version: BACKUP_VERSION,
      exportedAt: new Date().toISOString(),
      entries,
      feedback,
    };
    const stamp = new Date().toISOString().slice(0, 10);
    const uri = `${FileSystem.cacheDirectory}weathered-backup-${stamp}.json`;
    await FileSystem.writeAsStringAsync(uri, JSON.stringify(payload, null, 2));

    if (!(await Sharing.isAvailableAsync())) {
      return { ok: false, message: "Sharing isn't available on this device." };
    }

    await Sharing.shareAsync(uri, {
      mimeType: "application/json",
      dialogTitle: "Save your Weathered backup",
      UTI: "public.json",
    });
    return { ok: true, message: "Backup ready — choose iCloud Drive or Google Drive to save it." };
  } catch {
    return { ok: false, message: "Could not create the backup." };
  }
}

export async function importBackup(): Promise<RestoreResult> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: "application/json",
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets?.length) {
      return { ok: false, message: "Restore canceled." };
    }

    const raw = await FileSystem.readAsStringAsync(result.assets[0].uri);
    const parsed = JSON.parse(raw) as Partial<BackupPayload>;

    if (parsed.app !== "weathered" || !Array.isArray(parsed.entries)) {
      return { ok: false, message: "That file isn't a Weathered backup." };
    }

    return {
      ok: true,
      message: `Restored ${parsed.entries.length} check-in${parsed.entries.length === 1 ? "" : "s"}.`,
      entries: parsed.entries as DecisionLogInput[],
      feedback: Array.isArray(parsed.feedback) ? (parsed.feedback as RecommendationFeedback[]) : [],
    };
  } catch {
    return { ok: false, message: "Could not read that file." };
  }
}
