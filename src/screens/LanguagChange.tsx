import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useShipperStore } from "../store/store";
import { useNavigation } from "@react-navigation/native";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { useTranslation } from 'react-i18next';
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { RootStackParamList } from "../navigation/RootStackParamList";
import { FONTFAMILY } from "../theme/theme";

const LanguageChange = () => {
  const { language, setLanguage } = useShipperStore();
  const { t } = useTranslation();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  // 🛠 State để kiểm soát loading
  const [loading, setLoading] = useState(false);

  const changeLanguage = async (newLang: "VN" | "EN") => {
    setLoading(true); // 🔥 Hiển thị indicator khi đổi ngôn ngữ
    console.log("🛠 Chuyển ngôn ngữ sang:", newLang);

    await setLanguage(newLang);
    console.log("✅ Đã chuyển ngôn ngữ sang:", newLang);

    setTimeout(() => {
      setLoading(false); // Ẩn indicator
      navigation.navigate("Main"); // ✅ Điều hướng về "Main"
    }, 1000); // ⏳ Giữ loading 1 giây để trải nghiệm mượt hơn
  };

  return (
    <View style={styles.container}>
      {/* 🔙 Nút quay lại */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()} disabled={loading}>
        <MaterialIcons name="arrow-back" size={28} color="#333" />
      </TouchableOpacity>

      <Text style={styles.title}>{t('common.chooseLanguage')}</Text>

      <TouchableOpacity
        style={[styles.button, language === "VN" && styles.active]}
        onPress={() => changeLanguage("VN")}
        disabled={loading} // ✅ Chặn bấm khi đang loading
      >
        <Text style={styles.text}>🇻🇳 Tiếng Việt</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, language === "EN" && styles.active]}
        onPress={() => changeLanguage("EN")}
        disabled={loading} // ✅ Chặn bấm khi đang loading
      >
        <Text style={styles.text}>🇺🇸 English</Text>
      </TouchableOpacity>

      {/* 🔄 Overlay Loading */}
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color="#FFF" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  backButton: {
    position: "absolute",
    top: 40,
    left: 20,
    padding: 10,
  },
  title: {
    fontSize: 24,
    fontFamily:FONTFAMILY.lobster_regular,
    marginBottom: 20,
  },
  button: {
    padding: 10,
    borderRadius: 5,
    backgroundColor: "#ddd",
    marginBottom: 10,
    width: "80%",
    alignItems: "center",
  },
  active: {
    backgroundColor: "#FFA07A",
  },
  text: {
    fontSize: 24,
    fontFamily:FONTFAMILY.dongle_bold,
    color: "#333",
  },
  // 🔄 Overlay Loading
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0, 0, 0, 0.5)", // Nền mờ
    justifyContent: "center",
    alignItems: "center",
  },
});

export default LanguageChange;
