import axios from 'axios';
import { API_CONFIG } from '../config/api';
import { TokenService } from './tokenService';
import * as FileSystem from 'expo-file-system';

const BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN_MANAGEMENT}`;

export interface AttachmentFile {
  uri: string;
  name: string;
  type: string;
}

export interface EmailRequest {
  to: string;
  subject: string;
  body: string;
  attachments?: AttachmentFile[];
}

export const mailService = {
  async triggerEmailReport() {
    try {
      const response = await axios.post(`${BASE_URL}/trigger-email-report`);
      return response.data;
    } catch (error) {
      console.error('E-posta raporu gönderilemedi:', error);
      throw error;
    }
  },

  async sendEmail(data: EmailRequest) {
    try {
      const token = await TokenService.getToken();
      if (!token) {
        throw new Error('Token bulunamadı');
      }

      // FormData oluştur
      const formData = new FormData();
      formData.append('to', data.to);
      formData.append('subject', data.subject);
      formData.append('body', data.body);

      // Dosyaları ekle
      if (data.attachments && data.attachments.length > 0) {
        data.attachments.forEach((file) => {
          // @ts-ignore
          formData.append('attachments', {
            uri: file.uri,
            type: file.type,
            name: file.name,
          } as any);
        });
      } else {
        formData.append('attachments', '');
      }

      const response = await axios.post(
        `${API_CONFIG.BASE_URL}/api/Email/Eposta-gonderme`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
            'Accept': '*/*',
          }
        }
      );
      return response.data;
    } catch (error) {
      console.error('E-posta gönderilemedi:', error);
      throw error;
    }
  }
}; 