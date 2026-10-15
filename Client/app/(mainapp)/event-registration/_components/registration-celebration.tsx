"use client";

import { useEffect } from "react";
import confetti from "canvas-confetti";
import { PartyPopper, X, MapPin } from "lucide-react";

import { Button } from "@/components/ui/button";

interface RegistrationCelebrationProps {
  eventTitle: string;
  venue?: string;
  /** true when the sign-up still needs coordinator approval */
  pending: boolean;
  onClose: () => void;
}

export function RegistrationCelebration({
  eventTitle,
  venue,
  pending,
  onClose,
}: RegistrationCelebrationProps) {
  // Confetti bursts — one big pop, then side cannons for ~1.4s.
  useEffect(() => {
    confetti({
      particleCount: 160,
      spread: 100,
      origin: { y: 0.6 },
    });

    const end = Date.now() + 1400;
    const frame = () => {
      confetti({
        particleCount: 5,
        angle: 60,
        spread: 60,
        origin: { x: 0, y: 0.8 },
      });
      confetti({
        particleCount: 5,
        angle: 120,
        spread: 60,
        origin: { x: 1, y: 0.8 },
      });
      if (Date.now() < end) requestAnimationFrame(frame);
    };
    frame();
  }, []);

  // Esc closes.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onClose}
      />

      {/* Full-screen sheet sliding up from the bottom */}
      <div className="absolute inset-0 animate-in slide-in-from-bottom-full duration-500 ease-out bg-background flex flex-col items-center justify-center gap-6 p-6 text-center">
        <button
          onClick={onClose}
          className="absolute right-6 top-6 rounded-full border border-border/60 p-2 text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="relative">
          <div className="absolute -inset-6 rounded-full bg-primary/15 blur-2xl" />
          <div className="relative flex h-24 w-24 items-center justify-center rounded-3xl border border-primary/20 bg-primary/10 text-primary shadow-lg shadow-primary/10 animate-in zoom-in-50 duration-500 delay-150 fill-mode-backwards">
            <PartyPopper className="h-12 w-12" />
          </div>
        </div>

        <div className="space-y-3 animate-in fade-in slide-in-from-bottom-4 duration-500 delay-200 fill-mode-backwards">
          <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
            {pending ? "You're in line!" : "You're registered!"}
          </h1>
          <p className="text-xl font-medium">{eventTitle}</p>
          {venue && (
            <p className="flex items-center justify-center gap-1.5 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4" />
              {venue}
            </p>
          )}
          <p className="mx-auto max-w-md text-sm leading-relaxed text-muted-foreground">
            {pending
              ? "Your spot is saved — the club coordinator will review and approve it soon."
              : "See you there — check My registrations for the details."}
          </p>
        </div>

        <Button
          size="lg"
          onClick={onClose}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 delay-300 fill-mode-backwards bg-primary text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
        >
          Awesome
        </Button>
      </div>
    </div>
  );
}
