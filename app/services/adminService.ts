import axios from 'axios';
import { API_CONFIG } from '../config/api';

const BASE_URL = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN}`;

interface UserDetails {
  username: string;
  balance: number;
  stocks: {
    stockName: string;
    quantity: number;
  }[];
}

interface BalanceUpdate {
  username: string;
  amount: number;
}

export const adminService = {
  async getUsers(): Promise<string[]> {
    try {
      const response = await axios.get(`${BASE_URL}/list-users`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı listesi alınamadı:', error);
      throw error;
    }
  },

  async deleteUser(username: string): Promise<void> {
    try {
      await axios.delete(`${BASE_URL}/delete-user?username=${username}`);
    } catch (error) {
      console.error('Kullanıcı silinemedi:', error);
      throw error;
    }
  },

  async getUserDetails(username: string): Promise<UserDetails> {
    try {
      const response = await axios.get(`${BASE_URL}/user-details?username=${username}`);
      return response.data;
    } catch (error) {
      console.error('Kullanıcı detayları alınamadı:', error);
      throw error;
    }
  },

  async updateUserBalance(data: BalanceUpdate): Promise<void> {
    try {
      await axios.post(`${BASE_URL}/user-balance`, data);
    } catch (error) {
      console.error('Bakiye güncellenemedi:', error);
      throw error;
    }
  }
}; 