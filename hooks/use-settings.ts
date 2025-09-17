"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Settings } from "@/lib/settings/enum";

interface UserSettings {
  [Settings.OpenaiApiKey]?: string;
  [Settings.JiraBaseUrl]?: string;
  [Settings.JiraEmail]?: string;
  [Settings.JiraApiKey]?: string;
}

interface UseSettingsReturn {
  settings: UserSettings | null;
  isLoading: boolean;
  error: string | null;
  updateSetting: (key: Settings, value: string) => Promise<boolean>;
  removeSetting: (key: Settings) => Promise<boolean>;
  refetch: () => Promise<void>;
  isSettingConfigured: (key: Settings) => boolean;
}

export function useSettings(): UseSettingsReturn {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSettings = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch("/api/settings", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao carregar configurações");
      }

      setSettings(data.settings || {});
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro desconhecido";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateSetting = async (key: Settings, value: string): Promise<boolean> => {
    try {
      const response = await fetch("/api/settings", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ [key]: value }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao atualizar configuração");
      }

      // Atualizar estado local
      setSettings((prev) => ({
        ...prev,
        [key]: value.startsWith("sk-")
          ? `sk-...${value.slice(-4)}`
          : value.includes("@") && key === Settings.JiraApiKey
          ? `***...${value.slice(-4)}`
          : value,
      }));

      toast.success("Configuração atualizada com sucesso!");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao atualizar configuração";
      toast.error(errorMessage);
      return false;
    }
  };

  const removeSetting = async (key: Settings): Promise<boolean> => {
    try {
      const response = await fetch(`/api/settings?key=${key}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Erro ao remover configuração");
      }

      // Atualizar estado local
      setSettings((prev) => {
        if (!prev) return prev;
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });

      toast.success("Configuração removida com sucesso!");
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Erro ao remover configuração";
      toast.error(errorMessage);
      return false;
    }
  };

  const isSettingConfigured = (key: Settings): boolean => {
    return !!(settings && settings[key]);
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  return {
    settings,
    isLoading,
    error,
    updateSetting,
    removeSetting,
    refetch: fetchSettings,
    isSettingConfigured,
  };
}
