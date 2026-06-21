"use client";

import { useMemo, useState } from "react";
import { Plus, Sparkles, Pencil, Trash2, Clock } from "lucide-react";
import { toast } from "sonner";
import { useServices, useDeleteService } from "@/hooks/use-services";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm";
import { ServiceForm } from "@/components/services/service-form";
import { formatCurrency } from "@/lib/format";
import type { Service } from "@/lib/types/db";

export default function ServicesPage() {
  const { data: services, isLoading, isError, refetch } = useServices();
  const del = useDeleteService();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [toDelete, setToDelete] = useState<Service | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<string, Service[]>();
    for (const s of services ?? []) {
      const list = map.get(s.category) ?? [];
      list.push(s);
      map.set(s.category, list);
    }
    return [...map.entries()];
  }, [services]);

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }
  function openEdit(s: Service) {
    setEditing(s);
    setFormOpen(true);
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Đã xoá dịch vụ.");
      setToDelete(null);
    } catch {
      toast.error("Không thể xoá dịch vụ.");
    }
  }

  return (
    <div>
      <PageHeader
        title="Bảng giá dịch vụ"
        description="Quản lý các dịch vụ và mức giá áp dụng khi tính tiền."
        action={
          <Button onClick={openNew}>
            <Plus className="size-4" /> Thêm dịch vụ
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (services?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Sparkles className="size-6" />}
          title="Chưa có dịch vụ nào"
          description="Thêm dịch vụ đầu tiên để bắt đầu tính tiền cho khách."
          action={
            <Button onClick={openNew} variant="subtle">
              <Plus className="size-4" /> Thêm dịch vụ
            </Button>
          }
        />
      ) : (
        <div className="space-y-8">
          {grouped.map(([category, items]) => (
            <section key={category}>
              <div className="mb-3 flex items-center gap-2">
                <h3 className="font-display text-lg font-medium text-ink">{category}</h3>
                <Badge tone="neutral">{items.length}</Badge>
              </div>
              <Reveal className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" stagger={0.04}>
                {items.map((s) => (
                  <article
                    key={s.id}
                    className="group flex items-center justify-between gap-4 rounded-2xl border border-line bg-paper p-4 shadow-(--shadow-sm) transition-shadow hover:shadow-(--shadow-md)"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="truncate font-medium text-ink">{s.name}</h4>
                        {!s.active && <Badge tone="neutral">Ẩn</Badge>}
                      </div>
                      <div className="mt-1 flex items-center gap-3 text-xs text-ink-muted">
                        <span className="inline-flex items-center gap-1">
                          <Clock className="size-3" /> {s.duration_min} phút
                        </span>
                      </div>
                      <p className="mt-2 font-display text-lg font-medium text-copper-deep tnum">
                        {formatCurrency(s.price)}
                      </p>
                    </div>
                    <div className="flex shrink-0 flex-col gap-1.5 opacity-0 transition-opacity group-hover:opacity-100 max-sm:opacity-100">
                      <button
                        onClick={() => openEdit(s)}
                        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-paper-2 hover:text-ink"
                        aria-label="Sửa"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => setToDelete(s)}
                        className="rounded-lg p-2 text-ink-muted transition-colors hover:bg-danger-soft hover:text-danger"
                        aria-label="Xoá"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </article>
                ))}
              </Reveal>
            </section>
          ))}
        </div>
      )}

      <ServiceForm open={formOpen} onClose={() => setFormOpen(false)} service={editing} />
      <ConfirmDialog
        open={!!toDelete}
        title="Xoá dịch vụ?"
        description={`Xoá "${toDelete?.name}" khỏi bảng giá. Các hoá đơn cũ vẫn được giữ nguyên.`}
        tone="danger"
        confirmLabel="Xoá"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
