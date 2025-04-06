import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/i18n';

interface ShipperStore {
  userId: number | null;
  language: string;
  setUserId: (id: number | null) => void;
  setLanguage: (lang: string) => void;
  logout: () => void;
}

export const useShipperStore = create<ShipperStore>()(
  persist(
    (set) => ({
      userId: null,
      language: 'VN',
      
      setUserId: (id) => set({ userId: id }),

      setLanguage: async (lang: string) => {
        try {
          // Cập nhật store
          set({ language: lang });

          // Cập nhật AsyncStorage
          await AsyncStorage.setItem('language', lang);

          // Đổi ngôn ngữ của i18n
          await i18n.changeLanguage(lang);

          console.log('🌍 Language changed to:', lang);

        } catch (error) {
          console.error('❌ Error updating language:', error);
        }
      },

      logout: async () => {
        try {
          console.log("🔴 Logging out...");

          // Xóa token đăng nhập khỏi AsyncStorage
          await AsyncStorage.removeItem("access_token");

          // Cập nhật state store khi logout
          set({ userId: null });

          console.log("✅ Logout successful!");

        } catch (error) {
          console.error("❌ [logout] Error logging out:", error);
        }
      },
    }),
    {
      name: 'shipper-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);


