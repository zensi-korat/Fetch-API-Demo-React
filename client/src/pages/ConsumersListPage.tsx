import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DataTable } from "@/components/ui/data-table";
import { Skeleton } from "@/components/ui/skeleton";
import { consumersColumns } from "@/features/consumers/consumers-page.columns";
import { useConsumers } from "@/features/consumers/useConsumers";

export default function ConsumersListPage() {
  const navigate = useNavigate();
  const { consumers, isLoading, isError, error } = useConsumers();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredData = useMemo(() => {
    if (!searchQuery.trim()) return consumers;
    const query = searchQuery.toLowerCase();
    return consumers.filter(
      (consumer) =>
        [consumer.firstName, consumer.middleName, consumer.lastName]
          .filter(Boolean)
          .join(" ")
          .toLowerCase()
          .includes(query) || consumer.email.toLowerCase().includes(query),
    );
  }, [consumers, searchQuery]);

  return (
    <div className="flex flex-col flex-1 h-full">
      <div className="border-b bg-background px-4 md:px-6 py-3 md:py-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Consumers</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Manage and track all consumers. Data is fetched with raw fetch —
              see src/features/consumers/useConsumers.ts.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <Input
                type="text"
                placeholder="Search consumers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
                aria-label="Search consumers"
              />
            </div>

            <Button className="gap-2" onClick={() => navigate("/consumers/add")}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add Consumer
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-auto p-4 md:p-6">
        {isLoading ? (
          <div className="space-y-3" aria-busy="true" aria-label="Loading consumers">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        ) : isError ? (
          <div
            className="flex flex-col items-center justify-center gap-2 py-16 text-center"
            role="alert"
          >
            <p className="text-sm font-medium">Failed to load consumers</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error ? error.message : "Something went wrong."}
            </p>
          </div>
        ) : (
          <DataTable
            columns={consumersColumns}
            data={filteredData}
            pageSize={10}
            showPagination={true}
            emptyMessage="No consumers found."
            onRowClick={(consumer) => navigate(`/consumers/${consumer.id}`)}
          />
        )}
      </div>
    </div>
  );
}
