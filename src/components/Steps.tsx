import React from 'react';
import { Check } from 'lucide-react';

export type StepStatus = 'done' | 'active' | 'todo';

const STEP_DEFS = [
  { title: 'เลือกสไตล์' },
  { title: 'อัปโหลดรูป' },
  { title: 'ประมวลผล' },
];

/** Horizontal progress stepper that highlights based on real workflow state. */
export const Stepper: React.FC<{ statuses: StepStatus[] }> = ({ statuses }) => {
  return (
    <div className="card p-4 sm:p-5">
      <div className="flex items-start">
        {STEP_DEFS.map((s, i) => {
          const st = statuses[i] || 'todo';
          const isDone = st === 'done';
          const isActive = st === 'active';
          const isLast = i === STEP_DEFS.length - 1;
          return (
            <React.Fragment key={i}>
              <div className="flex flex-col items-center gap-1.5 shrink-0 w-20 sm:w-28">
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[20px] font-bold border-2 transition-all ${
                    isDone
                      ? 'bg-gold border-gold text-white shadow-[0_6px_16px_-6px_rgba(199,154,91,0.6)]'
                      : isActive
                      ? 'bg-white border-gold text-gold-dark ring-4 ring-gold/15'
                      : 'bg-cream-2 border-line text-subtle'
                  }`}
                >
                  {isDone ? <Check className="w-4 h-4" /> : i + 1}
                </div>
                <div className="text-center leading-tight">
                  <div className={`text-[14px] uppercase tracking-widest font-bold ${isDone || isActive ? 'text-gold-dark' : 'text-subtle'}`}>
                    STEP {i + 1}
                  </div>
                  <div className={`text-[16px] font-semibold ${isDone || isActive ? 'text-ink' : 'text-muted'}`}>
                    {s.title}
                  </div>
                </div>
              </div>

              {!isLast && (
                <div
                  className={`flex-1 h-0.5 mt-[17px] mx-1 sm:mx-2 rounded-full transition-colors ${
                    isDone ? 'bg-gold' : 'bg-line'
                  }`}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};

/** Numbered section header placed above each step's content. */
export const StepHeader: React.FC<{ step: number; title: string; subtitle?: string }> = ({
  step,
  title,
  subtitle,
}) => {
  return (
    <div className="flex items-center gap-3.5 px-1">
      <div className="w-9 h-9 rounded-full bg-gradient-to-b from-[#d3a866] to-[#c79a5b] text-white flex items-center justify-center text-[20px] font-bold shadow-[0_6px_16px_-6px_rgba(199,154,91,0.6)] shrink-0">
        {step}
      </div>
      <div>
        <span className="text-[15px] uppercase tracking-[0.25em] font-bold text-gold-dark">STEP {step}</span>
        <h2 className="text-[20px] font-semibold text-ink leading-tight">{title}</h2>
        {subtitle && <p className="text-[17px] text-muted leading-snug mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
};
