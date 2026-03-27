"use client"

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogClose,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { LucideIcon } from "lucide-react"

interface ConfirmDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
    title: string
    description: string
    onConfirm: () => void
    icon: LucideIcon
    confirmText?: string
    cancelText?: string
    variant?: "destructive" | "default"
}

export function ConfirmDialog({
    open,
    onOpenChange,
    title,
    description,
    onConfirm,
    icon: Icon,
    confirmText = "Confirmer",
    cancelText = "Annuler",
    variant = "destructive"
}: ConfirmDialogProps) {
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px] rounded-3xl p-8 border-none shadow-2xl">
                <DialogHeader className="space-y-4">
                    <div className={`w-16 h-16 ${variant === 'destructive' ? 'bg-destructive/10' : 'bg-primary/10'} rounded-full flex items-center justify-center mx-auto sm:mx-0`}>
                        <Icon className={`w-8 h-8 ${variant === 'destructive' ? 'text-destructive' : 'text-primary'}`} />
                    </div>
                    <div className="space-y-2 text-center sm:text-left">
                        <DialogTitle className="text-2xl font-bold tracking-tight">{title}</DialogTitle>
                        <DialogDescription className="text-muted-foreground text-lg leading-tight">
                            {description}
                        </DialogDescription>
                    </div>
                </DialogHeader>
                <DialogFooter className="mt-8 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <DialogClose asChild>
                        <Button variant="ghost" className="flex-1 h-12 rounded-xl text-base font-medium order-2 sm:order-1">
                            {cancelText}
                        </Button>
                    </DialogClose>
                    <Button
                        variant={variant}
                        onClick={() => {
                            onConfirm()
                            onOpenChange(false)
                        }}
                        className={`flex-1 h-12 rounded-xl text-base font-bold shadow-lg ${variant === 'destructive' ? 'shadow-destructive/20' : 'shadow-primary/20'} hover:scale-[1.02] active:scale-[0.98] transition-all order-1 sm:order-2`}
                    >
                        {confirmText}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
