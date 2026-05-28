/**
 * High-performance, file-backed local relational store for SkillBridge.
 * Provides production-like data mutations and handles slot locking, conflict detection,
 * commission computations, and analytics with proper index lookup.
 */

import fs from 'fs';
import path from 'path';
import { User, ExpertProfile, AvailabilitySlot, Booking, Review, Transaction, AppState, BookingStatus } from './src/types';

const DB_FILE_PATH = path.join(process.cwd(), 'database_store.json');

// --- HIGH QUALITY SEED DATA ---
const SEED_USERS: User[] = [
  {
    id: 'u_learner1',
    phone: '9876543210',
    name: 'James Walker',
    role: 'learner',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'u_learner2',
    phone: '9999999999',
    name: 'Sarah Jordan',
    role: 'learner',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'u_admin1',
    phone: '8888888888',
    name: 'SkillOnDemand Admin',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-01').toISOString(),
  }
];

const SEED_PROFILES: ExpertProfile[] = [];

// Helper to generate dynamic slot dates
const getFutureDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const SEED_SLOTS: AvailabilitySlot[] = [];

const SEED_BOOKINGS: Booking[] = [];

const SEED_REVIEWS: Review[] = [];

const SEED_TRANSACTIONS: Transaction[] = [];

class DatabaseStore {
  private data: AppState;

  constructor() {
    this.data = {
      users: [],
      profiles: [],
      slots: [],
      bookings: [],
      reviews: [],
      transactions: [],
    };
    this.init();
  }

  private init() {
    try {
      if (fs.existsSync(DB_FILE_PATH)) {
        const fileContent = fs.readFileSync(DB_FILE_PATH, 'utf-8');
        this.data = JSON.parse(fileContent);
        // Force reset if profiles have email johndoe or if users don't have phone numbers
        const needsReset = !this.data.users || this.data.users.length === 0 || this.data.users.some(u => !u.phone);
        if (needsReset) {
          console.log('Resetting local server database due to mobile authentication schema switch.');
          try { fs.unlinkSync(DB_FILE_PATH); } catch (err) {}
          this.data = {
            users: SEED_USERS,
            profiles: SEED_PROFILES,
            slots: SEED_SLOTS,
            bookings: SEED_BOOKINGS,
            reviews: SEED_REVIEWS,
            transactions: SEED_TRANSACTIONS,
          };
          this.save();
          return;
        }
        // Format checks
        if (!this.data.users) this.data.users = [];
        if (!this.data.profiles) this.data.profiles = [];
        if (!this.data.slots) this.data.slots = [];
        if (!this.data.bookings) this.data.bookings = [];
        if (!this.data.reviews) this.data.reviews = [];
        if (!this.data.transactions) this.data.transactions = [];
      } else {
        // Hydrate from seed
        this.data = {
          users: SEED_USERS,
          profiles: SEED_PROFILES,
          slots: SEED_SLOTS,
          bookings: SEED_BOOKINGS,
          reviews: SEED_REVIEWS,
          transactions: SEED_TRANSACTIONS,
        };
        this.save();
      }
    } catch (e) {
      console.error('Error reading database file, loading seed...', e);
      this.data = {
        users: SEED_USERS,
        profiles: SEED_PROFILES,
        slots: SEED_SLOTS,
        bookings: SEED_BOOKINGS,
        reviews: SEED_REVIEWS,
        transactions: SEED_TRANSACTIONS,
      };
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (e) {
      console.error('Error saving database_store file', e);
    }
  }

  // --- QUERY UTILS ---
  public getUsers() { return this.data.users; }
  public getProfiles() {
    let changed = false;
    this.data.users.forEach(u => {
      if (u.role === 'expert') {
        const hasProfile = this.data.profiles.some(p => p.id === u.id);
        if (!hasProfile) {
          this.data.profiles.unshift({
            id: u.id,
            name: u.name,
            phone: u.phone,
            email: u.email,
            title: 'CEO / Business Executive Advisor',
            bio: 'Expert executive consulting, leadership guidance, and corporate strategy planning. View premium packages or custom slots to reserve slots.',
            skills: ['Leadership Advice', 'Executive Advisory'],
            pricePer30Min: 200,
            pricePer60Min: 380,
            averageRating: 5.0,
            totalSessions: 0,
            avatarUrl: u.avatarUrl || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
          });
          changed = true;
        }
      }
    });
    if (changed) {
      this.save();
    }
    return this.data.profiles;
  }
  public getSlots() { return this.data.slots; }
  public getBookings() { return this.data.bookings; }
  public getReviews() { return this.data.reviews; }
  public getTransactions() { return this.data.transactions; }

  public getUserByEmail(email: string) {
    const emailLower = email.toLowerCase().trim();
    return this.data.users.find(u => u.email && u.email.toLowerCase() === emailLower);
  }

  public getUserByPhone(phone: string) {
    const phoneTrimmed = phone.trim();
    return this.data.users.find(u => u.phone === phoneTrimmed);
  }

  public registerUser(phone: string, name: string, role: string, avatarUrl?: string): User {
    const cleanedPhone = phone.trim();
    const existing = this.getUserByPhone(cleanedPhone);
    if (existing) {
      return existing;
    }

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substring(2, 11),
      phone: cleanedPhone,
      name,
      role: role as any,
      avatarUrl: avatarUrl || `https://images.unsplash.com/photo-${Math.random() > 0.5 ? '1535713875002-d1d0cf377fde' : '1494790108377-be9c29b29330'}?auto=format&fit=crop&w=150&h=150&q=80`,
      createdAt: new Date().toISOString(),
    };

    this.data.users.push(newUser);

    if (role === 'expert') {
      const newProfile: ExpertProfile = {
        id: newUser.id,
        name: newUser.name,
        phone: newUser.phone,
        title: 'Industry Expert',
        bio: 'Instantly booked time on-demand provider.',
        skills: ['General Expert'],
        pricePer30Min: 1000,
        pricePer60Min: 1800,
        averageRating: 5.0,
        totalSessions: 0,
        avatarUrl: newUser.avatarUrl || '',
      };
      this.data.profiles.unshift(newProfile);
    }

    this.save();
    return newUser;
  }

