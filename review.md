# Independent review extension

`review_work` runs one explicitly requested, critique-only review in a separate Pi `AgentSession`. The reviewer has no tools, extensions, context files, skills, themes, or prompt templates. Its behavioral instructions live in `review.ts`; do not rely on `AGENTS.md` for reviewer policy.

## Configure the review model

Configure `review_work.model` with the exact `provider/modelId` for the model you want the reviewer to use, and set `review_work.thinkingLevel` to `medium` or another thinking level supported by that model. The extension reads these keys through Pi's native `SettingsManager`, does not choose or rewrite the model, and stops with a configuration error if `review_work.model` is missing or the model is unavailable, or if `review_work.thinkingLevel` is invalid or unsupported.

Set this in the user-level Pi settings file (`~/.pi/agent/settings.json`) by merging the following JSON into your existing settings:

```json
{
  "review_work": {
    "model": "provider/modelId",
    "thinkingLevel": "medium"
  }
}
```

The `model` value must be a registered and authenticated model available in this Pi installation. `thinkingLevel` must be one of Pi's supported thinking levels: `"off"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"xhigh"`, or `"max"`.

## Session history and cost

Each invocation creates a normal persisted Pi session in the standard session directory for the reviewed working directory. It gets a descriptive `Independent review — <project> — <date/time>` title, appears in Pi's session picker, and can be resumed there. A failed or cancelled run is not automatically retried. Tool, extension, project-context, and model retry behaviors are disabled for reviewer sessions.

Token and cost reporting comes from the completed Pi session's own statistics. No separate price table or fallback estimate is used; if Pi reports no non-zero session cost, the result says that USD cost is unavailable.

## Reviewing plans

The reviewer handles proposed plans, architecture and design notes as well as implementation results. When there is no code yet, put a substantive plan in the `scope` brief and omit `files` (it is optional); the reviewer evaluates goals and scope, assumptions, sequencing and dependencies, tradeoffs, omissions, risks, and validation and rollout as applicable, without demanding code or flagging planned-but-unimplemented work as a defect merely for being unimplemented.

Scope-only example (no files):

```
review_work({
  scope: "Review this proposed architecture (no implementation yet): move session storage from per-project JSON files to one SQLite database per project. Goals: durable history, atomic compaction, offline use. Constraints: no new native dependencies, automatic and reversible migration. Open questions: locking under concurrent processes, retention policy, backup/restore. Assumptions, sequencing, tradeoffs, risks, and rollout are all part of the review scope."
})
```

## Input boundaries

The brief is limited to 40,000 characters; at most 20 regular text files are accepted, with a combined limit of 256 KiB. Files must be within the current project or `~/.pi/agent`, and symlink components, credential/private-key paths, Pi memory, settings/auth files, and system-prompt files are excluded. Do not include secrets in the brief or selected files.
