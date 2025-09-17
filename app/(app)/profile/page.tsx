"use client";

import { PageLayout } from "@/components/layout/page-layout";
import { PasswordResetForm } from "@/components/profile/password-reset-form";
import { ProfileForm } from "@/components/profile/profile-form";
import { ApiValidator } from "@/components/settings/api-validator";
import { SettingsForm } from "@/components/settings/settings-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useProfile } from "@/hooks/use-profile";
import { AlertCircle, Cog, RefreshCw, Shield, User } from "lucide-react";
import { match, P } from "ts-pattern";

type ProfilePageProps = Record<string, never>;

export default function ProfilePage({}: ProfilePageProps) {
  const { user, isLoading, error, refetch, updateUser } = useProfile();

  return (
    <PageLayout title="Perfil">
      {/* Header */}
      <header className="p-6">
        <h1 className="font-semibold text-xl">Configure o seu perfil</h1>
        <p className="text-muted-foreground">
          Gerencie suas informações pessoais, configurações de conta e preferências de segurança
        </p>
      </header>

      <main className="p-6">
        {match({ user, isLoading, error })
          .with({ isLoading: true }, () => (
            <Card>
              <CardHeader>
                <CardTitle>
                  <Skeleton className="h-6 w-1/4" />
                </CardTitle>
                <CardDescription>
                  <Skeleton className="h-4 w-1/2" />
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </CardContent>
            </Card>
          ))
          .with({ error: P.string }, () => (
            <div className="max-w-4xl mx-auto">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="flex items-center justify-between">
                  <span>{error}</span>
                  <Button variant="outline" size="sm" onClick={refetch} className="ml-4">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Tentar novamente
                  </Button>
                </AlertDescription>
              </Alert>
            </div>
          ))
          .with({ user: P.nonNullable }, ({ user }) => (
            <Tabs defaultValue="profile" className="space-y-8">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Perfil
                </TabsTrigger>
                <TabsTrigger value="settings" className="flex items-center gap-2">
                  <Cog className="w-4 h-4" />
                  Configurações
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="w-4 h-4" />
                  Segurança
                </TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-8">
                {/* Profile Content */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Profile Information */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <User className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Informações Pessoais</h2>
                    </div>

                    <ProfileForm user={user} onUpdate={updateUser} />
                  </div>

                  {/* Account Status */}
                  <div className="space-y-6">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-5 h-5 text-primary" />
                      <h2 className="text-xl font-semibold">Status da Conta</h2>
                    </div>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Status da Conta</CardTitle>
                        <CardDescription>Informações sobre o status e verificação da sua conta</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <div
                              className={`w-2 h-2 rounded-full ${user.emailVerified ? "bg-green-500" : "bg-yellow-500"}`}
                            />
                            <span className="font-medium">Email</span>
                          </div>
                          <span className={`text-sm ${user.emailVerified ? "text-green-600" : "text-yellow-600"}`}>
                            {user.emailVerified ? "Verificado" : "Não verificado"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            <span className="font-medium">Conta</span>
                          </div>
                          <span className="text-sm text-green-600">Ativa</span>
                        </div>

                        {!user.emailVerified && (
                          <Alert>
                            <AlertCircle className="h-4 w-4" />
                            <AlertDescription>
                              Seu email ainda não foi verificado. Verifique sua caixa de entrada e clique no link de
                              verificação.
                            </AlertDescription>
                          </Alert>
                        )}
                      </CardContent>
                    </Card>

                    {/* Account Statistics */}
                    <Card>
                      <CardHeader>
                        <CardTitle>Estatísticas da Conta</CardTitle>
                        <CardDescription>Informações sobre sua atividade e histórico na plataforma</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 gap-4">
                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {new Date(user.createdAt).getFullYear()}
                            </div>
                            <div className="text-sm text-muted-foreground">Ano de Cadastro</div>
                          </div>

                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">
                              {Math.floor(
                                (new Date().getTime() - new Date(user.createdAt).getTime()) / (1000 * 60 * 60 * 24),
                              )}
                            </div>
                            <div className="text-sm text-muted-foreground">Dias Conosco</div>
                          </div>

                          <div className="text-center p-4 bg-muted rounded-lg">
                            <div className="text-2xl font-bold text-primary">{user.emailVerified ? "100%" : "50%"}</div>
                            <div className="text-sm text-muted-foreground">Perfil Completo</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="settings" className="space-y-6">
                <SettingsForm />
                <ApiValidator />
              </TabsContent>

              <TabsContent value="security" className="space-y-6">
                <div className="flex items-center gap-2 mb-6">
                  <Shield className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Configurações de Segurança</h2>
                </div>

                <PasswordResetForm />
              </TabsContent>
            </Tabs>
          ))
          .otherwise(() => null)}
      </main>
    </PageLayout>
  );
}
