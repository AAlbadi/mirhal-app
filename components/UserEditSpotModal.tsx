import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getApiUrl } from '../utils/api';
import { SpotListing } from '../types';

interface UserEditSpotModalProps {
    spot: SpotListing;
    onClose: () => void;
    onRefresh: () => void;
}

const UserEditSpotModal: React.FC<UserEditSpotModalProps> = ({ spot, onClose, onRefresh }) => {
    const { getIdToken } = useAuth();
    const [formData, setFormData] = useState({
        title: '',
        titleAr: '',
        description: '',
        type: 'Desert',
        price: 0,
        contactPhone: '',
        emoji: '🐪',
        images: '',
        location: '',
        lat: 0,
        lng: 0,
        amenities: ''
    });
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (spot) {
            setFormData({
                title: spot.name,
                titleAr: '', // Not always available in spot listing, might need full fetch if critical
                description: spot.description,
                type: spot.category || 'Desert',
                price: spot.price || 0,
                contactPhone: spot.contactPhone || '', // Prop might need updating in types.ts if missing
                emoji: '🐪', // Default or fetch
                images: (spot.photos || []).join('\n'),
                location: spot.location,
                lat: spot.coordinates?.lat || 0,
                lng: spot.coordinates?.lng || 0,
                amenities: (spot.features || []).join(', ')
            });
        }
    }, [spot]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            const token = await getIdToken();
            const apiUrl = getApiUrl();

            const payload = {
                ...formData,
                images: formData.images.split('\n').filter(s => s.trim()),
                amenities: formData.amenities.split(',').map(s => s.trim()),
                location: {
                    formattedAddress: formData.location,
                    address: formData.location,
                    coordinates: { lat: Number(formData.lat), lng: Number(formData.lng) }
                },
                // CRITICAL: Logic to reset approval is handled on backend
            };

            const res = await fetch(`${apiUrl}/api/vehicles/${spot.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert('Spot updated! It is now pending approval.');
                onRefresh();
                onClose();
            } else {
                const d = await res.json();
                throw new Error(d.error || 'Update failed');
            }
        } catch (err: any) {
            alert('Error updating spot: ' + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-stone-900 w-full max-w-2xl rounded-3xl shadow-2xl p-8 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-black mb-2 dark:text-white">Edit Spot</h2>
                <p className="text-sm text-stone-500 mb-6">Updating your spot will require admin approval again.</p>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <input value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Title" required className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                        <input value={formData.titleAr} onChange={e => setFormData({ ...formData, titleAr: e.target.value })} placeholder="Title (Arabic)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full text-right" />
                    </div>

                    <textarea value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} placeholder="Description" required className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24" />

                    <div className="grid grid-cols-2 gap-4">
                        <input type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: Number(e.target.value) })} placeholder="Price (AED)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                        <input value={formData.contactPhone} onChange={e => setFormData({ ...formData, contactPhone: e.target.value })} placeholder="Contact Phone" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                    </div>

                    <select value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full">
                        {['Desert', 'Beach', 'Mountain', 'Camping Spot', 'PaidCamping', 'Glamping'].map(t => <option key={t} value={t}>{t}</option>)}
                    </select>

                    <div className="grid grid-cols-3 gap-4">
                        <input value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} placeholder="Location Name" className="col-span-3 p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                        <input type="number" value={formData.lat} onChange={e => setFormData({ ...formData, lat: e.target.value })} placeholder="Latitude (e.g. 25.0)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                        <input type="number" value={formData.lng} onChange={e => setFormData({ ...formData, lng: e.target.value })} placeholder="Longitude (e.g. 55.0)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />
                    </div>

                    <textarea value={formData.images} onChange={e => setFormData({ ...formData, images: e.target.value })} placeholder="Image URLs (one per line)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full h-24 font-mono text-xs" />
                    <input value={formData.amenities} onChange={e => setFormData({ ...formData, amenities: e.target.value })} placeholder="Amenities (comma separated)" className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl w-full" />

                    <div className="flex gap-4 pt-4">
                        <button type="button" onClick={onClose} className="flex-1 bg-stone-200 dark:bg-stone-800 py-3 rounded-xl font-bold">Cancel</button>
                        <button type="submit" disabled={loading} className="flex-1 bg-brand-orange text-white py-3 rounded-xl font-bold disabled:opacity-50">
                            {loading ? 'Saving...' : 'Save Changes'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default UserEditSpotModal;
