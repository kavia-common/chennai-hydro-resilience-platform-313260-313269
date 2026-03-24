import { getApiBaseUrl } from "./env";

export type FloodRiskStep = {
  ONI: number;
  DMI: number;
  Nino34_ERSST: number;
  BEST_ENSO: number;
  month: number; // 1..12
};

export type FloodRiskRequest = {
  sequence: FloodRiskStep[];
};

export type FloodRiskResponse = {
  predicted_rainfall_mm: number;
  flood_probability_pct: number;
};

export type ModelInfoResponse = {
  model_a: null | {
    provider: string;
    seq_len: number;
    lag_months: number;
    features: string[];
    flood_threshold_mm: number;
  };
  model_b: unknown | null;
};

async function apiFetch<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const base = getApiBaseUrl().replace(/\/+$/, "");
  const url = `${base}${path.startsWith("/") ? path : `/${path}`}`;

  try {
    const res = await fetch(url, {
      ...init,
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers || {})
      }
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return {
        ok: false,
        error: text || `Request failed: ${res.status} ${res.statusText}`
      };
    }

    const data = (await res.json()) as T;
    return { ok: true, data };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "Network error"
    };
  }
}

/**
 * PUBLIC_INTERFACE
 */
export async function getHealth() {
  /** Calls backend /health endpoint. */
  return apiFetch<{ status: string }>("/health");
}

/**
 * PUBLIC_INTERFACE
 */
export async function getModelInfo() {
  /** Calls backend /model/info endpoint. */
  return apiFetch<ModelInfoResponse>("/model/info");
}

/**
 * PUBLIC_INTERFACE
 */
export async function predictFloodRisk(req: FloodRiskRequest) {
  /** Calls backend Model A endpoint /predict/flood_risk. */
  return apiFetch<FloodRiskResponse>("/predict/flood_risk", {
    method: "POST",
    body: JSON.stringify(req)
  });
}
