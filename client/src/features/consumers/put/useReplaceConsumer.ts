import { useState, useCallback } from "react";

// ── Types (kept in this file so the whole hook is self-contained) ───────────
type AccountStatus = "active" | "delinquent" | "inactive";

interface Consumer {
  id: string;
  consumerNumber: number;
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  accountStatus: AccountStatus;
}

interface ConsumerResponse {
  consumer: Consumer;
}

// PUT = full replace, so the caller must provide EVERY editable field (all the
// fields except the server-generated `id` and `consumerNumber`).
export type ReplaceConsumerInput = Omit<Consumer, "id" | "consumerNumber">;

/**
 * PUT a consumer with a plain `fetch` — a FULL REPLACE.
 *
 * `mutate(id, input)` overwrites the whole record with `input`. Any field you
 * leave out of `input` is reset on the server (e.g. an empty middle name),
 * because PUT means "make the record exactly this".
 */
export function useReplaceConsumer() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, input: ReplaceConsumerInput): Promise<Consumer> => {
      setIsPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/consumers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          // The WHOLE object — every field, changed or not.
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Failed to replace consumer");
        }
        const data: ConsumerResponse = await res.json();
        return data.consumer;
      } catch (err) {
        const e = err instanceof Error ? err : new Error("Unknown error");
        setError(e);
        throw e;
      } finally {
        setIsPending(false);
      }
    },
    [],
  );

  return { mutate, isPending, error };
}
