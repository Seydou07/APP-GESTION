"use client"

import * as React from "react"
import { ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

type Props = {
  total: number
  page: number
  pageSize: number
  onPageChange: (n: number) => void
  onPageSizeChange?: (n: number) => void
  sizes?: number[]
}

export function Pagination({ total, page, pageSize, onPageChange, onPageSizeChange, sizes = [10, 20, 50] }: Props) {
  const pages = Math.max(1, Math.ceil(total / pageSize))
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1
  const end = Math.min(total, page * pageSize)

  if (total === 0) return null

  const makePages = () => {
    // show up to 7 buttons (first, ..., current-1,current,current+1, ..., last)
    const out: (number | "...")[] = []
    if (pages <= 7) {
      for (let i = 1; i <= pages; i++) out.push(i)
      return out
    }

    out.push(1)
    const left = Math.max(2, page - 1)
    const right = Math.min(pages - 1, page + 1)

    if (left > 2) out.push("...")
    for (let i = left; i <= right; i++) out.push(i)
    if (right < pages - 1) out.push("...")
    out.push(pages)
    return out
  }

  return (
    <div className="flex items-center justify-between gap-4 px-4 py-3">
      <div className="text-sm text-muted-foreground">
        Affichage <span className="font-semibold">{start}</span> - <span className="font-semibold">{end}</span> sur <span className="font-semibold">{total}</span>
      </div>

      <div className="flex items-center gap-2">
        <Button size="sm" variant="ghost" onClick={() => onPageChange(Math.max(1, page - 1))} disabled={page <= 1} aria-label="Page précédente">
          <ChevronsLeft className="w-4 h-4" />
        </Button>

        <div className="hidden sm:flex items-center gap-1">
          {makePages().map((p, idx) => (
            p === "..." ? (
              <div key={`dots-${idx}`} className="px-3 py-1 text-sm text-muted-foreground">…</div>
            ) : (
              <Button
                key={p}
                size="sm"
                variant={p === page ? "secondary" : "ghost"}
                onClick={() => onPageChange(Number(p))}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Button>
            )
          ))}
        </div>

        <Button size="sm" variant="ghost" onClick={() => onPageChange(Math.min(pages, page + 1))} disabled={page >= pages} aria-label="Page suivante">
          <ChevronsRight className="w-4 h-4" />
        </Button>

        {onPageSizeChange && (
          <div className="ml-2">
            <Select value={String(pageSize)} onValueChange={(v) => { onPageSizeChange(Number(v)) }}>
              <SelectTrigger className="h-8 w-[72px] rounded-lg text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-lg">
                {sizes.map(s => (
                  <SelectItem key={s} value={String(s)}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    </div>
  )
}
