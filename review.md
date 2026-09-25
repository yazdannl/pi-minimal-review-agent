# Pi Minimal Review agent

`review_work` runs one explicitly requested, critique-only review in a separate Pi `AgentSession`. The package loads `extensions/review.ts`. The reviewer has no tools, extensions, context files, skills, themes, or prompt templates. Its behavioral instructions live in the extension source; do not rely on `AGENTS.md` for reviewer policy.

## Install

Install for your user (the default):

```bash
pi install git:github.com/yazdannl/pi-minimal-review-agent
```

For one invocation without saving the package in settings:

```bash
pi -e git:github.com/yazdannl/pi-minimal-review-agent
```

See [`README.md`](README.md) for package details, removal, and update commands. The package manifest loads `extensions/review.ts`; after an update, use `pi update --extensions` or reinstall the package, and remove any separately loaded copy to avoid duplicate registration.

## Configure the review model

Configure `review_work.models` with exact `provider/modelId` strings for the available tiers, and set `review_work.thinkingLevel` separately. The extension reads these keys through Pi's native `SettingsManager`.

Set this in the user-level Pi settings file (`~/.pi/agent/settings.json`) by merging the following JSON into your existing settings:

```json
{
  "review_work": {
    "models": {
      "high": "github-copilot/claude-opus-5.5",
      "medium": "github-copilot/gpt-6-sol",
      "low": "github-copilot/gpt-6-luna"
    },
    "thinkingLevel": "medium"
  }
}
```

The `review_work` tool's optional `modelTier` parameter accepts `high`, `medium`, or `low`; it defaults to `medium` and chooses the matching entry from `review_work.models`. Results report both the selected tier and concrete model. If `models` exists but does not contain the requested tier, the tool fails clearly instead of choosing another model. For compatibility, settings containing only the legacy `review_work.model` use that one model for any selected tier; migrate to `models` to configure distinct tiers.

The selected model must be registered and authenticated in this Pi installation. `thinkingLevel` defaults to `medium` and must be supported by the selected model; supported levels are `"off"`, `"minimal"`, `"low"`, `"medium"`, `"high"`, `"xhigh"`, and `"max"`. Reviewer sessions do not load provider extensions. After installing updates to this package, use `pi update --extensions` or reinstall it; remove any separately loaded copy of `review.ts` to avoid duplicate registration.

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
