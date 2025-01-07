import axios from 'axios';

const BASE_URL = 'http://192.168.1.23:7203/api';

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

export const tradeService = {
    async buyStock(data: TradeRequest) {
        try {
            const response = await axios.post(`${BASE_URL}/trade/buy`, data);
            return response.data;
        } catch (error) {
            console.error('Satın alma hatası:', error);
            throw error;
        }
    },

    async sellStock(data: TradeRequest) {
        try {
            const response = await axios.post(`${BASE_URL}/trade/sell`, data);
            return response.data;
        } catch (error) {
            console.error('Satış hatası:', error);
            throw error;
        }
    },

    async getUserDetails(username: string): Promise<UserDetails> {
        try {
            const response = await axios.get(`${BASE_URL}/Admin/user-details?username=${username}`);
            return response.data;
        } catch (error) {
            console.error('Kullanıcı detayları alınamadı:', error);
            throw error;
        }
    },

    async getUserStocks(username: string): Promise<UserStock[]> {
        try {
            const response = await axios.get(`${BASE_URL}/UserStocks/kullanicistokkontrol?username=${username}`);
            return response.data;
        } catch (error) {
            console.error('Kullanıcı hisseleri alınamadı:', error);
            throw error;
        }
    },

    async getUserBalance(username: string): Promise<number> {
        try {
            const response = await axios.get<UserBalance>(`${BASE_URL}/Admin/user-details?username=${username}`);
            return response.data.balance;
        } catch (error) {
            console.error('Bakiye bilgisi alınamadı:', error);
            throw error;
        }
    }
}; 