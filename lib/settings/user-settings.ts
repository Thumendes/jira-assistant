import { prisma } from "../prisma";
import { decrypt, decryptSettings, encrypt } from "../utils/encryption";
import { Settings } from "./enum";

export class UserSettings {
  private constructor(
    private readonly userId: string,
    private settings: Record<Settings, string>,
  ) {}

  get(key: Settings) {
    const value = this.settings[key];
    if (!value) return null;

    return decrypt(value);
  }

  all() {
    return decryptSettings(this.settings);
  }

  async set(key: Settings, value: string) {
    this.settings[key] = encrypt(value);
    await this.save();
  }

  async delete(key: Settings) {
    delete this.settings[key];
    await this.save();
  }

  private async save() {
    await prisma.userSetting.upsert({
      where: { userId: this.userId },
      create: { userId: this.userId, settings: this.settings },
      update: { settings: this.settings },
    });
  }

  static async forUser(userId: string) {
    const settings = await prisma.user.findUnique({ where: { id: userId } }).userSetting();

    return new UserSettings(userId, (settings?.settings as Record<Settings, string>) || {});
  }
}
