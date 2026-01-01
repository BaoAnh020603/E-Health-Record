import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  Alert
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';

const API_URL = API_BASE_URL;

export default function OCRScanScreen({ navigation }: any) {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  // Chọn ảnh từ thư viện
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập thư viện ảnh');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setResult(null);
      
      // Tự động phân tích
      if (result.assets[0].base64) {
        analyzeImage(result.assets[0].base64);
      }
    }
  };

  // Chụp ảnh mới
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    
    if (status !== 'granted') {
      Alert.alert('Lỗi', 'Cần quyền truy cập camera');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
      base64: true
    });

    if (!result.canceled && result.assets[0]) {
      setImage(result.assets[0].uri);
      setResult(null);
      
      // Tự động phân tích
      if (result.assets[0].base64) {
        analyzeImage(result.assets[0].base64);
      }
    }
  };

  // Gửi ảnh lên server để phân tích
  const analyzeImage = async (base64Image: string) => {
    try {
      setLoading(true);
      
      const userId = await AsyncStorage.getItem('userId');
      
      const response = await fetch(`${API_URL}/api/ocr/analyze`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          imageBase64: base64Image,
          userId: userId
        })
      });

      const data = await response.json();
      
      if (data.success) {
        setResult(data);
        Alert.alert(
          'Thành công!', 
          'Đã phân tích và lưu nhắc nhở vào lịch của bạn'
        );
      } else {
        Alert.alert('Lỗi', data.error || 'Không thể phân tích ảnh');
      }
    } catch (error) {
      console.error('Analyze error:', error);
      Alert.alert('Lỗi', 'Không thể kết nối đến server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Quét Đơn Thuốc / Lịch Khám</Text>
        <Text style={styles.subtitle}>
          Chụp hoặc chọn ảnh đơn thuốc, lịch khám để tự động tạo nhắc nhở
        </Text>
      </View>

      {/* Nút chọn ảnh */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={takePhoto}>
          <Ionicons name="camera" size={32} color="#fff" />
          <Text style={styles.buttonText}>Chụp Ảnh</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={pickImage}>
          <Ionicons name="images" size={32} color="#fff" />
          <Text style={styles.buttonText}>Chọn Từ Thư Viện</Text>
        </TouchableOpacity>
      </View>

      {/* Hiển thị ảnh đã chọn */}
      {image && (
        <View style={styles.imageContainer}>
          <Image source={{ uri: image }} style={styles.image} />
        </View>
      )}

      {/* Loading */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Đang phân tích ảnh...</Text>
        </View>
      )}

      {/* Kết quả phân tích */}
      {result && result.analysis && (
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>Kết Quả Phân Tích</Text>
          
          {/* Text đã trích xuất */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📄 Text Trích Xuất:</Text>
            <Text style={styles.extractedText}>{result.extractedText}</Text>
            <Text style={styles.confidence}>
              Độ chính xác: {Math.round(result.confidence)}%
            </Text>
          </View>

          {/* Lịch khám */}
          {result.analysis.appointments && result.analysis.appointments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📅 Lịch Khám:</Text>
              {result.analysis.appointments.map((apt: any, index: number) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardText}>📍 {apt.location}</Text>
                  <Text style={styles.cardText}>👨‍⚕️ BS: {apt.doctor}</Text>
                  <Text style={styles.cardText}>📆 {apt.date} - {apt.time}</Text>
                  {apt.notes && <Text style={styles.cardNotes}>📝 {apt.notes}</Text>}
                </View>
              ))}
            </View>
          )}

          {/* Lịch uống thuốc */}
          {result.analysis.medications && result.analysis.medications.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>💊 Lịch Uống Thuốc:</Text>
              {result.analysis.medications.map((med: any, index: number) => (
                <View key={index} style={styles.card}>
                  <Text style={styles.cardTitle}>{med.name}</Text>
                  <Text style={styles.cardText}>💊 Liều lượng: {med.dosage}</Text>
                  <Text style={styles.cardText}>⏰ Tần suất: {med.frequency}</Text>
                  <Text style={styles.cardText}>
                    🕐 Thời gian: {med.timing?.join(', ')}
                  </Text>
                  <Text style={styles.cardText}>📅 Thời hạn: {med.duration}</Text>
                  {med.instructions && (
                    <Text style={styles.cardNotes}>📝 {med.instructions}</Text>
                  )}
                </View>
              ))}
            </View>
          )}

          {/* Tóm tắt */}
          {result.analysis.summary && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>📋 Tóm Tắt:</Text>
              <Text style={styles.summaryText}>{result.analysis.summary}</Text>
            </View>
          )}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  header: {
    padding: 20,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#666'
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 20,
    gap: 15
  },
  button: {
    flex: 1,
    backgroundColor: '#007AFF',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    gap: 8
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600'
  },
  imageContainer: {
    padding: 20
  },
  image: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    resizeMode: 'contain'
  },
  loadingContainer: {
    padding: 40,
    alignItems: 'center'
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666'
  },
  resultContainer: {
    padding: 20
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20
  },
  section: {
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    marginBottom: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12
  },
  extractedText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 8
  },
  confidence: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '600'
  },
  card: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#007AFF'
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  cardText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4
  },
  cardNotes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4
  },
  summaryText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20
  }
});
