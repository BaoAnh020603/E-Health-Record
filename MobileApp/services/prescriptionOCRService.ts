/**
 * Prescription OCR Service
 * Tích hợp với Backend API để phân tích đơn thuốc
 */

import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { API_BASE_URL } from '../config';

// API endpoint for prescription analysis
const API_PRESCRIPTION_URL = `${API_BASE_URL}/api/prescription`;

export interface PrescriptionAnalysis {
  summary: {
    totalMedications: number;
    totalAppointments: number;
    totalInstructions: number;
    totalReminders: number;
    dateRange: {
      start: string;
      end: string;
    };
  };
  insights: Insight[];
  warnings: Warning[];
  recommendations: Recommendation[];
  options: {
    viewOptions: ViewOption[];
    exportOptions: ExportOption[];
    actionOptions: ActionOption[];
  };
  validation?: {
    confidence: number;
    warnings: string[];
  };
  // Raw data for creating reminders
  medications?: Medication[];
  appointments?: Appointment[];
  instructions?: string[];
}

export interface Insight {
  type: string;
  level: 'info' | 'warning';
  title: string;
  message: string;
  icon: string;
  details?: any;
}

export interface Warning {
  type: string;
  level: 'warning' | 'info';
  title: string;
  message: string;
  icon: string;
  details?: any;
}

export interface Recommendation {
  type: string;
  priority: 'high' | 'medium' | 'low';
  title: string;
  message: string;
  action: string;
  icon: string;
}

export interface ViewOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  dataSize: 'small' | 'medium' | 'large';
  count?: number;
}

export interface ExportOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  format: string;
}

export interface ActionOption {
  id: string;
  label: string;
  description: string;
  icon: string;
  action: string;
}

export interface Medication {
  name: string;
  dosage: string[];
  quantity: string | null;
  unit: string | null;
  frequency: string | null;
  timing: string[];
  duration: string | null;
  instructions: string[];
}

export interface Appointment {
  type: string;
  date: string | null;
  time: string | null;
  notes: string | null;
}

export interface ReminderResponse {
  medications: Reminder[];
  appointments: Reminder[];
  summary: {
    totalMedications: number;
    totalAppointments: number;
    medicationsWithDefaultSchedule: number;
    medicationsNeedingReview: Array<{
      name: string;
      reason: string;
      defaultSchedule: string;
      suggestion: string;
    }>;
    dateRange: {
      start: string | null;
      end: string | null;
    };
  };
}

export interface Reminder {
  type: 'medication' | 'appointment';
  medicationName?: string;
  appointmentType?: string;
  dosage?: string;
  datetime: string;
  date: string;
  time: string;
  title: string;
  message: string;
  needsManualSetup?: boolean;
  isDefaultSchedule?: boolean;
}

class PrescriptionOCRService {
  /**
   * Pick document (PDF)
   */
  async pickDocument(): Promise<DocumentPicker.DocumentPickerResult> {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: 'application/pdf',
        copyToCacheDirectory: true
      });
      
      return result;
    } catch (error) {
      console.error('Error picking document:', error);
      throw error;
    }
  }

  /**
   * Pick image from camera or gallery
   */
  async pickImage(useCamera: boolean = false): Promise<ImagePicker.ImagePickerResult> {
    try {
      // Request permissions
      if (useCamera) {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Camera permission denied');
        }
      } else {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
          throw new Error('Media library permission denied');
        }
      }

      // Pick image with optimal settings for OCR
      const result = useCamera
        ? await ImagePicker.launchCameraAsync({
            mediaTypes: ['images'],
            quality: 1, // Highest quality
            allowsEditing: false, // Don't crop - keep original for better OCR
            aspect: [4, 3],
            exif: false // Don't need EXIF data
          })
        : await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            quality: 1, // Highest quality
            allowsEditing: false, // Don't crop - keep original for better OCR
            exif: false
          });

      return result;
    } catch (error) {
      console.error('Error picking image:', error);
      throw error;
    }
  }

  /**
   * Analyze prescription (upload and OCR)
   */
  async analyzePrescription(
    fileUri: string,
    fileName: string,
    mimeType: string,
    startDate?: Date
  ): Promise<PrescriptionAnalysis> {
    try {
      const formData = new FormData();
      
      // @ts-ignore - FormData accepts file objects
      formData.append('file', {
        uri: fileUri,
        type: mimeType,
        name: fileName
      });

      if (startDate) {
        formData.append('startDate', startDate.toISOString());
      }

      const response = await fetch(`${API_PRESCRIPTION_URL}/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Accept': 'application/json'
        }
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to analyze prescription');
      }

      return result.data;
    } catch (error) {
      console.error('Error analyzing prescription:', error);
      throw error;
    }
  }

  /**
   * Get data by option ID
   */
  async getDataByOption(optionId: string, fullData: any): Promise<any> {
    try {
      const response = await fetch(`${API_PRESCRIPTION_URL}/get-data`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          optionId,
          data: fullData
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to get data');
      }

      return result.data;
    } catch (error) {
      console.error('Error getting data:', error);
      throw error;
    }
  }

  /**
   * Create reminders
   */
  async createReminders(
    medications: Medication[],
    appointments: Appointment[],
    startDate?: Date
  ): Promise<ReminderResponse> {
    try {
      const response = await fetch(`${API_PRESCRIPTION_URL}/create-reminders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medications,
          appointments,
          startDate: startDate?.toISOString()
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to create reminders');
      }

      return result.reminders;
    } catch (error) {
      console.error('Error creating reminders:', error);
      throw error;
    }
  }

  /**
   * Check duplicates
   */
  async checkDuplicates(
    medications: Medication[],
    appointments: Appointment[]
  ): Promise<any> {
    try {
      const response = await fetch(`${API_PRESCRIPTION_URL}/check-duplicates`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          medications,
          appointments
        })
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to check duplicates');
      }

      return result;
    } catch (error) {
      console.error('Error checking duplicates:', error);
      throw error;
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${API_PRESCRIPTION_URL}/health`);
      const result = await response.json();
      return result.success && result.status === 'running';
    } catch (error) {
      console.error('Health check failed:', error);
      return false;
    }
  }
}

export default new PrescriptionOCRService();
