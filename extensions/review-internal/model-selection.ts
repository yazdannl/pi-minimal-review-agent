export const REVIEW_MODEL_TIERS = ["high", "medium", "low"] as const;
export type ReviewModelTier = (typeof REVIEW_MODEL_TIERS)[number];

export interface ReviewModelSelection {
  tier: ReviewModelTier;
  provider: string;
  modelId: string;
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

export function getReviewModelSelection(settings: unknown, requestedTier: ReviewModelTier = "medium"): ReviewModelSelection {
  const section = isRecord(settings) ? settings.review_work : undefined;
  const hasTierMap = isRecord(section) && Object.prototype.hasOwnProperty.call(section, "models");
  if (hasTierMap) {
    const models = section.models;
    if (!isRecord(models)) {
      throw new Error('Invalid review_work.models setting. Configure a model map with high, medium, and low provider/modelId strings.');
    }
    if (!Object.prototype.hasOwnProperty.call(models, requestedTier)) {
      throw new Error(`The review_work.models setting is missing the requested "${requestedTier}" tier. Configure review_work.models.${requestedTier} with an exact provider/modelId string.`);
    }
    return { tier: requestedTier, ...parseModelId(models[requestedTier], `review_work.models.${requestedTier}`) };
  }

  if (!isRecord(section) || typeof section.model !== "string" || !section.model.trim()) {
    throw new Error('No review model is configured. Set review_work.models with high, medium, and low model IDs, or retain the legacy review_work.model setting.');
  }
  return { tier: requestedTier, ...parseModelId(section.model, "review_work.model") };
}
