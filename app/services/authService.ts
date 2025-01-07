import axios from 'axios';
import { API_CONFIG } from '../config/api';

// Axios örneği (Base URL tanımlandı)
const axiosInstance = axios.create({
    baseURL: `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.AUTH}`,
    timeout: 10000, // 10 saniye timeout süresi
});

// Login API çağrısı
interface LoginRequest {
    username: string;
    password: string;
}

export const login = async (data: LoginRequest) => {
    try {
        const response = await axiosInstance.post('/login', data);
        
        if (!response.data || !response.data.token) {
            throw new Error('Geçersiz sunucu yanıtı');
        }

        // Token'ı parse et
        const token = response.data.token;
        try {
            const tokenParts = token.split('.');
            if (tokenParts.length === 3) {
                const payload = JSON.parse(atob(tokenParts[1]));
                // Token payload'ından kullanıcı bilgilerini al
                const userData = {
                    username: payload.unique_name || data.username, // Eğer unique_name yoksa, giriş yapılan kullanıcı adını kullan
                    role: payload.role || 'user'
                };
                response.data.userData = userData;
                console.log('Parsed user data:', userData);
            }
        } catch (tokenError) {
            console.error('Token parse hatası:', tokenError);
            // Varsayılan kullanıcı verisi - giriş yapılan kullanıcı adını kullan
            response.data.userData = {
                username: data.username,
                role: 'user'
            };
        }
        
        return response.data;
    } catch (error: any) {
        console.error('Login Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};

// Register API çağrısı
interface RegisterRequest {
    username: string;
    password: string;
    role: string;
    email: string;
}

export const register = async (data: RegisterRequest) => {
    try {
        const response = await axiosInstance.post('/register', data);
        
        if (!response.data) {
            throw new Error('Kayıt işlemi başarısız');
        }
        
        return response.data;
    } catch (error: any) {
        console.error('Register Error:', {
            message: error.message,
            response: error.response?.data,
            status: error.response?.status
        });
        throw error;
    }
};
