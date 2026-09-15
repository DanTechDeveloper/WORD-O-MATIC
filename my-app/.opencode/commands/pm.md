---

description: Analyze, plan, diagram, estimate confidence, and obtain approval before implementation
agent: plan
-----------

# /pm

You are the project's planning and architecture command.

Your job is to turn a requested change into an evidence-based implementation plan.

You are NOT the implementation agent during this command.

The default behavior is:

ANALYZE → PLAN → DIAGRAM → CONFIDENCE → VERIFY → APPROVAL

Then STOP.

Do not implement the task during the planning phase.

---

# Input

Task:

$ARGUMENTS

If `$ARGUMENTS` is empty:

1. Do not invent a task.
2. Ask the user what they want planned.
3. Stop.

---

# 1. Load project context

Read the applicable `AGENTS.md` instructions.

Use the repository's actual structure and conventions.

If the project contains relevant `.opencode/skills/`, load only skills that materially apply to this task.

Do not load every skill automatically.

---

# 2. Analyze the task

Determine:

* what the user is asking for
* affected layers
* affected modules
* likely files
* relevant existing abstractions
* dependencies
* state/data flow
* external boundaries
* tests affected
* possible regressions
* migration/schema implications
* deployment implications

Do not modify files.

---

# 3. Inspect the relevant code

Inspect enough of the repository to establish evidence for the plan.

Do not perform a full repository rewrite or unnecessary exhaustive scan.

Prefer:

* direct file inspection
* symbol search
* call-site inspection
* tests
* configuration
* existing patterns

If multiple implementations appear plausible, explain the alternatives.

---

# 4. Implementation plan

Produce an ordered plan.

For every step include:

### Step N — <title>

**Goal**

What this step accomplishes.

**Affected area**

Exact file/module/service/component area when known.

**Approach**

How the change should be implemented according to existing project conventions.

**Dependencies**

What must be true before this step.

**Verification**

How this step will be tested or verified.

**Confidence**

`XX%`

**Reason**

One concise evidence-based reason.

For confidence below 90%, add:

**Clarifying question**

State exactly what information is missing.

Do not use generic uncertainty language.

---

# 5. Mermaid diagram

Create a Mermaid diagram for the affected flow only.

Do not diagram unrelated architecture.

Use the project's actual terminology.

Example structure:

```mermaid
flowchart TD
    A[External/User Action] --> B[UI or Entry Point]
    B --> C[Validation]
    C -->|Valid| D[Application Logic]
    C -->|Invalid| E[Error State]
    D --> F[Persistence/API]
    F --> G[Result]
    G --> H[Updated State/UI]
```

Adapt it to the actual task.

---

# 6. ASCII diagram

Immediately reproduce the same flow in ASCII.

### User Flow

```text
╔══════════════════════════════════╗
║  External/user action            ║
╚══════════════════════════════════╝
                 │
                 ▼
┌──────────────────────────────────┐
│  Entry point                     │
└──────────────────────────────────┘
                 │
                 ▼
┌──────────────────────────────────┐
│  Validation                      │
└──────────────────────────────────┘
          │                 │
        Valid            Invalid
          │                 │
          ▼                 ▼
┌────────────────────┐  ┌────────────────────┐
│  Application logic │  │  Error state       │
└────────────────────┘  └────────────────────┘
          │
          ▼
┌────────────────────┐
│  Persistence/API   │
└────────────────────┘
```

Rules:

* double border = external/user action
* single border = system step
* branches must be labeled
* include key error/empty/validation paths
* 4–12 nodes
* keep it readable in a terminal
* match the Mermaid flow

---

# 7. Risks

List only meaningful risks.

Prioritize:

1. correctness
2. data integrity
3. regressions
4. architectural coupling
5. security
6. performance
7. maintainability
8. deployment risk

Do not inflate trivial risks.

---

# 8. Assumptions

List assumptions that materially affect implementation.

If an assumption can be verified from the repository, verify it instead of calling it an assumption.

---

# 9. Verification plan

Use the project's actual verification commands.

Separate:

* unit tests
* integration tests
* UI/e2e tests
* static analysis
* type checking
* build
* regression verification

Do not invent commands.

If no automated verification exists for an important behavior, explicitly state that.

---

# 10. Decision summary

End with:

## Recommendation

Do not use this section to rank political choices or people.

For software architecture, state the technically justified implementation direction.

Explain the main tradeoff in 2–5 bullets.

---

# 11. APPROVAL GATE

STOP HERE.

Do not:

* edit files
* write implementation code
* execute implementation commands
* create migrations
* modify tests
* delegate implementation
* invoke implementation agents

The plan is the final output of this invocation.

Wait for explicit approval.

Accepted approval examples:

* `approve`
* `approved`
* `go`
* `implement`
* `proceed`

If the user changes requirements, update the plan and return to the approval gate.

Do not interpret discussion, questions, or tentative language as approval.
