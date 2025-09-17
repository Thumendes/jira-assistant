"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Key,
  Globe,
  Mail,
  Save,
  Eye,
  EyeOff,
  Trash2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  HelpCircle,
} from "lucide-react";
import { toast } from "sonner";
import { useSettings } from "@/hooks/use-settings";
import { Settings } from "@/lib/settings/enum";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const settingsSchema = z.object({
  [Settings.OpenaiApiKey]: z
    .string()
    .min(1, "Chave da API OpenAI é obrigatória")
    .startsWith("sk-", "Chave deve começar com 'sk-'")
    .optional(),
  [Settings.JiraBaseUrl]: z.string().url("URL inválida").optional(),
  [Settings.JiraEmail]: z.string().email("Email inválido").optional(),
  [Settings.JiraApiKey]: z.string().min(1, "Token da API JIRA é obrigatório").optional(),
});

type SettingsFormData = z.infer<typeof settingsSchema>;

interface SettingConfig {
  key: Settings;
  label: string;
  description: string;
  icon: React.ReactNode;
  type: "password" | "email" | "url" | "text";
  placeholder: string;
  helpUrl?: string;
  isRequired?: boolean;
}

const SETTINGS_CONFIG: SettingConfig[] = [
  {
    key: Settings.OpenaiApiKey,
    label: "Chave da API OpenAI",
    description: "Chave necessária para utilizar os recursos de IA do ChatGPT e outros modelos",
    icon: <Key className="w-4 h-4" />,
    type: "password",
    placeholder: "sk-proj-...",
    helpUrl: "https://platform.openai.com/api-keys",
    isRequired: true,
  },
  {
    key: Settings.JiraBaseUrl,
    label: "URL Base do JIRA",
    description: "URL da sua instância do JIRA (ex: https://sua-empresa.atlassian.net)",
    icon: <Globe className="w-4 h-4" />,
    type: "url",
    placeholder: "https://sua-empresa.atlassian.net",
    helpUrl: "https://support.atlassian.com/atlassian-account/docs/what-is-an-atlassian-site/",
  },
  {
    key: Settings.JiraEmail,
    label: "Email do JIRA",
    description: "Seu email cadastrado no JIRA para autenticação",
    icon: <Mail className="w-4 h-4" />,
    type: "email",
    placeholder: "seu-email@empresa.com",
  },
  {
    key: Settings.JiraApiKey,
    label: "Token da API JIRA",
    description: "Token de API para acessar o JIRA (API Token ou Personal Access Token)",
    icon: <Key className="w-4 h-4" />,
    type: "password",
    placeholder: "ATATT3xFfGF0...",
    helpUrl: "https://support.atlassian.com/atlassian-account/docs/manage-api-tokens-for-your-atlassian-account/",
  },
];

