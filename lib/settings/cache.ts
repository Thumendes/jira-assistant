import { cache } from "react";
import { auth } from "../auth";
import { headers } from "next/headers";
import { UserSettings } from "./user-settings";

export const getUserSettings = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() });

  if (!session?.user) {
    throw new Error("User not authenticated");
  }

  const settings = await UserSettings.forUser(session.user.id);

  return settings;
});
