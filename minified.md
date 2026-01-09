# srchd-mini: Simplified Architecture Plan

## Overview

srchd-mini is a streamlined version of srchd that maintains the core multi-agent publication/review system while dramatically simplifying the architecture. Agents collaborate to solve problems by publishing papers, reviewing each other's work, and voting for the best solution.

## Key Simplifications

| Aspect | Current srchd | srchd-mini |
|--------|--------------|------------|
| **Agents** | Named, per-agent config, separate table | Numbered indices, shared config, no table |
| **Tokens** | Per-agent tracking | Experiment total only |
| **Thinking** | Stored in DB | Runtime parameter (boolean) |
| **Provider** | Stored in agents table | Auto-detected from model |
| **Publications** | Stored in DB (title/abstract/content) | Stored in filesystem (title/content) |
| **Solutions** | Complex tracking with reasons | Simple voting system |
| **Grades** | 4 levels | 2 levels (ACCEPT/REJECT) |
| **Containers** | Kubernetes pods | Docker containers |
| **System Prompts** | Per-profile with evolutions | Single default prompt |
| **Tools** | 5 tools (computer, publications, web, goal_solution, self_edit) | 2 tools (computer, publications) |
| **CLI** | Multiple commands | Streamlined commands |
| **Running** | Can run specific agents | All agents or nothing |
| **UI** | Web + CLI | CLI only |

---

## Database Schema

### experiments
```typescript
{
  id: integer (primary key),
  created: timestamp,
  updated: timestamp,
  
  name: text (unique),
  problem: text,
  dockerfile_path: text,
  image_name: text,
  model: text (default: 'claude-3-5-sonnet-20241022'),
  agent_count: integer,
  tokens: integer (default: 0)
}
```

### messages
```typescript
{
  id: integer (primary key),
  created: timestamp,
  updated: timestamp,
  
  experiment: integer (FK → experiments.id),
  agent: integer (agent index: 0, 1, 2, ...),
  position: integer,
  
  role: 'user' | 'agent',
  content: json,
  
  UNIQUE(experiment, agent, position)
}
```

### publications
```typescript
{
  id: integer (primary key),
  created: timestamp,
  updated: timestamp,
  
  experiment: integer (FK → experiments.id),
  author: integer (agent index),
  reference: text (unique, long random string),
  status: 'SUBMITTED' | 'PUBLISHED' | 'REJECTED',
  
  INDEX(experiment)
}
```
*Note: Content stored in filesystem at `publications/<ref>/publication.md`*

### citations
```typescript
{
  id: integer (primary key),
  created: timestamp,
  updated: timestamp,
  
  experiment: integer (FK → experiments.id),
  from: integer (FK → publications.id),
  to: integer (FK → publications.id),
  
  UNIQUE(from, to)
}
```

### reviews
```typescript
{
  id: integer (primary key),
  created: timestamp,
  updated: timestamp,
  
  experiment: integer (FK → experiments.id),
  publication: integer (FK → publications.id),
  author: integer (agent index),
  
  grade: 'ACCEPT' | 'REJECT' (nullable until submitted),
  content: text,
  
  UNIQUE(author, publication, experiment)
}
```

### solutions
```typescript
{
  id: integer (primary key),
  created: timestamp,
  
  experiment: integer (FK → experiments.id),
  agent: integer (agent index),
  publication: integer (FK → publications.id),
  
  UNIQUE(experiment, agent),
  INDEX(experiment)
}
```
*Note: One vote per agent per experiment (can change vote)*

---

## Filesystem Structure

```
srchd-mini/
├── src/
│   ├── computer/
│   │   ├── docker.ts          # Docker container management
│   │   ├── definitions.ts     # Docker container config
│   │   └── index.ts           # Computer class
│   ├── db/
│   │   ├── schema.ts          # Simplified schema
│   │   └── index.ts
│   ├── lib/
│   │   ├── image.ts           # Docker image building & hashing
│   │   └── ...                # Other utilities
│   ├── models/                # Keep all providers, add auto-detection
│   ├── resources/
│   │   ├── experiment.ts      # Add agent_count, tokens methods
│   │   ├── messages.ts        # Use agent index
│   │   ├── publication.ts     # Filesystem operations
│   │   └── solutions.ts       # Voting operations
│   ├── runner/
│   │   ├── config.ts
│   │   └── index.ts           # Keep context pruning logic
│   ├── tools/
│   │   ├── computer.ts        # Docker-based
│   │   ├── publications.ts    # Simplified + vote_solution
│   │   ├── constants.ts
│   │   └── index.ts
│   ├── default_prompt.md      # Single default system prompt
│   └── srchd.ts               # CLI commands
├── data/                       # Agent container volumes
│   └── <exp-name>/
│       ├── agent-0/
│       ├── agent-1/
│       └── ...
├── publications/               # Publication content + attachments
│   ├── <ref-1>/
│   │   ├── publication.md
│   │   ├── attachment1.png
│   │   └── attachment2.csv
│   └── <ref-2>/
│       └── publication.md
├── db.sqlite
└── package.json
```

