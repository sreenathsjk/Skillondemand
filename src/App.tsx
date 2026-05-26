import React, { useState, useEffect } from 'react';
import { User, ExpertProfile, AvailabilitySlot, Review } from './types';
import { api } from './lib/api';
import Navbar from './components/Navbar';
import ExpertCard from './components/ExpertCard';
import BookingModal from './components/BookingModal';
import LearnerDashboard from './components/LearnerDashboard';
import ExpertDashboard from './components/ExpertDashboard';
import AdminDashboard from './components/AdminDashboard';
import { 
  Sparkles, Search, SlidersHorizontal, Star, ShieldCheck, 
  MapPin, Clock, Tag, Award, CheckCircle2, ChevronRight, UserPlus, X, ArrowLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function App() {
  // Authentication states
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showOnboardModal, setShowOnboardModal] = useState(false);
  const [authEmail, setAuthEmail] = useState(''); // Email starts clean
  const [authName, setAuthName] = useState('');
  const [authRole, setAuthRole] = useState<'learner' | 'expert'>('learner');
  const [authError, setAuthError] = useState<string | null>(null);

  // Main navigation & listings
  const [activeTab, setActiveTab] = useState<string>('explore'); // explore, learner_dashboard, expert_dashboard, admin_dashboard
  const [experts, setExperts] = useState<ExpertProfile[]>([]);
  const [selectedExpert, setSelectedExpert] = useState<{
    profile: ExpertProfile;
    slots: AvailabilitySlot[];
    reviews: Review[];
  } | null>(null);

  // Filters state
  const [search, setSearch] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string>('');
  const [maxPrice, setMaxPrice] = useState<number>(5000);
  const [minRating, setMinRating] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [isHoveringCard, setIsHoveringCard] = useState(false);

  // Scheduling trigger
  const [openBooking, setOpenBooking] = useState(false);

  // Initial user check
  const checkSession = async () => {
    const token = api.getToken();
    if (token) {
      try {
        const u = await api.getMe();
        setCurrentUser(u);
      } catch (e) {
        // stale token
        api.logout();
      }
    }
  };

  const loadExperts = async () => {
    setLoading(true);
    try {
      const list = await api.getExperts({
        search: search || undefined,
        skill: selectedSkill || undefined,
        maxPrice: maxPrice || undefined,
        minRating: minRating || undefined,
      });
      setExperts(list);
    } catch (e) {
      console.error('Failed to query experts list', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    loadExperts();
  }, [search, selectedSkill, maxPrice, minRating]);

  // Handle selected expert details display
  const handleSelectExpert = async (id: string) => {
    try {
      const details = await api.getExpertDetail(id);
      setSelectedExpert(details);
      // Allow rendering to finish and scroll directly to the expert detail top anchor
      setTimeout(() => {
        const el = document.getElementById('expert-detail-top');
        if (el) {
          el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        } else {
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      }, 50);
    } catch (e: any) {
      alert(e.message || 'Error pulling expert scheduling tags.');
    }
  };

  // Instant login simulation
  const handleMagicLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);
    if (!authEmail) {
      setAuthError('Please submit a clean email address.');
      return;
    }

    try {
      const resp = await api.magicLogin(authEmail, authName || undefined, authRole);
      api.setToken(resp.token);
      setCurrentUser(resp.user);
      setShowOnboardModal(false); // Close the onboarding modal on success
      
      // Auto switch tabs
      if (resp.user.role === 'expert') {
        setActiveTab('expert_dashboard');
      } else if (resp.user.role === 'admin') {
        setActiveTab('admin_dashboard');
      } else {
        setActiveTab('explore');
      }
    } catch (err: any) {
      setAuthError(err.message || 'Login failed to execute.');
    }
  };

  // Onboarding Switch
  const handleOnboardRoleSelected = async (targetRole: 'learner' | 'expert') => {
    if (!currentUser) return;
    try {
      const resp = await api.onboard(targetRole, currentUser.name);
      api.setToken(resp.token);
      setCurrentUser(resp.user);
      if (targetRole === 'expert') {
        setActiveTab('expert_dashboard');
      } else {
        setActiveTab('explore');
      }
    } catch (e) {
      console.error('Onboard error', e);
    }
  };

  // Dynamic role triggers from navigation
  const handleAdminTestingRoleSwitch = async (targetRole: any) => {
    if (!currentUser) return;
    try {
      const resp = await api.onboard(targetRole, currentUser.name);
      api.setToken(resp.token);
      setCurrentUser(resp.user);
      if (targetRole === 'expert') {
        setActiveTab('expert_dashboard');
      } else if (targetRole === 'admin') {
        setActiveTab('admin_dashboard');
      } else {
        setActiveTab('explore');
      }
    } catch (e) {
      console.error('Role switch error', e);
    }
  };

  const handleLogout = () => {
    api.logout();
    setCurrentUser(null);
    setSelectedExpert(null);
    setActiveTab('explore');
  };

  const clearFilters = () => {
    setSearch('');
    setSelectedSkill('');
    setMaxPrice(5000);
    setMinRating(0);
  };

  const POPULAR_SKILLS = [
    'Technical & IT Skills',
    'Creative & Design',
    'Blue-Collar / Local Services',
    'Business & Consulting',
    'Education & Tutoring',
    'Freelance Services',
    'Health & Wellness',
    'Skill-Based Training',
    'Home & Personal Services',
    'Professional Services'
  ];

  return (
    <div className="min-h-screen bg-slate-50/40 text-slate-800 flex flex-col font-sans">
      
      {/* Top Navigation banner header */}
      <Navbar
        currentUser={currentUser}
        onLogout={handleLogout}
        onRoleSwitch={handleAdminTestingRoleSwitch}
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOnboardClick={() => {
          setAuthError(null);
          setShowOnboardModal(true);
        }}
      />

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-8">
        
        {activeTab === 'learner_dashboard' && currentUser?.role === 'learner' && (
          <LearnerDashboard onWriteReviewSuccess={loadExperts} />
        )}

        {activeTab === 'expert_dashboard' && currentUser?.role === 'expert' && (
          <ExpertDashboard 
            expertProfile={selectedExpert?.profile?.id === currentUser.id ? selectedExpert.profile : experts.find(p => p.id === currentUser.id) || null} 
            onProfileUpdated={() => {
              checkSession();
              loadExperts();
            }} 
          />
        )}

        {activeTab === 'admin_dashboard' && currentUser?.role === 'admin' && (
          <AdminDashboard />
        )}

        {activeTab === 'explore' && (
          <div className="space-y-12 animate-in fade-in duration-300">
            
            {/* Hero Greeting Section / Sign In onboarding controls */}
            {!currentUser ? (
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 text-white rounded-3xl border border-slate-800 p-6 md:p-12 text-left relative overflow-hidden shadow-xl shadow-slate-900/10">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,63,94,0.14),transparent_50%)] pointer-events-none" />
                
                <div className="relative z-10 space-y-5 max-w-3xl">
                  <div className="inline-flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/30 text-rose-300 px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider uppercase">
                    <Sparkles className="h-3.5 w-3.5" /> Instant Expert Help
                  </div>
                  
                  <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight font-sans">
                    Instantly Consult with Curated Industry Experts.
                  </h1>
                  
                  <p className="text-sm md:text-base text-slate-300 leading-relaxed font-normal">
                    Solve tough coding bugs, build Excel spreadsheet power queries, train English presentation formats, or undergo mock recruit trial questions. Lock an on-demand **30–60 minute session** in seconds.
                  </p>

                  <div className="pt-2">
                    <button
                      onClick={() => {
                        setAuthError(null);
                        setShowOnboardModal(true);
                      }}
                      className="bg-white hover:bg-rose-500 text-slate-900 hover:text-white font-bold text-xs py-3 px-6 rounded-xl transition-all cursor-pointer shadow-md shadow-white/5 hover:scale-[1.02] active:scale-95 inline-flex items-center gap-2"
                      id="trigger-onboard-modal-btn"
                    >
                      <ShieldCheck className="h-4 w-4 text-rose-500 hover:text-white transition-colors" />
                      <span>Authenticated onboarding call</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              /* Signed-in mini welcome banners */
              <div className="bg-slate-900 text-white rounded-3xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="text-left space-y-1">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-400 font-bold">● Active Portal Workspace</span>
                  <p className="text-lg font-black font-sans leading-none tracking-tight">
                    Welcome back, {currentUser.name}!
                  </p>
                  <p className="text-xs text-slate-400">
                    You are logged in as a <span className="text-rose-400 font-semibold">{currentUser.role}</span>. Select experts from the directory below to scheduled instant consultation sessions.
                  </p>
                </div>

                <div className="flex gap-1.5 bg-slate-800 p-1 rounded-xl">
                  <button
                    onClick={() => handleOnboardRoleSelected('learner')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      currentUser.role === 'learner' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Learner Profile
                  </button>
                  <button
                    onClick={() => handleOnboardRoleSelected('expert')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      currentUser.role === 'expert' ? 'bg-rose-600 text-white' : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    Expert Profile
                  </button>
                </div>
              </div>
            )}

            {/* Dynamic filters area */}
            <div className="space-y-4 text-left select-none">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-950 font-sans tracking-tight">
                    Curated Expert Directory
                  </h2>
                  <p className="text-xs text-slate-500">
                    Find and book verified industry experts based on matching skillsets, rating standards, or price tags.
                  </p>
                </div>

                {/* Search Bar Inputs */}
                <div className="relative w-full md:max-w-xs shrink-0">
                  <input
                    type="text"
                    placeholder="Search name, skills or biography..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full text-xs p-3 pl-9 rounded-xl border border-slate-200 bg-white shadow-xs focus:ring-1 focus:ring-rose-500 focus:outline-hidden"
                  />
                  <Search className="absolute left-3.5 top-3.5 text-slate-400 h-4 w-4" />
                </div>
              </div>

              {/* Clickable Quick Skills Buttons */}
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setSelectedSkill('')}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-colors cursor-pointer border ${
                    selectedSkill === '' 
                      ? 'bg-rose-500 text-white border-rose-500' 
                      : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                  }`}
                >
                  All Categories
                </button>
                {POPULAR_SKILLS.map((sk) => (
                  <button
                    key={sk}
                    onClick={() => setSelectedSkill(sk)}
                    className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all duration-200 cursor-pointer border ${
                      selectedSkill === sk
                        ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                        : 'bg-white text-slate-600 border-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {sk}
                  </button>
                ))}
              </div>

              {/* Fine Filtering widgets */}
              <div className="flex flex-wrap gap-3 items-center bg-white p-4 rounded-2xl border border-slate-100 shadow-xs text-xs">
                <div className="flex items-center gap-1.5 text-slate-400 font-mono font-bold uppercase text-[10px]">
                  <SlidersHorizontal className="h-4 w-4" /> Filters panel:
                </div>
                
                {/* Price range */}
                <div className="flex items-center gap-2">
                  <span className="text-slate-500 font-medium">Max session price:</span>
                  <input
                    type="range"
                    min="500"
                    max="5000"
                    step="100"
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="cursor-pointer accent-rose-500"
                  />
                  <span className="font-bold text-rose-600 font-mono">₹{maxPrice}</span>
                </div>

                {/* Rating filter */}
                <div className="flex items-center gap-2 ml-4">
                  <span className="text-slate-500 font-medium">Min Rating:</span>
                  <div className="flex gap-1">
                    {[0, 4, 4.5, 4.8].map((rat) => (
                      <button
                        key={rat}
                        onClick={() => setMinRating(rat)}
                        className={`px-2 py-0.5 rounded-md border text-[10px] font-bold cursor-pointer transition-colors ${
                          minRating === rat 
                            ? 'bg-slate-100 text-slate-900 border-slate-300' 
                            : 'bg-white text-slate-500 border-slate-100 hover:border-slate-300'
                        }`}
                      >
                        {rat === 0 ? 'Any' : `${rat}★+`}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="ml-auto text-slate-400 hover:text-rose-500 font-bold tracking-wide uppercase text-[10px] p-1 h-fit cursor-pointer"
                >
                  Reset filters
                </button>
              </div>
            </div>

            {selectedExpert ? (
              /* DEDICATED FULL-SCREEN EXPERT DETAIL "PAGE" VIEW */
              <div id="expert-detail-top" className="scroll-mt-6 space-y-8 animate-in fade-in slide-in-from-bottom-3 duration-300 text-left">
                {/* Back navigation header */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-5">
                  <button
                    onClick={() => setSelectedExpert(null)}
                    className="flex items-center gap-2 text-xs font-bold text-slate-700 hover:text-slate-950 bg-white border border-slate-200 hover:bg-slate-50 p-2.5 px-4 rounded-xl transition-all shadow-xs cursor-pointer select-none"
                    id="back-to-directory-btn"
                  >
                    <ArrowLeft className="h-4 w-4 text-rose-500 animate-pulse" />
                    <span>Back to Expert Directory</span>
                  </button>
                  <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold">
                    Profile Detail Page
                  </span>
                </div>

                {/* Main page content grids */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start animate-in fade-in duration-200">
                  
                  {/* Left Column: Portrait Hero, Biography & Reviews */}
                  <div className="lg:col-span-2 space-y-6">
                    {/* Portrait Hero Card */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs flex flex-col sm:flex-row gap-6 items-center sm:items-start text-center sm:text-left">
                      <img
                        src={selectedExpert.profile.avatarUrl}
                        alt={selectedExpert.profile.name}
                        referrerPolicy="no-referrer"
                        className="h-24 w-24 sm:h-28 sm:w-28 rounded-2xl object-cover bg-slate-50 border border-slate-100 shadow-xs shrink-0"
                        id="expert-detail-avatar"
                      />
                      <div className="space-y-4 flex-1">
                        <div>
                          <h1 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight font-sans">
                            {selectedExpert.profile.name}
                          </h1>
                          <p className="text-xs font-mono font-bold text-rose-500 mt-1 uppercase tracking-wider">
                            {selectedExpert.profile.title}
                          </p>
                        </div>

                        {/* Ratings + Metrics row */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs font-medium text-slate-600">
                          <div className="flex items-center gap-1 bg-amber-50 rounded-lg p-1.5 px-2.5 border border-amber-100/60 font-bold">
                            <Star className="h-4 w-4 text-amber-500 fill-amber-305 stroke-none" />
                            <span>{selectedExpert.profile.averageRating.toFixed(1)} Rating Score</span>
                          </div>
                          <div className="bg-slate-50 rounded-lg p-1.5 px-2.5 border border-slate-100">
                            <span className="font-extrabold text-slate-800">{selectedExpert.profile.totalSessions}</span> meetings fulfilled
                          </div>
                        </div>

                        {/* Interactive Skills tag list */}
                        <div className="space-y-2">
                          <span className="text-[9px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                            Primary advisory skills
                          </span>
                          <div className="flex flex-wrap gap-1.5 justify-center sm:justify-start">
                            {selectedExpert.profile.skills.map((skill) => (
                              <span 
                                key={skill}
                                className="bg-slate-100/95 border border-slate-200/40 text-[10px] text-slate-700 font-semibold px-2.5 py-1 rounded-lg"
                              >
                                {skill}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Biography block card */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-4">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                        ● Comprehensive Consultant Biography
                      </h3>
                      <p className="text-sm text-slate-600 leading-relaxed font-normal whitespace-pre-wrap">
                        {selectedExpert.profile.bio}
                      </p>
                    </div>

                    {/* Historical Reviews and Ratings list card */}
                    <div className="bg-white rounded-3xl border border-slate-100 p-6 md:p-8 shadow-xs space-y-6">
                      <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400">
                        ● Client Learner Reviews ({selectedExpert.reviews.length})
                      </h3>

                      {selectedExpert.reviews.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200 text-slate-400 text-xs">
                          No rating reviews recorded for this expert yet. Complete a session to drop feedback!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedExpert.reviews.map((rev) => (
                            <div key={rev.id} className="bg-slate-50 border border-slate-100/80 p-4 rounded-2xl space-y-2 text-left">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-xs font-extrabold text-slate-900 block">
                                    {rev.learnerName}
                                  </span>
                                  <span className="text-[9px] text-slate-400 font-mono">
                                    {new Date(rev.createdAt).toLocaleDateString()}
                                  </span>
                                </div>
                                <div className="flex gap-0.5">
                                  {Array.from({ length: rev.rating }).map((_, i) => (
                                    <Star key={i} className="h-3 w-3 text-amber-500 fill-amber-400 stroke-none" />
                                  ))}
                                </div>
                              </div>
                              <p className="text-xs text-slate-600 leading-relaxed font-normal italic">
                                "{rev.comment}"
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Column: Direct Scheduling Board, Instant Book CTA */}
                  <div className="space-y-6">
                    <div className="bg-white rounded-3xl border border-rose-100/60 p-6 shadow-md space-y-6 text-left">
                      <div className="space-y-1">
                        <span className="text-[9px] font-mono uppercase tracking-widest text-rose-500 font-bold block">
                          ★ Consultation Slot Packages
                        </span>
                        <h2 className="text-base font-bold text-slate-900">Direct Scheduling Board</h2>
                      </div>

                      {/* Display Pricing tags cleanly in INR */}
                      <div className="space-y-3">
                        <span className="text-[10.5px] font-mono uppercase tracking-wider text-slate-400 block font-bold">
                          Consulting prices (Standard INR rates)
                        </span>
                        <div className="grid grid-cols-2 text-xs gap-3">
                          <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/40 text-center select-none font-sans">
                            <span className="text-[10px] text-slate-400 block font-semibold mb-1">30 Min Consultation</span>
                            <span className="font-extrabold text-rose-600 text-base block">₹{selectedExpert.profile.pricePer30Min}</span>
                          </div>
                          <div className="border border-slate-100 p-3 rounded-xl bg-slate-50/40 text-center select-none font-sans">
                            <span className="text-[10px] text-slate-400 block font-semibold mb-1">60 Min Consultation</span>
                            <span className="font-extrabold text-rose-600 text-base block">₹{selectedExpert.profile.pricePer60Min}</span>
                          </div>
                        </div>
                      </div>

                      {/* Summary of vacancies */}
                      <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 select-none text-xs space-y-1">
                        <span className="text-slate-500 font-medium font-mono uppercase text-[9px] block">Availability Status</span>
                        <p className="font-bold text-slate-800 font-sans">
                          {selectedExpert.slots.filter(s => !s.isBooked).length} slots available on schedule
                        </p>
                      </div>

                      {/* Call-to-action details */}
                      <div className="pt-4 border-t border-slate-100">
                        {currentUser ? (
                          <button
                            onClick={() => setOpenBooking(true)}
                            disabled={selectedExpert.slots.filter(s => !s.isBooked).length === 0}
                            className="w-full bg-rose-500 hover:bg-rose-600 disabled:bg-slate-100 disabled:text-slate-400 text-white text-xs font-bold py-3.5 rounded-xl transition-all shadow-md shadow-rose-500/15 flex items-center justify-center gap-1.5 cursor-pointer"
                            id="book-consultation-btn"
                          >
                            <Clock className="h-4 w-4" />
                            <span>Select Slot & Book Consultation</span>
                          </button>
                        ) : (
                          <div className="space-y-4">
                            <p className="text-[10px] text-slate-400 font-mono text-center">
                              Safe onboarding requested before scheduling a slot
                            </p>
                            <button
                              onClick={() => {
                                setAuthError(null);
                                setShowOnboardModal(true);
                              }}
                              className="w-full bg-slate-900 hover:bg-rose-500 text-white text-xs font-semibold py-3 rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 animate-pulse"
                              id="anonymous-onboarding-btn"
                            >
                              <UserPlus className="h-4 w-4" />
                              <span>Go to Authentication Onboarding</span>
                            </button>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Return back options button */}
                    <button
                      onClick={() => setSelectedExpert(null)}
                      className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs py-3 rounded-xl transition-all cursor-pointer block text-center"
                      id="return-catalog-btn"
                    >
                      ← Return to Experts Catalog
                    </button>
                  </div>

                </div>
              </div>
            ) : (
              /* STANDARD DIRECTORY LIST AND FILTERS (shown if selectedExpert is null) */
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
                
                {/* Expert Cards Columns */}
                <div className="lg:col-span-2">
                  {loading ? (
                    <div className="col-span-2 text-center py-24 text-slate-400 text-xs font-mono">
                      Searching database of verified experts...
                    </div>
                  ) : experts.length === 0 ? (
                    <div className="col-span-2 text-center py-20 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-2">
                      <p className="text-xs font-bold text-slate-800">No matching experts matching current bounds.</p>
                      <p className="text-xs text-slate-400">Try broadening your search metrics or resetting filters.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {experts.map((exp) => (
                        <ExpertCard
                          key={exp.id}
                          expert={exp}
                          onSelect={handleSelectExpert}
                          onMouseEnter={() => setIsHoveringCard(true)}
                          onMouseLeave={() => setIsHoveringCard(false)}
                        />
                      ))}
                    </div>
                  )}
                </div>

                {/* STICKY DETAILED BOOK NOW FOCUS PANEL - PLACEHOLDER WHEN UNSELECTED */}
                <div 
                  id="expert-focus-panel" 
                  className={`sticky top-20 transition-all duration-350 rounded-3xl ${
                    isHoveringCard 
                      ? 'ring-4 ring-rose-500/35 border-rose-300 shadow-xl shadow-rose-500/15 translate-y-[-2px] scale-[1.01] bg-rose-500/5 animate-[pulse_2s_infinite]' 
                      : ''
                  }`}
                >
                  <div className={`transition-all duration-350 rounded-3xl border border-dashed p-12 text-center text-xs ${
                    isHoveringCard 
                      ? 'border-rose-300 bg-rose-50/50 text-rose-600 font-semibold' 
                      : 'bg-white/80 border-slate-200/90 text-slate-400 shadow-xs'
                  }`}>
                    <Award className={`h-8 w-8 mx-auto mb-3 transition-all duration-350 ${
                      isHoveringCard ? 'text-rose-500 scale-125 rotate-6' : 'text-slate-300'
                    }`} />
                    <span>
                      {isHoveringCard 
                        ? 'Ready to proceed? Click "Consult Now" on the expert card to instantly open their dynamic schedule page and secure slot packages!'
                        : 'Select an industry expert "Consult now" card to open their detailed advisor page, reviews ledger, and book session slots immediately!'}
                    </span>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </main>

      {/* Booking Scheduling Dialog */}
      {openBooking && selectedExpert && (
        <BookingModal
          expert={selectedExpert.profile}
          slots={selectedExpert.slots}
          onClose={() => setOpenBooking(false)}
          onSuccess={() => {
            setOpenBooking(false);
            setSelectedExpert(null);
            loadExperts();
            setActiveTab('learner_dashboard');
          }}
        />
      )}

      {/* Elegant Onboarding Dialog Modal */}
      <AnimatePresence>
        {showOnboardModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowOnboardModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-xs"
            />
            
            {/* Modal Box */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-3xl border border-slate-100 shadow-2xl p-6 md:p-8 max-w-md w-full z-10 text-left space-y-4 focus:outline-none"
            >
              <button
                onClick={() => setShowOnboardModal(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-slate-650 p-2 rounded-xl hover:bg-slate-50 transition-all cursor-pointer"
                title="Close Form"
              >
                <X className="h-4.5 w-4.5" />
              </button>

              <div className="space-y-1">
                <span className="text-[10px] font-mono font-bold text-rose-500 block tracking-wider uppercase leading-none">
                  SkillOnDemand Onboarding
                </span>
                <h3 className="text-lg font-black text-slate-900 font-sans tracking-tight leading-tight">
                  SkillOnDemand Onboarding Session
                </h3>
                <p className="text-xs text-slate-400">
                  Authenticate your credentials below to create or resume your consult profile.
                </p>
              </div>

              <form onSubmit={handleMagicLogin} className="space-y-3.5">
                {authError && (
                  <div className="bg-rose-50 border border-rose-250/20 text-rose-700 text-[11px] p-2.5 rounded-xl font-medium">
                    {authError}
                  </div>
                )}

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-500 font-bold block mb-0.5">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="email@example.com"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-500 font-bold block mb-0.5">
                    Name (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Sarah Jordan"
                    value={authName}
                    onChange={(e) => setAuthName(e.target.value)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white"
                  />
                </div>

                <div className="space-y-1 text-left">
                  <label className="text-[10px] font-mono tracking-wider uppercase text-slate-500 block font-bold mb-1">
                    Select account role
                  </label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setAuthRole('learner')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        authRole === 'learner' 
                          ? 'bg-rose-500 text-white border-rose-500 font-bold' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Learner Customer
                    </button>
                    <button
                      type="button"
                      onClick={() => setAuthRole('expert')}
                      className={`flex-1 py-2 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                        authRole === 'expert' 
                          ? 'bg-rose-500 text-white border-rose-500 font-bold' 
                          : 'bg-white text-slate-600 border-slate-200'
                      }`}
                    >
                      Industry Expert
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-rose-600 text-white font-bold text-xs py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-slate-900/10 mt-3"
                >
                  Authenticate Onboarding Call
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Elegant minimalist platform footer */}
      <footer className="border-t border-slate-100/65 py-8 bg-white/70 backdrop-blur-md text-center text-xs text-slate-500 mt-20 select-none">
        <p className="font-semibold text-slate-700">© 2026 SkillOnDemand, Inc. All rights reserved.</p>
        <p className="text-[10px] text-slate-400 font-mono mt-1">
          Designed with curated Airbnb + LinkedIn visual frameworks on Google Cloud Run sandboxed workspace.
        </p>
      </footer>

    </div>
  );
}
