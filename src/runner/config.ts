import { NonDefaultToolName } from "@app/tools/constants";
import { ThinkingConfig } from "@app/models";

export type RunConfig = {
  reviewers: number;
  tools: NonDefaultToolName[];
  thinking: ThinkingConfig;
};
