import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Legend, Cell,
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign,
  ShoppingBag, PackageOpen, Calendar,
} from 'lucide-react';
import { useSaleStore }     from '../store/saleStore';
import { usePurchaseStore } from '../store/purchaseStore';

import Spinner   from './atoms/Spinner';
import StatCard  from './molecules/StatCard';
import EmptyState from './molecules/EmptyState';

/* ─── Estilos de tooltip compartido ─────────────────────── */
const TOOLTIP_STYLE = {
  contentStyle: {
    backgroundColor: '#1a1a24',
    borderColor: '#ffffff20',
    borderRadius: '12px',
    color: '#fff',
  },
  itemStyle: { color: '#fff' },
};

const AXIS_PROPS = {
  stroke: '#9ca3af',
  fontSize: 12,
  tickLine: false,
  axisLine: false,
};

/* ─── Subcomponente: tarjeta de gráfico ──────────────────── */
const ChartCard = ({ title, delay, children }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay }}
    className="bg-[#1a1a24] border border-white/10 rounded-2xl p-4 sm:p-6 shadow-xl"
  >
    <h3 className="text-base sm:text-lg font-medium text-white mb-4 sm:mb-6">{title}</h3>
    <div className="h-[300px] sm:h-[400px] w-full">{children}</div>
  </motion.div>
);

/* ─── Subcomponente: KPI card premium con ícono decorativo ─ */
const KpiCard = ({ label, value, icon: Icon, iconColor, gradient, badge, delay }) => (
  <motion.article
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay }}
    className={`${gradient} p-6 rounded-2xl border shadow-xl relative overflow-hidden group`}
  >
    {/* ícono decorativo de fondo */}
    <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity" aria-hidden="true">
      <Icon size={80} className={iconColor} />
    </div>
    <div className="relative z-10">
      <p className="text-sm font-medium tracking-wider uppercase mb-1 text-gray-400">{label}</p>
      <p className={`text-3xl font-bold ${iconColor}`}>{value}</p>
      {badge && (
        <div className={`flex items-center gap-2 mt-4 text-sm w-max px-2 py-1 rounded inline-flex ${badge.className}`}>
          {badge.icon}
          <span>{badge.text}</span>
        </div>
      )}
    </div>
  </motion.article>
);

/* ─── Lógica de filtrado por fecha ───────────────────────── */
const filterByDate = (items, dateFilter) => {
  if (dateFilter === 'all') return items;
  const now   = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  return items.filter((item) => {
    const raw  = item.createdAt || item.date;
    if (!raw) return false;
    const d    = new Date(raw);
    const day  = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    if (dateFilter === 'today')  return day.getTime() === today.getTime();
    if (dateFilter === '7days')  { const l = new Date(today); l.setDate(today.getDate() - 7);  return day >= l; }
    if (dateFilter === '30days') { const l = new Date(today); l.setDate(today.getDate() - 30); return day >= l; }
    if (dateFilter === 'month')  return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    return true;
  });
};

const toDateKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const fmtKey = (key) => { const [y, m, d] = key.split('-'); return `${d}/${m}/${y}`; };

