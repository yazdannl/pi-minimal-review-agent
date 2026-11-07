import assert from "node:assert/strict";
import test from "node:test";
import { findReviewModelSelection, getReviewModelSelection } from "../extensions/review-internal/model-selection.ts";

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

test("accepts per-tier objects that override the thinking level", () => {
  const withOverride = {
    review_work: {
      models: {
        high: "github-copilot/claude-opus-5.5",
        medium: { model: "github-copilot/gpt-6-sol" },
        low: { model: "opencode-go/deepseek-v4.1-flash", thinkingLevel: "max" },
      },
      thinkingLevel: "medium",
    },
  };
  assert.deepEqual(getReviewModelSelection(withOverride, "low"), {
    tier: "low",
    provider: "opencode-go",
    modelId: "deepseek-v4.1-flash",
    thinkingLevel: "max",
  });
  assert.deepEqual(getReviewModelSelection(withOverride, "medium"), {
    tier: "medium",
    provider: "github-copilot",
    modelId: "gpt-6-sol",
  });
});

test("rejects malformed tier objects and thinking overrides", () => {
  const withLow = (low) => ({ review_work: { models: { low } } });
  assert.throws(() => getReviewModelSelection(withLow({}), "low"), /review_work\.models\.low\.model/);
  assert.throws(() => getReviewModelSelection(withLow({ model: 5 }), "low"), /review_work\.models\.low\.model/);
  assert.throws(() => getReviewModelSelection(withLow(null), "low"), /Invalid review_work\.models\.low value/);
  assert.throws(
    () => getReviewModelSelection(withLow({ model: "opencode-go/deepseek-v4.1-flash", thinkinglevel: "max" }), "low"),
    /Invalid review_work\.models\.low field/,
  );
  assert.throws(
    () => getReviewModelSelection(withLow({ model: "opencode-go/deepseek-v4.1-flash", thinkingLevel: " max " }), "low"),
    /thinkingLevel/,
  );
  assert.throws(() => getReviewModelSelection(withLow({ model: "no-slash", thinkingLevel: "max" }), "low"), /provider\/modelId/);
});

test("finds the tier entry for a recorded model so replies reuse its thinking override", () => {
  const settings = {
    review_work: {
      models: {
        high: "github-copilot/claude-opus-5.5",
        medium: "github-copilot/gpt-6-sol",
        low: { model: "opencode-go/deepseek-v4.1-flash", thinkingLevel: "max" },
      },
    },
  };
  assert.deepEqual(findReviewModelSelection(settings, "opencode-go", "deepseek-v4.1-flash"), {
    tier: "low",
    provider: "opencode-go",
    modelId: "deepseek-v4.1-flash",
    thinkingLevel: "max",
  });
  assert.equal(findReviewModelSelection(settings, "opencode-go", "deepseek-v4-pro"), undefined);
  assert.deepEqual(findReviewModelSelection({ review_work: { model: "local/reviewer" } }, "local", "reviewer"), {
    tier: "high",
    provider: "local",
    modelId: "reviewer",
  });
});
