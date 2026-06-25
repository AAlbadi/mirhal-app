
import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/api';
import { useI18n } from '../contexts/I18nContext';
import { SpotListing } from '../types';

// --- Types ---
interface AdminStats {
  totalSpots: number;
  pendingSpots: number;
  totalReviews: number;
  pendingReviews: number;
  totalTrails: number;
  pendingTrails: number;
  totalReports: number;
  pendingReports: number;
  totalUsers: number;
  activeUsers: number;
  platforms: { ios: number, android: number, web: number };
}

type ViewState = 'overview' | 'spots' | 'reviews' | 'trails' | 'users' | 'reports' | 'notifications';
type FilterState = 'pending' | 'all';

// --- Helper Components ---

const StatCard = ({ label, value, color, icon }: { label: string, value: number, color: string, icon: string }) => (
  <div className={`p-8 rounded-[2.5rem] bg-white dark:bg-stone-900 border border-stone-100 dark:border-stone-800 shadow-xl transition-all hover:scale-[1.02] flex items-center gap-6 group`}>
    <div className={`w-20 h-20 rounded-2xl ${color} flex items-center justify-center text-4xl shadow-lg group-hover:rotate-6 transition-transform`}>
      {icon}
    </div>
    <div>
      <div className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-1">{label}</div>
      <div className="text-5xl font-black text-stone-900 dark:text-white">{value}</div>
    </div>
  </div>
);

