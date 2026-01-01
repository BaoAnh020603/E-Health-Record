import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export default function RemindersListScreen({ navigation }: any) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [medications, setMedications] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'appointments' | 'medications'>('medications');

  useEffect(() => {
    loadReminders();
  }, []);

  const loadReminders = async () => {
    try {
      setLoading(true);
      const userId = await AsyncStorage.getItem('userId');

      if (!userId) {
        Alert.alert('Lỗi', 'Vui lòng đăng nhập');
        return;
      }

      // Load lịch khám
      const { data: apptData, error: apptError } = await supabase
        .from('appointments')
        .select('*')
        .eq('user_id', userId)
        .gte('date', new Date().toISOString().split('T')[0])
        .order('date', { ascending: true });

      if (apptError) throw apptError;
      setAppointments(apptData || []);

      // Load thuốc đang dùng
      const { data: medData, error: medError } = await supabase
        .from('medications')
        .select(`
          *,
          medication_reminders (*)
        `)
        .eq('user_id', userId)
        .eq('active', true)
        .order('created_at', { ascending: false });

      if (medError) throw medError;
      setMedications(medData || []);

    } catch (error: any) {
      console.error('Load reminders error:', error);
      Alert.alert('Lỗi', error.message);
    } finally {
      setLoading(false);
    }
  };

  const deleteAppointment = async (id: string) => {
    Alert.alert(
      'Xác nhận',
      'Bạn có chắc muốn xóa lịch khám này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            try {
              const { error } = await supabase
                .from('appointments')
                .delete()
                .eq('id', id);

              if (error) throw error;
              loadReminders();
            } catch (error: any) {
              Alert.alert('Lỗi', error.message);
            }
          }
        }
      ]
    );
  };

  const toggleMedication = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('medications')
        .update({ active: !currentStatus })
        .eq('id', id);

      if (error) throw error;
      loadReminders();
    } catch (error: any) {
      Alert.alert('Lỗi', error.message);
    }
  };

  const renderAppointment = ({ item }: any) => (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Ionicons name="calendar" size={24} color="#007AFF" />
        <Text style={styles.cardTitle}>Lịch Khám</Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.cardDate}>
          📅 {new Date(item.date).toLocaleDateString('vi-VN')}
          {item.time && ` - ⏰ ${item.time}`}
        </Text>
        
        {item.doctor && (
          <Text style={styles.cardText}>👨‍⚕️ {item.doctor}</Text>
        )}
        
        {item.location && (
          <Text style={styles.cardText}>📍 {item.location}</Text>
        )}
        
        {item.notes && (
          <Text style={styles.cardNotes}>📝 {item.notes}</Text>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.badge}>
            {item.created_from === 'ocr' ? '🤖 Từ OCR' : '✍️ Thủ công'}
          </Text>
          
          <TouchableOpacity
            onPress={() => deleteAppointment(item.id)}
            style={styles.deleteButton}
          >
            <Ionicons name="trash-outline" size={20} color="#FF3B30" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  const renderMedication = ({ item }: any) => (
    <View style={[styles.card, !item.active && styles.cardInactive]}>
      <View style={styles.cardHeader}>
        <Ionicons name="medical" size={24} color="#34C759" />
        <Text style={styles.cardTitle}>{item.name}</Text>
      </View>
      
      <View style={styles.cardBody}>
        <Text style={styles.cardText}>💊 Liều lượng: {item.dosage}</Text>
        <Text style={styles.cardText}>⏰ Tần suất: {item.frequency}</Text>
        
        {item.medication_reminders && item.medication_reminders.length > 0 && (
          <Text style={styles.cardText}>
            🕐 Thời gian: {item.medication_reminders.map((r: any) => r.time_of_day).join(', ')}
          </Text>
        )}
        
        {item.duration && (
          <Text style={styles.cardText}>📅 Thời hạn: {item.duration}</Text>
        )}
        
        {item.instructions && (
          <Text style={styles.cardNotes}>📝 {item.instructions}</Text>
        )}
        
        <View style={styles.cardFooter}>
          <Text style={styles.badge}>
            {item.created_from === 'ocr' ? '🤖 Từ OCR' : '✍️ Thủ công'}
          </Text>
          
          <TouchableOpacity
            onPress={() => toggleMedication(item.id, item.active)}
            style={styles.toggleButton}
          >
            <Ionicons 
              name={item.active ? 'pause-circle' : 'play-circle'} 
              size={24} 
              color={item.active ? '#FF9500' : '#34C759'} 
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'medications' && styles.tabActive]}
          onPress={() => setActiveTab('medications')}
        >
          <Ionicons 
            name="medical" 
            size={20} 
            color={activeTab === 'medications' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'medications' && styles.tabTextActive]}>
            Thuốc ({medications.length})
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, activeTab === 'appointments' && styles.tabActive]}
          onPress={() => setActiveTab('appointments')}
        >
          <Ionicons 
            name="calendar" 
            size={20} 
            color={activeTab === 'appointments' ? '#007AFF' : '#999'} 
          />
          <Text style={[styles.tabText, activeTab === 'appointments' && styles.tabTextActive]}>
            Lịch Khám ({appointments.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      <FlatList
        data={activeTab === 'medications' ? medications : appointments}
        renderItem={activeTab === 'medications' ? renderMedication : renderAppointment}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={loading} onRefresh={loadReminders} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons 
              name={activeTab === 'medications' ? 'medical-outline' : 'calendar-outline'} 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {activeTab === 'medications' 
                ? 'Chưa có thuốc nào' 
                : 'Chưa có lịch khám nào'}
            </Text>
            <TouchableOpacity
              style={styles.scanButton}
              onPress={() => navigation.navigate('OCRScan')}
            >
              <Ionicons name="camera" size={20} color="#fff" />
              <Text style={styles.scanButtonText}>Quét Đơn Thuốc</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('OCRScan')}
      >
        <Ionicons name="camera" size={28} color="#fff" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5'
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0'
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF'
  },
  tabText: {
    fontSize: 14,
    color: '#999'
  },
  tabTextActive: {
    color: '#007AFF',
    fontWeight: '600'
  },
  list: {
    padding: 16
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  cardInactive: {
    opacity: 0.6
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  cardBody: {
    gap: 8
  },
  cardDate: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF'
  },
  cardText: {
    fontSize: 14,
    color: '#666'
  },
  cardNotes: {
    fontSize: 13,
    color: '#999',
    fontStyle: 'italic',
    marginTop: 4
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0'
  },
  badge: {
    fontSize: 12,
    color: '#666',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4
  },
  deleteButton: {
    padding: 4
  },
  toggleButton: {
    padding: 4
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
    marginBottom: 24
  },
  scanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8
  },
  scanButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600'
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8
  }
});
