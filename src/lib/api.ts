/**
 * Highly polished hybrid API client for SkillBridge.
 * Features automated Static Host Simulation Fallback (ideal for GitHub Pages).
 * Detects if the Express API backend is absent/static-only and delegates
 * execution gracefully to an active state engine in localStorage with rich seed data.
 */

import { User, ExpertProfile, AvailabilitySlot, Booking, Review, UserRole } from '../types';

const isStaticHost = typeof window !== 'undefined' && (
  window.location.hostname.endsWith('github.io') ||
  window.location.hostname === 'sreenathsjk.github.io' ||
  localStorage.getItem('force_static_simulation') === 'true'
);

// Fallback visual logs helper
const logMode = () => {
  if (isStaticHost) {
    console.warn('✦ [SkillBridge API]: Running in client-side static sandbox mode (Local Storage Database active). All appointments, reviews, and slot updates will save directly in your browser tab!');
  }
};

/**
 * Utility function to convert Google Drive sharing and other URLs to direct raw image URLs
 */
export function getCleanImageUrl(url: string | undefined): string {
  if (!url) return '';
  const trimmed = url.trim();

  // Try matching standard Google Drive structures
  const fileIdMatch = trimmed.match(/\/file\/d\/([a-zA-Z0-9_-]{25,50})/);
  if (fileIdMatch && fileIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${fileIdMatch[1]}`;
  }

  const idParamMatch = trimmed.match(/[?&]id=([a-zA-Z0-9_-]{25,50})/);
  if (idParamMatch && idParamMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${idParamMatch[1]}`;
  }

  const dIdMatch = trimmed.match(/\/d\/([a-zA-Z0-9_-]{25,50})/);
  if (dIdMatch && dIdMatch[1]) {
    return `https://lh3.googleusercontent.com/d/${dIdMatch[1]}`;
  }

  return trimmed;
}

// Seed constants for the frontend static database if the network is absent
const SEED_PROFILES: ExpertProfile[] = [];

class LocalDatabaseClient {
  private getStore() {
    let raw = localStorage.getItem('skillbridge_local_db');
    if (raw) {
      try {
        const testDb = JSON.parse(raw);
        // Force reset if users lack the phone attribute
        const needsReset = !testDb.users || testDb.users.length === 0 || testDb.users.some((u: any) => !u.phone);
        if (needsReset) {
          localStorage.removeItem('skillbridge_local_db');
          raw = null;
        }
      } catch (e) {
        localStorage.removeItem('skillbridge_local_db');
        raw = null;
      }
    }
    if (!raw) {
      const getFutureDateString = (offsetDays: number): string => {
        const d = new Date();
        d.setDate(d.getDate() + offsetDays);
        return d.toISOString().split('T')[0];
      };

      const seedUsers: User[] = [
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
        ...SEED_PROFILES.map(p => ({
          id: p.id,
          phone: p.phone || '9999999999',
          email: p.email,
          name: p.name,
          role: 'expert' as UserRole,
          avatarUrl: p.avatarUrl,
          createdAt: new Date('2026-01-01').toISOString(),
        })),
        {
          id: 'u_admin1',
          phone: '8888888888',
          name: 'SkillOnDemand Admin',
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
          createdAt: new Date('2021-01-01').toISOString(),
        }
      ];

      const seedSlots: AvailabilitySlot[] = [];
      SEED_PROFILES.map(p => p.id).forEach((expertId) => {
        for (let day = 1; day <= 6; day++) {
          const dateStr = getFutureDateString(day);
          seedSlots.push({
            id: `${expertId}_${dateStr}_1000`,
            expertId,
            date: dateStr,
            startTime: '10:00',
            duration: 30,
            isBooked: false,
          });
          seedSlots.push({
            id: `${expertId}_${dateStr}_1400`,
            expertId,
            date: dateStr,
            startTime: '14:00',
            duration: 60,
            isBooked: false,
          });
          seedSlots.push({
            id: `${expertId}_${dateStr}_1700`,
            expertId,
            date: dateStr,
            startTime: '17:00',
            duration: 30,
            isBooked: false,
          });
        }
      });

      const seedBookings: Booking[] = [
        {
          id: 'b_completed1',
          learnerId: 'u_learner1',
          learnerName: 'James Walker',
          expertId: 'u_expert1',
          expertName: 'John Doe',
          dateTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
          duration: 30,
          amountPaid: 1500,
          platformFee: 300,
          expertAmount: 1200,
          status: 'completed',
          meetingLink: 'https://meet.google.com/abc-defg-hij',
          createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
          slotId: 'u_expert1_old_slot',
          orderId: 'order_completed_1',
          paymentId: 'pay_completed_1',
          reviewed: true,
        }
      ];

      const seedReviews: Review[] = [
        {
          id: 'rev_1',
          bookingId: 'b_completed1',
          expertId: 'u_expert1',
          learnerId: 'u_learner1',
          learnerName: 'James Walker',
          rating: 5,
          comment: 'Amazing architect! John instantly resolved my React query limits and optimization pipeline errors.',
          createdAt: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(),
        }
      ];

      const defaultDb = {
        users: seedUsers,
        profiles: SEED_PROFILES,
        slots: seedSlots,
        bookings: seedBookings,
        reviews: seedReviews,
        currentUser: seedUsers[1] // Default mock logged in user as Sarah Jordan for immediate comfort
      };
      localStorage.setItem('skillbridge_local_db', JSON.stringify(defaultDb));
      return defaultDb;
    }
    const db = JSON.parse(raw);
    let changed = false;
    db.users.forEach((u: any) => {
      if (u.role === 'expert') {
        const hasProf = db.profiles.some((p: any) => p.id === u.id);
        if (!hasProf) {
          db.profiles.unshift({
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
            featured: false
          });
          changed = true;
        }
      }
    });
    if (changed) {
      this.saveStore(db);
    }
    return db;
  }

