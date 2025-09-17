"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Save, CheckCircle, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { ImageUpload } from "./image-upload";

const profileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório").max(100, "Nome muito longo"),
  email: z.string().email("Email inválido"),
  image: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

interface User {
  id: string;
  name: string;
  email: string;
  image?: string | null;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

interface ProfileFormProps {
  user: User;
  onUpdate?: (updatedUser: Partial<User>) => void;
  disabled?: boolean;
}

export function ProfileForm({ user, onUpdate, disabled = false }: ProfileFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [currentImage, setCurrentImage] = useState<string>(user.image || "");

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
    setValue,
    watch,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: user.name,
      email: user.email,
      image: user.image || "",
    },
  });

  const watchedImage = watch("image");

  useEffect(() => {
    setCurrentImage(watchedImage || "");
  }, [watchedImage]);

  const onSubmit = async (data: ProfileFormData) => {
    setIsLoading(true);
    setSuccess(false);

    try {
      const response = await fetch("/api/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: data.name,
          image: data.image,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Erro ao atualizar perfil");
      }

      setSuccess(true);
      toast.success("Perfil atualizado com sucesso!");

      if (onUpdate) {
        onUpdate(result.user);
      }

      // Limpar sucesso após alguns segundos
      setTimeout(() => setSuccess(false), 3000);
    } catch (error) {
      console.error("Erro ao atualizar perfil:", error);
      toast.error(
        error instanceof Error ? error.message : "Erro ao atualizar perfil"
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = (imageUrl: string) => {
    setCurrentImage(imageUrl);
    setValue("image", imageUrl, { shouldDirty: true });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Informações do Perfil
        </CardTitle>
        <CardDescription>
          Gerencie suas informações pessoais e foto de perfil
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <Alert className="mb-4">
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Perfil atualizado com sucesso!
            </AlertDescription>
          </Alert>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Upload de Imagem */}
          <div className="space-y-2">
            <Label>Foto do Perfil</Label>
            <ImageUpload
              currentImage={currentImage}
              onImageChange={handleImageChange}
              userName={user.name}
              disabled={disabled || isLoading}
            />
          </div>

          {/* Nome */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="Digite seu nome"
              disabled={disabled || isLoading}
              {...register("name")}
              className={errors.name ? "border-red-500" : ""}
            />
            {errors.name && (
              <p className="text-sm text-red-500">{errors.name.message}</p>
            )}
          </div>

          {/* Email (readonly) */}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                disabled
                {...register("email")}
                className="bg-muted"
              />
              {!user.emailVerified && (
                <Alert className="mt-2">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Seu email ainda não foi verificado. Verifique sua caixa de entrada.
                  </AlertDescription>
                </Alert>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              O email não pode ser alterado após o cadastro.
            </p>
          </div>

          {/* Informações adicionais */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <Label className="text-sm font-medium">Conta criada em</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.createdAt)}
              </p>
            </div>
            <div>
              <Label className="text-sm font-medium">Última atualização</Label>
              <p className="text-sm text-muted-foreground">
                {formatDate(user.updatedAt)}
              </p>
            </div>
          </div>

          <Button
            type="submit"
            className="w-full"
            disabled={disabled || isLoading || !isDirty}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border border-gray-300 border-t-transparent rounded-full animate-spin mr-2" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Alterações
              </>
            )}
          </Button>

          {!isDirty && (
            <p className="text-sm text-muted-foreground text-center">
              Faça alterações nos campos acima para habilitar o botão de salvar.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
