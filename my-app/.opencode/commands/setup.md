---

## description: One-time project bootstrap — analyze the repo, generate /pm, propose project-fit skills/commands/agents, and deduplicate project instructions

# /setup

You are performing a one-time OpenCode project bootstrap.

This command is intentionally strict.

Your job is to establish a reliable project context, create a planning workflow, propose only project-justified reusable infrastructure, and prevent duplicated instructions.

Do NOT blindly imitate Claude Code conventions.

This project uses OpenCode conventions:

* `AGENTS.md` for persistent project instructions.
* `.opencode/commands/` for project commands.
* `.opencode/skills/<name>/SKILL.md` for reusable skills.
* `.opencode/agents/<name>.md` for specialized agents.

## Core operating rules

1. Work in the current project/worktree.
2. Follow the phases strictly in order.
3. Do not skip phases.
4. Do not parallelize dependent phases.
5. Do not invent architecture facts that have not been observed.
6. Do not assume a framework, language, directory structure, or architecture before inspection.
7. Prefer existing project conventions over generic best practices when they conflict.
8. Keep generated infrastructure minimal.
9. Do not create speculative skills, commands, or agents.
10. Do not modify application source code during setup.
11. Before any implementation-related modification, require explicit user approval.
12. Never treat an AI-generated project description as more authoritative than the actual repository.
13. When evidence conflicts, report the conflict instead of silently choosing one interpretation.

---

# Phase 0 — Idempotency check

Before doing anything else, inspect whether the setup workflow has already been established.

Check for:

* `.opencode/commands/pm.md`
* `AGENTS.md`

If `.opencode/commands/pm.md` already exists AND `$ARGUMENTS` is not exactly `force`:

1. Do not regenerate `/pm`.
2. Do not overwrite existing project instructions.
3. Report that setup has already been run.
4. Show:

   * existing `AGENTS.md`
   * existing `.opencode/commands/pm.md`
   * existing `.opencode/skills/` entries, if any
   * existing `.opencode/agents/` entries, if any
5. Stop.

If `$ARGUMENTS` is `force`, continue.

Do not interpret words such as `FORCE`, `--force`, or `forceful` as equivalent unless the argument is explicitly intended to mean force. Use the literal argument value `force`.

---

# Phase 1 — Scan and analyze

## Step 1 — Initialize OpenCode project instructions

Run the OpenCode `/init` command.

`/init` is the project's discovery/bootstrap mechanism.

Its expected output is `AGENTS.md`.

Do not manually invent project architecture before `/init` has run.

After `/init` completes, read the resulting `AGENTS.md` in full.

If `AGENTS.md` already existed, treat the updated version as the current OpenCode project guidance, but verify important architectural claims against the repository before relying on them.

---

## Step 2 — Build the project profile

Using:

1. the actual repository,
2. the generated `AGENTS.md`,
3. package/configuration files,
4. directory structure,
5. representative source files,
6. test configuration,
7. build/lint/type-check configuration,

construct one internal Project Profile.

The profile must contain:

### Technology

* primary language(s)
* framework(s)
* runtime(s)
* package manager(s)
* database/storage technology
* build tooling
* testing framework(s)
* linting/formatting tooling
* deployment/runtime environment when observable

### Architecture

Identify the actual architecture or layer pattern.

Examples:

* MVC
* service-oriented
* repository/service/controller
* feature-based
* component-based
* modular monolith
* monorepo
* client/server
* event-driven
* CLI
* library/package

Do not force the project into one of these categories if the evidence does not support it.

### State/data flow

Identify:

* where application state lives
* how data enters the system
* where business logic is located
* how persistence occurs
* how external services are called
* how errors propagate
* how UI state is derived, if applicable

### Existing conventions

Identify recurring conventions such as:

* naming
* folder organization
* service boundaries
* component patterns
* API patterns
* validation patterns
* testing patterns
* error handling
* logging
* dependency injection
* configuration management

### Verification

Identify actual commands for:

