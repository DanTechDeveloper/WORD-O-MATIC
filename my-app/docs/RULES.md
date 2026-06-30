# RULES

## Core Principles

1. Ask before assuming.
    - If requirements, intent, architecture, or expected behavior are unclear, stop and ask before writing code.

2. Keep it simple.
    - Implement the simplest solution that satisfies the request.
    - Avoid unnecessary abstractions, flexibility, or premature optimization.

3. Minimize impact.
    - Modify only code directly related to the current task.
    - Do not refactor, rename, reorganize, or reformat unrelated code.

4. Reuse before creating.
    - Reuse existing project code whenever possible.
    - Prefer extending existing implementations over creating parallel ones.

5. Be explicit.
    - If information is missing or uncertain, say so.
    - Never invent technical details or make silent assumptions.

---

## Simplicity First

Before writing code, evaluate solutions in this order:

1. Existing project implementation
2. Laravel built-in feature
3. React built-in feature
4. PHP / JavaScript standard library
5. Existing dependency
6. Custom implementation

Before creating a new:

- Service
- Repository
- Trait
- Helper
- Hook
- Component
- Utility

first search the repository for an existing implementation.

If creating a new abstraction, explain:

- Why the existing implementation cannot be extended.
- Why a framework feature is insufficient.
- Why the new abstraction improves maintainability or readability.

Avoid abstractions for single-use code unless they provide a clear benefit.

---

## Planning

For architecture decisions, debugging, or non-trivial multi-file features:

- Explain your reasoning.
- Present 2–3 implementation approaches.
- Recommend one approach.
- Wait for approval before implementing.

Skip this process for simple, straightforward tasks.

---

## Code Review

Differentiate verified findings from suspected findings.

Do not present assumptions as confirmed defects.

Use the following confidence levels:

- **Verified** — Supported directly by the provided code or other available evidence.
- **Likely** — Strong evidence suggests an issue, but confirmation requires additional context.
- **Possible** — A potential concern based on common patterns or incomplete information.

For every finding:

- State the confidence level.
- Cite the relevant code that supports the finding.
- Explain why it is a problem.
- If additional information is required (runtime behavior, database contents, configuration, production environment, etc.), explicitly state what must be verified before treating it as a confirmed issue.

Prioritize findings in this order:

1. Correctness
2. Security
3. Data integrity
4. Performance
5. Maintainability
6. Style

## Safety

Require explicit confirmation before:

- Running migrations.
- Making schema changes.
- Deleting files.
- Overwriting existing implementations.
- Deploying.
- Running irreversible commands.
- Executing external API actions.
- Sending emails or other external actions.

Do not proceed until confirmation is given.

---

## Responses

- No conversational filler.
- Match response length to task complexity.
- Challenge incorrect assumptions respectfully.
- Explain trade-offs when multiple valid solutions exist.
- State uncertainty explicitly when applicable.

---

## Output

After every coding task include:

Files changed

- List every modified file.

What changed

- One concise summary per file.

Files intentionally not touched

- Mention relevant files that were intentionally left unchanged.

Follow-up

- Mention remaining work, risks, or recommended next steps.
