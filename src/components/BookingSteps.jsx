import { Check } from "lucide-react";

export const steps = ["Dates", "Chambre", "Informations", "Confirmation"];

export default function BookingSteps({ current, onStep, maxReached }) {
  return (
    <ol className="flex items-center gap-2 sm:gap-4">
      {steps.map((s, i) => {
        const n = i + 1, done = n < current, active = n === current, clickable = n <= maxReached && n !== current;
        return (
          <li key={s} className="flex flex-1 items-center gap-2 sm:gap-4">
            <button disabled={!clickable} onClick={() => onStep(n)} className="flex items-center gap-2 disabled:cursor-default">
              <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm transition ${active ? "bg-night text-white" : done ? "bg-gold text-white" : "border border-night/20 text-night/40"}`}>{done ? <Check size={16} /> : n}</span>
              <span className={`hidden text-sm sm:block ${active ? "font-medium" : "text-night/50"}`}>{s}</span>
            </button>
            {n < steps.length && <span className={`h-px flex-1 ${done ? "bg-gold" : "bg-night/15"}`} />}
          </li>
        );
      })}
    </ol>
  );
}
