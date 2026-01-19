import type { Model } from "./provider";
import { providerFromModel } from "./provider";
import { TOKEN_PRICING as ANTHROPIC_PRICING } from "./anthropic";
import { TOKEN_PRICING as CEREBRAS_PRICING } from "./cerebras";
import { TOKEN_PRICING as DEEPSEEK_PRICING } from "./deepseek";
import { TOKEN_PRICING as GEMINI_PRICING } from "./gemini";
import { TOKEN_PRICING as MISTRAL_PRICING } from "./mistral";
import { TOKEN_PRICING as MOONSHOTAI_PRICING } from "./moonshotai";
import { TOKEN_PRICING as OPENAI_PRICING } from "./openai";

type TokenPricing = { input: number; output: number };

const TOKEN_PRICING: Record<string, TokenPricing> = {};

for (const pricing of [
  ANTHROPIC_PRICING,
  CEREBRAS_PRICING,
  DEEPSEEK_PRICING,
  GEMINI_PRICING,
  MISTRAL_PRICING,
  MOONSHOTAI_PRICING,
  OPENAI_PRICING,
]) {
  for (const [key, value] of Object.entries(pricing)) {
    TOKEN_PRICING[key] = { input: value.input, output: value.output };
  }
}

export interface ModelInfo {
  model: Model;
  provider: string;
  inputPrice: number; // USD per million tokens
  outputPrice: number; // USD per million tokens
}

function toMillionTokenPrice(pricePerToken: number): number {
  return pricePerToken * 1_000_000;
}

export function getAllModels(): ModelInfo[] {
  const models: ModelInfo[] = [];

  for (const [model, pricing] of Object.entries(TOKEN_PRICING)) {
    models.push({
      model: model as Model,
      provider: providerFromModel(model as Model),
      inputPrice: toMillionTokenPrice(pricing.input),
      outputPrice: toMillionTokenPrice(pricing.output),
    });
  }

  return models;
}

export function formatPrice(pricePerMillion: number): string {
  if (pricePerMillion >= 1) {
    return `$${pricePerMillion.toFixed(2)}`;
  }
  return `$${pricePerMillion.toFixed(3)}`;
}
