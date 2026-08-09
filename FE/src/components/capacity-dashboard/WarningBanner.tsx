'use client';

interface WarningBannerProps {
  readonly title: string;
  readonly detail: string;
}

export function WarningBanner({ title, detail }: WarningBannerProps) {
  return (
    <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm flex items-start gap-3">
      <span className="material-symbols-outlined text-amber-600 mt-0.5 shrink-0">
        warning
      </span>
      <div>
        <h3 className="text-base font-bold text-amber-800">{title}</h3>
        <p className="text-sm text-amber-700 mt-1">{detail}</p>
      </div>
    </div>
  );
}
