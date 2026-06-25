
import React from 'react';
import { StyleSheet, SafeAreaView } from 'react-native';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function TrailsScreen() {
    return (
        <SafeAreaView style={styles.container}>
            <ThemedView style={styles.content}>
                <ThemedText type="title">Trails</ThemedText>
                <ThemedText>Discover hiking and camping trails soon.</ThemedText>
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
});
