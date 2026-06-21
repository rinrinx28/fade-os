"use client";

import { useMemo, useState } from "react";
import { Search, Plus, Sparkles } from "lucide-react";
import { useServices } from "@/hooks/use-services";
import { LoadingState, EmptyState } from "@/components/ui/states";
import { formatCurrency } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { Service } from "@/lib/types/db";

export function ServiceCatalog({ onPick }: { onPick: (service: Service) => void }) {
  const { data: services, isLoading } = useServices(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<string>("Tất cả");

  const categories = useMemo(() => {
    const set = new Set<string>();
    (services ?? []).forEach((s) => set.add(s.category));
    return ["Tất cả", ...set];
  }, [services]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (services ?? []).filter((s) => {
      const matchCat = category === "Tất cả" || s.category === category;
      const matchQ = !q || s.name.toLowerCase().includes(q);
      return matchCat && matchQ;
    });
  }, [services, query, category]);

  if (isLoading) return <LoadingState />;

  return (
    <div className="flex h-full flex-col">
      <div className="relative mb-3">
        <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-ink-faint" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tìm dịch vụ…"
          className="h-11 w-full rounded-xl border border-line bg-paper pl-10 pr-3.5 text-[0.95rem] text-ink placeholder:text-ink-faint focus:border-copper focus:outline-none focus:ring-2 focus:ring-copper/15"
        />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors",
              category === c
                ? "bg-ink text-cream"
                : "border border-line bg-paper text-ink-soft hover:border-line-strong hover:text-ink",
            )}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <EmptyState icon={<Sparkles className="size-6" />} title="Không tìm thấy dịch vụ" />
      ) : (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((s) => (
            <button
              key={s.id}
              onClick={() => onPick(s)}
              className="group relative flex flex-col justify-between rounded-2xl border border-line bg-paper p-4 text-left shadow-(--shadow-sm) transition-all duration-(--dur-fast) hover:-translate-y-0.5 hover:border-copper/30 hover:shadow-(--shadow-soft) active:scale-[0.98]"
            >
              <span className="flex items-start justify-between gap-2">
                <span className="font-medium leading-snug text-ink">{s.name}</span>
                <span className="flex size-6 shrink-0 items-center justify-center rounded-lg bg-copper-soft text-copper-deep transition-colors group-hover:bg-copper group-hover:text-white">
                  <Plus className="size-3.5" />
                </span>
              </span>
              <span className="mt-3 font-display text-base font-medium text-copper-deep tnum">
                {formatCurrency(s.price)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
