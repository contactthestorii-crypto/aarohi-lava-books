import { Flask } from "@phosphor-icons/react/ssr";
import { isSupabaseConfigured } from "@/lib/config";
import { testModeIntegrations } from "@/lib/env";

/**
 * Visible warning whenever a development-only integration is active or the store is not
 * connected to a database (docs/DECISIONS.md ADR-010). Never shown in a correctly
 * configured production deployment.
 */
export function TestModeBanner() {
  const modes = testModeIntegrations();
  if (isSupabaseConfigured && modes.length === 0) return null;

  const message = !isSupabaseConfigured
    ? "Preview: the store is not connected yet, so shopping is turned off."
    : `Test mode: ${modes.join(" and ")} ${modes.length === 1 ? "is" : "are"} simulated. No real money is charged and no real emails are sent.`;

  return (
    <div role="status" className="bg-gold-400 text-ink print:hidden">
      <p className="container-page flex items-center justify-center gap-2 py-1.5 text-center text-[13px] font-semibold">
        <Flask size={16} weight="bold" className="shrink-0" />
        {message}
      </p>
    </div>
  );
}
