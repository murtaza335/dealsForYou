import { formatPrice, type Deal } from "@/lib/deals";

type DealCardProps = {
  deal: Deal;
  onClick?: () => void;
};

export function DealCard({ deal, onClick }: DealCardProps) {
  return (
    <article className="group overflow-hidden rounded-3xl border border-slate-200/80 bg-white/90 shadow-[0_18px_60px_rgba(15,23,42,0.08)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_24px_70px_rgba(15,23,42,0.14)]">
      <button type="button" onClick={onClick} className="block w-full text-left">
        <img
          src={deal.imgUrl}
          alt={deal.title}
          className="h-44 w-full object-cover bg-slate-100 transition duration-300 group-hover:scale-[1.02]"
          loading="lazy"
        />
        <div className="space-y-3 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-brand-700">
            {deal.brandSlug}
          </p>
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-slate-950">{deal.title}</h3>
            <p className="line-clamp-3 text-sm leading-6 text-slate-600">{deal.description}</p>
          </div>
          <p className="text-lg font-bold text-slate-950">{formatPrice(deal.price)}</p>
        </div>
      </button>
    </article>
  );
}