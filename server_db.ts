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
    email: 'learner1@example.com',
    name: 'James Walker',
    role: 'learner',
    avatarUrl: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-10').toISOString(),
  },
  {
    id: 'u_learner2',
    email: 'content2u.sj@gmail.com', // Admin and testing user from runtime
    name: 'Sarah Jordan',
    role: 'learner',
    avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-12').toISOString(),
  },
  {
    id: 'u_expert1',
    email: 'johndoe@example.com',
    name: 'John Doe',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-01').toISOString(),
  },
  {
    id: 'u_expert2',
    email: 'priyasharma@example.com',
    name: 'Priya Sharma',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-02').toISOString(),
  },
  {
    id: 'u_expert3',
    email: 'sarahjenkins@example.com',
    name: 'Sarah Jenkins',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-03').toISOString(),
  },
  {
    id: 'u_expert4',
    email: 'alexmercer@example.com',
    name: 'Alex Mercer',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-04').toISOString(),
  },
  {
    id: 'u_expert5',
    email: 'marcusthorne@example.com',
    name: 'Marcus Thorne',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-05').toISOString(),
  },
  {
    id: 'u_expert6',
    email: 'rameshkumar@example.com',
    name: 'Ramesh Kumar',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-06').toISOString(),
  },
  {
    id: 'u_expert7',
    email: 'emilystone@example.com',
    name: 'Dr. Emily Stone',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-07').toISOString(),
  },
  {
    id: 'u_expert8',
    email: 'davidchen@example.com',
    name: 'David Chen',
    role: 'expert',
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-08').toISOString(),
  },
  {
    id: 'u_admin1',
    email: 'admin@skillondemand.io',
    name: 'SkillOnDemand Admin',
    role: 'admin',
    avatarUrl: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=150&h=150&q=80',
    createdAt: new Date('2026-01-01').toISOString(),
  }
];

