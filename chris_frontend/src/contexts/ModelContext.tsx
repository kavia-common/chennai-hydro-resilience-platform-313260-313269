import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { FloodRiskResponse, ModelInfoResponse } from "../lib/api";
import { getModelInfo } from "../lib/api";
import { useToasts } from "./ToastContext";

type ModelState = {
  modelInfo: ModelInfoResponse | null;
  modelInfoLoading: boolean;
  lastFloodPrediction: FloodRiskResponse | null;
  setLastFloodPrediction: (p: FloodRiskResponse | null) => void;
  refreshModelInfo: () => Promise<void>;
};

const ModelContext = createContext<ModelState | null>(null);

/**
 * PUBLIC_INTERFACE
 */
export function ModelProvider({ children }: { children: React.ReactNode }) {
  /** Provides model metadata and prediction state across the app. */
  const { pushToast } = useToasts();

  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [modelInfoLoading, setModelInfoLoading] = useState(true);
  const [lastFloodPrediction, setLastFloodPrediction] = useState<FloodRiskResponse | null>(null);

  const refreshModelInfo = async () => {
    setModelInfoLoading(true);
    const res = await getModelInfo();
    if (res.ok) {
      setModelInfo(res.data);
    } else {
      pushToast({ variant: "error", title: "Backend not reachable", message: res.error });
    }
    setModelInfoLoading(false);
  };

  useEffect(() => {
    void refreshModelInfo();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo<ModelState>(
    () => ({
      modelInfo,
      modelInfoLoading,
      lastFloodPrediction,
      setLastFloodPrediction,
      refreshModelInfo
    }),
    [modelInfo, modelInfoLoading, lastFloodPrediction]
  );

  return <ModelContext.Provider value={value}>{children}</ModelContext.Provider>;
}

/**
 * PUBLIC_INTERFACE
 */
export function useModel(): ModelState {
  /** Hook to access model metadata and latest prediction. */
  const ctx = useContext(ModelContext);
  if (!ctx) throw new Error("useModel must be used within ModelProvider");
  return ctx;
}
