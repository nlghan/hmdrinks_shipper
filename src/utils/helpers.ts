import AsyncStorage from "@react-native-async-storage/async-storage";
import { decode as atob } from 'base-64'; 

export const getCookie = async (name: string): Promise<string | null> => {
    try {
        const value = await AsyncStorage.getItem(name);
        return value ? value : null;
    } catch (error) {
        console.error("Lỗi khi lấy cookie từ AsyncStorage:", error);
        return null;
    }
};


export const getUserIdFromToken = (token: string): string | null => {
    try {
        const payload = JSON.parse(atob(token.split(".")[1])); 
        return payload?.userId || null;
    } catch (error) {
        console.error("Lỗi khi lấy userId từ token:", error);
        return null;
    }
};

export const formatBirthDayForInput = (dateString: string): string => {
    const birthDate = new Date(dateString);
    const year = birthDate.getFullYear();
    const month = String(birthDate.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
    const day = String(birthDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};
