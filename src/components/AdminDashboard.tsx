import { useState, useEffect } from 'react';
import { User, Booking } from '../types';
import { api, getCleanImageUrl } from '../lib/api';
import { Shield, Users, BarChart3, Lock, Unlock, TrendingUp, IndianRupee, Wallet } from 'lucide-react';

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'users' | 'bookings' | 'analytics'>('users');

  const fetchAdminData = async () => {
    setLoading(true);
    setError(null);
    try {
      const uList = await api.getAdminUsers();
      const ana = await api.getAdminAnalytics();
      setUsers(uList);
      setAnalytics(ana);
    } catch (e: any) {
      setError(e.message || 'Access restricted or failed to sync administrative ledger.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleBan = async (userId: string, targetBanState: boolean) => {
    try {
      await api.toggleBanUser(userId, targetBanState);
      fetchAdminData();
    } catch (e: any) {
      setError(e.message || 'Ban operation rejected.');
    }
  };

  if (loading && !analytics) {
    return <div className="text-center py-12 text-slate-400 text-xs font-mono">Loading admin database ledger...</div>;
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      
      {/* Admin stats widgets */}
      {analytics && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 flex-wrap matches-flex">
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center select-none">
            <div className="text-left">
              <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Active platform volume
              </span>
              <span className="text-2xl font-black text-rose-600 mt-1 block">
                ₹{analytics.summary.totalVolume}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">INR Gross booked</span>
            </div>
            <div className="p-3.5 bg-rose-50 text-rose-500 rounded-xl">
              <TrendingUp className="h-5.5 w-5.5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center select-none">
            <div className="text-left">
              <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Net Platform Commission
              </span>
              <span className="text-2xl font-black text-slate-900 mt-1 block">
                ₹{analytics.summary.platformCommission}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Deducted 20% commission fee</span>
            </div>
            <div className="p-3.5 bg-slate-900 text-white rounded-xl">
              <IndianRupee className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center select-none">
            <div className="text-left">
              <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Expert payouts ledger
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                ₹{analytics.summary.expertPayouts}
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Disbursed 80% split</span>
            </div>
            <div className="p-3.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="h-5 w-5" />
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-xs flex justify-between items-center select-none">
            <div className="text-left">
              <span className="block text-[10px] font-mono tracking-wider text-slate-400 uppercase">
                Total active accounts
              </span>
              <span className="text-2xl font-extrabold text-slate-900 mt-1 block">
                {analytics.summary.totalUsers} registered
              </span>
              <span className="text-[10px] text-slate-400 font-mono">Curated experts & learners</span>
            </div>
            <div className="p-3.5 bg-slate-100 text-slate-700 rounded-xl">
              <Users className="h-5 w-5" />
            </div>
          </div>

        </div>
      )}

      {error && (
        <div className="bg-rose-50 text-rose-800 text-xs p-3 rounded-lg font-mono text-left">
          [Admin Notification Alert] {error}
        </div>
      )}

      {/* Selector Tabs */}
      <div className="flex border-b border-slate-100 gap-2">
        <button
          onClick={() => setActiveTab('users')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'users'
              ? 'bg-white border-t border-x border-slate-100 text-slate-900 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Manage Users directory
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'bookings'
              ? 'bg-white border-t border-x border-slate-100 text-slate-900 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          All System Bookings
        </button>
        <button
          onClick={() => setActiveTab('analytics')}
          className={`px-4 py-2 text-xs font-semibold rounded-t-xl transition-all cursor-pointer ${
            activeTab === 'analytics'
              ? 'bg-white border-t border-x border-slate-100 text-slate-900 font-black'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          Dynamic Revenue analytics
        </button>
      </div>

      {/* Main Tab Interfaces */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">User accounts audit management</h3>
            <p className="text-xs text-slate-500 mt-0.5">Control expert access profiles, review onboarding metrics or ban malicious identities instantly.</p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-500 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">User Details</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Active role</th>
                  <th className="p-4">Created date</th>
                  <th className="p-4 text-right">Ban status controller</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {users.map((u) => {
                  const isSUser = u.email === 'content2u.sj@gmail.com';
                  return (
                    <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="p-4 flex items-center gap-3">
                        <img 
                          src={getCleanImageUrl(u.avatarUrl)} 
                          alt="" 
                          referrerPolicy="no-referrer"
                          className="h-8 w-8 object-cover rounded-lg bg-slate-100" 
                        />
                        <div>
                          <p className="font-bold text-slate-900">{u.name}</p>
                          <p className="text-[10px] font-mono text-slate-400">ID: {u.id}</p>
                        </div>
                      </td>
                      <td className="p-4 text-slate-600 font-medium">{u.email}</td>
                      <td className="p-4">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          u.role === 'admin' 
                            ? 'bg-slate-900 text-white' 
                            : u.role === 'expert' 
                            ? 'bg-amber-100 text-amber-800' 
                            : 'bg-rose-50 text-rose-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="p-4 text-slate-400 font-mono">
                        {new Date(u.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      <td className="p-4 text-right">
                        {u.role === 'admin' ? (
                          <span className="text-[10px] text-slate-400 font-mono">System protected Admin</span>
                        ) : u.isBanned ? (
                          <button
                            onClick={() => handleToggleBan(u.id, false)}
                            className="bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-lg p-1.5 px-3 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer"
                          >
                            <Unlock className="h-3.5 w-3.5" />
                            <span>Unban Account</span>
                          </button>
                        ) : (
                          <button
                            onClick={() => handleToggleBan(u.id, true)}
                            disabled={isSUser}
                            className={`rounded-lg p-1.5 px-3 font-semibold transition-colors inline-flex items-center gap-1 cursor-pointer ${
                              isSUser 
                                ? 'bg-slate-100 text-slate-400 pointer-events-none'
                                : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                            }`}
                          >
                            <Lock className="h-3.5 w-3.5" />
                            <span>Ban user</span>
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'bookings' && analytics && (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xs overflow-hidden text-left">
          <div className="p-5 border-b border-slate-100">
            <h3 className="text-sm font-bold text-slate-900">Platform Bookings Directory Log</h3>
            <p className="text-xs text-slate-500 mt-0.5">Audit global payments capture records, confirmed slots, or cancel scheduled calls if needed.</p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-50 border-b border-slate-100 text-slate-400 font-mono uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="p-4">Customer learner</th>
                  <th className="p-4">Consulting provider expert</th>
                  <th className="p-4">Amount spent</th>
                  <th className="p-4">Platform Fee share (20%)</th>
                  <th className="p-4">Booking date</th>
                  <th className="p-4">Capturing signature index</th>
                  <th className="p-4 text-right">Booking status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {analytics.recentTransactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/20">
                    <td className="p-4 font-bold text-slate-800">{tx.learnerName}</td>
                    <td className="p-4 font-semibold text-slate-800">{tx.expertName}</td>
                    <td className="p-4 font-extrabold text-slate-900">₹{tx.amount}</td>
                    <td className="p-4 text-rose-600 font-bold">₹{tx.platformCommission}</td>
                    <td className="p-4 text-slate-400 font-mono">
                      {new Date(tx.createdAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-slate-400 font-mono">{tx.id}</td>
                    <td className="p-4 text-right">
                      <span className="bg-emerald-50 border border-emerald-100 text-emerald-600 px-2.5 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider">
                        Captured
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'analytics' && analytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 text-left">
          
          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5 matches-heading">
                ● High-Impact Consulting categories revenue share
            </h3>
            <div className="space-y-3">
              {analytics.categoryMetrics.map((cat: any, index: number) => (
                <div key={index} className="bg-slate-50 border border-slate-100/55 p-3.5 rounded-xl flex justify-between items-center text-xs">
                  <div>
                    <span className="font-bold text-slate-900 block">{cat.category}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{cat.sessionsCount} meetings completed</span>
                  </div>
                  <div className="text-right">
                    <span className="text-sm font-extrabold text-slate-950">₹{cat.totalRevenue}</span>
                    <span className="text-[10px] text-rose-500 block font-bold mt-0.5">₹{(cat.totalRevenue * 0.20).toFixed(1)} Comm shares</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 space-y-4 shadow-xs">
            <h3 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-400 matches-heading">
                ● Administrative policies & metrics
            </h3>
            <div className="text-xs text-slate-600 space-y-3.5">
              <p className="leading-relaxed">
                SkillOnDemand monetizes on-demand expert scheduling loops by applying an automated **20% commission fee** upon any successful payments captured via our secure Razorpay custom integration routing.
              </p>
              <div className="p-4 bg-rose-500/5 rounded-xl border border-rose-50 space-y-2 select-none">
                <p className="font-semibold text-rose-900 text-xs">Administrative metrics highlights</p>
                <div className="grid grid-cols-2 text-[11px] text-rose-800 gap-y-1.5">
                  <span>Target base payouts split:</span>
                  <span className="font-bold">80% Expert cash share</span>
                  <span>Withdrawal loop schedule:</span>
                  <span className="font-bold">Bi-weekly billing cycle</span>
                  <span>Commission review lock:</span>
                  <span className="font-bold">System Fixed</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

    </div>
  );
}
