import { useEffect } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { ThemedView } from '@/components/themed-view';
import { useTheme } from '@/hooks/use-theme';

export default function IndexGate() {
  const theme = useTheme();

  useEffect(() => {
    router.replace('/login/login');
  }, []);

  return (
    <ThemedView style={[styles.container, { backgroundColor: theme.primary }]}>
      <ActivityIndicator size="large" color="#FFFFFF" />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
