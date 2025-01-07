import { useState, useEffect } from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from "react-native";
import { login, register } from './services/authService';
import { router } from 'expo-router';
import { Button, Text, Provider as PaperProvider, MD3LightTheme } from 'react-native-paper';
import { TokenService } from './services/tokenService';

const theme = {
  ...MD3LightTheme,
  colors: {
    ...MD3LightTheme.colors,
    primary: '#1B4371', // Koyu mavi - güven verici finans rengi
    secondary: '#2E8B57', // Yeşil - para/büyüme rengi
    background: '#F5F7FA',
  },
};

export default function Index() {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);
    
    if (!username || !password) {
      setError('Kullanıcı adı ve şifre zorunludur');
      setLoading(false);
      return;
    }

    try {
      if (isLogin) {
        const response = await login({ username, password });
        
        if (!response || !response.token) {
          throw new Error('Token alınamadı');
        }

        try {
          await TokenService.saveToken(response.token);
          if (response.userData) {
            await TokenService.saveUserData(response.userData);
          }
          router.replace("/(drawer)/home");
        } catch (storageError) {
          console.error('Storage error:', storageError);
          setError('Oturum bilgileri kaydedilemedi');
          return;
        }
      } else {
        if (!email) {
          setError('E-posta adresi zorunludur');
          setLoading(false);
          return;
        }
        
        const response = await register({ username, password, email, role: 'user' });
        setIsLogin(true);
        setError('Kayıt başarılı! Giriş yapabilirsiniz.');
      }
    } catch (error: any) {
      let errorMessage = 'Bir hata oluştu';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      if (error.response?.status === 401) {
        errorMessage = 'Kullanıcı adı veya şifre hatalı';
      } else if (error.response?.status === 404) {
        errorMessage = 'Kullanıcı bulunamadı';
      } else if (error.response?.status === 409) {
        errorMessage = 'Bu kullanıcı adı zaten kullanılıyor';
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PaperProvider theme={theme}>
      <View style={styles.container}>
        <Text style={styles.title}>{isLogin ? 'Giriş Yap' : 'Kayıt Ol'}</Text>
        
        {error && (
          <Text style={[
            styles.errorText, 
            error.includes('başarılı') && styles.successText
          ]}>
            {error}
          </Text>
        )}

        <TextInput
          placeholder="Kullanıcı Adı"
          value={username}
          onChangeText={setUsername}
          style={styles.input}
        />
        <TextInput
          placeholder="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          style={styles.input}
        />

        {!isLogin && (
          <TextInput
            placeholder="E-posta"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            style={styles.input}
          />
        )}

        <Button 
          mode="contained" 
          onPress={handleSubmit} 
          style={styles.button}
          loading={loading}
          disabled={loading}
        >
          {isLogin ? 'Giriş Yap' : 'Kayıt Ol'}
        </Button>

        <TouchableOpacity onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.switchText}>
            {isLogin ? 'Hesabın yok mu? Kayıt ol' : 'Zaten hesabın var mı? Giriş yap'}
          </Text>
        </TouchableOpacity>
      </View>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
    backgroundColor: '#F5F7FA',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
    color: '#1B4371',
  },
  input: {
    marginBottom: 15,
    padding: 15,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E7FF',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  switchText: {
    color: '#1B4371',
    textAlign: 'center',
    marginTop: 20,
  },
  errorText: {
    color: '#DC2626',
    textAlign: 'center',
    marginBottom: 15,
    padding: 10,
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
  },
  successText: {
    color: '#059669',
    backgroundColor: '#D1FAE5',
  }
});