* build
* test
* lint
* type-check
* formatting
* integration/e2e tests
* deployment checks

Only include commands that actually exist or can be confidently derived from repository configuration.

### Recurring workflows

Look for repeated project-specific workflows.

Examples:

* UI fidelity work
* database migrations
* API contract changes
* feature-module implementation
* deployment
* report generation
* test generation
* integration testing
* refactoring
* schema changes

Only identify a workflow as recurring when repository evidence supports it.

---

# Step 3 — Identify the user-facing boundary

Determine what "user-facing flow" means for this repository.

### Client application

Examples:

* Flutter
* React
* Vue
* mobile app
* desktop UI
* web application

Model flows as:

user action → screen/component → state transition → network/storage operation → resulting UI state

### Backend/API

Model flows as:

external request/event → route/handler → middleware → validation → service → repository/database/external API → response/event

### CLI

Model flows as:

command invocation → argument parsing → validation → application logic → filesystem/network/database → terminal output

### Library/package

Model flows as:

consumer call → public API → internal logic → dependencies → return value/error

### Mixed-stack repository

Identify the affected boundary.

A task may require:

* a client flow,
* a server flow,
* or one end-to-end flow crossing the network boundary.

Do not create a giant architecture diagram.

---

# Step 4 — Freeze the Project Profile

From this point forward, use the Phase 1 Project Profile as the working context for later phases.

Do not repeatedly rediscover architecture from scratch.

If later evidence contradicts the profile:

1. identify the contradiction,
2. update the profile,
3. explicitly report the correction.

Do not silently continue with stale assumptions.

---

# Phase 1 output

Before continuing, report:

## Project Profile

* Stack:
* Architecture:
* State/data flow:
* Existing conventions:
* Verification commands:
* User-facing boundary:
* Recurring workflows:
* Important constraints:
* Uncertainties:

Do not create `/pm` yet if the repository could not be analyzed reliably.

If critical uncertainty remains, ask targeted questions before continuing.

---

# Phase 2 — Create `/pm`

Create or update:

`.opencode/commands/pm.md`

Do not create duplicate planning commands.

The resulting `/pm` command must implement the contract below.

---

# `/pm` contract

On every:

`/pm <task>`

perform the following sequence.

## 1. Understand the task

Analyze the requested task against the Phase 1 Project Profile.

Determine:

* affected layer(s)
* affected files/modules
* relevant existing abstractions
* dependencies
* likely side effects
* testing implications
* deployment implications
* data/schema implications
* user-facing behavior
* risks

Do not immediately edit code.

---

## 2. Inspect before planning

Inspect the repository areas necessary to make the plan evidence-based.

Do not guess file paths.

If the task references a file/module that does not exist:

* report that,
* identify likely alternatives if observable,
* ask for clarification when necessary.

Do not fabricate an implementation location.

---

## 3. Plan

Produce an ordered implementation plan.

Each step must contain:

* objective
* affected area
* implementation approach
* dependencies
* verification method
* confidence percentage

Example:

`1. Refactor ProgressService calculation — 95% confidence`

Reason:

`The existing service already owns this calculation and the relevant tests cover the same boundary.`

---

## 4. Confidence scoring

Assign every plan step a confidence percentage from 0–100%.

The score represents confidence that:

1. the identified implementation location is correct,
2. the proposed behavior matches the repository's current architecture,
3. the required dependencies are understood,
4. the verification strategy is appropriate.

Do not use confidence as decoration.

### Below 90%

If a step is below 90%, state the exact ambiguity.

Then ask the specific question that would resolve it.

Bad:

`Need more information.`

Good:

`82% — The existing ProgressService and StudentController both appear capable of owning this calculation. Which layer is intended to remain the source of truth?`

Do not hide uncertainty behind vague language.

---

# 5. Mermaid diagram

Create a Mermaid diagram representing only the task's affected flow.

Do not diagram the entire application unless the task genuinely affects the entire application.

Adapt the diagram to the repository's actual architecture.

For a client:

