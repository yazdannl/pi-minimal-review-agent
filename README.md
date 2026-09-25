# Pi Extension: Independent Review

Registers the `review_work` tool, which runs one explicitly requested, critique-only review in a separate persisted Pi session. The reviewer has no tools, extensions, skills, project context files, or prompt templates. It can review plans and design notes as well as implementation results.

## Install

From this repository's root:

```bash
mkdir -p ~/.pi/agent/extensions
cp review.ts review.md ~/.pi/agent/extensions/
```

Copy both files: `review.md` is the companion setup guide, and the extension points to it when reporting configuration errors. Restart Pi or run `/reload`. For a one-off test, load the TypeScript file with `pi --extension ./review.ts`; the companion guide remains available in this repository.

The path above is Pi's default user agent directory. If you use a custom agent directory, install both files under its `extensions/` directory instead.

## Configure the reviewer model

Merge this into the user-level Pi settings file (`~/.pi/agent/settings.json`), preserving your existing settings:

```json
{
  "review_work": {
    "model": "provider/modelId",
    "thinkingLevel": "medium"
  }
}
```

Use the exact provider/model ID for a model available and authenticated in this Pi installation. `thinkingLevel` is optional and defaults to `medium`; it must be supported by the chosen model. See [`review.md`](review.md) for the full configuration and usage guide.

## Privacy and cost

The reviewer only receives the brief and optional files explicitly selected for that review. Selected files must be regular text files within the current project or `~/.pi/agent`; the extension rejects sensitive paths and limits input to 20 files and 256 KiB total. The brief and selected file contents are sent to the configured model provider and may incur cost, so do not include secrets or private data. Each review creates a normal persisted Pi session.

No separate npm dependency is required; Pi supplies the imported runtime packages. Review the source before loading it. Like other Pi extensions, it runs in the Pi process with that process's operating-system permissions.
