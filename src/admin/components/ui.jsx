import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AlertCircle, ArrowDown, ArrowUp, ChevronLeft, ChevronRight, LoaderCircle, MoreHorizontal, Search, X } from "lucide-react";

export const adminField = "input !rounded-xl !border-night/10 !bg-white !px-3.5 !py-2.5 !text-[13px] focus:!border-gold";
export const adminButton = "btn-dark !rounded-xl !px-4 !py-2.5 !text-[13px]";
export const outlineButton = "btn-outline !rounded-xl !px-4 !py-2.5 !text-[13px]";
export const panel = "rounded-[20px] border border-night/[0.07] bg-white shadow-[0_3px_24px_rgba(15,27,45,.025)]";

const statuses = {
  confirmed: ["Confirmée", "green"], pending: ["En attente", "amber"], "checked-in": ["Check-in", "blue"], "in-house": ["En séjour", "blue"], "checked-out": ["Check-out", "slate"], completed: ["Terminée", "slate"], cancelled: ["Annulée", "red"], "no-show": ["No-show", "red"],
  paid: ["Payé", "green"], partial: ["Partiel", "blue"], overdue: ["En retard", "red"], refunded: ["Remboursé", "slate"], settled: ["Soldé", "green"], unpaid: ["Impayé", "red"], sent: ["Envoyée", "blue"], draft: ["Brouillon", "slate"],
  available: ["Disponible", "green"], occupied: ["Occupée", "blue"], reserved: ["Réservée", "amber"], cleaning: ["Nettoyage", "purple"], maintenance: ["Maintenance", "red"], "out-of-service": ["Hors service", "slate"],
  clean: ["Propre", "green"], dirty: ["À nettoyer", "red"], inspected: ["Inspectée", "blue"],
  preparing: ["En préparation", "blue"], ready: ["Prête", "green"], served: ["Servie", "purple"],
  upcoming: ["À venir", "amber"], "in-progress": ["En cours", "blue"],
  open: ["Ouvert", "amber"], resolved: ["Résolu", "green"],
  vip: ["VIP", "amber"], regular: ["Fidèle", "blue"], new: ["Nouveau", "green"],
  active: ["Actif", "green"], inactive: ["Inactif", "slate"],
  high: ["Urgente", "red"], normal: ["Normale", "blue"], low: ["Faible", "slate"],
};

const tones = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-200/70 before:bg-emerald-500",
  amber: "bg-amber-50 text-amber-700 ring-amber-200/70 before:bg-amber-500",
  blue: "bg-sky-50 text-sky-700 ring-sky-200/70 before:bg-sky-500",
  red: "bg-rose-50 text-rose-700 ring-rose-200/70 before:bg-rose-500",
  purple: "bg-violet-50 text-violet-700 ring-violet-200/70 before:bg-violet-500",
  slate: "bg-slate-100 text-slate-600 ring-slate-200/70 before:bg-slate-400",
};

export function StatusBadge({ value, plain = false }) {
  const [label, tone] = statuses[value] || [value || "—", "slate"];
  return <span className={`inline-flex max-w-full items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1 text-[11px] font-medium ring-1 ring-inset ${tones[tone]} ${plain ? "" : "before:h-1.5 before:w-1.5 before:shrink-0 before:rounded-full"}`}>{label}</span>;
}

export function PageHeading({ eyebrow, title, subtitle, action }) {
  return <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
    <div><p className="text-[10px] font-semibold uppercase tracking-[.22em] text-gold">{eyebrow || "Maison Aurèle · Administration"}</p>
      <h1 className="mt-1 font-serif text-[38px] leading-none tracking-tight text-night sm:text-[44px]">{title}</h1>
      {subtitle && <p className="mt-2 text-[13px] text-night/50">{subtitle}</p>}
    </div>{action && <div className="flex shrink-0 flex-wrap gap-2">{action}</div>}
  </div>;
}

