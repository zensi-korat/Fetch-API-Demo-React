import { useEffect, useState } from "react";

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

// The server now returns the page of rows PLUS the total match count.
interface ConsumersResponse {
  consumers: Consumer[];
  total: number;
  page: number;
  pageSize: number;
}

// What the caller (the page) passes in to control search + pagination + sorting.
interface UseConsumersParams {
  search: string;
  page: number;
  pageSize: number;
  sort?: string; // which column to sort by, e.g. "name" (optional)
  dir?: "asc" | "desc"; // sort direction (optional)
}

/**
 * GET the consumers list from the server, with SEARCH and PAGINATION done on
 * the backend via URL query params.
 *
 * Whenever `search`, `page`, or `pageSize` change, we build a new URL like
 *   /api/consumers?search=jane&page=2&pageSize=10
 * and re-fetch. The server returns just that page of rows plus `total`.
 */
export function useConsumers({ search, page, pageSize, sort, dir }: UseConsumersParams) {
  const [consumers, setConsumers] = useState<Consumer[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    // `ignore` guards against an out-of-order response overwriting a newer one
    // (e.g. you type fast and an older search resolves after a newer one).
    let ignore = false;

    async function load() {
      setIsLoading(true);
      setIsError(false);
      setError(null);
      try {
        // URLSearchParams safely builds the "?search=...&page=..." string and
        // encodes special characters for us.
        const params = new URLSearchParams();
        if (search) params.set("search", search);
        params.set("page", String(page));
        params.set("pageSize", String(pageSize));
        // Only send sorting params when a column is actively sorted.
        if (sort && dir) {
          params.set("sort", sort);
          params.set("dir", dir);
        }

        const res = await fetch(`/api/consumers?${params.toString()}`);
        if (!res.ok) {
          const body = await res.json().catch(() => null);
          throw new Error(body?.message ?? "Failed to load consumers");
        }
        const data: ConsumersResponse = await res.json();
        if (!ignore) {
          setConsumers(data.consumers);
          setTotal(data.total);
        }
      } catch (err) {
        if (!ignore) {
          setIsError(true);
          setError(err instanceof Error ? err : new Error("Unknown error"));
        }
      } finally {
        if (!ignore) setIsLoading(false);
      }
    }

    load();

    return () => {
      ignore = true;
    };
  }, [search, page, pageSize, sort, dir]);

  return { consumers, total, isLoading, isError, error };
}