const SEED_PROFILES: ExpertProfile[] = [
  {
    id: 'u_expert1',
    name: 'John Doe',
    email: 'johndoe@example.com',
    title: 'Senior Software Architect @ Google',
    bio: 'Over 12 years of core development experience building search pipelines and low-latency API architectures. Ask me about React/Vite optimizations, scaling Express/Node setups, TypeScript safety, database modeling, and technical system design reviews.',
    skills: ['Coding', 'System Design', 'React', 'Node.js', 'TypeScript', 'PostgreSQL', 'Technical & IT Skills', 'Freelance Services', 'Professional Services'],
    pricePer30Min: 1500,
    pricePer60Min: 2800,
    averageRating: 4.8,
    totalSessions: 142,
    avatarUrl: 'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  },
  {
    id: 'u_expert2',
    name: 'Priya Sharma',
    email: 'priyasharma@example.com',
    title: 'Lead Data Architect & Excel Wizard',
    bio: 'Struggling with complex spreadsheet templates, lookup macros, power query setups, or relational SQL modeling? I am a Lead Data Architect specializing in converting unorganized business inputs into high-impact visual interactive dashboards.',
    skills: ['Excel', 'SQL', 'Data Analytics', 'PowerBI', 'Python', 'Financial Modeling', 'Technical & IT Skills', 'Professional Services', 'Freelance Services'],
    pricePer30Min: 1000,
    pricePer60Min: 1800,
    averageRating: 4.9,
    totalSessions: 89,
    avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  },
  {
    id: 'u_expert3',
    name: 'Sarah Jenkins',
    email: 'sarahjenkins@example.com',
    title: 'Executive English & Business Pitch Coach',
    bio: 'Former BBC analyst and professional speech advisor. I will polish your executive pitch deck flow, enhance business email etiquette, train proper business accents, and prepare you to present flawlessly to global venture capitalists and directors.',
    skills: ['English', 'Accent Training', 'Business Communication', 'Presentation Skills', 'Resume Review', 'Education & Tutoring', 'Business & Consulting', 'Professional Services'],
    pricePer30Min: 1200,
    pricePer60Min: 2200,
    averageRating: 4.7,
    totalSessions: 215,
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=150&h=150&q=80',
    featured: false,
  },
  {
    id: 'u_expert4',
    name: 'Alex Mercer',
    email: 'alexmercer@example.com',
    title: 'Principal Product Designer @ Airbnb',
    bio: 'Building user-centric, responsive, beautiful mobile-first experiences. Reach out for surgical portfolio inspections, constructive Figma workspace design reviews, color system layouts, and interactive micro-animations counseling.',
    skills: ['UI/UX Design', 'Figma', 'Design Systems', 'Mobile App', 'User Research', 'Framer', 'Creative & Design', 'Freelance Services', 'Skill-Based Training'],
    pricePer30Min: 1400,
    pricePer60Min: 2500,
    averageRating: 4.9,
    totalSessions: 67,
    avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  },
  {
    id: 'u_expert5',
    name: 'Marcus Thorne',
    email: 'marcusthorne@example.com',
    title: 'Ex-Meta Lead Recruiter & Interview Coach',
    bio: 'Having scanned over 50k resumes, I know exactly what companies search for. Let us run simulated mock behavioral questions, deep tech architecture trial prep, and resume rewriting workshops to push past resume tracking screening systems.',
    skills: ['Interview Prep', 'Resume Writing', 'Tech Interviews', 'Career Growth', 'Salary Negotiation', 'Business & Consulting', 'Skill-Based Training', 'Professional Services'],
    pricePer30Min: 1800,
    pricePer60Min: 3200,
    averageRating: 5.0,
    totalSessions: 312,
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  },
  {
    id: 'u_expert6',
    name: 'Ramesh Kumar',
    email: 'rameshkumar@example.com',
    title: 'Master Electrician & Smart Home Automation expert',
    bio: 'With over 15 years servicing urban complexes, I diagnose complex electrical distribution issues, consult on home automation standards, and coach junior technicians on electrical code compliance, residential safety, and smart grids.',
    skills: ['Electrical', 'Appliance Repair', 'Blue-Collar / Local Services', 'Home & Personal Services', 'Professional Services'],
    pricePer30Min: 800,
    pricePer60Min: 1500,
    averageRating: 4.8,
    totalSessions: 94,
    avatarUrl: 'https://images.unsplash.com/photo-1540569014015-19a7be504e3a?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  },
  {
    id: 'u_expert7',
    name: 'Dr. Emily Stone',
    email: 'emilystone@example.com',
    title: 'Professional SAT/ACT Math and Calculus Tutor',
    bio: 'Guiding high school and university students to perfect quantitative assessment scores. I structure customized math training frameworks, offer surgical concept coaching in real analysis/geometry, and deliver test-taking speed drills.',
    skills: ['Math', 'Calculus', 'Tutoring', 'Education & Tutoring', 'Skill-Based Training', 'Professional Services'],
    pricePer30Min: 900,
    pricePer60Min: 1650,
    averageRating: 4.9,
    totalSessions: 182,
    avatarUrl: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&h=150&q=80',
    featured: false,
  },
  {
    id: 'u_expert8',
    name: 'David Chen',
    email: 'davidchen@example.com',
    title: 'Holistic Wellness & Strength Conditioning Coach',
    bio: 'Certified nutrition specialist and somatic mindfulness counselor. I build targeted weight optimization dietary guidelines, custom posture recovery drills, and breathing flow sessions intended for professionals spending long hours in seating hubs.',
    skills: ['Yoga', 'Nutrition', 'Health & Wellness', 'Home & Personal Services', 'Professional Services'],
    pricePer30Min: 1100,
    pricePer60Min: 2000,
    averageRating: 5.0,
    totalSessions: 53,
    avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&h=150&q=80',
    featured: true,
  }
];

// Helper to generate dynamic slot dates
const getFutureDateString = (offsetDays: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  return d.toISOString().split('T')[0];
};

const SEED_SLOTS: AvailabilitySlot[] = [];
// Generate initial slot list
['u_expert1', 'u_expert2', 'u_expert3', 'u_expert4', 'u_expert5', 'u_expert6', 'u_expert7', 'u_expert8'].forEach((expertId) => {
  for (let day = 1; day <= 5; day++) {
    const dateStr = getFutureDateString(day);
    // Add morning slot
    SEED_SLOTS.push({
      id: `${expertId}_${dateStr}_1000`,
      expertId,
      date: dateStr,
      startTime: '10:00',
      duration: 30,
      isBooked: false,
    });
    // Add mid-day slot
    SEED_SLOTS.push({
      id: `${expertId}_${dateStr}_1400`,
      expertId,
      date: dateStr,
      startTime: '14:00',
      duration: 60,
      isBooked: false,
    });
    // Add evening slot
    SEED_SLOTS.push({
      id: `${expertId}_${dateStr}_1630`,
      expertId,
      date: dateStr,
      startTime: '16:30',
      duration: 30,
      isBooked: false,
    });
  }
});

const SEED_BOOKINGS: Booking[] = [
  {
    id: 'b_completed1',
    learnerId: 'u_learner1',
    learnerName: 'James Walker',
    expertId: 'u_expert1',
    expertName: 'John Doe',
    dateTime: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
    duration: 30,
    amountPaid: 1500,
    platformFee: 305,
    expertAmount: 1195,
    status: 'completed',
    meetingLink: 'https://meet.google.com/abc-defg-hij',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
    slotId: 'u_expert1_old_slot',
    orderId: 'order_completed_1',
    paymentId: 'pay_completed_1',
    reviewed: true,
  },
  {
    id: 'b_upcoming1',
    learnerId: 'u_learner1',
    learnerName: 'James Walker',
    expertId: 'u_expert2',
    expertName: 'Priya Sharma',
    dateTime: getFutureDateString(2) + 'T14:00:00.000Z', // 2 days later
    duration: 60,
    amountPaid: 1800,
    platformFee: 360,
    expertAmount: 1440,
    status: 'confirmed',
    meetingLink: 'https://meet.google.com/xyz-qprs-tuv',
    createdAt: new Date().toISOString(),
    slotId: 'u_expert2_upcoming_slot_1',
    orderId: 'order_upcoming_1',
    paymentId: 'pay_upcoming_1',
    reviewed: false,
  }
];

const SEED_REVIEWS: Review[] = [
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

const SEED_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx_1',
    bookingId: 'b_completed1',
    amount: 1500,
    platformCommission: 300,
    expertPayout: 1200,
    status: 'captured',
    learnerName: 'James Walker',
    expertName: 'John Doe',
    createdAt: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(),
  },
  {
    id: 'tx_2',
    bookingId: 'b_upcoming1',
    amount: 1800,
    platformCommission: 360,
    expertPayout: 1440,
    status: 'captured',
    learnerName: 'James Walker',
    expertName: 'Priya Sharma',
    createdAt: new Date().toISOString(),
  }
];

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
          this.data.profiles.push({
            id: u.id,
            name: u.name,
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
    return this.data.users.find(u => u.email.toLowerCase() === emailLower);
  }

  public registerUser(email: string, name: string, role: string, avatarUrl?: string): User {
    const emailLower = email.toLowerCase().trim();
    const existing = this.getUserByEmail(emailLower);
    if (existing) {
      return existing;
    }

    const newUser: User = {
      id: 'u_' + Math.random().toString(36).substring(2, 11),
      email: emailLower,
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
        email: newUser.email,
        title: 'Industry Expert',
        bio: 'Instantly booked time on-demand provider.',
        skills: ['General Expert'],
        pricePer30Min: 1000,
        pricePer60Min: 1800,
        averageRating: 5.0,
        totalSessions: 0,
        avatarUrl: newUser.avatarUrl || '',
      };
      this.data.profiles.push(newProfile);
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
