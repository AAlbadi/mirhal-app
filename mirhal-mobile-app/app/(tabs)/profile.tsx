
import React, { useState } from 'react';
import { StyleSheet, ScrollView, View, Image, TouchableOpacity, SafeAreaView, TextInput, ActivityIndicator, Alert } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../contexts/AuthContext';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../firebase-config';

export default function ProfileScreen() {
    const { user, mongoUser, signOut, loading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isLogin, setIsLogin] = useState(true);
    const [authLoading, setAuthLoading] = useState(false);

    const handleAuth = async () => {
        if (!email || !password) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setAuthLoading(true);
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                await createUserWithEmailAndPassword(auth, email, password);
            }
        } catch (error: any) {
            Alert.alert('Authentication Failed', error.message);
        } finally {
            setAuthLoading(false);
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color="#8b6f47" />
            </SafeAreaView>
        );
    }

    if (!user) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={[styles.content, { padding: 20, justifyContent: 'center', flex: 1 }]}>
                    <ThemedText type="title" style={{ textAlign: 'center', marginBottom: 30, color: '#4a3626' }}>
                        {isLogin ? 'Welcome Back' : 'Create Account'}
                    </ThemedText>

                    <TextInput
                        style={styles.input}
                        placeholder="Email"
                        value={email}
                        onChangeText={setEmail}
                        autoCapitalize="none"
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="Password"
                        value={password}
                        onChangeText={setPassword}
                        secureTextEntry
                    />

                    <TouchableOpacity style={styles.authButton} onPress={handleAuth} disabled={authLoading}>
                        {authLoading ? (
                            <ActivityIndicator color="#fff" />
                        ) : (
                            <ThemedText style={styles.authButtonText}>{isLogin ? 'Log In' : 'Sign Up'}</ThemedText>
                        )}
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => setIsLogin(!isLogin)} style={{ marginTop: 20 }}>
                        <ThemedText style={{ textAlign: 'center', color: '#8b6f47' }}>
                            {isLogin ? 'New to Mirhal? Sign Up' : 'Already have an account? Log In'}
                        </ThemedText>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    // Authenticated View
    return (
        <SafeAreaView style={styles.container}>
            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: mongoUser?.picture || user.photoURL || 'https://ui-avatars.com/api/?name=' + (mongoUser?.name || 'User') }}
                            style={styles.avatar}
                        />
                        <TouchableOpacity style={styles.editButton}>
                            <Ionicons name="pencil" size={16} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <ThemedText type="title" style={styles.name}>{mongoUser?.name || user.email?.split('@')[0]}</ThemedText>
                    <ThemedText style={styles.email}>{user.email}</ThemedText>

                    <View style={styles.statsRow}>
                        <View style={styles.stat}>
                            <ThemedText style={styles.statValue}>{mongoUser?.trips || 0}</ThemedText>
                            <ThemedText style={styles.statLabel}>Trips</ThemedText>
                        </View>
                        <View style={styles.divider} />
                        <View style={styles.stat}>
                            <ThemedText style={styles.statValue}>{mongoUser?.rating || 5.0}</ThemedText>
                            <ThemedText style={styles.statLabel}>Rating</ThemedText>
                        </View>
                    </View>
                </View>

                {/* Menu Items */}
                <View style={styles.menuSection}>
                    <ThemedText style={styles.sectionTitle}>Account Settings</ThemedText>
                    <TouchableOpacity style={styles.menuItem}>
                        <View style={styles.menuIcon}><Ionicons name="person-outline" size={22} color="#4a3626" /></View>
                        <ThemedText style={styles.menuText}>Personal Information</ThemedText>
                        <Ionicons name="chevron-forward" size={20} color="#d5b9a5" />
                    </TouchableOpacity>
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={signOut}>
                    <ThemedText style={styles.logoutText}>Log Out</ThemedText>
                </TouchableOpacity>

                <ThemedText style={styles.version}>Mirhal Mobile v1.0.1</ThemedText>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f5ebe0',
    },
    content: {
        paddingBottom: 100,
    },
    input: {
        backgroundColor: '#fff',
        padding: 15,
        borderRadius: 12,
        marginBottom: 15,
        fontSize: 16,
        color: '#4a3626',
    },
    authButton: {
        backgroundColor: '#ff7119',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 10,
    },
    authButtonText: {
        color: '#fff',
        fontWeight: 'bold',
        fontSize: 16,
    },
    profileHeader: {
        alignItems: 'center',
        paddingVertical: 30,
        backgroundColor: '#fff',
        borderBottomLeftRadius: 30,
        borderBottomRightRadius: 30,
        shadowColor: '#4a2c2a',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 5,
        marginBottom: 24,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: '#f5ebe0',
    },
    editButton: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: '#ff7119',
        width: 32,
        height: 32,
        borderRadius: 16,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 3,
        borderColor: '#fff',
    },
    name: {
        fontSize: 24,
        color: '#4a3626',
        marginBottom: 4,
    },
    email: {
        fontSize: 14,
        color: '#8b6f47',
        marginBottom: 20,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#f5ebe0',
        paddingHorizontal: 24,
        paddingVertical: 12,
        borderRadius: 16,
    },
    stat: {
        alignItems: 'center',
        paddingHorizontal: 16,
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#4a3626',
    },
    statLabel: {
        fontSize: 12,
        color: '#6b5742',
    },
    divider: {
        width: 1,
        height: 24,
        backgroundColor: '#d5b9a5',
    },
    menuSection: {
        paddingHorizontal: 20,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#8b6f47',
        marginBottom: 12,
        marginLeft: 4,
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    menuItem: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        padding: 16,
        borderRadius: 16,
        marginBottom: 8,
        shadowColor: '#4a2c2a',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 4,
        elevation: 2,
    },
    menuIcon: {
        width: 40,
        height: 40,
        backgroundColor: '#f5ebe0',
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    menuText: {
        flex: 1,
        fontSize: 16,
        color: '#4a3626',
        fontWeight: '500',
    },
    logoutButton: {
        marginHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#e76f51',
        alignItems: 'center',
        marginBottom: 24,
    },
    logoutText: {
        color: '#e76f51',
        fontWeight: 'bold',
        fontSize: 16,
    },
    version: {
        textAlign: 'center',
        color: '#d5b9a5',
        fontSize: 12,
        marginBottom: 20,
    },
});
