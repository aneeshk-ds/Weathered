import "react-native-url-polyfill/auto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

// Public project URL and publishable key. These are safe to ship in the client:
// every table is protected by row-level security scoped to auth.uid(), so a key
// holder can only ever read or write their own rows.
export const SUPABASE_URL = "https://wfhcrrbylebhqjzbngpy.supabase.co";
export const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_E34QAELTmUs_DxQHCIprxw_vAahWrJ3";

export const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
