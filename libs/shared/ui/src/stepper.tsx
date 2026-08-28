import { Check } from "lucide-react";
import { cn } from '@mojo/shared/util';

export interface Step {
  label: string;
  description?: string;
}

export function Stepper({
  steps,
  currentStep,
  className,
}: {
  steps: Step[];
  currentStep: number;
  className?: string;
}) {
  const progress = steps.length > 1 ? (currentStep / (steps.length - 1)) * 100 : 0;

  return (
    <div className={cn("w-full", className)}>
      <div className="relative flex justify-between">
        {/* Progress bar background */}
        <div className="absolute top-3.5 left-0 right-0 h-0.5 bg-border" />
        {/* Progress bar fill */}
        <div
          className="absolute top-3.5 left-0 h-0.5 bg-primary transition-all duration-300"
          style={{ width: `${progress}%` }}
        />

        {steps.map((step, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.label} className="relative z-10 flex flex-col items-center">
              <div
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full border-2 text-xs font-medium transition-colors",
                  isCompleted && "border-primary bg-primary text-primary-foreground",
                  isCurrent && "border-primary bg-background text-primary",
                  !isCompleted && !isCurrent && "border-border bg-background text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="size-3.5" />
                ) : (
                  index + 1
                )}
              </div>
              <span
                className={cn(
                  "mt-2 text-xs text-center max-w-20 hidden sm:block",
                  isCurrent ? "font-medium text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
