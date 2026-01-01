import React, { useEffect, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  TextInput,
  RefreshControl,
  Alert
} from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { Ionicons } from '@expo/vector-icons'
import { useFocusEffect } from '@react-navigation/native'
import { listMedicalRecords, deleteMedicalRecord } from '../../services/medicalRecords'
import { MedicalRecord } from '../../lib/supabase'

export default function MedicalRecordsScreen({ navigation }: any) {
  const [records, setRecords] = useState<MedicalRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [searchText, setSearchText] = useState('')
  const [selectedFilter, setSelectedFilter] = useState<string>('')

  const loadRecords = async () => {
    try {
      const result = await listMedicalRecords({
        search: searchText || undefined,
        loai_kham: selectedFilter || undefined
      })

      if (result.success) {
        setRecords(result.data)
      } else {
        Alert.alert('Lỗi', result.error)
      }
    } catch (error) {
      console.error('Load records error:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    loadRecords()
  }, [searchText, selectedFilter])

  useFocusEffect(
    React.useCallback(() => {
      loadRecords()
    }, [searchText, selectedFilter])
  )

  const onRefresh = () => {
    setRefreshing(true)
    loadRecords()
  }

  const handleDeleteRecord = (recordId: string) => {
    Alert.alert(
      'Xác nhận xóa',
      'Bạn có chắc chắn muốn xóa hồ sơ này?',
      [
        { text: 'Hủy', style: 'cancel' },
        {
          text: 'Xóa',
          style: 'destructive',
          onPress: async () => {
            const result = await deleteMedicalRecord(recordId)
            if (result.success) {
              loadRecords()
            } else {
              Alert.alert('Lỗi', result.error)
            }
          }
        }
      ]
    )
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('vi-VN')
  }

  const getTypeColor = (type?: string) => {
    switch (type) {
      case 'Ngoại trú': return '#4CAF50'
      case 'Nội trú': return '#FF9800'
      case 'Cấp cứu': return '#F44336'
      default: return '#666'
    }
  }

  const renderRecord = ({ item, index }: { item: MedicalRecord; index: number }) => (
    <TouchableOpacity
      style={styles.recordCard}
      onPress={() => navigation.navigate('RecordDetail', { recordId: item.id })}
    >
      <View style={styles.recordHeader}>
        <View style={styles.recordInfo}>
          <Text style={styles.recordCode}>
            Hồ sơ #{index + 1}
          </Text>
          <Text style={styles.recordCodeSecondary}>
          </Text>
          <Text style={styles.recordDate}>{formatDate(item.ngay_kham)}</Text>
        </View>
        <View style={styles.recordActions}>
          {item.loai_kham && (
            <View style={[styles.typeTag, { backgroundColor: getTypeColor(item.loai_kham) }]}>
              <Text style={styles.typeText}>{item.loai_kham}</Text>
            </View>
          )}
          <TouchableOpacity
            style={styles.editButton}
            onPress={() => navigation.navigate('EditRecord', { recordId: item.id })}
          >
            <Ionicons name="create-outline" size={20} color="#2196F3" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={() => handleDeleteRecord(item.id)}
          >
            <Ionicons name="trash-outline" size={20} color="#F44336" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.recordContent}>
        <Text style={styles.diagnosis}>
          {item.chan_doan_ra || item.chan_doan_vao || 'Chưa có chẩn đoán'}
        </Text>
        <Text style={styles.hospital}>
          {item.ten_benh_vien || 'Chưa có thông tin bệnh viện'}
        </Text>
        {item.bac_si_kham && (
          <Text style={styles.doctor}>BS: {item.bac_si_kham}</Text>
        )}
      </View>

      <View style={styles.recordFooter}>
        <View style={styles.fileCount}>
          <Ionicons name="document-attach" size={16} color="#666" />
          <Text style={styles.fileCountText}>
            {item.files?.length || 0} file
          </Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#ccc" />
      </View>
    </TouchableOpacity>
  )

  const filters = [
    { label: 'Tất cả', value: '' },
    { label: 'Ngoại trú', value: 'Ngoại trú' },
    { label: 'Nội trú', value: 'Nội trú' },
    { label: 'Cấp cứu', value: 'Cấp cứu' }
  ]

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Hồ sơ y tế</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => navigation.navigate('CreateRecord')}
        >
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Ionicons name="search" size={20} color="#666" />
          <TextInput
            style={styles.searchInput}
            placeholder="Tìm kiếm theo chẩn đoán, bệnh viện..."
            value={searchText}
            onChangeText={setSearchText}
          />
        </View>
        
        <View style={styles.filterContainer}>
          {filters.map((filter) => (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.filterButton,
                selectedFilter === filter.value && styles.filterButtonActive
              ]}
              onPress={() => setSelectedFilter(filter.value)}
            >
              <Text style={[
                styles.filterText,
                selectedFilter === filter.value && styles.filterTextActive
              ]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Records List */}
      <FlatList
        data={records}
        renderItem={renderRecord}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="document-text-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>Chưa có hồ sơ nào</Text>
            <TouchableOpacity
              style={styles.createFirstButton}
              onPress={() => navigation.navigate('CreateRecord')}
            >
              <Text style={styles.createFirstText}>Tạo hồ sơ đầu tiên</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    paddingTop: 50,
    paddingBottom: 20,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  addButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  searchContainer: {
    backgroundColor: 'white',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    height: 45,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  filterButton: {
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  filterButtonActive: {
    backgroundColor: '#2196F3',
  },
  filterText: {
    fontSize: 14,
    color: '#666',
  },
  filterTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 15,
  },
  recordCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 10,
  },
  recordInfo: {
    flex: 1,
  },
  recordCode: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
  },
  recordCodeSecondary: {
    fontSize: 11,
    color: '#999',
    marginTop: 2,
  },
  recordDate: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  recordActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  typeTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 10,
  },
  typeText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  deleteButton: {
    padding: 5,
  },
  editButton: {
    padding: 5,
    marginRight: 5,
  },
  recordContent: {
    marginBottom: 10,
  },
  diagnosis: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
    marginBottom: 5,
  },
  hospital: {
    fontSize: 14,
    color: '#666',
    marginBottom: 3,
  },
  doctor: {
    fontSize: 14,
    color: '#666',
  },
  recordFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  fileCount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  fileCountText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 5,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 15,
    marginBottom: 20,
  },
  createFirstButton: {
    backgroundColor: '#2196F3',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createFirstText: {
    color: 'white',
    fontWeight: 'bold',
  },
})