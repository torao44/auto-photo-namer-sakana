import { AnalysisResult, NamingConfig, PetProfile, FocusPoint, LocationInfo } from "../types";

const API_BASE = ""; // same origin

export async function analyzePhoto(params: {
  imageBase64: string;
  mimeType: string;
  petProfiles: PetProfile[];
  namingConfig: NamingConfig;
  focusPoint?: FocusPoint;
  location?: LocationInfo;
  apiKey: string;
}): Promise<AnalysisResult> {
  const res = await fetch(`${API_BASE}/api/analyze-photo`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-sakana-api-key": params.apiKey,
    },
    body: JSON.stringify(params),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `HTTP ${res.status}`);
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string }> {
  const res = await fetch(`${API_BASE}/api/health`);
  return res.json();
}