const TabPill = ({ id, label, icon, active, count, onClick }: { id: string, label: string, icon: string, active: boolean, count?: number, onClick: () => void }) => (
  <button
    onClick={onClick}
    className={`relative px-8 py-4 rounded-full font-bold text-lg transition-all duration-300 flex items-center gap-3 ${active
      ? 'bg-stone-900 text-white dark:bg-white dark:text-black shadow-xl scale-105'
      : 'bg-white text-stone-500 hover:bg-stone-100 dark:bg-stone-900 dark:text-stone-400 dark:hover:bg-stone-800'
      }`}
  >
    <span>{icon}</span>
    <span>{label}</span>
    {count !== undefined && count > 0 && (
      <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-black ${active ? 'bg-brand-orange text-white' : 'bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-300'}`}>
        {count}
      </span>
    )}
  </button>
);

const FilterToggle = ({ active, onChange }: { active: FilterState, onChange: (s: FilterState) => void }) => (
  <div className="bg-stone-100 dark:bg-stone-800 p-1 rounded-xl inline-flex mb-8">
    <button
      onClick={() => onChange('pending')}
      className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${active === 'pending' ? 'bg-white dark:bg-stone-700 shadow-md text-brand-orange' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
    >
      ⚠️ Pending
    </button>
    <button
      onClick={() => onChange('all')}
      className={`px-6 py-2 rounded-lg font-bold text-sm transition-all ${active === 'all' ? 'bg-white dark:bg-stone-700 shadow-md text-brand-orange' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'}`}
    >
      📂 All Items
    </button>
  </div>
);

// --- Modals ---

// --- Helper to get token ---
const getAccessToken = async () => {
  const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
  return session?.access_token;
};

const EditSpotModal = ({ spot, onClose, onRefresh }: { spot: any, onClose: () => void, onRefresh: () => void }) => {
  const [formData, setFormData] = useState({
    title: spot.name || spot.title,
    titleAr: spot.titleAr || '',
    description: spot.description || '',
    type: spot.type || 'Desert',
    price: spot.price || 0,
    emoji: spot.emoji || '🐪',
    images: (spot.photos || []).join('\n'),
    location: spot.location || '',
    lat: spot.coordinates?.lat || 0,
    lng: spot.coordinates?.lng || 0,
    amenities: (spot.amenities || []).join(', ')
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");

      const apiUrl = getApiUrl();
      const payload = {
        ...formData,
        images: formData.images.split('\n').filter((s: string) => s.trim()),
        amenities: formData.amenities.split(',').map((s: string) => s.trim()),
        location: {
          formattedAddress: formData.location,
          coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) }
        }
      };

      const res = await fetch(`${apiUrl}/api/admin/vehicles/${spot.id || spot._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Spot updated safely!');
        onRefresh();
        onClose();
      } else {
        throw new Error('Update failed');
      }
    } catch (err) {
      alert('Error updating spot');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black mb-6 dark:text-white">Edit Spot: {spot.name}</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} placeholder="Title (Ar)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full text-right" />
          </div>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="Price" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="Phone (Paid Spots)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
          </div>
          <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full mb-4">
            {['Desert', 'Beach', 'Mountain', 'Camping Spot', 'PaidCamping', 'Glamping'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-4">
            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location text" className="col-span-3 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input type="number" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} placeholder="Lat" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input type="number" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} placeholder="Lng" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input value={formData.emoji} onChange={e => setFormData({ ...formData, emoji: e.target.value })} placeholder="Emoji" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full text-center text-2xl" />
          </div>
          <textarea value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })} placeholder="Image URLs (one per line)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24 font-mono text-xs" />
          <input value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="Amenities (comma sep)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-stone-200 dark:bg-stone-800 py-3 rounded-xl font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-brand-orange text-white py-3 rounded-xl font-bold">Save Changes</button>
          </div>
        </form>
      </div>
    </div>
  );
};

const AddSpotModal = ({ onClose, onRefresh }: { onClose: () => void, onRefresh: () => void }) => {
  const [formData, setFormData] = useState({
    title: '', titleAr: '', description: '', type: 'Desert', price: 0, contactPhone: '',
    emoji: '🐪', images: '', location: 'Dubai, UAE', lat: 25.2048, lng: 55.2708,
    amenities: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("No token");
      const apiUrl = getApiUrl();

      // Need a host ID. Since we are admin, fetch 'me' or first host.
      // Quick hack: fetch hosts list and pick first one if current user isn't host in object?
      // Or just let backend assign? Backend vehicle schema has hostId required false OR required?
      // model says: hostId required: false (for anon). But we want it to be valid.
      // Let's assume the backend will handle checks or we just try posting without specific hostId first (anon).
      // Or better, fetch a "System Host" or user ID.
      // Let's rely on standard post.

      const payload = {
        ...formData,
        images: formData.images.split('\n').filter(s => s.trim()),
        amenities: formData.amenities.split(',').map(s => s.trim()),
        location: {
          formattedAddress: formData.location,
          address: formData.location,
          coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) }
        },
        year: 2025, sleeps: 2, // Defaults
        hostId: 'ADMINTEMP' // Backend might ignore or fail if valid ID needed.
        // Actually best is to just fetch /api/users/me and use that ID correctly.
      };

      // We will try to fetch user ID first
      const meRes = await fetch(`${apiUrl}/api/users/profile`, { headers: { Authorization: `Bearer ${token}` } });
      if (meRes.ok) {
        const me = await meRes.json();
        payload.hostId = me._id || me.user?._id;
      }

      const res = await fetch(`${apiUrl}/api/admin/vehicles`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        alert('Spot Created!');
        onRefresh();
        onClose();
      } else {
        const d = await res.json();
        alert('Creation Failed: ' + (d.error || 'Unknown'));
      }
    } catch (err) {
      alert('Error creating spot');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-black mb-6 dark:text-white">Add New Spot</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" required className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} placeholder="Title (Ar)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full text-right" />
          </div>
          <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" required className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24" />
          <div className="grid grid-cols-2 gap-4">
            <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="Price" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="Phone (Paid Spots)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
          </div>
          <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full mb-4">
            {['Desert', 'Beach', 'Mountain', 'Camping Spot', 'PaidCamping', 'Glamping'].map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <div className="grid grid-cols-3 gap-4">
            <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location text" className="col-span-3 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input type="number" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} placeholder="Lat" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
            <input type="number" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} placeholder="Lng" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
          </div>
          <textarea value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })} placeholder="Image URLs (one per line)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24 font-mono text-xs" />

          <div className="flex gap-4 pt-4">
            <button type="button" onClick={onClose} className="flex-1 bg-stone-200 dark:bg-stone-800 py-3 rounded-xl font-bold">Cancel</button>
            <button type="submit" className="flex-1 bg-brand-orange text-white py-3 rounded-xl font-bold">Create Spot</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- Custom Modals ---

const ConfirmationModal = ({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  isDestructive = false
}: {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  isDestructive?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-sm p-8 shadow-2xl border border-stone-100 dark:border-stone-800 scale-100 animate-in zoom-in-95 duration-200">
        <h3 className="text-2xl font-black mb-2 dark:text-white">{title}</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-8 font-medium">{message}</p>
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 py-3 px-4 rounded-xl font-bold bg-stone-100 text-stone-600 hover:bg-stone-200 dark:bg-stone-800 dark:text-stone-300 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:scale-105 active:scale-95 ${isDestructive ? 'bg-red-500 hover:bg-red-600' : 'bg-brand-orange hover:bg-orange-600'}`}
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

const SyncModal = ({
  isOpen,
  onConfirm,
  onCancel,
  defaultValue
}: {
  isOpen: boolean;
  onConfirm: (id: string, mode: 'import' | 'export') => void;
  onCancel: () => void;
  defaultValue?: string;
}) => {
  const [value, setValue] = useState(defaultValue || '');
  const [mode, setMode] = useState<'import' | 'export'>('import');

  useEffect(() => {
    if (isOpen && defaultValue) {
      setValue(defaultValue);
    }
  }, [isOpen, defaultValue]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 rounded-[2rem] w-full max-w-md p-8 shadow-2xl border border-stone-100 dark:border-stone-800">
        <h3 className="text-2xl font-black mb-2 dark:text-white">Sync Google Sheet</h3>
        <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">Paste the Spreadsheet ID or full URL below.</p>

        {/* Mode Toggle */}
        <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mb-6">
          <button
            onClick={() => setMode('import')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'import' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-500'}`}
          >
            📥 Import (Start Fresh)
          </button>
          <button
            onClick={() => setMode('export')}
            className={`flex-1 py-2 rounded-lg text-sm font-bold transition-all ${mode === 'export' ? 'bg-white dark:bg-stone-700 shadow-sm text-brand-orange' : 'text-stone-500'}`}
          >
            📤 Export (Push Data)
          </button>
        </div>

        <input
          autoFocus
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="https://docs.google.com/spreadsheets/d/..."
          className="w-full p-4 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-xl mb-6 font-mono text-sm focus:border-brand-orange outline-none transition-colors"
        />

        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 py-3 rounded-xl font-bold bg-stone-100 text-stone-600 hover:bg-stone-200">Cancel</button>
          <button
            onClick={() => onConfirm(value, mode)}
            disabled={!value.trim()}
            className="flex-1 py-3 rounded-xl font-bold bg-brand-orange text-white hover:bg-orange-600 disabled:opacity-50 transition-all"
          >
            {mode === 'import' ? 'Start Import' : 'Start Export'}
          </button>
        </div>
      </div>
    </div>
  );
}

// --- Main Component ---

const AdminDashboard: React.FC = () => {
  const { t } = useI18n();

  // State
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewState>('overview');
  const [filter, setFilter] = useState<FilterState>('pending');

  // Data
  const [spots, setSpots] = useState<SpotListing[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [trails, setTrails] = useState<any[]>([]);
  const [reports, setReports] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [stats, setStats] = useState<AdminStats>({
    totalSpots: 0, pendingSpots: 0,
    totalReviews: 0, pendingReviews: 0,
    totalTrails: 0, pendingTrails: 0,
    totalReports: 0, pendingReports: 0,
    totalUsers: 0, activeUsers: 0,
    platforms: { ios: 0, android: 0, web: 0 }
  });

  // Action State
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState<string | null>(null); // 'spots', 'reviews', 'trails'

  // Modal State
  const [editingSpot, setEditingSpot] = useState<any | null>(null);
  const [showAddSpot, setShowAddSpot] = useState(false);

  // Custom Confirm/Input State
  const [confirmState, setConfirmState] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    isDestructive?: boolean;
    onConfirm: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => { }
  });

  const [syncModalState, setSyncModalState] = useState<{
    isOpen: boolean;

    type: 'spots' | 'reviews' | 'trails' | null;
    spreadsheetId?: string;
  }>({
    isOpen: false,
    type: null,
    spreadsheetId: ''
  });

  const [notifForm, setNotifForm] = useState({ title: '', body: '' });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async (background = false) => {
    try {
      if (!background) setLoading(true);
      const apiUrl = getApiUrl();
      const token = await getAccessToken();

      if (!token) { setLoading(false); return; }

      const headers = { Authorization: `Bearer ${token}` };

      // 1. Fetch Spots (All)
      const spotsRes = await fetch(`${apiUrl}/api/admin/vehicles/all`, { headers });
      const spotsData = await spotsRes.json();
      const rawSpots = spotsData.vehicles || [];
      const transformedSpots: SpotListing[] = rawSpots.map((v: any) => ({
        id: v._id || v.id,
        _id: v._id,
        spotId: v.spotId,
        name: v.title || v.name,
        title: v.title,
        titleAr: v.titleAr,
        description: v.description || '',
        descriptionAr: v.descriptionAr,
        emoji: v.emoji || '🐪',
        type: v.type,
        location: v.location?.formattedAddress || v.location?.address || v.location || 'Unknown',
        coordinates: { lat: v.location?.coordinates?.lat || 0, lng: v.location?.coordinates?.lng || 0 },
        photos: v.images || v.photos || [],
        images: v.images || v.photos || [],
        amenities: v.amenities || v.features || [],
        headerImage: (v.images && v.images[0]) || '',
        price: v.price || 0,
        contactPhone: v.contactPhone,
        hostId: v.hostId?._id || v.hostId,
        host: v.hostId && typeof v.hostId === 'object' ? {
          name: v.hostId.name,
          email: v.hostId.email,
          picture: v.hostId.picture
        } : undefined,
        approvalStatus: v.approvalStatus || 'pending',
        rating: v.rating?.average || 0,
        reviewCount: v.rating?.count || 0
      }));

      // 2. Fetch Reviews (All)
      const reviewsRes = await fetch(`${apiUrl}/api/admin/reviews/all`, { headers });
      const reviewsData = await reviewsRes.json();
      const allReviews = reviewsData.reviews || [];

      // 3. Fetch Trails (All)
      const pendingTrailsRes = await fetch(`${apiUrl}/api/trails/pending`, { headers });
      const allTrailsRes = await fetch(`${apiUrl}/api/trails/all`, { headers });

      const pTrails = pendingTrailsRes.ok ? (await pendingTrailsRes.json()).trails : [];
      const allTrailsList = allTrailsRes.ok ? (await allTrailsRes.json()).trails : [];

      const mergedTrailsMap = new Map();
      [...pTrails, ...allTrailsList].forEach(t => mergedTrailsMap.set(t._id, t));
      const allTrails = Array.from(mergedTrailsMap.values());

      // 3.5 Fetch Reports (New)
      const reportsRes = await fetch(`${apiUrl}/api/admin/reports`, { headers });
      const reportsData = reportsRes.ok ? await reportsRes.json() : { reports: [] };
      const allReports = reportsData.reports || [];

      setSpots(transformedSpots);
      setReviews(allReviews);
      setTrails(allTrails);
      setReports(allReports);

      // 4. Fetch Stats (Enhanced)
      const statsRes = await fetch(`${apiUrl}/api/admin/stats`, { headers });
      const statsData = await statsRes.json();

      // 5. Fetch Users (Initial)
      const usersRes = await fetch(`${apiUrl}/api/admin/users?limit=20`, { headers });
      const usersData = await usersRes.json();
      setUsers(usersData.users || []);

      setStats({
        totalSpots: transformedSpots.length,
        pendingSpots: transformedSpots.filter(s => s.approvalStatus === 'pending').length,
        totalReviews: allReviews.length,
        pendingReviews: allReviews.filter(r => r.approvalStatus === 'pending').length,
        totalTrails: allTrails.length,
        pendingTrails: allTrails.filter(t => t.approvalStatus === 'pending').length,
        totalReports: allReports.length,
        pendingReports: allReports.filter((r: any) => r.status === 'pending').length,
        totalUsers: statsData.totalUsers || 0,
        activeUsers: statsData.activeUsers || 0,
        platforms: {
          ios: statsData.iosUsers || 0,
          android: statsData.androidUsers || 0,
          web: statsData.webUsers || 0
        }
      });

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // --- Actions ---

  const handleSyncClick = (type: 'spots' | 'reviews' | 'trails') => {
    let defaultId = '';
    if (type === 'spots') defaultId = '1rsjJgYTYzC0HS4qnEaji8k0OM272pdM6gSWHHLFuQD8';
    if (type === 'reviews') defaultId = '1SC0qC-Cp21_SNnOYkqEbym3MVRF_hqbMFDMs9gt1Pk4';
    if (type === 'trails') defaultId = '1MVGXhqc0sBGxwQpkvDFP49noVvszEIvB46O0glAkHi4';

    setSyncModalState({ isOpen: true, type, spreadsheetId: defaultId });
  };

  const handleSyncConfirm = async (spreadsheetId: string, mode: 'import' | 'export') => {
    const type = syncModalState.type;
    setSyncModalState({ isOpen: false, type: null });
    if (!type || !spreadsheetId) return;

    setSyncing(type);
    try {
      let id = spreadsheetId;
      if (spreadsheetId.includes('/d/')) {
        const match = spreadsheetId.match(/\/d\/([a-zA-Z0-9-_]+)/);
        if (match) id = match[1];
      }

      const apiUrl = getApiUrl();
      const token = await getAccessToken();

      let endpoint = '';
      if (mode === 'import') {
        endpoint = type === 'spots' ? 'sync-spots' : type === 'reviews' ? 'sync-reviews' : 'sync-trails';
      } else {
        endpoint = type === 'spots' ? 'export-to-sheet' : type === 'reviews' ? 'export-reviews' : 'export-trails';
      }

      const res = await fetch(`${apiUrl}/api/admin/${endpoint}`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetId: id })
      });

      const data = await res.json();
      if (res.ok) {
        let msg = `✅ ${mode === 'import' ? 'Import' : 'Export'} Complete!\n${mode === 'import' ? 'Updated' : 'Exported'}: ${data.results?.synced || data.results?.updated || data.results?.exported || 0}`;
        if (data.results?.errors && data.results.errors.length > 0) {
          msg += `\n\n⚠️ Some items failed:\n${data.results.errors.slice(0, 5).join('\n')}`;
        }
        alert(msg);
        fetchData(true);
      } else {
        alert('Sync Failed: ' + data.error);
      }
    } catch (err: any) {
      alert('Error: ' + err.message);
    } finally {
      setSyncing(null);
    }
  };

  const handleSendNotification = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirm('Send this notification to ALL users?')) return;

    try {
      const token = await getAccessToken();
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/notifications/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(notifForm)
      });

      if (res.ok) {
        alert('✅ Notification Sent!');
        setNotifForm({ title: '', body: '' });
      } else {
        const d = await res.json();
        alert('Failed: ' + d.error);
      }
    } catch (err) {
      alert('Error sending notification');
    }
  };

  const executeAction = async (collection: 'vehicles' | 'reviews' | 'trails' | 'reports', id: string, action: 'approve' | 'reject' | 'delete' | 'resolve' | 'dismiss') => {
    setProcessingId(id);
    setConfirmState(prev => ({ ...prev, isOpen: false })); // Close modal

    // OPTIMISTIC UPDATE
    if (collection === 'vehicles') {
      setSpots(prev => prev.map(s => s.id === id ? { ...s, approvalStatus: action === 'delete' ? 'deleted' : action === 'approve' ? 'approved' : 'rejected' } : s));
    } else if (collection === 'reviews') {
      setReviews(prev => prev.map(r => r._id === id ? { ...r, approvalStatus: action === 'delete' ? 'deleted' : action === 'approve' ? 'approved' : 'rejected' } : r));
    } else if (collection === 'trails') {
      setTrails(prev => prev.map(t => t._id === id ? { ...t, approvalStatus: action === 'delete' ? 'deleted' : action === 'approve' ? 'approved' : 'rejected' } : t));
    } else if (collection === 'reports') {
      setReports(prev => prev.map(r => r._id === id ? { ...r, status: action === 'resolve' ? 'resolved' : 'dismissed' } : r));
    }

    try {
      const apiUrl = getApiUrl();
      const token = await getAccessToken();
      let method = 'POST';
      let url = '';

      if (collection === 'reports') {
        if (action === 'resolve') url = `${apiUrl}/api/admin/reports/${id}/resolve`;
        else if (action === 'dismiss') url = `${apiUrl}/api/admin/reports/${id}/dismiss`;
      } else if (action === 'delete') {
        url = `${apiUrl}/api/admin/${collection}/${id}`;
        method = 'DELETE';
      } else {
        url = `${apiUrl}/api/admin/${collection}/${id}/${action}`;
      }

      // Handle specific reject overrides
      if (action === 'reject') {
        if (collection === 'vehicles') url = `${apiUrl}/api/admin/vehicles/${id}/reject`;
        else if (collection === 'reviews') url = `${apiUrl}/api/admin/reviews/${id}/reject`;
        else if (collection === 'trails') url = `${apiUrl}/api/admin/trails/${id}/reject`;
      }

      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: 'Admin Action' })
      });

      if (res.ok) {
        fetchData(true);
      } else {
        const d = await res.json();
        console.error('Action failed:', d);
        alert('Action failed: ' + (d.error || 'Server Error'));
        fetchData(true); // Revert
      }
    } catch (err: any) {
      console.error('Action error:', err);
      // alert('Error performing action: ' + err.message);
      fetchData(true); // Revert
    } finally {
      setProcessingId(null);
    }
  };

  const handleActionClick = (collection: 'vehicles' | 'reviews' | 'trails' | 'reports', id: string, action: 'approve' | 'reject' | 'delete' | 'resolve' | 'dismiss') => {
    let title = '';
    let message = '';

    if (collection === 'reports') {
      title = action === 'resolve' ? 'Resolve Report?' : 'Dismiss Report?';
      message = action === 'resolve'
        ? 'Mark this report as resolved? This implies you have taken necessary action.'
        : 'Dismiss this report? This implies it was invalid or handled.';
    } else {
      title = action === 'approve' ? 'Approve Item?' : action === 'reject' ? 'Reject Item?' : 'Delete Item?';
      message = `Are you sure you want to ${action} this item? This action is immediate.`;
    }

    setConfirmState({
      isOpen: true,
      title,
      message,
      isDestructive: action === 'reject' || action === 'delete',
      onConfirm: () => executeAction(collection, id, action)
    });
  };

  // --- Render Helpers ---

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case 'approved': return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">✅ Approved</span>;
      case 'rejected': return <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">❌ Rejected</span>;
      default: return <span className="bg-yellow-100 text-yellow-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide">⚠️ Pending</span>;
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 dark:bg-stone-950">
      <div className="w-16 h-16 border-4 border-brand-orange border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pt-48 pb-20 px-6 transition-colors duration-500 relative">

      {/* Modals */}
      {editingSpot && <EditSpotModal spot={editingSpot} onClose={() => setEditingSpot(null)} onRefresh={fetchData} />}
      {showAddSpot && <AddSpotModal onClose={() => setShowAddSpot(false)} onRefresh={fetchData} />}

      <ConfirmationModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.onConfirm}
        onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmState.isDestructive}
      />

      <SyncModal
        isOpen={syncModalState.isOpen}
        onConfirm={handleSyncConfirm}
        onCancel={() => setSyncModalState({ isOpen: false, type: null })}
        defaultValue={syncModalState.spreadsheetId}
      />

      <div className="max-w-7xl mx-auto">
        <header className="mb-12">
          <h1 className="text-5xl font-black text-stone-900 dark:text-white mb-4">Admin Command 🕹️</h1>
          <p className="text-xl text-stone-500 font-medium">Manage and curate the marketplace.</p>
        </header>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          <StatCard label="Pending Spots" value={stats.pendingSpots} color="bg-orange-100 text-brand-orange" icon="🏜️" />
          <StatCard label="Pending Reviews" value={stats.pendingReviews} color="bg-yellow-100 text-yellow-600" icon="⭐" />
          <StatCard label="Pending Trails" value={stats.pendingTrails} color="bg-green-100 text-green-600" icon="🥾" />
          <StatCard label="Reports" value={stats.pendingReports} color="bg-red-100 text-red-600" icon="🚩" />
          <div onClick={() => handleSyncClick('spots')} className="cursor-pointer p-8 rounded-[2.5rem] bg-stone-900 text-white shadow-xl transition-all hover:scale-[1.02] flex items-center gap-6 group">
            <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center text-4xl">🔄</div>
            <div>
              <div className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-1">Click to Sync</div>
              <div className="text-2xl font-black">Sync Sheets</div>
            </div>
          </div>
        </div>

        {/* Navigation Pills */}
        <div className="flex flex-wrap gap-4 mb-12 justify-center lg:justify-start">
          <TabPill id="overview" label="Overview" icon="📊" active={view === 'overview'} onClick={() => setView('overview')} />
          <TabPill id="users" label="Users" icon="👥" count={stats.totalUsers} active={view === 'users'} onClick={() => { setView('users'); setFilter('all'); }} />
          <TabPill id="spots" label="Spots" icon="🏜️" count={stats.pendingSpots} active={view === 'spots'} onClick={() => { setView('spots'); setFilter('pending'); }} />
          <TabPill id="reviews" label="Reviews" icon="⭐" count={stats.pendingReviews} active={view === 'reviews'} onClick={() => { setView('reviews'); setFilter('pending'); }} />
          <TabPill id="trails" label="Trails" icon="🥾" count={stats.pendingTrails} active={view === 'trails'} onClick={() => { setView('trails'); setFilter('pending'); }} />
          <TabPill id="reports" label="Reports" icon="🚩" count={stats.pendingReports} active={view === 'reports'} onClick={() => { setView('reports'); setFilter('pending'); }} />
          <TabPill id="notifications" label="Push Notif" icon="📲" active={view === 'notifications'} onClick={() => setView('notifications')} />
        </div>

        {/* Main Content Area */}
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-500">

          {/* --- NOTIFICATIONS VIEW --- */}
          {view === 'notifications' && (
            <div className="max-w-2xl mx-auto bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 md:p-12 shadow-2xl border border-stone-100 dark:border-stone-800">
              <div className="text-center mb-8">
                <div className="inline-flex p-4 rounded-2xl bg-brand-orange/10 text-brand-orange mb-4">
                  <span className="text-4xl">📲</span>
                </div>
                <h2 className="text-3xl font-black dark:text-white">Push Notification</h2>
                <p className="text-stone-500 dark:text-stone-400 mt-2">Send a message to ALL devices instantly.</p>
              </div>

              <form onSubmit={handleSendNotification} className="space-y-6">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Title</label>
                  <input
                    value={notifForm.title}
                    onChange={e => setNotifForm({ ...notifForm, title: e.target.value })}
                    className="w-full p-4 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-xl font-bold dark:text-white focus:border-brand-orange outline-none"
                    placeholder="e.g. New Spot Added!"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Message Body</label>
                  <textarea
                    value={notifForm.body}
                    onChange={e => setNotifForm({ ...notifForm, body: e.target.value })}
                    className="w-full p-4 h-32 bg-stone-50 dark:bg-stone-950 border-2 border-stone-100 dark:border-stone-800 rounded-xl font-medium dark:text-white focus:border-brand-orange outline-none resize-none"
                    placeholder="Type your message here..."
                    required
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full py-4 bg-brand-orange text-white rounded-xl font-black text-lg shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-95 transition-all"
                  >
                    Send to All Users
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* --- REPORTS VIEW --- */}
          {view === 'reports' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <FilterToggle active={filter} onChange={setFilter} />
              </div>

              <div className="grid grid-cols-1 gap-6">
                {(filter === 'pending' ? reports.filter((r: any) => r.status === 'pending') : reports).length === 0 ? (
                  <div className="text-center py-20 text-stone-400">
                    <div className="text-6xl mb-4">🛡️</div>
                    <p className="text-lg font-bold">No reports found.</p>
                  </div>
                ) : (
                  (filter === 'pending' ? reports.filter((r: any) => r.status === 'pending') : reports).map((report: any) => (
                    <div key={report._id} className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-lg border border-stone-100 dark:border-stone-800 flex flex-col md:flex-row gap-6">
                      <div className="flex-shrink-0 w-full md:w-48 aspect-video md:aspect-square rounded-2xl overflow-hidden bg-stone-100 relative">
                        {report.spotId?.images?.[0] ? (
                          <img src={report.spotId.images[0]} className="w-full h-full object-cover" alt="" />
                        ) : (
                          <div className="flex items-center justify-center w-full h-full text-4xl">🏜️</div>
                        )}
                        <div className="absolute top-2 right-2 bg-red-100 text-red-600 p-2 rounded-full shadow-sm">
                          <div className="font-bold text-xs uppercase tracking-wide px-2">Reported</div>
                        </div>
                      </div>

                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <div className="text-xs font-bold text-red-500 uppercase tracking-widest mb-1">{report.reason}</div>
                            <h3 className="text-xl font-black text-stone-900 dark:text-white uppercase">{report.spotName}</h3>
                            <div className="text-xs text-stone-400 font-mono mt-1">ID: {report.spotId?._id || 'Unknown'}</div>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${report.status === 'resolved' ? 'bg-green-100 text-green-600' : report.status === 'dismissed' ? 'bg-stone-200 text-stone-500' : 'bg-yellow-100 text-yellow-600'}`}>
                            {report.status}
                          </span>
                        </div>

                        <div className="bg-stone-50 dark:bg-stone-800/50 p-4 rounded-xl mb-4">
                          <p className="text-stone-600 dark:text-stone-300 italic">"{report.details || 'No additional details provided.'}"</p>
                        </div>

                        <div className="flex gap-4">
                          {/* View Spot Button (Link to spot) */}
                          <a href={`/spot/${report.spotId?._id}`} target="_blank" rel="noreferrer" className="px-4 py-2 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 text-sm flex items-center gap-2">
                            Open Spot ↗
                          </a>

                          {report.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleActionClick('reports', report._id, 'resolve')}
                                disabled={processingId === report._id}
                                className="px-4 py-2 rounded-xl bg-green-100 text-green-700 font-bold hover:bg-green-200 text-sm flex items-center gap-2"
                              >
                                ✅ Mark Resolved
                              </button>
                              <button
                                onClick={() => handleActionClick('reports', report._id, 'dismiss')}
                                disabled={processingId === report._id}
                                className="px-4 py-2 rounded-xl bg-stone-100 text-stone-600 font-bold hover:bg-stone-200 text-sm flex items-center gap-2"
                              >
                                🚫 Dismiss
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* --- USERS VIEW --- */}
          {view === 'users' && (
            <div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <StatCard label="Total Users" value={stats.totalUsers} color="bg-blue-100 text-blue-600" icon="👥" />
                <StatCard label="Active (30d)" value={stats.activeUsers} color="bg-green-100 text-green-600" icon="🟢" />
                <div className="p-8 rounded-[2.5rem] bg-stone-900 border border-stone-800 shadow-xl flex flex-col justify-center relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-32 bg-brand-orange/10 rounded-full blur-3xl -mr-16 -mt-16 transition-all duration-700 group-hover:bg-brand-orange/20"></div>

                  <div className="text-stone-400 font-bold uppercase tracking-widest text-xs mb-6 relative z-10">User Demographics</div>

                  <div className="flex flex-col gap-4 relative z-10">
                    {/* iOS Segment */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-xl">📱</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <div className="font-bold text-white">iOS Users</div>
                          <div className="text-xs font-mono text-blue-400">{Math.round((stats.platforms.ios / stats.totalUsers) * 100) || 0}%</div>
                        </div>
                        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div style={{ width: `${(stats.platforms.ios / stats.totalUsers) * 100}%` }} className="h-full bg-blue-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Android Segment */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-xl">🤖</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <div className="font-bold text-white">Android Users</div>
                          <div className="text-xs font-mono text-green-400">{Math.round((stats.platforms.android / stats.totalUsers) * 100) || 0}%</div>
                        </div>
                        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div style={{ width: `${(stats.platforms.android / stats.totalUsers) * 100}%` }} className="h-full bg-green-500 rounded-full"></div>
                        </div>
                      </div>
                    </div>

                    {/* Web Segment */}
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center text-xl">💻</div>
                      <div className="flex-1">
                        <div className="flex justify-between items-end mb-1">
                          <div className="font-bold text-white">Web Users</div>
                          <div className="text-xs font-mono text-stone-400">{Math.round((stats.platforms.web / stats.totalUsers) * 100) || 0}%</div>
                        </div>
                        <div className="w-full h-2 bg-stone-800 rounded-full overflow-hidden">
                          <div style={{ width: `${(stats.platforms.web / stats.totalUsers) * 100}%` }} className="h-full bg-white rounded-full"></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-xl border border-stone-100 dark:border-stone-800 overflow-hidden">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-xs text-stone-400 uppercase tracking-widest border-b border-stone-100 dark:border-stone-800">
                      <th className="pb-4 pl-4">User</th>
                      <th className="pb-4">Role</th>
                      <th className="pb-4">Platform</th>
                      <th className="pb-4">Joined</th>
                      <th className="pb-4">Last Active</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-stone-100 dark:divide-stone-800">
                    {users.map((user: any) => (
                      <tr key={user._id} className="hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors">
                        <td className="py-4 pl-4">
                          <div className="flex items-center gap-3">
                            <img src={user.picture || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full" alt="" />
                            <div>
                              <div className="font-bold text-stone-900 dark:text-white">{user.name}</div>
                              <div className="text-xs text-stone-400">{user.email}</div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${user.role === 'host' ? 'bg-purple-100 text-purple-600' : 'bg-stone-100 text-stone-500'}`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4">
                          <span className="text-xl">{user.platform === 'ios' ? '🍎' : user.platform === 'android' ? '🤖' : '💻'}</span>
                        </td>
                        <td className="py-4 text-sm text-stone-500 font-medium">
                          {new Date(user.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-4 text-sm text-stone-500 font-medium">
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* --- SPOTS VIEW --- */}
          {view === 'spots' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <FilterToggle active={filter} onChange={setFilter} />
                <button onClick={() => setShowAddSpot(true)} className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-black transition-all">+ Add Spot</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {spots.filter(s => filter === 'pending' ? s.approvalStatus === 'pending' : true).map(spot => (
                  <div key={spot.id} className="bg-white dark:bg-stone-900 rounded-[2rem] p-4 shadow-lg border border-stone-100 dark:border-stone-800 group hover:shadow-2xl transition-all">
                    <div className="relative h-48 rounded-[1.5rem] overflow-hidden mb-4 bg-stone-100">
                      {spot.photos[0] && <img src={spot.photos[0]} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" alt="" />}
                      <div className="absolute top-3 right-3">{renderStatusBadge(spot.approvalStatus)}</div>
                    </div>
                    <div className="px-2 mb-4">
                      <h3 className="text-xl font-black text-stone-900 dark:text-white leading-tight mb-1">{spot.name}</h3>
                      <p className="text-sm text-stone-500 flex items-center gap-1 mb-2">📍 {spot.location}</p>
                      <div className="text-xs text-stone-400 font-medium">📅 Submitted: {new Date(spot.createdAt || Date.now()).toLocaleDateString()}</div>

                      {/* Detailed Info for Paid Camping/All */}
                      <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 grid grid-cols-2 gap-2 text-sm">
                        <div className="bg-stone-50 dark:bg-stone-800 p-2 rounded-lg">
                          <div className="text-xs text-stone-400">Type</div>
                          <div className="font-bold dark:text-white">{spot.emoji} {spot.type}</div>
                        </div>
                        {(spot.price > 0 || spot.type === 'PaidCamping') && (
                          <div className="bg-green-50 dark:bg-green-900/20 p-2 rounded-lg">
                            <div className="text-xs text-green-600 dark:text-green-400">Price</div>
                            <div className="font-bold text-green-700 dark:text-green-300">{spot.price} AED</div>
                          </div>
                        )}
                        {spot.contactPhone && (
                          <div className="col-span-2 bg-blue-50 dark:bg-blue-900/20 p-2 rounded-lg flex items-center gap-2">
                            <div className="bg-white dark:bg-blue-900 p-1 rounded-full text-xs shadow-sm">📞</div>
                            <div>
                              <div className="text-xs text-blue-600 dark:text-blue-400">Contact</div>
                              <div className="font-bold text-blue-700 dark:text-blue-300">{spot.contactPhone}</div>
                            </div>
                          </div>
                        )}
                      </div>
                      {spot.host && (
                        <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-800 flex items-center gap-3">
                          <img src={spot.host.picture || `https://ui-avatars.com/api/?name=${spot.host.name}`} className="w-8 h-8 rounded-full bg-stone-100 object-cover" alt="" />
                          <div className="overflow-hidden">
                            <div className="text-xs text-stone-400">Submitted by</div>
                            <div className="text-xs font-bold text-stone-900 dark:text-white truncate" title={spot.host.name}>{spot.host.name}</div>
                            <div className="text-[10px] text-stone-500 truncate">{spot.host.email}</div>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {spot.approvalStatus === 'pending' ? (
                        <>
                          <button onClick={() => handleActionClick('vehicles', spot.id, 'approve')} disabled={!!processingId} className="flex-1 bg-green-500 hover:bg-green-600 text-white py-3 rounded-xl font-bold transition-all disabled:opacity-50">Approve</button>
                          <button onClick={() => handleActionClick('vehicles', spot.id, 'reject')} disabled={!!processingId} className="flex-1 bg-red-100 hover:bg-red-200 text-red-600 py-3 rounded-xl font-bold transition-all disabled:opacity-50">Reject</button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => setEditingSpot(spot)} className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-900 py-3 rounded-xl font-bold transition-all">Edit</button>
                          <button onClick={() => handleActionClick('vehicles', spot.id, 'delete')} className="w-12 bg-red-50 text-red-500 rounded-xl font-bold hover:bg-red-100 flex items-center justify-center">🗑️</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              {spots.filter(s => filter === 'pending' ? s.approvalStatus === 'pending' : true).length === 0 && (
                <div className="text-center py-20 text-stone-400 font-medium text-xl">✨ All caught up! No spots found.</div>
              )}
            </div>
          )}

          {/* --- REVIEWS VIEW --- */}
          {view === 'reviews' && (
            <div>
              <FilterToggle active={filter} onChange={setFilter} />

              <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] p-8 shadow-xl border border-stone-100 dark:border-stone-800">
                <div className="space-y-6">
                  {reviews.filter(r => filter === 'pending' ? r.approvalStatus === 'pending' : true).map(review => (
                    <div key={review._id} className="flex items-start gap-6 p-6 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors border-b last:border-0 border-stone-100 dark:border-stone-800">
                      <div className="w-12 h-12 rounded-full bg-stone-200 flex-shrink-0 overflow-hidden">
                        <img src={review.reviewerId?.picture || `https://ui-avatars.com/api/?name=${review.reviewerId?.name || 'User'}`} alt="" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-bold text-lg dark:text-white">{review.reviewerId?.name} <span className="text-stone-400 font-normal text-sm">reviewed</span> {review.vehicleId?.title}</h4>
                            <div className="text-xs text-stone-500 mb-1">{review.reviewerId?.email}</div>
                            <div className="flex text-brand-orange text-sm mb-1">{'★'.repeat(Math.round(review.rating))}</div>
                          </div>
                          {renderStatusBadge(review.approvalStatus)}
                        </div>
                        <p className="text-stone-600 dark:text-stone-300 mb-2 bg-stone-50 dark:bg-stone-950 p-4 rounded-xl italic">"{review.comment}"</p>
                        <div className="text-xs text-stone-400 font-medium mb-4">📅 Submitted: {new Date(review.createdAt).toLocaleDateString()}</div>

                        <div className="flex gap-3">
                          {review.approvalStatus === 'pending' ? (
                            <>
                              <button onClick={() => handleActionClick('reviews', review._id, 'approve')} className="px-6 py-2 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-all">Approve</button>
                              <button onClick={() => handleActionClick('reviews', review._id, 'reject')} className="px-6 py-2 bg-red-100 text-red-600 rounded-lg font-bold hover:bg-red-200 transition-all">Reject</button>
                            </>
                          ) : (
                            <button onClick={() => handleActionClick('reviews', review._id, 'delete')} className="text-red-500 font-bold hover:text-red-700 text-sm">Delete Permanently</button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {reviews.filter(r => filter === 'pending' ? r.approvalStatus === 'pending' : true).length === 0 && (
                    <div className="text-center py-10 text-stone-400">No reviews to show.</div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* --- TRAILS VIEW --- */}
          {view === 'trails' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <FilterToggle active={filter} onChange={setFilter} />
                <button onClick={() => handleSyncClick('trails')} className="text-brand-orange font-bold hover:underline">Sync Trails Sheet</button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {trails.filter(t => filter === 'pending' ? t.approvalStatus === 'pending' : true).map(trail => (
                  <div key={trail._id} className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-lg border border-stone-100 dark:border-stone-800 hover:border-brand-orange transition-all group">
                    <div className="flex items-center gap-4 mb-4">
                      <div className="w-12 h-12 rounded-full bg-green-100 text-green-600 flex items-center justify-center text-2xl">🥾</div>
                      <div>
                        <h3 className="font-bold text-lg leading-tight dark:text-white">{trail.title}</h3>
                        <div className="text-xs text-stone-500">{trail.location}</div>
                      </div>
                    </div>
                    <p className="text-stone-600 dark:text-stone-300 text-sm mb-4 line-clamp-3">{trail.description}</p>
                    <div className="flex flex-wrap gap-2 mb-4 text-xs font-medium text-stone-500">
                      <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">📏 {trail.length}</span>
                      <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">⏱️ {trail.duration}</span>
                      <span className="bg-stone-100 dark:bg-stone-800 px-2 py-1 rounded-md">⛰️ {trail.difficulty}</span>
                    </div>

                    {/* Trail Submitter Info */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-xl">
                      <img src={trail.authorId?.picture || `https://ui-avatars.com/api/?name=${trail.authorId?.name || 'User'}`} className="w-8 h-8 rounded-full bg-stone-100 object-cover" alt="" />
                      <div className="overflow-hidden">
                        <div className="text-xs text-stone-400">Submitted by</div>
                        <div className="text-xs font-bold text-stone-900 dark:text-white truncate">{trail.authorId?.name || 'Unknown'}</div>
                        <div className="text-[10px] text-stone-500 truncate" title={trail.authorId?.email}>{trail.authorId?.email}</div>
                      </div>
                    </div>
                    <div className="text-xs text-stone-400 font-medium mb-4">📅 Submitted: {new Date(trail.createdAt).toLocaleDateString()}</div>

                    <div className="grid grid-cols-2 gap-3">
                      {trail.approvalStatus === 'pending' ? (
                        <>
                          <button onClick={() => handleActionClick('trails', trail._id, 'approve')} className="bg-green-500 text-white py-2 rounded-xl font-bold hover:bg-green-600">Apv</button>
                          <button onClick={() => handleActionClick('trails', trail._id, 'reject')} className="bg-stone-100 text-stone-600 py-2 rounded-xl font-bold hover:bg-red-100 hover:text-red-600 text-sm">Dcl</button>
                        </>
                      ) : (
                        <button onClick={() => handleActionClick('trails', trail._id, 'delete')} className="col-span-2 bg-stone-100 text-stone-500 py-2 rounded-xl font-bold hover:bg-red-100 hover:text-red-500 transition-colors">Delete Trail</button>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {trails.filter(t => filter === 'pending' ? t.approvalStatus === 'pending' : true).length === 0 && (
                <div className="text-center py-20 text-stone-300 text-xl font-bold italic">No trails found on the path...</div>
              )}
            </div>
          )}

          {/* --- OVERVIEW VIEW --- */}
          {view === 'overview' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-6">
                <h3 className="text-3xl font-black dark:text-white">Quick Actions</h3>
                <div className="grid grid-cols-2 gap-4">
                  <button onClick={() => handleSyncClick('spots')} className="p-6 bg-brand-orange text-white rounded-3xl font-black text-xl hover:bg-orange-600 transition-all shadow-lg active:scale-95 text-left">
                    <div>🔄 Sync</div>
                    <div className="text-sm opacity-70 font-medium">Spots Database</div>
                  </button>
                  <button onClick={() => handleSyncClick('reviews')} className="p-6 bg-stone-900 dark:bg-white text-white dark:text-black rounded-3xl font-black text-xl hover:opacity-90 transition-all shadow-lg active:scale-95 text-left">
                    <div>🙌 Sync</div>
                    <div className="text-sm opacity-70 font-medium">Reviews Sheet</div>
                  </button>
                  <button onClick={() => handleSyncClick('trails')} className="p-6 bg-green-600 text-white rounded-3xl font-black text-xl hover:bg-green-700 transition-all shadow-lg active:scale-95 text-left">
                    <div>🥾 Sync</div>
                    <div className="text-sm opacity-70 font-medium">Trails Sheet</div>
                  </button>
                </div>
              </div>

              <div className="bg-white dark:bg-stone-900 p-8 rounded-[3rem] shadow-xl border border-stone-100 dark:border-stone-800">
                <h3 className="text-2xl font-black mb-4 dark:text-white">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl">
                    <span className="font-bold text-stone-600 dark:text-stone-400">Database Connection</span>
                    <span className="text-green-500 font-bold bg-green-100 px-3 py-1 rounded-full text-xs">ONLINE</span>
                  </div>
                  <div className="flex items-center justify-between p-4 bg-stone-50 dark:bg-stone-950 rounded-2xl">
                    <span className="font-bold text-stone-600 dark:text-stone-400">Google Sheets Sync</span>
                    <span className="text-brand-orange font-bold bg-orange-100 px-3 py-1 rounded-full text-xs">READY</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
