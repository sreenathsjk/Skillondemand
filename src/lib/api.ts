/**
 * Highly polished full-stack API client for SkillBridge
 */

import { User, ExpertProfile, AvailabilitySlot, Booking, Review, UserRole } from '../types';

const getAuthHeaders = () => {
  const token = localStorage.getItem('skillbridge_jwt');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
};

export const api = {
  // --- STORAGE HELPERS ---
  setToken(token: string) {
    localStorage.setItem('skillbridge_jwt', token);
  },
  
  getToken() {
    return localStorage.getItem('skillbridge_jwt');
  },

  logout() {
    localStorage.removeItem('skillbridge_jwt');
  },

  // --- AUTH ENDPOINTS ---
  async magicLogin(email: string, name?: string, role?: UserRole): Promise<{ token: string; user: User }> {
    const res = await fetch('/api/auth/magic-login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name, role }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Login session failed to establish.');
    }
    return res.json();
  },

  async getMe(): Promise<User> {
    const res = await fetch('/api/auth/me', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      throw new Error('Authentication expired. Please log in again.');
    }
    return res.json();
  },

  async onboard(role: UserRole, name?: string): Promise<{ user: User; token: string }> {
    const res = await fetch('/api/auth/onboard', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ role, name }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to complete custom onboarding.');
    }
    return res.json();
  },

  // --- EXPERT PROFILE DIRECTORY ---
  async getExperts(filters: {
    search?: string;
    skill?: string;
    minPrice?: number;
    maxPrice?: number;
    minRating?: number;
  } = {}): Promise<ExpertProfile[]> {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.skill) params.append('skill', filters.skill);
    if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
    if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));
    if (filters.minRating) params.append('minRating', String(filters.minRating));

    const res = await fetch(`/api/experts?${params.toString()}`);
    if (!res.ok) {
      throw new Error('Expert catalog could not be loaded at this time.');
    }
    return res.json();
  },

  async getExpertDetail(id: string): Promise<{
    profile: ExpertProfile;
    slots: AvailabilitySlot[];
    reviews: Review[];
  }> {
    const res = await fetch(`/api/experts/${id}`);
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Expert profile details could not be found.');
    }
    return res.json();
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
    const res = await fetch('/api/experts/profile', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Profile save operation failed.');
    }
    return res.json();
  },

  // --- SLOTS MANAGEMENT ---
  async createSlot(data: {
    date: string;
    startTime: string;
    duration: number;
  }): Promise<{ message: string; slot: AvailabilitySlot }> {
    const res = await fetch('/api/slots', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Failed to create availability slot.');
    }
    return res.json();
  },

  async deleteSlot(slotId: string): Promise<boolean> {
    const res = await fetch(`/api/slots/${slotId}`, {
      method: 'DELETE',
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Slot cannot be deleted.');
    }
    return true;
  },

  // --- BOOKING SYSTEM ---
  async createCheckoutSession(slotId: string, duration: 30 | 60): Promise<{
    booking: Booking;
    isSimulated: boolean;
    amount: number;
    razorpayKey?: string;
    razorpayOrderId?: string;
  }> {
    const res = await fetch('/api/bookings/checkout', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ slotId, duration }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Time slot locking process failed.');
    }
    return res.json();
  },

  async confirmPayment(data: {
    bookingId: string;
    razorpayPaymentId?: string;
    razorpayOrderId?: string;
    razorpaySignature?: string;
    simulateSuccess?: boolean;
  }): Promise<{ success: boolean; booking: Booking }> {
    const res = await fetch('/api/bookings/payment-callback', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Payment confirmation validation failed.');
    }
    return res.json();
  },

  async getBookings(): Promise<Booking[]> {
    const res = await fetch('/api/bookings', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      throw new Error('Your bookings list failed to load.');
    }
    return res.json();
  },

  async updateBookingStatus(bookingId: string, status: string): Promise<{ booking: Booking }> {
    const res = await fetch(`/api/bookings/${bookingId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ status }),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Status change is unauthorized.');
    }
    return res.json();
  },

  // --- REVIEW SYSTEM ---
  async publishReview(data: {
    bookingId: string;
    rating: number;
    comment: string;
  }): Promise<{ review: Review }> {
    const res = await fetch('/api/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Feedback post was rejected.');
    }
    return res.json();
  },

  // --- ADMIN MODULE ---
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
    const res = await fetch('/api/admin/analytics', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      throw new Error('Admin analytics loading failed.');
    }
    return res.json();
  },

  async getAdminUsers(): Promise<User[]> {
    const res = await fetch('/api/admin/users', {
      headers: { ...getAuthHeaders() },
    });
    if (!res.ok) {
      throw new Error('User audit directory loading failed.');
    }
    return res.json();
  },

  async toggleBanUser(userId: string, isBanned: boolean): Promise<boolean> {
    const res = await fetch(`/api/admin/users/${userId}/ban`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ isBanned }),
    });
    if (!res.ok) {
      throw new Error('Failed to ban/unban target user.');
    }
    return true;
  }
};
