
import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Link, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../../utils/api';

export default function HomeScreen() {
  const router = useRouter();
  const [featuredVehicles, setFeaturedVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchAPI('/vehicles?limit=5');
      setFeaturedVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to load home data', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <ThemedText style={styles.greeting}>Welcome back,</ThemedText>
            <ThemedText type="title" style={styles.brandName}>Mirhal</ThemedText>
          </View>
          <TouchableOpacity
            style={styles.profileButton}
            onPress={() => router.push('/(tabs)/profile')}
            hitSlop={{ top: 20, bottom: 20, left: 20, right: 20 }}
          >
            <Ionicons name="person-circle-outline" size={40} color="#ff7119" />
          </TouchableOpacity>
        </View>

        {/* Search Bar */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => router.push('/(tabs)/explore')}
        >
          <Ionicons name="search" size={24} color="#ff7119" />
          <ThemedText style={styles.placeholder}>Where to next?</ThemedText>
        </TouchableOpacity>

        {/* Categories */}
        <View style={styles.categories}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesContent}>
            {['All', 'RVs', 'Campers', 'Trailers'].map((cat, index) => (
              <TouchableOpacity
                key={cat}
                style={[styles.categoryChip, index === 0 && styles.activeCategory]}
              >
                <ThemedText style={[styles.categoryText, index === 0 && styles.activeCategoryText]}>
                  {cat}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Featured Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <ThemedText type="subtitle">Featured Stays</ThemedText>
            <Link href="/(tabs)/explore" asChild>
              <TouchableOpacity>
                <ThemedText style={styles.seeAll}>See all</ThemedText>
              </TouchableOpacity>
            </Link>
          </View>

          {loading ? (
            <ActivityIndicator size="large" color="#ff7119" />
          ) : (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.featuredList}>
              {featuredVehicles.map((vehicle) => (
                <TouchableOpacity key={vehicle._id} style={styles.card}>
                  <Image
                    source={{ uri: vehicle.images?.[0] || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800' }}
                    style={styles.cardImage}
                  />
                  <View style={styles.cardContent}>
                    <View style={styles.cardHeader}>
                      <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{vehicle.title}</ThemedText>
                      <View style={styles.rating}>
                        <Ionicons name="star" size={14} color="#ff7119" />
                        <ThemedText style={styles.ratingText}>{vehicle.rating?.average || 'New'}</ThemedText>
                      </View>
                    </View>
                    <ThemedText style={styles.location}>{vehicle.location?.city || vehicle.location?.formattedAddress || 'Unknown Location'}</ThemedText>
                    <View style={styles.priceContainer}>
                      <ThemedText style={styles.price}>AED {vehicle.price}</ThemedText>
                      <ThemedText style={styles.perNight}>/ night</ThemedText>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          )}
        </View>

        {/* Recent Activity / Promo */}
        <View style={styles.promoCard}>
          <View style={styles.promoContent}>
            <ThemedText type="subtitle" style={styles.promoTitle}>Become a Host</ThemedText>
            <ThemedText style={styles.promoText}>Earn extra income by renting out your RV.</ThemedText>
            <TouchableOpacity style={styles.promoButton}>
              <ThemedText style={styles.promoButtonText}>Learn More</ThemedText>
            </TouchableOpacity>
          </View>
          <Image
            source={{ uri: 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=400' }}
            style={styles.promoImage}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed', // Light orange tint
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    marginBottom: 20,
    zIndex: 100, // Ensure header is above other elements
  },
  greeting: {
    fontSize: 14,
    color: '#ff7119', // Orange
  },
  brandName: {
    fontSize: 28,
    color: '#ff7119', // Brand Orange
  },
  profileButton: {
    padding: 4,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginHorizontal: 20,
    padding: 16,
    borderRadius: 16,
    shadowColor: '#ff7119', // Orange shadow
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 24,
  },
  placeholder: {
    marginLeft: 12,
    color: '#fb923c', // Lighter orange
    fontSize: 16,
  },
  categories: {
    marginBottom: 24,
  },
  categoriesContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  categoryChip: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: '#ff7119', // Orange border
  },
  activeCategory: {
    backgroundColor: '#ff7119',
    borderColor: '#ff7119',
  },
  categoryText: {
    color: '#ff7119',
    fontWeight: '600',
  },
  activeCategoryText: {
    color: '#fff',
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  seeAll: {
    color: '#ff7119',
    fontWeight: '600',
  },
  featuredList: {
    paddingHorizontal: 20,
    gap: 16,
  },
  card: {
    width: 280,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#ff7119',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: '100%',
    height: 180,
  },
  cardContent: {
    padding: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1c1917', // Dark text
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1c1917',
  },
  location: {
    fontSize: 12,
    color: '#fb923c',
    marginBottom: 8,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff7119',
  },
  perNight: {
    fontSize: 12,
    color: '#fb923c',
  },
  promoCard: {
    marginHorizontal: 20,
    backgroundColor: '#ff7119', // Brand Orange
    borderRadius: 24,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    marginBottom: 24,
  },
  promoContent: {
    flex: 1,
    zIndex: 1,
  },
  promoTitle: {
    color: '#fff',
    marginBottom: 8,
  },
  promoText: {
    color: 'rgba(255,255,255,0.9)',
    fontSize: 12,
    marginBottom: 16,
  },
  promoButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  promoButtonText: {
    color: '#ff7119',
    fontWeight: 'bold',
    fontSize: 12,
  },
  promoImage: {
    position: 'absolute',
    right: -20,
    bottom: -20,
    width: 140,
    height: 140,
    borderRadius: 70,
    opacity: 0.5,
  },
});
