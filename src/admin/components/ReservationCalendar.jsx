import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAdminData } from "../context/AdminDataContext";
import { StatusBadge, panel } from "./ui";
import { todayISO } from "../../utils/booking";

function startOfWeek(d) { const x = new Date(d + "T12:00:00"); const dow = (x.getDay() + 6) % 7; x.setDate(x.getDate() - dow); return x.toISOString().slice(0, 10); }
function addDays(iso, n) { const d = new Date(iso + "T12:00:00"); d.setDate(d.getDate() + n); return d.toISOString().slice(0, 10); }

const dot = { pending: "bg-amber-400", confirmed: "bg-emerald-400", "checked-in": "bg-sky-400", "checked-out": "bg-slate-300", completed: "bg-slate-300", cancelled: "bg-rose-300", "no-show": "bg-rose-400" };

export function ReservationCalendar({ onSelect }) {
  const { data } = useAdminData();
  const [mode, setMode] = useState("week");
  const [anchor, setAnchor] = useState(todayISO());

  const days = useMemo(() => {
    if (mode === "day") return [anchor];
    if (mode === "week") { const s = startOfWeek(anchor); return Array.from({ length: 7 }, (_, i) => addDays(s, i)); }
    const d = new Date(anchor + "T12:00:00"); d.setDate(1);
    const offset = (d.getDay() + 6) % 7;
    const dim = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
    const total = Math.ceil((offset + dim) / 7) * 7;
    return Array.from({ length: total }, (_, i) => { const x = new Date(d.getFullYear(), d.getMonth(), i - offset + 1); return `${x.getFullYear()}-${String(x.getMonth()+1).padStart(2,"0")}-${String(x.getDate()).padStart(2,"0")}`; });
  }, [mode, anchor]);

  const forDay = (day) => data.reservations.filter((r) => !["cancelled","no-show"].includes(r.status) && r.checkIn <= day && r.checkOut > day);
  const rooms = [...data.rooms].sort((a, b) => a.number.localeCompare(b.number)).slice(0, 12);

  const move = (n) => setAnchor(mode === "day" ? addDays(anchor, n) : mode === "week" ? addDays(anchor, n * 7) : (() => { const d = new Date(anchor + "T12:00:00"); d.setMonth(d.getMonth() + n); return d.toISOString().slice(0, 10); })());

  return <div className={`${panel} overflow-hidden`}>
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-night/[.07] p-4">
      <div className="flex items-center gap-2">
        <button onClick={() => move(-1)} aria-label="Précédent" className="grid h-8 w-8 place-items-center rounded-lg border border-night/10 hover:bg-ivory"><ChevronLeft size={15}/></button>
        <button onClick={() => setAnchor(todayISO())} className="rounded-lg bg-ivory px-3 py-1.5 text-[11px] hover:bg-sand">Aujourd'hui</button>
        <button onClick={() => move(1)} aria-label="Suivant" className="grid h-8 w-8 place-items-center rounded-lg border border-night/10 hover:bg-ivory"><ChevronRight size={15}/></button>
        <span className="ml-2 font-serif text-xl">{new Date(anchor + "T12:00:00").toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}</span>
      </div>
      <div className="flex gap-1 rounded-xl bg-ivory p-1">{[["day","Jour"],["week","Semaine"],["month","Mois"]].map(([k,l]) => <button key={k} onClick={() => setMode(k)} className={`rounded-lg px-3 py-1.5 text-[11px] ${mode===k?"bg-night text-white":"text-night/55"}`}>{l}</button>)}</div>
    </div>
    {mode === "month" ? (
      <div>
        <div className="grid grid-cols-7 border-b border-night/[.06] text-center text-[10px] uppercase tracking-wider text-night/40">{["Lun","Mar","Mer","Jeu","Ven","Sam","Dim"].map((d)=><span key={d} className="py-2.5">{d}</span>)}</div>
        <div className="grid grid-cols-7">{days.map((day) => { const list = forDay(day); return <button key={day} onClick={() => { setAnchor(day); setMode("day"); }} className={`min-h-[86px] border-b border-r border-night/[.05] p-1.5 text-left align-top hover:bg-sand/25 ${day===todayISO()?"bg-gold/[.07]":""}`}><span className={`text-[11px] ${day===todayISO()?"font-bold text-gold":"text-night/60"}`}>{Number(day.slice(8,10))}</span><div className="mt-1 space-y-1">{list.slice(0,3).map((r)=><span key={r.id} className="flex items-center gap-1 truncate rounded bg-white px-1 py-0.5 text-[9px] ring-1 ring-night/10"><span className={`h-1.5 w-1.5 shrink-0 rounded-full ${dot[r.status]||"bg-slate-300"}`}/>{r.roomNumber} · {r.clientName.split(" ")[0]}</span>)}{list.length>3&&<span className="text-[9px] text-night/40">+{list.length-3}</span>}</div></button>; })}</div>
      </div>
    ) : (
      <div className="overflow-x-auto">
        <table className="w-full min-w-[720px] border-collapse text-[11px]">
          <thead><tr><th className="sticky left-0 z-10 w-28 bg-[#faf9f6] px-3 py-3 text-left">Chambre</th>{days.map((day) => <th key={day} className={`px-2 py-3 text-center ${day===todayISO()?"bg-gold/10 text-gold":"text-night/50"}`}>{new Date(day+"T12:00:00").toLocaleDateString("fr-FR",{weekday:"short",day:"numeric"})}</th>)}</tr></thead>
          <tbody>
            {rooms.map((room) => <tr key={room.id} className="border-t border-night/[.05]">
              <td className="sticky left-0 bg-white px-3 py-2 font-medium">{room.number}<span className="block text-[9px] font-normal text-night/40">{room.type}</span></td>
              {days.map((day) => {
                const occ = data.reservations.find((r) => r.roomId===room.id && !["cancelled","no-show"].includes(r.status) && r.checkIn<=day && r.checkOut>day);
                return <td key={day} className={`px-1 py-1 text-center ${day===todayISO()?"bg-gold/[.05]":""}`}>{occ ? <button onClick={()=>onSelect&&onSelect(occ)} title={`${occ.clientName} · ${occ.status}`} className={`w-full rounded-lg px-1 py-1.5 text-[9px] font-medium text-white transition hover:opacity-80 ${occ.status==="checked-in"?"bg-sky-500":occ.status==="confirmed"?"bg-emerald-500":"bg-amber-400"}`}>{occ.clientName.split(" ")[0]}</button> : <span className="text-night/20">·</span>}</td>;
              })}
            </tr>)}
          </tbody>
        </table>
      </div>
    )}
    <div className="flex flex-wrap gap-3 border-t border-night/[.07] px-4 py-3 text-[10px] text-night/50">
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-400"/> Réservée</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-sky-400"/> Occupée</span>
      <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-400"/> En attente</span>
      <span className="ml-auto">Occupées : vert/bleu · Réservées : ambre · Libres : pointillés</span>
    </div>
  </div>;
}
