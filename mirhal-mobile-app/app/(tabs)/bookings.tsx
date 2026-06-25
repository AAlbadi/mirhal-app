
import React, { useEffect, useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, SafeAreaView, ActivityIndicator, RefreshControl } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { fetchAPI } from '../../utils/api';
import { useRouter, useFocusEffect } from 'expo-router';

export default function BookingsScreen() {
    const { user, getToken } = useAuth();
    const router = useRouter();
    const [bookings, setBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const loadBookings = useCallback(async () => {
        if (!user) {
            setLoading(false);
            return;
        }

        try {
            const token = await getToken();
            const data = await fetchAPI('/bookings/my-bookings', {
                headers: { Authorization: `Bearer ${token}` }
            });
            setBookings(data.bookings || []);
        } catch (error) {
            console.error('Failed to load bookings', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user]);

    useFocusEffect(
        useCallback(() => {
            loadBookings();
        }, [loadBookings])
    );

    const onRefresh = () => {
        setRefreshing(true);
        loadBookings();
    };

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyState}>
                    <Ionicons name="lock-closed-outline" size={64} color="#d5b9a5" />
                    <ThemedText type="subtitle" style={styles.emptyTitle}>Login Required</ThemedText>
                    <ThemedText style={styles.emptyText}>Please log in to view your trips.</ThemedText>
                    <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/profile')}>
                        <ThemedText style={styles.exploreButtonText}>Go to Login</ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (loading && !refreshing) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8b6f47" />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <ThemedText type="title">My Trips</ThemedText>
            </View>

            <ScrollView
                contentContainerStyle={styles.content}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#8b6f47" />}
            >
                {bookings.length > 0 ? (
                    bookings.map((booking) => (
                        <TouchableOpacity key={booking._id} style={styles.card}>
                            <View style={styles.cardImageContainer}>
                                <Image
                                    source={{ uri: booking.vehicleId?.images?.[0] || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800' }}
                                    style={styles.cardImage}
                                />
                                <View style={[styles.statusBadge, booking.status === 'upcoming' || booking.status === 'approved' ? styles.statusUpcoming : styles.statusCompleted]}>
                                    <ThemedText style={styles.statusText}>{booking.status}</ThemedText>
                                </View>
                            </View>
                            <View style={styles.cardContent}>
                                <View style={styles.row}>
                                    <ThemedText type="defaultSemiBold" style={styles.title}>{booking.vehicleId?.title || 'Unknown Vehicle'}</ThemedText>
                                    <ThemedText style={styles.price}>AED {booking.finalTotal}</ThemedText>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="calendar-outline" size={16} color="#8b6f47" />
                                    <ThemedText style={styles.infoText}>
                                        {new Date(booking.startDate).toLocaleDateString()} - {new Date(booking.endDate).toLocaleDateString()}
                                    </ThemedText>
                                </View>
                                <View style={styles.infoRow}>
                                    <Ionicons name="location-outline" size={16} color="#8b6f47" />
                                    <ThemedText style={styles.infoText}>{booking.vehicleId?.location?.city || 'Location N/A'}</ThemedText>
                                </View>
                            </View>
                        </TouchableOpacity>
                    ))
                ) : (
                    <View style={styles.emptyState}>
                        <Ionicons name="calendar-clear-outline" size={64} color="#d5b9a5" />
                        <ThemedText type="subtitle" style={styles.emptyTitle}>No trips yet</ThemedText>
                        <ThemedText style={styles.emptyText}>Time to dust off your bags and start planning your next adventure.</ThemedText>
                        <TouchableOpacity style={styles.exploreButton} onPress={() => router.push('/(tabs)/explore')}>
                            <ThemedText style={styles.exploreButtonText}>Start Exploring</ThemedText>
                        </TouchableOpacity>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff7ed',
    },
    header: {
        paddingHorizontal: 20,
        paddingTop: 20,
        paddingBottom: 10,
    },
    content: {
        paddingHorizontal: 20,
        paddingBottom: 100,
        gap: 20,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 20,
        overflow: 'hidden',
        shadowColor: '#4a2c2a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 4,
    },
    cardImageContainer: {
        position: 'relative',
    },
    cardImage: {
        width: '100%',
        height: 150,
    },
    statusBadge: {
        position: 'absolute',
        top: 12,
        right: 12,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 12,
    },
    statusUpcoming: {
        backgroundColor: '#2a9d8f',
    },
    statusCompleted: {
        backgroundColor: '#fb923c', // Lighter Orange for completed
    },
    statusText: {
        color: '#fff',
        fontSize: 12,
        fontWeight: 'bold',
        textTransform: 'capitalize',
    },
    cardContent: {
        padding: 16,
    },
    row: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    title: {
        fontSize: 16,
        color: '#1c1917', // Dark text replacement for #4a3626
        flex: 1,
        marginRight: 8,
    },
    price: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#ff7119', // Brand Orange
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    infoText: {
        color: '#fb923c', // Lighter orange/secondary
        fontSize: 14,
    },
    emptyState: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingTop: 60,
    },
    emptyTitle: {
        marginTop: 16,
        marginBottom: 8,
        color: '#4a3626',
    },
    emptyText: {
        textAlign: 'center',
        color: '#6b5742',
        marginBottom: 24,
        paddingHorizontal: 40,
    },
    exploreButton: {
        backgroundColor: '#ff7119',
        paddingHorizontal: 32,
        paddingVertical: 14,
        borderRadius: 16,
    },
    exploreButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
});
