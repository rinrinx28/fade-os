interface PageHeaderProps {
  title: string;
  description?: string;
  action?: React.ReactNode;
}

/** Tiêu đề khối nội dung trong trang (khác với tiêu đề trên topbar). */
export function PageHeader({ title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h2 className="font-display text-2xl font-medium tracking-tight text-ink sm:text-[1.75rem]">
          {title}
        </h2>
        {description && <p className="mt-1 text-sm text-ink-muted">{description}</p>}
      </div>
      {action}
    </div>
  );
}
