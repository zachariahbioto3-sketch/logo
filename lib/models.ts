export const MODELS = [
  { id: "gemini-2.0-flash", label: "Gemini 2.0 Flash" },
  { id: "gemini-2.0-flash-lite", label: "Gemini 2.0 Flash-Lite" },
  { id: "gemini-1.5-flash", label: "Gemini 1.5 Flash" },
] as const;

export type ModelId = typeof MODELS[number]["id"];
export const DEFAULT_MODEL: ModelId = "gemini-2.0-flash";
export const ALLOWED_MODELS = new Set(MODELS.map((m) => m.id));
