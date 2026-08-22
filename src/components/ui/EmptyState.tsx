import React from "react";
import { FolderSearch, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";
import Link from "next/link";

interface EmptyStateProps {
  title: string;
  description: string;
  actionText?: string;
  actionHref?: string;
  icon?: "search" | "sparkles" | "alert" | "check";
}

export function EmptyState({
  title,
  description,
  actionText,
  actionHref,
  icon = "search",
}: EmptyStateProps) {
  const renderIcon = () => {
    switch (icon) {
      case "sparkles":
        return <Sparkles className="h-10 w-10 text-primary" />;
      case "alert":
        return <AlertTriangle className="h-10 w-10 text-amber-400" />;
      case "check":
        return <CheckCircle2 className="h-10 w-10 text-emerald-400" />;
      default:
        return <FolderSearch className="h-10 w-10 text-muted-foreground" />;
    }
  };

  return (
    <div className="flex min-h-[250px] flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/40 p-8 text-center animate-in fade-in">
      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-accent/50 border border-border/60">
        {renderIcon()}
      </div>
      <h3 className="text-base font-bold text-foreground">{title}</h3>
      <p className="mt-1.5 max-w-sm text-xs text-muted-foreground leading-relaxed">{description}</p>
      {actionText && actionHref && (
        <Link
          href={actionHref}
          className="mt-5 inline-flex items-center justify-center rounded-lg bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground hover:bg-primary/90 transition-colors shadow-md"
        >
          {actionText}
        </Link>
      )}
    </div>
  );
}