export function StatCard({ label, value, hint, icon: Icon, accent = false, onClick }) {
  const Tag = onClick ? "button" : "div";
  return <Tag onClick={onClick} className={`${panel} relative min-w-0 overflow-hidden p-5 text-left transition duration-300 ${onClick ? "hover:-translate-y-0.5 hover:shadow-lg" : ""} ${accent ? "!border-night !bg-night text-white" : ""}`}>
    <div className="flex items-start justify-between gap-2">
      <span className={`text-[11px] font-medium uppercase tracking-[.11em] ${accent ? "text-white/60" : "text-night/50"}`}>{label}</span>
      {Icon && <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${accent ? "bg-white/10 text-beige" : "bg-sand/50 text-gold"}`}><Icon size={17} strokeWidth={1.8} /></span>}
    </div>
    <div className="mt-3 font-serif text-[clamp(25px,2.2vw,38px)] leading-none tracking-tight" title={String(value)}>{value}</div>
    {hint && <p className={`mt-2 text-[11px] ${accent ? "text-white/50" : "text-night/45"}`}>{hint}</p>}
    {accent && <div className="absolute -bottom-11 -right-10 h-32 w-32 rounded-full border border-white/10" />}
  </Tag>;
}

export function SearchBar({ value, onChange, placeholder = "Rechercher…", className = "" }) {
  return <label className={`relative block ${className}`}>
    <Search size={16} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-night/40" />
    <input type="search" aria-label="Rechercher" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${adminField} !pl-10`} />
  </label>;
}

export function FilterBar({ children }) { return <div className="mb-5 flex flex-wrap items-center gap-2.5">{children}</div>; }

export function Pagination({ page, pages, total, perPage, onChange }) {
  if (total === 0) return null;
  return <div className="flex flex-wrap items-center justify-between gap-3 border-t border-night/[.07] px-5 py-3 text-xs text-night/45">
    <span>{(page - 1) * perPage + 1}–{Math.min(page * perPage, total)} sur {total} résultats</span>
    <div className="flex items-center gap-1">
      <button type="button" onClick={() => onChange(page - 1)} disabled={page === 1} aria-label="Page précédente" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ivory disabled:opacity-30"><ChevronLeft size={15} /></button>
      <span className="min-w-16 text-center text-night/70">{page} / {pages}</span>
      <button type="button" onClick={() => onChange(page + 1)} disabled={page === pages} aria-label="Page suivante" className="grid h-8 w-8 place-items-center rounded-lg hover:bg-ivory disabled:opacity-30"><ChevronRight size={15} /></button>
    </div>
  </div>;
}

export function DataTable({ columns, rows, onRowClick, emptyTitle = "Aucun résultat", emptyText, pageSize = 8, loading = false }) {
  const [sort, setSort] = useState({ key: null, dir: 1 });
  const [page, setPage] = useState(1);
  useEffect(() => setPage(1), [rows]);
  const sorted = useMemo(() => {
    if (!sort.key) return rows;
    const column = columns.find((c) => c.key === sort.key);
    if (!column) return rows;
    return [...rows].sort((a, b) => {
      const av = column.sortValue ? column.sortValue(a) : a[column.key];
      const bv = column.sortValue ? column.sortValue(b) : b[column.key];
      return (typeof av === "number" && typeof bv === "number" ? av - bv : String(av ?? "").localeCompare(String(bv ?? ""), "fr", { numeric: true })) * sort.dir;
    });
  }, [rows, sort, columns]);
  const pages = Math.max(1, Math.ceil(rows.length / pageSize));
  const currentPage = Math.min(page, pages);
  const visible = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);
  const toggle = (key) => setSort((s) => ({ key, dir: s.key === key ? -s.dir : 1 }));

  return <div className={`${panel} overflow-hidden`}>
    {loading ? <LoadingState /> : !rows.length ? <EmptyState title={emptyTitle} text={emptyText} /> : <>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left text-[12px]">
          <thead className="bg-[#faf9f6] text-[10px] font-semibold uppercase tracking-[.1em] text-night/45"><tr>
            {columns.map((c) => <th key={c.key} scope="col" className={`whitespace-nowrap border-b border-night/[.07] px-4 py-3.5 first:pl-5 last:pr-5 ${c.className || ""}`}>
              {c.sortable === false ? c.label : <button type="button" onClick={() => toggle(c.key)} className="inline-flex items-center gap-1 text-left hover:text-night">{c.label}{sort.key === c.key ? sort.dir === 1 ? <ArrowUp size={12} /> : <ArrowDown size={12} /> : <span className="opacity-30">↕</span>}</button>}
            </th>)}
          </tr></thead>
          <tbody className="divide-y divide-night/[.055]">{visible.map((r, i) => <tr key={r.id ?? i} onClick={onRowClick ? () => onRowClick(r) : undefined} className={`transition hover:bg-[#faf8f4] ${onRowClick ? "cursor-pointer" : ""}`}>
            {columns.map((c) => <td key={c.key} className={`whitespace-nowrap px-4 py-3.5 text-night/70 first:pl-5 last:pr-5 ${c.cellClassName || ""}`}>{c.render ? c.render(r) : r[c.key]}</td>)}
          </tr>)}</tbody>
        </table>
      </div>
      <Pagination page={currentPage} pages={pages} total={rows.length} perPage={pageSize} onChange={setPage} />
    </>}
  </div>;
}

