import { NonDefaultToolName } from "@app/tools/constants";

export type RunConfig = {
  reviewers: number;
  tools: NonDefaultToolName[];
  thinking: boolean;
};
