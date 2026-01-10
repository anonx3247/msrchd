#!/usr/bin/env node

import { Command } from "commander";
import { readFileContent } from "./lib/fs";
import { Err, err, SrchdError } from "./lib/error";
import { ExperimentResource } from "./resources/experiment";
import { Runner } from "./runner";
import { isArrayOf, isString, removeNulls } from "./lib/utils";
import { isThinkingConfig } from "./models";
import { buildComputerImage } from "./computer/image";
import { computerId, Computer } from "./computer";
import { TokenUsageResource } from "./resources/token_usage";
import { PublicationResource } from "./resources/publication";
import {
  getPublicationContent,
  publicationHeader,
  reviewHeader,
} from "./tools/publications";
import { Model, isModel } from "./models/provider";
import fs from "fs";
import path from "path";

const exitWithError = (err: Err<SrchdError>) => {
  console.error(
    `\x1b[31mError [${err.error.code}] ${err.error.message}\x1b[0m`,
  );
  if (err.error.cause) {
    console.error(`\x1b[31mCause: ${err.error.cause.message}\x1b[0m`);
  }
  process.exit(1);
};

const DEFAULT_AGENT_COUNT = 0;
const DEFAULT_MODEL: Model = "claude-sonnet-4-5";
const DEFAULT_THINKING = "low";

const program = new Command();

program
  .name("srchd")
  .description("Research experiment management CLI")
  .version("1.0.0");

// Experiment commands
const experimentCmd = program
  .command("experiment")
  .description("Manage experiments");

experimentCmd
  .command("create <name>")
  .description("Create a new experiment")
  .requiredOption(
    "-p, --problem <problem_file>",
    "Problem description file path",
  )
  .option(
    "-m, --model <model>",
    "AI model to use for all agents",
    DEFAULT_MODEL,
  )
  .option(
    "-n, --agent-count <count>",
    "Number of agents in the experiment",
    DEFAULT_AGENT_COUNT.toString(),
  )
  .option(
    "-d, --dockerfile <path>",
    "Optional path to Dockerfile for agent computer environment",
  )
  .action(async (name, options) => {
    console.log(`Creating experiment: ${name}`);

    // Read problem from file
    const problem = await readFileContent(options.problem);
    if (problem.isErr()) {
      return exitWithError(problem);
    }

    // Validate model
    if (!isModel(options.model)) {
      return exitWithError(
        err("invalid_parameters_error", `Invalid model: ${options.model}`),
      );
    }

    // Validate agent count
    const agentCount = parseInt(options.agentCount);
    if (isNaN(agentCount) || agentCount < 1) {
      return exitWithError(
        err(
          "invalid_parameters_error",
          "Agent count must be a positive integer",
        ),
      );
    }

    // Validate dockerfile if provided
    let dockerfilePath: string | undefined;
    if (options.dockerfile) {
      if (!fs.existsSync(options.dockerfile)) {
        return exitWithError(
          err("not_found_error", `Dockerfile not found: ${options.dockerfile}`),
        );
      }
      dockerfilePath = path.resolve(options.dockerfile);
    }

    const experiment = await ExperimentResource.create({
      name,
      problem: problem.value,
      model: options.model,
      agent_count: agentCount,
      dockerfile_path: dockerfilePath,
    });

    const e = experiment.toJSON();
    e.problem =
      e.problem.substring(0, 32) + (e.problem.length > 32 ? "..." : "");
    console.table([e]);
  });

experimentCmd
  .command("list")
  .description("List all experiments")
  .action(async () => {
    const experiments = await ExperimentResource.all();

    if (experiments.length === 0) {
      return exitWithError(err("not_found_error", "No experiments found."));
    }

    console.table(
      experiments.map((exp) => {
        const e = exp.toJSON();
        e.problem =
          e.problem.substring(0, 32) + (e.problem.length > 32 ? "..." : "");
        return e;
      }),
    );
  });


