"use client"

import { useState, useEffect } from "react"
import { Scissors, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

export function InaugurationDisplay() {
    const [isVisible, setIsVisible] = useState(false)
    const [isCutting, setIsCutting] = useState(false)
    const [isFinished, setIsFinished] = useState(false)

    useEffect(() => {
        const hasInaugurated = localStorage.getItem("km_bomi_inaugurated")
        if (!hasInaugurated) {
            // Small delay to ensure smooth entry
            const timer = setTimeout(() => setIsVisible(true), 1000)
            return () => clearTimeout(timer)
        }
    }, [])

    const handleCut = () => {
        setIsCutting(true)

        // Save to localStorage immediately
        localStorage.setItem("km_bomi_inaugurated", "true")

        // Animations sequence
        setTimeout(() => {
            setIsFinished(true)
            setTimeout(() => {
                setIsVisible(false)
            }, 3000) // Stay visible to enjoy confetti
        }, 1200)
    }

    if (!isVisible) return null

    return (
        <div className={cn(
            "fixed inset-0 z-[100] flex items-center justify-center overflow-hidden transition-all duration-1000",
            isFinished ? "opacity-0 pointer-events-none" : "bg-black/40 backdrop-blur-sm"
        )}>
            {/* The Ribbon */}
            <div className={cn(
                "absolute w-[150%] h-32 bg-gradient-to-b from-red-600 via-red-500 to-red-700 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center justify-center transition-all duration-1000 ease-in-out px-20",
                isCutting ? "rotate-[-5deg] scale-y-0 opacity-0" : "rotate-[-5deg]",
                "after:content-[''] after:absolute after:inset-0 after:bg-[url('https://www.transparenttextures.com/patterns/silk.png')] after:opacity-20"
            )}>
                <div className="text-white font-black text-2xl md:text-5xl tracking-[0.2em] uppercase drop-shadow-lg flex items-center gap-10">
                    <Sparkles className="animate-pulse w-8 h-8" />
                    <span>Inauguration K.M.BOMI</span>
                    <Sparkles className="animate-pulse w-8 h-8" />
                </div>
            </div>

            {/* Scissors Button */}
            {!isCutting && (
                <div className="absolute top-[60%] left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-4">
                    <button
                        onClick={handleCut}
                        className="group bg-white p-8 rounded-full shadow-2xl hover:scale-110 active:scale-95 transition-all duration-300 border-4 border-red-500 animate-bounce"
                    >
                        <Scissors className="w-12 h-12 text-red-600 group-hover:rotate-[-45deg] transition-transform duration-500" />
                    </button>
                    <div className="bg-red-600 text-white px-6 py-2 rounded-full text-lg font-black shadow-lg uppercase tracking-widest animate-pulse">
                        Couper le ruban !
                    </div>
                </div>
            )}

            {/* Confetti Particles (Simplified CSS particles) */}
            {isFinished && (
                <div className="absolute inset-0 pointer-events-none">
                    {[...Array(50)].map((_, i) => (
                        <div
                            key={i}
                            className="absolute top-1/2 left-1/2 w-4 h-4 rounded-sm animate-confetti"
                            style={{
                                backgroundColor: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6'][i % 5],
                                '--tx': `${(Math.random() - 0.5) * 1000}px`,
                                '--ty': `${(Math.random() - 0.5) * 1000}px`,
                                '--tr': `${Math.random() * 720}deg`,
                                animationDelay: `${Math.random() * 0.5}s`
                            } as any}
                        />
                    ))}
                </div>
            )}

            <style jsx global>{`
                @keyframes confetti {
                    0% { transform: translate(-50%, -50%) scale(0) rotate(0deg); opacity: 1; }
                    100% { transform: translate(var(--tx), var(--ty)) scale(1) rotate(var(--tr)); opacity: 0; }
                }
                .animate-confetti {
                    animation: confetti 2.5s ease-out forwards;
                }
            `}</style>
        </div>
    )
}
