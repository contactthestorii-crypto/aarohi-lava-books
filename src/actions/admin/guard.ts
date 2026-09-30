import "server-only";
import { failure, type ActionResult } from "@/lib/action-result";
import { getAdminOrNull, type Profile } from "@/lib/auth";
import { log } from "@/lib/utils/log";

/**
 * Wraps every admin Server Action: re-checks the admin role on the server (never trust the
 * page having been rendered) and converts unexpected errors into a safe message.
 */
export async function withAdmin<T>(scope: string, fn: (admin: Profile) => Promise<ActionResult<T>>): Promise<ActionResult<T>> {
  const admin = await getAdminOrNull();
  if (!admin) return failure("You are not allowed to do this. Please sign in as an admin.");
  try {
    return await fn(admin);
  } catch (error) {
    const userMessage = (error as { userMessage?: string }).userMessage;
    if (userMessage) return failure(userMessage);
    log.error(`admin.${scope}`, error, { adminId: admin.id });
    return failure("Something went wrong. Please try again.");
  }
}