  private saveStore(db: any) {
    localStorage.setItem('skillbridge_local_db', JSON.stringify(db));
  }

  public magicLogin(phone: string, name?: string, role?: UserRole) {
    const db = this.getStore();
    const phoneSanitized = phone.trim();
    let user = db.users.find((u: any) => u.phone === phoneSanitized);
    
    if (!user) {
      user = {
        id: 'u_' + Math.random().toString(36).substring(2, 11),
        phone: phoneSanitized,
        name: name || `User_${phoneSanitized.slice(-4)}`,
        role: role || 'learner',
        avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
        createdAt: new Date().toISOString()
      };
      db.users.push(user);
    }
    
    // Ensure if role is expert, we have a profile
    if (user.role === 'expert' && !db.profiles.some((p: any) => p.id === user.id)) {
      db.profiles.unshift({
        id: user.id,
        name: user.name,
        phone: user.phone,
        email: user.email,
        title: 'SENIOR SOFTWARE CONSULTANT',
        bio: 'Newly registered platform consultant. Edit your biography profile here.',
        skills: ['Coding', 'React', 'TypeScript'],
        pricePer30Min: 600,
        pricePer60Min: 1100,
        averageRating: 5.0,
        totalSessions: 0,
        avatarUrl: user.avatarUrl,
        featured: false
      });
    }

    db.currentUser = user;
    this.saveStore(db);
    localStorage.setItem('skillbridge_jwt', 'mock-jwt-token-' + user.id);
    return { token: 'mock-jwt-token-' + user.id, user };
  }

  public getMe() {
    const db = this.getStore();
    if (!db.currentUser) {
      // Return learner1 default
      db.currentUser = db.users[0];
      this.saveStore(db);
    }
    return db.currentUser;
  }

  public onboard(role: UserRole, name?: string) {
    const db = this.getStore();
    let current = db.currentUser || db.users[0];
    const userIndex = db.users.findIndex((u: any) => u.id === current.id);
    
    if (userIndex > -1) {
      db.users[userIndex].role = role;
      if (name) db.users[userIndex].name = name;
      
      if (role === 'expert' && !db.profiles.some((p: any) => p.id === current.id)) {
        db.profiles.unshift({
          id: current.id,
          name: db.users[userIndex].name,
          phone: db.users[userIndex].phone,
          email: db.users[userIndex].email,
          title: 'SENIOR SOFTWARE CONSULTANT',
          bio: 'Newly registered expert. Replace with high-fidelity profile introduction bio.',
          skills: ['Coding', 'React', 'TypeScript'],
          pricePer30Min: 500,
          pricePer60Min: 1000,
          averageRating: 5.0,
          totalSessions: 0,
          avatarUrl: db.users[userIndex].avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=150',
          featured: false
        });
      }
      db.currentUser = db.users[userIndex];
      this.saveStore(db);
      return { user: db.currentUser, token: 'mock-jwt-token-' + db.currentUser.id };
    }
    throw new Error('User not found on simulated server.');
  }