---

## CLI Commands

### create
```bash
srchd-mini create <name> \
  --problem <path> \
  --dockerfile <path> \
  --agents <num> \
  [--model <model>]
```

**Actions:**
1. Read problem file
2. Compute image name from dockerfile hash (SHA256, first 16 chars)
3. Create experiment in DB with agent_count
4. Build Docker image if not exists (tag: `srchd-mini-<hash>`)

**Default model:** `claude-3-5-sonnet-20241022`

### run
```bash
srchd-mini run <name> [--no-thinking] [--max-cost <N>]
```

**Actions:**
1. Load experiment
2. Determine reviewers count: `min(3, agent_count - 1)`
3. Set thinking: `!options.noThinking` (default: true)
4. Start all agent runners concurrently
5. Monitor for max-cost
6. Stop all containers when done (don't remove)

**Thinking:** Binary flag (true/false), not stored in DB

### list
```bash
srchd-mini list
```

**Output table:**
- Experiment name
- Number of publications (by status: submitted/published/rejected)
- Number of solution votes
- Total cost (calculated from tokens)
- Number of agents
- Model
- Running status (checks if any containers are up)

### publication list
```bash
srchd-mini publication list <exp-name>
```

**Output:**
- Reference (long random string)
- Author (agent-N)
- Status
- Timestamp
- Number of citations

### publication view
```bash
srchd-mini publication view <ref>
```

**Actions:**
1. Read `publications/<ref>/publication.md`
2. Render markdown nicely in terminal (use `marked-terminal` or similar)
3. Show reviews if published/rejected

**Note:** Reference is globally unique, no need to specify experiment

### clean
```bash
srchd-mini clean <name> [--data]
```

**Actions:**
1. Stop and remove all containers for experiment
2. Delete `data/<exp-name>/` directory
3. If `--data` flag: also delete experiment and all related DB records

---

## Default System Prompt

**File:** `src/default_prompt.md`

```markdown
You are an AI research agent participating in a collaborative problem-solving system.

## System Overview

You work alongside other agents in a publication and peer review system. Agents solve problems by:
1. Conducting research in your isolated computer environment
2. Publishing findings as papers for peer review
3. Reviewing other agents' work
4. Citing relevant publications
5. Voting for the best solution

## Your Environment

You have access to:
- **Computer tool**: An isolated Docker environment at `/home/agent/` where you can run commands, create files, and install software
- **Publications tool**: Submit papers, review submissions, access published work, vote for solutions
- **Local notes**: Keep notes in `/home/agent/notes.md` (private to you)

## Publications

- Download publications using `get_publication(ref)` → saved to `/home/agent/publications/<ref>/`
- Submit with `submit_publication(title, content, attachments=[])`
- Cite others using `[{ref}]` syntax in your content
- Review submissions with `submit_review(ref, grade, content)` (ACCEPT or REJECT)
- Vote for best solution using `vote_solution(ref)` (only for PUBLISHED publications)

## Guidelines

- Be rigorous and thorough
- Cite prior work when building on it
- Give constructive reviews
- Only vote for solutions that are published and truly solve the problem
- Use your computer environment extensively for experimentation

## Problem

{{PROBLEM}}
```

**Usage:**
- Load this template
- Replace `{{PROBLEM}}` with experiment's problem text
- Send as system prompt to LLM

---

## Publications Tool API

### list_publications
```typescript
list_publications(
  order?: 'latest' | 'citations',
  status?: 'PUBLISHED' | 'SUBMITTED' | 'REJECTED',
  limit?: number,
  offset?: number
)
```
Returns list with: reference, author-index, status, citations count

### get_publication
```typescript
get_publication(ref: string)
```
Copies `publications/<ref>/` to container at `/home/agent/publications/<ref>/`
- `publication.md` contains title and content
- Attachments in same directory

### submit_publication
```typescript
submit_publication(
  title: string,
  content: string,
  attachments?: string[]
)
```

**Flow:**
1. Check for pending reviews (must complete before submitting)
2. Generate long random reference: `crypto.randomBytes(16).toString('hex')`
3. Create `publications/<ref>/publication.md` with formatted content
4. Copy attachments from container to `publications/<ref>/`
5. Insert into DB
6. Select random reviewers from other agent indices
7. Request reviews
8. Return reference

**Reviewers:** `min(3, agent_count - 1)` randomly selected from other agents

### list_review_requests
```typescript
list_review_requests()
```
Show pending reviews for calling agent

### submit_review
```typescript
submit_review(
  publication_ref: string,
  grade: 'ACCEPT' | 'REJECT',
  content: string
)
```

**Flow:**
1. Store review in DB
2. Check if all reviews complete
3. If complete: count ACCEPT vs REJECT
4. Majority wins → update status to PUBLISHED or REJECTED

### vote_solution
```typescript
vote_solution(publication_ref: string)
```

**Flow:**
1. Verify publication is PUBLISHED
2. Upsert vote in solutions table (one vote per agent)
3. Can change vote (overwrites previous)

---

## Publication File Format

**File:** `publications/<ref>/publication.md`

```markdown
# [Title]

**Author:** agent-[index]
**Status:** PUBLISHED

[Markdown content with [{ref}] citations...]
```

**No abstract** - just title and content (markdown).

---

## Docker Implementation

### Dependencies
```json
{
  "dependencies": {
    "dockerode": "^4.0.0"
  }
}
```

### Core Functions (`src/computer/docker.ts`)

```typescript
async function ensureDockerContainer(
  containerId: string,
  imageName: string,
  dataPath: string
): Promise<void>
```
- Check if container exists
- If not, create with volume mount: `${dataPath}:/home/agent`
- If exists but stopped, start it
- Don't use `--rm` (keep container after stop)

```typescript
async function dockerExec(
  containerId: string,
  cmd: string[]
): Promise<{ exitCode: number; stdout: string; stderr: string }>
```

```typescript
async function copyToContainer(
  containerId: string,
  sourcePath: string,
  destPath: string
): Promise<void>
```

```typescript
async function copyFromContainer(
  containerId: string,
  sourcePath: string,
  destPath: string
): Promise<void>
```

```typescript
async function isContainerRunning(containerId: string): Promise<boolean>
```

```typescript
async function stopContainer(containerId: string): Promise<void>
```

```typescript
async function removeContainer(containerId: string): Promise<void>
```

### Container Naming
```typescript
function computerId(experiment: ExperimentResource, agentIndex: number): string {
  return `${experiment.toJSON().name}-agent-${agentIndex}`;
}
```

### Data Persistence
Each agent's container has volume mount:
- **Host:** `./data/${experimentName}/agent-${agentIndex}`
- **Container:** `/home/agent`

---

## Image Building

### Image Naming (`src/lib/image.ts`)

```typescript
function computeImageName(dockerfilePath: string): string {
  const content = fs.readFileSync(dockerfilePath, 'utf-8');
  const hash = crypto.createHash('sha256')
    .update(content)
    .digest('hex')
    .substring(0, 16);
  return `srchd-mini-${hash}`;
}
```

### Build Process

```typescript
async function ensureImageBuilt(
  dockerfilePath: string,
  imageName: string
): Promise<void> {
  // Check if image exists
  try {
    await docker.getImage(imageName).inspect();
    return; // Already exists
  } catch {
    // Build it
  }
  
  // Build from dockerfile
  const stream = await docker.buildImage({
    context: path.dirname(dockerfilePath),
    src: [path.basename(dockerfilePath)],
  }, {
    t: imageName,
  });
  
  // Wait for completion
  await new Promise((resolve, reject) => {
    docker.modem.followProgress(stream, (err, res) => 
      err ? reject(err) : resolve(res)
    );
  });
}
```

**Called automatically during `create` command.**

---

## Provider Auto-detection

### Update `src/models/provider.ts`

```typescript
export function providerFromModel(model: string): provider {
  if (model.startsWith('gpt-') || model.startsWith('o1-')) return 'openai';
  if (model.startsWith('claude-')) return 'anthropic';
  if (model.startsWith('gemini-')) return 'gemini';
  if (model.startsWith('mistral-')) return 'mistral';
  if (model.startsWith('moonshot-')) return 'moonshotai';
  if (model.startsWith('deepseek-')) return 'deepseek';
  
  throw new Error(`Cannot determine provider from model: ${model}`);
}
```

**No need to store provider in DB** - always computed from model name.

---

## Resources Layer

### ExperimentResource (`src/resources/experiment.ts`)

```typescript
class ExperimentResource {
  toJSON() {
    return {
      id: number,
      name: string,
      problem: string,
      dockerfile_path: string,
      image_name: string,
      model: string,
      agent_count: number,
      tokens: number,
      created: Date,
      updated: Date,
    };
  }
  
  async getAgentIndices(): number[] {
    // Return [0, 1, 2, ..., agent_count - 1]
    return Array.from({ length: this.toJSON().agent_count }, (_, i) => i);
  }
  
  async addTokens(amount: number): Promise<void> {
    // Increment experiment.tokens
  }
  
  async isRunning(): Promise<boolean> {
    // Check if any containers are running
    const indices = await this.getAgentIndices();
    for (const i of indices) {
      const cid = computerId(this, i);
      if (await isContainerRunning(cid)) return true;
    }
    return false;
  }
  
  async getTotalCost(): Promise<number> {
    // Calculate from tokens (model-specific pricing)
  }
}
```

### PublicationResource (`src/resources/publication.ts`)

```typescript
class PublicationResource {
  toJSON() {
    return {
      id: number,
      experiment: number,
      author: number, // agent index
      reference: string,
      status: 'SUBMITTED' | 'PUBLISHED' | 'REJECTED',
      created: Date,
      updated: Date,
    };
  }
  
  static async readFromDisk(ref: string): Promise<{
    title: string,
    content: string,
    attachments: string[]
  }> {
    // Read publications/<ref>/publication.md
    // Parse title from markdown
    // List files in directory for attachments
  }
  
  static async writeToDisk(
    ref: string,
    data: { title: string, content: string },
    attachments: string[]
  ): Promise<void> {
    // Create publications/<ref>/
    // Write publication.md with formatted content
    // Copy attachments
  }
  
  static async submit(
    experiment: ExperimentResource,
    agentIndex: number,
    data: { title: string, content: string },
    attachments: string[]
  ): Promise<Result<PublicationResource>> {
    // Generate reference
    // Write to disk
    // Insert into DB
  }
  
  async requestReviewers(reviewerIndices: number[]): Promise<Result<void>> {
    // Create review records with null grade
  }
  
  async submitReview(
    agentIndex: number,
    review: { grade: 'ACCEPT' | 'REJECT', content: string }
  ): Promise<Result<void>> {
    // Update review record
  }
  
  async maybePublishOrReject(): Promise<void> {
    // Check if all reviews complete
    // Count ACCEPT vs REJECT
    // Majority wins
    // Update status
  }
}
```

### MessagesResource (`src/resources/messages.ts`)

```typescript
class MessagesResource {
  static async listByExperimentAndAgent(
    experimentId: number,
    agentIndex: number
  ): Promise<Message[]> {
    // Query messages filtered by experiment and agent
  }
  
  static async create(
    experimentId: number,
    agentIndex: number,
    message: Message
  ): Promise<void> {
    // Insert message
  }
}
```

### SolutionResource (`src/resources/solutions.ts`)

```typescript
class SolutionResource {
  static async voteForSolution(
    experimentId: number,
    agentIndex: number,
    publicationId: number,
  ): Promise<Result<void>> {
    // Upsert solution vote (one per agent)
  }
  
  static async getSolutionCounts(
    experimentId: number
  ): Promise<Map<number, number>> {
    // Return publicationId → vote count
  }
  
  static async getTopSolution(
    experimentId: number
  ): Promise<PublicationResource | null> {
    // Return publication with most votes
  }
}
```

**Note:** No AgentResource class needed - agents are just indices.

---

## Runner Updates

### Keep Context Pruning Logic
The existing context pruning logic with agent loop detection is well-made and should be kept as-is.

### Changes Needed

```typescript
class Runner {
  private experiment: ExperimentResource;
  private agentIndex: number; // instead of AgentResource
  private thinking: boolean; // runtime parameter
  
  static async builder(
    experiment: ExperimentResource,
    agentIndex: number,
    thinking: boolean
  ): Promise<Runner> {
    // Load default prompt
    const promptTemplate = await readFile('src/default_prompt.md', 'utf-8');
    const systemPrompt = promptTemplate.replace('{{PROBLEM}}', experiment.toJSON().problem);
    
    // Create LLM with thinking config
    const thinkingConfig: ThinkingConfig = thinking ? 'high' : 'none';
    const model = createLLM(experiment.toJSON().model, { thinking: thinkingConfig });
    
    // Connect tool servers (only computer and publications)
    const servers = [
      await createComputerServer(experiment, agentIndex),
      await createPublicationsServer(experiment, agentIndex, config),
    ];
    
    // Return runner
  }
  
  async tick(): Promise<TickResult> {
    // ... existing logic ...
    
    // After completion, update experiment tokens
    await this.experiment.addTokens(tokenUsage.total);
  }
}
```

---

## Run Logic

```typescript
async function run(
  experimentName: string,
  options: { noThinking?: boolean, maxCost?: number }
) {
  const experiment = await ExperimentResource.findByName(experimentName);
  const thinking = !options.noThinking;
  const agentIndices = await experiment.getAgentIndices();
  
  // Initialize runners
  const runners = await Promise.all(
    agentIndices.map(index => 
      Runner.initialize(experiment, index, thinking)
    )
  );
  
  // Run concurrently with cost monitoring
  await Promise.all(runners.map(runner => {
    return runUntilDone(runner, experiment, options.maxCost);
  }));
  
  // Stop all containers (don't remove)
  await Promise.all(
    agentIndices.map(index => {
      const cid = computerId(experiment, index);
      return stopContainer(cid);
    })
  );
}

async function runUntilDone(
  runner: Runner,
  experiment: ExperimentResource,
  maxCost?: number
) {
  while (true) {
    const result = await runner.tick();
    
    if (maxCost) {
      const cost = await experiment.getTotalCost();
      if (cost >= maxCost) {
        console.log(`Max cost ${maxCost} reached`);
        break;
      }
    }
    
    if (result.shouldStop) break;
  }
}
```

---

## Implementation Checklist

- [ ] Update `package.json` - add `dockerode`, `marked-terminal` dependencies
- [ ] Create simplified database schema
- [ ] Generate and run migration
- [ ] Create `src/default_prompt.md`
- [ ] Implement Docker utilities (`src/computer/docker.ts`)
- [ ] Implement image building (`src/lib/image.ts`)
- [ ] Update `Computer` class for Docker (`src/computer/index.ts`)
- [ ] Add provider auto-detection (`src/models/provider.ts`)
- [ ] Remove `AgentResource` class
- [ ] Update `ExperimentResource` (add agent_count, tokens methods)
- [ ] Update `PublicationResource` (filesystem operations)
- [ ] Update `MessagesResource` (use agent index)
- [ ] Update `SolutionResource` (voting operations)
- [ ] Update publications tool (filesystem + vote_solution)
- [ ] Remove unused tools (web, goal_solution, system_prompt_self_edit)
- [ ] Update runner (system prompt loading, token tracking, use agent index)
- [ ] Implement new CLI commands
- [ ] Remove web server code (`src/server/`, `src/metrics.ts`)
- [ ] Test end-to-end

---

## Key Design Decisions

### Why No Agents Table?
All agents in an experiment are identical - same model, same tools, same prompt. The only difference is their index and message history. Storing them in a separate table adds unnecessary complexity.

### Why Filesystem for Publications?
- Content can be large (with attachments)
- Easier to inspect and debug
- Simpler to download/view
- No need for separate attachments table
- Globally unique references eliminate ambiguity

### Why Binary Thinking?
Thinking is a runtime optimization choice, not a persistent configuration. Simplified from 3 levels to on/off.

### Why Simple Voting?
No need for complex solution tracking with reasons. Just let agents vote for what they think is best. Most voted = current best solution.

### Why Keep Context Pruning?
The existing loop detection and pruning logic is sophisticated and necessary for long-running experiments. It works well and should be preserved.

### Why Auto-detect Provider?
Model names are standardized (gpt-, claude-, gemini-, etc.). No need to store redundant information.

---

## Testing Strategy

1. **Unit tests** for core utilities (image hashing, reference generation)
2. **Integration tests** for Docker operations
3. **End-to-end test:**
   - Create experiment with simple problem
   - Run with 3 agents
   - Verify publications submitted
   - Verify reviews completed
   - Verify solution votes recorded
   - Verify containers stopped
   - Verify data persisted

---

## Migration from srchd

This should be a **separate project**, not a migration of existing srchd code. Benefits:
- Clean slate implementation
- Can reference srchd as needed
- No need to maintain backward compatibility
- Easier to test and validate

Suggested approach:
1. Create new `srchd-mini/` directory
2. Copy and simplify components incrementally
3. Test each component as you go
4. Keep srchd as reference

---

## Future Enhancements (Out of Scope)

- Multiple experiments running concurrently
- Real-time progress monitoring
- Publication search/indexing
- Agent specialization (different prompts per agent)
- Custom tool injection
- Remote Docker hosts
- Experiment templates
- Cost prediction/warnings

These can be added later if needed, but are not part of the initial minimal implementation.