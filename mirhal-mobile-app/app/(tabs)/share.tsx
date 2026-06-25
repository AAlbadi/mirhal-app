
import React from 'react';
import { StyleSheet, SafeAreaView, TouchableOpacity } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { useRouter } from 'expo-router';

export default function ShareScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText type="title">Share Your Spot</ThemedText>
                <ThemedText style={styles.subtitle}>Become a host and start earning.</ThemedText>

                <TouchableOpacity style={styles.button} onPress={() => router.back()}>
                    <ThemedText style={styles.buttonText}>Go Back</ThemedText>
                </TouchableOpacity>
            </ThemedView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#fff',
    },
    content: {
        flex: 1,
        padding: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    subtitle: {
        marginTop: 10,
        marginBottom: 30,
    },
    button: {
        backgroundColor: '#ff7119',
        paddingHorizontal: 20,
        paddingVertical: 10,
        borderRadius: 8,
    },
    buttonText: {
        color: '#fff',
        fontWeight: 'bold',
    },
});
