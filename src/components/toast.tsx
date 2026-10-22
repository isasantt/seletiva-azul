import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ThemedText } from '@/components/themed-text';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

export type TipoToast = 'info' | 'success' | 'warning' | 'danger';

type ToastData = {
  id: number;
  titulo: string;
  mensagem?: string;
  tipo: TipoToast;
};

type ToastContexto = {
  showToast: (titulo: string, mensagem?: string, tipo?: TipoToast) => void;
};

const ToastContext = createContext<ToastContexto | null>(null);

export function useToast(): ToastContexto {
  const contexto = useContext(ToastContext);
  if (!contexto) throw new Error('useToast precisa estar dentro de <ToastProvider>.');
  return contexto;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastData | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (titulo: string, mensagem?: string, tipo: TipoToast = 'info') => {
      if (timer.current) clearTimeout(timer.current);
      setToast({ id: Date.now(), titulo, mensagem, tipo });
      timer.current = setTimeout(() => setToast(null), 5000);
    },
    [],
  );

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, []);

  const cor =
    toast?.tipo === 'success'
      ? theme.success
      : toast?.tipo === 'warning'
        ? theme.warning
        : toast?.tipo === 'danger'
          ? theme.danger
          : theme.accent;

  const icone =
    toast?.tipo === 'success'
      ? 'checkmark-circle'
      : toast?.tipo === 'warning'
        ? 'warning'
        : toast?.tipo === 'danger'
          ? 'alert-circle'
          : 'information-circle';

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      {toast ? (
        <View
          pointerEvents="none"
          style={[styles.host, { top: insets.top + Spacing.two }]}
          accessibilityLiveRegion="polite">
          <View
            style={[
              styles.toast,
              {
                backgroundColor: theme.backgroundElement,
                borderColor: cor,
                shadowColor: theme.primary,
              },
            ]}>
            <Ionicons name={icone} size={24} color={cor} />
            <View style={styles.textos}>
              <ThemedText type="smallBold">{toast.titulo}</ThemedText>
              {toast.mensagem ? (
                <ThemedText type="small" themeColor="textSecondary">
                  {toast.mensagem}
                </ThemedText>
              ) : null}
            </View>
          </View>
        </View>
      ) : null}
    </ToastContext.Provider>
  );
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    paddingHorizontal: Spacing.four,
    zIndex: 9999,
  },
  toast: {
    width: '100%',
    maxWidth: MaxContentWidth,
    borderWidth: 2,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: Spacing.two,
    shadowOpacity: 0.18,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  textos: {
    flex: 1,
    gap: 2,
  },
});
