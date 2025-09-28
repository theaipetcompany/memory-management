import React from 'react';
import { MemoryEntry } from '@/types/memory';

interface MemoryStatsProps {
  memories: MemoryEntry[];
}

interface StatCardProps {
  title: string;
  value: string | number;
  label: string;
  icon?: React.ReactNode;
}

function StatCard({ title, value, label, icon }: StatCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 text-card-foreground shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold" aria-label={label}>
            {value}
          </p>
        </div>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </div>
    </div>
  );
}

export function MemoryStats({ memories }: MemoryStatsProps) {
  // Calculate statistics
  const totalMemories = memories.length;
  const totalInteractions = memories.reduce(
    (sum, memory) => sum + memory.interactionCount,
    0
  );
  const avgInteractions =
    totalMemories > 0 ? (totalInteractions / totalMemories).toFixed(1) : '0.0';

  // Count by relationship type
  const friendsCount = memories.filter(
    (m) => m.relationshipType === 'friend'
  ).length;
  const familyCount = memories.filter(
    (m) => m.relationshipType === 'family'
  ).length;
  const acquaintancesCount = memories.filter(
    (m) => m.relationshipType === 'acquaintance'
  ).length;

  // Count recent activity (last 7 days)
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const recentActivityCount = memories.filter(
    (m) => m.lastSeen >= sevenDaysAgo
  ).length;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <StatCard
        title="Total Memories"
        value={totalMemories}
        label="Total memories count"
      />

      <StatCard title="Friends" value={friendsCount} label="Friends count" />

      <StatCard title="Family" value={familyCount} label="Family count" />

      <StatCard
        title="Acquaintances"
        value={acquaintancesCount}
        label="Acquaintances count"
      />

      <StatCard
        title="Total Interactions"
        value={totalInteractions}
        label="Total interactions count"
      />

      <StatCard
        title="Avg Interactions"
        value={avgInteractions}
        label="Average interactions per memory"
      />

      <StatCard
        title="Recent Activity"
        value={recentActivityCount}
        label="Memories with recent activity"
      />
    </div>
  );
}
