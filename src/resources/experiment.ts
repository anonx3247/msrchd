import { db } from "@app/db";
import { experiments } from "@app/db/schema";
import { err, ok, Result } from "@app/lib/error";
import { eq, InferSelectModel, InferInsertModel } from "drizzle-orm";
import { createLLM } from "@app/models/provider";

type Experiment = InferSelectModel<typeof experiments>;

export class ExperimentResource {
  private data: Experiment;

  private constructor(data: Experiment) {
    this.data = data;
  }

  static async findByName(name: string): Promise<Result<ExperimentResource>> {
    const result = await db
      .select()
      .from(experiments)
      .where(eq(experiments.name, name))
      .limit(1);

    return result[0]
      ? ok(new ExperimentResource(result[0]))
      : err("not_found_error", `Experiment '${name}' not found.`);
  }

  static async findById(id: number): Promise<ExperimentResource | null> {
    const result = await db
      .select()
      .from(experiments)
      .where(eq(experiments.id, id))
      .limit(1);

    return result[0] ? new ExperimentResource(result[0]) : null;
  }

  static async create(
    data: Omit<
      InferInsertModel<typeof experiments>,
      "id" | "created" | "updated"
    >,
  ): Promise<ExperimentResource> {
    const [created] = await db.insert(experiments).values(data).returning();
    return new ExperimentResource(created);
  }

  static async all(): Promise<ExperimentResource[]> {
    const results = await db.select().from(experiments);
    return results.map((data) => new ExperimentResource(data));
  }

  async update(
    data: Partial<Omit<InferInsertModel<typeof experiments>, "id" | "created">>,
  ): Promise<ExperimentResource> {
    const [updated] = await db
      .update(experiments)
      .set({ ...data, updated: new Date() })
      .where(eq(experiments.id, this.data.id))
      .returning();

    this.data = updated;
    return this;
  }

  async delete(): Promise<void> {
    await db.delete(experiments).where(eq(experiments.id, this.data.id));
  }

  toJSON() {
    return this.data;
  }

  getAgentIndices(): number[] {
    return Array.from({ length: this.data.agent_count }, (_, i) => i);
  }

  async addTokens(amount: number): Promise<void> {
    const [updated] = await db
      .update(experiments)
      .set({
        tokens: this.data.tokens + amount,
        updated: new Date(),
      })
      .where(eq(experiments.id, this.data.id))
      .returning();

    this.data = updated;
  }

  async getTotalCost(): Promise<number> {
    const llm = createLLM(this.data.model);
    return llm.cost([
      {
        total: this.data.tokens,
        input: 0,
        output: 0,
        cached: 0,
        thinking: 0,
      },
    ]);
  }
}
