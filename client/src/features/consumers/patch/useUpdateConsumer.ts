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

// PATCH = partial update, so EVERY field is optional. `Partial<...>` marks all
// keys optional — the caller sends only the fields that changed.
export type UpdateConsumerInput = Partial<Omit<Consumer, "id" | "consumerNumber">>;

/**
 * PATCH a consumer with a plain `fetch` — a PARTIAL UPDATE.
 *
 * `mutate(id, input)` changes only the fields present in `input` and leaves the
 * rest of the record untouched. This is what most "Edit" forms use.
 */
export function useUpdateConsumer() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const mutate = useCallback(
    async (id: string, input: UpdateConsumerInput): Promise<Consumer> => {
      setIsPending(true);
      setError(null);
      try {
        const res = await fetch(`/api/consumers/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          // ONLY the changed fields.
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Failed to update consumer");
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
