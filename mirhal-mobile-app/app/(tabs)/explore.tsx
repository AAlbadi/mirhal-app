
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, TextInput, SafeAreaView, ActivityIndicator } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { fetchAPI } from '../../utils/api';

export default function ExploreScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('All');
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await fetchAPI('/vehicles?limit=100');
      setVehicles(data.vehicles || []);
    } catch (error) {
      console.error('Failed to load explore data', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredVehicles = vehicles.filter(v => {
    const title = v.title || '';
    const location = v.location?.city || v.location?.formattedAddress || '';

    const matchesSearch = title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      location.toLowerCase().includes(searchQuery.toLowerCase());

    // Backend types might be 'Class A', 'Beach', etc. Frontend filter uses 'RV', 'Camper', 'Trailer'.
    // We need to map or loosen the filter. 
    // Backend types: ['Class A', 'Class B', 'Class C', 'Travel Trailer', 'Fifth Wheel', 'Camper Van', 'Toy Hauler', 'Pop-up Camper', 'Camping Spot', 'Desert', 'Beach', 'Mountain', 'Rv Services']
    // Frontend options: ['All', 'RV', 'Camper', 'Trailer']

    let matchesFilter = activeFilter === 'All';
    if (!matchesFilter) {

      // Emoji-based filtering (Prioritized)
      const emoji = v.emoji || '';
      if (['RV', 'Camper', 'Trailer'].includes(activeFilter)) {
        // Keep existing vehicle type logic for vehicle filters
        if (activeFilter === 'RV') matchesFilter = ['Class A', 'Class B', 'Class C'].includes(v.type);
        else if (activeFilter === 'Camper') matchesFilter = ['Camper Van', 'Pop-up Camper', 'Truck Camper'].includes(v.type);
        else if (activeFilter === 'Trailer') matchesFilter = ['Travel Trailer', 'Fifth Wheel', 'Toy Hauler'].includes(v.type);
      }
      // Categories based on Emoji
      else if (activeFilter === 'RV Services') matchesFilter = emoji === '🚐' || v.type.toLowerCase().replace(/\s+/g, '').includes('rvservice');
      else if (activeFilter === 'Paid Camping') matchesFilter = emoji === '🏕️' || emoji === '⛺' || ['camping', 'campsite', 'campground'].some(t => v.type.toLowerCase().replace(/\s+/g, '').includes(t));
      else if (activeFilter === 'Desert') matchesFilter = emoji === '🐪' || emoji === '🏜️' || v.type === 'Desert';
      else if (activeFilter === 'Beach') matchesFilter = emoji === '🏖️' || emoji === '🏄' || v.type === 'Beach';
      else if (activeFilter === 'Mountain') matchesFilter = emoji === '⛰️' || emoji === '🏔️' || v.type === 'Mountain';
      else matchesFilter = v.type === activeFilter;
    }

    return matchesSearch && matchesFilter;
  });

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#8b6f47" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search destinations, RVs..."
            placeholderTextColor="#8b6f47"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <TouchableOpacity style={styles.filterButton}>
          <Ionicons name="options-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.stickyFiltersContainer}>
        <View style={styles.filters}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filtersContent}>
            {['All', 'RV', 'Camper', 'Trailer', 'RV Services', 'Paid Camping', 'Desert', 'Beach', 'Mountain'].map((filter) => (
              <TouchableOpacity
                key={filter}
                style={[styles.filterChip, activeFilter === filter && styles.activeFilterChip]}
                onPress={() => setActiveFilter(filter)}
              >
                <ThemedText style={[styles.filterText, activeFilter === filter && styles.activeFilterText]}>
                  {filter}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#ff7119" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
        >
          {filteredVehicles.map((vehicle) => (
            <TouchableOpacity key={vehicle._id} style={styles.card}>
              <Image
                source={{ uri: vehicle.images?.[0] || 'https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&q=80&w=800' }}
                style={styles.cardImage}
              />
              <TouchableOpacity style={styles.favoriteButton}>
                <Ionicons name="heart-outline" size={20} color="#fff" />
              </TouchableOpacity>
              <View style={styles.cardContent}>
                <View style={styles.cardHeader}>
                  <ThemedText type="defaultSemiBold" style={styles.cardTitle}>{vehicle.title}</ThemedText>
                  <View style={styles.rating}>
                    <Ionicons name="star" size={14} color="#ff7119" />
                    <ThemedText style={styles.ratingText}>{vehicle.rating?.average || 0}</ThemedText>
                  </View>
                </View>
                <ThemedText style={styles.location}>{vehicle.location?.city || vehicle.location?.formattedAddress || 'Unknown Location'}</ThemedText>
                <View style={styles.footer}>
                  <View style={styles.priceContainer}>
                    <ThemedText style={styles.price}>AED {vehicle.price}</ThemedText>
                    <ThemedText style={styles.perNight}>/ night</ThemedText>
                  </View>
                  <View style={styles.typeChip}>
                    <ThemedText style={styles.typeText}>{vehicle.type}</ThemedText>
                  </View>
                </View>
              </View>
            </TouchableOpacity>
          ))}
          {filteredVehicles.length === 0 && (
            <View style={{ padding: 20, alignItems: 'center' }}>
              <ThemedText style={{ color: '#8b6f47' }}>No spots found matching your search.</ThemedText>
            </View>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff7ed',
  },
  header: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    shadowColor: '#4a2c2a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#4a3626',
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#ff7119',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff7119',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  stickyFiltersContainer: {
    backgroundColor: '#fff7ed',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(232, 213, 196, 0.3)',
    shadowColor: '#4a2c2a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  filters: {
    marginBottom: 8,
  },
  filtersContent: {
    paddingHorizontal: 20,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.6)',
    borderWidth: 1,
    borderColor: '#e8d5c4',
  },
  activeFilterChip: {
    backgroundColor: '#ff7119',
    borderColor: '#ff7119',
  },
  filterText: {
    color: '#fb923c',
    fontWeight: '600',
  },
  activeFilterText: {
    color: '#fff',
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 12,
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
  cardImage: {
    width: '100%',
    height: 200,
  },
  favoriteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.3)',
    backdropFilter: 'blur(4px)',
    justifyContent: 'center',
    alignItems: 'center',
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
    fontSize: 18,
    color: '#4a3626',
    flex: 1,
    marginRight: 8,
  },
  rating: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  ratingText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#4a3626',
  },
  location: {
    fontSize: 14,
    color: '#8b6f47',
    marginBottom: 12,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f5ebe0',
    paddingTop: 12,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
  },
  price: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ff7119',
  },
  perNight: {
    fontSize: 12,
    color: '#fb923c',
  },
  typeChip: {
    backgroundColor: '#f5ebe0',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  typeText: {
    fontSize: 12,
    color: '#6b5742',
    fontWeight: '600',
  },
});
