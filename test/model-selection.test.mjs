import assert from "node:assert/strict";
import test from "node:test";
import { getReviewModelSelection } from "../extensions/review-internal/model-selection.ts";

const settings = {
  review_work: {
    models: {
      high: "github-copilot/claude-opus-5.5",
      medium: "github-copilot/gpt-6-sol",
      low: "github-copilot/gpt-6-luna",
    },
  },
};

test("selects the requested tier and defaults to medium", () => {
  assert.deepEqual(getReviewModelSelection(settings), {
    tier: "medium",
    provider: "github-copilot",
    modelId: "gpt-6-sol",
  });
  assert.deepEqual(getReviewModelSelection(settings, "high"), {
    tier: "high",
    provider: "github-copilot",
    modelId: "claude-opus-5.5",
  });
  assert.deepEqual(getReviewModelSelection(settings, "low"), {
    tier: "low",
    provider: "github-copilot",
    modelId: "gpt-6-luna",
  });
});

test("uses the legacy single model only when no tier map is present", () => {
  assert.deepEqual(getReviewModelSelection({ review_work: { model: "local/reviewer" } }, "high"), {
    tier: "high",
    provider: "local",
    modelId: "reviewer",
  });
});

test("fails clearly rather than falling back when a tier map lacks the requested tier", () => {
  assert.throws(
    () => getReviewModelSelection({ review_work: { models: { medium: "local/reviewer" }, model: "legacy/reviewer" } }, "high"),
    /missing the requested "high" tier/,
  );
});
