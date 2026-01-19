import {
  LLM,
  ModelConfig,
  Message,
  Tool,
  TextContent,
  ToolUse,
  Thinking,
  TokenUsage,
} from "./index";
import { Result, err, ok } from "@app/lib/error";
import { assertNever } from "@app/lib/assert";
import Cerebras from "@cerebras/cerebras_cloud_sdk";
import type {
  ChatCompletion,
  ChatCompletionCreateParams,
} from "@cerebras/cerebras_cloud_sdk/resources/chat/completions";
import { isString } from "@app/lib/utils";

type CerebrasMessage =
  | ChatCompletionCreateParams.SystemMessageRequest
  | ChatCompletionCreateParams.UserMessageRequest
  | ChatCompletionCreateParams.AssistantMessageRequest
  | ChatCompletionCreateParams.ToolMessageRequest;

type CerebrasTokenPrices = {
  input: number;
  output: number;
};

function normalizeTokenPrices(
  costPerMillionInputTokens: number,
  costPerMillionOutputTokens: number,
): CerebrasTokenPrices {
  return {
    input: costPerMillionInputTokens / 1_000_000,
    output: costPerMillionOutputTokens / 1_000_000,
  };
}

// https://www.cerebras.ai/pricing
export const TOKEN_PRICING: Record<CerebrasModel, CerebrasTokenPrices> = {
  "llama3.1-8b": normalizeTokenPrices(0.1, 0.1),
  "llama-3.3-70b": normalizeTokenPrices(0.6, 0.6),
  "gpt-oss-120b": normalizeTokenPrices(0.25, 0.69),
  "qwen-3-32b": normalizeTokenPrices(0.2, 0.2),
};

export type CerebrasModel =
  | "llama3.1-8b"
  | "llama-3.3-70b"
  | "gpt-oss-120b"
  | "qwen-3-32b";

export function isCerebrasModel(model: string): model is CerebrasModel {
  return [
    "llama3.1-8b",
    "llama-3.3-70b",
    "gpt-oss-120b",
    "qwen-3-32b",
  ].includes(model);
}

function validateName(name: string): { valid: boolean; reason?: string } {
  if (!(name.length <= 256)) {
    return {
      valid: false,
      reason: `name: ${name} must be less than 256 characters`,
    };
  }
  if (!name.match(/^[a-zA-Z0-9_-]+$/)) {
    return {
      valid: false,
      reason: `name: ${name} must be alphanumeric`,
    };
  }
  return { valid: true };
}

export class CerebrasLLM extends LLM {
  private client: Cerebras;
  private model: CerebrasModel;

  constructor(config: ModelConfig, model: CerebrasModel = "llama-3.3-70b") {
    super(config);
    this.client = new Cerebras({
      apiKey: process.env.CEREBRAS_API_KEY,
    });
    this.model = model;
  }

  messages(messages: Message[]): CerebrasMessage[] {
    const cerebrasMessages: CerebrasMessage[] = [];

    for (const msg of messages) {
      switch (msg.role) {
        case "user":
          // Add tool results as tool messages
          for (const c of msg.content.filter((c) => c.type === "tool_result")) {
            const toolMsg: ChatCompletionCreateParams.ToolMessageRequest = {
              role: "tool",
              tool_call_id: c.toolUseId,
              name: c.toolUseName,
              content: c.content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join("\n"),
            };
            cerebrasMessages.push(toolMsg);
          }
          // Add text content as user message
          if (msg.content.find((c) => c.type === "text")) {
            const userMsg: ChatCompletionCreateParams.UserMessageRequest = {
              role: "user",
              content: msg.content
                .filter((c) => c.type === "text")
                .map((c) => c.text)
                .join("\n"),
            };
            cerebrasMessages.push(userMsg);
          }
          break;
        case "agent":
          const toolCalls = msg.content
            .filter((c) => c.type === "tool_use")
            .map((c) => ({
              id: c.id,
              type: "function" as const,
              function: {
                name: c.name,
                arguments: isString(c.input)
                  ? c.input
                  : JSON.stringify(c.input),
              },
            }));

          const textContent = msg.content
            .filter((c) => c.type === "text")
            .map((c) => c.text)
            .join("\n");

          const agentMsg: ChatCompletionCreateParams.AssistantMessageRequest = {
            role: "assistant",
            content: textContent || undefined,
            tool_calls: toolCalls.length > 0 ? toolCalls : undefined,
          };

          cerebrasMessages.push(agentMsg);
      }
    }

    return cerebrasMessages;
  }

