"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Users, Pencil, Trash2, Phone, KeyRound, UserMinus, UserPlus, Crown } from "lucide-react";
import { toast } from "sonner";
import { useStaff, useDeleteStaff } from "@/hooks/use-staff";
import { useMembers } from "@/hooks/use-members";
import { removeEmployeeFromShop, reinviteEmployee, resetEmployeePassword } from "@/app/actions/account";
import { PageHeader } from "@/components/shared/page-header";
import { Reveal } from "@/components/shared/reveal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { LoadingState, EmptyState, ErrorState } from "@/components/ui/states";
import { ConfirmDialog } from "@/components/ui/confirm";
import { StaffForm } from "@/components/staff/staff-form";
import { SetPasswordModal } from "@/components/staff/set-password-modal";
import { formatPercent } from "@/lib/format";
import type { Staff, Member } from "@/lib/types/db";

export default function StaffPage() {
  const { data: staff, isLoading, isError, refetch } = useStaff();
  const { data: members } = useMembers();
  const del = useDeleteStaff();
  const qc = useQueryClient();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<Staff | null>(null);
  const [toDelete, setToDelete] = useState<Staff | null>(null);
  const [resetFor, setResetFor] = useState<Staff | null>(null);
  const [reinviteFor, setReinviteFor] = useState<Staff | null>(null);
  const [removeTarget, setRemoveTarget] = useState<Staff | null>(null);
  const [busy, setBusy] = useState(false);

  const memberByUser = useMemo(() => {
    const m = new Map<string, Member>();
    (members ?? []).forEach((x) => m.set(x.user_id, x));
    return m;
  }, [members]);

  function refresh() {
    qc.invalidateQueries({ queryKey: ["staff"] });
    qc.invalidateQueries({ queryKey: ["members"] });
  }

  async function confirmDelete() {
    if (!toDelete) return;
    try {
      await del.mutateAsync(toDelete.id);
      toast.success("Đã xoá.");
      setToDelete(null);
    } catch {
      toast.error("Không thể xoá.");
    }
  }

  async function confirmRemove() {
    if (!removeTarget?.user_id) return;
    setBusy(true);
    const res = await removeEmployeeFromShop({ userId: removeTarget.user_id, staffId: removeTarget.id });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Không thể gỡ.");
      return;
    }
    refresh();
    toast.success("Đã gỡ nhân viên khỏi tiệm. Dữ liệu vẫn được giữ.");
    setRemoveTarget(null);
  }

  async function doReset(password: string) {
    if (!resetFor?.user_id) return;
    setBusy(true);
    const res = await resetEmployeePassword({ userId: resetFor.user_id, password });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Không thể đặt lại.");
      return;
    }
    toast.success("Đã đặt lại mật khẩu tạm.");
    setResetFor(null);
  }

  async function doReinvite(password: string) {
    if (!reinviteFor?.user_id) return;
    setBusy(true);
    const res = await reinviteEmployee({ userId: reinviteFor.user_id, staffId: reinviteFor.id, password });
    setBusy(false);
    if (!res.ok) {
      toast.error(res.error ?? "Không thể mời lại.");
      return;
    }
    refresh();
    toast.success("Đã mời lại nhân viên. Họ đăng nhập bằng mật khẩu tạm rồi đổi.");
    setReinviteFor(null);
  }

  return (
    <div>
      <PageHeader
        title="Nhân viên"
        description="Tạo tài khoản, đặt tỷ lệ ăn chia, gỡ/mời lại nhân viên."
        action={
          <Button
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
          >
            <Plus className="size-4" /> Thêm nhân viên
          </Button>
        }
      />

      {isLoading ? (
        <LoadingState />
      ) : isError ? (
        <ErrorState onRetry={() => refetch()} />
      ) : (staff?.length ?? 0) === 0 ? (
        <EmptyState
          icon={<Users className="size-6" />}
          title="Chưa có nhân viên"
          description="Thêm thợ và cấp tài khoản đăng nhập cho họ."
          action={
            <Button onClick={() => setFormOpen(true)} variant="subtle">
              <Plus className="size-4" /> Thêm nhân viên
            </Button>
          }
        />
      ) : (
        <Reveal className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3" stagger={0.05}>
          {staff!.map((s) => {
            const member = s.user_id ? memberByUser.get(s.user_id) : undefined;
            const isOwnerAccount = member?.role === "owner";
            const hasAccount = !!s.user_id;
            const activeAccount = hasAccount && member?.active === true;
            const removed = hasAccount && !!member && member.active === false;

            return (
              <article
                key={s.id}
                className="group relative flex flex-col gap-3 rounded-2xl border border-line bg-paper p-4 shadow-(--shadow-sm) transition-shadow hover:shadow-soft"
              >
                <div className="flex items-start gap-3">
                  <Avatar name={s.name} color={s.color} size="lg" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <h4 className="truncate font-medium text-ink">{s.name}</h4>
                      {isOwnerAccount && <Crown className="size-3.5 text-copper" />}
                    </div>
                    <p className="mt-0.5 text-xs text-ink-muted">
                      Ăn chia <b className="text-ink-soft">{formatPercent(s.commission_rate)}</b>
                      {s.phone && (
                        <>
                          {" · "}
                          <Phone className="inline size-3" /> {s.phone}
                        </>
                      )}
                    </p>
                    {member?.email && <p className="truncate text-xs text-ink-faint">{member.email}</p>}
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-1.5">
                  {isOwnerAccount ? (
                    <Badge tone="copper">Chủ tiệm</Badge>
                  ) : activeAccount ? (
                    <Badge tone="success" dot>
                      Có tài khoản
                    </Badge>
                  ) : removed ? (
                    <Badge tone="danger">Đã gỡ khỏi tiệm</Badge>
                  ) : (
                    <Badge tone="neutral">Không tài khoản</Badge>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-1 border-t border-line pt-2">
                  <button
                    onClick={() => {
                      setEditing(s);
                      setFormOpen(true);
                    }}
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
                  >
                    <Pencil className="size-3.5" /> Sửa
                  </button>

                  {activeAccount && !isOwnerAccount && (
                    <>
                      <button
                        onClick={() => setResetFor(s)}
                        className="inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-ink-soft transition-colors hover:bg-paper-2 hover:text-ink"
                      >
                        <KeyRound className="size-3.5" /> Mật khẩu
                      </button>
                      <button
                        onClick={() => setRemoveTarget(s)}
                        className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
                      >
                        <UserMinus className="size-3.5" /> Gỡ
                      </button>
                    </>
                  )}

                  {removed && (
                    <button
                      onClick={() => setReinviteFor(s)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-success transition-colors hover:bg-success-soft"
                    >
                      <UserPlus className="size-3.5" /> Mời lại
                    </button>
                  )}

                  {!hasAccount && (
                    <button
                      onClick={() => setToDelete(s)}
                      className="ml-auto inline-flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-danger transition-colors hover:bg-danger-soft"
                    >
                      <Trash2 className="size-3.5" /> Xoá
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </Reveal>
      )}

      <StaffForm open={formOpen} onClose={() => setFormOpen(false)} staff={editing} />

      <SetPasswordModal
        open={!!resetFor}
        onClose={() => setResetFor(null)}
        title="Đặt lại mật khẩu"
        description={`Cấp mật khẩu tạm mới cho ${resetFor?.name ?? ""}.`}
        confirmLabel="Đặt lại"
        busy={busy}
        onConfirm={doReset}
      />
      <SetPasswordModal
        open={!!reinviteFor}
        onClose={() => setReinviteFor(null)}
        title="Mời lại nhân viên"
        description={`Bật lại quyền truy cập cho ${reinviteFor?.name ?? ""} với mật khẩu tạm mới.`}
        confirmLabel="Mời lại"
        busy={busy}
        onConfirm={doReinvite}
      />
      <ConfirmDialog
        open={!!removeTarget}
        title="Gỡ nhân viên khỏi tiệm?"
        description={`${removeTarget?.name} sẽ không truy cập được tiệm nữa, nhưng toàn bộ doanh thu & kết toán vẫn được giữ. Tài khoản không bị khoá nên họ vẫn có thể vào tiệm khác.`}
        tone="danger"
        confirmLabel="Gỡ khỏi tiệm"
        loading={busy}
        onConfirm={confirmRemove}
        onClose={() => setRemoveTarget(null)}
      />
      <ConfirmDialog
        open={!!toDelete}
        title="Xoá nhân viên?"
        description={`Xoá hồ sơ "${toDelete?.name}". Hoá đơn cũ vẫn giữ tên đã ghi.`}
        tone="danger"
        confirmLabel="Xoá"
        loading={del.isPending}
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />
    </div>
  );
}
