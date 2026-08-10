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

// The exact shape the server sends back for POST /api/consumers.
interface ConsumerResponse {
  consumer: Consumer;
}

// What the caller must provide to create a consumer: everything EXCEPT the
// fields the server generates itself (`id` and `consumerNumber`).
export type CreateConsumerInput = Omit<Consumer, "id" | "consumerNumber">;

/**
 * POST a new consumer with a plain `fetch`.
 *
 * `mutate(input)` sends the form data and resolves with the created consumer.
 * `isPending` is true while the request is in flight; `error` holds any failure.
 */
export function useCreateConsumer() {
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // `useCallback` keeps `mutate` as one stable function across renders, so the
  // components that use it don't get a different function every render. It's
  // good hygiene for any function a hook hands back.
  const mutate = useCallback(
    async (input: CreateConsumerInput): Promise<Consumer> => {
      setIsPending(true);
      setError(null);
      try {
        const res = await fetch("/api/consumers", {
          method: "POST",
          // Tell the server the body is JSON so it parses it correctly.
          headers: { "Content-Type": "application/json" },
          // The new consumer's data, turned into a JSON string.
          body: JSON.stringify(input),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Failed to create consumer");
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
