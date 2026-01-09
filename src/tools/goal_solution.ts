import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { errorToCallToolResult } from "@app/lib/mcp";
import { PublicationResource } from "@app/resources/publication";
import { ExperimentResource } from "@app/resources/experiment";
import { err } from "@app/lib/error";
import { SolutionResource } from "@app/resources/solutions";
import { GOAL_SOLUTION_SERVER_NAME as SERVER_NAME } from "@app/tools/constants";

const SERVER_VERSION = "0.1.0";

export async function createGoalSolutionServer(
  experiment: ExperimentResource,
  agentIndex: number,
): Promise<McpServer> {
  const server = new McpServer({
    name: SERVER_NAME,
    title:
      "Research goal solution reporting: Tools to report that a publication is the current best solution to the research goal.",
    version: SERVER_VERSION,
  });

  server.tool(
    "report",
    "Report belief that a publication is the curent best/valid solution towards the research goal.",
    {
      publication: z
        .string()
        .describe("The reference of the publication."),
    },
    async ({ publication: reference }) => {
      const publication = await PublicationResource.findByReference(
        experiment,
        reference,
      );

      if (!publication) {
        return errorToCallToolResult(
          err("not_found_error", "Publication not found"),
        );
      }
      if (publication.toJSON().status !== "PUBLISHED") {
        return errorToCallToolResult(
          err("invalid_parameters_error", "Publication is not published"),
        );
      }

      const voteResult = await SolutionResource.vote(
        experiment.toJSON().id,
        agentIndex,
        publication.toJSON().id,
      );

      if (voteResult.isErr()) {
        return errorToCallToolResult(voteResult);
      }

      return {
        isError: false,
        content: [
          {
            type: "text",
            text: `Successfully reported.`,
          },
        ],
      };
    },
  );

  return server;
}
