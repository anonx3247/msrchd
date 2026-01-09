import { and, eq, sum } from "drizzle-orm";
import { token_usages } from "@app/db/schema";
import { MessageResource } from "./messages";
import { db, Tx } from "@app/db";
import { TokenUsage } from "@app/models/index";
import { ExperimentResource } from "./experiment";
import { createLLM } from "@app/models/provider";

export class TokenUsageResource {
  static async experimentTokenUsage(
    experiment: ExperimentResource,
  ): Promise<TokenUsage> {
    const results = await db
      .select({
        total: sum(token_usages.total),
        input: sum(token_usages.input),
        output: sum(token_usages.output),
        cached: sum(token_usages.cached),
        thinking: sum(token_usages.thinking),
      })
      .from(token_usages)
      .where(eq(token_usages.experiment, experiment.toJSON().id));

    return {
      total: Number(results[0].total),
      input: Number(results[0].input),
      output: Number(results[0].output),
      cached: Number(results[0].cached),
      thinking: Number(results[0].thinking),
    };
  }

  static async agentTokenUsage(
    experiment: ExperimentResource,
    agentIndex: number,
  ): Promise<TokenUsage> {
    const results = await db
      .select({
        total: sum(token_usages.total),
        input: sum(token_usages.input),
        output: sum(token_usages.output),
        cached: sum(token_usages.cached),
        thinking: sum(token_usages.thinking),
      })
      .from(token_usages)
      .where(
        and(
          eq(token_usages.experiment, experiment.toJSON().id),
          eq(token_usages.agent, agentIndex),
        ),
      );

    return {
      total: Number(results[0].total),
      input: Number(results[0].input),
      output: Number(results[0].output),
      cached: Number(results[0].cached),
      thinking: Number(results[0].thinking),
    };
  }

  /**
   * Calculate total cost for an experiment across all agents
   * All agents in an experiment use the same model
   */
  static async experimentCost(
    experiment: ExperimentResource,
  ): Promise<number> {
    const usage = await this.experimentTokenUsage(experiment);
    const llm = createLLM(experiment.toJSON().model);
    return llm.cost([usage]);
  }

  static async logUsage(
    experiment: ExperimentResource,
    agentIndex: number,
    message: MessageResource,
    tokenUsage: TokenUsage,
    options?: { tx?: Tx },
  ): Promise<void> {
    const executor = options?.tx ?? db;
    const [_created] = await executor
      .insert(token_usages)
      .values({
        experiment: experiment.toJSON().id,
        agent: agentIndex,
        message: message.toJSON().id,
        total: tokenUsage.total,
        input: tokenUsage.input,
        output: tokenUsage.output,
        cached: tokenUsage.cached,
        thinking: tokenUsage.thinking,
      })
      .returning();
  }
}
