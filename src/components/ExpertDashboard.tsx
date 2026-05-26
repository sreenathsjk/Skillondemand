import React, { useState, useEffect } from 'react';
import { Booking, AvailabilitySlot, Review, ExpertProfile } from '../types';
import { api } from '../lib/api';
import { 
  Calendar, 
  Clock, 
  IndianRupee, 
  PlusCircle, 
  Trash2, 
  Check, 
  ShieldAlert, 
  Star, 
  MessageSquare, 
  Briefcase, 
  Save,
  User,
  Image as ImageIcon,
  Plus,
  Award,
  Activity
} from 'lucide-react';

interface ExpertDashboardProps {
  expertProfile: ExpertProfile | null;
  onProfileUpdated: () => void;
}

export default function ExpertDashboard({ expertProfile, onProfileUpdated }: ExpertDashboardProps) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [slots, setSlots] = useState<AvailabilitySlot[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Form Inputs (fully covering Every Field from the Detail Card)
  const [nameText, setNameText] = useState('');
  const [avatarUrlText, setAvatarUrlText] = useState('');
  const [titleText, setTitleText] = useState('');
  const [bioText, setBioText] = useState('');
  const [skillsArray, setSkillsArray] = useState<string[]>([]);
  const [newSkillInput, setNewSkillInput] = useState('');
  const [price30, setPrice30] = useState(500);
  const [price60, setPrice60] = useState(1000);
  const [totalSessionsText, setTotalSessionsText] = useState(0);
  const [profileSuccess, setProfileSuccess] = useState<string | null>(null);

  // Visual Dates Bar & Slot states
  const [selectedDate, setSelectedDate] = useState('');
  const [slotDuration, setSlotDuration] = useState<30 | 60>(30);
  const [slotProgress, setSlotProgress] = useState<string | null>(null);

  // Generate 14 days list starting from today
  const datesList: string[] = [];
  for (let i = 0; i < 14; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    datesList.push(`${yyyy}-${mm}-${dd}`);
  }

  // Set default selected date once mounted
  useEffect(() => {
    setSelectedDate(datesList[0]);
  }, []);

  const fetchExpertData = async () => {
    if (!expertProfile) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getExpertDetail(expertProfile.id);
      setSlots(data.slots || []);
      setReviews(data.reviews || []);
      
      const allBookings = await api.getBookings();
      setBookings(allBookings.filter(b => b.expertId === expertProfile.id));
    } catch (e: any) {
      setError(e.message || 'Failed to sync expert scheduling database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpertData();
  }, [expertProfile]);

  useEffect(() => {
    if (expertProfile) {
      setNameText(expertProfile.name || '');
      setAvatarUrlText(expertProfile.avatarUrl || '');
      setBioText(expertProfile.bio || '');
      setTitleText(expertProfile.title || '');
      setSkillsArray(expertProfile.skills || []);
      setPrice30(expertProfile.pricePer30Min || 500);
      setPrice60(expertProfile.pricePer60Min || 1000);
      setTotalSessionsText(expertProfile.totalSessions || 0);
    }
  }, [expertProfile]);

  // Handle updates to profile credentials
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setProfileSuccess(null);

    try {
      await api.updateExpertProfile({
        name: nameText,
        avatarUrl: avatarUrlText,
        title: titleText,
        bio: bioText,
        skills: skillsArray,
        pricePer30Min: Number(price30),
        pricePer60Min: Number(price60),
        totalSessions: Number(totalSessionsText),
      });
      setProfileSuccess('Expert biography, credentials, and consulting packages saved!');
      setTimeout(() => setProfileSuccess(null), 4000);
      onProfileUpdated();
    } catch (err: any) {
      setError(err.message || 'Failed to update expert profile specifications.');
    }
  };

  // Toggle Slot state implementation
  const handleToggleSlot = async (timeStr: string) => {
    const existingSlot = slots.find(s => s.date === selectedDate && s.startTime === timeStr);
    
    if (existingSlot) {
      if (existingSlot.isBooked) {
        // Booked is locked & cannot be removed/double-booked
        return;
      }
      // Published -> Unpublished/Draft (Delete slot)
      setSlotProgress(timeStr);
      try {
        await api.deleteSlot(existingSlot.id);
        await fetchExpertData();
      } catch (err: any) {
        setError(err.message || 'Could not unpublish slot.');
      } finally {
        setSlotProgress(null);
      }
    } else {
      // Unpublished/Draft -> Published/Available (Create slot)
      setSlotProgress(timeStr);
      try {
        await api.createSlot({
          date: selectedDate,
          startTime: timeStr,
          duration: slotDuration,
        });
        await fetchExpertData();
      } catch (err: any) {
        setError(err.message || 'Could not publish slot.');
      } finally {
        setSlotProgress(null);
      }
    }
  };

  // Settle completion booking states
  const handleToggleCompleted = async (bookingId: string) => {
    try {
      await api.updateBookingStatus(bookingId, 'completed');
      fetchExpertData();
    } catch (err: any) {
      setError(err.message || 'Failed to change booking status.');
    }
  };

  // Settle cancellation states
  const handleToggleCancelled = async (bookingId: string) => {
    if (!confirm('Are you sure you want to cancel this consulting booking call? This will refund and liberate the slot.')) return;
    try {
      await api.updateBookingStatus(bookingId, 'cancelled');
      fetchExpertData();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking.');
    }
  };

  // Candidates for interactive hourly time blocks (Morning, Afternoon, Evening)
  const morningTimes = ['09:00', '10:00', '11:00'];
  const afternoonTimes = ['12:00', '13:00', '14:00', '15:00', '16:00'];
  const eveningTimes = ['17:00', '18:00', '19:00', '20:00', '21:00'];

  // Financial aggregates
  const confirmedAndCompleted = bookings.filter(b => b.status === 'confirmed' || b.status === 'completed');
  const expertCutPayout = parseFloat(confirmedAndCompleted.reduce((sum, b) => sum + b.expertAmount, 0).toFixed(2));
  const commissionDeducted = parseFloat(confirmedAndCompleted.reduce((sum, b) => sum + b.platformFee, 0).toFixed(2));

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Earnings bento header */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-wrap">
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="block text-[10px] font-mono tracking-wider uppercase text-slate-400">Expert Net Payouts</span>
            <span className="text-2xl font-black text-rose-650 mt-1 block">₹{expertCutPayout}</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Commission deducted (20% fee)</span>
          </div>
          <div className="p-3.5 bg-rose-50 text-rose-500 rounded-xl">
            <IndianRupee className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="block text-[10px] font-mono tracking-wider uppercase text-slate-400">Total Consult Calls</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{confirmedAndCompleted.length} Sessions</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">Active schedule metrics</span>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-xl">
            <Calendar className="h-6 w-6" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="block text-[10px] font-mono tracking-wider uppercase text-slate-400">Average Review Score</span>
            <span className="text-2xl font-extrabold text-slate-900 mt-1 block">{expertProfile?.averageRating.toFixed(1)} / 5.0</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">From {reviews.length} user reviews</span>
          </div>
          <div className="p-3.5 bg-amber-500/5 text-amber-500 rounded-xl">
            <Star className="h-6 w-6 fill-amber-400 stroke-amber-500" />
          </div>
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex items-center justify-between select-none">
          <div>
            <span className="block text-[10px] font-mono tracking-wider uppercase text-slate-400">Platform commissions</span>
            <span className="text-2xl font-extrabold text-slate-950 mt-1 block">₹{commissionDeducted}</span>
            <span className="text-[10px] text-slate-400 font-mono font-medium">20% system commission</span>
          </div>
          <div className="p-3.5 bg-slate-50 text-slate-600 rounded-xl">
            <Briefcase className="h-6 w-6" />
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-rose-50 border border-rose-200/50 text-rose-800 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
          <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
          <span>{error}</span>
        </div>
      )}

      {/* Main split sections */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Side: Dynamic Calendar picker + Hourly slots schedule toggler */}
        <div className="lg:col-span-2 space-y-8 text-left">
          
          {/* Upcoming calls section */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-black tracking-widest uppercase text-slate-400 block select-none">
              ● Upcoming consulting calls ({bookings.filter(b => b.status === 'confirmed').length})
            </h3>

            {bookings.filter(b => b.status === 'confirmed').length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-100 p-10 text-center text-slate-400 text-xs shadow-xs">
                No active confirmed consulting sessions on your schedule list yet. Provide vacant time slots below to attract learners.
              </div>
            ) : (
              <div className="space-y-3">
                {bookings.filter(b => b.status === 'confirmed').map((b) => {
                  const callDate = new Date(b.dateTime);
                  const parsedTime = callDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  
                  return (
                    <div 
                      key={b.id} 
                      className="bg-white rounded-2xl border border-slate-100 p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-slate-900">
                            Learner {b.learnerName}
                          </span>
                          <span className="bg-emerald-50 border border-emerald-100/60 text-emerald-600 px-2 py-0.5 rounded-md font-bold text-[10px] uppercase tracking-wider">
                            Confirmed
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 font-semibold font-sans">
                          <span className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-slate-400" />
                            {callDate.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3.5 w-3.5 text-slate-400" />
                            {parsedTime} ({b.duration} mins)
                          </span>
                        </div>
                      </div>

                      {/* Call interactive actions */}
                      <div className="flex items-center gap-2 flex-wrap pb-1">
                        <a 
                          href={b.meetingLink}
                          target="_blank"
                          rel="noreferrer"
                          className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-3.5 py-2 rounded-xl transition-all cursor-pointer shadow-xs"
                        >
                          Meeting room
                        </a>
                        <button
                          onClick={() => handleToggleCompleted(b.id)}
                          className="bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-bold px-4 py-2 transition-all flex items-center gap-1 cursor-pointer shadow-sm shadow-rose-500/10"
                        >
                          <Check className="h-4 w-4 stroke-[2.5]" />
                          <span>Complete Session</span>
                        </button>
                        <button
                          onClick={() => handleToggleCancelled(b.id)}
                          className="bg-white border border-slate-200 hover:border-rose-500 text-rose-500 hover:bg-rose-50 rounded-xl text-xs font-semibold px-3.5 py-2 transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>

                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* INTERACTIVE DATE-AND-SLOT SCHEDULE BUILDER */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-6">
            <div className="space-y-1">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-bold block">
                ✦ Visual Availability Desk
              </span>
              <h3 className="text-base font-black text-slate-900">Interactive Date-and-Slot Schedule Picker</h3>
              <p className="text-xs text-slate-400 font-sans leading-relaxed">
                Click any calendar date card, then toggle active hourly slots below. Yellow/indigo slots are locked in by booked learners. Click unbooked green slots to remove them from catalog immediately.
              </p>
            </div>

            {/* Date Picker Horizontal Bar */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 font-bold block">
                1. Select Consulting Date
              </span>
              <div className="flex gap-2.5 overflow-x-auto pb-4 pt-1 px-1 scrollbar-thin select-none">
                {datesList.map((dt) => {
                  const isSelected = selectedDate === dt;
                  const dateObj = new Date(dt);
                  const dayName = dateObj.toLocaleDateString([], { weekday: 'short' });
                  const dayNum = dateObj.getDate();
                  
                  // Count of unbooked published slots
                  const vacantCount = slots.filter(s => s.date === dt && !s.isBooked).length;
                  
                  return (
                    <button
                      key={dt}
                      type="button"
                      onClick={() => setSelectedDate(dt)}
                      className={`flex-shrink-0 min-w-[76px] py-4 rounded-2xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 shadow-xs ${
                        isSelected
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/15 scale-102 font-semibold'
                          : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className={`text-[10px] font-mono uppercase tracking-wider font-bold ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                        {dayName}
                      </span>
                      <span className="text-lg font-black tracking-tight leading-none my-0.5">
                        {dayNum}
                      </span>
                      <span className={`text-[9px] font-mono uppercase mt-1 font-bold px-1.5 py-0.5 rounded-md ${
                        isSelected 
                          ? 'bg-white/20 text-white' 
                          : vacantCount > 0 
                            ? 'bg-emerald-50 text-emerald-650 border border-emerald-100/50' 
                            : 'bg-slate-100 text-slate-400'
                      }`}>
                        {vacantCount} open
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Slot Template switch controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100/80">
              <div>
                <span className="text-xs font-bold text-slate-800 block">Slot Template Duration</span>
                <span className="text-[10px] text-slate-400 font-mono">Select meeting duration for any newly published slot.</span>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setSlotDuration(30)}
                  className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    slotDuration === 30
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  30 Mins length
                </button>
                <button
                  type="button"
                  onClick={() => setSlotDuration(60)}
                  className={`px-4 py-2 text-xs font-black rounded-xl border transition-all cursor-pointer ${
                    slotDuration === 60
                      ? 'bg-rose-500 border-rose-500 text-white shadow-xs'
                      : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  60 Mins length
                </button>
              </div>
            </div>

            {/* Core Toggles Legend */}
            <div className="flex flex-wrap items-center gap-3.5 text-[10px] font-mono text-slate-500 border-t border-b border-dashed border-slate-100 py-3.5 select-none">
              <span className="font-bold text-slate-400">GUIDE LEGEND:</span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-emerald-700">AVAILABLE (ACTIVE IN SEARCH)</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-indigo-700">BOOKED (LOCKED CALL)</span>
              </span>
              <span className="flex items-center gap-1.5 font-bold">
                <span className="h-3 w-3 rounded-full bg-slate-300" />
                <span className="text-slate-500">UNPUBLISHED / DRAFT</span>
              </span>
            </div>

            {/* Time Slots grouping layout blocks */}
            <div className="space-y-6">
              
              {/* Fetch Slot generator layout function */}
              {(() => {
                const getSlotForTime = (timeStr: string) => {
                  return slots.find(s => s.date === selectedDate && s.startTime === timeStr);
                };

                const renderTimeGroupBlock = (title: string, times: string[], description: string) => {
                  return (
                    <div className="space-y-3">
                      <div className="border-b border-slate-100 pb-1 flex justify-between items-center">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-slate-400 uppercase">
                          {title}
                        </span>
                        <span className="text-[9px] font-medium font-mono text-slate-400">
                          {description}
                        </span>
                      </div>
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {times.map((time) => {
                          const slotObj = getSlotForTime(time);
                          const isBooked = slotObj?.isBooked || false;
                          const isPublished = !!slotObj;
                          const isProcessing = slotProgress === time;
                          
                          let btnClass = "";
                          let statusLabel = "";
                          let durationLabel = "";
                          
                          if (isBooked) {
                            btnClass = "bg-indigo-50 border-indigo-150 text-indigo-700 cursor-not-allowed opacity-90";
                            statusLabel = "Booked";
                            durationLabel = `${slotObj.duration}m class`;
                          } else if (isPublished) {
                            btnClass = "bg-emerald-50/90 border-emerald-205 hover:border-emerald-400 hover:bg-emerald-100/60 text-emerald-800 font-extrabold cursor-pointer shadow-xs";
                            statusLabel = "Available";
                            durationLabel = `${slotObj.duration}m class`;
                          } else {
                            btnClass = "bg-slate-50 border-slate-200 text-slate-700 hover:bg-white cursor-pointer shadow-xs";
                            statusLabel = "Unpublished";
                            durationLabel = "Draft slot";
                          }
                          
                          return (
                            <button
                              key={time}
                              type="button"
                              disabled={isBooked || isProcessing}
                              onClick={() => handleToggleSlot(time)}
                              className={`flex flex-col items-center justify-between p-3 rounded-2xl border text-center transition-all min-h-[96px] group relative ${btnClass} ${
                                isProcessing ? 'animate-pulse opacity-75' : ''
                              }`}
                            >
                              <div className="flex items-center gap-1.5 font-bold text-xs mt-1">
                                <Clock className={`h-3.5 w-3.5 ${isBooked ? 'text-indigo-400' : isPublished ? 'text-emerald-500' : 'text-slate-400'}`} />
                                <span className={isBooked ? 'line-through' : ''}>{time}</span>
                              </div>

                              <span className={`text-[9px] font-mono font-bold ${
                                isBooked 
                                  ? 'text-indigo-600' 
                                  : isPublished 
                                    ? 'text-emerald-600' 
                                    : 'text-slate-400'
                              }`}>
                                {durationLabel}
                              </span>

                              <span className={`text-[8px] font-mono font-black uppercase tracking-wider px-2 py-0.5 rounded-md mt-1 ${
                                isBooked 
                                  ? 'bg-indigo-500 text-white' 
                                  : isPublished 
                                    ? 'bg-emerald-555 text-white' 
                                    : 'bg-slate-200 text-slate-500'
                              }`}>
                                {statusLabel}
                              </span>

                              {/* Click tips overlay hint on hover */}
                              {!isBooked && !isProcessing && (
                                <span className="absolute inset-x-0 bottom-1 mx-auto max-w-[90%] text-center text-[7px] font-mono text-rose-500 font-black uppercase tracking-wide opacity-0 group-hover:opacity-100 transition-all duration-150">
                                  {isPublished ? '✕ UNPUBLISH' : '✓ PUBLISH SLOT'}
                                </span>
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                };

                return (
                  <div className="space-y-6">
                    {renderTimeGroupBlock("Morning Consulting Blocks", morningTimes, "09:00 AM - 11:59 AM UTC")}
                    {renderTimeGroupBlock("Afternoon Consulting Blocks", afternoonTimes, "12:00 PM - 04:59 PM UTC")}
                    {renderTimeGroupBlock("Evening Consulting Blocks", eveningTimes, "05:00 PM - 09:00 PM UTC")}
                  </div>
                );
              })()}

            </div>

          </div>

        </div>

        {/* Right Side Column: Profile detail editor */}
        <div className="space-y-6 text-left">
          
          {/* Complete parameters editor form */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-5">
            <div className="space-y-1 pb-1 border-b border-slate-100">
              <span className="text-[10px] font-mono uppercase tracking-widest text-rose-500 font-bold block">
                ✦ Profile Personalization
              </span>
              <h3 className="text-base font-black text-slate-900">Expert Parameters Manager</h3>
            </div>

            {/* Profile Avatar visual circle preview */}
            <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100 select-none">
              <img 
                src={avatarUrlText || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250'} 
                alt="Avatar Preview" 
                referrerPolicy="no-referrer"
                className="h-16 w-16 rounded-2xl object-cover border border-slate-200 shadow-xs shrink-0 bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=250';
                }}
              />
              <div className="flex-1 space-y-0.5">
                <h5 className="text-xs font-bold text-slate-800">Live Avatar Circle</h5>
                <p className="text-[9.5px] text-slate-400 font-mono leading-tight">Syncs dynamically with your profile photo image link supplied below.</p>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              {profileSuccess && (
                <div className="bg-emerald-50 text-emerald-800 text-[11px] font-black p-2.5 rounded-xl border border-emerald-100 flex items-center gap-1">
                  <Check className="h-4.5 w-4.5 stroke-[3] text-emerald-600 shrink-0" />
                  <span>{profileSuccess}</span>
                </div>
              )}

              {/* Full Name field */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Full Name</label>
                <input
                  type="text"
                  required
                  value={nameText}
                  onChange={(e) => setNameText(e.target.value)}
                  placeholder="E.g. Priya Sharma"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white shadow-xs font-semibold"
                />
              </div>

              {/* Avatar Image URL field */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Profile Avatar URL</label>
                <input
                  type="text"
                  required
                  value={avatarUrlText}
                  onChange={(e) => setAvatarUrlText(e.target.value)}
                  placeholder="Paste public unsplash/graphic portrait link"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white font-mono shadow-xs"
                />
              </div>

              {/* Headline Title field */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Headline Title</label>
                <input
                  type="text"
                  required
                  value={titleText}
                  onChange={(e) => setTitleText(e.target.value)}
                  placeholder="E.g., SENIOR SOFTWARE ARCHITECT @ GOOGLE"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white shadow-xs font-semibold"
                />
              </div>

              {/* Tokenized Skill Tags Editor */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Advisory Skill Tags</label>
                
                {/* Skill pills inline container */}
                <div className="flex flex-wrap gap-1.5 mb-2.5">
                  {skillsArray.length === 0 ? (
                    <span className="text-[10px] text-slate-400 italic">No primary skills registered yet. Fill below to build.</span>
                  ) : (
                    skillsArray.map((skill, index) => (
                      <span 
                        key={index}
                        className="bg-slate-100 border border-slate-205 text-slate-700 text-[10px] font-bold px-2 py-1 rounded-lg flex items-center gap-1.5 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 transition-all select-none"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => {
                            const updated = [...skillsArray];
                            updated.splice(index, 1);
                            setSkillsArray(updated);
                          }}
                          className="text-[10px] text-slate-400 hover:text-rose-600 cursor-pointer font-extrabold focus:outline-none shrink-0"
                          title="Remove skill"
                        >
                          ×
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Token editor input box */}
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Type skill tag (Press Enter or +)"
                    value={newSkillInput}
                    onChange={(e) => setNewSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        const val = newSkillInput.trim();
                        if (val && !skillsArray.includes(val)) {
                          setSkillsArray([...skillsArray, val]);
                          setNewSkillInput('');
                        }
                      }
                    }}
                    className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white shadow-xs font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      const val = newSkillInput.trim();
                      if (val && !skillsArray.includes(val)) {
                        setSkillsArray([...skillsArray, val]);
                        setNewSkillInput('');
                      }
                    }}
                    className="px-3 bg-slate-900 hover:bg-rose-500 text-white rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center shrink-0 shadow-xs"
                  >
                    <Plus className="h-4 w-4 stroke-[3]" />
                  </button>
                </div>
              </div>

              {/* Biography rich block */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-400 block font-bold block">
                  COMPREHENSIVE CONSULTANT BIOGRAPHY
                </label>
                <textarea
                  rows={4}
                  required
                  value={bioText}
                  onChange={(e) => setBioText(e.target.value)}
                  placeholder="Write a custom detailed biography profile..."
                  className="w-full text-xs p-3 rounded-xl border border-slate-200 focus:outline-hidden focus:ring-1 focus:ring-rose-500 bg-white shadow-xs font-normal leading-relaxed"
                />
              </div>

              {/* Price package rates */}
              <div className="space-y-1.5">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Consulting Rates in INR (₹)</label>
                <div className="grid grid-cols-2 gap-3.5">
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase font-black mb-1">30 Mins Consulting Fee</span>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={price30}
                      onChange={(e) => setPrice30(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono shadow-xs font-bold text-rose-600"
                    />
                  </div>
                  <div>
                    <span className="block text-[9px] font-mono text-slate-400 uppercase font-black mb-1">60 Mins Consulting Fee</span>
                    <input
                      type="number"
                      required
                      min={100}
                      step={50}
                      value={price60}
                      onChange={(e) => setPrice60(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono shadow-xs font-bold text-rose-600"
                    />
                  </div>
                </div>
              </div>

              {/* Meetings fulfilled statistics */}
              <div className="space-y-1">
                <label className="text-[10px] font-mono tracking-wider uppercase text-slate-505 block">Meetings Fulfilled Metric</label>
                <input
                  type="number"
                  required
                  min={0}
                  value={totalSessionsText}
                  onChange={(e) => setTotalSessionsText(Number(e.target.value))}
                  placeholder="E.g., 142 meetings fulfilled"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-mono shadow-xs font-bold text-slate-800"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-slate-900 hover:bg-rose-500 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-slate-900/10"
              >
                <Save className="h-4 w-4" />
                <span>Save credentials & prices</span>
              </button>
            </form>
          </div>

          {/* Historical Reviews ledger card */}
          <div className="bg-white rounded-3xl border border-slate-100 p-6 shadow-xs space-y-4">
            <h4 className="text-xs font-mono tracking-widest uppercase text-slate-400 font-bold block">
              ● Client reviews timeline ({reviews.length})
            </h4>
            <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
              {reviews.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 p-4">
                  No feedback reviews yet. Complete consulting sessions to build stats.
                </div>
              ) : (
                reviews.map((rev) => (
                  <div key={rev.id} className="border-b border-slate-100 pb-3 last:border-b-0 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-slate-805">{rev.learnerName}</span>
                      <div className="flex text-amber-500 gap-0.5">
                        {Array.from({ length: rev.rating }).map((_, i) => (
                          <Star key={i} className="h-3 w-3 fill-amber-400 stroke-transparent" />
                        ))}
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 italic leading-relaxed font-normal">"{rev.comment}"</p>
                    <span className="block text-[9px] font-mono text-slate-400">{new Date(rev.createdAt).toLocaleDateString()}</span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

      </div>

    </div>
  );
}
