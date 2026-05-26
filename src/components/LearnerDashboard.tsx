import { useState, useEffect } from 'react';
import { Booking, Review } from '../types';
import { api } from '../lib/api';
import { Calendar, Video, Clock, CheckCircle, PlusCircle, Frown, Sparkles, Star } from 'lucide-react';
import ReviewModal from './ReviewModal';

interface LearnerDashboardProps {
  onWriteReviewSuccess: () => void;
}

export default function LearnerDashboard({ onWriteReviewSuccess }: LearnerDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Modals integration
  const [activeReviewBooking, setActiveReviewBooking] = useState<Booking | null>(null);

  const fetchLearnerBookings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api.getBookings();
      // Sort bookings: upcoming first, then past
      setBookings(data.sort((a,b) => new Date(b.dateTime).getTime() - new Date(a.dateTime).getTime()));
    } catch (e: any) {
      setError(e.message || 'Failed to list bookings directory.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnerBookings();
  }, []);

  const handleReviewCompleted = () => {
    setActiveReviewBooking(null);
    fetchLearnerBookings();
    onWriteReviewSuccess();
  };

  // Group bookings
  const upcomingBookings = bookings.filter(b => b.status === 'confirmed' && new Date(b.dateTime) >= new Date());
  const pastBookings = bookings.filter(b => b.status === 'completed' || b.status === 'cancelled' || (b.status === 'confirmed' && new Date(b.dateTime) < new Date()));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Visual Header */}
      <div className="bg-gradient-to-r from-rose-500/10 via-amber-500/5 to-transparent p-6 rounded-3xl border border-rose-100/30 flex justify-between items-center">
        <div>
          <h2 className="text-xl font-bold text-slate-900 font-sans tracking-tight">
            Learner Active Workspace
          </h2>
          <p className="text-xs text-slate-500 font-medium">
            Monitor booked experts call, view auto-generated links, or write ratings and review notes.
          </p>
        </div>
        <div className="bg-white/80 backdrop-blur-sm shadow-sm py-2 px-4 rounded-2xl border border-slate-100 flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-rose-500 fill-rose-100" />
          <span className="text-xs font-bold text-slate-700">
            {bookings.filter(b => b.status === 'confirmed').length} Active sessions
          </span>
        </div>
      </div>

      {loading && bookings.length === 0 ? (
        <div className="text-center py-12 text-slate-400 text-xs">
          Loading your scheduling ledger database...
        </div>
      ) : error ? (
        <div className="bg-rose-50 text-rose-800 p-4 rounded-xl text-xs">{error}</div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left panel: Bookings lists */}
          <div className="lg:col-span-2 space-y-6">
            
            {/* 1. UPCOMING CALLS */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400 flex items-center gap-1.5 matches-heading">
                ● Upcoming Consulting Calls ({upcomingBookings.length})
              </h3>
              
              {upcomingBookings.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center space-y-3 shadow-xs">
                  <Frown className="h-10 w-10 text-slate-300 mx-auto" />
                  <p className="text-xs text-slate-500 font-medium">
                    No upcoming consult calls scheduled at present. Browse the search expert cards directory to lock a new slot!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingBookings.map((b) => (
                    <div 
                      key={b.id} 
                      className="bg-white rounded-2xl border border-slate-100 hover:border-slate-200/80 p-5 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-bold text-slate-900">
                            1-on-1 with {b.expertName}
                          </span>
                          <span className="bg-rose-50 text-rose-600 font-bold border border-rose-100 text-[10px] px-2 py-0.5 rounded-md uppercase tracking-wider">
                            Confirmed
                          </span>
                        </div>
                        
                        <div className="flex items-center gap-4 text-xs text-slate-500 font-medium flex-wrap">
                          <span className="flex items-center gap-1.5">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(b.dateTime).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1.5">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {new Date(b.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} ({b.duration} mins)
                          </span>
                        </div>
                      </div>

                      {/* Launch direct call Link */}
                      <div className="flex items-center gap-2 shrink-0">
                        {b.meetingLink ? (
                          <a 
                            href={b.meetingLink}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-slate-900 hover:bg-rose-600 text-white rounded-xl text-xs font-semibold px-4 py-2.5 transition-colors flex items-center gap-1.5 shadow-xs"
                          >
                            <Video className="h-4 w-4" />
                            <span>{b.meetingLink.includes('meet.google.com') ? 'Launch Google Meet' : 'Join Link'}</span>
                          </a>
                        ) : (
                          <span className="text-[10px] font-mono text-slate-400 italic bg-slate-50 border border-slate-100 px-3 py-2 rounded-xl text-center">
                            Direct Coordinate Consult
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 2. HISTORY LIST */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono font-bold tracking-wider uppercase text-slate-400">
                ● Past Scheduling Records ({pastBookings.length})
              </h3>

              {pastBookings.length === 0 ? (
                <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                  No previous sessions recorded.
                </div>
              ) : (
                <div className="space-y-3">
                  {pastBookings.map((b) => {
                    const isCancelled = b.status === 'cancelled';
                    const isConfirmedOld = b.status === 'confirmed'; // past but confirmed
                    
                    return (
                      <div 
                        key={b.id} 
                        className="bg-white rounded-2xl border border-slate-100 p-4.5 flex flex-col md:flex-row md:items-center justify-between gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-slate-800">
                              {b.expertName} - {b.duration} Min Slot
                            </span>
                            <span className={`text-[9px] font-mono px-2 py-0.5 rounded-md uppercase tracking-wider font-bold ${
                              isCancelled 
                                ? 'bg-rose-50 text-rose-600 border border-rose-100' 
                                : 'bg-slate-100 text-slate-600 border border-slate-200/50'
                            }`}>
                              {isCancelled ? 'Cancelled' : 'Completed'}
                            </span>
                          </div>

                          <span className="block text-[11px] text-slate-400 font-mono">
                            {new Date(b.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {isCancelled ? (
                            <span className="text-xs text-rose-500 font-medium font-mono">Session Cancelled</span>
                          ) : b.reviewed ? (
                            <span className="text-xs text-emerald-600 bg-emerald-50/80 border border-emerald-100 px-3 py-1.5 rounded-xl font-bold font-sans flex items-center gap-1">
                              <CheckCircle className="h-4 w-4" /> Feedback Submitted
                            </span>
                          ) : (
                            <button
                              onClick={() => setActiveReviewBooking(b)}
                              className="bg-white border border-slate-200 hover:border-slate-800 text-slate-800 text-xs font-semibold px-3.5 py-1.5 rounded-xl cursor-pointer transition-colors flex items-center gap-1"
                            >
                              <PlusCircle className="h-3.5 w-3.5" />
                              <span>Submit Review Rating</span>
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* Right panel: Static user summary bento */}
          <div className="space-y-6">
            <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
              <h4 className="text-xs font-mono tracking-wider uppercase text-slate-400">
                LEARNER ANALYTICS SUMMARY
              </h4>
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 select-none">
                  <span className="block text-xl font-extrabold text-slate-900 leading-none">
                    {bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').length}
                  </span>
                  <span className="text-[10px] font-mono tracking-wide uppercase text-slate-400 block mt-1 leading-none">
                    Completed Calls
                  </span>
                </div>

                <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 select-none">
                  <span className="block text-xl font-extrabold text-slate-900 leading-none">
                    ₹{bookings.filter(b => b.status === 'confirmed' || b.status === 'completed').reduce((sum, b) => sum + b.amountPaid, 0)}
                  </span>
                  <span className="text-[10px] font-mono tracking-wide uppercase text-slate-400 block mt-1 leading-none">
                    Total Spent
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 space-y-2">
                <h5 className="text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                  ACTIVE PLATFORM PERKS
                </h5>
                <ul className="text-xs text-slate-600 space-y-1.5 list-disc pl-4 font-normal">
                  <li>Direct clickable Google Meet linkage.</li>
                  <li>Secure Razorpay pre-locked transaction shield protection.</li>
                  <li>Curated 1-on-1 industry expertise on demand.</li>
                </ul>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Review Dialog Trigger */}
      {activeReviewBooking && (
        <ReviewModal
          booking={activeReviewBooking}
          onClose={() => setActiveReviewBooking(null)}
          onSuccess={handleReviewCompleted}
        />
      )}

    </div>
  );
}
