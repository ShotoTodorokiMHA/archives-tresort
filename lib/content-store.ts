import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import {
  defaultHuntContent,
  HuntConfig,
  HuntContent,
  TreasureStep
} from "@/data/hunt-config";

const contentFilePath = path.join(process.cwd(), "data", "hunt-content.json");
const contentTableName = process.env.SUPABASE_CONTENT_TABLE ?? "treasure_hunt_content";
const contentEventKey = process.env.SUPABASE_EVENT_KEY ?? "archives-treasures-hunt";

function hasSupabaseConfig() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

function getSupabaseClient() {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    }
  });
}

function sanitizeHuntConfig(value: unknown): HuntConfig {
  const source = value as Partial<HuntConfig> | undefined;

  return {
    ...defaultHuntContent.huntConfig,
    ...source,
    admin: {
      ...defaultHuntContent.huntConfig.admin,
      ...(source?.admin ?? {})
    },
    siteLock: {
      ...defaultHuntContent.huntConfig.siteLock,
      ...(source?.siteLock ?? {})
    },
    logo: {
      ...defaultHuntContent.huntConfig.logo,
      ...(source?.logo ?? {})
    },
    center: {
      ...defaultHuntContent.huntConfig.center,
      ...(source?.center ?? {})
    }
  };
}

function sanitizeTreasureSteps(value: unknown): TreasureStep[] {
  if (!Array.isArray(value)) {
    return defaultHuntContent.treasureSteps;
  }

  if (value.length === 0) {
    return defaultHuntContent.treasureSteps;
  }

  return value.map((step, index) => {
    const source = (step ?? {}) as Partial<TreasureStep>;

    return {
      id: String(source.id ?? `step-${index + 1}`),
      name: String(source.name ?? ""),
      address: String(source.address ?? ""),
      lat: Number(source.lat ?? 0),
      lng: Number(source.lng ?? 0),
      hint: String(source.hint ?? ""),
      description: String(source.description ?? ""),
      validationCode: String(source.validationCode ?? "").slice(0, 4)
    };
  });
}

function sanitizeHuntContent(value: unknown): HuntContent {
  const source = (value ?? {}) as Partial<HuntContent>;

  return {
    huntConfig: sanitizeHuntConfig(source.huntConfig),
    treasureSteps: sanitizeTreasureSteps(source.treasureSteps)
  };
}

async function ensureContentFile() {
  try {
    await fs.access(contentFilePath);
  } catch {
    await fs.mkdir(path.dirname(contentFilePath), { recursive: true });
    await fs.writeFile(contentFilePath, JSON.stringify(defaultHuntContent, null, 2), "utf8");
  }
}

export async function readHuntContent(): Promise<HuntContent> {
  if (hasSupabaseConfig()) {
    try {
      const supabase = getSupabaseClient();
      const { data, error } = await supabase
        .from(contentTableName)
        .select("hunt_config, treasure_steps")
        .eq("event_key", contentEventKey)
        .maybeSingle();

      if (error) {
        throw error;
      }

      if (!data) {
        return defaultHuntContent;
      }

      return sanitizeHuntContent({
        huntConfig: data.hunt_config,
        treasureSteps: data.treasure_steps
      });
    } catch {
      // Build and local fallback when Supabase is unavailable.
    }
  }

  await ensureContentFile();
  const raw = await fs.readFile(contentFilePath, "utf8");

  try {
    return sanitizeHuntContent(JSON.parse(raw));
  } catch {
    return defaultHuntContent;
  }
}

export async function writeHuntContent(content: HuntContent) {
  const sanitized = sanitizeHuntContent(content);

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(contentTableName).upsert(
      {
        event_key: contentEventKey,
        hunt_config: sanitized.huntConfig,
        treasure_steps: sanitized.treasureSteps
      },
      {
        onConflict: "event_key"
      }
    );

    if (error) {
      throw error;
    }

    return;
  }

  await ensureContentFile();
  await fs.writeFile(contentFilePath, JSON.stringify(sanitized, null, 2), "utf8");
}