export function Modal({ open, onClose, title, description, children, footer, size = "md" }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = old; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[90] flex items-center justify-center bg-night/55 p-3 backdrop-blur-[3px] animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <section role="dialog" aria-modal="true" aria-label={title} className={`flex max-h-[min(92vh,900px)] w-full flex-col overflow-hidden rounded-[22px] bg-white shadow-2xl animate-fade-up ${size === "lg" ? "max-w-2xl" : "max-w-lg"}`}>
      <div className="flex shrink-0 items-start justify-between gap-4 border-b border-night/[.07] px-6 py-5">
        <div><h2 className="font-serif text-[27px] leading-none">{title}</h2>{description && <p className="mt-1 text-xs text-night/50">{description}</p>}</div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-8 w-8 place-items-center rounded-lg text-night/45 hover:bg-ivory hover:text-night"><X size={18} /></button>
      </div>
      <div className="overflow-y-auto px-6 py-5">{children}</div>
      {footer && <div className="flex shrink-0 flex-wrap justify-end gap-2 border-t border-night/[.07] bg-[#faf9f6] px-6 py-4">{footer}</div>}
    </section>
  </div>;
}

export function Drawer({ open, onClose, title, eyebrow, children, footer }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    const old = document.body.style.overflow; document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = old; };
  }, [open, onClose]);
  if (!open) return null;
  return <div className="fixed inset-0 z-[80] bg-night/45 backdrop-blur-[2px] animate-fade-in" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
    <aside role="dialog" aria-modal="true" aria-label={title} className="absolute inset-y-0 right-0 flex w-full max-w-[540px] flex-col bg-ivory shadow-2xl animate-[slideIn_.3s_ease-out]">
      <div className="flex shrink-0 items-start justify-between border-b border-night/10 bg-white px-6 py-5">
        <div>{eyebrow && <p className="text-[10px] font-semibold uppercase tracking-[.2em] text-gold">{eyebrow}</p>}<h2 className="mt-1 font-serif text-[30px] leading-none">{title}</h2></div>
        <button type="button" onClick={onClose} aria-label="Fermer" className="grid h-9 w-9 place-items-center rounded-lg hover:bg-ivory"><X size={19} /></button>
      </div>
      <div className="flex-1 overflow-y-auto p-6">{children}</div>
      {footer && <div className="flex shrink-0 flex-wrap gap-2 border-t border-night/10 bg-white p-5">{footer}</div>}
    </aside>
  </div>;
}

export function ConfirmDialog({ open, onClose, onConfirm, title = "Confirmer cette action ?", description, confirmLabel = "Confirmer", destructive = false }) {
  return <Modal open={open} onClose={onClose} title={title} footer={<><button type="button" onClick={onClose} className={outlineButton}>Retour</button><button type="button" onClick={() => { onConfirm(); onClose(); }} className={`${adminButton} ${destructive ? "!bg-rose-700 hover:!bg-rose-800" : ""}`}>{confirmLabel}</button></>}>
    <div className="flex items-start gap-3 rounded-xl bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle size={18} className="mt-0.5 shrink-0" />{description || "Cette action modifiera les données enregistrées dans cette démonstration."}</div>
  </Modal>;
}

