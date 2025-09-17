"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Loader2, TestTube, AlertTriangle, Wifi, WifiOff } from "lucide-react";
import { Settings } from "@/lib/settings/enum";
import { useSettings } from "@/hooks/use-settings";

interface ValidationResult {
  isValid: boolean;
  message: string;
  details?: string;
}

interface ApiValidationStatus {
  [Settings.OpenaiApiKey]: ValidationResult | null;
  [Settings.JiraBaseUrl]: ValidationResult | null;
  [Settings.JiraEmail]: ValidationResult | null;
  [Settings.JiraApiKey]: ValidationResult | null;
}

export function ApiValidator() {
  const { settings, isSettingConfigured } = useSettings();
  const [validationStatus, setValidationStatus] = useState<ApiValidationStatus>({
    [Settings.OpenaiApiKey]: null,
    [Settings.JiraBaseUrl]: null,
    [Settings.JiraEmail]: null,
    [Settings.JiraApiKey]: null,
  });
  const [isValidating, setIsValidating] = useState<Record<string, boolean>>({});

  const validateOpenAI = async (): Promise<ValidationResult> => {
    try {
      // Simular validação da API OpenAI
      const response = await fetch("https://api.openai.com/v1/models", {
        headers: {
          Authorization: `Bearer ${settings?.[Settings.OpenaiApiKey]}`,
        },
      });

      if (response.ok) {
        return {
          isValid: true,
          message: "Chave da API OpenAI válida",
          details: "Conexão estabelecida com sucesso",
        };
      } else if (response.status === 401) {
        return {
          isValid: false,
          message: "Chave da API OpenAI inválida",
          details: "Verifique se a chave foi copiada corretamente",
        };
      } else {
        return {
          isValid: false,
          message: "Erro ao validar API OpenAI",
          details: `Status: ${response.status}`,
        };
      }
    } catch {
      return {
        isValid: false,
        message: "Erro de conexão com OpenAI",
        details: "Verifique sua conexão com a internet",
      };
    }
  };

  const validateJiraConnection = async (): Promise<ValidationResult> => {
    try {
      const baseUrl = settings?.[Settings.JiraBaseUrl];
      const email = settings?.[Settings.JiraEmail];
      const apiKey = settings?.[Settings.JiraApiKey];

      if (!baseUrl || !email || !apiKey) {
        return {
          isValid: false,
          message: "Configurações do JIRA incompletas",
          details: "Configure URL, email e token da API",
        };
      }

      // Tentar acessar informações do usuário JIRA
      const response = await fetch(`${baseUrl}/rest/api/3/myself`, {
        headers: {
          Authorization: `Basic ${btoa(`${email}:${apiKey}`)}`,
          Accept: "application/json",
        },
      });

      if (response.ok) {
        const userData = await response.json();
        return {
          isValid: true,
          message: "Conexão com JIRA estabelecida",
          details: `Conectado como: ${userData.displayName || email}`,
        };
      } else if (response.status === 401) {
        return {
          isValid: false,
          message: "Credenciais do JIRA inválidas",
          details: "Verifique email e token da API",
        };
      } else if (response.status === 404) {
        return {
          isValid: false,
          message: "URL do JIRA não encontrada",
          details: "Verifique a URL da sua instância JIRA",
        };
      } else {
        return {
          isValid: false,
          message: "Erro ao conectar com JIRA",
          details: `Status: ${response.status}`,
        };
      }
    } catch {
      return {
        isValid: false,
        message: "Erro de conexão com JIRA",
        details: "Verifique URL e conexão com a internet",
      };
    }
  };

  const validateUrl = async (url: string): Promise<ValidationResult> => {
    try {
      const urlObj = new URL(url);

      // Verificar se é uma URL Atlassian válida
      if (!urlObj.hostname.includes("atlassian.net") && !urlObj.hostname.includes("jira")) {
        return {
          isValid: false,
          message: "URL não parece ser uma instância JIRA",
          details: "Use uma URL como: https://sua-empresa.atlassian.net",
        };
      }

      // Tentar fazer uma requisição básica para verificar conectividade
      await fetch(url, { method: "HEAD", mode: "no-cors" });

      return {
        isValid: true,
        message: "URL do JIRA válida",
        details: "URL está acessível",
      };
    } catch {
      return {
        isValid: false,
        message: "URL inválida",
        details: "Verifique o formato da URL",
      };
    }
  };

  const validateSetting = async (setting: Settings) => {
    setIsValidating((prev) => ({ ...prev, [setting]: true }));

    let result: ValidationResult;

    switch (setting) {
      case Settings.OpenaiApiKey:
        result = await validateOpenAI();
        break;
      case Settings.JiraBaseUrl:
        if (settings?.[Settings.JiraBaseUrl]) {
          result = await validateUrl(settings[Settings.JiraBaseUrl]!);
        } else {
          result = { isValid: false, message: "URL não configurada" };
        }
        break;
      case Settings.JiraEmail:
        result = {
          isValid: true,
          message: "Email configurado",
          details: "Email será validado junto com o token da API",
        };
        break;
      case Settings.JiraApiKey:
        result = await validateJiraConnection();
        break;
      default:
        result = { isValid: false, message: "Configuração não reconhecida" };
    }

    setValidationStatus((prev) => ({
      ...prev,
      [setting]: result,
    }));

    setIsValidating((prev) => ({ ...prev, [setting]: false }));
  };

  const validateAllSettings = async () => {
    const configuredSettings = Object.values(Settings).filter((setting) => isSettingConfigured(setting));

    for (const setting of configuredSettings) {
      await validateSetting(setting);
    }
  };

  const getStatusIcon = (result: ValidationResult | null, isLoading: boolean) => {
    if (isLoading) return <Loader2 className="w-4 h-4 animate-spin" />;
    if (!result) return <TestTube className="w-4 h-4 text-muted-foreground" />;
    return result.isValid ? (
      <CheckCircle className="w-4 h-4 text-green-500" />
    ) : (
      <XCircle className="w-4 h-4 text-red-500" />
    );
  };

  const getStatusBadge = (result: ValidationResult | null, isLoading: boolean) => {
    if (isLoading) return <Badge variant="secondary">Validando...</Badge>;
    if (!result) return <Badge variant="outline">Não testado</Badge>;
    return result.isValid ? (
      <Badge variant="default" className="bg-green-100 text-green-800">
        Válido
      </Badge>
    ) : (
      <Badge variant="destructive">Inválido</Badge>
    );
  };

  const settingsConfig = [
    {
      key: Settings.OpenaiApiKey,
      label: "OpenAI API",
      description: "Validar conexão com a API da OpenAI",
    },
    {
      key: Settings.JiraBaseUrl,
      label: "URL do JIRA",
      description: "Verificar acessibilidade da URL",
    },
    {
      key: Settings.JiraEmail,
      label: "Email do JIRA",
      description: "Email para autenticação",
    },
    {
      key: Settings.JiraApiKey,
      label: "JIRA API Token",
      description: "Validar autenticação completa do JIRA",
    },
  ];

  const hasConfiguredSettings = settingsConfig.some((config) => isSettingConfigured(config.key));

  if (!hasConfiguredSettings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <WifiOff className="w-5 h-5" />
            Validação de APIs
          </CardTitle>
          <CardDescription>Configure suas APIs primeiro para poder validar as conexões</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Nenhuma configuração de API encontrada. Configure suas chaves primeiro na aba de configurações.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Wifi className="w-5 h-5" />
          Validação de APIs
        </CardTitle>
        <CardDescription>
          Teste suas configurações de API para garantir que estão funcionando corretamente
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex justify-between items-center">
          <p className="text-sm text-muted-foreground">
            Teste individualmente ou valide todas as configurações de uma vez
          </p>
          <Button onClick={validateAllSettings} disabled={Object.values(isValidating).some(Boolean)} variant="outline">
            {Object.values(isValidating).some(Boolean) ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Validando...
              </>
            ) : (
              <>
                <TestTube className="w-4 h-4 mr-2" />
                Validar Todas
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4">
          {settingsConfig.map((config) => {
            const isConfigured = isSettingConfigured(config.key);
            const result = validationStatus[config.key];
            const isLoading = isValidating[config.key];

            if (!isConfigured) {
              return (
                <div
                  key={config.key}
                  className="flex items-center justify-between p-3 bg-muted/50 rounded-lg opacity-50"
                >
                  <div>
                    <p className="font-medium text-muted-foreground">{config.label}</p>
                    <p className="text-sm text-muted-foreground">Não configurado</p>
                  </div>
                  <Badge variant="outline">Não configurado</Badge>
                </div>
              );
            }

            return (
              <div key={config.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div className="flex items-center gap-3">
                  {getStatusIcon(result, isLoading)}
                  <div>
                    <p className="font-medium">{config.label}</p>
                    <p className="text-sm text-muted-foreground">{result ? result.message : config.description}</p>
                    {result?.details && <p className="text-xs text-muted-foreground mt-1">{result.details}</p>}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {getStatusBadge(result, isLoading)}
                  <Button size="sm" variant="ghost" onClick={() => validateSetting(config.key)} disabled={isLoading}>
                    {isLoading ? "Testando..." : "Testar"}
                  </Button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Summary */}
        <div className="pt-4 border-t">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-2xl font-bold text-green-600">
                {Object.values(validationStatus).filter((result) => result?.isValid).length}
              </div>
              <div className="text-sm text-muted-foreground">Válidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {Object.values(validationStatus).filter((result) => result && !result.isValid).length}
              </div>
              <div className="text-sm text-muted-foreground">Inválidas</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-600">
                {Object.values(validationStatus).filter((result) => !result).length}
              </div>
              <div className="text-sm text-muted-foreground">Não testadas</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
