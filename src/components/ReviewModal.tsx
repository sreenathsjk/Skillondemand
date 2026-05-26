import React, { useState } from 'react';
import { Booking } from '../types';
import { api } from '../lib/api';
import { Star, ShieldAlert, X, MessageSquare, Award } from 'lucide-react';

interface ReviewModalProps {
  booking: Booking;
  onClose: () => void;
  onSuccess: () => void;
}

export default function ReviewModal({ booking, onClose, onSuccess }: ReviewModalProps) {
  const [rating, setRating] = useState<number>(5);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredStar, setHoveredStar] = useState<number | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating < 1 || rating > 5) {
      setError('Please provide a score rating from 1 to 5 stars.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.publishReview({
        bookingId: booking.id,
        rating,
        comment: comment.trim(),
      });
      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to submit review contents. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl border border-slate-100 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header Block */}
        <div className="p-5 border-b border-rose-50/50 bg-rose-50/20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-amber-500 text-white rounded-lg">
              <Award className="h-4.5 w-4.5" />
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-950 font-sans">
                Review Expert Session
              </h3>
              <p className="text-[11px] text-slate-500">
                Provide feedback for <span className="font-semibold text-rose-500">{booking.expertName}</span>
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Input Form Area */}
        <form onSubmit={handleSubmit} className="p-5 space-y-5">
          {error && (
            <div className="bg-rose-50 border border-rose-200/60 text-rose-700 text-xs rounded-xl p-3 flex items-start gap-2.5">
              <ShieldAlert className="h-4.5 w-4.5 shrink-0 mt-0.5 text-rose-500" />
              <span>{error}</span>
            </div>
          )}

          {/* Golden Interactive Stars Selector */}
          <div className="text-center space-y-2">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400">
              How was your 1-on-1 experience?
            </label>
            <div className="flex justify-center gap-1.5 pt-1">
              {[1, 2, 3, 4, 5].map((idx) => {
                const filled = hoveredStar !== null ? idx <= hoveredStar : idx <= rating;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setRating(idx)}
                    onMouseEnter={() => setHoveredStar(idx)}
                    onMouseLeave={() => setHoveredStar(null)}
                    className="p-1.5 hover:scale-110 transition-transform cursor-pointer focus:outline-hidden"
                  >
                    <Star
                      className={`h-8 w-8 transition-colors ${
                        filled 
                          ? 'text-amber-400 fill-amber-400 stroke-amber-500' 
                          : 'text-slate-200 fill-transparent'
                      }`}
                    />
                  </button>
                );
              })}
            </div>
            <div className="text-xs font-bold text-amber-800">
              {rating === 5 && 'Excellent - Exceeded expectations! ⭐⭐⭐⭐⭐'}
              {rating === 4 && 'Very Good - Helpful and clear ⭐⭐⭐⭐'}
              {rating === 3 && 'Good - Answered base queries ⭐⭐⭐'}
              {rating === 2 && 'Fair - Met some expectations ⭐⭐'}
              {rating === 1 && 'Poor - Unhelpful session ⭐'}
            </div>
          </div>

          {/* Feedback Commentary Text Field */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1">
              <MessageSquare className="h-3 w-3 text-slate-400" /> Professional Feedback Comments
            </label>
            <textarea
              rows={4}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Write a clear, brief review about this booking. E.g., John helped rewrite my custom Redux configurations and saved 3 days of build cycle time..."
              className="w-full text-xs p-3 rounded-xl border border-slate-200/80 focus:ring-1 focus:ring-rose-500 focus:outline-hidden bg-slate-50/20"
            />
          </div>

          {/* Submit Action Block */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="bg-slate-900 hover:bg-rose-500 text-white text-xs font-semibold px-5 py-2.5 rounded-xl transition-all shadow-xs cursor-pointer"
            >
              {loading ? 'Publishing feedback...' : 'Submit Session Review'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
