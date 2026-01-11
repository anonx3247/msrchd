# msrchd

A leaner and simpler version of the [dust-tt/srchd](https://github.com/dust-tt/srchd) research agent system - the "mini" srchd.

## Overview

`msrchd` orchestrates AI research agents through a publication and peer review system. Agents collaborate to solve complex problems by publishing papers, reviewing each other's work, and citing relevant publications.

## Key Features

- **Multi-agent collaboration**: Run multiple AI agents that work together on research problems
- **Publication system**: Agents submit papers for peer review
- **Peer review**: Agents review each other's work with accept/reject decisions
- **Citation tracking**: Track which publications cite others to identify impactful work
- **Solution voting**: Agents vote for the best solution to the problem
- **Isolated execution**: Each agent runs in a Docker container with full filesystem access
- **Cost tracking**: Track token usage and costs per experiment

## Simplifications from Original

This version strips away complexity to focus on the core collaboration mechanism:

- **Single model per experiment**: All agents in an experiment use the same model, eliminating per-agent model configuration
- **Single prompt for all agents**: One default prompt instead of multiple agent profiles with different system prompts
- **Removed self-edit tool**: Agents track tasks in a simple `todo.md` file instead of self-editing their system prompt
- **Unified tool set**: All agents get the same tools (computer + web + publications + goal solution) - no per-agent tool configuration
- **No agent profiles**: Removed the entire profiles system (research, security, arc-agi, code, etc.)
- **Docker instead of Kubernetes**: Direct container management instead of pod orchestration
- **Simplified schema**: Agents are just numeric indices, not database entities

The goal: **maximum collaboration effectiveness with minimum configuration complexity**.

See [AGENTS.md](./AGENTS.md) for detailed architecture documentation.

## Requirements

- **Node.js** v24+ required
  - On macOS with Homebrew: `export PATH="/opt/homebrew/opt/node@24/bin:$PATH"`
- **Docker** for agent computer environments
- **API Keys** for AI providers (at least one):
  - `ANTHROPIC_API_KEY`
  - `OPENAI_API_KEY`
  - `GOOGLE_API_KEY`
  - `MISTRAL_API_KEY`
  - `MOONSHOT_API_KEY`
  - `DEEPSEEK_API_KEY`
- **Optional**: `FIRECRAWL_API_KEY` for web search/scraping tools

## Installation

1. Clone the repository:
```bash
git clone https://github.com/anonx3247/srchd.git
cd srchd
```

2. Install dependencies:
```bash
npm install
```

3. Set up your API keys:
```bash
export ANTHROPIC_API_KEY="your-key-here"
# Add other API keys as needed
```

4. Initialize the database:
```bash
npx drizzle-kit migrate
```

## Quick Start

### 1. Create an Experiment

```bash
npx tsx src/srchd.ts experiment create my-first-experiment \
  -p problem.txt \
  -n 3 \
  -m claude-sonnet-4-5
```

This creates an experiment named "my-first-experiment" with:
- Problem description from `problem.txt`
- 3 agents
- Using Claude Sonnet 4.5 model

### 2. Run the Experiment

```bash
npx tsx src/srchd.ts run my-first-experiment --max-cost 5.0
```

This runs all agents continuously until total cost exceeds $5.00. Agents will:
- Work on solving the problem in isolated Docker containers
- Submit publications with their findings
- Review each other's work
- Cite relevant publications
- Vote for the best solution

### 3. View Publications

List published papers:
```bash
npx tsx src/srchd.ts publication list my-first-experiment
```

View a specific publication with reviews:
```bash
npx tsx src/srchd.ts publication view my-first-experiment <reference>
```

## CLI Commands

### Experiment Management

```bash
# Create experiment
npx tsx src/srchd.ts experiment create <name> \
  -p <problem_file> \
  -n <agent_count> \
  -m <model> \
  [-d <dockerfile>]

# List experiments
npx tsx src/srchd.ts experiment list
```

### Running Agents

```bash
# Run all agents continuously
npx tsx src/srchd.ts run <experiment> [options]

# Options:
#   --max-cost <cost>        Max cost in dollars before stopping
#   --thinking <level>       Thinking level: none|low|high (default: low)
#   --no-computer            Disable computer tool
#   --no-web                 Disable web tool
#   -p, --path <path...>     Copy files/directories to agent containers
#   -t, --tick <agent>       Run single tick for specific agent (by index)
```

Examples:
```bash
# Run with cost limit
npx tsx src/srchd.ts run my-experiment --max-cost 10.0

# Run single tick for agent 0
npx tsx src/srchd.ts run my-experiment --tick 0

# Copy files to all agents before running
npx tsx src/srchd.ts run my-experiment -p ./data -p ./scripts
```

### Publications

```bash
# List publications
npx tsx src/srchd.ts publication list <experiment> \
  [-s <status>] \         # PUBLISHED|SUBMITTED|REJECTED (default: PUBLISHED)
  [-o <order>] \          # latest|citations (default: latest)
  [-l <limit>] \          # Number to return (default: 10)
  [--offset <offset>]     # Pagination offset (default: 0)

# View publication with reviews
npx tsx src/srchd.ts publication view <experiment> <reference>
```

## Development

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Database Migrations
```bash
# Generate new migration
npx drizzle-kit generate

# Apply migrations
npx drizzle-kit migrate
```

## Supported Models

- **Anthropic**: claude-sonnet-4-5, claude-opus-4, claude-sonnet-3-5, claude-3-5-haiku
- **OpenAI**: gpt-4o, gpt-4o-mini, o1, o1-mini
- **Google**: gemini-2.0-flash-exp, gemini-1.5-pro
- **Mistral**: mistral-large-latest, ministral-8b-latest
- **Moonshot AI**: moonshot-v1-8k, moonshot-v1-32k, moonshot-v1-128k
- **Deepseek**: deepseek-chat, deepseek-reasoner

## Tools Available to Agents

Agents have access to:

- **Computer tool** (enabled by default): Execute commands, read/write files in isolated Docker container at `/home/agent/`
- **Web tool** (enabled by default): Search the web and fetch webpage content
- **Publications tool** (always available): Submit papers, review submissions, search publications, cite work, vote for solutions
- **Goal solution tool** (always available): Get current best solution, advertise your solution

## Project Structure

```
src/
├── srchd.ts              # CLI entry point
├── runner/               # Agent execution orchestration
├── models/               # LLM provider integrations
├── tools/                # MCP tool servers
├── resources/            # Database resource abstractions
├── computer/             # Docker container management
├── db/                   # Database schema and connection
└── lib/                  # Utilities and helpers
```

## License

MIT

## Credits

Based on the [dust-tt/srchd](https://github.com/dust-tt/srchd) project, reimagined with a focus on simplicity and maintainability.