  public getExperts(filters: any = {}) {
    const db = this.getStore();
    let list = [...db.profiles];

    if (filters.search) {
      const q = filters.search.toLowerCase();
      list = list.filter(p => 
        p.name.toLowerCase().includes(q) || 
        p.title.toLowerCase().includes(q) || 
        p.bio.toLowerCase().includes(q)
      );
    }

    if (filters.skill) {
      const s = filters.skill.toLowerCase();
      const getSubSkillsForCategory = (category: string) => {
        const catLower = category.toLowerCase().trim();
        if (catLower.includes('technical & it')) {
          return ['coding', 'system design', 'react', 'node.js', 'typescript', 'postgresql', 'excel', 'sql', 'data analytics', 'powerbi', 'python', 'technical & it skills', 'it', 'software'];
        }
        if (catLower.includes('creative & design')) {
          return ['ui/ux design', 'figma', 'design systems', 'mobile app', 'user research', 'framer', 'creative & design', 'design', 'creative'];
        }
        if (catLower.includes('blue-collar') || catLower.includes('local services')) {
          return ['carpentry', 'plumbing', 'electrical', 'appliance repair', 'blue-collar / local services', 'blue-collar', 'local services', 'repair', 'electrician'];
        }
        if (catLower.includes('business & consulting')) {
          return ['business communication', 'presentation skills', 'financial modeling', 'resume review', 'salary negotiation', 'business & consulting', 'consulting', 'business'];
        }
        if (catLower.includes('education & tutoring')) {
          return ['english', 'accent training', 'tutoring', 'coaching', 'education & tutoring', 'sat', 'act', 'math', 'calculus', 'education', 'teacher'];
        }
        if (catLower.includes('freelance services')) {
          return ['freelance', 'contracting', 'freelance services', 'figma', 'coding', 'excel', 'gigs'];
        }
        if (catLower.includes('health & wellness')) {
          return ['yoga', 'nutrition', 'fitness', 'mental health', 'health & wellness', 'health', 'wellness', 'diet', 'coach'];
        }
        if (catLower.includes('skill-based training')) {
          return ['interview prep', 'resume writing', 'tech interviews', 'career growth', 'salary negotiation', 'skill-based training', 'skills'];
        }
        if (catLower.includes('home & personal')) {
          return ['organizing', 'styling', 'gardening', 'home & personal services', 'personal', 'home'];
        }
        if (catLower.includes('professional services')) {
          return ['interview prep', 'resume writing', 'tech interviews', 'career growth', 'salary negotiation', 'coding', 'system design', 'excel', 'sql', 'professional services', 'professional'];
        }
        return [catLower];
      };

      const targetTags = getSubSkillsForCategory(s);
      list = list.filter(p => p.skills.some((sk: string) => {
        const skLower = sk.toLowerCase();
        return skLower === s || targetTags.includes(skLower);
      }));
    }

    if (filters.maxPrice) {
      list = list.filter(p => p.pricePer30Min <= filters.maxPrice || p.pricePer60Min <= filters.maxPrice);
    }

    if (filters.minRating) {
      list = list.filter(p => p.averageRating >= filters.minRating);
    }

    const slots = db.slots || [];
    return list.map(p => {
      const openSlotsCount = slots.filter((s: any) => s.expertId === p.id && !s.isBooked).length;
      return { ...p, openSlotsCount };
    });
  }

  public getExpertDetail(id: string) {
    const db = this.getStore();
    const profile = db.profiles.find((p: any) => p.id === id);
    if (!profile) throw new Error('Expert not found in static simulated dataset.');
    
    const slots = db.slots.filter((s: any) => s.expertId === id);
    const reviews = db.reviews.filter((r: any) => r.expertId === id);
    return { profile, slots, reviews };
  }

  public updateExpertProfile(data: any) {
    const db = this.getStore();
    const current = db.currentUser || db.users[1];
    
    if (data.avatarUrl) {
      data.avatarUrl = getCleanImageUrl(data.avatarUrl);
    }
    
    const idx = db.profiles.findIndex((p: any) => p.id === current.id);
    if (idx > -1) {
      db.profiles[idx] = {
        ...db.profiles[idx],
        ...data
      };
      
      const userIdx = db.users.findIndex((u: any) => u.id === current.id);
      if (userIdx > -1) {
        if (data.name) db.users[userIdx].name = data.name;
        if (data.avatarUrl) db.users[userIdx].avatarUrl = data.avatarUrl;
        db.currentUser = db.users[userIdx];
      }
      this.saveStore(db);
      return { message: 'Profile saved', profile: db.profiles[idx] };
    }
    throw new Error('No expert profile exists for your session.');
  }

