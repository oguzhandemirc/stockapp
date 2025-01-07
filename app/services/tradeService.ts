import axios from 'axios';
import { API_CONFIG } from '../config/api';

const BASE_URL = API_CONFIG.BASE_URL;

interface TradeRequest {
    username: string;
    stockId: number;
    quantity: number;
}

interface UserDetails {
    username: string;
    balance: number;
    stocks: {
        stockName: string;
        quantity: number;
    }[];
}

interface UserStock {
    id: number;
    stockName: string;
    quantity: number;
    purchasePrice: number;
    purchaseDate: string;
}

interface UserBalance {
    username: string;
    balance: number;
    stocks: any[];
}

interface TradeHistory {
    id: number;
    username: string;
    stockName: string;
    quantity: number;
    price: number;
    transactionType: 'BUY' | 'SELL';
    transactionDate: string;
}

export const tradeService = {
    async buyStock(data: TradeRequest) {
        try {
            const response = await axios.post(`${BASE_URL}${API_CONFIG.ENDPOINTS.TRADE}/buy`, data);
            return response.data;
        } catch (error) {
            console.error('Satın alma hatası:', error);
            throw error;
        }
    },

    async sellStock(data: TradeRequest) {
        try {
            const response = await axios.post(`${BASE_URL}${API_CONFIG.ENDPOINTS.TRADE}/sell`, data);
            return response.data;
        } catch (error) {
            console.error('Satış hatası:', error);
            throw error;
        }
    },

    async getUserDetails(username: string): Promise<UserDetails> {
        try {
            const response = await axios.get(`${BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN}/user-details?username=${username}`);
            return response.data;
        } catch (error) {
            console.error('Kullanıcı detayları alınamadı:', error);
            throw error;
        }
    },

    async getUserStocks(username: string): Promise<UserStock[]> {
        try {
            const response = await axios.get(`${BASE_URL}${API_CONFIG.ENDPOINTS.USER_STOCKS}/kullanicistokkontrol?username=${username}`);
            return response.data;
        } catch (error) {
            console.error('Kullanıcı hisseleri alınamadı:', error);
            throw error;
        }
    },

    async getUserBalance(username: string): Promise<number> {
        try {
            const response = await axios.get<UserBalance>(`${BASE_URL}${API_CONFIG.ENDPOINTS.ADMIN}/user-details?username=${username}`);
            return response.data.balance;
        } catch (error) {
            console.error('Bakiye bilgisi alınamadı:', error);
            throw error;
        }
    },

    getTradeHistory: async (username: string): Promise<TradeHistory[]> => {
        try {
            const response = await axios.get(`${BASE_URL}${API_CONFIG.ENDPOINTS.TRADE_SEARCH}/byusername?username=${username}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    exportPortfolio: async (username: string): Promise<void> => {
        try {
            const response = await axios.get(
                `${BASE_URL}${API_CONFIG.ENDPOINTS.STOCK_EXPORT}/export/${username}`,
                { responseType: 'blob' }
            );
            
            // Dosyayı indirme işlemi için gerekli kodlar mobil için farklı olacak
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `portfolio_${username}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            console.error('Portfolio export error:', error);
            throw error;
        }
    }
}; 