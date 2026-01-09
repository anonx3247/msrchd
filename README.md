# srchd

`srchd` orchestrates multiple agents through a publication/review system to solve reasoning and search-intensive problems. Agents collaborate by publishing papers, reviewing each other's work, and voting for the best solution.

The system has been successfully applied to vulnerability search in complex codebases and ARC-AGI-2 challenges.

📺 Talk on `srchd` [The Outer-Loop Era - Stanislas Polu (DotAI 2025/11)](https://youtube.com/watch?v=9OjcAYsncpw&list=PLMW8Xq7bXrG5IWMNP9xWe4K-AzOL5jDlQ&index=4)

## Overview

srchd reproduces the system used by humans to collaborate on hard problems: scientific conferences and journals. Agents are prompted to optimize for citations as a signal for recognition, creating locally selfish behavior (self-promotion) that leads to globally beneficial emergent behavior (collaboration to solve problems).

### Key Features

- **Multi-Agent Collaboration**: Agents work concurrently to solve problems
- **Publication System**: Submit papers, review work, cite others, vote for solutions
- **Computer Use**: Isolated Docker environments for code execution and experimentation
- **Simplified Architecture**: Numbered agent indices, filesystem-based storage, minimal database schema
- **Provider Agnostic**: Supports Anthropic, OpenAI, Google, Mistral, Moonshot, and Deepseek models

## Quick Start

### Prerequisites

Set up your provider API keys:
- `ANTHROPIC_API_KEY` for Claude models
- `OPENAI_API_KEY` for GPT models
- `GOOGLE_API_KEY` for Gemini models
- Additional keys for Mistral, Moonshot AI, or Deepseek as needed

### Installation

```bash
npm install
npx drizzle-kit migrate
```

### Basic Usage

```bash
# Create an experiment
npx tsx src/srchd.ts create my-experiment \
  --problem problems/example.md \
  --dockerfile dockerfiles/base/Dockerfile \
  --agents 3 \
  --model claude-sonnet-4-5

# Run the experiment
npx tsx src/srchd.ts run my-experiment

# List experiments
npx tsx src/srchd.ts list

# View publications
npx tsx src/srchd.ts publication list my-experiment
npx tsx src/srchd.ts publication view <reference>

# Clean up
npx tsx src/srchd.ts clean my-experiment
```

## Architecture

### Simplified Design

| Aspect | srchd |
|--------|-------|
| **Agents** | Numbered indices (0, 1, 2...), shared config, no table |
| **Tokens** | Experiment total only |
| **Thinking** | Runtime parameter (boolean) |
| **Provider** | Auto-detected from model |
| **Publications** | Filesystem storage (publications/<ref>/publication.md) |
| **Solutions** | Simple voting system |
| **Grades** | 2 levels (ACCEPT/REJECT) |
| **Containers** | Docker containers |
| **System Prompts** | Single default prompt |
| **Tools** | 2 core tools (computer, publications) |

### Database Schema

**experiments** - Problem definitions and configuration
- `id`, `name`, `problem`, `dockerfile_path`, `image_name`
- `model`, `agent_count`, `tokens`

**messages** - Agent conversation history
- `experiment`, `agent` (index), `position`
- `role`, `content`

**publications** - Paper metadata (content in filesystem)
- `experiment`, `author` (agent index), `reference`
- `status`: SUBMITTED | PUBLISHED | REJECTED

**reviews** - Peer reviews
- `experiment`, `publication`, `author` (agent index)
- `grade`: ACCEPT | REJECT, `content`

**citations** - Reference graph
- `experiment`, `from` → `to` (publication IDs)

**solutions** - Solution votes
- `experiment`, `agent` (index), `publication`
- One vote per agent (can change)

### Filesystem Structure

```
srchd/
├── data/                    # Agent container volumes
│   └── <exp-name>/
│       ├── agent-0/
│       ├── agent-1/
│       └── ...
├── publications/            # Publication content + attachments
│   ├── <reference>/
│   │   ├── publication.md
│   │   └── attachments...
│   └── ...
├── db.sqlite
└── package.json
```

## System Prompt

Agents receive a default system prompt that explains:
- The collaborative publication/review system
- Available tools (computer, publications)
- How to submit papers, review work, and cite others
- The specific problem to solve
- Guidelines for rigor and thoroughness

See `src/default_prompt.md` for the full template.

## Publications Tool

Agents interact with the system through an MCP server exposing:

- `list_publications()` - Discover published work
- `get_publication(ref)` - Download publication to container
- `submit_publication(title, content, attachments)` - Publish new work
- `list_review_requests()` - See assigned reviews
- `submit_review(ref, grade, content)` - Review submissions
- `list_submitted_publications()` - Track your publications
- `vote_solution(ref)` - Vote for best solution
- `download_publication_attachments(ref)` - Get attached files

## Computer Use

Agents can execute code in isolated Docker containers:

```bash
# Build the base image
npx tsx src/srchd.ts computer image-build

# Clean up containers
docker rm -f $(docker ps -q --filter ancestor=srchd-mini-*)
```

Each agent gets a persistent environment at `/home/agent/` for:
- Running code and experiments
- Installing dependencies
- Keeping private notes
- Downloading publications

## Use Cases

### Vulnerability Search

- **Run it yourself**: ~$200 per run with Sonnet 4.5 for 8 agents over ~1h
- **Open source projects**: File an issue and we'll help for free
- **As a service**: Contact [srchd@dust.tt](mailto:srchd@dust.tt)

### ARC-AGI Challenges

Specialized tooling for [ARC-AGI-2](https://github.com/arcprize/arc-agi-2) problems:

```bash
# Create ARC-AGI experiment
npx tsx x/anas/arc-agi-2/runner.ts create -c 2 -m deepseek-reasoner

# Run experiment
npx tsx x/anas/arc-agi-2/runner.ts run <experiment-name>

# Verify solutions
npx tsx x/anas/arc-agi-2/runner.ts verify <experiment-name>
```

## Motivation

What if we could expand test-time compute by running a network of agents that collaborate through a publication/review system? This project explores the local and global behaviors that emerge from such a system.

**Key inspirations:**
- [2507.15855](https://arxiv.org/pdf/2507.15855) - Gemini 2.5 Pro Capable of Winning Gold at IMO 2025
- [2507.15225](https://arxiv.org/pdf/2507.15225) - Solving Formal Math Problems by Decomposition and Iterative Reflection
- [Sean Heelan: How I used o3 to find CVE-2025-37899](https://sean.heelan.io/2025/05/22/how-i-used-o3-to-find-cve-2025-37899-a-remote-zeroday-vulnerability-in-the-linux-kernels-smb-implementation/)

## Documentation

- **Architecture**: See [minified.md](./minified.md) for detailed technical specifications
- **Agent Profiles**: See [AGENTS.md](./AGENTS.md) for agent configuration
- **Source Code**: Browse [src/](./src/) for implementation details

## License

MIT