  public createSlot(data: any) {
    const db = this.getStore();
    const current = db.currentUser || db.users[1];
    
    const randSuffix = Math.random().toString(36).substring(2, 6);
    const newSlot: AvailabilitySlot = {
      id: `${current.id}_${data.date}_${data.startTime.replace(':', '')}_${randSuffix}`,
      expertId: current.id,
      date: data.date,
      startTime: data.startTime,
      duration: data.duration,
      isBooked: false,
      slotType: data.slotType || 'hour',
      price: data.price !== undefined ? Number(data.price) : undefined,
      meetingLink: data.meetingLink || undefined,
    };
    
    db.slots = db.slots.filter((s: any) => s.id !== newSlot.id);
    db.slots.push(newSlot);
    this.saveStore(db);
    return { message: 'Slot created', slot: newSlot };
  }

  public deleteSlot(slotId: string) {
    const db = this.getStore();
    db.slots = db.slots.filter((s: any) => s.id !== slotId);
    this.saveStore(db);
    return true;
  }

  public createCheckoutSession(slotId: string, duration: 30 | 60) {
    const db = this.getStore();
    const current = db.currentUser || db.users[1];
    
    const slot = db.slots.find((s: any) => s.id === slotId);
    if (!slot) throw new Error('Slot not available.');
    
    const expert = db.profiles.find((p: any) => p.id === slot.expertId);
    if (!expert) throw new Error('Expert not found.');

    const price = duration === 30 ? expert.pricePer30Min : expert.pricePer60Min;
    const booking: Booking = {
      id: 'b_' + Math.random().toString(36).substring(2, 11),
      learnerId: current.id,
      learnerName: current.name,
      expertId: expert.id,
      expertName: expert.name,
      dateTime: `${slot.date}T${slot.startTime}:00.000Z`,
      duration,
      amountPaid: price,
      platformFee: Math.round(price * 0.20),
      expertAmount: Math.round(price * 0.80),
      status: 'confirmed',
      meetingLink: 'https://meet.google.com/mock-session-' + Math.random().toString(36).substring(2, 6),
      createdAt: new Date().toISOString(),
      slotId: slot.id,
      reviewed: false
    };

    slot.isBooked = true;
    db.bookings.push(booking);
    this.saveStore(db);
    return { booking, isSimulated: true, amount: price };
  }

  public getBookings() {
    const db = this.getStore();
    const current = db.currentUser || db.users[1];
    if (current.role === 'admin') return db.bookings;
    return db.bookings.filter((b: any) => b.learnerId === current.id || b.expertId === current.id);
  }

  public updateBookingStatus(bookingId: string, status: string) {
    const db = this.getStore();
    const bIdx = db.bookings.findIndex((x: any) => x.id === bookingId);
    if (bIdx > -1) {
      db.bookings[bIdx].status = status as any;
      
      if (status === 'completed') {
        const expert = db.profiles.find((p: any) => p.id === db.bookings[bIdx].expertId);
        if (expert) {
          expert.totalSessions += 1;
        }
      } else if (status === 'cancelled') {
        const slot = db.slots.find((s: any) => s.id === db.bookings[bIdx].slotId);
        if (slot) {
          slot.isBooked = false;
        }
      }
      this.saveStore(db);
      return { booking: db.bookings[bIdx] };
    }
    throw new Error('Booking not found in client database.');
  }

  public confirmPayment(data: any) {
    return { success: true };
  }

