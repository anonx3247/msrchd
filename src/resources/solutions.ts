import { db } from "@app/db";
import { solutions } from "@app/db/schema";
import { eq, InferSelectModel, InferInsertModel, and, desc } from "drizzle-orm";
import { ExperimentResource } from "./experiment";
import { concurrentExecutor } from "@app/lib/async";
import { PublicationResource } from "./publication";
import { removeNulls } from "@app/lib/utils";

type Solution = InferSelectModel<typeof solutions>;

export class SolutionResource {
  private data: Solution;
  private publication: PublicationResource;
  experiment: ExperimentResource;

  private constructor(
    data: Solution,
    experiment: ExperimentResource,
    publication: PublicationResource,
  ) {
    this.data = data;
    this.experiment = experiment;
    this.publication = publication;
  }

  static async findLatestByAgent(
    experiment: ExperimentResource,
    agentIndex: number,
  ): Promise<SolutionResource | null> {
    const [result] = await db
      .select()
      .from(solutions)
      .where(
        and(
          eq(solutions.experiment, experiment.toJSON().id),
          eq(solutions.agent, agentIndex),
        ),
      )
      .orderBy(desc(solutions.created))
      .limit(1);

    if (!result) {
      return null;
    }

    const publication = await PublicationResource.findById(
      experiment,
      result.publication,
    );
    if (!publication) {
      return null;
    }

    return new SolutionResource(result, experiment, publication);
  }

  static async listByAgent(
    experiment: ExperimentResource,
    agentIndex: number,
  ): Promise<SolutionResource[]> {
    const results = await db
      .select()
      .from(solutions)
      .where(
        and(
          eq(solutions.experiment, experiment.toJSON().id),
          eq(solutions.agent, agentIndex),
        ),
      )
      .orderBy(desc(solutions.created));

    return removeNulls(
      await concurrentExecutor(
        results,
        async (sol) => {
          const publication = await PublicationResource.findById(
            experiment,
            sol.publication,
          );
          if (!publication) {
            return null;
          }
          return new SolutionResource(sol, experiment, publication);
        },
        { concurrency: 8 },
      ),
    );
  }

  static async listByExperiment(
    experiment: ExperimentResource,
  ): Promise<SolutionResource[]> {
    const results = await db
      .select()
      .from(solutions)
      .where(and(eq(solutions.experiment, experiment.toJSON().id)))
      .orderBy(desc(solutions.created));

    return removeNulls(
      await concurrentExecutor(
        results,
        async (sol) => {
          const publication = await PublicationResource.findById(
            experiment,
            sol.publication,
          );
          if (!publication) {
            return null;
          }
          return new SolutionResource(sol, experiment, publication);
        },
        { concurrency: 8 },
      ),
    );
  }

  static async create(
    experiment: ExperimentResource,
    agentIndex: number,
    publication: PublicationResource,
    data: Omit<
      InferInsertModel<typeof solutions>,
      "id" | "created" | "updated" | "experiment" | "agent" | "publication"
    >,
  ): Promise<SolutionResource> {
    const [created] = await db
      .insert(solutions)
      .values({
        ...data,
        experiment: experiment.toJSON().id,
        agent: agentIndex,
        publication: publication.toJSON().id,
      })
      .returning();

    return new SolutionResource(created, experiment, publication);
  }

  toJSON() {
    return {
      ...this.data,
      publication: this.publication.toJSON(),
    };
  }
}
