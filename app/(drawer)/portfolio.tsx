import { useEffect, useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Platform } from 'react-native';
import { Text, Card, ActivityIndicator, Button, Portal, Dialog } from 'react-native-paper';
import { tradeService } from '../services/tradeService';
import { TokenService } from '../services/tokenService';
import { useFocusEffect } from '@react-navigation/native';
import { MaterialIcons } from '@expo/vector-icons';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { API_CONFIG } from '../config/api';
import Toast from 'react-native-toast-message';
const BASE_URL = API_CONFIG.BASE_URL;

interface Portfolio {
  id: number;
  stockName: string;
  quantity: number;
  purchasePrice: number;
  purchaseDate: string;
}

export default function Portfolio() {
  const [portfolio, setPortfolio] = useState<Portfolio[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalValue, setTotalValue] = useState(0);
  const [exportLoading, setExportLoading] = useState(false);
  const [showExportDialog, setShowExportDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadPortfolio();
    }, [])
  );

  const loadPortfolio = async () => {
    try {
      const userData = await TokenService.getUserData();
      if (userData?.username) {
        const portfolioData = await tradeService.getUserStocks(userData.username);
        setPortfolio(portfolioData);
        
        // Toplam değeri hesapla
        const total = portfolioData.reduce((sum, item) => 
          sum + (item.quantity * item.purchasePrice), 0);
        setTotalValue(total);
      }
    } catch (error) {
      console.error('Portföy yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleExport = async () => {
    try {
      setExportLoading(true);
      const userData = await TokenService.getUserData();
      const token = await TokenService.getToken();
      
      if (!userData?.username || !token) {
        Toast.show({
          type: 'error',
          text1: 'Hata',
          text2: 'Kullanıcı bilgileri bulunamadı',
          position: 'top',
        });
        return;
      }

      console.log('Export URL:', `${BASE_URL}/api/StockExport/export/${userData.username}`);
      console.log('Token:', token);

      const response = await fetch(`${BASE_URL}/api/StockExport/export/${userData.username}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        }
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', response.headers);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Error response:', errorText);
        throw new Error(`Dışa aktarma başarısız oldu: ${response.status} ${errorText}`);
      }

      const contentType = response.headers.get('content-type');
      console.log('Content Type:', contentType);

      const blob = await response.blob();
      console.log('Blob size:', blob.size);
      console.log('Blob type:', blob.type);

      if (Platform.OS === 'web') {
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `portfolio_${userData.username}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
      } else {
        const fileUri = `${FileSystem.documentDirectory}portfolio_${userData.username}.xlsx`;
        const fr = new FileReader();
        fr.onload = async () => {
          if (fr.result) {
            const base64 = fr.result.toString().split(',')[1];
            await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: FileSystem.EncodingType.Base64 });
            
            if (await Sharing.isAvailableAsync()) {
              await Sharing.shareAsync(fileUri, {
                mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                dialogTitle: 'Portföy Raporu',
                UTI: 'com.microsoft.excel.xlsx'
              });
            } else {
              throw new Error('Paylaşım özelliği kullanılamıyor');
            }
          }
        };
        fr.onerror = (error) => {
          console.error('FileReader error:', error);
          throw new Error('Dosya okuma hatası');
        };
        fr.readAsDataURL(blob);
      }

      Toast.show({
        type: 'success',
        text1: 'Başarılı',
        text2: 'Portföy raporu indirildi',
        position: 'top',
      });

    } catch (error: any) {
      console.error('Export error:', error);
      Toast.show({
        type: 'error',
        text1: 'Hata',
        text2: error.message || 'Portföy raporu indirilemedi',
        position: 'top',
      });
    } finally {
      setExportLoading(false);
    }
  };

  const renderPortfolioItem = ({ item }: { item: Portfolio }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.stockName}>{item.stockName}</Text>
          <Text style={styles.quantity}>{item.quantity} adet</Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Alış Fiyatı:</Text>
            <Text style={styles.value}>
              {item.purchasePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Toplam Değer:</Text>
            <Text style={styles.totalValue}>
              {(item.purchasePrice * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Text>
          </View>
        </View>
      </Card.Content>
    </Card>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Portföyüm</Text>
        <Button
          mode="contained"
          onPress={handleExport}
          icon="download"
          loading={exportLoading}
          style={styles.exportButton}
        >
          İndir
        </Button>
      </View>

      <FlatList
        data={portfolio}
        renderItem={renderPortfolioItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadPortfolio} />
        }
        contentContainerStyle={styles.listContent}
      />

      <View style={styles.totalContainer}>
        <Text style={styles.totalLabel}>Toplam Portföy Değeri:</Text>
        <Text style={styles.portfolioTotal}>
          {totalValue.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
        </Text>
      </View>

      <Portal>
        <Dialog visible={showExportDialog} onDismiss={() => setShowExportDialog(false)}>
          <Dialog.Title>Portföy Dışa Aktarma</Dialog.Title>
          <Dialog.Content>
            <Text>Portföyünüzü Excel dosyası olarak indirmek istiyor musunuz?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowExportDialog(false)}>İptal</Button>
            <Button onPress={handleExport} loading={exportLoading}>İndir</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  exportButton: {
    backgroundColor: '#1B4371',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
    paddingBottom: 80,
  },
  card: {
    marginBottom: 12,
    elevation: 3,
    backgroundColor: '#fff',
    borderRadius: 8,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  stockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4371',
    flex: 1,
  },
  quantity: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#059669',
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 6,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  label: {
    color: '#64748B',
    fontSize: 14,
  },
  value: {
    color: '#1E293B',
    fontSize: 14,
    fontWeight: '500',
  },
  totalValue: {
    color: '#1B4371',
    fontSize: 16,
    fontWeight: 'bold',
  },
  totalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1B4371',
    padding: 16,
    elevation: 8,
  },
  totalLabel: {
    color: '#fff',
    fontSize: 14,
    marginBottom: 4,
  },
  portfolioTotal: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
}); 