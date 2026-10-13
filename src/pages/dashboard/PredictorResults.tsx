import { Link } from 'react-router-dom';
import { Crown, Sparkles, AlertTriangle, FileText, IndianRupee, MapPin, Search } from 'lucide-react';
import React, { useState } from 'react';
import { CollegeInfoModal } from '../../components/ui/CollegeInfoModal';

// Interfaces mapping to PredictorResponse
interface PredictorResultsProps {
  aiResponse: any;
  s: any;
  isPremium: boolean;
  domicileState: string;
  targetState?: string | null;
  selectedQuotas?: string[];
  selectedCourse?: string;
  selectedDegree?: string;
}

const getQuotaStyle = (quota: string) => {
  if (!quota) return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
  const q = quota.toLowerCase();
  if (q.includes('management') || q.includes('deemed') || q.includes('nri') || q.includes('private')) {
    return 'bg-pink-500/10 text-pink-500 border-pink-500/20';
  }
  if (q.includes('aiq') || q.includes('all india')) {
    return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
  }
  if (q.includes('state')) {
    return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
  }
  return 'bg-slate-500/10 text-slate-400 border-slate-500/20';
};

const CollegeGroupList = ({ colleges, s, isPremium, maxFreeCount, bgClass, borderClass, isReach, onCollegeClick, candidateRank, candidateScore }: any) => {
  const safeColleges = Array.isArray(colleges) ? colleges : (colleges ? [colleges] : []);
  if (safeColleges.length === 0) return null;
  const displayColleges = [...safeColleges].sort((a, b) => {
    const rankA = parseInt(String(a.closing_rank || '0').replace(/\D/g, '')) || Infinity;
    const rankB = parseInt(String(b.closing_rank || '0').replace(/\D/g, '')) || Infinity;
    if (rankA !== rankB) return rankA - rankB;
    
    // Sort by probability descending if rank is equal or missing
    const probA = parseInt(String(a.probability || '0').replace(/\D/g, '')) || 0;
    const probB = parseInt(String(b.probability || '0').replace(/\D/g, '')) || 0;
    return probB - probA;
  }).slice(0, isPremium ? 1000 : maxFreeCount);

  // First group by course, then by quota
  const groupedByCourse = displayColleges.reduce((acc: any, c: any) => {
    const course = c.course || 'MBBS';
    const q = c.quota || 'Other';
    if (!acc[course]) acc[course] = {};
    if (!acc[course][q]) acc[course][q] = [];
    acc[course][q].push(c);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {Object.entries(groupedByCourse)
        .sort(([a], [b]) => (a === 'MBBS' ? -1 : b === 'MBBS' ? 1 : a.localeCompare(b)))
        .map(([course, quotas]: [string, any]) => {
        const sortedQuotas = Object.keys(quotas).sort((a, b) => {
          if (a === 'AIQ') return -1;
          if (b === 'AIQ') return 1;
          if (a === 'State') return -1;
          if (b === 'State') return 1;
          return a.localeCompare(b);
        });

        return (
          <div key={course} className="space-y-4">
            <h3 className={`text-sm font-black uppercase tracking-wider text-primary border-b-2 border-primary/20 pb-2`}>
              Recommended {course} Colleges
            </h3>
            {sortedQuotas.map((quota) => (
              <div key={quota} className="space-y-3">
                <h4 className={`text-[11px] font-bold uppercase tracking-wider ${s.muted} border-b ${s.dark ? 'border-white/10' : 'border-slate-200'} pb-1.5`}>
                  {quota} Quota
                </h4>
                {quotas[quota].map((c: any, i: number) => (
                  <div key={i} className={`rounded-xl border ${bgClass} ${borderClass} p-4`}>
                    <div className="flex justify-between items-start gap-4 mb-2">
                      <button 
                        onClick={() => onCollegeClick(c)} 
                        className="font-bold text-sm hover:underline decoration-orange-500 underline-offset-4 text-left transition-all hover:text-orange-400"
                      >
                        {c.name}
                      </button>
                      {c.nmc_recognition && (
                        <span className="shrink-0 text-[9px] uppercase font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                          {c.nmc_recognition}
                        </span>
                      )}
                    </div>
                    
                    {!isReach ? (
                      <>
                        <div className="flex flex-wrap gap-2 mb-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${borderClass} bg-white/5 flex items-center gap-1`}>
                            {c.confidence === 'High' ? 'Very Safe' : (c.confidence === 'Moderate' ? 'Moderate' : 'Reach')} <span className="opacity-50">|</span> {c.probability}
                          </span>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                            {c.expected_round}
                          </span>
                          {c.category && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-500 border border-slate-500/20">
                              {c.category}
                            </span>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-2 text-[11px] gap-4 mt-4 p-3 rounded-lg bg-white/5 border border-white/10">
                          <div className="col-span-2 flex justify-between items-center bg-black/20 p-2 rounded">
                            <div className="text-center">
                              <div className={s.muted}>{candidateScore ? 'Your Score (AIR)' : 'Your Rank'}</div>
                              <div className="font-bold text-white">
                                {candidateScore 
                                  ? `${candidateScore} (AIR ${candidateRank > 0 ? candidateRank.toLocaleString('en-IN') : 'N/A'})` 
                                  : (candidateRank > 0 ? `AIR ${candidateRank.toLocaleString('en-IN')}` : 'N/A')
                                }
                              </div>
                            </div>
                            <div className="text-center">
                              <div className={s.muted}>Expected Closing</div>
                              <div className="font-bold text-orange-400">
                                {typeof (c.predicted_closing_rank || c.closing_rank) === 'number' 
                                  ? `AIR ${(c.predicted_closing_rank || c.closing_rank).toLocaleString('en-IN')}` 
                                  : (c.predicted_closing_rank || c.closing_rank)}
                              </div>
                            </div>
                            <div className="text-center">
                              <div className={s.muted}>Safety Margin</div>
                              <div className={`font-bold ${c.margin && String(c.margin).includes('+') ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {c.margin || 'N/A'}
                              </div>
                            </div>
                          </div>
                          
                          <div className="col-span-2 md:col-span-1">
                            <div className="flex justify-between">
                              <span className={s.muted}>Tuition Fee: </span>
                              {c.is_fee_verified ? <span className="text-emerald-400">✔ Verified</span> : <span className="text-yellow-500">⚠ Not Verified</span>}
                            </div>
                            <div className="font-bold">
                              {(c.tuition_fee && c.tuition_fee !== 'N/A') 
                                ? c.tuition_fee 
                                : (c.fees && c.fees !== 'N/A') 
                                  ? c.fees 
                                  : 'Check Govt/State Portal'}
                            </div>
                          </div>
                          
                          <div className="col-span-2 md:col-span-1">
                            <div className="flex justify-between">
                              <span className={s.muted}>Seats: </span>
                              {c.is_seats_verified ? <span className="text-emerald-400">✔ Verified</span> : <span className="text-yellow-500">⚠ Not Verified</span>}
                            </div>
                            <div className="font-bold">{c.seats || 'Data unavailable'}</div>
                          </div>
                          
                          <div className="col-span-2">
                            <div className="flex justify-between">
                              <span className={s.muted}>Bond: </span>
                              {c.is_bond_verified ? <span className="text-emerald-400">✔ Verified</span> : <span className="text-yellow-500">⚠ Not Verified</span>}
                            </div>
                            <div className="font-bold text-rose-400">{c.bond || 'Data unavailable'}</div>
                          </div>
                        </div>

                        {Array.isArray(c.historical_trend) && c.historical_trend.length > 0 && (
                          <div className="mt-4">
                             {/* Modern Glassmorphic Historical Trends Chart */}
                             <div className="mt-5 p-5 rounded-2xl bg-gradient-to-b from-slate-900/60 to-slate-950/80 backdrop-blur-xl border border-white/10 shadow-xl">
                               {/* Header & Legend */}
                               <div className="flex flex-wrap items-center justify-between gap-3 mb-6 pb-3 border-b border-white/10">
                                 <div>
                                   <h5 className="text-xs uppercase tracking-wider font-extrabold text-slate-200 flex items-center gap-1.5">
                                     <span>📈</span> Historical Cutoff Trends
                                   </h5>
                                   <p className="text-[10px] text-slate-400 mt-0.5">
                                     Taller bar = Higher / Better rank (closer to AIR 1)
                                   </p>
                                 </div>
                                 <div className="flex items-center gap-3 text-[10px] font-bold">
                                   {candidateRank > 0 && (
                                     <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-300">
                                       <span className="w-2 h-2 rounded-full bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]"></span>
                                       <span>{candidateScore ? `Score ${candidateScore} (AIR ${candidateRank.toLocaleString('en-IN')})` : `Your Rank (${candidateRank.toLocaleString('en-IN')})`}</span>
                                     </div>
                                   )}
                                   <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-300">
                                     <span className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]"></span>
                                     <span>Closing Cutoff</span>
                                   </div>
                                 </div>
                               </div>

                               {(() => {
                                 const trendData = [...c.historical_trend].sort((a, b) => parseInt(a.year) - parseInt(b.year));
                                 const allRanks = [
                                   candidateRank,
                                   ...trendData.map(x => parseInt(String(x.closing_rank).replace(/\D/g, '')) || 0)
                                 ].filter(v => v > 0);
                                 
                                 const minR = Math.min(...allRanks, 1);
                                 const maxR = Math.max(...allRanks, 100);
                                 const spread = (maxR - minR) + (maxR * 0.25) || 1;

                                 // Lower rank number = Taller bar
                                 const getBarHeight = (r: number) => {
                                   if (!r || r <= 0) return 0;
                                   const normalized = (r - minR) / spread;
                                   return Math.max(18, Math.min(95, 92 - (normalized * 68)));
                                 };

                                 return (
                                   <div className="relative h-56 w-full pt-4 pb-8 flex items-end justify-around gap-2">
                                     {/* Background Grid Lines */}
                                     <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-15">
                                       <div className="w-full border-b border-dashed border-white"></div>
                                       <div className="w-full border-b border-dashed border-white"></div>
                                       <div className="w-full border-b border-dashed border-white"></div>
                                     </div>

                                     {/* Bars Grouped by Year */}
                                     {trendData.map((t, idx) => {
                                        const closeVal = parseInt(String(t.closing_rank).replace(/\D/g, '')) || 0;
                                        const candHeight = getBarHeight(candidateRank);
                                        const closeHeight = getBarHeight(closeVal);

                                        return (
                                          <div key={idx} className="relative flex flex-col justify-end items-center group w-full max-w-[110px] h-full z-10">
                                            
                                            {/* Side by Side Bars */}
                                            <div className="flex items-end justify-center w-full h-full gap-2 sm:gap-3 px-1">
                                              
                                              {/* Candidate Rank Bar */}
                                              {candidateRank > 0 && (
                                                <div className="relative flex flex-col justify-end items-center group/cand w-full max-w-[34px] h-full">
                                                  {/* Badge Value */}
                                                  <div className="absolute -top-7 text-[10px] font-black text-amber-300 bg-amber-950/80 px-1.5 py-0.5 rounded-md border border-amber-500/40 shadow-sm opacity-90 group-hover/cand:opacity-100 group-hover/cand:scale-110 transition-all whitespace-nowrap">
                                                    {candidateScore ? `AIR ${candidateRank.toLocaleString('en-IN')}` : candidateRank.toLocaleString('en-IN')}
                                                  </div>
                                                  {/* Bar Pillar */}
                                                  <div 
                                                    className="w-full bg-gradient-to-t from-amber-600 via-amber-500 to-amber-300 rounded-t-lg shadow-[0_0_15px_rgba(245,158,11,0.35)] group-hover/cand:shadow-[0_0_25px_rgba(245,158,11,0.7)] transition-all duration-500 relative overflow-hidden"
                                                    style={{ height: `${candHeight}%` }}
                                                  >
                                                    <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/cand:opacity-100 transition-opacity"></div>
                                                  </div>
                                                  <span className="absolute -bottom-4 text-[9px] font-bold text-amber-400/90 uppercase tracking-tighter">You</span>
                                                </div>
                                              )}

                                              {/* Closing Cutoff Bar */}
                                              <div className="relative flex flex-col justify-end items-center group/close w-full max-w-[34px] h-full">
                                                {/* Badge Value */}
                                                <div className="absolute -top-7 text-[10px] font-black text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded-md border border-cyan-500/40 shadow-sm opacity-90 group-hover/close:opacity-100 group-hover/close:scale-110 transition-all whitespace-nowrap">
                                                  {t.closing_rank}
                                                </div>
                                                {/* Bar Pillar */}
                                                <div 
                                                  className="w-full bg-gradient-to-t from-blue-600 via-cyan-500 to-cyan-300 rounded-t-lg shadow-[0_0_15px_rgba(6,182,212,0.35)] group-hover/close:shadow-[0_0_25px_rgba(6,182,212,0.7)] transition-all duration-500 relative overflow-hidden"
                                                  style={{ height: `${closeHeight}%` }}
                                                >
                                                  <div className="absolute inset-0 bg-white/20 opacity-0 group-hover/close:opacity-100 transition-opacity"></div>
                                                </div>
                                                <span className="absolute -bottom-4 text-[9px] font-bold text-cyan-400/90 uppercase tracking-tighter">Cutoff</span>
                                              </div>

                                            </div>
                                            
                                            {/* Year Label */}
                                            <div className="absolute -bottom-10 px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] font-bold text-slate-300 group-hover:text-white group-hover:bg-white/10 transition-all">
                                              {t.year}
                                            </div>
                                          </div>
                                        );
                                     })}
                                   </div>
                                 );
                               })()}
                             </div>
                            
                            <div className="overflow-x-auto rounded border border-white/10 hidden md:block">
                              <table className="w-full text-left text-[10px] border-collapse bg-black/10">
                                <thead>
                                  <tr className={`border-b ${s.dark ? 'border-white/10' : 'border-black/10'}`}>
                                    <th className="px-3 py-1.5 font-bold">Year</th>
                                    <th className="px-3 py-1.5 font-bold text-right">Opening</th>
                                    <th className="px-3 py-1.5 font-bold text-right">Closing</th>
                                  </tr>
                                </thead>
                                <tbody>
                                  {c.historical_trend.map((t: any, idx: number) => (
                                    <tr key={idx} className={`border-b last:border-0 ${s.dark ? 'border-white/5' : 'border-black/5'}`}>
                                      <td className="px-3 py-1">{t.year}</td>
                                      <td className="px-3 py-1 text-right opacity-80">{t.opening_rank || '-'}</td>
                                      <td className="px-3 py-1 text-right font-bold text-primary">{t.closing_rank}</td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          </div>
                        )}
                        
                        {Array.isArray(c.data_source) && c.data_source.length > 0 && (
                          <div className="mt-4">
                            <h5 className={`text-[10px] uppercase font-bold mb-2 ${s.muted}`}>Data Source</h5>
                            <div className="flex flex-wrap gap-1.5 text-[9px]">
                              {c.data_source.map((ds: string, idx: number) => (
                                <span key={idx} className={`px-2 py-0.5 rounded bg-white/5 ${ds === 'Verified' ? 'text-emerald-400 font-bold border border-emerald-500/20 bg-emerald-500/10' : 'text-slate-400'}`}>
                                  {ds === 'Verified' ? '✓ Verified' : ds}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className={`mt-4 p-3 rounded bg-blue-500/5 border border-blue-500/10`}>
                          <p className={`text-[11px] leading-relaxed italic ${s.muted}`}>💡 {c.reason}</p>
                        </div>
                      </>
                    ) : (
                      <div className="grid grid-cols-2 text-xs gap-2 mt-2">
                        <div>
                          <span className={s.muted}>Expected Closing: </span>
                          <span className="font-bold text-orange-500">{c.predicted_closing_rank || c.closing_rank}</span>
                        </div>
                        <div>
                          <span className={s.muted}>Round: </span>
                          <span className="font-bold">{c.expected_round}</span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
};

export function PredictorResults({
  aiResponse,
  s,
  isPremium,
  domicileState,
  targetState,
  selectedQuotas,
  selectedCourse,
  selectedDegree,
}: PredictorResultsProps) {
  const [selectedCollegeInfo, setSelectedCollegeInfo] = useState<any | null>(null);
  const [expandedScholarship, setExpandedScholarship] = useState<number | string | null>(null);

  if (!aiResponse) return null;

  const candidateRank = aiResponse.query?.score_or_rank?.value || 0;
  const candidateScore = aiResponse.query?.score_or_rank?.original_score || null;

  // Map legacy/fallback colleges format to college_predictions if missing
  const preds = aiResponse.college_predictions || (() => {
    if (!aiResponse.colleges || !Array.isArray(aiResponse.colleges)) return null;
    const mapCollege = (c: any) => ({
      name: c.college_name,
      probability: c.chance_tier,
      expected_round: c.closing_rank_reference?.[0]?.round || 'Round 1',
      fees: (c.fee?.formatted && c.fee?.formatted !== 'N/A') ? c.fee.formatted : 'Check Govt/State Portal',
      quota: c.quota,
      closing_rank: c.closing_rank_reference?.[0]?.rank || c.closing_rank || 'N/A',
      reason: 'Based on historical cutoffs',
    });
    return {
      safe: aiResponse.colleges.filter((c: any) => c.chance_tier === 'High').map(mapCollege),
      moderate: aiResponse.colleges.filter((c: any) => c.chance_tier === 'Moderate').map(mapCollege),
      reach: aiResponse.colleges.filter((c: any) => c.chance_tier === 'Reach').map(mapCollege),
    };
  })();

  // Defensive mapping for scholarships_analysis if scholarships array exists in response
  const scholarshipsAnalysis = aiResponse.scholarships_analysis || (() => {
    if (aiResponse.scholarships && Array.isArray(aiResponse.scholarships)) {
      return {
        eligible: aiResponse.scholarships.map((sch: any) => ({
          name: sch.name,
          provider: sch.provider,
          amount: sch.amount || sch.estimated_amount || sch.amount_description || 'Check Portal',
          match_reason: sch.match_reason || 'Eligible based on NEET qualifying & category merit',
          eligibility: typeof sch.eligibility === 'object' ? JSON.stringify(sch.eligibility) : (sch.eligibility || 'Check portal for criteria'),
          portal: sch.official_portal || sch.portal || 'https://scholarships.gov.in'
        })),
        ineligible: []
      };
    }
    return null;
  })();

  return (
    <div className="space-y-6">
      
      {/* ── Summary Strip ── */}
      <div className={`rounded-2xl border p-4 ${s.card}`}>
        <div className="flex items-center justify-between flex-wrap gap-3">
          <p className="font-bold text-sm">
            MBBS WALA AI Analysis Complete
            {aiResponse.meta?.authority && (
              <span className={`ml-2 text-xs font-semibold ${s.muted}`}>
                via {aiResponse.meta.authority}
              </span>
            )}
          </p>
          {aiResponse._provider_used && aiResponse._provider_used !== 'legacy-fallback' && (
            <p className={`text-[10px] font-medium mt-0.5 ${s.muted}`}>
              Powered by MBBS WALA AI · {aiResponse._response_time_ms || 0}ms
            </p>
          )}
        </div>
      </div>

      {/* ── Active Filter Context Banner ── */}
      {(targetState || (selectedQuotas && selectedQuotas.length > 0)) && (
        <div className={`rounded-2xl border p-3 flex flex-wrap gap-2 items-center ${s.dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className={`text-xs font-bold ${s.muted}`}>Active Filters:</span>
          {selectedQuotas && selectedQuotas.map((q) => (
            <span key={q} className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {q === 'AIQ' ? '🇮🇳 AIQ — All India' : q === 'State' ? `📍 State Quota (${domicileState || 'Domicile'})` : q}
            </span>
          ))}
          {targetState && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
              🎯 Target: {targetState} only
            </span>
          )}
          {!targetState && selectedQuotas?.includes('AIQ') && !selectedQuotas?.includes('State') && (
            <span className="text-[10px] font-semibold text-emerald-400">
              Showing colleges across All India
            </span>
          )}
        </div>
      )}

      {/* ── Admission Summary ── */}
      {aiResponse.admission_summary && (
        <div className={`rounded-2xl border ${s.card} overflow-hidden`}>
          {/* Header */}
          <div className="bg-gradient-to-r from-primary/20 to-emerald-500/10 px-5 pt-5 pb-4 border-b border-white/10">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🎯</span>
              <h3 className="font-black text-sm uppercase tracking-wider">Admission Summary</h3>
            </div>
            {/* Top 3 KPIs */}
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-primary/10 rounded-xl p-3 border border-primary/20">
                <p className="text-[10px] uppercase font-bold text-primary mb-1">Status</p>
                <p className="text-sm font-black text-primary leading-tight">{aiResponse.admission_summary.status}</p>
              </div>
              <div className={`${s.dark ? 'bg-emerald-900/20' : 'bg-emerald-50'} rounded-xl p-3 border border-emerald-500/20`}>
                <p className="text-[10px] uppercase font-bold text-emerald-500 mb-1">Admission Probability</p>
                <p className="text-sm font-black text-emerald-500">{aiResponse.admission_summary.expected_probability}</p>
              </div>
              <div className={`${s.dark ? 'bg-blue-900/20' : 'bg-blue-50'} rounded-xl p-3 border border-blue-500/20`}>
                <p className="text-[10px] uppercase font-bold text-blue-400 mb-1">Data Reliability</p>
                <p className="text-sm font-black text-blue-400">{aiResponse.admission_summary.data_reliability || 'High'}</p>
              </div>
            </div>
          </div>

          <div className="p-5 space-y-5">
            {/* Overview explanation */}
            <p className={`text-sm leading-relaxed ${s.muted}`}>
              {aiResponse.admission_summary.explanation}
            </p>

            {/* Counselling Strategy */}
            {aiResponse.counselling_strategy && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📋</span>
                  <h4 className="font-black text-xs uppercase tracking-wider">Counselling Round Strategy</h4>
                </div>
                <div className="space-y-2">
                  {[
                    { key: 'round_1',         label: 'Round 1',         icon: '1️⃣', color: 'emerald' },
                    { key: 'round_2',         label: 'Round 2',         icon: '2️⃣', color: 'blue' },
                    { key: 'round_3',         label: 'Round 3',         icon: '3️⃣', color: 'amber' },
                    { key: 'stray_vacancy',   label: 'Stray Vacancy Round', icon: '🔄', color: 'purple' },
                    { key: 'state_counselling', label: 'State Counselling',  icon: '📍', color: 'rose' },
                  ]
                    .filter(({ key }) => aiResponse.counselling_strategy[key])
                    .map(({ key, label, icon, color }) => (
                      <div key={key} className={`rounded-xl p-3 border ${
                        color === 'emerald' ? (s.dark ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') :
                        color === 'blue'    ? (s.dark ? 'bg-blue-900/10 border-blue-500/20'       : 'bg-blue-50 border-blue-200') :
                        color === 'amber'   ? (s.dark ? 'bg-amber-900/10 border-amber-500/20'     : 'bg-amber-50 border-amber-200') :
                        color === 'purple'  ? (s.dark ? 'bg-purple-900/10 border-purple-500/20'   : 'bg-purple-50 border-purple-200') :
                                              (s.dark ? 'bg-rose-900/10 border-rose-500/20'       : 'bg-rose-50 border-rose-200')
                      }`}>
                        <p className={`text-[10px] font-black uppercase mb-1 ${
                          color === 'emerald' ? 'text-emerald-500' :
                          color === 'blue'    ? 'text-blue-400' :
                          color === 'amber'   ? 'text-amber-500' :
                          color === 'purple'  ? 'text-purple-400' : 'text-rose-400'
                        }`}>{icon} {label}</p>
                        <p className={`text-xs leading-relaxed ${s.muted}`}>{aiResponse.counselling_strategy[key]}</p>
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Quota-wise Analysis */}
            {aiResponse.quota_wise_analysis && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">⚖️</span>
                  <h4 className="font-black text-xs uppercase tracking-wider">Quota-wise Analysis</h4>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {[
                    { key: 'aiq',              label: 'All India Quota (AIQ — 15%)', icon: '🇮🇳', body: aiResponse.quota_wise_analysis.aiq },
                    { key: 'state_quota',      label: 'State Quota (85%)',           icon: '📍', body: aiResponse.quota_wise_analysis.state_quota },
                    { key: 'management_quota', label: 'Management Quota',            icon: '🏛️', body: aiResponse.quota_wise_analysis.management_quota },
                    { key: 'deemed_universities', label: 'Deemed Universities',      icon: '🎓', body: aiResponse.quota_wise_analysis.deemed_universities },
                  ]
                    .filter(({ body }) => body)
                    .map(({ key, label, icon, body }) => (
                      <div key={key} className={`rounded-xl p-3 border ${s.dark ? 'bg-white/3 border-white/10' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start gap-2 mb-1">
                          <span className="text-sm mt-0.5">{icon}</span>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase mb-0.5">{label}</p>
                            {body.counselling_authority && (
                              <p className="text-[10px] text-primary font-bold mb-1">Counselling: {body.counselling_authority}</p>
                            )}
                            {'eligible' in body && (
                              <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                                body.eligible ? 'bg-emerald-500/15 text-emerald-500' : 'bg-rose-500/15 text-rose-400'
                              }`}>
                                {body.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                              </span>
                            )}
                            {body.total_colleges_found != null && (
                              <span className="ml-1 text-[9px] font-bold text-blue-400 bg-blue-400/10 px-1.5 py-0.5 rounded-full">
                                {body.total_colleges_found} colleges
                              </span>
                            )}
                          </div>
                        </div>
                        <p className={`text-[11px] leading-relaxed ${s.muted} mt-1`}>{body.explanation}</p>
                        {body.top_colleges && body.top_colleges.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {body.top_colleges.slice(0, 3).map((c: string, i: number) => (
                              <span key={i} className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full ${s.dark ? 'bg-white/8 text-white/70' : 'bg-slate-200 text-slate-600'}`}>{c}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  }
                </div>
              </div>
            )}

            {/* Fee Comparison */}
            {aiResponse.fee_comparison && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">💰</span>
                  <h4 className="font-black text-xs uppercase tracking-wider">Fee Comparison (Per Year)</h4>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { label: 'Government',  value: aiResponse.fee_comparison.government,  color: 'emerald' },
                    { label: 'Private',     value: aiResponse.fee_comparison.private,      color: 'amber' },
                    { label: 'Management',  value: aiResponse.fee_comparison.management,   color: 'orange' },
                    { label: 'NRI Quota',   value: aiResponse.fee_comparison.nri,          color: 'purple' },
                  ].filter(f => f.value).map(({ label, value, color }) => (
                    <div key={label} className={`rounded-xl p-3 border text-center ${
                      color === 'emerald' ? (s.dark ? 'bg-emerald-900/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200') :
                      color === 'amber'   ? (s.dark ? 'bg-amber-900/10 border-amber-500/20'     : 'bg-amber-50 border-amber-200') :
                      color === 'orange'  ? (s.dark ? 'bg-orange-900/10 border-orange-500/20'   : 'bg-orange-50 border-orange-200') :
                                            (s.dark ? 'bg-purple-900/10 border-purple-500/20'   : 'bg-purple-50 border-purple-200')
                    }`}>
                      <p className={`text-[9px] font-black uppercase mb-1 ${
                        color === 'emerald' ? 'text-emerald-500' : color === 'amber' ? 'text-amber-500' :
                        color === 'orange'  ? 'text-orange-500' : 'text-purple-400'
                      }`}>{label}</p>
                      <p className="text-xs font-black">{value}</p>
                    </div>
                  ))}
                </div>
                {aiResponse.fee_comparison.total_course_cost && (
                  <p className={`text-[11px] mt-2 font-semibold ${s.muted}`}>
                    📊 Total MBBS Course Cost (4.5 yrs): <span className="font-black text-primary">{aiResponse.fee_comparison.total_course_cost}</span>
                  </p>
                )}
              </div>
            )}

            {/* Documents Required */}
            {aiResponse.documents_required && aiResponse.documents_required.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📄</span>
                  <h4 className="font-black text-xs uppercase tracking-wider">Documents Required for Counselling</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {aiResponse.documents_required.map((doc: string, i: number) => (
                    <span key={i} className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border ${
                      s.dark ? 'bg-white/5 border-white/15 text-white/70' : 'bg-slate-100 border-slate-300 text-slate-600'
                    }`}>
                      ✅ {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Safe Colleges ── */}
      {preds?.safe && preds.safe.length > 0 && (
        <div className={`rounded-2xl border p-5 ${s.card} border-l-4 border-l-emerald-500/60`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">✅</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Safe Colleges (High Chance)</h3>
          </div>
          <CollegeGroupList 
            colleges={preds?.safe || []} 
            s={s} isPremium={isPremium} maxFreeCount={15}
            bgClass={s.dark ? 'bg-emerald-900/10' : 'bg-emerald-50'} 
            borderClass="border-emerald-500/30" 
            isReach={false}
            onCollegeClick={setSelectedCollegeInfo}
            candidateRank={candidateRank}
            candidateScore={candidateScore}
          />
          
          {!isPremium && (preds?.safe?.length || 0) > 15 && (
             <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
               <Crown className="w-5 h-5 text-primary mx-auto mb-2" />
               <p className="text-xs font-bold mb-2">Upgrade to Premium to view {(preds?.safe?.length || 0) - 15} more Safe colleges.</p>
               <Link to="/dashboard/subscription" className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-full font-bold inline-block">Upgrade Now</Link>
             </div>
          )}
        </div>
      )}

      {/* ── Moderate Colleges ── */}
      {preds?.moderate && preds.moderate.length > 0 && (
        <div className={`rounded-2xl border p-5 ${s.card} border-l-4 border-l-amber-500/60`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">⚡</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Moderate Chance Colleges (Round 2 / 3 Options)</h3>
          </div>
          <CollegeGroupList 
            colleges={preds?.moderate || []} 
            s={s} isPremium={isPremium} maxFreeCount={10}
            bgClass={s.dark ? 'bg-amber-900/10' : 'bg-amber-50'} 
            borderClass="border-amber-500/30" 
            isReach={false}
            onCollegeClick={setSelectedCollegeInfo}
            candidateRank={candidateRank}
            candidateScore={candidateScore}
          />
          
          {!isPremium && (preds?.moderate?.length || 0) > 10 && (
             <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
               <Crown className="w-5 h-5 text-primary mx-auto mb-2" />
               <p className="text-xs font-bold mb-2">Upgrade to Premium to view {(preds?.moderate?.length || 0) - 10} more Moderate colleges.</p>
               <Link to="/dashboard/subscription" className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-full font-bold inline-block">Upgrade Now</Link>
             </div>
          )}
        </div>
      )}

      {/* ── Reach Colleges ── */}
      {preds?.reach && preds.reach.length > 0 && (
        <div className={`rounded-2xl border p-5 ${s.card} border-l-4 border-l-purple-500/60`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎯</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Reach Colleges (Aspirational / Dream Options)</h3>
          </div>
          <CollegeGroupList 
            colleges={preds?.reach || []} 
            s={s} isPremium={isPremium} maxFreeCount={8}
            bgClass={s.dark ? 'bg-purple-900/10' : 'bg-purple-50'} 
            borderClass="border-purple-500/30" 
            isReach={false}
            onCollegeClick={setSelectedCollegeInfo}
            candidateRank={candidateRank}
            candidateScore={candidateScore}
          />
          
          {!isPremium && (preds?.reach?.length || 0) > 8 && (
             <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
               <Crown className="w-5 h-5 text-primary mx-auto mb-2" />
               <p className="text-xs font-bold mb-2">Upgrade to Premium to view {(preds?.reach?.length || 0) - 8} more Reach colleges.</p>
               <Link to="/dashboard/subscription" className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-full font-bold inline-block">Upgrade Now</Link>
             </div>
          )}
        </div>
      )}

      {(!preds?.safe || preds.safe.length === 0) && (!preds?.moderate || preds.moderate.length === 0) && (!preds?.reach || preds.reach.length === 0) && (
        <div className={`rounded-2xl border p-5 ${s.card} border-l-4 border-l-rose-500/60`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <h3 className="font-black text-sm uppercase tracking-wider text-rose-400">
              No Matching Colleges Found
            </h3>
          </div>
          <p className={`text-sm ${s.muted} leading-relaxed`}>
            Based on your selected filters (quota, state, category, round), we could not find any matching colleges in our database. Try changing your target state, selecting a different quota, or broadening your search.
          </p>
        </div>
      )}



      {/* ── Unlikely MBBS Guidance ── */}
      {aiResponse.unlikely_mbbs_guidance?.active && (
        <div className={`rounded-2xl border p-5 ${s.card}`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">❌</span>
            <h3 className="font-black text-sm uppercase tracking-wider text-red-500">MBBS Admission Guidance</h3>
          </div>
          {isPremium ? (
            <>
              <p className="text-sm font-semibold mb-4 leading-relaxed">{aiResponse.unlikely_mbbs_guidance.message}</p>
              
              {aiResponse.unlikely_mbbs_guidance.private_options?.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase text-primary">Suggested Private Options</h4>
                  {(aiResponse.unlikely_mbbs_guidance?.private_options || []).map((opt: any, i: number) => (
                    <div key={i} className={`rounded-xl border p-3 ${s.dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} text-sm flex justify-between items-center`}>
                      <div>
                        <p className="font-bold">{opt.name}</p>
                        <p className={`text-[10px] mt-0.5 ${s.muted}`}>{opt.state} · {opt.rounds}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-500">{opt.probability}</p>
                        <p className={`text-[10px] mt-0.5 ${s.muted}`}>{opt.fees}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 text-center">
               <Crown className="w-5 h-5 text-primary mx-auto mb-2" />
               <p className="text-xs font-bold mb-2">Upgrade to Premium to view detailed admission guidance and private options.</p>
               <Link to="/dashboard/subscription" className="text-[10px] bg-primary text-white px-3 py-1.5 rounded-full font-bold inline-block">Upgrade Now</Link>
             </div>
          )}
        </div>
      )}
      
      {/* ── Management Quota ── */}
      {aiResponse.management_quota_opportunities && aiResponse.management_quota_opportunities.length > 0 ? (
        <div className={`rounded-2xl border p-5 ${s.card}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🏛️</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Management Quota Opportunities</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b ${s.dark ? 'border-white/10' : 'border-slate-200'}`}>
                  <th className="pb-2 font-bold">College</th>
                  <th className="pb-2 font-bold">Rank Req.</th>
                  <th className="pb-2 font-bold">Tuition Fee</th>
                  <th className="pb-2 font-bold">Total Cost</th>
                  <th className="pb-2 font-bold">Chances</th>
                </tr>
              </thead>
              <tbody>
                {(isPremium ? aiResponse.management_quota_opportunities : aiResponse.management_quota_opportunities.slice(0, 2)).map((mq: any, i: number) => (
                  <tr key={i} className={`border-b ${s.dark ? 'border-white/5' : 'border-slate-100'}`}>
                    <td className="py-2 font-semibold pr-4">
                      <button 
                        onClick={() => setSelectedCollegeInfo(mq)} 
                        className="font-bold text-[11px] sm:text-xs text-left hover:underline decoration-amber-500 underline-offset-2 transition-all"
                      >
                        {mq.college}
                      </button>
                    </td>
                    <td className="py-2 pr-4">{mq.expected_rank}</td>
                    <td className="py-2 pr-4">{mq.approx_fees}</td>
                    <td className="py-2 pr-4 font-bold text-amber-500">{mq.total_cost}</td>
                    <td className="py-2">
                      <span className="px-2 py-1 rounded bg-primary/10 text-primary font-bold">{mq.chances}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!isPremium && aiResponse.management_quota_opportunities.length > 2 && (
            <div className="mt-3 p-3 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold flex items-center gap-1.5"><Crown className="w-4 h-4 text-primary" /> {aiResponse.management_quota_opportunities.length - 2} more private management seats available</p>
              <Link to="/dashboard/subscription" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90">Unlock All</Link>
            </div>
          )}
        </div>
      ) : (() => {
        const qa = aiResponse.quota_availability;
        const stateName = qa?.target_state || 'your selected state';
        
        // Find the management quota note from the engine
        const mgmtNote = qa?.selected_quota_notes?.find((n: any) => n.quota?.toLowerCase() === 'management');
        const mgmtAvailable = mgmtNote?.available ?? qa?.management_quota_available;
        const stateRules = qa?.target_state_rules;
        
        return (
          <div className={`rounded-2xl border p-5 ${s.card} border-l-4 ${mgmtAvailable === false ? 'border-l-amber-500/60' : 'border-l-slate-500/60'}`}>
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">{mgmtAvailable === false ? '🚫' : '🏛️'}</span>
              <h3 className="font-black text-sm uppercase tracking-wider">
                {mgmtAvailable === false 
                  ? `Management Quota Not Available in ${stateName}`
                  : 'Management Quota — No Data Found'
                }
              </h3>
            </div>
            
            {mgmtAvailable === false ? (
              <div className="space-y-3">
                <p className={`text-sm ${s.muted} leading-relaxed`}>
                  {mgmtNote?.note || `Management Quota does not operate as a separate admission category in ${stateName}. Private college seats are filled through the state counselling process.`}
                </p>
                {stateRules && (
                  <div className={`rounded-xl p-3 text-xs space-y-2 ${s.dark ? 'bg-white/5' : 'bg-slate-50'}`}>
                    <p className="font-bold text-primary">📋 {stateName} Admission Routes</p>
                    {stateRules.government?.aiq?.available && (
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✅</span>
                        <div>
                          <span className="font-semibold">AIQ (15% All India Quota)</span>
                          <span className={`ml-1 ${s.muted}`}>— No domicile restriction · {stateRules.government.aiq.counselling}</span>
                        </div>
                      </div>
                    )}
                    {stateRules.government?.state_quota?.available && (
                      <div className="flex items-start gap-2">
                        <span className="text-emerald-400 mt-0.5">✅</span>
                        <div>
                          <span className="font-semibold">Government State Quota (85%)</span>
                          <span className={`ml-1 ${s.muted}`}>— {stateRules.government.state_quota.domicile_required ? `${stateName} domicile required` : 'Open'} · {stateRules.government.state_quota.counselling}</span>
                        </div>
                      </div>
                    )}
                    {stateRules.private?.nri?.available && (
                      <div className="flex items-start gap-2">
                        <span className="text-blue-400 mt-0.5">ℹ️</span>
                        <div>
                          <span className="font-semibold">NRI Quota</span>
                          <span className={`ml-1 ${s.muted}`}>— NRI/PIO/OCI status or NRI sponsor required</span>
                        </div>
                      </div>
                    )}
                    {stateRules.counselling_authority && (
                      <p className={`pt-1 ${s.muted}`}>State counselling authority: <span className="font-semibold text-primary">{stateRules.counselling_authority}</span></p>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <p className={`text-sm ${s.muted} leading-relaxed`}>
                {mgmtNote?.note || `No Management Quota colleges were found for ${stateName} with your selected filters. Try selecting a different target state, or use AIQ or State Quota to see government college options.`}
              </p>
            )}
          </div>
        );
      })()}

      {/* ── Quota-Wise Analysis (from AI) ── */}
      {aiResponse.quota_wise_analysis && (
        <div className={`rounded-2xl border p-5 ${s.card}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📊</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Quota-Wise Eligibility Analysis</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* AIQ */}
            {aiResponse.quota_wise_analysis.aiq && (
              <div className={`p-3 rounded-xl border ${s.dark ? 'border-blue-500/20 bg-blue-500/5' : 'border-blue-200 bg-blue-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aiResponse.quota_wise_analysis.aiq.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {aiResponse.quota_wise_analysis.aiq.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">AIQ (15% All India)</h4>
                <p className={`text-[11px] ${s.muted} leading-relaxed`}>{aiResponse.quota_wise_analysis.aiq.explanation}</p>
                {aiResponse.quota_wise_analysis.aiq.total_colleges_found > 0 && (
                  <p className="text-[11px] font-semibold mt-1 text-primary">{aiResponse.quota_wise_analysis.aiq.total_colleges_found} colleges found</p>
                )}
              </div>
            )}
            {/* State Quota */}
            {aiResponse.quota_wise_analysis.state_quota && (
              <div className={`p-3 rounded-xl border ${s.dark ? 'border-purple-500/20 bg-purple-500/5' : 'border-purple-200 bg-purple-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aiResponse.quota_wise_analysis.state_quota.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {aiResponse.quota_wise_analysis.state_quota.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">State Quota (85%)</h4>
                <p className={`text-[11px] ${s.muted} leading-relaxed`}>{aiResponse.quota_wise_analysis.state_quota.explanation}</p>
                {aiResponse.quota_wise_analysis.state_quota.counselling_authority && (
                  <p className="text-[11px] font-semibold mt-1">Authority: {aiResponse.quota_wise_analysis.state_quota.counselling_authority}</p>
                )}
              </div>
            )}
            {/* Management Quota */}
            {aiResponse.quota_wise_analysis.management_quota && (
              <div className={`p-3 rounded-xl border ${s.dark ? 'border-pink-500/20 bg-pink-500/5' : 'border-pink-200 bg-pink-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aiResponse.quota_wise_analysis.management_quota.available_in_state === false ? 'bg-amber-500/20 text-amber-400' : aiResponse.quota_wise_analysis.management_quota.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {aiResponse.quota_wise_analysis.management_quota.available_in_state === false ? '🚫 Not Available' : aiResponse.quota_wise_analysis.management_quota.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">Management Quota</h4>
                <p className={`text-[11px] ${s.muted} leading-relaxed`}>{aiResponse.quota_wise_analysis.management_quota.explanation}</p>
                {aiResponse.quota_wise_analysis.management_quota.note && (
                  <p className="text-[11px] text-amber-400 mt-1">⚠️ {aiResponse.quota_wise_analysis.management_quota.note}</p>
                )}
              </div>
            )}
            {/* NRI Quota */}
            {aiResponse.quota_wise_analysis.nri_quota && (
              <div className={`p-3 rounded-xl border ${s.dark ? 'border-cyan-500/20 bg-cyan-500/5' : 'border-cyan-200 bg-cyan-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aiResponse.quota_wise_analysis.nri_quota.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-500/20 text-slate-400'}`}>
                    {aiResponse.quota_wise_analysis.nri_quota.eligible ? '✅ Eligible' : 'ℹ️ Requires NRI Status'}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">NRI Quota</h4>
                <p className={`text-[11px] ${s.muted} leading-relaxed`}>{aiResponse.quota_wise_analysis.nri_quota.explanation}</p>
              </div>
            )}
            {/* Deemed Universities */}
            {aiResponse.quota_wise_analysis.deemed_universities && (
              <div className={`p-3 rounded-xl border ${s.dark ? 'border-amber-500/20 bg-amber-500/5' : 'border-amber-200 bg-amber-50'}`}>
                <div className="flex items-center gap-2 mb-2">
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${aiResponse.quota_wise_analysis.deemed_universities.eligible ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                    {aiResponse.quota_wise_analysis.deemed_universities.eligible ? '✅ Eligible' : '❌ Not Eligible'}
                  </span>
                </div>
                <h4 className="font-bold text-sm mb-1">Deemed Universities</h4>
                <p className={`text-[11px] ${s.muted} leading-relaxed`}>{aiResponse.quota_wise_analysis.deemed_universities.explanation}</p>
                {aiResponse.quota_wise_analysis.deemed_universities.top_colleges?.length > 0 && (
                  <div className="mt-1">
                    <p className="text-[10px] font-bold uppercase">Top Options:</p>
                    <p className={`text-[11px] ${s.muted}`}>{aiResponse.quota_wise_analysis.deemed_universities.top_colleges.slice(0, 5).join(', ')}</p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Alternative Courses ── */}
      {aiResponse.alternative_courses && aiResponse.alternative_courses.length > 0 && (
        <div className={`rounded-2xl border p-5 ${s.card}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🦷</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Alternative Medical Courses</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {(isPremium ? aiResponse.alternative_courses : aiResponse.alternative_courses.slice(0, 2)).map((alt: any, i: number) => (
              <div key={i} className={`p-4 rounded-xl border ${s.dark ? 'border-white/10 bg-white/5' : 'border-slate-200 bg-slate-50'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-black text-lg text-primary">{alt.course}</h4>
                  <span className="text-[10px] font-bold px-2 py-1 bg-primary/10 text-primary rounded-full">{alt.admission_chances} Chance</span>
                </div>
                <p className="text-xs mb-1"><span className="font-semibold">Scope:</span> {alt.career_scope}</p>
                <p className="text-xs mb-1"><span className="font-semibold">Avg Salary:</span> {alt.average_salary}</p>
                {alt.higher_studies && (
                  <p className="text-xs mb-1"><span className="font-semibold">Higher Studies:</span> {alt.higher_studies}</p>
                )}
                <div className="mt-3">
                  <p className="text-[10px] font-bold uppercase mb-1">Top Recommended Colleges</p>
                  <ul className="text-xs list-disc pl-4 space-y-1">
                    {(Array.isArray(alt.top_colleges) ? alt.top_colleges : [alt.top_colleges].filter(Boolean)).map((tc: string, j: number) => <li key={j}>{tc}</li>)}
                  </ul>
                </div>
              </div>
            ))}
          </div>
          {!isPremium && aiResponse.alternative_courses.length > 2 && (
            <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold flex items-center gap-1.5"><Crown className="w-4 h-4 text-primary" /> {aiResponse.alternative_courses.length - 2} more alternative degree options (BHMS, BUMS) available in Premium</p>
              <Link to="/dashboard/subscription" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90">Unlock All Courses</Link>
            </div>
          )}
        </div>
      )}

      {/* ── Scholarships ── */}
      {scholarshipsAnalysis && (
        <div className={`rounded-2xl border p-5 ${s.card}`}>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">🎓</span>
            <h3 className="font-black text-sm uppercase tracking-wider">Scholarship Analysis</h3>
          </div>
          <div className="space-y-6">
            
            {/* Eligible Scholarships */}
            {scholarshipsAnalysis.eligible && scholarshipsAnalysis.eligible.length > 0 ? (
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-emerald-500 mb-3 flex items-center gap-2">
                  <Sparkles className="w-4 h-4" /> You Are Eligible For
                </h4>
                <div className="space-y-3">
                  {(isPremium ? scholarshipsAnalysis.eligible : scholarshipsAnalysis.eligible.slice(0, 2)).map((sch: any, i: number) => {
                    const isExpanded = expandedScholarship === `elig-${i}`;
                    return (
                      <div key={`elig-${i}`} className={`rounded-xl border transition-all ${s.dark ? 'bg-white/5 border-white/10' : 'bg-slate-50 border-slate-200'} overflow-hidden`}>
                        <button 
                          onClick={() => setExpandedScholarship(isExpanded ? null : `elig-${i}`)}
                          className="w-full p-4 flex items-start text-left justify-between hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                        >
                          <div>
                            <h4 className="text-sm font-black text-primary leading-tight mb-1">{sch.name}</h4>
                            <div className="flex items-center gap-2 flex-wrap">
                              {sch.provider && (
                                <span className="text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                                  {sch.provider}
                                </span>
                              )}
                              {(sch.amount || sch.estimated_amount) && (
                                <span className="text-[10px] font-bold text-emerald-500">{sch.amount || sch.estimated_amount}</span>
                              )}
                            </div>
                          </div>
                          <span className="text-primary opacity-60 text-xl font-light ml-4">
                            {isExpanded ? '−' : '+'}
                          </span>
                        </button>
                        
                        {isExpanded && (
                          <div className="p-4 pt-0 border-t border-black/5 dark:border-white/5 mt-2 space-y-3">
                            {sch.match_reason && (
                              <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
                                <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400">✓ {sch.match_reason}</p>
                              </div>
                            )}
                            <div>
                              <p className="text-[10px] uppercase font-bold opacity-60 mb-1">Eligibility Criteria</p>
                              <p className={`text-xs ${s.muted}`}>{sch.eligibility || 'Refer to official portal for detailed criteria.'}</p>
                            </div>
                            {(sch.portal || sch.official_portal) && (
                              <div className="pt-2">
                                <a 
                                  href={sch.portal || sch.official_portal} 
                                  target="_blank" 
                                  rel="noopener noreferrer" 
                                  className="inline-flex items-center justify-center w-full sm:w-auto px-4 py-2 rounded-lg bg-primary text-white text-xs font-bold hover:opacity-90 transition-opacity"
                                >
                                  Apply on Official Portal <span className="ml-1">→</span>
                                </a>
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl border border-dashed border-primary/30 bg-primary/5">
                <p className="text-xs opacity-80">Based on your current profile, we didn't find specific matches, but you can explore general scholarships below.</p>
              </div>
            )}

            {!isPremium && scholarshipsAnalysis.eligible.length > 2 && (
              <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-2">
                <p className="text-xs font-bold flex items-center gap-1.5"><Crown className="w-4 h-4 text-primary" /> {scholarshipsAnalysis.eligible.length - 2} more scholarships unlocked with Premium</p>
                <Link to="/dashboard/subscription" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90">Unlock All Scholarships</Link>
              </div>
            )}

            {/* Ineligible Scholarships */}
            {scholarshipsAnalysis.ineligible && scholarshipsAnalysis.ineligible.length > 0 && (
              <div className="pt-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Other Available Scholarships (Not Eligible)</h4>
                <div className="space-y-2 opacity-75">
                  {(isPremium ? scholarshipsAnalysis.ineligible : scholarshipsAnalysis.ineligible.slice(0, 2)).map((sch: any, i: number) => {
                    const isExpanded = expandedScholarship === `inelig-${i}`;
                    return (
                      <div key={`inelig-${i}`} className={`rounded-xl border ${s.dark ? 'bg-white/5 border-white/5' : 'bg-slate-100 border-slate-200'} overflow-hidden`}>
                        <button 
                          onClick={() => setExpandedScholarship(isExpanded ? null : `inelig-${i}`)}
                          className="w-full p-3 flex items-center justify-between text-left hover:bg-black/5 dark:hover:bg-white/5"
                        >
                          <span className="text-xs font-semibold">{sch.name}</span>
                          <span className="text-xs opacity-50 ml-2">{isExpanded ? '▼' : '▶'}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-3 pt-0 text-xs">
                            <p className="text-red-500 mb-2 font-medium">✗ {sch.rejection_reason}</p>
                            {(sch.portal || sch.official_portal) && (
                              <a href={sch.portal || sch.official_portal} target="_blank" rel="noopener noreferrer" className="text-[10px] text-blue-500 hover:underline">
                                View Details
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
          </div>
        </div>
      )}

      {/* ── AI Recommendation ── */}
      {aiResponse.ai_recommendation && (
        <div className={`rounded-2xl border p-5 ${s.card} border-l-4 border-l-primary/60`}>
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">🤖</span>
            <h3 className="font-black text-sm uppercase tracking-wider">AI Recommendation</h3>
          </div>
          <div className="text-sm leading-relaxed mb-4">
            {typeof aiResponse.ai_recommendation === 'string' 
              ? aiResponse.ai_recommendation 
              : (aiResponse.ai_recommendation?.tip || JSON.stringify(aiResponse.ai_recommendation))}
          </div>
          
          {isPremium ? (
            aiResponse.counselling_strategy && (
              <div className="mt-4 pt-4 border-t border-primary/20">
                <h4 className="text-xs font-bold uppercase tracking-wider mb-3">Suggested Counselling Strategy</h4>
                <div className="space-y-2">
                  {Object.entries(aiResponse.counselling_strategy || {}).map(([round, strategy]) => {
                    if (!strategy || typeof strategy !== 'string') return null;
                    return (
                      <div key={round} className="flex gap-3 text-sm">
                        <div className="w-24 shrink-0 font-bold capitalize text-primary">{round.replace('_', ' ')}</div>
                        <div className={s.muted}>{strategy}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )
          ) : (
            <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between flex-wrap gap-2">
              <p className="text-xs font-bold flex items-center gap-1.5"><Crown className="w-4 h-4 text-primary" /> Full 5-round seat-locking strategy unlocked with Premium</p>
              <Link to="/dashboard/subscription" className="text-xs bg-primary text-white px-3 py-1.5 rounded-lg font-bold hover:opacity-90">Unlock Strategy</Link>
            </div>
          )}
        </div>
      )}
      
      {/* ── Disclaimers ── */}
      {aiResponse.disclaimers_fraud_warnings && aiResponse.disclaimers_fraud_warnings.length > 0 && (
        <div className={`rounded-xl border p-4 ${s.dark ? 'border-white/5 bg-white/3' : 'border-slate-200 bg-slate-50'}`}>
          <p className={`text-[10px] font-bold uppercase mb-2 ${s.muted}`}>⚖️ Important Disclaimers</p>
          <ul className="space-y-1.5">
            {(aiResponse.disclaimers_fraud_warnings || []).map((d: string, i: number) => (
              <li key={i} className={`text-xs leading-relaxed ${s.muted}`}>• {d}</li>
            ))}
          </ul>
        </div>
      )}

      <CollegeInfoModal 
        collegeName={selectedCollegeInfo} 
        isOpen={!!selectedCollegeInfo} 
        onClose={() => setSelectedCollegeInfo(null)} 
        s={s}
      />
    </div>
  );
}