export function SettingsForm() {
  const { settings, isLoading, updateSetting, removeSetting, isSettingConfigured } = useSettings();
  const [visibleFields, setVisibleFields] = useState<Record<string, boolean>>({});
  const [savingFields, setSavingFields] = useState<Record<string, boolean>>({});

  const {
    register,
    formState: { errors },
    setValue,
    watch,
  } = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });

  const toggleFieldVisibility = (field: string) => {
    setVisibleFields((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handleSaveSetting = async (key: Settings, value: string) => {
    if (!value.trim()) return;

    setSavingFields((prev) => ({ ...prev, [key]: true }));
    const success = await updateSetting(key, value);
    setSavingFields((prev) => ({ ...prev, [key]: false }));

    if (success) {
      setValue(key, ""); // Limpar o campo após salvar
    }
  };

  const handleRemoveSetting = async (key: Settings) => {
    await removeSetting(key);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        {SETTINGS_CONFIG.map((config) => (
          <Card key={config.key} className="animate-pulse">
            <CardHeader>
              <div className="h-5 bg-muted rounded w-1/3"></div>
              <div className="h-4 bg-muted rounded w-2/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-10 bg-muted rounded w-full"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-2xl font-bold">Configurações da Conta</h2>
        <p className="text-muted-foreground">
          Configure suas chaves de API e credenciais para integrar com serviços externos
        </p>
      </div>

      <Separator />

      <div className="space-y-6">
        {SETTINGS_CONFIG.map((config) => {
          const isConfigured = isSettingConfigured(config.key);
          const currentValue = settings?.[config.key];
          const watchedValue = watch(config.key);
          const isSaving = savingFields[config.key];

          return (
            <Card key={config.key} className="relative">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <CardTitle className="text-lg">{config.label}</CardTitle>
                    {config.isRequired && <Badge variant="secondary">Obrigatório</Badge>}
                    {isConfigured && (
                      <Badge variant="default" className="bg-green-100 text-green-800">
                        Configurado
                      </Badge>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {config.helpUrl && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="p-1 h-6 w-6"
                              onClick={() => window.open(config.helpUrl, "_blank")}
                            >
                              <HelpCircle className="w-3 h-3" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Ver documentação</p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}

                    {isConfigured && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="p-1 h-6 w-6 text-destructive hover:text-destructive"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Remover Configuração</DialogTitle>
                            <DialogDescription>
                              Tem certeza que deseja remover a configuração &quot;{config.label}&quot;? Esta ação não
                              pode ser desfeita.
                            </DialogDescription>
                          </DialogHeader>
                          <DialogFooter>
                            <Button variant="outline">Cancelar</Button>
                            <Button variant="destructive" onClick={() => handleRemoveSetting(config.key)}>
                              Remover
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    )}
                  </div>
                </div>

                <CardDescription>{config.description}</CardDescription>

                {isConfigured && currentValue && (
                  <Alert>
                    <CheckCircle className="h-4 w-4" />
                    <AlertDescription>
                      <span className="font-medium">Valor atual:</span>{" "}
                      <code className="bg-muted px-1.5 py-0.5 rounded text-sm">{currentValue}</code>
                    </AlertDescription>
                  </Alert>
                )}
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor={config.key}>
                    {isConfigured ? `Atualizar ${config.label}` : `Configurar ${config.label}`}
                  </Label>

                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        id={config.key}
                        type={
                          config.type === "password" && !visibleFields[config.key]
                            ? "password"
                            : config.type === "password"
                              ? "text"
                              : config.type
                        }
                        placeholder={config.placeholder}
                        disabled={isSaving}
                        {...register(config.key)}
                        className={errors[config.key] ? "border-red-500" : ""}
                      />

                      {config.type === "password" && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => toggleFieldVisibility(config.key)}
                        >
                          {visibleFields[config.key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      )}
                    </div>

                    <Button
                      type="button"
                      onClick={() => {
                        const value = watchedValue;
                        if (value) {
                          handleSaveSetting(config.key, value);
                        }
                      }}
                      disabled={!watchedValue || isSaving}
                      className="min-w-[100px]"
                    >
                      {isSaving ? (
                        <>
                          <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
                          Salvando...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 mr-2" />
                          Salvar
                        </>
                      )}
                    </Button>
                  </div>

                  {errors[config.key] && (
                    <p className="text-sm text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {errors[config.key]?.message}
                    </p>
                  )}
                </div>

                {config.helpUrl && (
                  <div className="pt-2 border-t">
                    <Button
                      variant="link"
                      size="sm"
                      className="p-0 h-auto text-muted-foreground hover:text-primary"
                      onClick={() => window.open(config.helpUrl, "_blank")}
                    >
                      <ExternalLink className="w-3 h-3 mr-1" />
                      Como obter esta configuração
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Status Overview */}
      <Card>
        <CardHeader>
          <CardTitle>Status das Configurações</CardTitle>
          <CardDescription>Resumo do status das suas configurações</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SETTINGS_CONFIG.map((config) => {
              const isConfigured = isSettingConfigured(config.key);
              return (
                <div key={config.key} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <div className="flex items-center gap-2">
                    {config.icon}
                    <span className="font-medium">{config.label}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-2 h-2 rounded-full ${
                        isConfigured ? "bg-green-500" : config.isRequired ? "bg-red-500" : "bg-yellow-500"
                      }`}
                    />
                    <span
                      className={`text-sm ${
                        isConfigured ? "text-green-600" : config.isRequired ? "text-red-600" : "text-yellow-600"
                      }`}
                    >
                      {isConfigured ? "Configurado" : config.isRequired ? "Obrigatório" : "Opcional"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
