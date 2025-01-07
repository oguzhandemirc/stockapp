import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { Text, Card, ActivityIndicator } from 'react-native-paper';
import { tradeService } from '../services/tradeService';
import { TokenService } from '../services/tokenService';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';

export default function TradeHistory() {
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadTradeHistory();
    }, [])
  );

  const loadTradeHistory = async () => {
    try {
      const userData = await TokenService.getUserData();
      if (userData?.username) {
        const tradeHistory = await tradeService.getTradeHistory(userData.username);
        const sortedHistory = tradeHistory.sort((a, b) => 
          new Date(b.transactionDate).getTime() - new Date(a.transactionDate).getTime()
        );
        setHistory(sortedHistory);
      }
    } catch (error) {
      console.error('İşlem geçmişi yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadTradeHistory();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('tr-TR', {
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderTradeItem = ({ item }: { item: any }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.headerRow}>
          <Text style={styles.stockName}>{item.stockName}</Text>
          <Text style={[
            styles.transactionType,
            { color: item.transactionType === 'BUY' ? '#059669' : '#DC2626' }
          ]}>
            {item.transactionType === 'BUY' ? 'ALIŞ' : 'SATIŞ'}
          </Text>
        </View>

        <View style={styles.detailsContainer}>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Miktar:</Text>
            <Text style={styles.value}>{item.quantity} adet</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Birim Fiyat:</Text>
            <Text style={styles.value}>
              {item.price.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Toplam:</Text>
            <Text style={styles.totalValue}>
              {(item.price * item.quantity).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
            </Text>
          </View>
        </View>

        <Text style={styles.date}>{formatDate(item.transactionDate)}</Text>
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
      <FlatList
        data={history}
        renderItem={renderTradeItem}
        keyExtractor={(item) => item.id.toString()}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    padding: 16,
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
    marginRight: 8,
  },
  transactionType: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  detailsContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 6,
    marginBottom: 8,
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
  date: {
    color: '#94A3B8',
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
}); 