import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number) {
  return new Intl.NumberFormat("fr-FR", {
    style: "decimal",
  }).format(amount) + " F"
}

export function formatCompactNumber(number: number) {
  const formatter = Intl.NumberFormat("fr-FR", {
    notation: "compact",
    maximumFractionDigits: 1,
  })
  return formatter.format(number)
}
