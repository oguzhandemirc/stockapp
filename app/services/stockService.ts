import axios from 'axios';
import { API_CONFIG } from '../config/api';

const BASE_URL = API_CONFIG.BASE_URL;

export interface StockData {
  id: number;
  isim: string;
  son: string;
  yuksek: string;
  dusuk: string;
  fark: string;
  hacim: string;
  zaman: string;
}

export const stockService = {
  async getStocks(): Promise<StockData[]> {
    try {
      const response = await axios.get(`${BASE_URL}/Stock`);
      return response.data;
    } catch (error) {
      console.error('Borsa verileri alınamadı:', error);
      throw error;
    }
  }
}; 