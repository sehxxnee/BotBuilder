"use client"

import { MoreVertical, Trash2, Edit2 } from "lucide-react"
import { useState } from "react"

interface ChatbotCardProps {
  name: string
  description: string
  filesCount: number
  createdAt: string
  onEdit?: () => void
  onDelete?: () => void
}

export function ChatbotCard({ name, description, filesCount, createdAt, onEdit, onDelete }: ChatbotCardProps) {
  const [showMenu, setShowMenu] = useState(false)

  return (
    <div className="p-4 bg-card border border-border rounded-lg hover:border-primary/50 transition-colors group">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{name}</h3>
          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{description}</p>
          <div className="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
            <span>{filesCount} file(s)</span>
            <span>{createdAt}</span>
          </div>
        </div>

        <div className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-muted rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical className="w-4 h-4" />
          </button>

          {showMenu && (
            <div className="absolute top-full right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-10 min-w-40">
              <button
                onClick={() => {
                  onEdit?.()
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-muted transition-colors text-foreground"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => {
                  onDelete?.()
                  setShowMenu(false)
                }}
                className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-destructive/10 text-destructive transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
