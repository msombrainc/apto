import type { ReactNode } from "react";
import { IconInbox } from "./icons";

type EmptyStateProps = {
  title: string;
  message?: string;
  icon?: ReactNode;
};

export function EmptyState({ title, message, icon }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-state__icon">{icon ?? <IconInbox />}</div>
      <p className="empty-state__title">{title}</p>
      {message && <p className="empty-state__message muted">{message}</p>}
    </div>
  );
}
