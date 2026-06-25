import React, { useState } from 'react';
import { Calendar, MapPin, Users, Filter, Plus, Clock, Share2, Heart, ArrowRight } from 'lucide-react';
import { useI18n } from '../contexts/I18nContext';
import { Link } from 'react-router-dom';

// Mock Data for Events (Expanded)
const MOCK_EVENTS = [
    {
        id: 1,
        title: "GCC RV Convoy: Riyadh to Abha",
        type: "RV Rally",
        date: "Oct 15 - Oct 18, 2026",
        time: "08:00 AM",
        location: "Riyadh Start Point",
        image: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800",
        organizer: { name: "Ahmed Al-Salem", avatar: "https://i.pravatar.cc/150?u=ahmed" },
        attendees: 24,
        maxAttendees: 50,
        price: "Free",
        description: "Join us for a 3-day convoy through the mountains. All RV types welcome! We will stop at 3 scenic spots.",
        isHot: true
    },
    {
        id: 2,
        title: "Liwa Desert Stargazing Night",
        type: "Desert Camp",
        date: "Nov 02, 2026",
        time: "06:00 PM",
        location: "Liwa Desert, UAE",
        image: "https://images.unsplash.com/photo-1545153472-353664d9774a?auto=format&fit=crop&q=80&w=800",
        organizer: { name: "Sarah Smith", avatar: "https://i.pravatar.cc/150?u=sarah" },
        attendees: 12,
        maxAttendees: 20,
        price: "50 AED",
        description: "A cozy evening under the stars. Bring your own tent or join our communal fire.",
        isHot: false
    },
    {
        id: 3,
        title: "Vanlife Weekend: Fujairah Beach",
        type: "Beach Meetup",
        date: "Nov 05, 2026",
        time: "04:00 PM",
        location: "Aqah Beach, Fujairah",
        image: "https://images.unsplash.com/photo-1520116468816-95b69f847357?auto=format&fit=crop&q=80&w=800",
        organizer: { name: "Dubai Vanlife Club", avatar: "https://i.pravatar.cc/150?u=club" },
        attendees: 45,
        maxAttendees: 100,
        price: "Free",
        description: "Meet fellow vanlifers, swap stories, and enjoy the sunrise.",
        isHot: true
    },
    {
        id: 4,
        title: "Empty Quarter Crossing Prep",
        type: "Workshop",
        date: "Oct 25, 2026",
        time: "04:00 PM",
        location: "Al Qudra Lakes",
        image: "https://images.unsplash.com/photo-1582234548450-4355d9d73d6e?auto=format&fit=crop&q=80&w=800",
        organizer: { name: "Oman Offroad", avatar: "https://i.pravatar.cc/150?u=oman" },
        attendees: 8,
        maxAttendees: 15,
        price: "Free",
        description: "Planning session for the big crossing. Expert advice on fuel and tires.",
        isHot: false
    }
];