// Run command - runs all agents in an experiment
program
  .command("run <experiment>")
  .description("Run all agents in an experiment")
  .option("-p, --path <path...>", "Add a file or directory to the computer")
  .option(
    "-t, --tick <agent>",
    "Run one tick for a specific agent (by index)",
  )
  .option("--max-cost <cost>", "Max cost (in dollars) before stopping run")
  .option(
    "--thinking <thinking>",
    "Thinking configuration (none | low | high)",
    DEFAULT_THINKING,
  )
  .option("--no-computer", "Disable computer tool (enabled by default)")
  .option("--no-web", "Disable web tool (enabled by default)")
  .action(async (experimentName, options) => {
    // Find experiment
    const experimentRes = await ExperimentResource.findByName(experimentName);
    if (experimentRes.isErr()) {
      return exitWithError(experimentRes);
    }
    const experiment = experimentRes.value;
    const agentCount = experiment.toJSON().agent_count;

    // Calculate reviewers: 4 unless we have less than 5 agents
    const reviewers = agentCount >= 5 ? 4 : agentCount - 1;

    // Parse thinking
    if (!isThinkingConfig(options.thinking)) {
      return exitWithError(
        err(
          "invalid_parameters_error",
          `Invalid thinking config: ${options.thinking}`,
        ),
      );
    }

    // Determine tools: computer and web are enabled by default
    const tools: string[] = [];
    if (options.computer !== false) {
      tools.push("computer");
    }
    if (options.web !== false) {
      tools.push("web");
    }

    // Determine which agents to run
    const agentIndices: number[] = [];

    if (options.tick !== undefined) {
      // Run single tick for specific agent
      const agentIndex = parseInt(options.tick);
      if (isNaN(agentIndex) || agentIndex < 0 || agentIndex >= agentCount) {
        return exitWithError(
          err(
            "invalid_parameters_error",
            `Invalid agent index: ${options.tick}. Must be between 0 and ${agentCount - 1}`,
          ),
        );
      }
      agentIndices.push(agentIndex);
    } else {
      // Run all agents
      for (let i = 0; i < agentCount; i++) {
        agentIndices.push(i);
      }
    }

    // Build Docker image if computer tool is enabled
    const hasComputer = tools.includes("computer");
    if (hasComputer) {
      const experimentData = experiment.toJSON();
      console.log("Building Docker image for computer environment...");
      const buildRes = await buildComputerImage(
        null, // No SSH key for now
        experimentData.dockerfile_path ?? undefined,
        experimentData.image_name ?? undefined,
      );
      if (buildRes.isErr()) {
        return exitWithError(buildRes);
      }
      console.log("Docker image built successfully.");
    }

    // Copy paths to computers if specified
    if (options.path && isArrayOf(options.path, isString)) {
      if (!hasComputer) {
        return exitWithError(
          err(
            "invalid_parameters_error",
            "Cannot copy paths without computer tool enabled",
          ),
        );
      }

      for (const agentIndex of agentIndices) {
        for (const pathStr of options.path) {
          const res = await Computer.copyToComputer(
            computerId(experiment, agentIndex),
            pathStr,
          );
          if (res.isErr()) {
            return exitWithError(res);
          }
        }
      }
    }

    // Parse max cost
    let maxCost: number | undefined;
    if (options.maxCost) {
      maxCost = parseFloat(options.maxCost);
      if (isNaN(maxCost) || maxCost < 0) {
        return exitWithError(
          err(
            "invalid_parameters_error",
            "Max cost must be a valid number greater than 0",
          ),
        );
      }
    }

    // Build runners for all agents
    const builders = await Promise.all(
      agentIndices.map((agentIndex) =>
        Runner.builder(experiment, agentIndex, {
          reviewers,
          tools: tools as any,
          thinking: options.thinking,
        }),
      ),
    );
    for (const res of builders) {
      if (res.isErr()) {
        return exitWithError(res);
      }
    }
    const runners = removeNulls(
      builders.map((res) => {
        if (res.isOk()) {
          return res.value;
        }
        return null;
      }),
    );

    // Run single tick if specified
    if (options.tick !== undefined) {
      const tickResults = await Promise.all(runners.map((r) => r.tick()));
      for (const tick of tickResults) {
        if (tick.isErr()) {
          return exitWithError(tick);
        }
      }
      return;
    }

    // Check every 20 ticks except when near the max value
    const shouldCheck = (
      tickCount: number,
      lastVal: number,
      maxVal: number,
    ): boolean => (lastVal / maxVal) < 0.95 ? tickCount % 20 === 0 : true;

    let tickCount = 0;
    let lastCost = await TokenUsageResource.experimentCost(experiment);

    // For continuous running, start each agent in its own independent loop
    const runnerPromises = runners.map(async (runner) => {
      while (true) {
        if (maxCost && shouldCheck(tickCount, lastCost, maxCost)) {
          lastCost = await TokenUsageResource.experimentCost(experiment);
          if (lastCost > maxCost) {
            console.log(`Cost exceeded: ${lastCost.toFixed(2)}`);
            process.exit(0);
          }
        }

        const tick = await runner.tick();
        tickCount++;
        if (tick.isErr()) {
          // eslint-disable-next-line
          throw tick;
        }
      }
    });

    // Wait for any agent to fail, then exit
    try {
      await Promise.all(runnerPromises);
    } catch (error) {
      return exitWithError(error as any);
    }
  });

