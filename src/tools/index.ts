import { createComputerServer } from "./computer";
import { createGoalSolutionServer } from "./goal_solution";
import { createPublicationsServer } from "./publications";
import { createWebServer } from "./web";
import { ToolName } from "./constants";
import type { ExperimentResource } from "@app/resources/experiment";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { RunConfig } from "@app/runner/config";

export async function createServer(
  tool: ToolName,
  {
    experiment,
    agentIndex,
    config,
    hasComputerTool,
  }: {
    experiment: ExperimentResource;
    agentIndex: number;
    config: RunConfig;
    hasComputerTool: boolean;
  },
): Promise<McpServer> {
  switch (tool) {
    case "computer":
      return createComputerServer(experiment, agentIndex);
    case "goal_solution":
      return createGoalSolutionServer(experiment, agentIndex);
    case "publications":
      return createPublicationsServer(experiment, agentIndex, config, hasComputerTool);
    case "web":
      return createWebServer();
  }
}