  async run(
    messages: Message[],
    prompt: string,
    tools: Tool[],
  ): Promise<Result<{ message: Message; tokenUsage?: TokenUsage }>> {
    try {
      const chatResponse = await this.client.chat.completions.create({
        model: this.model,
        messages: [
          {
            role: "system",
            content: prompt,
          } as ChatCompletionCreateParams.SystemMessageRequest,
          ...this.messages(messages),
        ],
        tool_choice: tools.length > 0 ? "auto" : undefined,
        tools:
          tools.length > 0
            ? tools.map((t) => ({
                type: "function" as const,
                function: {
                  name: t.name,
                  description: t.description,
                  parameters: t.inputSchema,
                },
              }))
            : undefined,
      });

      // Handle the response - it could be a ChatCompletionResponse or chunk/error
      if ("error" in chatResponse) {
        return err(
          "model_error",
          `API error: ${(chatResponse as ChatCompletion.ErrorChunkResponse).error.message}`,
          new Error(
            (chatResponse as ChatCompletion.ErrorChunkResponse).error.message ??
              "Unknown error",
          ),
        );
      }

      // Non-streaming response is ChatCompletionResponse
      const response = chatResponse as ChatCompletion.ChatCompletionResponse;
      const usage = response.usage;

      const tokenUsage =
        !usage?.total_tokens || !usage?.prompt_tokens || !usage?.completion_tokens
          ? undefined
          : this.tokenUsage(usage);

      const msg = response.choices?.[0]?.message;
      const finishReason = response.choices?.[0]?.finish_reason;

      if (!msg) {
        return err(
          "model_error",
          "No message in response",
          new Error("No message in response"),
        );
      }

      if (finishReason !== "stop" && finishReason !== "tool_calls") {
        return err(
          "model_error",
          `Unexpected finish reason: ${finishReason}`,
          new Error(`Unexpected finish reason: ${finishReason}`),
        );
      }

      const content: (TextContent | ToolUse | Thinking)[] = [];

      if (msg.tool_calls) {
        for (const toolCall of msg.tool_calls) {
          const { valid, reason } = validateName(toolCall.function.name);
          if (valid) {
            content.push({
              type: "tool_use",
              id: toolCall.id ?? "",
              name: toolCall.function.name,
              input: isString(toolCall.function.arguments)
                ? JSON.parse(toolCall.function.arguments)
                : toolCall.function.arguments,
              provider: null,
            });
          } else {
            console.warn(
              `Cerebras model received invalid tool name: ${toolCall.function.name}.
              Reason: ${reason}`,
            );
          }
        }
      }

      if (msg.content) {
        content.push({
          type: "text",
          text: msg.content,
          provider: null,
        });
      }

      return ok({
        message: {
          role: "agent",
          content,
        },
        tokenUsage,
      });
    } catch (error) {
      return err("model_error", "Failed to run model", error);
    }
  }

  private tokenUsage(usage: ChatCompletion.ChatCompletionResponse.Usage): TokenUsage {
    return {
      total: usage.total_tokens ?? 0,
      input: usage.prompt_tokens ?? 0,
      output: usage.completion_tokens ?? 0,
      cached: usage.prompt_tokens_details?.cached_tokens ?? 0,
      thinking: 0,
    };
  }

  protected costPerTokenUsage(tokenUsage: TokenUsage): number {
    const pricing = TOKEN_PRICING[this.model];
    const c =
      tokenUsage.input * pricing.input + tokenUsage.output * pricing.output;
    return c;
  }

  async tokens(
    messages: Message[],
    _prompt: string,
    _tools: Tool[],
  ): Promise<Result<number>> {
    try {
      // Cerebras doesn't have a token counting API so we approximate with token ~= 4 chars.
      const tokens =
        messages.reduce((acc, m) => {
          const contentLength = m.content.reduce((acc, c) => {
            switch (c.type) {
              case "text":
                return acc + c.text.length;
              case "tool_use":
                return acc + c.name.length + JSON.stringify(c.input).length;
              case "thinking":
                return acc + c.thinking.length;
              case "tool_result":
                const resultLength = c.content
                  .filter((c) => c.type === "text")
                  .reduce((acc, c) => acc + c.text.length, 0);
                return acc + c.toolUseName.length + resultLength;
            }
          }, 0);
          return contentLength + acc;
        }, 0) / 4;

      return ok(Math.floor(tokens));
    } catch (error) {
      return err("model_error", "Failed to count tokens", error);
    }
  }

  maxTokens(): number {
    switch (this.model) {
      case "llama3.1-8b":
        return 8000;
      case "llama-3.3-70b":
        return 64000;
      case "gpt-oss-120b":
        return 128000;
      case "qwen-3-32b":
        return 64000;
      default:
        assertNever(this.model);
    }
  }
}
