import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router';
import Head from 'expo-router/head';
import { useColorScheme } from 'react-native';

import { RedirecionarAuth } from '@/components/redirecionar-auth';
import { ToastProvider } from '@/components/toast';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import { useSupabaseRealtime } from '@/hooks/use-supabase-realtime';

function EfeitosGlobais() {
  useSupabaseRealtime();
  useOfflineSync();
  return null;
}

export default function RootLayout() {
  const colorScheme = useColorScheme();
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Head>
        <title>AtmosBag | Azul</title>
      </Head>
      <ToastProvider>
        <EfeitosGlobais />
        <RedirecionarAuth />
        <Stack screenOptions={{ headerShown: false }} />
      </ToastProvider>
    </ThemeProvider>
  );
}
