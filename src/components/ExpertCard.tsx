import React from 'react';
import { ExpertProfile } from '../types';
import { Star, ShieldCheck, Tag, Sparkles, ArrowRight } from 'lucide-react';

interface ExpertCardProps {
  key?: string | number;
  expert: ExpertProfile;
  onSelect: (id: string) => void | Promise<void>;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}

export default function ExpertCard({ expert, onSelect, onMouseEnter, onMouseLeave }: ExpertCardProps) {
  return (
    <div 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200/80 shadow-xs hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col h-full overflow-hidden group"
    >
      
      {/* Upper Panel background and Avatar with overlay badges */}
      <div className="relative bg-slate-50/50 p-6 pb-4 flex items-start gap-4 border-b border-dashed border-slate-100">
        
        {expert.featured && (
          <span className="absolute top-3 right-3 bg-rose-500 text-[10px] text-white font-mono px-2 py-0.5 rounded-full flex items-center gap-1 font-bold tracking-wider uppercase shadow-xs">
            <Sparkles className="h-3 w-3" /> Featured
          </span>
        )}

        <img
          src={expert.avatarUrl}
          alt={expert.name}
          referrerPolicy="no-referrer"
          className="h-16 w-16 md:h-20 md:w-20 rounded-2xl object-cover shadow-sm bg-slate-100 ring-2 ring-slate-100 group-hover:scale-[1.02] transition-transform duration-300"
        />

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1">
            <h3 className="text-base font-bold text-slate-900 truncate leading-snug group-hover:text-rose-600 transition-colors">
              {expert.name}
            </h3>
            <ShieldCheck className="h-4 w-4 text-emerald-500 fill-emerald-50 shrink-0" title="Identity Verified Expert" />
          </div>

          <p className="text-xs font-medium text-slate-500 mt-1 line-clamp-2 leading-relaxed">
            {expert.title}
          </p>

          {/* Rating Display */}
          <div className="flex items-center gap-1 mt-2 bg-amber-500/5 hover:bg-amber-500/10 transition-colors w-fit px-2 py-0.5 rounded-md">
            <Star className="h-3.5 w-3.5 text-amber-500 fill-amber-400" />
            <span className="text-xs font-bold text-amber-800">
              {expert.averageRating.toFixed(1)}
            </span>
            <span className="text-[10px] text-amber-600/80 font-medium">
              ({expert.totalSessions} completed sessions)
            </span>
          </div>
        </div>
      </div>

      {/* Profile Bio Context */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <p className="text-xs text-slate-600 leading-relaxed font-normal line-clamp-3">
          {expert.bio}
        </p>

        {/* Dynamic skills tag elements */}
        <div className="mt-4">
          <span className="text-[10px] font-mono font-medium tracking-wide uppercase text-slate-400 block mb-2">
            Areas of expertise
          </span>
          <div className="flex flex-wrap gap-1.5">
            {expert.skills.slice(0, 4).map((skill, index) => (
              <span
                key={index}
                className="bg-slate-50 text-slate-600 border border-slate-100 px-2.5 py-1 rounded-lg text-xs font-medium flex items-center gap-1"
              >
                <Tag className="h-2.5 w-2.5 text-slate-400" /> {skill}
              </span>
            ))}
            {expert.skills.length > 4 && (
              <span className="text-[11px] font-mono text-slate-400 font-semibold pl-1">
                +{expert.skills.length - 4} more
              </span>
            )}
          </div>
        </div>

        {/* Pricing tag detail & Booking trigger */}
        <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between">
          <div>
            <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-500 font-medium">
              Consulting Fee
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-xl font-extrabold text-slate-900">
                ₹{expert.pricePer30Min}
              </span>
              <span className="text-xs text-slate-500">
                / 30 min session
              </span>
            </div>
          </div>

          <button
            onClick={() => onSelect(expert.id)}
            className="bg-slate-900 text-white hover:bg-rose-600 text-xs font-semibold px-4 py-2.5 rounded-xl transition-all flex items-center gap-1.5 shadow-sm group-hover:shadow-md cursor-pointer select-none"
          >
            <span>Consult Now</span>
            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
