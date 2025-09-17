import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { Settings } from "@/lib/settings/enum";
import { encryptSettings, decryptSettings, maskSensitiveValue } from "@/lib/utils/encryption";

const settingsSchema = z.object({
  [Settings.OpenaiApiKey]: z.string().optional(),
  [Settings.JiraBaseUrl]: z.string().url("URL inválida").optional(),
  [Settings.JiraEmail]: z.string().email("Email inválido").optional(),
  [Settings.JiraApiKey]: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
      select: { settings: true },
    });

    const settings = userSetting?.settings || {};

    // Descriptografar e mascarar chaves sensíveis para exibição
    const decryptedSettings = settings ? decryptSettings(settings as Record<string, string>) : {};
    const maskedSettings = {
      ...decryptedSettings,
      [Settings.OpenaiApiKey]: decryptedSettings[Settings.OpenaiApiKey]
        ? maskSensitiveValue(decryptedSettings[Settings.OpenaiApiKey])
        : undefined,
      [Settings.JiraApiKey]: decryptedSettings[Settings.JiraApiKey]
        ? maskSensitiveValue(decryptedSettings[Settings.JiraApiKey])
        : undefined,
    };

    return NextResponse.json({
      success: true,
      settings: maskedSettings,
    });
  } catch (error) {
    console.error("Erro ao buscar configurações:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    // Filtrar apenas campos com valores
    const settingsToUpdate = Object.fromEntries(
      Object.entries(validatedData).filter(([, value]) => value !== undefined && value !== ""),
    );

    // Buscar configurações existentes
    let userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
    });

    const currentSettings = userSetting?.settings || {};

    // Descriptografar configurações existentes, mesclar com novas e criptografar
    const decryptedCurrentSettings = currentSettings ? decryptSettings(currentSettings as Record<string, string>) : {};
    const mergedSettings = {
      ...decryptedCurrentSettings,
      ...settingsToUpdate,
    };
    const updatedSettings = encryptSettings(mergedSettings);

    if (userSetting) {
      // Atualizar configurações existentes
      userSetting = await prisma.userSetting.update({
        where: { userId: session.user.id },
        data: {
          settings: updatedSettings,
          updatedAt: new Date(),
        },
      });
    } else {
      // Criar novas configurações
      userSetting = await prisma.userSetting.create({
        data: {
          userId: session.user.id,
          settings: encryptSettings(settingsToUpdate),
        },
      });
    }

    return NextResponse.json({
      success: true,
      message: "Configurações atualizadas com sucesso",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Dados inválidos", details: error.issues }, { status: 400 });
    }

    console.error("Erro ao atualizar configurações:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: request.headers,
    });

    if (!session) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const settingKey = searchParams.get("key");

    if (!settingKey || !Object.values(Settings).includes(settingKey as Settings)) {
      return NextResponse.json({ error: "Chave de configuração inválida" }, { status: 400 });
    }

    const userSetting = await prisma.userSetting.findUnique({
      where: { userId: session.user.id },
    });

    if (!userSetting) {
      return NextResponse.json({ error: "Configurações não encontradas" }, { status: 404 });
    }

    const currentSettings = (userSetting.settings as Record<string, string>) || {};
    const decryptedSettings = decryptSettings(currentSettings as Record<string, string>);
    delete decryptedSettings[settingKey];
    const encryptedSettings = encryptSettings(decryptedSettings);

    await prisma.userSetting.update({
      where: { userId: session.user.id },
      data: {
        settings: encryptedSettings,
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Configuração removida com sucesso",
    });
  } catch (error) {
    console.error("Erro ao remover configuração:", error);
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 });
  }
}