const EventsPage: React.FC = () => {
    const { t } = useI18n();
    const [activeFilter, setActiveFilter] = useState('All');
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');

    const filters = ['All', 'RV Rally', 'Desert Camp', 'Beach Meetup', 'Workshop'];

    const filteredEvents = activeFilter === 'All'
        ? MOCK_EVENTS
        : MOCK_EVENTS.filter(e => e.type === activeFilter);

    // Filter "Hot" events for hero
    const hotEvent = MOCK_EVENTS.find(e => e.isHot);

    return (
        <div className="min-h-screen bg-stone-50 dark:bg-stone-950 pb-28 pt-48 md:pt-20 font-outfit">

            {/* Desktop Hero / Mobile Header */}
            <div className="relative bg-stone-900 text-white pt-24 pb-12 px-4 md:px-8 rounded-b-[3rem] shadow-2xl overflow-hidden">
                {/* Abstract Background Shapes */}
                <div className="absolute top-0 right-0 w-64 h-64 bg-brand-orange rounded-full blur-[100px] opacity-20 -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500 rounded-full blur-[80px] opacity-20 translate-y-1/2 -translate-x-1/2"></div>

                <div className="max-w-5xl mx-auto relative z-10">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <span className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold uppercase tracking-widest text-brand-orange mb-2 border border-white/5">
                                Community
                            </span>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                {t('events') || 'Expeditions'}
                            </h1>
                            <p className="text-stone-400 text-lg max-w-md">
                                Join fellow explorers. From desert convoys to beach side gatherings.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-colors">
                                <Users size={20} />
                            </button>
                            <button className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center backdrop-blur-md hover:bg-white/20 transition-colors">
                                <Calendar size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Featured Event Card (Hero) */}
                    {hotEvent && (
                        <div className="mt-8 bg-gradient-to-r from-stone-800 to-stone-900 rounded-3xl p-1 border border-white/10 shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 mix-blend-overlay"></div>
                            <div className="flex flex-col md:flex-row gap-0 md:gap-6">
                                <div className="h-48 md:h-auto md:w-1/3 relative rounded-t-3xl md:rounded-l-3xl md:rounded-tr-none overflow-hidden">
                                    <img src={hotEvent.image} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt={hotEvent.title} />
                                    <div className="absolute top-3 left-3 bg-brand-orange text-white px-2 py-1 rounded text-[10px] font-black uppercase tracking-widest">
                                        Featured
                                    </div>
                                </div>
                                <div className="p-5 md:py-8 md:pr-8 flex-1 flex flex-col justify-center">
                                    <div className="flex items-center gap-2 text-brand-orange text-xs font-bold uppercase tracking-widest mb-2">
                                        <Clock size={12} />
                                        {hotEvent.date}
                                    </div>
                                    <h2 className="text-2xl font-black mb-2">{hotEvent.title}</h2>
                                    <p className="text-stone-400 text-sm mb-4 line-clamp-2">{hotEvent.description}</p>

                                    <div className="flex items-center justify-between mt-auto">
                                        <div className="flex -space-x-2">
                                            {[1, 2, 3, 4].map(i => (
                                                <div key={i} className="w-8 h-8 rounded-full border-2 border-stone-800 bg-stone-700" />
                                            ))}
                                            <div className="w-8 h-8 rounded-full border-2 border-stone-800 bg-stone-800 flex items-center justify-center text-[10px] font-bold text-white">
                                                +{hotEvent.attendees}
                                            </div>
                                        </div>
                                        <button className="px-6 py-2 bg-white text-stone-900 rounded-xl font-bold text-sm hover:bg-stone-200 transition-colors flex items-center gap-2">
                                            Join <ArrowRight size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>

            <div className="max-w-5xl mx-auto px-4 md:px-8 -mt-6 relative z-20">
                {/* Search / Filter Bar */}
                <div className="bg-white dark:bg-stone-900 p-2 rounded-2xl shadow-xl border border-stone-100 dark:border-stone-800 flex items-center gap-2 overflow-x-auto no-scrollbar mb-8">
                    <button className="p-3 bg-stone-100 dark:bg-stone-800 rounded-xl">
                        <Filter size={20} className="text-stone-500" />
                    </button>
                    <div className="h-8 w-px bg-stone-200 dark:bg-stone-700 mx-1"></div>
                    {filters.map(f => (
                        <button
                            key={f}
                            onClick={() => setActiveFilter(f)}
                            className={`px-4 py-2 rounded-xl font-bold text-sm whitespace-nowrap transition-all ${activeFilter === f
                                ? 'bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-lg scale-105'
                                : 'text-stone-500 hover:bg-stone-50 dark:hover:bg-stone-800'
                                }`}
                        >
                            {f}
                        </button>
                    ))}
                </div>

                {/* Grid */}
                <h3 className="text-xl font-black text-stone-900 dark:text-white mb-4 flex items-center gap-2">
                    Upcoming Gathering <div className="h-px flex-1 bg-stone-200 dark:bg-stone-800 ml-4"></div>
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredEvents.map(event => (
                        <div key={event.id} className="group bg-white dark:bg-stone-900 rounded-3xl overflow-hidden shadow-lg border border-stone-100 dark:border-stone-800 hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 relative">
                            {/* Image */}
                            <div className="h-56 relative overflow-hidden">
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 opacity-60 group-hover:opacity-40 transition-opacity"></div>
                                <img src={event.image} alt={event.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />

                                <div className="absolute top-4 left-4 z-20 bg-white/20 backdrop-blur-md border border-white/20 text-white px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider">
                                    {event.type}
                                </div>
                                <button className="absolute top-4 right-4 z-20 w-8 h-8 bg-black/30 backdrop-blur-md rounded-full flex items-center justify-center text-white hover:bg-brand-orange transition-colors">
                                    <Heart size={14} />
                                </button>
                            </div>

                            {/* Content */}
                            <div className="p-5">
                                <div className="flex gap-4 mb-3">
                                    <div className="flex flex-col items-center bg-stone-100 dark:bg-stone-800 rounded-xl p-2 min-w-[50px]">
                                        <span className="text-xs font-bold text-brand-orange uppercase">{event.date.split(' ')[0]}</span>
                                        <span className="text-xl font-black text-stone-900 dark:text-white">{event.date.split(' ')[1].replace(',', '')}</span>
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-lg text-stone-900 dark:text-white leading-tight mb-1 group-hover:text-brand-orange transition-colors">
                                            {event.title}
                                        </h3>
                                        <div className="flex items-center gap-1 text-xs text-stone-500 font-medium">
                                            <MapPin size={12} />
                                            {event.location}
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-between border-t border-stone-100 dark:border-stone-800 pt-4 mt-2">
                                    <div className="flex -space-x-2">
                                        {[1, 2, 3].map(i => (
                                            <div key={i} className="w-6 h-6 rounded-full bg-stone-200 border border-white" />
                                        ))}
                                        {event.attendees > 3 && (
                                            <div className="w-6 h-6 rounded-full bg-stone-100 border border-white flex items-center justify-center text-[8px] font-bold text-stone-500">
                                                +{event.attendees - 3}
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-sm font-bold text-stone-900 dark:text-white">
                                        {event.price}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Create FAB */}
            <button className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-brand-orange to-orange-600 text-white rounded-full shadow-[0_8px_30px_rgba(249,115,22,0.4)] flex items-center justify-center z-50 animate-in zoom-in duration-300 hover:scale-110 active:scale-95 transition-transform border-4 border-white/20 ring-1 ring-black/5">
                <Plus size={28} strokeWidth={3} />
            </button>

        </div>
    );
};

export default EventsPage;
