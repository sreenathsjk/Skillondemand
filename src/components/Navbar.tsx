import React, { useState } from 'react';
import { User, UserRole } from '../types';
import { 
  Sparkles, Calendar, BookOpen, UserCheck, Shield, LogOut, ArrowRightLeft, 
  Menu, X, Laptop, ShieldCheck, Mail, ArrowRight, Award, Compass, Heart
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { getCleanImageUrl } from '../lib/api';

interface NavbarProps {
  currentUser: User | null;
  onLogout: () => void;
  onRoleSwitch: (role: UserRole) => void;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onOnboardClick?: () => void;
}

export default function Navbar({
  currentUser,
  onLogout,
  onRoleSwitch,
  activeTab,
  setActiveTab,
  onOnboardClick
}: NavbarProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleSidebarNav = (tab: string) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
  };

  return (
    <>
      <nav className="sticky top-0 z-40 bg-white/85 backdrop-blur-md border-b border-rose-50/50 shadow-sm px-4 md:px-8 py-3 flex items-center justify-between">
        {/* Platform Logo */}
        <div 
          onClick={() => handleSidebarNav('explore')} 
          className="flex items-center gap-2 cursor-pointer select-none group"
          id="navbar-logo"
        >
          <div className="bg-gradient-to-tr from-rose-500 to-amber-500 text-white p-2 rounded-xl shadow-md shadow-rose-500/20 group-hover:scale-105 transition-transform">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <span className="text-xl font-bold tracking-tight text-slate-900 font-sans">
              Skill<span className="bg-gradient-to-r from-rose-500 to-amber-500 bg-clip-text text-transparent">OnDemand</span>
            </span>
            <span className="block text-[10px] font-mono text-slate-400 uppercase tracking-widest leading-none">
              On-Demand Consulting
            </span>
          </div>
        </div>

        {/* Tabs / Actions (Desktop Nav Shortcuts) */}
        {currentUser && (
          <div className="hidden md:flex items-center gap-2">
            {/* Main explore & booking links */}
            <button
              onClick={() => setActiveTab('explore')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                activeTab === 'explore'
                  ? 'bg-slate-100 text-slate-950'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Explore Experts
            </button>

            {/* Role Based Navigation */}
            {currentUser.role === 'learner' && (
              <button
                onClick={() => setActiveTab('learner_dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'learner_dashboard'
                    ? 'bg-rose-50 text-rose-700 font-bold border border-rose-100/50'
                    : 'text-slate-600 hover:text-rose-600'
                }`}
              >
                <Calendar className="h-3.5 w-3.5 text-rose-500" />
                My Bookings
              </button>
            )}

            {currentUser.role === 'expert' && (
              <button
                onClick={() => setActiveTab('expert_dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'expert_dashboard'
                    ? 'bg-amber-50 text-amber-900 border border-amber-200/50'
                    : 'text-slate-600 hover:text-amber-700'
                }`}
              >
                <BookOpen className="h-3.5 w-3.5 text-amber-500" />
                Expert Console
              </button>
            )}

            {currentUser.role === 'admin' && (
              <button
                onClick={() => setActiveTab('admin_dashboard')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                  activeTab === 'admin_dashboard'
                    ? 'bg-slate-900 text-white'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Shield className="h-3.5 w-3.5" />
                Admin Panel
              </button>
            )}
          </div>
        )}

        {/* User Information containing Sidebar Menu Toggle Button */}
        <div className="flex items-center gap-3">
          {!currentUser ? (
            <button
              onClick={onOnboardClick}
              className="hidden md:flex items-center gap-1.5 bg-slate-900 hover:bg-rose-605 text-white font-bold text-xs py-2.5 px-4.5 rounded-xl cursor-pointer transition-all shadow-md shadow-slate-950/5 hover:scale-[1.02]"
              id="navbar-onboard-btn"
            >
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              <span>Sign In / Onboard</span>
            </button>
          ) : (
            <div className="hidden md:flex items-center gap-3">
              {/* Quick switcher for easy testing */}
              <div className="hidden lg:flex items-center gap-1 bg-slate-100/80 p-1 rounded-lg border border-slate-200/40 text-[10px]">
                <span className="text-slate-500 font-medium px-2 flex items-center gap-0.5 select-none">
                  <ArrowRightLeft className="h-2.5 w-2.5 text-slate-400" /> Test-Role:
                </span>
                {(['learner', 'expert', 'admin'] as UserRole[]).map((r) => (
                  <button
                    key={r}
                    onClick={() => onRoleSwitch(r)}
                    className={`px-2 py-0.5 rounded font-semibold cursor-pointer transition-colors ${
                      currentUser.role === r
                        ? 'bg-white text-slate-900 font-bold shadow-xs'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    {r.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* Profile info badge */}
              <div 
                onClick={() => handleSidebarNav(currentUser.role === 'expert' ? 'expert_dashboard' : currentUser.role === 'admin' ? 'admin_dashboard' : 'learner_dashboard')}
                className="flex items-center gap-2 bg-slate-50/50 hover:bg-slate-50 p-1 px-2.5 rounded-xl border border-slate-100 transition-colors cursor-pointer"
              >
                <img
                  src={getCleanImageUrl(currentUser.avatarUrl) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&h=50&q=80'}
                  alt={currentUser.name}
                  referrerPolicy="no-referrer"
                  className="h-7 w-7 rounded-lg object-cover ring-2 ring-rose-500/10"
                />
                <div className="text-left">
                  <span className="block text-xs font-semibold text-slate-800 tracking-tight max-w-[90px] truncate leading-none">
                    {currentUser.name}
                  </span>
                  <span className="block text-[9px] font-mono font-bold text-rose-500 capitalize mt-1 leading-none">
                    {currentUser.role} Account
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Side menu slide triggers button */}
          <button
            id="sidebar-toggle-btn"
            onClick={() => setIsSidebarOpen(true)}
            className="bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-slate-950 p-2.5 rounded-xl border border-slate-100 flex items-center justify-center transition-all shadow-xs select-none cursor-pointer"
            title="Toggle side navigation bar"
          >
            <Menu className="h-4.5 w-4.5" />
          </button>
        </div>
      </nav>

      {/* Side Menu Drawer Side Bar (AnimatePresence Overlay) */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            {/* Backdrop Blur Overlay */}
            <motion.div
              id="sidebar-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-50 cursor-pointer"
              onClick={() => setIsSidebarOpen(false)}
            />

            {/* Sidebar drawer box */}
            <motion.div
              id="sidebar-panel-container"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 26, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-[350px] max-w-[92vw] bg-white text-slate-800 shadow-2xl z-55 border-l border-slate-100 flex flex-col focus:outline-hidden text-left"
            >
              {/* Drawer header */}
              <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-black text-slate-900 tracking-tight flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-rose-500" />
                    <span>SkillOnDemand Side Menu</span>
                  </h3>
                  <span className="text-[10px] text-slate-400 font-mono tracking-wider uppercase font-medium">Quick Access Panel</span>
                </div>
                <button
                  onClick={() => setIsSidebarOpen(false)}
                  className="p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-all"
                  title="Close sidebar drawer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {/* Drawer scroll content body */}
              <div className="flex-1 overflow-y-auto p-5 space-y-6">
                
                {/* 1. Profile information component card */}
                {currentUser ? (
                  <div className="space-y-4">
                    <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                      ● My Identity Profile
                    </span>
                    
                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-2xl flex items-center gap-3">
                      <img
                        src={getCleanImageUrl(currentUser.avatarUrl) || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=50&h=50&q=80'}
                        alt={currentUser.name}
                        referrerPolicy="no-referrer"
                        className="h-11 w-11 rounded-xl object-cover ring-2 ring-rose-500/10 shrink-0"
                      />
                      <div className="overflow-hidden">
                        <h4 className="font-extrabold text-xs text-slate-900 truncate leading-none mb-1">
                          {currentUser.name}
                        </h4>
                        <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1 leading-none mb-1 truncate">
                          <Mail className="h-3 w-3 text-slate-400 shrink-0" />
                          {currentUser.email}
                        </p>
                        <span className="inline-block bg-rose-50 border border-rose-100 text-rose-600 px-2 py-0.5 rounded font-bold text-[9px] uppercase tracking-wider mt-1">
                          {currentUser.role} Active
                        </span>
                      </div>
                    </div>

                    {/* Integrated On-Demand testing switcher right in the drawer */}
                    <div className="bg-slate-50/50 p-3.5 rounded-2xl border border-slate-100 text-left space-y-2.5">
                      <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold flex items-center gap-1">
                        <ArrowRightLeft className="h-3 w-3 text-rose-500" /> Hot Switch Testing Account:
                      </span>
                      <div className="grid grid-cols-3 gap-1">
                        {(['learner', 'expert', 'admin'] as UserRole[]).map((r) => (
                          <button
                            key={r}
                            onClick={() => {
                              onRoleSwitch(r);
                              // Keep menu open for convenience but update state indicator
                            }}
                            className={`py-1.5 text-[10px] font-bold rounded-lg cursor-pointer transition-all border ${
                              currentUser.role === r
                                ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                                : 'bg-white text-slate-500 border-slate-200 hover:text-slate-800'
                            }`}
                          >
                            {r.toUpperCase()}
                          </button>
                        ))}
                      </div>
                      <p className="text-[10px] text-slate-400 leading-normal">
                        Instantly test flows for learner bookings, expert console slots, or admin ledger panels.
                      </p>
                    </div>

                  </div>
                ) : (
                  <div className="bg-slate-50/80 rounded-2xl p-5 border border-slate-100 text-slate-500 text-center space-y-3.5">
                    <Award className="h-8 w-8 text-rose-500/80 mx-auto" />
                    <div>
                      <p className="text-xs font-bold text-slate-800">Ready to consult curated experts?</p>
                      <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">Instantly book custom 1-on-1 slots. Setup your profile now for quick access.</p>
                    </div>
                    <button
                      onClick={() => {
                        setIsSidebarOpen(false);
                        onOnboardClick?.();
                      }}
                      className="bg-slate-950 hover:bg-rose-500 text-white font-bold text-xs py-2.5 px-4 rounded-xl cursor-pointer w-full transition-all"
                    >
                      Authenticate Onboarding Action
                    </button>
                  </div>
                )}

                {/* 2. Interactive Navigation links for easy travel */}
                <div className="space-y-3">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-slate-400 font-bold block">
                    ● Navigation Shortcuts
                  </span>
                  
                  <div className="space-y-1">
                    <button
                      onClick={() => handleSidebarNav('explore')}
                      className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                        activeTab === 'explore'
                          ? 'bg-rose-50 text-rose-800'
                          : 'bg-transparent text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        <Compass className="h-4.5 w-4.5" /> Explore Experts Directory
                      </span>
                      <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                    </button>

                    {currentUser?.role === 'learner' && (
                      <button
                        onClick={() => handleSidebarNav('learner_dashboard')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          activeTab === 'learner_dashboard'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Calendar className="h-4.5 w-4.5 text-rose-500" /> Learner Booking Logs
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}

                    {currentUser?.role === 'expert' && (
                      <button
                        onClick={() => handleSidebarNav('expert_dashboard')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          activeTab === 'expert_dashboard'
                            ? 'bg-rose-50 text-rose-800'
                            : 'bg-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <BookOpen className="h-4.5 w-4.5 text-amber-500" /> Expert Console Slots
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}

                    {currentUser?.role === 'admin' && (
                      <button
                        onClick={() => handleSidebarNav('admin_dashboard')}
                        className={`w-full flex items-center justify-between p-3 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                          activeTab === 'admin_dashboard'
                            ? 'bg-slate-950 text-white'
                            : 'bg-transparent text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        <span className="flex items-center gap-2">
                          <Shield className="h-4.5 w-4.5" /> Administrative Control Panel
                        </span>
                        <ArrowRight className="h-3.5 w-3.5 text-slate-400" />
                      </button>
                    )}
                  </div>
                </div>

                {/* 3. Dynamic features summary bento card */}
                <div className="bg-gradient-to-r from-rose-500/10 to-amber-500/5 p-4 rounded-2xl border border-rose-100/10 text-[11px] text-slate-600 space-y-2.5 select-none text-left leading-relaxed">
                  <span className="text-[9px] font-mono uppercase tracking-widest text-rose-500 font-black block">
                    ★ SkillOnDemand Platform Protection
                  </span>
                  <div className="space-y-1.5 font-sans">
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5">
                      <ShieldCheck className="h-4 w-4 text-emerald-500 inline" /> Razorpay Secured Shield
                    </p>
                    <p className="pl-5 text-slate-500 text-[10px]">Pre-locks session charges until mutual slot service fulfillment reviews.</p>
                    
                    <p className="font-semibold text-slate-800 flex items-center gap-1.5 mt-2">
                      <Laptop className="h-4 w-4 text-indigo-500 inline" /> Curated Google Meet Rooms
                    </p>
                    <p className="pl-5 text-slate-500 text-[10px]">Instantly provisioned direct consulting links right inside caller boards.</p>
                  </div>
                </div>

              </div>

              {/* Drawer Sticky Footer controls */}
              {currentUser && (
                <div className="p-5 border-t border-slate-100 bg-slate-50/60 shrink-0">
                  <button
                    onClick={() => {
                      onLogout();
                      setIsSidebarOpen(false);
                    }}
                    className="w-full bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs py-3 rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-rose-500/5 select-none"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Safe Logout Session</span>
                  </button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