// Publication commands
const publicationCmd = program
  .command("publication")
  .description("Manage publications");

publicationCmd
  .command("list <experiment>")
  .description("List publications for an experiment")
  .option(
    "-s, --status <status>",
    "Filter by status (PUBLISHED, SUBMITTED, REJECTED)",
    "PUBLISHED",
  )
  .option(
    "-o, --order <order>",
    "Order by (latest, citations)",
    "latest",
  )
  .option("-l, --limit <limit>", "Maximum number to return", "10")
  .option("--offset <offset>", "Offset for pagination", "0")
  .action(async (experimentName, options) => {
    const experimentRes = await ExperimentResource.findByName(experimentName);
    if (experimentRes.isErr()) {
      return exitWithError(experimentRes);
    }

    const status = options.status.toUpperCase();
    if (
      status !== "PUBLISHED" &&
      status !== "SUBMITTED" &&
      status !== "REJECTED"
    ) {
      return exitWithError(
        err(
          "invalid_parameters_error",
          "Status must be PUBLISHED, SUBMITTED, or REJECTED",
        ),
      );
    }

    const order = options.order;
    if (order !== "latest" && order !== "citations") {
      return exitWithError(
        err(
          "invalid_parameters_error",
          "Order must be 'latest' or 'citations'",
        ),
      );
    }

    const limit = parseInt(options.limit);
    const offset = parseInt(options.offset);

    if (isNaN(limit) || limit < 1) {
      return exitWithError(
        err("invalid_parameters_error", "Limit must be a positive integer"),
      );
    }

    if (isNaN(offset) || offset < 0) {
      return exitWithError(
        err(
          "invalid_parameters_error",
          "Offset must be a non-negative integer",
        ),
      );
    }

    const publications =
      await PublicationResource.listPublishedByExperiment(
        experimentRes.value,
        {
          order: order as "latest" | "citations",
          status: status as "PUBLISHED" | "SUBMITTED" | "REJECTED",
          limit,
          offset,
        },
      );

    if (publications.length === 0) {
      console.log("No publications found.");
      return;
    }

    for (const pub of publications) {
      console.log(publicationHeader(pub));
      console.log("");
    }
  });

publicationCmd
  .command("view <experiment> <reference>")
  .description("View a specific publication")
  .action(async (experimentName, reference) => {
    const experimentRes = await ExperimentResource.findByName(experimentName);
    if (experimentRes.isErr()) {
      return exitWithError(experimentRes);
    }

    const publication = await PublicationResource.findByReference(
      experimentRes.value,
      reference,
    );
    if (!publication) {
      return exitWithError(
        err("not_found_error", `Publication not found: ${reference}`),
      );
    }

    const content = getPublicationContent(reference);
    if (!content) {
      return exitWithError(
        err("not_found_error", "Publication content not found"),
      );
    }

    console.log(publicationHeader(publication));
    console.log("");
    console.log(content);

    const pubData = publication.toJSON();
    if (pubData.status === "PUBLISHED") {
      console.log("");
      console.log("=".repeat(80));
      console.log("REVIEWS:");
      console.log("=".repeat(80));
      for (const review of pubData.reviews) {
        console.log("");
        console.log(reviewHeader(review));
        console.log("");
        console.log(review.content);
        console.log("-".repeat(80));
      }
    }
  });

program.parse();
