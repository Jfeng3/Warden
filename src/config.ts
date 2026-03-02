import { getModel } from "@mariozechner/pi-ai";

const DEFAULT_PROVIDER = "openrouter";
const DEFAULT_MODEL = "anthropic/claude-sonnet-4";

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

export function getEffectiveConfig(cliProvider?: string, cliModel?: string) {
  const provider = cliProvider ?? process.env.DEFAULT_PROVIDER ?? DEFAULT_PROVIDER;
  const model = cliModel ?? process.env.DEFAULT_MODEL ?? DEFAULT_MODEL;
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
