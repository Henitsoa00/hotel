import { useMemo, useState } from "react";
import { BedDouble, CalendarDays, Wallet, UtensilsCrossed, CalendarRange, UsersRound, Download, Printer, FileText } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { AreaChart, BarChart } from "../components/Charts";
import { PageHeading, StatCard, ChartCard, DataTable, adminField, outlineButton, panel } from "../components/ui";
import { buildReport, reportKinds } from "../utils/reports";
import { downloadCsv } from "../utils/analytics";
import { addDaysISO, formatDate, todayISO } from "../../utils/booking";

const icons = { occupancy: BedDouble, bookings: CalendarDays, finance: Wallet, restaurant: UtensilsCrossed, events: CalendarRange, clients: UsersRound };

const presets = {
  today: () => [todayISO(), todayISO()],
  week: () => [addDaysISO(undefined, -6), todayISO()],
  month: () => [addDaysISO(undefined, -29), todayISO()],
  year: () => [addDaysISO(undefined, -364), todayISO()],
  custom: null,
};

export default function Reports() {
  const { data } = useAdminData();
  const [kind, setKind] = useState("occupancy");
  const [preset, setPreset] = useState("month");
  const [start, setStart] = useState(addDaysISO(undefined, -29));
  const [end, setEnd] = useState(todayISO());
  const applyPreset = (p) => { setPreset(p); if (presets[p]) { const [s, e] = presets[p](); setStart(s); setEnd(e); } };
  const report = useMemo(() => buildReport(kind, data, start, end), [kind, data, start, end]);
  const columns = report.headers.map((header, i) => ({ key: String(i), label: header, sortable: true, sortValue: (r) => r.values[i], render: (r) => <span className={i === 0 ? "font-medium text-night" : ""}>{r.values[i] ?? "—"}</span> }));
  const exportCsv = () => downloadCsv(`maison-aurele-rapport-${kind}-${todayISO()}.csv`, report.headers, report.rows.map((r) => r.values));

  return <div className="animate-fade-in">
    <div className="no-print"><PageHeading eyebrow="Pilotage / Analyses" title="Rapports" subtitle="Des données fiables pour décider et anticiper." action={<><button onClick={exportCsv} className={outlineButton}><Download size={14}/> Export CSV</button><button onClick={() => window.print()} title="Choisir Enregistrer au format PDF dans la fenêtre d'impression" className={outlineButton}><FileText size={14}/> Export PDF</button><button onClick={() => window.print()} className={outlineButton}><Printer size={14}/> Imprimer</button></>}/></div>
    <div className="no-print mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6">{reportKinds.map((r) => { const Icon = icons[r.key]; return <button key={r.key} onClick={() => setKind(r.key)} className={`rounded-xl border p-4 text-left transition hover:border-gold/60 ${kind === r.key ? "border-gold bg-sand/40" : "border-night/[.07] bg-white"}`}><Icon size={18} className={kind === r.key ? "text-gold" : "text-night/40"}/><div className="mt-3 text-xs font-medium">{r.label}</div><p className="mt-0.5 text-[10px] text-night/45">{r.description}</p></button>; })}</div>
    <div className="no-print mb-5 flex flex-wrap items-center gap-3 rounded-xl border border-night/[.07] bg-white p-4 text-xs"><span className="font-medium text-night/60">Période</span><div className="flex gap-1 rounded-lg bg-ivory p-1">{[["today","Today"],["week","This week"],["month","This month"],["year","This year"],["custom","Custom"]].map(([k,l])=><button key={k} onClick={()=>applyPreset(k)} className={`rounded-md px-3 py-1.5 ${preset===k?"bg-night text-white":"text-night/55"}`}>{l}</button>)}</div><input aria-label="Début" type="date" value={start} onChange={(e) => { setStart(e.target.value); setPreset("custom"); }} className={adminField}/><span className="text-night/40">au</span><input aria-label="Fin" type="date" value={end} onChange={(e) => { setEnd(e.target.value); setPreset("custom"); }} className={adminField}/>{start > end && <span className="text-rose-600">La date de début doit précéder la fin.</span>}</div>
    <div className="print-report">
      <div className="mb-5 hidden print:block"><h1 className="font-serif text-3xl">Maison Aurèle · {report.title}</h1><p className="mt-1 text-xs">Du {formatDate(start)} au {formatDate(end)} · Édité le {formatDate(todayISO())}</p></div>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{report.metrics.map(([label, value], i) => <StatCard key={label} label={label} value={value} accent={i === 0} icon={icons[kind]}/>)}</div>
      <div className="mt-5"><ChartCard title={report.title} subtitle={`Analyse du ${formatDate(start, { day: "numeric", month: "short" })} au ${formatDate(end, { day: "numeric", month: "short", year: "numeric" })}`}>
        {report.chartType === "area" ? <AreaChart data={report.series} format={(n) => report.unit === "%" ? `${Math.round(n)} %` : report.unit === "€" ? `${Math.round(n)} €` : Math.round(n)}/> : <BarChart data={report.series} format={(n) => report.unit === "€" ? `${Math.round(n)} €` : Math.round(n)}/>}</ChartCard></div>
      <div className={`${panel} mt-5 p-4 text-xs text-night/55`}>{report.note}</div>
      <div className="mt-7"><div className="mb-3 flex items-end justify-between"><h2 className="font-serif text-[27px]">Données détaillées</h2><span className="text-xs text-night/45">{report.rows.length} ligne(s)</span></div><DataTable rows={report.rows} columns={columns} pageSize={1000} emptyTitle="Aucune donnée pour cette période" emptyText="Essayez de modifier les dates du rapport."/></div>
    </div>
  </div>;
}