`User → Screen → State → API → Server → Result → UI`

For a backend:

`Request → Middleware → Handler → Service → Repository → DB → Response`

For a mixed stack:

`User → Client → API → Middleware → Service → DB → API Response → Client State → UI`

Use actual project terminology where known.

---

# 6. ASCII flow diagram

Immediately after the Mermaid diagram, render the same flow as an ASCII diagram.

The ASCII diagram is mandatory because terminal users cannot rely on Mermaid rendering.

Use this structure:

### User Flow

╔══════════════════════════════════╗
║  External/user action            ║
╚══════════════════════════════════╝
│
▼
┌──────────────────────────────────┐
│  System step                     │
└──────────────────────────────────┘
│
▼
┌──────────────────────────────────┐
│  Decision: condition?             │
└──────────────────────────────────┘
│              │
Yes              No
│              │
▼              ▼
┌──────────────────┐  ┌──────────────────┐
│  Success path    │  │  Error path      │
└──────────────────┘  └──────────────────┘

Rules:

* `╔══╗` / `╚══╝` = user/external caller initiated action.
* `┌──┐` / `└──┘` = system step.
* Decision nodes use single-border boxes containing the decision.
* Branches must have `Yes` / `No` labels when applicable.
* Include the happy path.
* Include important validation/error/empty states visible to the caller.
* Keep the flow between 4 and 12 nodes.
* Do not create a decorative architecture diagram.
* The ASCII diagram must describe the same flow as the Mermaid diagram.

---

# 7. Risks and assumptions

After the diagrams, list:

### Risks

Only meaningful risks.

Examples:

* existing abstraction has multiple callers
* schema migration affects historical data
* UI state is derived indirectly
* external API behavior is not fully controlled
* test coverage does not cover the affected boundary
* refactor crosses multiple modules

### Assumptions

List only assumptions that materially affect implementation.

Do not turn obvious facts into assumptions.

---

# 8. Verification plan

Specify exactly how the implementation will be verified.

Use project-native commands from the Phase 1 Project Profile.

Separate:

* unit verification
* integration verification
* UI/e2e verification
* regression verification
* build/type verification

Do not claim a test exists when it does not.

---

# 9. Approval gate

STOP.

Do not:

* edit application files,
* create implementation code,
* run implementation commands,
* delegate implementation work,
* create new skills,
* create new agents,
* create additional commands,

until the user explicitly approves the `/pm` plan.

The end of a `/pm` invocation is the approval gate.

Accept explicit approval such as:

* `approve`
* `approved`
* `go`
* `implement`
* `proceed`

Do not treat vague statements as approval.

If the user changes the requirements, regenerate the plan before implementation.

---

# Phase 2 setup output

After creating `.opencode/commands/pm.md`, report:

* exact path created/updated
* `/pm` usage
* confirmation that `/pm` stops at approval
* any important design decision made during creation

Do not implement the user's application task.

---

# Phase 3 — Propose project-fit infrastructure

Now inspect the Project Profile and existing `.opencode/` infrastructure.

Determine what reusable infrastructure this specific repository genuinely benefits from.

Do not generate infrastructure merely because the framework supports it.

---

## Skills

Propose a skill only when a workflow:

1. recurs across sessions,
2. has project-specific rules,
3. benefits from being loaded on demand,
4. is sufficiently distinct from `AGENTS.md` and `/pm`.

Examples:

* UI fidelity workflow
* API contract workflow
* migration workflow
* release workflow
* domain-specific testing workflow
* deployment verification workflow

A skill should not merely duplicate `AGENTS.md`.

---

## Commands

Propose a command only when it represents a repeatable entry point distinct from `/pm`.

Examples:

* `/review`
* `/verify`
* `/release`
* `/migration-check`
* `/ui-audit`

Do not create a command just because an action can be expressed as a command.

---

## Agents

Propose an agent only when isolation provides a meaningful benefit.

Examples:

* read-only reviewer
* security reviewer
* test-focused reviewer
* architecture reviewer
* domain-specific investigator

