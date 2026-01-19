import { assertNever } from "@app/lib/assert";
import { AnthropicModel, isAnthropicModel, AnthropicLLM } from "./anthropic";
import { CerebrasModel, isCerebrasModel, CerebrasLLM } from "./cerebras";
import { GeminiModel, isGeminiModel, GeminiLLM } from "./gemini";
import { isMistralModel, MistralModel, MistralLLM } from "./mistral";
import { isMoonshotAIModel, MoonshotAIModel, MoonshotAILLM } from "./moonshotai";
import { isDeepseekModel, DeepseekModel, DeepseekLLM } from "./deepseek";
import { isOpenAIModel, OpenAIModel, OpenAILLM } from "./openai";
import { LLM, ModelConfig } from "./index";

export type Model =
  | AnthropicModel
  | CerebrasModel
  | GeminiModel
  | OpenAIModel
  | MistralModel
  | MoonshotAIModel
  | DeepseekModel;

export type provider =
  | "openai"
  | "moonshotai"
  | "deepseek"
  | "anthropic"
  | "cerebras"
  | "gemini"
  | "mistral";

export function isProvider(str: string): str is provider {
  return [
    "gemini",
    "anthropic",
    "cerebras",
    "openai",
    "mistral",
    "moonshotai",
    "deepseek",
  ].includes(str);
}

export function isModel(model: string): model is Model {
  return (
    isAnthropicModel(model) ||
    isCerebrasModel(model) ||
    isOpenAIModel(model) ||
    isGeminiModel(model) ||
    isMistralModel(model) ||
    isMoonshotAIModel(model) ||
    isDeepseekModel(model)
  );
}

export function providerFromModel(
  model:
    | OpenAIModel
    | MoonshotAIModel
    | AnthropicModel
    | CerebrasModel
    | GeminiModel
    | MistralModel
    | DeepseekModel,
): provider {
  if (isOpenAIModel(model)) return "openai";
  if (isMoonshotAIModel(model)) return "moonshotai";
  if (isAnthropicModel(model)) return "anthropic";
  if (isCerebrasModel(model)) return "cerebras";
  if (isGeminiModel(model)) return "gemini";
  if (isMistralModel(model)) return "mistral";
  if (isDeepseekModel(model)) return "deepseek";
  else assertNever(model);
}

/**
 * Factory function to create an LLM instance from a model and config.
 * Centralizes the logic for determining which LLM class to instantiate.
 */
export function createLLM(model: Model, config?: ModelConfig): LLM {
  config = config ?? {};
  if (isAnthropicModel(model)) {
    return new AnthropicLLM(config, model);
  } else if (isCerebrasModel(model)) {
    return new CerebrasLLM(config, model);
  } else if (isGeminiModel(model)) {
    return new GeminiLLM(config, model);
  } else if (isOpenAIModel(model)) {
    return new OpenAILLM(config, model);
  } else if (isMistralModel(model)) {
    return new MistralLLM(config, model);
  } else if (isMoonshotAIModel(model)) {
    return new MoonshotAILLM(config, model);
  } else if (isDeepseekModel(model)) {
    return new DeepseekLLM(config, model);
  } else {
    assertNever(model);
  }
}
