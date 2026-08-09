'use client';

interface DashboardHeaderProps {
  readonly lotName: string;
  readonly lotOptions: string[];
  readonly selectedLot: string;
  readonly onLotChange: (lot: string) => void;
  readonly lastUpdated: string;
  readonly onRefresh: () => void;
}

export function DashboardHeader({
  lotName,
  lotOptions,
  selectedLot,
  onLotChange,
  lastUpdated,
  onRefresh,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
      <div className="flex items-center gap-4 flex-wrap">
        <h1 className="text-2xl font-bold text-gray-900">{lotName}</h1>
        <div className="relative">
          <select
            value={selectedLot}
            onChange={(e) => onLotChange(e.target.value)}
            className="appearance-none bg-gray-50 border border-gray-200 text-gray-900 py-2 pl-4 pr-10 rounded-lg text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
          >
            {lotOptions.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none text-base">
            expand_more
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-md">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
          </span>
          <span className="text-xs font-mono text-gray-500">{lastUpdated}</span>
        </div>
        <button
          onClick={onRefresh}
          className="flex items-center gap-1.5 px-4 py-2 bg-white text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium text-sm"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          Làm mới
        </button>
      </div>
    </div>
  );
}
