import { getModel, type KnownProvider } from "@mariozechner/pi-ai";
import { getConfigValue } from "./db.js";

const DEFAULT_PROVIDER = "anthropic";
const DEFAULT_MODEL = "claude-sonnet-4-20250514";

export function resolveModel(provider: string, modelId: string) {
  // Check for required API key
  if (provider === "anthropic" && !process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required for Anthropic provider");
  }
  if (provider === "openrouter" && !process.env.OPENROUTER_API_KEY) {
    throw new Error("OPENROUTER_API_KEY is required for OpenRouter provider");
  }

  // Cast needed: provider/modelId come from config, not compile-time known
  return (getModel as (p: string, m: string) => ReturnType<typeof getModel>)(provider, modelId);
}

export async function getEffectiveConfig(cliProvider?: string, cliModel?: string) {
  let provider = cliProvider ?? DEFAULT_PROVIDER;
  let model = cliModel ?? DEFAULT_MODEL;

  // Try Supabase config as middle layer (between defaults and CLI overrides)
  if (!cliProvider) {
    try {
      provider = await getConfigValue<string>("default_provider", DEFAULT_PROVIDER);
    } catch {
      // Supabase not available, use default
    }
  }
  if (!cliModel) {
    try {
      model = await getConfigValue<string>("default_model", DEFAULT_MODEL);
    } catch {
      // Supabase not available, use default
    }
  }

  return { provider, model };
}

export function parseCliArgs(args: string[]): { provider?: string; model?: string } {
  let provider: string | undefined;
  let model: string | undefined;

  for (let i = 0; i < args.length; i++) {
    if (args[i] === "--provider" && args[i + 1]) {
      provider = args[i + 1];
      i++;
    } else if (args[i] === "--model" && args[i + 1]) {
      model = args[i + 1];
      i++;
    }
  }

  return { provider, model };
}
