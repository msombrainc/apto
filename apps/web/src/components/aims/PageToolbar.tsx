import type { ReactNode } from "react";

type PageToolbarProps = {
  actions: ReactNode;
};

export function PageToolbar({ actions }: PageToolbarProps) {
  return <div className="page-toolbar">{actions}</div>;
}
