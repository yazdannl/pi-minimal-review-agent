export const REVIEW_MODEL_TIERS = ["high", "medium", "low"] as const;
export type ReviewModelTier = (typeof REVIEW_MODEL_TIERS)[number];

export interface ReviewModelSelection {
  tier: ReviewModelTier;
  provider: string;
  modelId: string;
  /** Per-tier thinking level override; undefined falls back to review_work.thinkingLevel. */
  thinkingLevel?: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseModelId(value: unknown, setting: string): { provider: string; modelId: string } {
  if (typeof value !== "string" || !value.trim() || value !== value.trim()) {
    throw new Error(`Invalid ${setting} value. Use the exact provider/modelId form.`);
  }
  const slash = value.indexOf("/");
  const provider = slash > 0 ? value.slice(0, slash) : "";
  const modelId = slash > 0 ? value.slice(slash + 1) : "";
  if (!provider || !modelId || /[\s\u0000-\u001f]/.test(provider) || /[\s\u0000-\u001f]/.test(modelId)) {
    throw new Error(`Invalid ${setting} value ${JSON.stringify(value)}. Use the exact provider/modelId form.`);
  }
  return { provider, modelId };
}

function parseModelEntry(value: unknown, setting: string): { provider: string; modelId: string; thinkingLevel?: string } {
  if (typeof value === "string") return parseModelId(value, setting);
  if (!isRecord(value)) {
    throw new Error(`Invalid ${setting} value. Use an exact provider/modelId string or an object with a "model" string and optional "thinkingLevel".`);
  }
  const unknown = Object.keys(value).filter((key) => key !== "model" && key !== "thinkingLevel");
  if (unknown.length > 0) {
    throw new Error(`Invalid ${setting} field(s) ${JSON.stringify(unknown)}. Use "model" and optional "thinkingLevel".`);
  }
  const thinkingLevel = value.thinkingLevel;
  if (thinkingLevel !== undefined && (typeof thinkingLevel !== "string" || !thinkingLevel.trim() || thinkingLevel !== thinkingLevel.trim())) {
    throw new Error(`Invalid ${setting}.thinkingLevel value ${JSON.stringify(thinkingLevel)}. Use a thinking level name such as "max".`);
  }
  return {
    ...parseModelId(value.model, `${setting}.model`),
    ...(typeof thinkingLevel === "string" ? { thinkingLevel } : {}),
  };
}

export function getReviewModelSelection(settings: unknown, requestedTier: ReviewModelTier = "medium"): ReviewModelSelection {
  const section = isRecord(settings) ? settings.review_work : undefined;
  const hasTierMap = isRecord(section) && Object.prototype.hasOwnProperty.call(section, "models");
  if (hasTierMap) {
    const models = section.models;
    if (!isRecord(models)) {
      throw new Error('Invalid review_work.models setting. Configure a model map with high, medium, and low entries, each a provider/modelId string or an object with "model" and optional "thinkingLevel".');
    }
    if (!Object.prototype.hasOwnProperty.call(models, requestedTier)) {
      throw new Error(`The review_work.models setting is missing the requested "${requestedTier}" tier. Configure review_work.models.${requestedTier} with an exact provider/modelId string or a {model, thinkingLevel} entry.`);
    }
    return { tier: requestedTier, ...parseModelEntry(models[requestedTier], `review_work.models.${requestedTier}`) };
  }

  if (!isRecord(section) || typeof section.model !== "string" || !section.model.trim()) {
    throw new Error('No review model is configured. Set review_work.models with high, medium, and low model IDs, or retain the legacy review_work.model setting.');
  }
  return { tier: requestedTier, ...parseModelId(section.model, "review_work.model") };
}

/** Find the tier entry (and its thinking override) that configured an exact provider/modelId pair. */
export function findReviewModelSelection(settings: unknown, provider: string, modelId: string): ReviewModelSelection | undefined {
  for (const tier of REVIEW_MODEL_TIERS) {
    let selection: ReviewModelSelection;
    try {
      selection = getReviewModelSelection(settings, tier);
    } catch {
      continue;
    }
    if (selection.provider === provider && selection.modelId === modelId) return selection;
  }
  return undefined;
}