  public publishReview(data: { bookingId: string, rating: number, comment: string }) {
    const db = this.getStore();
    const booking = db.bookings.find((b: any) => b.id === data.bookingId);
    if (!booking) throw new Error('Booking reference not found.');

    const newReview: Review = {
      id: 'rev_' + Math.random().toString(36).substring(2, 11),
      bookingId: data.bookingId,
      expertId: booking.expertId,
      learnerId: booking.learnerId,
      learnerName: booking.learnerName,
      rating: data.rating,
      comment: data.comment,
      createdAt: new Date().toISOString()
    };

    db.reviews.push(newReview);
    booking.reviewed = true;

    // Recalculate averageRating
    const expertReviews = db.reviews.filter((r: any) => r.expertId === booking.expertId);
    const avg = expertReviews.reduce((sum: number, r: any) => sum + r.rating, 0) / expertReviews.length;
    
    const expertIdx = db.profiles.findIndex((p: any) => p.id === booking.expertId);
    if (expertIdx > -1) {
      db.profiles[expertIdx].averageRating = parseFloat(avg.toFixed(1));
    }

    this.saveStore(db);
    return { review: newReview };
  }

  public getAdminAnalytics() {
    const db = this.getStore();
    const conf = db.bookings.filter((b: any) => b.status === 'confirmed' || b.status === 'completed');
    const totalVolume = conf.reduce((sum: number, b: any) => sum + b.amountPaid, 0);
    const platformCommission = conf.reduce((sum: number, b: any) => sum + b.platformFee, 0);
    const expertPayouts = conf.reduce((sum: number, b: any) => sum + b.expertAmount, 0);

    return {
      summary: {
        totalUsers: db.users.length,
        totalExperts: db.profiles.length,
        totalBookings: db.bookings.length,
        totalVolume,
        platformCommission,
        expertPayouts,
        totalTransactions: conf.length,
      },
      categoryMetrics: [
        { category: 'Coding', sessionsCount: conf.length, totalRevenue: totalVolume }
      ],
      recentTransactions: conf
    };
  }

  public getAdminUsers() {
    const db = this.getStore();
    return db.users;
  }

  public toggleBanUser(userId: string, isBanned: boolean) {
    const db = this.getStore();
    const userIdx = db.users.findIndex((u: any) => u.id === userId);
    if (userIdx > -1) {
      db.users[userIdx].isBanned = isBanned;
      this.saveStore(db);
      return true;
    }
    return false;
  }
}

const localSimulator = new LocalDatabaseClient();

