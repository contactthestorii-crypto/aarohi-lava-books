/** ISO timestamp -> "YYYY-MM-DDTHH:mm" in IST, for <input type="datetime-local">. */
export function toIstInput(iso: string | null | undefined): string {
  if (!iso) return "";
  const ist = new Date(new Date(iso).getTime() + 5.5 * 60 * 60 * 1000);
  return ist.toISOString().slice(0, 16);
}
