import { formatPrice, TAX_RATE } from "../utils/booking";

export default function PriceSummary({ pricing, dark }) {
  const { pricePerNight, nights, roomsCount = 1, subtotal, taxes, total } = pricing;
  const muted = dark ? "text-white/60" : "text-night/60";
  const line = dark ? "border-white/15" : "border-night/10";
  return (
    <div className="space-y-3 text-sm">
      <div className="flex justify-between"><span className={muted}>Prix par nuit</span><span>{formatPrice(pricePerNight)}</span></div>
      <div className="flex justify-between"><span className={muted}>× Nombre de nuits</span><span>{nights}</span></div>
      {roomsCount > 1 && <div className="flex justify-between"><span className={muted}>× Chambres</span><span>{roomsCount}</span></div>}
      <div className={`flex justify-between border-t pt-3 ${line}`}><span className={muted}>Sous-total</span><span>{formatPrice(subtotal)}</span></div>
      <div className="flex justify-between"><span className={muted}>Taxes ({TAX_RATE * 100} %)</span><span>{formatPrice(taxes)}</span></div>
      <div className={`flex items-baseline justify-between border-t pt-3 ${line}`}><span className="font-medium">Total</span><span className="font-serif text-3xl">{formatPrice(total)}</span></div>
    </div>
  );
}
