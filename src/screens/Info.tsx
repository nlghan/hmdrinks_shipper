import React, { useState, useEffect } from "react";
import { Modal, View, Text, StyleSheet, FlatList, ScrollView, TouchableOpacity, Image, TextInput, Button, Alert, ActivityIndicator } from "react-native";
import axiosInstance from "../utils/axiosInstance";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import Icon from "react-native-vector-icons/MaterialIcons";
import { useNavigation } from '@react-navigation/native';
import { useShipperStore } from "../store/store";
import Header from "../components/Header";
import { useTranslation } from 'react-i18next';
import { COLORS, FONTFAMILY } from "../theme/theme";

type NavigationProps = {
  navigate: (screen: string) => void;
};
const Info: React.FC = () => {
  const [formData, setFormData] = useState({
    email: "",
    fullName: "",
    phoneNumber: "",
    avatar: "",
    sex: "",
    birthDay: "",
    street: "",
    ward: "",
    district: "",
    city: "",
  });
  type SelectedFile = {
    uri: string;
    type: string;
    name: string;
  };
  const { t } = useTranslation();

  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null);
  const [loading, setLoading] = useState(true);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districtId, setDistrictId] = useState<number | null>(null);
  const [selectedDistrict, setSelectedDistrict] = useState<District>();
  const [wardId, setWardId] = useState<number | null>(null);
  const [districts, setDistricts] = useState<District[]>([]);
  const [wards, setWards] = useState<Ward[]>([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [provinceId, setProvinceId] = useState<number | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [editedData, setEditedData] = useState({ ...formData });
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isModalVisibleV, setModalVisibleV] = useState(false);
  const [voucherList, setVoucherList] = useState<Voucher[]>([]);
  const navigation = useNavigation<NavigationProps>();
  const { userId } = useShipperStore();

  interface Province {
    provinceId: number;
    provinceName: string;
  }

  interface District {
    districtId: number;
    districtName: string;
  }

  interface Ward {
    wardId: number;
    wardName: string;
  }


  const fetchUserInfo = async () => {
    try {
      setLoading(true); // Bắt đầu hiển thị loading

      // Lấy token & userId từ AsyncStorage
      const token = await AsyncStorage.getItem("access_token");
      console.log("🔍 Token lấy từ AsyncStorage:", token, typeof token);

      console.log("🔍 UserID từ store:", userId);

      if (!token || token === "null" || token === "undefined") {
        setError("Bạn cần đăng nhập để xem thông tin này.");
        setLoading(false);
        return;
      }

      if (!userId) {
        setError("Không thể lấy userId từ store.");
        setLoading(false);
        return;
      }

      // Gửi request lấy thông tin người dùng
      const response = await axiosInstance.get(`/user/info/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Log phản hồi từ API
      console.log("📌 Dữ liệu trả về từ API:", response.data);

      const userInfo = response.data;

      let addressParts = (userInfo.address || "")
        .split(",")
        .map((part: string) => part.trim());

      const [street, ward, district, city] = addressParts.map((part: string) =>
        part && part !== "None" && part !== "null" ? part : ""
      );

      const formattedBirthDay = userInfo.birth_date
        ? new Date(userInfo.birth_date).toISOString().split("T")[0]
        : "";

      // Log thông tin đã xử lý
      console.log("📍 Thông tin đã xử lý:", {
        email: userInfo.email,
        fullName: userInfo.fullName,
        phoneNumber: userInfo.phone,
        avatar: userInfo.avatar,
        sex: userInfo.sex,
        birthDay: formattedBirthDay,
        street,
        ward,
        district,
        city,
      });

      // Cập nhật state
      setFormData({
        email: userInfo.email || "",
        fullName: userInfo.fullName || "",
        phoneNumber: userInfo.phone || "",
        avatar: userInfo.avatar || "",
        sex: userInfo.sex || "",
        birthDay: formattedBirthDay,
        street,
        ward,
        district,
        city,
      });

      setEditedData({
        email: userInfo.email || "",
        fullName: userInfo.fullName || "",
        phoneNumber: userInfo.phone || "",
        avatar: userInfo.avatar || "",
        sex: userInfo.sex || "",
        birthDay: formattedBirthDay,
        street,
        ward,
        district,
        city,
      });

      setPreviewImage(userInfo.avatar || "");
    } catch (err) {
      console.error("❌ Lỗi khi lấy thông tin người dùng:", err);
      setError("Không thể lấy thông tin người dùng.");
    } finally {
      setLoading(false);
    }
  };


  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (!formData.city) return;

    const fetchProvinces = async () => {
      try {
        const response = await axiosInstance.get(`/province/listAll`);
        const provinces = response.data.responseList;
        let selectedProvince = provinces.find((province: Province) => province.provinceName === formData.city);

        if (!selectedProvince) {
          setError("Không tìm thấy tỉnh.");
          setLoading(false);
          return;
        }

        setProvinceId(selectedProvince.provinceId);

        if (!formData.district) {
          setDistrictId(null);
          return;
        }

        const districtResponse = await axiosInstance.get(`/province/list-district?provinceId=${selectedProvince.provinceId}`);
        const districts = districtResponse.data.districtResponseList;
        setDistricts(districts);

        const selectedDistrict = districts.find((d: District) => d.districtName === formData.district);
        if (selectedDistrict) {
          setDistrictId(selectedDistrict.districtId);
          setSelectedDistrict(selectedDistrict)
          await fetchWards(selectedDistrict.districtId);
        } else {
          setError(`Không tìm thấy huyện "${formData.district}".`);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error("Lỗi khi lấy danh sách tỉnh:", err);
        setError("Không thể lấy danh sách tỉnh.");
      }
    };

    fetchProvinces();
  }, [formData.city, formData.district]);

  const fetchWards = async (districtId: number) => {
    try {
      const response = await axiosInstance.get(`/province/list-ward?districtId=${districtId}`);
      setWards(response.data.responseList || []);
    } catch (error) {
      console.error("Error fetching wards:", error);
      setWards([]);
    }
  };

  useEffect(() => {
    const fetchProvinces = async () => {
      try {
        const response = await axiosInstance.get(`/province/listAll`);
        setProvinces(response.data.responseList);
      } catch (error) {
        console.error('Error fetching provinces:', error);
      }
    };
    fetchProvinces();
  }, []);

  const fetchDistricts = async (provinceId: number) => {
    try {
      const response = await axiosInstance.get(`/province/list-district?provinceId=${provinceId}`);
      setDistricts(response.data.districtResponseList || []);
    } catch (error) {
      console.error('Error fetching districts:', error);
      setDistricts([]);
    }
  };

  const handleCityChange = async (selectedCity: string) => {
    const selectedProvince = provinces.find((province) => province.provinceName === selectedCity);

    setEditedData({ ...editedData, city: selectedCity }); // Lưu tên thành phố/tỉnh

    if (selectedProvince) {
      setProvinceId(selectedProvince.provinceId);
      setFormData({ ...formData, city: selectedCity, district: '', ward: '' });
      await fetchDistricts(selectedProvince.provinceId);
    }
  };


  const handleDistrictChange = async (selectedDistrictId: any) => {
    setDistrictId(selectedDistrictId); // Lưu districtId riêng
    const selectedDistrictAPI = districts.find((district) => district.districtName === selectedDistrictId);
    setSelectedDistrict(selectedDistrictAPI);
    if (selectedDistrict) {
      setEditedData({ ...editedData, district: selectedDistrict?.districtName, ward: '' }); // Lưu tên
      await fetchWards(selectedDistrict?.districtId);
    }

    // if (selectedDistrict) {
    //   setFormData({
    //     ...formData,
    //     district: selectedDistrict.districtName, // Chỉ lưu tên quận/huyện
    //   });
    // }
  };



  const handleWardChange = (selectedWard: string) => {
    console.log("selectedWard", selectedWard);
    setEditedData({ ...editedData, ward: selectedWard });
  };


  const handleSubmitImg = async () => {
    const token = await AsyncStorage.getItem('access_token');
    4
    if (!token || !userId) {
      setError('Bạn cần đăng nhập để thực hiện thao tác này.');
      return;
    }
    if (selectedFile) {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri, // URI từ expo-image-picker
        type: "image/jpeg", // Hoặc lấy từ selectedFile.mimeType nếu có
        name: "avatar.jpg",
      } as any); // Dùng `as any` nếu TypeScript báo lỗi
      setIsUploading(true);
      setPreviewImage(selectedFile.uri);
      try {
        const response = await axiosInstance.post(`/image/user/upload?userId=${userId}`, formData, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'multipart/form-data' },
        });
        setPreviewImage(response.data.url);
      } catch (error) {
        console.error('Lỗi khi cập nhật ảnh:', error);
      } finally {
        setIsUploading(false);
      }
    }
  };
  useEffect(() => {
    if (selectedFile) {
      handleSubmitImg();
    }
  }, [selectedFile]);

  const pickImage = () => {
    launchImageLibrary({ mediaType: 'photo' }, (response) => {
      if (response.didCancel) {
        console.log('User cancelled image picker');
      } else if (response.errorMessage) {
        console.log('ImagePicker Error: ', response.errorMessage);
      } else if (response.assets && response.assets.length > 0) {
        const fileData: SelectedFile = {
          uri: response.assets?.[0]?.uri ?? "",
          type: response.assets?.[0]?.type || "image/jpeg",
          name: response.assets?.[0]?.fileName || "avatar.jpg",
        };
        setSelectedFile(fileData);

        // 🛠 Gọi handleSubmitImg ngay sau khi cập nhật ảnh
        handleSubmitImg();
      }
    });
  };
  const validateForm = () => {
    if (!editedData.fullName.trim()) {
      alert("Vui lòng nhập họ và tên");
      return false;
    }

    if (!editedData.email.trim() || !/\S+@\S+\.\S+/.test(editedData.email)) {
      alert("Vui lòng nhập email hợp lệ");
      return false;
    }

    if (!editedData.phoneNumber.trim() || !/^\d{10}$/.test(editedData.phoneNumber)) {
      alert("Vui lòng nhập số điện thoại hợp lệ (10 chữ số)");
      return false;
    }

    if (!editedData.birthDay) {
      alert("Vui lòng chọn ngày sinh");
      return false;
    }

    if (!editedData.city.trim()) {
      alert("Vui lòng nhập thành phố/tỉnh");
      return false;
    }

    return true; // Trả về `true` nếu tất cả dữ liệu hợp lệ
  };


  const handlePickAndUpload = async () => {
    await pickImage(); // Chọn ảnh trước
    if (previewImage) {
      handleSubmitImg(); // Nếu có ảnh, thực hiện tải lên
    }
  };

  const toggleModal = () => setModalVisible(!isModalVisible);

  const handleUpdate = async () => {
    const token = await AsyncStorage.getItem('access_token');

    if (!token || !userId) {
      setError("Bạn cần đăng nhập.");
      return;
    }

    if (!validateForm()) return;

    const updatedData = {
      userId,
      email: editedData.email,
      fullName: editedData.fullName,
      phoneNumber: editedData.phoneNumber,
      avatar: editedData.avatar,
      sex: editedData.sex,
      birthDay: editedData.birthDay,
      address: `${editedData.street}, ${editedData.ward}, ${editedData.district}, ${editedData.city}`,
    };

    console.log("Dữ liệu gửi lên API:", updatedData);

    try {
      await axiosInstance.put(`/user/info-update`, updatedData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log("Cập nhật thành công!");
      fetchUserInfo();
      setLoading(false);
      toggleModal(); // Đóng modal sau khi cập nhật thành công
    } catch (error) {
      if (error instanceof Error) {
        console.error("Lỗi cập nhật:", error.message);
      } else {
        console.error("Lỗi không xác định:", error);
      }
      setError("Không thể cập nhật thông tin.");
    }

  };



  const convertSexToBackend = (sex: string): string => {
    const mapping: Record<string, string> = {
      "Nam": "MALE",
      "Nữ": "FEMLAE",
      "Khác": "OTHER",
    };
    return mapping[sex] || sex;
  };

  const convertSexToFrontend = (sex: string) => {
    const mapping: Record<string, string> = {
      MALE: "Nam",
      FEMALE: "Nữ",
      OTHER: "Khác",
    };
    return mapping[sex] || sex;
  };

  interface Voucher {
    voucherId: string;
    key?: string;
    [key: string]: any; // Cho phép các thuộc tính khác
  }
  const fetchVouchers = async (setVoucherList: React.Dispatch<React.SetStateAction<Voucher[]>>, setLoading: React.Dispatch<React.SetStateAction<boolean>>) => {
    setLoading(true);
    try {
      const token = await AsyncStorage.getItem('access_token');
      4

      if (!token || !userId) {
        console.error("Bạn cần đăng nhập để thực hiện thao tác này.");
        return;
      }
      const headers = {
        Accept: "*/*",
        Authorization: `Bearer ${token}`, // Đảm bảo token có 'Bearer'
      };

      const response = await axiosInstance.get<{ getVoucherResponseList: Voucher[] }>(
        `/user-voucher/view-all/${userId}`,
        { headers }
      );

      if (response.status === 200) {
        const data = response.data;

        // Fetch từng voucher với axios
        const vouchers: Voucher[] = await Promise.all(
          data.getVoucherResponseList.map(async (voucher: Voucher) => {
            try {
              const voucherResponse = await axiosInstance.get<{ body: { key: string } }>(
                `/voucher/view/${voucher.voucherId}`,
                { headers }
              );
              if (voucherResponse.status === 200) {
                return { ...voucher, key: voucherResponse.data.body.key };
              }
            } catch (error) {
              console.error(`Lỗi khi lấy voucher ${voucher.voucherId}:`, error);
            }
            return voucher;
          })
        );

        setVoucherList(vouchers);
      } else {
        console.error("Lỗi khi lấy danh sách voucher:", response.status);
      }
    } catch (error) {
      console.error("Lỗi khi gọi API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalVisibleV) {
      fetchVouchers(setVoucherList, setLoading);
    }
  }, [isModalVisibleV]);


  if (loading) return <Text style={styles.loading}>{t('loading')}</Text>;
  if (error) return <Text style={styles.error}>{error}</Text>;
  if (success) return <Text style={styles.success}>{success}</Text>;

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Header
        style={{
          paddingHorizontal: 14,
          paddingTop: 10,
          paddingBottom: 10,
          marginBottom: 10,
          backgroundColor: 'white',
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.2,
          shadowRadius: 4,
          elevation: 5,
        }}
      />
      <View style={styles.card}>
        <Modal visible={isModalVisibleV} animationType="fade" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>{t('information.voucherList')}</Text>
              {loading ? (
                <ActivityIndicator size="large" color="#FF9800" />
              ) : (
                <FlatList
                  data={voucherList}
                  keyExtractor={(item) => item.voucherId.toString()}
                  renderItem={({ item }) => (
                    <View style={styles.voucherItem}>
                      <Text style={styles.voucherKey}>{item.key}</Text>
                      <Text
                        style={[
                          styles.voucherStatus,
                          { color: item.status === "USED" ? "red" : item.status === "EXPIRED" ? "gray" : "green" },
                        ]}
                      >
                        {item.status === "USED"
                          ? t('information.used')
                          : item.status === "EXPIRED"
                            ? t('information.expired')
                            : t('information.inactive')}
                      </Text>

                    </View>
                  )}
                />

              )}

              <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisibleV(false)}>
                <Text style={styles.closeButtonText}>{t('close')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
        <View style={styles.avatarContainer}>
          {previewImage ? (
            <View style={styles.avatarWrapper}>
              <Image source={{ uri: previewImage }} style={styles.avatar} />
              {isUploading && (
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#fff" />
                </View>
              )}
            </View>
          ) : (
            <View style={styles.placeholder}>
              <Text style={styles.placeholderText}>N/A</Text>
            </View>
          )}
          <TouchableOpacity style={styles.updateButton}>
            <Text style={styles.buttonText} onPress={pickImage} disabled={isUploading} >{t('postContent.uploadImg')}
            </Text>
          </TouchableOpacity>
        </View>


        {/* Thông tin người dùng */}
        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('fullName')}:</Text>
            <Text style={styles.value}>{formData.fullName}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('email')}:</Text>
            <Text style={styles.value}>{formData.email}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('phone')}:</Text>
            <Text style={styles.value}>{formData.phoneNumber}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('information.gender')}:</Text>
            <Text style={styles.value}>{convertSexToFrontend(formData.sex)}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('information.birthday')}:</Text>
            <Text style={styles.value}>{formData.birthDay}</Text>
          </View>
          <View style={styles.infoRow}>
            <Text style={styles.label}>{t('address')}:</Text>
            <Text style={styles.value}>
              {formData.street}, {formData.ward}, {formData.district}, {formData.city}
            </Text>
          </View>
          <TouchableOpacity style={styles.updateButton} onPress={toggleModal}>
            <Text style={styles.buttonText}>{t('updateBtn')}</Text>
          </TouchableOpacity>
        </View>
      </View>
      {/* Modal chỉnh sửa */}
      <Modal visible={isModalVisible} animationType="fade" transparent={true}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('userContent.update')}</Text>

            {/* Họ và tên */}
            <TextInput
              style={styles.input}
              placeholder={t('fullName')}
              placeholderTextColor="gray"
              value={editedData.fullName}
              onChangeText={(text) => setEditedData({ ...editedData, fullName: text })}
            />

            {/* Email */}
            <TextInput
              style={styles.input}
              placeholder={t('email')}
              placeholderTextColor="gray"
              value={editedData.email}
              textAlign="left" // Giữ nội dung căn trá
              onChangeText={(text) => setEditedData({ ...editedData, email: text })}
            />

            {/* Số điện thoại */}
            <TextInput
              style={styles.input}
              placeholder={t('phone')}
              placeholderTextColor="gray"
              keyboardType="phone-pad"
              value={editedData.phoneNumber}
              onChangeText={(text) => setEditedData({ ...editedData, phoneNumber: text })}
            />

            <View style={styles.rowContainer}>
              {/* Giới tính */}
              <View style={styles.pickerContainer}>
                <Text style={styles.label}>{t('information.gender')}:</Text>
                <Picker
                  selectedValue={formData.sex}
                  style={styles.picker}
                  onValueChange={(itemValue) => {
                    // Alert.alert("selectedValue", itemValue);             
                    const dataUpdate = { ...editedData, sex: itemValue };
                    setEditedData(dataUpdate);
                    // Alert.alert("editdata", editedData.sex); 
                  }
                  }
                >
                  <Picker.Item label={t('information.male')} value="MALE" />
                  <Picker.Item label={t('information.female')} value="FEMALE" />
                  <Picker.Item label={t('information.other')} value="OTHER" />
                </Picker>
              </View>

              {/* Ngày sinh */}
              <View style={styles.dateContainer}>
                <Text style={styles.label}>{t('information.birthday')}:</Text>
                <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePickerButton}>
                  <Text style={styles.dateText}>{editedData.birthDay || "Chọn ngày sinh"}</Text>
                </TouchableOpacity>
                {showDatePicker && (
                  <DateTimePicker
                    value={editedData.birthDay ? new Date(editedData.birthDay) : new Date()}
                    mode="date"
                    display="default"
                    onChange={(event, selectedDate) => {
                      setShowDatePicker(false);
                      if (selectedDate) {
                        setEditedData({ ...editedData, birthDay: selectedDate.toISOString().split('T')[0] });
                      }
                    }}
                  />
                )}
              </View>
            </View>

            {/* Địa chỉ */}
            <TextInput
              style={styles.input}
              placeholder={t('information.detailAddress')}
              placeholderTextColor="gray"
              value={editedData.street}
              onChangeText={(text) => setEditedData({ ...editedData, street: text })}
            />
            <Picker
              selectedValue={editedData.city}
              onValueChange={(itemValue) => handleCityChange(itemValue)}
              style={styles.pickerAd}
            >
              <Picker.Item label={t('information.selectCity')} value="" />
              {provinces.map((province) => (
                <Picker.Item key={province.provinceId} label={province.provinceName} value={province.provinceName} />
              ))}
            </Picker>

            <Picker
              selectedValue={editedData.district}
              onValueChange={(itemValue) => { handleDistrictChange(itemValue) }}
              style={styles.pickerAd}
              enabled={districts.length > 0}
            >
              <Picker.Item label={t('information.selectDistrict')} value="" />
              {districts.map((district) => (
                <Picker.Item key={district.districtId} label={district.districtName} value={district.districtName} />
              ))}
            </Picker>

            <Picker
              selectedValue={editedData.ward}
              onValueChange={(itemValue) => handleWardChange(itemValue)}
              style={styles.pickerAd}
              enabled={wards.length > 0}
            >
              <Picker.Item label={t('information.selectWard')} value="" />
              {wards.map((ward) => (
                <Picker.Item key={ward.wardId} label={ward.wardName} value={ward.wardName} />
              ))}
            </Picker>


            <View style={styles.buttonRow}>
              <TouchableOpacity style={styles.modalButton} onPress={handleUpdate}>
                <Text style={styles.buttonText}>{t('updateBtn')}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalButton} onPress={toggleModal}>
                <Text style={styles.buttonText}>{t('order.orderDetail.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: "white",
    paddingBottom: 70,
  },
  editIcon: {
    position: "absolute",
    top: 10,
    right: 10,
  },
  backIcon: {
    position: "absolute",
    top: 10,
    left: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FF9800",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    padding: 20,
    borderRadius: 12,
    alignItems: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#E65100",
    marginBottom: 10,
  },
  voucherText: {
    fontSize: 16,
    color: "#5D4037",
  },
  closeButton: {
    marginTop: 15,
    paddingVertical: 10,
    backgroundColor: "#FF9800",
    borderRadius: 6,
    paddingHorizontal: 20,
  },
  closeButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  pickerAd: {
    width: "100%",
    height: 60,
    backgroundColor: "#fff",
    color: "gray",
    borderRadius: 5,
    borderWidth: 1,
    borderColor: "#A9A9A9", // Đổi viền thành màu xám
    paddingHorizontal: 10,
  },
  rowContainer: {
    flexDirection: "row",
    justifyContent: "space-between", // Căn cách đều 2 phần tử
    alignItems: "center", // Căn giữa theo chiều dọc
    marginBottom: 10,
  },
  pickerContainer: {
    flex: 1, // Chiếm 50% chiều rộng
    marginRight: 10, // Tạo khoảng cách với phần Ngày sinh
  },
  dateContainer: {
    flex: 1, // Chiếm 50% chiều rộng
  },
  picker: {
    height: 60,
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 5,
    borderWidth: 1,
    borderColor: '#ccc',
    color: "gray",
    
  },
  datePickerButton: {
    padding: 8,
    backgroundColor: '#f2f2f2',
    borderRadius: 5,
    alignItems: 'center',
    marginBottom: 10,
  },
  dateText: {
    color: '#333',
    fontSize:24,
    fontFamily:FONTFAMILY.dongle_regular,
  },
  updateButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: "#e89f33",
    borderRadius: 8,
    alignItems: "center",
  },
  buttonUpImg: {
    marginTop: 20,
    backgroundColor: COLORS.primaryGreenHex,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize:24,
    fontFamily:FONTFAMILY.dongle_regular,
  },
  voucherItem: {
    flexDirection: "row", // Xếp key và status trên cùng một dòng
    justifyContent: "space-between", // Đẩy key về trái, status về phải
    padding: 10,
    width: "95%",
    borderBottomWidth: 1,
    borderBottomColor: "#ccc",
  },
  voucherKey: {
    fontSize:26,
    fontFamily:FONTFAMILY.dongle_bold,
  },
  voucherStatus: {
    fontSize:24,
    fontFamily:FONTFAMILY.dongle_regular,
  },
  input: {
    width: "100%",
    padding: 8,
    borderWidth: 1,
    borderColor: "#ab8b59",
    borderRadius: 8,
    marginBottom: 10,
    overflow: "hidden",
    textAlign: "left",
    fontSize:25,
    fontFamily:FONTFAMILY.dongle_light,
  },
  modalButton: {
    backgroundColor: "#e89f33",
    padding: 10,
    borderRadius: 8,
    alignItems: "center",
    marginHorizontal: 5,
  },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 55,
    marginHorizontal: 8
  },
  avatarContainer: { alignItems: "center", marginBottom: 20, position: "relative" },
  avatarWrapper: {
    position: "relative",
    borderRadius: 100,
    borderWidth: 4,
    borderColor: "#FFA726",
  },
  avatar: { width: 160, height: 160, borderRadius: 80 },
  loadingOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.3)", // Làm mờ ảnh khi loading
    borderRadius: 50,
  },
  placeholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: "#FFCC80",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#FFFFFF",
    fontWeight: "bold",
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "center",
    width: "80%",
    marginTop: 10,
  },
  infoContainer: {
    backgroundColor: "#fffbf5",
    padding: 15,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#ffdaa3",
  },
  label: {
    fontSize: 22,
    fontFamily: FONTFAMILY.dongle_bold,
    color: "#E65100",
  },
  value: {
    flex: 1,
    textAlign: "right",
    color: "#5D4037",
    fontSize: 22,
    fontFamily: FONTFAMILY.dongle_regular,
  },
  loading: { textAlign: "center", marginTop: 20 },
  error: { color: "red", textAlign: "center", marginTop: 20 },
  success: { color: "green", textAlign: "center", marginTop: 20 }
});

export default Info;