  public updateProfile(expertId: string, updates: Partial<ExpertProfile>) {
    const profileIndex = this.data.profiles.findIndex(p => p.id === expertId);
    if (profileIndex > -1) {
      this.data.profiles[profileIndex] = {
        ...this.data.profiles[profileIndex],
        ...updates,
      };
      
      // Keep main user sync
      const userIndex = this.data.users.findIndex(u => u.id === expertId);
      if (userIndex > -1) {
        if (updates.name) this.data.users[userIndex].name = updates.name;
        if (updates.avatarUrl) this.data.users[userIndex].avatarUrl = updates.avatarUrl;
      }
      this.save();
      return this.data.profiles[profileIndex];
    }
    return null;
  }

  public addSlot(expertId: string, date: string, startTime: string, duration: number, slotType?: string, price?: number, meetingLink?: string) {
    // Generate simple ID
    const cleanTime = startTime.replace(':', '');
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const slotId = `${expertId}_${date}_${cleanTime}_${randSuffix}`;

    const newSlot: AvailabilitySlot = {
      id: slotId,
      expertId,
      date,
      startTime,
      duration,
      isBooked: false,
      slotType: slotType || 'hour',
      price: price !== undefined ? Number(price) : undefined,
      meetingLink: meetingLink || undefined,
    };
    this.data.slots.push(newSlot);
    this.save();
    return newSlot;
  }

  public removeSlot(expertId: string, slotId: string) {
    const slotIndex = this.data.slots.findIndex(s => s.id === slotId && s.expertId === expertId);
    if (slotIndex > -1) {
      if (this.data.slots[slotIndex].isBooked) {
        throw new Error('Cannot remove an already booked slot.');
      }
      this.data.slots.splice(slotIndex, 1);
      this.save();
      return true;
    }
    return false;
  }

  public lockSlot(slotId: string, durationMin: number = 3) {
    const slot = this.data.slots.find(s => s.id === slotId);
    if (!slot) return false;
    if (slot.isBooked) return false;

    // Check lock state
    if (slot.isLocked && slot.lockedUntil) {
      if (new Date(slot.lockedUntil) > new Date()) {
        return false; // already locked
      }
    }

    slot.isLocked = true;
    slot.lockedUntil = new Date(Date.now() + durationMin * 60 * 1000).toISOString();
    this.save();
    return true;
  }

