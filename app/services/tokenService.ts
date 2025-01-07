import AsyncStorage from '@react-native-async-storage/async-storage';

export const TokenService = {
  async saveToken(token: string) {
    try {
      await AsyncStorage.setItem('userToken', token);
    } catch (error) {
      console.error('Token kaydetme hatası:', error);
      throw error;
    }
  },

  async getToken() {
    try {
      return await AsyncStorage.getItem('userToken');
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  },

  async removeToken() {
    try {
      await AsyncStorage.removeItem('userToken');
    } catch (error) {
      console.error('Token silme hatası:', error);
      throw error;
    }
  },

  async saveUserData(userData: any) {
    try {
      const userDataString = JSON.stringify(userData);
      await AsyncStorage.setItem('userData', userDataString);
    } catch (error) {
      console.error('Kullanıcı verisi kaydetme hatası:', error);
      throw error;
    }
  },

  async getUserData() {
    try {
      const data = await AsyncStorage.getItem('userData');
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Kullanıcı verisi alma hatası:', error);
      return null;
    }
  },

  async removeUserData() {
    try {
      await AsyncStorage.removeItem('userData');
    } catch (error) {
      console.error('Kullanıcı verisi silme hatası:', error);
      throw error;
    }
  }
}; 