import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n/i18n';
import axiosInstance from '../utils/axiosInstance'; // dùng instance đã cấu hình

interface ShipperStore {
  userId: number | null;
  language: string;
  setUserId: (id: number | null) => void;
  setLanguage: (lang: string) => void;
  logout: () => void;
  checkShipmentTime: () => Promise<boolean>;
}

export const useShipperStore = create<ShipperStore>()(
  persist(
    (set) => ({
      userId: null,
      language: 'VN',

      setUserId: (id) => set({ userId: id }),

      setLanguage: async (lang: string) => {
        try {
          set({ language: lang });
          await AsyncStorage.setItem('language', lang);
          await i18n.changeLanguage(lang);
          console.log('🌍 Language changed to:', lang);
        } catch (error) {
          console.error('❌ Error updating language:', error);
        }
      },

      logout: async () => {
        try {
          console.log("🔴 Logging out...");
          await AsyncStorage.removeItem("access_token");
          set({ userId: null });
          console.log("✅ Logout successful!");
        } catch (error) {
          console.error("❌ [logout] Error logging out:", error);
        }
      },

      checkShipmentTime: async () => {
        try {
          const token = await AsyncStorage.getItem("access_token");
          if (!token) {
            console.warn('⚠️ No access token found!');
            return false;
          }

          const response = await axiosInstance.get('/shipment/check-time', {
            headers: {
              Authorization: `Bearer ${token}`,
              Accept: '*/*',
            },
          });

          if (response.status === 200) {
            console.log('📦 Shipment check successful!');
            return true;
          } else {
            console.warn('⚠️ Shipment check returned non-200:', response.status);
            return false;
          }

        } catch (error) {
          console.log('❌ Error checking shipment:', error);
          return false;
        }
      }
    }),
    {
      name: 'shipper-store',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