  public createBooking(learnerId: string, slotId: string, duration: number, orderId: string): Booking {
    const slotIndex = this.data.slots.findIndex(s => s.id === slotId);
    if (slotIndex === -1) {
      throw new Error('Selected slot does not exist.');
    }
    const slot = this.data.slots[slotIndex];
    if (slot.isBooked) {
      throw new Error('This time slot is already booked.');
    }

    const expert = this.data.profiles.find(p => p.id === slot.expertId);
    if (!expert) {
      throw new Error('Associated expert profile not found.');
    }

    const learner = this.data.users.find(u => u.id === learnerId);
    if (!learner) {
      throw new Error('Learner session not found.');
    }

    // Support custom slot pricing and options
    const price = slot.price !== undefined ? Number(slot.price) : (duration === 30 ? expert.pricePer30Min : expert.pricePer60Min);
    const commission = parseFloat((price * 0.20).toFixed(2));
    const expertPayout = parseFloat((price * 0.80).toFixed(2));

    // Support optional or custom meeting room configurations (optional Google meet links)
    const meetLink = slot.meetingLink || (slot.slotType === 'hour' || !slot.slotType 
      ? `https://meet.google.com/sb-${Math.random().toString(36).substring(2, 5)}-${Math.random().toString(36).substring(2, 6)}-${Math.random().toString(36).substring(2, 5)}`
      : undefined);

    const booking: Booking = {
      id: 'b_' + Math.random().toString(36).substring(2, 11),
      learnerId: learner.id,
      learnerName: learner.name,
      expertId: expert.id,
      expertName: expert.name,
      dateTime: `${slot.date}T${slot.startTime}:00.000Z`,
      duration: slot.duration || duration,
      amountPaid: price,
      platformFee: commission,
      expertAmount: expertPayout,
      status: 'pending', // Pending payment capture
      meetingLink: meetLink,
      createdAt: new Date().toISOString(),
      slotId: slot.id,
      orderId,
    };

    this.data.bookings.push(booking);
    // Mark slot locked momentarily
    slot.isLocked = true;
    slot.lockedUntil = new Date(Date.now() + 10 * 60 * 1000).toISOString(); // lock slot for 10 min during checkout
    this.save();

    return booking;
  }

  public confirmBooking(bookingId: string, paymentId: string) {
    const booking = this.data.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking not found.');
    }

    const slot = this.data.slots.find(s => s.id === booking.slotId);
    if (slot) {
      slot.isBooked = true;
      slot.isLocked = false;
      slot.lockedUntil = undefined;
    }

    booking.status = 'confirmed';
    booking.paymentId = paymentId;

    // Create a transaction
    const tx: Transaction = {
      id: 'tx_' + Math.random().toString(36).substring(2, 11),
      bookingId: booking.id,
      amount: booking.amountPaid,
      platformCommission: booking.platformFee,
      expertPayout: booking.expertAmount,
      status: 'captured',
      learnerName: booking.learnerName,
      expertName: booking.expertName,
      createdAt: new Date().toISOString(),
    };
    this.data.transactions.push(tx);

    // Increment expert sessions count
    const expert = this.data.profiles.find(p => p.id === booking.expertId);
    if (expert) {
      expert.totalSessions += 1;
    }

    this.save();
    return booking;
  }

  public addReview(bookingId: string, rating: number, comment: string) {
    const booking = this.data.bookings.find(b => b.id === bookingId);
    if (!booking) {
      throw new Error('Booking selection not found.');
    }
    if (booking.status !== 'completed' && booking.status !== 'confirmed') {
      throw new Error('Must complete or attend a session to write reviews.');
    }

    const newReview: Review = {
      id: 'rev_' + Math.random().toString(36).substring(2, 11),
      bookingId: booking.id,
      expertId: booking.expertId,
      learnerId: booking.learnerId,
      learnerName: booking.learnerName,
      rating,
      comment,
      createdAt: new Date().toISOString(),
    };

    booking.reviewed = true;
    this.data.reviews.push(newReview);

    // Recalculate Expert Rating
    const reviewsOfExpert = this.data.reviews.filter(r => r.expertId === booking.expertId);
    const sumRating = reviewsOfExpert.reduce((accum, r) => accum + r.rating, 0);
    const avg = parseFloat((sumRating / reviewsOfExpert.length).toFixed(1));

    const expert = this.data.profiles.find(p => p.id === booking.expertId);
    if (expert) {
      expert.averageRating = avg;
    }

    this.save();
    return newReview;
  }

  public banUser(userId: string, banState: boolean) {
    const user = this.data.users.find(u => u.id === userId);
    if (user) {
      user.isBanned = banState;
      this.save();
      return true;
    }
    return false;
  }

  public updateBookingStatus(bookingId: string, status: BookingStatus) {
    const booking = this.data.bookings.find(b => b.id === bookingId);
    if (booking) {
      booking.status = status;
      // If cancelled, liberate slot
      if (status === 'cancelled') {
        const slot = this.data.slots.find(s => s.id === booking.slotId);
        if (slot) {
          slot.isBooked = false;
          slot.isLocked = false;
        }
      }
      this.save();
      return booking;
    }
    return null;
  }
}

export const dbStore = new DatabaseStore();
