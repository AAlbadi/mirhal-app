import React, { useState, useRef } from 'react';
import { ArrowLeft, Camera, MapPin, PlayCircle, StopCircle, CheckCircle, Sparkles, Wand2, Upload, X, ChevronRight, Loader2, Image as ImageIcon } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { useNavigate } from 'react-router-dom';
import { getApiUrl } from '../utils/api';
import LocationPickerModal from '../components/LocationPickerModal';
import { useAuth } from '../contexts/AuthContext';
import clsx from 'clsx';

const AddTrailPage: React.FC = () => {
    const { t, lang } = useI18n();
    const navigate = useNavigate();
    const { currentUser } = useAuth(); // Correctly get user from context

    // Workflow State
    // Steps: 1=Basics, 2=Route, 3=Photos, 4=Review
    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        region: '',
        difficulty: 'Moderate',
        length: '',
        duration: '',
        description: '',
        photos: [] as string[]
    });

    const [filesToUpload, setFilesToUpload] = useState<File[]>([]);
    const [previewUrls, setPreviewUrls] = useState<string[]>([]);

    // Location State
    const [startPoint, setStartPoint] = useState<{ lat: number, lng: number } | null>(null);
    const [endPoint, setEndPoint] = useState<{ lat: number, lng: number } | null>(null);

    // Modals
    const [isStartPickerOpen, setIsStartPickerOpen] = useState(false);
    const [isEndPickerOpen, setIsEndPickerOpen] = useState(false);

    const categories = ['Easy', 'Moderate', 'Hard', 'Extreme'];

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const newFiles = Array.from(e.target.files) as File[];
            setFilesToUpload(prev => [...prev, ...newFiles]);

            const newPreviews = newFiles.map(file => URL.createObjectURL(file));
            setPreviewUrls(prev => [...prev, ...newPreviews]);
        }
    };

    const removePhoto = (index: number) => {
        setFilesToUpload(prev => prev.filter((_, i) => i !== index));
        setPreviewUrls(prev => prev.filter((_, i) => i !== index));
    };

    // Upload photos to Supabase Storage (via util)
    const uploadPhotos = async (): Promise<string[]> => {
        if (!currentUser) return [];

        // Dynamic import to avoid circular dependencies if any, or just direct usage
        const { uploadMultipleImages } = await import('../utils/uploadImage');

        try {
            const urls = await uploadMultipleImages(filesToUpload, 'trails', currentUser.id);
            return urls;
        } catch (e) {
            console.error("Upload failed", e);
            throw e;
        }
    };

    const handleSubmit = async () => {
        if (!startPoint || !endPoint) {
            alert("Please set both Start and End points.");
            return;
        }
        if (!formData.title || !formData.region) {
            alert("Please fill in the basic details.");
            return;
        }

        setLoading(true);
        try {
            const apiUrl = getApiUrl();

            if (!currentUser) {
                alert("You must be logged in to share a trail.");
                setLoading(false);
                return;
            }

            // Upload photos first
            setUploading(true);
            const photoUrls = await uploadPhotos();
            setUploading(false);

            // Supabase Token
            const { data: { session } } = await import('../supabaseClient').then(m => m.supabase.auth.getSession());
            const token = session?.access_token; // Use Supabase Access Token

            const payload = {
                title: formData.title,
                location: formData.region,
                difficulty: formData.difficulty,
                length: formData.length + " km",
                duration: formData.duration + " hrs",
                description: formData.description,
                image: photoUrls[0] || 'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&q=80&w=800',
                photos: photoUrls,
                waypoints: [
                    { name: "Start Point", type: "Start", coordinates: startPoint },
                    { name: "End Point", type: "End", coordinates: endPoint }
                ]
            };

            const res = await fetch(`${apiUrl}/api/trails`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                alert("Trail submitted successfully! It will be reviewed by an admin soon.");
                navigate('/trails');
            } else {
                const error = await res.json();
                alert(`Error: ${error.message || 'Failed to submit trail'}`);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while submitting the trail.");
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const renderStepContent = () => {
        switch (currentStep) {
            case 1: // Basics
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        <div className="space-y-4">
                            <div>
                                <label className="label-text">Trail Name</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Hidden Wadi Loop"
                                    className="input-field"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label-text">Region / Area</label>
                                <input
                                    type="text"
                                    placeholder="e.g. Ras Al Khaimah"
                                    className="input-field"
                                    value={formData.region}
                                    onChange={e => setFormData({ ...formData, region: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label-text mb-3">Difficulty Level</label>
                                <div className="flex bg-stone-50 dark:bg-stone-800 p-1.5 rounded-2xl">
                                    {categories.map(lvl => (
                                        <button
                                            key={lvl}
                                            onClick={() => setFormData({ ...formData, difficulty: lvl })}
                                            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${formData.difficulty === lvl ? 'bg-brand-orange text-white shadow-lg' : 'text-stone-500 hover:text-stone-700 dark:hover:text-stone-300'}`}
                                        >
                                            {lvl}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                );
            case 2: // Route
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Map Points */}
                        <div className="bg-white dark:bg-stone-900 p-6 rounded-[2rem] shadow-xl border border-stone-100 dark:border-stone-800 space-y-4">
                            <label className="label-text mb-1">Set Route Points</label>

                            <p className="text-sm text-stone-500 mb-4">Tap below to open the map and pin the locations.</p>

                            <div onClick={() => setIsStartPickerOpen(true)} className={`location-btn group ${startPoint ? 'active-loc' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`icon-circle ${startPoint ? 'bg-green-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
                                        <PlayCircle size={20} fill={startPoint ? "currentColor" : "none"} />
                                    </div>
                                    <div>
                                        <p className="font-black text-stone-700 dark:text-stone-300">Start Point</p>
                                        <p className="text-xs font-mono text-stone-400">
                                            {startPoint ? `${startPoint.lat.toFixed(4)}, ${startPoint.lng.toFixed(4)}` : 'Tap to set on map'}
                                        </p>
                                    </div>
                                </div>
                                {startPoint && <CheckCircle className="text-green-500" size={20} />}
                            </div>

                            <div onClick={() => setIsEndPickerOpen(true)} className={`location-btn group ${endPoint ? 'active-loc-end' : ''}`}>
                                <div className="flex items-center gap-4">
                                    <div className={`icon-circle ${endPoint ? 'bg-red-500 text-white' : 'bg-stone-100 dark:bg-stone-800 text-stone-400'}`}>
                                        <StopCircle size={20} fill={endPoint ? "currentColor" : "none"} />
                                    </div>
                                    <div>
                                        <p className="font-black text-stone-700 dark:text-stone-300">End Point</p>
                                        <p className="text-xs font-mono text-stone-400">
                                            {endPoint ? `${endPoint.lat.toFixed(4)}, ${endPoint.lng.toFixed(4)}` : 'Tap to set on map'}
                                        </p>
                                    </div>
                                </div>
                                {endPoint && <CheckCircle className="text-red-500" size={20} />}
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="label-text">Distance (KM)</label>
                                <input
                                    type="number"
                                    step="0.1"
                                    placeholder="0.0"
                                    className="input-field"
                                    value={formData.length}
                                    onChange={e => setFormData({ ...formData, length: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="label-text">Time (HRS)</label>
                                <input
                                    type="number"
                                    step="0.5"
                                    placeholder="2.5"
                                    className="input-field"
                                    value={formData.duration}
                                    onChange={e => setFormData({ ...formData, duration: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3: // Photos & Desc
                return (
                    <div className="space-y-6 animate-fade-in-up">
                        {/* Photo Upload */}
                        <div>
                            <label className="label-text mb-3">Photos</label>
                            <div className="grid grid-cols-3 gap-3 mb-4">
                                {previewUrls.map((url, i) => (
                                    <div key={i} className="aspect-square relative rounded-xl overflow-hidden group">
                                        <img src={url} alt="Preview" className="w-full h-full object-cover" />
                                        <button
                                            onClick={() => removePhoto(i)}
                                            className="absolute top-1 right-1 bg-black/50 p-1 rounded-full text-white opacity-0 group-hover:opacity-100 transition-opacity"
                                        >
                                            <X size={12} />
                                        </button>
                                    </div>
                                ))}
                                <label className="aspect-square bg-stone-50 dark:bg-stone-800 rounded-xl border-2 border-dashed border-stone-200 dark:border-stone-700 flex flex-col items-center justify-center cursor-pointer hover:border-brand-orange transition-colors">
                                    <Upload className="text-stone-400 mb-1" size={24} />
                                    <span className="text-xs font-bold text-stone-400">Add</span>
                                    <input type="file" multiple accept="image/*" onChange={handleFileSelect} className="hidden" />
                                </label>
                            </div>
                        </div>

                        <div>
                            <label className="label-text">Description</label>
                            <textarea
                                placeholder="Describe the terrain, views, and experience..."
                                className="input-field h-32 resize-none"
                                value={formData.description}
                                onChange={e => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>
                );
            default: return null;
        }
    };

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-black pb-24 pt-48 font-outfit relative overflow-hidden">
            {/* Ambient Background */}
            <div className="absolute top-0 left-0 w-full h-[50vh] bg-gradient-to-b from-brand-orange/5 to-transparent pointer-events-none" />

            {/* Header */}
            <div className="max-w-md mx-auto px-6 md:max-w-lg mb-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                    <button onClick={() => currentStep > 1 ? setCurrentStep(curr => curr - 1) : navigate(-1)} className="p-2 bg-white/80 dark:bg-stone-900/80 backdrop-blur-sm rounded-full shadow-sm hover:scale-105 transition-transform">
                        <ArrowLeft size={24} className="text-stone-900 dark:text-white" />
                    </button>
                    <div className="flex gap-2">
                        {[1, 2, 3].map(s => (
                            <div key={s} className={`w-2.5 h-2.5 rounded-full transition-colors ${currentStep >= s ? 'bg-brand-orange' : 'bg-stone-200 dark:bg-stone-800'}`} />
                        ))}
                    </div>
                </div>
                <h1 className="text-3xl font-black text-stone-900 dark:text-white tracking-tight">
                    {currentStep === 1 && 'Basic Details'}
                    {currentStep === 2 && 'Map Route'}
                    {currentStep === 3 && 'Photos & Info'}
                </h1>
            </div>

            <div className="max-w-md mx-auto px-4 md:max-w-lg relative z-10">
                <div className="bg-white dark:bg-stone-900 rounded-[2.5rem] shadow-2xl overflow-hidden border border-stone-100 dark:border-stone-800 p-8">

                    {renderStepContent()}

                    <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-800 flex justify-end">
                        {currentStep < 3 ? (
                            <button
                                onClick={() => setCurrentStep(curr => curr + 1)}
                                className="bg-stone-900 dark:bg-white text-white dark:text-stone-900 px-8 py-4 rounded-xl font-black text-lg shadow-lg hover:scale-105 transition-all flex items-center gap-2"
                            >
                                Next <ChevronRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmit}
                                disabled={loading || uploading}
                                className="w-full bg-brand-orange text-white py-4 rounded-xl font-black text-lg shadow-xl shadow-brand-orange/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                            >
                                {(loading || uploading) ? <Loader2 className="animate-spin" /> : 'Publish Trail'}
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Location Pickers */}
            <LocationPickerModal
                isOpen={isStartPickerOpen}
                onClose={() => setIsStartPickerOpen(false)}
                onConfirm={(loc) => setStartPoint(loc)}
                title="Set Start Point"
                initialLocation={startPoint || undefined}
            />

            <LocationPickerModal
                isOpen={isEndPickerOpen}
                onClose={() => setIsEndPickerOpen(false)}
                onConfirm={(loc) => setEndPoint(loc)}
                title="Set End Point"
                initialLocation={endPoint || (startPoint ? startPoint : undefined)}
            />

            <style>{`
                .label-text { @apply block text-sm font-black uppercase tracking-widest text-stone-400 mb-2; }
                .input-field { @apply w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl font-bold border-2 border-transparent focus:border-brand-orange outline-none transition-all dark:text-white; }
                .location-btn { @apply p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center justify-between border-stone-100 dark:border-stone-800 hover:border-brand-orange bg-stone-50 dark:bg-stone-800/50; }
                .active-loc { @apply border-green-500/50 bg-green-50 dark:bg-green-900/20; }
                .active-loc-end { @apply border-red-500/50 bg-red-50 dark:bg-red-900/20; }
                .icon-circle { @apply w-10 h-10 rounded-full flex items-center justify-center; }
            `}</style>
        </div>
    );
};

export default AddTrailPage;
