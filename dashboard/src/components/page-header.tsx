import type { FC, ReactNode } from "react";

type PageHeaderProps = {
  /** Optional element before the title, e.g. a status dot. */
  leading?: ReactNode;
  title: ReactNode;
  description?: ReactNode;
};

export const PageHeader: FC<PageHeaderProps> = ({ leading, title, description }) => {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2.5">
        {leading}
        <h1 className="text-2xl tracking-tight">{title}</h1>
      </div>
      {description && <div className="text-sm text-muted-foreground">{description}</div>}
    </div>
  );
};
