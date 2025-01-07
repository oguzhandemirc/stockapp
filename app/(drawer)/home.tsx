import { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, Alert, TouchableWithoutFeedback, Keyboard, Platform, Pressable } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { stockService, StockData } from '../services/stockService';
import { tradeService } from '../services/tradeService';
import { TokenService } from '../services/tokenService';
import { MaterialIcons } from '@expo/vector-icons';
import Toast from 'react-native-toast-message';
import Slider from '@react-native-community/slider';

interface UserStock {
  stockName: string;
  quantity: number;
}

export default function Home() {
  const [stocks, setStocks] = useState<StockData[]>([]);
  const [filteredStocks, setFilteredStocks] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [userStocks, setUserStocks] = useState<UserStock[]>([]);
  const [username, setUsername] = useState<string>('');
  const [selectedStock, setSelectedStock] = useState<StockData | null>(null);
  const [quantity, setQuantity] = useState('');
  const [dialogVisible, setDialogVisible] = useState(false);
  const [isBuying, setIsBuying] = useState(true);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [sliderValue, setSliderValue] = useState(1);
  const maxQuantity = 100; // Maksimum alım/satım miktarı

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const userData = await TokenService.getUserData();
      if (userData?.username) {
        setUsername(userData.username);
        await Promise.all([
          loadUserStocks(userData.username),
          loadUserBalance(userData.username)
        ]);
      }
      await loadStocks();
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const loadUserStocks = async (username: string) => {
    try {
      const stocks = await tradeService.getUserStocks(username);
      setUserStocks(stocks);
    } catch (error) {
      console.error('Kullanıcı hisseleri yüklenemedi:', error);
    }
  };

  const loadUserBalance = async (username: string) => {
    try {
      const balance = await tradeService.getUserBalance(username);
      setUserBalance(balance);
    } catch (error) {
      console.error('Bakiye bilgisi yüklenemedi:', error);
    }
  };

  const loadStocks = async () => {
    try {
      const data = await stockService.getStocks();
      setStocks(data);
      setFilteredStocks(data);
    } catch (error) {
      console.error('Hisse senetleri yüklenemedi:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadInitialData();
  };

  const showToast = (type: 'success' | 'error', message1: string, message2: string) => {
    Toast.show({
      type: type,
      text1: message1,
      text2: message2,
      visibilityTime: 3000,
      topOffset: 60,
      props: {
        style: {
          borderLeftColor: type === 'success' ? '#059669' : '#DC2626',
        }
      }
    });
  };

  const handleTrade = async () => {
    if (!selectedStock || !username) return;

    try {
      const tradeData = {
        username,
        stockId: selectedStock.id,
        quantity: Math.floor(sliderValue)
      };

      if (isBuying) {
        await tradeService.buyStock(tradeData);
        showToast(
          'success',
          'İşlem Başarılı!',
          `${tradeData.quantity} adet ${selectedStock.isim} hissesi satın alındı`
        );
      } else {
        await tradeService.sellStock(tradeData);
        showToast(
          'success',
          'İşlem Başarılı!',
          `${tradeData.quantity} adet ${selectedStock.isim} hissesi satıldı`
        );
      }

      await Promise.all([
        loadUserStocks(username),
        loadUserBalance(username)
      ]);
      
      setDialogVisible(false);
      setSliderValue(1);
    } catch (error: any) {
      showToast(
        'error',
        'İşlem Başarısız!',
        error.response?.data?.message || 'Bir hata oluştu'
      );
    }
  };

  const calculateTotal = () => {
    if (!selectedStock) return 0;
    const price = parseFloat(selectedStock.son.replace(',', '.'));
    return price * sliderValue;
  };

  const canSellStock = (stockName: string) => {
    const userStock = userStocks.find(stock => stock.stockName === stockName);
    return userStock && userStock.quantity > 0;
  };

  const renderStockItem = ({ item }: { item: StockData }) => {
    const farkValue = parseFloat(item.fark.replace('%', '').replace(',', '.'));
    const userStock = userStocks.find(stock => stock.stockName === item.isim);
    
    return (
      <Pressable 
        delayLongPress={150}
        onPress={() => {}}
        style={({ pressed }) => [
          styles.pressableCard,
          pressed && styles.pressedCard
        ]}
      >
        <Card style={[styles.card, { elevation: 3 }]}>
          <Card.Content>
            <View style={styles.stockHeader}>
              <View>
                <Text style={styles.symbol}>{item.isim}</Text>
                <Text style={styles.stockId}>#{item.id}</Text>
              </View>
              <Text style={[styles.change, { color: farkValue >= 0 ? '#059669' : '#DC2626' }]}>
                {item.fark}
              </Text>
            </View>
            <Text style={styles.price}>{item.son} ₺</Text>
            <View style={styles.stockFooter}>
              <Text style={styles.volume}>Hacim: {item.hacim}</Text>
              <Text style={styles.time}>{item.zaman}</Text>
            </View>
            {userStock && (
              <Text style={styles.quantity}>Sahip Olduğunuz: {userStock.quantity} adet</Text>
            )}
            <View style={styles.actionButtons}>
              <Button 
                mode="contained" 
                onPress={() => {
                  console.log('Seçilen hisse ID:', item.id);
                  setSelectedStock(item);
                  setIsBuying(true);
                  setDialogVisible(true);
                }}
                style={[styles.actionButton, styles.buyButton]}
              >
                Satın Al
              </Button>
              {canSellStock(item.isim) && (
                <Button 
                  mode="contained"
                  onPress={() => {
                    console.log('Seçilen hisse ID:', item.id);
                    setSelectedStock(item);
                    setIsBuying(false);
                    setDialogVisible(true);
                  }}
                  style={[styles.actionButton, styles.sellButton]}
                >
                  Sat
                </Button>
              )}
            </View>
          </Card.Content>
        </Card>
      </Pressable>
    );
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
      <View style={styles.container}>
        <Searchbar
          placeholder="Hisse senedi ara..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          inputStyle={styles.searchInput}
        />
        <View style={styles.listContainer}>
          <FlatList
            data={filteredStocks}
            renderItem={renderStockItem}
            keyExtractor={(item) => item.id.toString()}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            scrollIndicatorInsets={{ right: 1 }}
            style={styles.flatList}
            showsVerticalScrollIndicator={true}
            scrollEventThrottle={16}
            overScrollMode="always"
            bounces={true}
            alwaysBounceVertical={true}
            directionalLockEnabled={true}
            scrollEnabled={true}
            onScrollBeginDrag={() => Keyboard.dismiss()}
            initialNumToRender={10}
            maxToRenderPerBatch={10}
            windowSize={5}
          />
        </View>
        
        <View style={styles.balanceContainer} pointerEvents="none">
          <Text style={styles.balanceText}>
            Bakiye: {userBalance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </Text>
        </View>

        <Portal>
          <Dialog visible={dialogVisible} onDismiss={() => setDialogVisible(false)}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View>
                <Dialog.Title>
                  {isBuying ? 'Hisse Senedi Satın Al' : 'Hisse Senedi Sat'}
                </Dialog.Title>
                <Dialog.Content>
                  <View style={styles.dialogContent}>
                    <View style={styles.dialogHeader}>
                      <Text style={styles.stockName}>
                        {selectedStock?.isim}
                      </Text>
                      <Text style={styles.stockPrice}>
                        Birim Fiyat: {selectedStock?.son} ₺
                      </Text>
                      <Text style={styles.stockOwned}>
                        {isBuying ? 
                          `Bakiye: ${userBalance.toLocaleString('tr-TR')} ₺` : 
                          `Sahip Olduğunuz: ${userStocks.find(s => s.stockName === selectedStock?.isim)?.quantity || 0} adet`
                        }
                      </Text>
                    </View>
                    
                    <View style={styles.quantityInputContainer}>
                      <Button 
                        mode="outlined" 
                        onPress={() => setSliderValue(Math.max(1, sliderValue - 1))}
                        style={styles.quantityButton}
                        labelStyle={styles.quantityButtonLabel}
                      >
                        -
                      </Button>
                      
                      <TextInput
                        value={String(Math.floor(sliderValue))}
                        onChangeText={(text) => {
                          const num = parseInt(text);
                          if (!isNaN(num)) {
                            const max = isBuying ? maxQuantity : 
                              (userStocks.find(s => s.stockName === selectedStock?.isim)?.quantity || 1);
                            setSliderValue(Math.min(Math.max(1, num), max));
                          }
                        }}
                        keyboardType="numeric"
                        style={styles.quantityTextInput}
                      />
                      
                      <Button 
                        mode="outlined"
                        onPress={() => {
                          const max = isBuying ? maxQuantity : 
                            (userStocks.find(s => s.stockName === selectedStock?.isim)?.quantity || 1);
                          setSliderValue(Math.min(sliderValue + 1, max));
                        }}
                        style={styles.quantityButton}
                        labelStyle={styles.quantityButtonLabel}
                      >
                        +
                      </Button>
                    </View>

                    <Slider
                      style={styles.slider}
                      value={sliderValue}
                      onValueChange={setSliderValue}
                      minimumValue={1}
                      maximumValue={isBuying ? maxQuantity : (userStocks.find(s => s.stockName === selectedStock?.isim)?.quantity || 1)}
                      step={1}
                      minimumTrackTintColor="#1B4371"
                      maximumTrackTintColor="#E0E7FF"
                      thumbTintColor="#1B4371"
                    />

                    <View style={styles.totalContainer}>
                      <Text style={styles.totalAmount}>
                        Toplam: {calculateTotal().toLocaleString('tr-TR', { 
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2 
                        })} ₺
                      </Text>
                    </View>
                  </View>
                </Dialog.Content>
                <Dialog.Actions>
                  <Button onPress={() => {
                    Keyboard.dismiss();
                    setDialogVisible(false);
                    setSliderValue(1);
                  }}>İptal</Button>
                  <Button onPress={() => {
                    Keyboard.dismiss();
                    handleTrade();
                  }}>Onayla</Button>
                </Dialog.Actions>
              </View>
            </TouchableWithoutFeedback>
          </Dialog>
        </Portal>
        
        <Toast />
      </View>
    </TouchableWithoutFeedback>
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
    backgroundColor: '#F5F7FA',
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
  stockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  symbol: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  change: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  price: {
    fontSize: 24,
    color: '#2D3748',
    marginBottom: 8,
  },
  stockFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  volume: {
    fontSize: 14,
    color: '#4A5568',
  },
  time: {
    fontSize: 14,
    color: '#718096',
  },
  searchBar: {
    margin: 16,
    elevation: 2,
    backgroundColor: '#fff',
  },
  searchInput: {
    fontSize: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 5,
  },
  buyButton: {
    backgroundColor: '#059669',
  },
  sellButton: {
    backgroundColor: '#DC2626',
  },
  quantity: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 8,
  },
  dialogText: {
    marginBottom: 16,
  },
  quantityInput: {
    marginBottom: 8,
  },
  stockId: {
    fontSize: 12,
    color: '#94A3B8',
    marginTop: 2,
  },
  balanceContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1B4371',
    padding: 16,
    elevation: 8,
    zIndex: 1,
  },
  balanceText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  dialogContent: {
    paddingVertical: 8,
  },
  dialogHeader: {
    marginBottom: 16,
  },
  stockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4371',
    marginBottom: 4,
  },
  stockPrice: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 4,
  },
  stockOwned: {
    fontSize: 14,
    color: '#4A5568',
  },
  sliderContainer: {
    marginVertical: 16,
  },
  slider: {
    width: '100%',
    height: 32,
    marginVertical: 8,
  },
  quantityLabel: {
    fontSize: 16,
    color: '#2D3748',
    marginBottom: 8,
  },
  totalContainer: {
    alignItems: 'flex-end',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
  },
  totalLabel: {
    fontSize: 16,
    color: '#4A5568',
  },
  totalAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  quantityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  quantityInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  quantityButton: {
    minWidth: 40,
    height: 40,
    borderRadius: 8,
  },
  quantityButtonLabel: {
    fontSize: 24,
    margin: 0,
  },
  quantityTextInput: {
    width: 100,
    height: 40,
    textAlign: 'center',
    backgroundColor: '#F5F7FA',
    borderRadius: 8,
    marginHorizontal: 12,
    fontSize: 16,
  },
  listContainer: {
    flex: 1,
    marginBottom: 60,
  },
  flatList: {
    flex: 1,
    width: '100%',
  },
  pressableCard: {
    marginBottom: 12,
  },
  pressedCard: {
    opacity: 0.9,
  },
}); 