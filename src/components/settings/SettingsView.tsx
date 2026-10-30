import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import {
  Building2,
  Shield,
  Key,
  Globe,
  Database,
  Cloud,
  CheckCircle2,
  Save,
  RefreshCw,
  Bell,
  Smartphone,
  Lock,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const { facility, setFacility, role, addToast } = useEmr();
  const [activeSubTab, setActiveSubTab] = useState<'facility' | 'security' | 'hmo' | 'offline'>('facility');
  const [emergencyPhone, setEmergencyPhone] = useState(facility.phone);
  const [offlineSync, setOfflineSync] = useState(true);
  const [autoDeduplicate, setAutoDeduplicate] = useState(true);
  const [twoFactorAuth, setTwoFactorAuth] = useState(true);

  const handleSave = () => {
    addToast('Settings Updated', 'Hospital facility configuration saved successfully.', 'success');
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto font-sans pb-10">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900">
          System & Facility Settings
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage healthcare facility tenancy, HMO tariffs, offline-first sync, and RBAC governance.
        </p>
      </div>

      {/* Settings Navigation Tabs */}
      <div className="flex border-b border-slate-200 text-xs font-bold gap-6">
        <button
          onClick={() => setActiveSubTab('facility')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'facility'
              ? 'border-[#006837] text-[#006837]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          <span>Hospital Profile</span>
        </button>
        <button
          onClick={() => setActiveSubTab('hmo')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'hmo'
              ? 'border-[#006837] text-[#006837]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>NHIA & HMO Tariffs</span>
        </button>
        <button
          onClick={() => setActiveSubTab('offline')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'offline'
              ? 'border-[#006837] text-[#006837]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Cloud className="w-4 h-4" />
          <span>Offline & Sync</span>
        </button>
        <button
          onClick={() => setActiveSubTab('security')}
          className={`pb-3 transition-colors flex items-center gap-2 border-b-2 ${
            activeSubTab === 'security'
              ? 'border-[#006837] text-[#006837]'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Lock className="w-4 h-4" />
          <span>Security & NDPA</span>
        </button>
      </div>

      {/* Tab 1: Facility Profile */}
      {activeSubTab === 'facility' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Hospital Information</h3>
            <p className="text-xs text-slate-500 mt-0.5">Facility details stamped on clinical records and billing receipts.</p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Facility Name</label>
              <input
                type="text"
                defaultValue={facility.name}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">Facility Code / Tenancy ID</label>
              <input
                type="text"
                disabled
                value={facility.code}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-slate-500 font-mono"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">State & Location</label>
              <input
                type="text"
                defaultValue={`${facility.city}, ${facility.state}, Nigeria`}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-medium"
              />
            </div>
            <div>
              <label className="block font-bold text-slate-700 mb-1.5">24/7 Emergency Line</label>
              <input
                type="text"
                value={emergencyPhone}
                onChange={(e) => setEmergencyPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 font-mono font-medium"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-end">
            <button
              onClick={handleSave}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#006837] hover:bg-emerald-900 text-white font-bold text-xs shadow-md shadow-emerald-900/20"
            >
              <Save className="w-4 h-4" />
              <span>Save Facility Profile</span>
            </button>
          </div>
        </div>
      )}

      {/* Tab 2: HMO & NHIA Tariffs */}
      {activeSubTab === 'hmo' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">National Health Insurance & HMO Integration</h3>
            <p className="text-xs text-slate-500 mt-0.5">Automated claims verification, Pre-Authorization Codes (PAC), and fee schedule tariffs.</p>
          </div>

          <div className="space-y-3">
            {[
              { name: 'National Health Insurance Authority (NHIA)', status: 'Active (Tier 1)', copay: '10%' },
              { name: 'Hygeia HMO', status: 'Connected • API v2', copay: '0% - 15%' },
              { name: 'Reliance HMO', status: 'Connected • Webhook Live', copay: '10%' },
              { name: 'Leadway Health', status: 'Active • Direct Tariff', copay: '20%' },
              { name: 'AXA Mansard Health', status: 'Active • Real-time PAC', copay: '10%' },
            ].map((hmo, i) => (
              <div key={i} className="p-4 rounded-2xl border border-slate-200 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                <div>
                  <div className="text-xs font-bold text-slate-900">{hmo.name}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Standard Co-pay: {hmo.copay}</div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    {hmo.status}
                  </span>
                  <button className="px-3 py-1 rounded-lg border border-slate-200 text-xs font-semibold hover:bg-slate-100">
                    Configure
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Offline & Network Resilience */}
      {activeSubTab === 'offline' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Offline-First Clinical Operations</h3>
            <p className="text-xs text-slate-500 mt-0.5">Guarantees zero consultation interruption during Nigerian broadband or power outages.</p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Local Browser Encrypted Storage (IndexedDB)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Cache active clinic queue and SOAP notes locally on device.</div>
              </div>
              <input
                type="checkbox"
                checked={offlineSync}
                onChange={(e) => setOfflineSync(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Fuzzy Patient Deduplication on Reconnect</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Automatically resolves conflicting MRNs matching Phone Number + DOB + NIN.</div>
              </div>
              <input
                type="checkbox"
                checked={autoDeduplicate}
                onChange={(e) => setAutoDeduplicate(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Security & NDPA */}
      {activeSubTab === 'security' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 space-y-6 shadow-2xs">
          <div>
            <h3 className="text-base font-bold text-slate-900">Data Protection &amp; Regulatory Compliance</h3>
            <p className="text-xs text-slate-500 mt-0.5">Compliant with the Nigeria Data Protection Act (NDPA) and clinical audit standards.</p>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200 flex items-start gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#006837] shrink-0 mt-0.5" />
              <div>
                <div className="font-bold text-[#006837]">Append-Only Audit Log Trail Enabled</div>
                <div className="text-slate-600 text-[11px] mt-0.5">All diagnosis edits, clinical note closures, and bill settlements write immutable cryptographic audit events.</div>
              </div>
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-200">
              <div>
                <div className="font-bold text-slate-900">Enforce Multi-Factor Authentication (MFA) for Clinicians</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Requires SMS or authenticator OTP for doctors prescribing controlled drugs.</div>
              </div>
              <input
                type="checkbox"
                checked={twoFactorAuth}
                onChange={(e) => setTwoFactorAuth(e.target.checked)}
                className="w-4 h-4 text-emerald-600 rounded"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