export function Dropdown({ items, label = "Actions" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const menuRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const visibleItems = items.filter(Boolean);
  const toggle = () => {
    if (!open && ref.current) {
      const box = ref.current.getBoundingClientRect();
      const height = visibleItems.length * 34 + 8;
      setPosition({ top: box.bottom + height + 6 > window.innerHeight ? Math.max(8, box.top - height - 4) : box.bottom + 4, left: Math.max(8, Math.min(window.innerWidth - 185, box.right - 176)) });
    }
    setOpen(!open);
  };
  useEffect(() => {
    const close = (e) => { if (!ref.current?.contains(e.target) && !menuRef.current?.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    window.addEventListener("scroll", close, true);
    window.addEventListener("resize", close);
    return () => { window.removeEventListener("scroll", close, true); window.removeEventListener("resize", close); };
  }, [open]);
  return <div ref={ref} className="relative inline-block" onClick={(e) => e.stopPropagation()}>
    <button type="button" onClick={toggle} title={label} aria-label={label} aria-expanded={open} className="grid h-8 w-8 place-items-center rounded-lg text-night/50 hover:bg-ivory hover:text-night"><MoreHorizontal size={18} /></button>
    {open && createPortal(<div ref={menuRef} style={position} className="fixed z-[110] min-w-44 overflow-hidden rounded-xl border border-night/10 bg-white p-1 shadow-xl animate-fade-in" onClick={(e) => e.stopPropagation()}>
      {visibleItems.map((item, i) => {
        const Icon = item.icon;
        return <button type="button" disabled={item.disabled} key={i} onClick={() => { item.onClick(); setOpen(false); }} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs transition hover:bg-ivory disabled:cursor-not-allowed disabled:opacity-40 ${item.danger ? "text-rose-600" : "text-night/80"}`}>
          {Icon && <Icon size={14} />}{item.label}
        </button>;
      })}
    </div>, document.body)}
  </div>;
}

export function FormField({ label, error, children, className = "" }) {
  return <label className={`block ${className}`}><span className="mb-1.5 block text-[11px] font-medium text-night/65">{label}</span>{children}{error && <span className="mt-1 block text-[11px] text-rose-600">{error}</span>}</label>;
}

export function EmptyState({ title = "Aucun résultat", text = "Essayez de modifier vos filtres.", action, icon: Icon = Search }) {
  return <div className="flex min-h-[220px] flex-col items-center justify-center px-6 py-12 text-center">
    <div className="grid h-12 w-12 place-items-center rounded-2xl bg-sand/60 text-gold"><Icon size={21} strokeWidth={1.7} /></div>
    <h3 className="mt-4 font-serif text-2xl">{title}</h3><p className="mt-1 max-w-sm text-xs text-night/50">{text}</p>{action && <div className="mt-5">{action}</div>}
  </div>;
}

export function LoadingState() {
  return <div className="animate-pulse p-5"><div className="mb-5 h-4 w-1/3 rounded bg-sand/70" />{Array.from({ length: 6 }, (_, i) => <div key={i} className="mb-4 flex gap-4"><div className="h-10 w-10 rounded-lg bg-sand/60"/><div className="h-10 flex-1 rounded-lg bg-sand/40"/><div className="h-10 w-1/5 rounded-lg bg-sand/40"/></div>)}</div>;
}

export function ChartCard({ title, subtitle, children, action, className = "" }) {
  return <div className={`${panel} flex flex-col p-5 sm:p-6 ${className}`}>
    <div className="mb-5 flex items-start justify-between gap-3"><div><h3 className="font-serif text-[23px] leading-tight">{title}</h3>{subtitle && <p className="mt-0.5 text-[11px] text-night/45">{subtitle}</p>}</div>{action}</div>
    <div className="flex min-h-0 flex-1 flex-col justify-center">{children}</div>
  </div>;
}

export const Busy = ({ size = 16 }) => <LoaderCircle size={size} className="animate-spin" />;