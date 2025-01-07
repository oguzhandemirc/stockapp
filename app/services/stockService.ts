import axios from 'axios';

const BASE_URL = 'http://192.168.1.23:7203';

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