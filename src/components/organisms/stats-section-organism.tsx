'use client'
import { StatItemMolecule } from "@/components/molecules/stat-item-molecule"

interface Stat {
  metric: string
  label: string
}

interface StatsSectionOrganismProps {
  stats: Stat[]
}

export function StatsSectionOrganism({ stats }: StatsSectionOrganismProps) {
  return (
    <section className="px-6 md:px-8 py-20 border-b border-border">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {stats.map((stat, i) => (
            <StatItemMolecule key={i} value={stat.metric} label={stat.label} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default StatsSectionOrganism
