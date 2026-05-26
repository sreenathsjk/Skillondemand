/**
 * Universal TypeScript declarations for SkillBridge
 */

export type UserRole = 'learner' | 'expert' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatarUrl?: string;
  createdAt: string;
  isBanned?: boolean;
}

export interface ExpertProfile {
  id: string; // matches User.id
  name: string;
  email: string;
  title: string;
  bio: string;
  skills: string[];
  pricePer30Min: number;
  pricePer60Min: number;
  averageRating: number;
  totalSessions: number;
  avatarUrl: string;
  featured?: boolean;
}

export interface AvailabilitySlot {
  id: string;
  expertId: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  duration: number; // in minutes (e.g., 30 or 60)
  isBooked: boolean;
  isLocked?: boolean;
  lockedUntil?: string; // ISO String
}

export type BookingStatus = 'pending' | 'confirmed' | 'completed' | 'cancelled';

export interface Booking {
  id: string;
  learnerId: string;
  learnerName: string;
  expertId: string;
  expertName: string;
  dateTime: string; // ISO string combine date & time
  duration: number; // 30 or 60 min
  amountPaid: number;
  platformFee: number; // 20%
  expertAmount: number; // 80%
  status: BookingStatus;
  meetingLink: string;
  createdAt: string;
  slotId: string;
  orderId?: string; // Razorpay Order ID
  paymentId?: string; // Razorpay Payment ID
  reviewed?: boolean;
}

export interface Review {
  id: string;
  bookingId: string;
  expertId: string;
  learnerId: string;
  learnerName: string;
  rating: number; // 1-5
  comment: string;
  createdAt: string;
}

export interface Transaction {
  id: string;
  bookingId: string;
  amount: number;
  platformCommission: number;
  expertPayout: number;
  status: 'captured' | 'failed' | 'refunded';
  learnerName: string;
  expertName: string;
  createdAt: string;
}

export interface AppState {
  users: User[];
  profiles: ExpertProfile[];
  slots: AvailabilitySlot[];
  bookings: Booking[];
  reviews: Review[];
  transactions: Transaction[];
}
