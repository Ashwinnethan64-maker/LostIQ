import React from "react";
import { MatchScores } from "@/types";

interface MatchBadgeProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export function MatchBadge({ score, size = "md" }: MatchBadgeProps) {
  let colorClass = "bg-secondary text-black";
  let label = "POTENTIAL MATCH";

  if (score >= 85) {
    colorClass = "bg-primary text-white";
    label = "HIGH CONFIDENCE MATCH";
  } else if (score >= 60) {
    colorClass = "bg-secondary text-black";
    label = "MODERATE MATCH";
  } else {
    colorClass = "bg-white text-black";
    label = "LOW MATCH";
  }

  const sizeClasses = {
    sm: "px-2 py-0.5 text-[10px] border-2",
    md: "px-3 py-1 text-xs border-3",
    lg: "px-4 py-2 text-sm border-4",
  };

  return (
    <div
      className={`inline-flex items-center gap-1.5 font-black uppercase border-black shadow-[3px_3px_0px_#000000] ${colorClass} ${sizeClasses[size]}`}
    >
      <span className="font-extrabold">{score}%</span>
      <span>•</span>
      <span>{label}</span>
    </div>
  );
}

interface MatchScoreBarProps {
  scores: MatchScores;
}

export function MatchScoreBar({ scores }: MatchScoreBarProps) {
  const metrics = [
    { label: "VISUAL SIMILARITY", value: scores.visual, color: "bg-primary" },
    { label: "SEMANTIC OVERLAP", value: scores.semantic, color: "bg-secondary" },
    { label: "LOCATION PROXIMITY", value: scores.location, color: "bg-tertiary" },
    { label: "TIME HORIZON", value: scores.time, color: "bg-primary" },
    { label: "CATEGORY MATCH", value: scores.category, color: "bg-secondary" },
  ];

  return (
    <div className="border-4 border-black bg-white p-6 shadow-neo space-y-4">
      <div className="flex items-center justify-between border-b-3 border-black pb-2">
        <h4 className="font-black text-sm uppercase tracking-wider text-black">
          5-SIGNAL CONFIDENCE BREAKDOWN
        </h4>
        <span className="text-xs font-black bg-black text-white px-2 py-0.5 border border-black">
          OVERALL: {scores.overall}%
        </span>
      </div>

      <div className="space-y-3">
        {metrics.map((m, idx) => (
          <div key={idx} className="space-y-1">
            <div className="flex justify-between text-xs font-black uppercase">
              <span>{m.label}</span>
              <span>{m.value}%</span>
            </div>
            <div className="w-full bg-muted border-3 border-black h-4 overflow-hidden">
              <div
                className={`${m.color} h-full border-r-3 border-black transition-all duration-300`}
                style={{ width: `${Math.max(4, m.value)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
