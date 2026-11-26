import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  PackagePlus,
} from 'lucide-react';
import { useHub } from '../../context/HubContext';
import { ResourceCategory } from '../../types/disaster';
import { formatRelativeTime } from '../../utils/formatters';

const CATEGORIES: Array<'All' | ResourceCategory> = [
  'All',
  'Food Supplies',
  'Drinking Water',
  'Medical Kits',
  'Ambulances',
  'Rescue Vehicles',
  'Temporary Shelters',
  'Emergency Equipment',
];

export const ResourcesView: React.FC = () => {
  const { resources, allocateResource, restockResource } = useHub();
  const [categoryFilter, setCategoryFilter] = useState<'All' | ResourceCategory>('All');
  const [stepAmount, setStepAmount] = useState<Record<string, number>>({});

  const filtered = useMemo(
    () =>
      resources.filter((r) =>
        categoryFilter === 'All' ? true : r.category === categoryFilter
      ),
    [resources, categoryFilter]
  );

  const getStep = (id: string, available: number) => {
    if (stepAmount[id]) return stepAmount[id];
    return available > 500 ? 100 : available > 50 ? 10 : 1;
  };

  return (
    <div className="space-y-5">
      {/* Category Tabs */}
      <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-slate-200 bg-white p-2">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            type="button"
            onClick={() => setCategoryFilter(cat)}
            className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors whitespace-nowrap ${
              categoryFilter === cat
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Resource Inventory Grid */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {filtered.map((res) => {
          const total = res.availableQuantity + res.allocatedQuantity;
          const availPct = total > 0 ? Math.round((res.availableQuantity / total) * 100) : 0;
          const step = getStep(res.id, res.availableQuantity);

          const statusStyles =
            res.status === 'Adequate'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : res.status === 'Low Stock'
                ? 'border-amber-200 bg-amber-50 text-amber-800'
                : 'border-red-200 bg-red-50 text-red-700';

          const barColor =
            res.status === 'Adequate'
              ? 'bg-emerald-600'
              : res.status === 'Low Stock'
                ? 'bg-amber-500'
                : 'bg-red-600';

          return (
            <article
              key={res.id}
              className="rounded-xl border border-slate-200 bg-white p-5 space-y-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-medium text-slate-500">
                    {res.category} · {res.depotLocation}
                  </div>
                  <h2 className="mt-1 font-display text-base font-semibold text-slate-900">
                    {res.name}
                  </h2>
                </div>
                <span className={`shrink-0 rounded border px-2 py-0.5 text-xs font-medium ${statusStyles}`}>
                  {res.status}
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3 rounded-lg border border-slate-200 bg-slate-50/70 p-3 text-xs">
                <div>
                  <div className="text-slate-500">Available</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-900 tabular-nums">
                    {res.availableQuantity.toLocaleString()}{' '}
                    <span className="text-[11px] font-normal text-slate-500">{res.unit}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Allocated</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-blue-700 tabular-nums">
                    {res.allocatedQuantity.toLocaleString()}{' '}
                    <span className="text-[11px] font-normal text-slate-500">{res.unit}</span>
                  </div>
                </div>
                <div>
                  <div className="text-slate-500">Reserve</div>
                  <div className="mt-0.5 font-mono text-base font-bold text-slate-800 tabular-nums">
                    {availPct}%
                  </div>
                </div>
              </div>

              <div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
                  <div
                    className={`h-full transition-all ${barColor}`}
                    style={{ width: `${availPct}%` }}
                  />
                </div>
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Updated {formatRelativeTime(res.lastUpdated)}</span>
                  <span className="font-mono tabular-nums">
                    Total Pool: {total.toLocaleString()} {res.unit}
                  </span>
                </div>
              </div>

              {/* Dispatch / Restock Controls */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                <div className="flex items-center gap-2 text-xs">
                  <label className="text-slate-500">Batch Qty:</label>
                  <input
                    type="number"
                    min={1}
                    value={step}
                    onChange={(e) =>
                      setStepAmount((prev) => ({
                        ...prev,
                        [res.id]: Math.max(1, parseInt(e.target.value, 10) || 1),
                      }))
                    }
                    className="w-20 rounded-md border border-slate-300 px-2 py-1 font-mono text-xs tabular-nums"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void allocateResource(res.id, step)}
                    disabled={res.availableQuantity === 0}
                    className="inline-flex items-center gap-1 rounded-lg border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 hover:bg-blue-100 disabled:opacity-50"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" />
                    Dispatch
                  </button>
                  <button
                    type="button"
                    onClick={() => void restockResource(res.id, step)}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50"
                  >
                    <PackagePlus className="h-3.5 w-3.5 text-emerald-600" />
                    Restock
                  </button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
};