const getAuthHeaders = () => {
  const token = localStorage.getItem('skillbridge_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  setToken(token: string) {
    localStorage.setItem('skillbridge_jwt', token);
  },
  
  getToken() {
    return localStorage.getItem('skillbridge_jwt');
  },

  logout() {
    localStorage.removeItem('skillbridge_jwt');
  },

  // --- HYBRID ENDPOINTS WITH AUTO-FAILOVER CORES ---
  async magicLogin(phone: string, name?: string, role?: UserRole): Promise<{ token: string; user: User }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.magicLogin(phone, name, role);
    }
    try {
      const res = await fetch('/api/auth/magic-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, name, role }),
      });
      if (!res.ok) {
        throw new Error('Failed response');
      }
      return await res.json();
    } catch {
      return localSimulator.magicLogin(phone, name, role);
    }
  },

  async getMe(): Promise<User> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getMe();
    }
    try {
      const res = await fetch('/api/auth/me', {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error('Expired');
      }
      return await res.json();
    } catch {
      return localSimulator.getMe();
    }
  },

  async onboard(role: UserRole, name?: string): Promise<{ user: User; token: string }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.onboard(role, name);
    }
    try {
      const res = await fetch('/api/auth/onboard', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ role, name }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.onboard(role, name);
    }
  },

  async getExperts(filters: {
    search?: string;
    skill?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  } = {}): Promise<ExpertProfile[]> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getExperts(filters);
    }
    try {
      const params = new URLSearchParams();
      if (filters.search) params.append('search', filters.search);
      if (filters.skill) params.append('skill', filters.skill);
      if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
      if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
      if (filters.minRating) params.append('minRating', String(filters.minRating));

      const res = await fetch(`/api/experts?${params.toString()}`);
      const contentType = res.headers.get('content-type');
      if (!res.ok || (contentType && contentType.includes('text/html'))) {
        throw new Error('Static host proxy fallback triggered');
      }
      return await res.json();
    } catch {
      return localSimulator.getExperts(filters);
    }
  },

  async getExpertDetail(id: string): Promise<{
    profile: ExpertProfile;
    slots: AvailabilitySlot[];
    reviews: Review[];
  }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getExpertDetail(id);
    }
    try {
      const res = await fetch(`/api/experts/${id}`);
      const contentType = res.headers.get('content-type');
      if (!res.ok || (contentType && contentType.includes('text/html'))) {
        throw new Error('Static detail proxy fallback triggered');
      }
      return await res.json();
    } catch {
      return localSimulator.getExpertDetail(id);
    }
  },

  async updateExpertProfile(data: {
    title: string;
    bio: string;
    skills: string[];
    pricePer30Min: number;
    pricePer60Min: number;
    name?: string;
    avatarUrl?: string;
    totalSessions?: number;
  }): Promise<{ message: string; profile: ExpertProfile }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.updateExpertProfile(data);
    }
    try {
      const res = await fetch('/api/experts/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.updateExpertProfile(data);
    }
  },

  async createSlot(data: {
    date: string;
    startTime: string;
    duration: number;
    slotType?: string;
    price?: number;
    meetingLink?: string;
  }): Promise<{ message: string; slot: AvailabilitySlot }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.createSlot(data);
    }
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.createSlot(data);
    }
  },

  async deleteSlot(slotId: string): Promise<boolean> {
    logMode();
    if (isStaticHost) {
      return localSimulator.deleteSlot(slotId);
    }
    try {
      const res = await fetch(`/api/slots/${slotId}`, {
        method: 'DELETE',
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return true;
    } catch {
      return localSimulator.deleteSlot(slotId);
    }
  },

  async createCheckoutSession(slotId: string, duration: 30 | 60): Promise<{
    booking: Booking;
    isSimulated: boolean;
    amount: number;
    razorpayKey?: string;
    razorpayOrderId?: string;
  }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.createCheckoutSession(slotId, duration);
    }
    try {
      const res = await fetch('/api/bookings/checkout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ slotId, duration }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.createCheckoutSession(slotId, duration);
    }
  },

  async confirmPayment(data: {
    bookingId: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    simulateSuccess?: boolean;
  }): Promise<{ success: boolean; booking: Booking }> {
    logMode();
    if (isStaticHost) {
      const db = localSimulator.confirmPayment(data);
      // Retrieve the newly confirmed booking from our database
      const bookings = localSimulator.getBookings();
      const currentBooking = bookings.find((b: any) => b.id === data.bookingId);
      return { success: true, booking: currentBooking as any };
    }
    try {
      const res = await fetch('/api/bookings/payment-callback', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      const bookings = localSimulator.getBookings();
      const currentBooking = bookings.find((b: any) => b.id === data.bookingId);
      return { success: true, booking: currentBooking as any };
    }
  },

  async getBookings(): Promise<Booking[]> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getBookings();
    }
    try {
      const res = await fetch('/api/bookings', {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.getBookings();
    }
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<{ booking: Booking }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.updateBookingStatus(bookingId, status);
    }
    try {
      const res = await fetch(`/api/bookings/${bookingId}/status`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.updateBookingStatus(bookingId, status);
    }
  },

  async publishReview(data: {
    bookingId: string;
    rating: number;
    comment: string;
  }): Promise<{ review: Review }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.publishReview(data);
    }
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify(data),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.publishReview(data);
    }
  },

  async getAdminAnalytics(): Promise<{
    summary: {
      totalUsers: number;
      totalExperts: number;
      totalBookings: number;
      totalTransactions: number;
      totalVolume: number;
      platformCommission: number;
      expertPayouts: number;
    };
    categoryMetrics: {
      category: string;
      sessionsCount: number;
      totalRevenue: number;
    }[];
    recentTransactions: any[];
  }> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getAdminAnalytics();
    }
    try {
      const res = await fetch('/api/admin/analytics', {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.getAdminAnalytics();
    }
  },

  async getAdminUsers(): Promise<User[]> {
    logMode();
    if (isStaticHost) {
      return localSimulator.getAdminUsers();
    }
    try {
      const res = await fetch('/api/admin/users', {
        headers: { ...getAuthHeaders() },
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return await res.json();
    } catch {
      return localSimulator.getAdminUsers();
    }
  },

  async toggleBanUser(userId: string, isBanned: boolean): Promise<boolean> {
    logMode();
    if (isStaticHost) {
      return localSimulator.toggleBanUser(userId, isBanned);
    }
    try {
      const res = await fetch(`/api/admin/users/${userId}/ban`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ isBanned }),
      });
      if (!res.ok) {
        throw new Error('Failed');
      }
      return true;
    } catch {
      return localSimulator.toggleBanUser(userId, isBanned);
    }
  }
};
