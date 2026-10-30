import React, { useState } from 'react';
import { useEmr } from '../../context/EmrContext';
import { canAccessTab } from '../../auth/roles';
import {
  Search,
  UserPlus,
  ShieldAlert,
  Phone,
  Droplet,
  Calendar,
  X,
  CheckCircle2,
  Filter,
  ChevronDown,
  ChevronLeft,
  Lock,
} from 'lucide-react';

export const PatientDirectoryView: React.FC = () => {
  const {
    patients,
    registerPatient,
    selectedPatientId,
    setSelectedPatientId,
    appointments,
    encounters,
    invoices,
    setActiveTab,
    facility,
  } = useEmr();

  const role = useEmr().role;
  const canViewClinical = [
    'Doctor',
    'Nurse',
    'MedicalDirector',
    'Admin',
    'SuperAdmin',
  ].includes(role ?? '');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterHmo, setFilterHmo] = useState<string>('all');
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const [registerError, setRegisterError] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<'list' | 'detail'>('list');

  // Helper to determine allergy display state
  const getAllergyDisplayState = (allergies: string[]) => {
    if (!canViewClinical) {
      return { state: 'restricted', text: 'Clinical information is only visible to clinical staff', icon: Lock };
    }
    if (allergies.length === 0) {
      return { state: 'empty', text: 'No known allergies recorded', icon: CheckCircle2 };
    }
    return { state: 'value', text: allergies.join(', '), icon: ShieldAlert };
  };

  // Helper to determine blood/genotype display state
  const getClinicalDisplayState = (value: string, label: string) => {
    if (!canViewClinical) {
      return { state: 'restricted', text: 'Clinical information is only visible to clinical staff', icon: Lock };
    }
    if (!value || value.trim() === '') {
      return { state: 'empty', text: 'No known ' + label, icon: CheckCircle2 };
    }
    return { state: 'value', text: value, icon: null };
  };

  // New patient form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '1995-05-15',
    phone: '',
    email: '',
    address: '',
    bloodGroup: '',
    genotype: '',
    allergies: [] as string[],
    noKnownAllergies: false,
    kinName: '',
    kinRelationship: 'Spouse',
    kinPhone: '',
    hasHmo: true,
    hmoProvider: 'Hygeia HMO',
    policyNumber: '',
    coverageTier: 'Gold' as 'Standard' | 'Silver' | 'Gold' | 'Executive',
    coPayPercentage: 10,
  });

  // Allergy suggestions
  const allergySuggestions = [
    'Penicillin',
    'Sulfonamides',
    'Aspirin',
    'Ibuprofen',
    'Tramadol',
    'Codeine',
    'Latex',
    'Peanuts',
    'Eggs',
    'Shellfish',
  ];

  // Phone normalization helper
  const normalizePhone = (phone: string): string => {
    return phone.replace(/[\s\-\+\(\)]/g, '');
  };

  // Validate phone format (0XXXXXXXXXX or 234XXXXXXXXXX)
  const validatePhone = (phone: string): { valid: boolean; error?: string } => {
    const normalized = normalizePhone(phone);
    if (!normalized) return { valid: false, error: 'Phone number is required' };
    if (!/^(?:0|234)\d{10}$/.test(normalized)) {
      return { valid: false, error: 'Invalid format. Use 08031234567 or 2348031234567' };
    }
    return { valid: true };
  };

  // Format phone for display
  const formatPhoneDisplay = (phone: string): string => {
    const normalized = normalizePhone(phone);
    if (normalized.startsWith('234')) {
      return normalized.replace(/(\d{3})(\d{3})(\d{3})(\d{3})/, '$1 $2 $3 $4');
    }
    return normalized.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3');
  };

  // Compute age from DOB
  const computeAge = (dob: string): number => {
    const today = new Date();
    const birth = new Date(dob);
    let age = today.getFullYear() - birth.getFullYear();
    const m = today.getMonth() - birth.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birth.getDate())) age--;
    return age;
  };

  // Validate DOB is not in future
  const validateDob = (dob: string): { valid: boolean; error?: string } => {
    if (!dob) return { valid: false, error: 'Date of birth is required' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const birth = new Date(dob);
    if (birth > today) {
      return { valid: false, error: 'Date of birth cannot be in the future' };
    }
    return { valid: true };
  };

  const filteredPatients = patients.filter((p) => {
    const matchesSearch =
      `${p.firstName} ${p.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.mrn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.phone.includes(searchQuery);

    if (filterHmo === 'hmo') return matchesSearch && !!p.hmoDetails;
    if (filterHmo === 'private') return matchesSearch && !p.hmoDetails;
    return matchesSearch;
  });

  const selectedPatient = patients.find((p) => p.id === selectedPatientId) || patients[0];
  const patientEncounters = encounters.filter((e) => e.patientId === selectedPatient?.id);
  const patientInvoices = invoices.filter((i) => i.patientId === selectedPatient?.id);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.firstName || !formData.lastName || !formData.phone) return;

    setRegisterError(null);
    setIsRegistering(true);

    // Check if facility is loaded (fail fast with user-friendly message)
    if (!facility || !facility.id) {
      setRegisterError('Facility not loaded. Please refresh the page.');
      setIsRegistering(false);
      return;
    }

    // Validate phone format
    const phoneValidation = validatePhone(formData.phone);
    if (!phoneValidation.valid) {
      setRegisterError(phoneValidation.error);
      setIsRegistering(false);
      return;
    }

    // Validate DOB
    const dobValidation = validateDob(formData.dob);
    if (!dobValidation.valid) {
      setRegisterError(dobValidation.error);
      setIsRegistering(false);
      return;
    }

    // Build patient data payload - omit empty optional fields
    const allergiesToSend = formData.noKnownAllergies
      ? []
      : formData.allergies;

    const patientPayload: any = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      gender: formData.gender,
      dob: formData.dob,
      phone: normalizePhone(formData.phone),
      bloodGroup: formData.bloodGroup || undefined,
      genotype: formData.genotype || undefined,
      allergies: allergiesToSend,
      nextOfKin: {
        name: formData.kinName,
        relationship: formData.kinRelationship,
        phone: normalizePhone(formData.kinPhone),
      },
      hmoDetails: formData.hasHmo
        ? {
            provider: formData.hmoProvider,
            policyNumber: formData.policyNumber || `HMO-${Math.floor(Math.random() * 900000)}`,
            coverageTier: formData.coverageTier,
            coPayPercentage: Number(formData.coPayPercentage),
          }
        : undefined,
    };

    // Only include email and address if they have values
    if (formData.email && formData.email.trim()) {
      patientPayload.email = formData.email;
    }
    if (formData.address && formData.address.trim()) {
      patientPayload.address = formData.address;
    }

    try {
      const result = await registerPatient({
        ...patientPayload,
        facilityId: facility.id,
      });
      if (!result.success) {
        setRegisterError(result.error);
        setIsRegistering(false);
        return;
      }

      // Success: close modal, select patient, error banner is NOT shown (context shows success toast with MRN)
      setSelectedPatientId(result.patient.id);
      setIsRegisterModalOpen(false);
    } catch (error: unknown) {
      // Should not reach here since context handles errors, but defensive:
      setRegisterError(
        error instanceof Error
          ? error.message
          : 'Patient registration failed. Please try again.',
      );
    } finally {
      setIsRegistering(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto font-sans pb-32">
      {/* Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
            Patient Intake & Master Index
          </h1>
          <p className="text-xs text-slate-600 mt-0.5">
            Search, register, and review patient medical identifiers (MRN) and HMO policies
          </p>
        </div>
        <button
          onClick={() => setIsRegisterModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs sm:text-sm shadow-xs flex items-center gap-1.5 transition-colors cursor-pointer self-start sm:self-auto"
        >
          <UserPlus className="w-4 h-4" />
          <span>Register New Patient</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder="Search by patient name, MRN (e.g. MRN-2026-0819), or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-900 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837] transition-all shadow-2xs"
          />
        </div>

        {/* Styled Native Filter Select */}
        <div className="relative self-start md:self-auto shrink-0 w-full md:w-auto">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-600">
            <Filter className="w-4 h-4" />
          </div>
          <select
            value={filterHmo}
            onChange={(e) => setFilterHmo(e.target.value)}
            className="w-full md:w-auto appearance-none pl-9 pr-9 py-2 text-xs sm:text-sm rounded-xl border border-slate-200 bg-white text-slate-700 font-semibold focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837] shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
          >
            <option value="all">All Patients ({patients.length})</option>
            <option value="hmo">HMO / Insured Patients</option>
            <option value="private">Private / Self-Pay Patients</option>
          </select>
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none text-slate-600">
            <ChevronDown className="w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      {/* Main Grid: Patient List on Left (5 cols), Active Chart on Right (7 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Patient Directory Cards */}
        <div className={`space-y-3 ${mobileView === 'detail' ? 'hidden lg:block' : 'block'} lg:col-span-5`}>
          {/* Merged heading and count in one line */}
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center justify-between">
            <span>Registered Directory ({filteredPatients.length} of {patients.length})</span>
          </div>

          <div className="space-y-3 max-h-[680px] overflow-y-auto pr-1">
            {filteredPatients.map((p) => {
              const isSelected = p.id === selectedPatient?.id;
              const age = new Date().getFullYear() - new Date(p.dob).getFullYear();
              const allergyState = getAllergyDisplayState(p.allergies);

              return (
                <div
                  key={p.id}
                  onClick={() => {
                    setSelectedPatientId(p.id);
                    setMobileView('detail');
                  }}
                  className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                    isSelected
                      ? 'border-[#006837] bg-[#EAF7EE]/30 ring-1 ring-[#006837]/30 shadow-2xs'
                      : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 shadow-2xs'
                  }`}
                >
                  {/* Active Card Marker */}
                  {isSelected && (
                    <div className="absolute left-0 inset-y-0 w-1 bg-[#006837] rounded-l-2xl" />
                  )}

                  {/* Row 1: Name + Explicit Blood/Hb pills */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-bold text-slate-900 text-sm">
                        {p.firstName} {p.lastName}
                      </div>
                      <div className="text-xs text-slate-700 font-medium mt-0.5">
                        <span className="font-mono text-xs font-semibold text-[#006837]">{p.mrn}</span>
                        <span className="mx-1.5 text-slate-300">•</span>
                        <span>{p.gender}, <span className="tabular-nums">{age}y</span></span>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {getClinicalDisplayState(p.bloodGroup, 'Blood').state === 'restricted' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-500 mr-1" /> Blood: <strong className="text-slate-500 text-xs">Restricted</strong>
                        </span>
                      ) : (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-800 border border-slate-200">
                          Blood: <strong className="text-slate-900">{p.bloodGroup}</strong>
                        </span>
                      )}
                      {getClinicalDisplayState(p.genotype, 'Hb').state === 'restricted' ? (
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-slate-100 text-slate-500 border border-slate-200">
                          <Lock className="w-3 h-3 text-slate-500 mr-1" /> Hb: <strong className="text-slate-500 text-xs">Restricted</strong>
                        </span>
                      ) : (
                        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-md border ${
                          p.genotype === 'SS'
                            ? 'bg-rose-50 text-rose-800 border-rose-200'
                            : p.genotype === 'AS' || p.genotype === 'AC'
                            ? 'bg-amber-50 text-amber-800 border-amber-200'
                            : 'bg-slate-100 text-slate-800 border-slate-200'
                        }`}
                        >
                          Hb: <strong className="text-slate-900">{p.genotype}</strong>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Row 2: Contact Info */}
                  <div className="mt-2 flex items-center gap-1.5 text-xs text-slate-600">
                    <Phone className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                    <span className="tabular-nums font-medium">{p.phone}</span>
                  </div>

                  {/* Row 3: Coverage badge */}
                  <div className="mt-2.5">
                    {p.hmoDetails ? (
                      <div className="text-[11px] bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] px-2.5 py-1 rounded-md flex items-center justify-between">
                        <span className="font-semibold truncate max-w-[200px]">
                          {p.hmoDetails.provider} ({p.hmoDetails.coverageTier})
                        </span>
                        <span className="tabular-nums font-semibold text-[10px]">
                          {p.hmoDetails.coPayPercentage}% Co-pay
                        </span>
                      </div>
                    ) : (
                      <div className="text-[11px] bg-slate-100 text-slate-700 border border-slate-200 px-2.5 py-0.5 rounded-md inline-block font-semibold">
                        Private / Out-of-pocket
                      </div>
                    )}
                  </div>

                  {/* Row 4: Allergies - permission-aware display */}
                  {allergyState.state === 'restricted' ? (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-500 bg-slate-100/50 border border-slate-200/20 px-2.5 py-1.5 rounded-md">
                      <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-[10px] uppercase tracking-wider text-slate-400">Allergies: </span>
                        <span className="font-semibold text-slate-400 break-words">{allergyState.text}</span>
                      </div>
                    </div>
                  ) : allergyState.state === 'value' && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-rose-800 bg-rose-50/90 border border-rose-200 px-2.5 py-1.5 rounded-md">
                      <ShieldAlert className="w-3.5 h-3.5 text-rose-600 shrink-0 mt-0.5" />
                      <div className="min-w-0">
                        <span className="font-bold text-[11px] uppercase tracking-wider">Allergies: </span>
                        <span className="font-semibold break-words">{allergyState.text}</span>
                      </div>
                    </div>
                  )}
                  {allergyState.state === 'empty' && (
                    <div className="mt-2.5 flex items-start gap-1.5 text-xs text-slate-600">
                      <CheckCircle2 className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span>{allergyState.text}</span>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Right Column: Detailed Patient Health Record Chart */}
        <div className={`${mobileView === 'list' ? 'hidden lg:block' : 'block'} lg:col-span-7`}>
          {/* Back button on tablet/mobile */}
          <div className="lg:hidden mb-3">
            <button
              onClick={() => setMobileView('list')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-[#006837] hover:bg-[#EAF7EE] transition-colors cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back to directory</span>
            </button>
          </div>

          {selectedPatient ? (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs p-5 sm:p-6 space-y-5">
              {/* Profile Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
                <div className="flex items-center gap-3.5">
                  <div className="w-13 h-13 rounded-2xl bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] font-bold text-lg flex items-center justify-center shrink-0">
                    {selectedPatient.firstName[0]}
                    {selectedPatient.lastName[0]}
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedPatient.firstName} {selectedPatient.lastName}
                    </h2>
                    <div className="text-xs text-slate-600 flex items-center flex-wrap gap-2 mt-0.5">
                      <span className="font-mono font-semibold text-[#006837] bg-[#EAF7EE] px-2 py-0.5 rounded-md border border-[#c4e9cf]">
                        {selectedPatient.mrn}
                      </span>
                      <span>•</span>
                      <span>DOB: <strong className="tabular-nums text-slate-700">{selectedPatient.dob}</strong></span>
                      <span>•</span>
                      <span>{selectedPatient.gender}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {canAccessTab(role, 'appointments') && (
                    <button
                      onClick={() => setActiveTab('appointments')}
                      className="px-3.5 py-1.5 rounded-xl bg-[#EAF7EE] text-[#006837] hover:bg-[#d8f0e0] border border-[#c4e9cf] font-semibold text-xs transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Book Visit</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Prominent Clinical Safety Banner: Allergies Alert - permission-aware */}
              {canViewClinical && selectedPatient.allergies.length > 0 ? (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-300 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 mt-0.5">
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] uppercase tracking-wider font-bold text-rose-800">
                      Clinical Safety Alert • Known Allergies
                    </div>
                    <div className="text-xs font-bold text-rose-950 mt-0.5 break-words leading-relaxed">
                      {selectedPatient.allergies.join(', ')}
                    </div>
                  </div>
                </div>
              ) : !canViewClinical ? (
                <div className="p-3.5 rounded-xl bg-slate-100/50 border border-slate-200/20 flex items-start gap-3 shadow-2xs">
                  <div className="w-7 h-7 rounded-lg bg-slate-200 text-slate-400 flex items-center justify-center shrink-0 mt-0.5">
                    <Lock className="w-4 h-4 text-slate-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs uppercase tracking-wider font-bold text-slate-400">
                      Clinical information is only visible to clinical staff
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5 break-words leading-relaxed">
                      Allergies, blood group and genotype are restricted to roles with view:patient_clinical permission
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 flex items-center gap-2.5 text-xs text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-[#006837] shrink-0" />
                  <span>Allergies: <strong className="text-slate-800 font-semibold">No known allergies recorded</strong></span>
                </div>
              )}

              {/* Bio & Clinical Tags (3 Stat Tiles with Clear Labels) - permission-aware */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Blood Group</div>
                  {canViewClinical ? (
                    <div className="text-base font-bold text-slate-900 flex items-center justify-center gap-1 mt-1">
                      <Droplet className="w-4 h-4 text-rose-600" />
                      <span>{selectedPatient.bloodGroup}</span>
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-500 mt-1">
                      <Lock className="w-4 h-4 text-slate-400 inline-block mr-1" /> Restricted
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Genotype</div>
                  {canViewClinical ? (
                    <div className="text-base font-bold text-slate-900 mt-1">
                      {selectedPatient.genotype}
                    </div>
                  ) : (
                    <div className="text-sm font-bold text-slate-500 mt-1">
                      <Lock className="w-4 h-4 text-slate-400 inline-block mr-1" /> Restricted
                    </div>
                  )}
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-center">
                  <div className="text-[10px] uppercase font-bold text-slate-600 tracking-wider">Coverage</div>
                  <div className="text-xs font-bold text-[#006837] mt-1.5 truncate">
                    {selectedPatient.hmoDetails ? selectedPatient.hmoDetails.provider : 'Self Pay'}
                  </div>
                </div>
              </div>

              {/* Contact & Next of Kin Info */}
              <div className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 text-xs space-y-2.5">
                <div className="font-bold text-slate-900 text-xs uppercase tracking-wider">
                  Contact & Emergency Next of Kin
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-slate-600">
                  <div>
                    <span className="text-slate-600 font-medium">Phone: </span>
                    <strong className="text-slate-900 tabular-nums">{selectedPatient.phone.replace(/(\d{4})(\d{3})(\d{4})/, '$1 $2 $3')}</strong>
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Email: </span>
                    {canViewClinical ? (
                      <strong className="text-slate-900">{selectedPatient.email || 'Not provided'}</strong>
                    ) : (
                      <strong className="text-slate-500 text-xs">Restricted</strong>
                    )}
                  </div>
                  <div>
                    <span className="text-slate-600 font-medium">Address: </span>
                    {canViewClinical ? (
                      <span className="text-slate-900 font-medium">{selectedPatient.address || 'Not provided'}</span>
                    ) : (
                      <span className="text-slate-500 text-xs">Restricted</span>
                    )}
                  </div>
                  <div className="sm:col-span-2">
                    <span className="text-slate-600 font-medium">Next of Kin: </span>
                    <strong className="text-slate-900">
                      {selectedPatient.nextOfKin.name || 'Not provided'} ({selectedPatient.nextOfKin.relationship || 'Not provided'}) •{' '}
                      <span className="tabular-nums">{selectedPatient.nextOfKin.phone || 'Not provided'}</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Clinical Encounters & Diagnoses */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Clinical Encounters ({patientEncounters.length})
                  </h3>
                  {canAccessTab(role, 'encounters') && (
                    <button
                      onClick={() => setActiveTab('encounters')}
                      className="text-xs text-[#006837] font-semibold hover:text-[#00522c] cursor-pointer transition-colors"
                    >
                      View Encounters
                    </button>
                  )}
                </div>

                {patientEncounters.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-600">
                    No clinical encounters recorded yet. Check-in from appointments to open a visit.
                  </div>
                ) : (
                  <div className="space-y-2">
                    {patientEncounters.map((enc) => (
                      <div
                        key={enc.id}
                        className="p-3.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-xs text-slate-900">
                            {enc.encounterNumber} • {enc.doctorName}
                          </div>
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                              enc.status === 'Closed'
                                ? 'bg-slate-100 text-slate-800 border-slate-200'
                                : 'bg-emerald-50 text-emerald-800 border-emerald-300'
                            }`}
                          >
                            {enc.status}
                          </span>
                        </div>
                        {enc.vitals && (
                          <div className="mt-1 text-[11px] text-slate-600 tabular-nums">
                            BP: {enc.vitals.bpSystolic}/{enc.vitals.bpDiastolic} mmHg • Pulse: {enc.vitals.pulse} bpm • Temp: {enc.vitals.temperature}°C
                          </div>
                        )}
                        {enc.diagnoses.length > 0 && (
                          <div className="mt-1.5 flex items-center gap-1.5 flex-wrap">
                            {enc.diagnoses.map((d) => (
                              <span key={d.id} className="text-[10px] bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] px-1.5 py-0.5 rounded-md font-semibold">
                                [{d.code}] {d.description}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-slate-900 text-sm">
                    Invoices & Payments ({patientInvoices.length})
                  </h3>
                  {canAccessTab(role, 'billing') && (
                    <button
                      onClick={() => setActiveTab('billing')}
                      className="text-xs text-[#006837] font-semibold hover:text-[#00522c] cursor-pointer transition-colors"
                    >
                      Open Cashier Counter
                    </button>
                  )}
                </div>

                <div className="space-y-2">
                  {patientInvoices.map((inv) => (
                    <div
                      key={inv.id}
                      className="p-3 rounded-xl border border-slate-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-semibold text-slate-900">{inv.invoiceNumber}</div>
                        <div className="text-[11px] text-slate-600 mt-0.5">
                          Total: <span className="tabular-nums">₦{inv.subtotal.toLocaleString()}</span> • Co-pay: <span className="tabular-nums">₦{inv.patientPayable.toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${
                            inv.status === 'Paid'
                              ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                              : inv.status === 'Partial'
                              ? 'bg-amber-50 text-amber-800 border-amber-300'
                              : 'bg-rose-50 text-rose-800 border-rose-300'
                          }`}
                        >
                          {inv.status}
                        </span>
                        <div className="text-[11px] font-semibold text-slate-900 mt-1 tabular-nums">
                          Bal: ₦{inv.balance.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="p-12 text-center text-slate-600 border border-dashed border-slate-200 rounded-2xl">
              Select a patient to view full health records
            </div>
          )}
        </div>
      </div>

      {/* Registration Modal */}
      {isRegisterModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#EAF7EE] text-[#006837] border border-[#c4e9cf] flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Patient Intake & Registration
                  </h3>
                  <p className="text-xs text-slate-600">
                    Creates an isolated MRN identity under active FacilityId
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="p-1.5 text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-4 space-y-4" aria-busy={isRegistering}>
              {registerError && (
                <p
                  className="rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800"
                  role="alert"
                  aria-live="assertive"
                >
                  {registerError}
                </p>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                    placeholder="e.g. Babatunde"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                    placeholder="e.g. Olawale"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Gender *</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    value={formData.dob}
                    onChange={(e) => setFormData({ ...formData, dob: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                    placeholder="+234 803 000 0000"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Blood Group</label>
                  <select
                    value={formData.bloodGroup}
                    onChange={(e) => setFormData({ ...formData, bloodGroup: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  >
                    <option value="">Unknown</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Genotype</label>
                  <select
                    value={formData.genotype}
                    onChange={(e) => setFormData({ ...formData, genotype: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  >
                    <option value="">Unknown</option>
                    <option value="AA">AA</option>
                    <option value="AS">AS</option>
                    <option value="SS">SS</option>
                    <option value="AC">AC</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Known Drug Allergies
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formData.noKnownAllergies}
                        onChange={(e) => setFormData({ ...formData, noKnownAllergies: e.target.checked, allergies: [] })}
                        className="rounded text-[#006837] focus:ring-[#006837]"
                      />
                      <span className="text-xs text-slate-700">No known allergies</span>
                    </label>
                    {!formData.noKnownAllergies && (
                      <div>
                        <div className="flex flex-wrap gap-1.5 mb-1">
                          {allergySuggestions.map((allergy) => (
                            <button
                              type="button"
                              key={allergy}
                              onClick={() => {
                                if (!formData.allergies.includes(allergy)) {
                                  setFormData({ ...formData, allergies: [...formData.allergies, allergy] });
                                }
                              }}
                              disabled={formData.allergies.includes(allergy)}
                              className={`px-2 py-1 text-[10px] rounded-full border transition-colors ${
                                formData.allergies.includes(allergy)
                                  ? 'bg-[#006837] text-white border-[#006837]'
                                  : 'bg-white text-slate-700 border-slate-200 hover:border-[#006837] hover:text-[#006837]'
                              }`}
                            >
                              {allergy}
                            </button>
                          ))}
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            placeholder="Add custom allergy..."
                            className="flex-1 px-3 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                                e.preventDefault();
                                const val = e.currentTarget.value.trim();
                                if (!formData.allergies.includes(val)) {
                                  setFormData({ ...formData, allergies: [...formData.allergies, val] });
                                }
                                e.currentTarget.value = '';
                              }
                            }}
                          />
                        </div>
                        {formData.allergies.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mt-1">
                            {formData.allergies.map((allergy) => (
                              <span key={allergy} className="px-2 py-0.5 text-[10px] bg-rose-50 text-rose-800 border border-rose-200 rounded-full flex items-center gap-1">
                                {allergy}
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, allergies: formData.allergies.filter((a) => a !== allergy) })}
                                  className="text-rose-600 hover:text-rose-900"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Next of Kin */}
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-700">Next of Kin Details</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    placeholder="Kin Full Name"
                    value={formData.kinName}
                    onChange={(e) => setFormData({ ...formData, kinName: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  />
                  <input
                    type="text"
                    placeholder="Relationship (e.g. Spouse)"
                    value={formData.kinRelationship}
                    onChange={(e) => setFormData({ ...formData, kinRelationship: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  />
                  <input
                    type="tel"
                    placeholder="Kin Phone Number"
                    value={formData.kinPhone}
                    onChange={(e) => setFormData({ ...formData, kinPhone: e.target.value })}
                    className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                  />
                </div>
              </div>

              {/* HMO Insurance Section */}
              <div className="p-3.5 rounded-xl bg-[#EAF7EE]/50 border border-[#c4e9cf] space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-bold text-slate-900">Health Insurance / HMO</div>
                  <label className="flex items-center gap-1.5 text-xs text-slate-800 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.hasHmo}
                      onChange={(e) => setFormData({ ...formData, hasHmo: e.target.checked })}
                      className="rounded text-[#006837] focus:ring-[#006837]"
                    />
                    <span>Patient has HMO Policy</span>
                  </label>
                </div>

                {formData.hasHmo && (
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-2 pt-1">
                    <div>
                      <label className="text-[10px] text-slate-700 font-semibold">Provider</label>
                      <select
                        value={formData.hmoProvider}
                        onChange={(e) => setFormData({ ...formData, hmoProvider: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                      >
                        <option value="Hygeia HMO">Hygeia HMO</option>
                        <option value="Reliance HMO">Reliance HMO</option>
                        <option value="AXA Mansard Health">AXA Mansard</option>
                        <option value="Leadway Health">Leadway Health</option>
                        <option value="NHIS (National Health)">NHIS</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-700 font-semibold">Policy No.</label>
                      <input
                        type="text"
                        placeholder="HYG-88219"
                        value={formData.policyNumber}
                        onChange={(e) => setFormData({ ...formData, policyNumber: e.target.value })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-700 font-semibold">Tier</label>
                      <select
                        value={formData.coverageTier}
                        onChange={(e) => setFormData({ ...formData, coverageTier: e.target.value as any })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                      >
                        <option value="Standard">Standard</option>
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Executive">Executive</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-700 font-semibold">Co-Pay %</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.coPayPercentage}
                        onChange={(e) => setFormData({ ...formData, coPayPercentage: Number(e.target.value) })}
                        className="w-full px-2 py-1.5 text-xs rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-1 focus:ring-[#006837] focus:border-[#006837]"
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-slate-200">
                <button
                  type="button"
                  disabled={isRegistering}
                  onClick={() => setIsRegisterModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-100 cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-60"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRegistering || !facility?.id}
                  className="px-5 py-2 rounded-xl bg-[#006837] hover:bg-[#00522c] text-white font-semibold text-xs shadow-xs cursor-pointer transition-colors disabled:cursor-wait disabled:opacity-60"
                >
                  {isRegistering ? 'Saving patient…' : !facility?.id ? 'Facility not loaded…' : 'Save & Generate MRN'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
