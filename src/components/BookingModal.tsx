import { useState, useEffect } from 'react';
import { ExpertProfile, AvailabilitySlot } from '../types';
import { api } from '../lib/api';
import { Calendar, Clock, Sparkles, CreditCard, ShieldAlert, X, CheckCircle } from 'lucide-react';

interface BookingModalProps {
  expert: ExpertProfile;
  slots: AvailabilitySlot[];
  onClose: () => void;
  onSuccess: () => void;
}

export default function BookingModal({ expert, slots, onClose, onSuccess }: BookingModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedSlot, setSelectedSlot] = useState<AvailabilitySlot | null>(null);
  const [duration, setDuration] = useState<30 | 60>(30);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Checkout & Payment states
  const [checkoutBooking, setCheckoutBooking] = useState<any>(null);
  const [isSandboxMode, setIsSandboxMode] = useState(true);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  // Group slots by unique date strings (including booked slots to show status labels)
  const slotsGroupedByDate = slots.reduce<Record<string, AvailabilitySlot[]>>((acc, s) => {
    if (!acc[s.date]) acc[s.date] = [];
    acc[s.date].push(s);
    return acc;
  }, {});

  const datesList = Object.keys(slotsGroupedByDate).sort();

  // Pick first date as default if any
  useEffect(() => {
    if (datesList.length > 0 && !selectedDate) {
      setSelectedDate(datesList[0]);
    }
  }, [datesList, selectedDate]);

  // Adjust duration options based on slot duration if needed
  useEffect(() => {
    if (selectedSlot) {
      // Force match slot's duration
      setDuration(selectedSlot.duration as 30 | 60);
    }
  }, [selectedSlot]);

  // Handle slot reservation checkout request
  const handleInitiateCheckout = async () => {
    if (!selectedSlot) {
      setError('Please pick an available time slot first.');
      return;
    }
    setError(null);
    setLoading(true);

    try {
      const resp = await api.createCheckoutSession(selectedSlot.id, duration);
      setCheckoutBooking(resp.booking);
      setIsSandboxMode(resp.isSimulated);
      
      // If live Razorpay checkout is configured in env keys, try loading Razorpay JS script
      if (!resp.isSimulated && resp.razorpayKey && resp.razorpayOrderId) {
        loadLiveRazorpay(resp.razorpayKey, resp.amount, resp.razorpayOrderId, resp.booking.id);
      }
    } catch (e: any) {
      setError(e.message || 'The checkout flow could not be initiated.');
    } finally {
      setLoading(false);
    }
  };

  // Dynamically load Razorpay SDK and open live iframe checkout
  const loadLiveRazorpay = (key: string, amount: number, orderId: string, bookingId: string) => {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => {
      const options = {
        key: key,
        amount: amount * 100, // paise
        currency: 'INR',
        name: 'SkillOnDemand Platform',
        description: `1-on-1 Consulting Call with ${expert.name}`,
        order_id: orderId,
        handler: async function (response: any) {
          try {
            setLoading(true);
            await api.confirmPayment({
              bookingId,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
              razorpaySignature: response.razorpay_signature,
            });
            setPaymentSuccess(true);
            setTimeout(() => {
              onSuccess();
            }, 2500);
          } catch (e: any) {
            setError(e.message || 'Failed to verify transaction signature.');
          } finally {
            setLoading(false);
          }
        },
        prefill: {
          name: 'Learner User',
          email: 'learner@skillondemand.io',
        },
        theme: {
          color: '#f43f5e', // rose-500
        },
      };
      const rzpay = new (window as any).Razorpay(options);
      rzpay.open();
    };
    script.onerror = () => {
      setError('Failed to load Razorpay payment SDK. Falling back to platform simulator.');
      setIsSandboxMode(true);
    };
    document.body.appendChild(script);
  };

  // Complete simulated payment callback process
  const handleSettleSandboxPayment = async () => {
    if (!checkoutBooking) return;
    setLoading(true);
    setError(null);

    try {
      await api.confirmPayment({
        bookingId: checkoutBooking.id,
        simulateSuccess: true,
      });
      setPaymentSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2500);
    } catch (e: any) {
      setError(e.message || 'Sandbox verification failed.');
    } finally {
      setLoading(false);
    }
  };

  // Calculate pricing summary variables
  const sessionFee = duration === 30 ? expert.pricePer30Min : expert.pricePer60Min;
  const systemCommissionVal = parseFloat((sessionFee * 0.20).toFixed(2));
  const expertPayoutSplit = parseFloat((sessionFee * 0.80).toFixed(2));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl border border-slate-100/80 flex flex-col max-h-[90vh] overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Block */}
        <div className="p-6 border-b border-rose-50/50 bg-rose-50/20 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 bg-rose-500 text-white rounded-xl shadow-xs">
              <Calendar className="h-5 w-5" />
            </span>
            <div>
              <h2 className="text-lg font-bold text-slate-900 font-sans">
                Book 1-on-1 Sessions
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                Reserve custom consulting with <span className="font-semibold text-rose-500">{expert.name}</span>
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Inner Context Scrollbox */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {error && (
            <div className="bg-rose-50 border border-rose-200/60 text-rose-700 text-xs rounded-xl p-3.5 flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {paymentSuccess ? (
            /* Successful state graphics */
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="bg-emerald-50 text-emerald-500 p-4 rounded-full border border-emerald-100 animate-bounce">
                <CheckCircle className="h-12 w-12" />
              </div>
              <h3 className="text-xl font-bold text-slate-950">
                Payment Received & Confirmed!
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">
                Your scheduling on <span className="font-semibold text-slate-800">{new Date(checkoutBooking?.dateTime).toLocaleDateString()}</span> is active! Find the dynamic Google Meet links in your dashboard.
              </p>
              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full uppercase tracking-wider">
                Capturing Trans ID: {Math.random().toString(36).substring(2, 10).toUpperCase()}
              </span>
            </div>
          ) : checkoutBooking ? (
            /* Payment Action Sandbox View */
            <div className="space-y-6">
              <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100">
                <h4 className="text-xs font-mono tracking-wider uppercase text-slate-400 mb-3">
                  Consulting Checkout Details
                </h4>
                <div className="space-y-2.5 text-slate-700 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500">Scheduled Expert Name</span>
                    <span className="font-semibold text-slate-900">{checkoutBooking.expertName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Date & Start Time</span>
                    <span className="font-semibold text-slate-900">{new Date(checkoutBooking.dateTime).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Booking Duration</span>
                    <span className="font-semibold text-slate-900">{checkoutBooking.duration} mins Call</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500">Platform Booking ID</span>
                    <span className="font-mono text-slate-800">{checkoutBooking.id}</span>
                  </div>
                  <div className="pt-3 border-t border-slate-100 flex justify-between font-bold text-sm text-slate-950">
                    <span>Total Session Fee</span>
                    <span className="text-rose-600 font-extrabold text-base">₹{checkoutBooking.amountPaid}</span>
                  </div>
                </div>
              </div>

              {isSandboxMode && (
                <div className="bg-amber-50 rounded-2xl p-5 border border-amber-200/40 text-left space-y-3">
                  <div className="flex items-center gap-2 text-amber-900 font-bold text-xs">
                    <CreditCard className="h-4 w-4 text-amber-600" />
                    <span>Razorpay Local Sandbox Mode active</span>
                  </div>
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    No Razorpay API Credentials detect in the virtual environment. We successfully unlocked our secure local Sandbox simulated engine! Confirming this payment will persist bookings, transactions and update Expert earnings dynamically.
                  </p>
                  <button
                    onClick={handleSettleSandboxPayment}
                    disabled={loading}
                    className="w-full bg-slate-900 hover:bg-rose-500 text-white font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-sm shadow-slate-950/10"
                  >
                    {loading ? 'Processing transaction verification...' : 'Authorize Sandbox Payment (₹' + checkoutBooking.amountPaid + ')'}
                  </button>
                </div>
              )}
            </div>
          ) : (
            /* Choose Date & Slots View */
            <div className="space-y-6">
              
              {/* Date Selecting Scroller */}
              <div>
                <label className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 block mb-2.5">
                  1. Choose available Consulting Date
                </label>
                {datesList.length === 0 ? (
                  <div className="text-center py-6 text-slate-400 text-xs bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    No vacant scheduling slots available for this expert.
                  </div>
                ) : (
                  <div className="flex gap-2 overflow-x-auto pb-1.5">
                    {datesList.map((dt) => {
                      const dateObj = new Date(dt);
                      const isSelected = selectedDate === dt;
                      // Calculate available slots count
                      const daySlots = slotsGroupedByDate[dt] || [];
                      const vacantCount = daySlots.filter(s => !s.isBooked).length;
                      return (
                        <button
                          key={dt}
                          type="button"
                          onClick={() => {
                            setSelectedDate(dt);
                            setSelectedSlot(null);
                          }}
                          className={`flex-none px-4 py-3 rounded-xl text-center border transition-all cursor-pointer ${
                            isSelected
                              ? 'bg-rose-500 text-white border-rose-500 shadow-md shadow-rose-500/10 scale-[1.01]'
                              : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <span className="block text-[10px] font-mono font-bold uppercase tracking-wider opacity-80 leading-none">
                            {dateObj.toLocaleDateString([], { weekday: 'short' })}
                          </span>
                          <span className="block text-sm font-extrabold mt-1">
                            {dateObj.toLocaleDateString([], { day: 'numeric', month: 'short' })}
                          </span>
                          <span className={`block text-[9px] font-mono mt-1 font-bold ${
                            isSelected 
                              ? 'text-rose-100' 
                              : vacantCount > 0 
                                ? 'text-emerald-600' 
                                : 'text-slate-400'
                          }`}>
                            {vacantCount} open
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Slots selection */}
              {selectedDate && (
                <div>
                  <label className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 block mb-2.5">
                    2. Choose custom Meeting time slot
                  </label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {slotsGroupedByDate[selectedDate]?.map((slot) => {
                      const isSelected = selectedSlot?.id === slot.id;
                      const isBooked = slot.isBooked;
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={isBooked}
                          onClick={() => {
                            if (!isBooked) {
                              setSelectedSlot(slot);
                            }
                          }}
                          className={`py-3 px-3 rounded-xl border text-xs font-semibold text-center transition-all cursor-pointer flex flex-col items-center justify-between min-h-[90px] ${
                            isBooked
                              ? 'bg-slate-50 border-slate-100 text-slate-400 cursor-not-allowed opacity-60'
                              : isSelected
                                ? 'bg-slate-900 text-white border-slate-900 shadow-sm ring-2 ring-rose-500/10'
                                : 'bg-white border-slate-100 text-slate-700 hover:border-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-1">
                            <Clock className={`h-3.5 w-3.5 ${isBooked ? 'text-slate-300' : isSelected ? 'text-rose-400' : 'text-slate-400'}`} />
                            <span className={isBooked ? 'line-through text-slate-400' : ''}>{slot.startTime}</span>
                          </div>
                          <span className={`text-[9px] font-mono opacity-85 ${isBooked ? 'text-slate-400' : isSelected ? 'text-rose-300' : 'text-slate-400'}`}>
                            {slot.duration} Min length
                          </span>
                          
                          {/* Slot Status Labels */}
                          <span className={`text-[8.5px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-md font-bold ${
                            isBooked 
                              ? 'bg-slate-200/50 text-slate-500' 
                              : isSelected 
                                ? 'bg-rose-500 text-white shadow-xs' 
                                : 'bg-emerald-50 text-emerald-600 border border-emerald-100/50'
                          }`}>
                            {isBooked ? 'Booked' : isSelected ? 'Selected' : 'Available'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Live duration radio parameters */}
              {selectedSlot && (
                <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100/50 space-y-3.5">
                  <div>
                    <span className="text-[10px] font-mono font-medium uppercase tracking-wider text-slate-400 block mb-2">
                      3. Duration & Payout Summary
                    </span>
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={() => setDuration(30)}
                        className={`flex-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          duration === 30
                            ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-xs'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] font-mono uppercase tracking-wider">
                          Standard consulting
                        </span>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-sm font-black">30 Minutes</span>
                          <span className="text-sm font-extrabold text-rose-600">₹{expert.pricePer30Min}</span>
                        </div>
                      </button>

                      <button
                        type="button"
                        onClick={() => setDuration(60)}
                        className={`flex-1 p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                          duration === 60
                            ? 'bg-rose-50 border-rose-300 text-rose-950 font-bold shadow-xs'
                            : 'bg-white border-slate-100 text-slate-600 hover:border-slate-200'
                        }`}
                      >
                        <span className="block text-[10px] font-mono uppercase tracking-wider">
                          Extended consulting
                        </span>
                        <div className="flex justify-between items-baseline mt-1">
                          <span className="text-sm font-black">60 Minutes</span>
                          <span className="text-sm font-extrabold text-rose-600">₹{expert.pricePer60Min}</span>
                        </div>
                      </button>
                    </div>
                  </div>

                  <div className="border-t border-slate-200/50 pt-3 flex justify-between text-xs text-slate-500">
                    <div className="space-y-1">
                      <div>Includes autogenerated secure video conference linkage</div>
                      <div>Platform commission is calculated at a standard 20% rate</div>
                    </div>
                    <div className="text-right font-semibold text-slate-800">
                      <div>₹{systemCommissionVal} Service Fee</div>
                      <div>₹{expertPayoutSplit} Expert payout</div>
                    </div>
                  </div>
                </div>
              )}

            </div>
          )}

        </div>

        {/* Footer Area with Book Trigger buttons */}
        {!paymentSuccess && !checkoutBooking && (
          <div className="p-6 border-t border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div className="text-left">
              <span className="block text-[10px] font-mono uppercase tracking-wider text-slate-400">
                Active selected fee
              </span>
              <span className="text-xl font-black text-slate-900 leading-tight">
                ₹{sessionFee}
              </span>
            </div>
            
            <button
              onClick={handleInitiateCheckout}
              disabled={loading || !selectedSlot}
              className={`px-8 py-3 rounded-xl font-semibold text-sm transition-all shadow-sm flex items-center gap-1.5 cursor-pointer ${
                selectedSlot 
                  ? 'bg-rose-500 hover:bg-rose-600 text-white shadow-rose-500/20' 
                  : 'bg-slate-100 text-slate-400 border border-slate-200 pointer-events-none'
              }`}
            >
              <span>{loading ? 'Locking selected slot...' : 'Proceed to Checkout & Pay'}</span>
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
