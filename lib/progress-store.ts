import { promises as fs } from "node:fs";
import path from "node:path";
import { createClient } from "@supabase/supabase-js";
import { treasureSteps } from "@/data/hunt-config";

export type SharedProgress = {
  validatedStepIds: string[];
};

const progressFilePath = path.join(process.cwd(), "data", "shared-progress.json");
const progressTableName = process.env.SUPABASE_PROGRESS_TABLE ?? "treasure_hunt_progress";
const progressEventKey = process.env.SUPABASE_EVENT_KEY ?? "archives-treasures-hunt";

const validStepIds = new Set(treasureSteps.map((step) => step.id));

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

function sanitizeValidatedStepIds(stepIds: string[]) {
  return stepIds.filter((id) => validStepIds.has(id));
}

async function ensureProgressFile() {
  try {
    await fs.access(progressFilePath);
  } catch {
    await fs.mkdir(path.dirname(progressFilePath), { recursive: true });
    await fs.writeFile(
      progressFilePath,
      JSON.stringify({ validatedStepIds: [] }, null, 2),
      "utf8"
    );
  }
}

export async function readSharedProgress(): Promise<SharedProgress> {
  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from(progressTableName)
      .select("validated_step_ids")
      .eq("event_key", progressEventKey)
      .maybeSingle();

    if (error) {
      throw error;
    }

    const validatedStepIds = sanitizeValidatedStepIds((data?.validated_step_ids as string[] | undefined) ?? []);
    return { validatedStepIds };
  }

  await ensureProgressFile();
  const raw = await fs.readFile(progressFilePath, "utf8");

  try {
    const parsed = JSON.parse(raw) as SharedProgress;
    const validatedStepIds = sanitizeValidatedStepIds(parsed.validatedStepIds ?? []);
    return { validatedStepIds };
  } catch {
    return { validatedStepIds: [] };
  }
}

export async function writeSharedProgress(progress: SharedProgress) {
  const validatedStepIds = sanitizeValidatedStepIds(progress.validatedStepIds);

  if (hasSupabaseConfig()) {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from(progressTableName).upsert(
      {
        event_key: progressEventKey,
        validated_step_ids: validatedStepIds
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

  await ensureProgressFile();
  await fs.writeFile(progressFilePath, JSON.stringify({ validatedStepIds }, null, 2), "utf8");
}