Do not create an agent for a task that the normal Build or Plan agent can perform adequately.

Prefer read-only permissions for reviewer agents.

---

# Proposal format

Present:

## Proposed Skills

For each:

* name
* purpose
* why this project needs it
* why `AGENTS.md` or `/pm` is insufficient

## Proposed Commands

For each:

* command name
* purpose
* example invocation
* why it deserves a dedicated command

## Proposed Agents

For each:

* agent name
* purpose
* why a separate context is useful
* required permissions
* why the built-in Plan/Build agents are insufficient

If nothing is justified, explicitly say:

`No additional project-specific infrastructure is justified.`

That is a valid outcome.

---

# Phase 3 approval gate

STOP.

Do not create the proposed skills, commands, or agents yet.

Require explicit user approval.

If the user approves only some items, create only those items.

Do not silently create rejected items.

---

# Phase 4 — Create approved infrastructure and deduplicate

This phase begins only after the user has explicitly approved the Phase 3 proposal.

Create only approved:

* `.opencode/skills/<name>/SKILL.md`
* `.opencode/commands/<name>.md`
* `.opencode/agents/<name>.md`

Do not modify application source code.

---

# Phase 4A — Deduplication audit

After all approved OpenCode infrastructure has been created, inspect:

* `AGENTS.md`
* every file under `.opencode/commands/`
* every `SKILL.md` under `.opencode/skills/`
* every agent under `.opencode/agents/`

Look for duplicated:

* architecture facts
* project conventions
* workflow rules
* verification commands
* domain constraints
* repeated instructions

Do not treat legitimate references as duplication.

---

# Ownership rules

Assign each fact to the most specific appropriate owner.

### Shared project facts

Prefer:

`AGENTS.md`

Examples:

* stack
* project structure
* global coding conventions
* canonical test commands
* repository-wide constraints

### Planning behavior

Prefer:

`.opencode/commands/pm.md`

Examples:

* plan structure
* confidence scoring
* approval gate
* diagrams
* planning workflow

### Reusable specialized workflow

Prefer:

`.opencode/skills/<name>/SKILL.md`

Examples:

* deployment checklist
* migration workflow
* specialized testing methodology

### Dedicated task entry point

Prefer:

`.opencode/commands/<name>.md`

Examples:

* `/verify`
* `/review`
* `/release`

### Isolated specialist behavior

Prefer:

`.opencode/agents/<name>.md`

Examples:

* reviewer behavior
* security audit behavior
* isolated investigation

---

# Deduplication rule

When the same fact appears in multiple places:

1. Keep it in the most appropriate owner.
2. Remove the duplicated explanation from secondary locations.
3. Replace it with a concise reference when useful.

Do not create circular references.

Do not move information merely for the sake of reducing line count.

The goal is:

`one fact → one canonical owner → minimal references`

---

# Phase 4B — Final audit

After deduplication, verify:

1. `AGENTS.md` remains valid.
2. `.opencode/commands/pm.md` exists.
3. approved skills exist in the correct locations.
4. approved commands exist in the correct locations.
5. approved agents exist in the correct locations.
6. no rejected infrastructure was created.
7. no application source code was changed.
8. no duplicated project facts remain without justification.
9. `/pm` still contains its approval gate.
10. the project remains usable if any proposed infrastructure is removed.

---

# Final report

Report exactly:

## Created

List every created file.

## Updated

List every updated file.

## Not created

List proposed items that were rejected or unnecessary.

## Deduplicated

For every deduplicated fact:

`Fact → canonical owner`

Example:

`Test command → AGENTS.md`

`Planning approval gate → .opencode/commands/pm.md`

`Release checklist → .opencode/skills/release/SKILL.md`

## Verification

Report the checks performed.

Do not claim successful verification if a check was not actually performed.

## Final status

Use one of:

`SETUP COMPLETE`

or

`SETUP BLOCKED`

If blocked, state the exact reason and the smallest next action required.