/* ─── Componente principal ───────────────────────────────── */
const AnalyticsManager = () => {
  const { sales,     fetchSales,     isLoading: isLoadingSales     } = useSaleStore();
  const { purchases, fetchPurchases, isLoading: isLoadingPurchases } = usePurchaseStore();
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => { fetchSales(); fetchPurchases(); }, [fetchSales, fetchPurchases]);

  const isLoading = isLoadingSales || isLoadingPurchases;

  const { chartData, totalSales, totalPurchases, netProfit } = useMemo(() => {
    const filteredSales     = filterByDate(sales, dateFilter);
    const filteredPurchases = filterByDate(purchases, dateFilter);

    const salesByDay     = {};
    const purchasesByDay = {};
    let tSales = 0, tPurchases = 0;

    filteredSales.forEach((s) => {
      const key = toDateKey(s.createdAt || s.date);
      const amt = Number(s.total_amount) || 0;
      salesByDay[key] = (salesByDay[key] || 0) + amt;
      tSales += amt;
    });

    filteredPurchases.forEach((p) => {
      const key = toDateKey(p.createdAt || p.date);
      const cost = Number(p.total_cost) || 0;
      purchasesByDay[key] = (purchasesByDay[key] || 0) + cost;
      tPurchases += cost;
    });

    const allKeys = Array.from(new Set([...Object.keys(salesByDay), ...Object.keys(purchasesByDay)])).sort();

    return {
      chartData: allKeys.map((key) => {
        const v = salesByDay[key]     || 0;
        const c = purchasesByDay[key] || 0;
        return {
          dateKey:  key,
          date:     fmtKey(key),
          Ventas:   Number(v.toFixed(2)),
          Compras:  Number(c.toFixed(2)),
          Ganancia: Number((v - c).toFixed(2)),
        };
      }),
      totalSales:     tSales,
      totalPurchases: tPurchases,
      netProfit:      tSales - tPurchases,
    };
  }, [sales, purchases, dateFilter]);

  /* ── Render ── */
  return (
    <section
      aria-labelledby="analytics-heading"
      className="w-full max-w-7xl mx-auto p-4 sm:p-6"
    >
      {/* Encabezado con filtro de fecha */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
        <h2 id="analytics-heading" className="text-2xl sm:text-3xl font-bold text-white tracking-wide">
          Resumen de <span className="text-orange-500">Ganancias</span>
        </h2>

        <div className="flex items-center w-full md:w-auto gap-2 bg-[#1a1a24] border border-white/10 rounded-xl px-4 py-2">
          <Calendar size={18} className="text-orange-500 shrink-0" aria-hidden="true" />
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filtrar período"
            className="bg-transparent text-white focus:outline-none cursor-pointer text-sm w-full"
          >
            <option value="all"    className="bg-[#1a1a24]">Todo el tiempo</option>
            <option value="today"  className="bg-[#1a1a24]">Hoy</option>
            <option value="7days"  className="bg-[#1a1a24]">Últimos 7 días</option>
            <option value="30days" className="bg-[#1a1a24]">Últimos 30 días</option>
            <option value="month"  className="bg-[#1a1a24]">Este mes</option>
          </select>
        </div>
      </header>

      {/* Estado de carga */}
      {isLoading ? (
        <div className="flex h-64 items-center justify-center">
          <Spinner size="lg" />
        </div>
      ) : chartData.length === 0 ? (
        <div className="bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl">
          <EmptyState
            icon={<TrendingUp size={48} />}
            message="Aún no hay datos para mostrar"
            detail="Registra ventas y compras para ver el resumen financiero."
          />
        </div>
      ) : (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <KpiCard
              label="Total Ventas"
              value={`$${totalSales.toFixed(2)}`}
              icon={DollarSign}
              iconColor="text-green-400"
              gradient="bg-gradient-to-br from-black/40 to-black/20 border-white/10"
              delay={0}
              badge={{ icon: <TrendingUp size={16} />, text: "Ingresos Brutos", className: "text-green-500 bg-green-500/10" }}
            />
            <KpiCard
              label="Total Compras"
              value={`$${totalPurchases.toFixed(2)}`}
              icon={ShoppingBag}
              iconColor="text-red-400"
              gradient="bg-gradient-to-br from-black/40 to-black/20 border-white/10"
              delay={0.1}
              badge={{ icon: <PackageOpen size={16} />, text: "Costos Operativos", className: "text-red-500 bg-red-500/10" }}
            />
            <KpiCard
              label="Ganancia Neta"
              value={<span className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">${netProfit.toFixed(2)}</span>}
              icon={TrendingUp}
              iconColor="text-orange-500"
              gradient="bg-gradient-to-br from-orange-500/20 to-amber-500/5 border-orange-500/20"
              delay={0.2}
              badge={{
                icon: netProfit >= 0 ? <TrendingUp size={16} /> : <TrendingDown size={16} />,
                text: netProfit >= 0 ? "Rentable" : "Pérdida",
                className: "text-orange-400 bg-orange-500/10",
              }}
            />
          </div>

          {/* Gráficas */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <ChartCard title="Comparativa Diaria (Ventas vs Compras)" delay={0.3}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorVentas" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#22c55e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#22c55e" stopOpacity={0}   />
                    </linearGradient>
                    <linearGradient id="colorCompras" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#ef4444" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="date" {...AXIS_PROPS} />
                  <YAxis {...AXIS_PROPS} tickFormatter={(v) => `$${v}`} />
                  <Tooltip {...TOOLTIP_STYLE} />
                  <Legend iconType="circle" />
                  <Area type="monotone" dataKey="Ventas"  stroke="#22c55e" strokeWidth={3} fillOpacity={1} fill="url(#colorVentas)"  />
                  <Area type="monotone" dataKey="Compras" stroke="#ef4444" strokeWidth={3} fillOpacity={1} fill="url(#colorCompras)" />
                </AreaChart>
              </ResponsiveContainer>
            </ChartCard>

            <ChartCard title="Ganancia / Flujo de Caja" delay={0.4}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff15" vertical={false} />
                  <XAxis dataKey="date" {...AXIS_PROPS} />
                  <YAxis {...AXIS_PROPS} tickFormatter={(v) => `$${v}`} />
                  <Tooltip cursor={{ fill: '#ffffff05' }} {...TOOLTIP_STYLE} />
                  <Legend iconType="circle" />
                  <Bar dataKey="Ganancia" radius={[6, 6, 6, 6]}>
                    {chartData.map((entry, i) => (
                      <Cell key={`cell-${i}`} fill={entry.Ganancia >= 0 ? '#f97316' : '#ef4444'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>
          </div>

          {/* Tabla de detalle diario */}
          <section
            className="mt-8 bg-[#1a1a24] border border-white/10 rounded-2xl shadow-xl overflow-hidden"
            aria-labelledby="daily-detail-heading"
          >
            <header className="p-4 sm:p-6 border-b border-white/10 flex justify-between items-center bg-black/20">
              <h3 id="daily-detail-heading" className="text-base sm:text-lg font-medium text-white flex items-center gap-2">
                <Calendar size={20} className="text-orange-500" aria-hidden="true" />
                Detalle Diario
              </h3>
            </header>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-black/40 text-gray-400 text-xs sm:text-sm tracking-wider uppercase">
                    <th scope="col" className="px-4 py-3 sm:p-4 font-medium">Fecha</th>
                    <th scope="col" className="px-4 py-3 sm:p-4 font-medium text-right">Ventas</th>
                    <th scope="col" className="px-4 py-3 sm:p-4 font-medium text-right">Compras</th>
                    <th scope="col" className="px-4 py-3 sm:p-4 font-medium text-right">Ganancia</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {[...chartData].reverse().map((row, i) => (
                    <tr key={i} className="hover:bg-white/5 transition-colors text-gray-300 text-sm sm:text-base">
                      <td className="px-4 py-3 sm:p-4 whitespace-nowrap">{row.date}</td>
                      <td className="px-4 py-3 sm:p-4 text-right text-green-400 font-medium whitespace-nowrap">
                        ${row.Ventas.toFixed(2)}
                      </td>
                      <td className="px-4 py-3 sm:p-4 text-right text-red-400 font-medium whitespace-nowrap">
                        ${row.Compras.toFixed(2)}
                      </td>
                      <td className={`px-4 py-3 sm:p-4 text-right font-bold whitespace-nowrap ${row.Ganancia >= 0 ? 'text-orange-400' : 'text-red-500'}`}>
                        ${row.Ganancia.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </section>
  );
};

export default AnalyticsManager;
