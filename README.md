# Pi Minimal Review agent

A Pi package that registers the `review_work` tool for explicitly requested, independent, critique-only reviews in a separate persisted Pi session. It can review plans and design notes as well as implementation results. The reviewer has no tools, extensions, skills, project context files, themes, or prompt templates.

## Install

Install for your user (the default):

```bash
pi install git:github.com/yazdannl/pi-minimal-review-agent
```

For one invocation without saving the package in settings:

```bash
pi -e git:github.com/yazdannl/pi-minimal-review-agent
```

To install in the current project's settings instead, add `-l` to `pi install`; project packages load only after the project is trusted. Use `pi list` to check installed packages, `pi update --extensions` to update them, and `pi remove git:github.com/yazdannl/pi-minimal-review-agent` to uninstall.

If you already load `review.ts` directly from `~/.pi/agent/extensions/`, remove that duplicate registration before installing this package.

The package manifest loads `extensions/review.ts`. The companion [`review.md`](review.md) has additional setup and usage details. Pi provides the extension's imported runtime packages. After installing a package update, use `pi update --extensions` (or reinstall the package); remove any separately loaded copy of `review.ts` to avoid duplicate registration.

## Configure the reviewer model

Merge this into the user-level Pi settings file (`~/.pi/agent/settings.json`), preserving your existing settings:

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

`review_work.models` maps the `high`, `medium`, and `low` tiers to exact `provider/modelId` strings. The `review_work` tool accepts optional `modelTier` (`high`, `medium`, or `low`) and selects the corresponding configured model; omitted `modelTier` defaults to `medium`. If the tier map is present but lacks the requested tier, the review fails with a configuration error. Existing settings with only `review_work.model` remain supported as a legacy single-model configuration for any requested tier; they can be migrated to the tier map above.

`thinkingLevel` is separate from model tier, optional, and defaults to `medium`; it must be supported by the selected model. The selected model must be available and authenticated in this Pi installation. Reviewer sessions do not load provider extensions, so the model must be registered by Pi itself.

## Privacy and cost

The reviewer receives the brief and only the optional files selected for that review. Selected files must be regular text files within the current project or `~/.pi/agent`; sensitive paths are rejected, and inputs are limited to 20 files and 256 KiB total. The brief and selected file contents are sent to the configured model provider and may incur cost, so do not include secrets or private data. Each review creates a normal persisted Pi session.

Review the source before installing. Extensions execute in the Pi process with that process's operating-system permissions.
