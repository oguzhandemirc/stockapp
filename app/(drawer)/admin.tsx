import { useState, useCallback } from 'react';
import { View, StyleSheet, FlatList, RefreshControl, ScrollView } from 'react-native';
import { Text, Card, ActivityIndicator, Searchbar, Button, Portal, Dialog, TextInput } from 'react-native-paper';
import { adminService } from '../services/adminService';
import { tradeService } from '../services/tradeService';
import { useFocusEffect } from '@react-navigation/native';
import Toast from 'react-native-toast-message';

interface UserData {
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

export default function AdminPanel() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [balanceAmount, setBalanceAmount] = useState('');
  const [selectedUserStocks, setSelectedUserStocks] = useState<UserStock[]>([]);
  const [showPortfolioDialog, setShowPortfolioDialog] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadUsers();
    }, [])
  );

  const loadUsers = async () => {
    try {
      setLoading(true);
      const userList = await adminService.getUsers();
      const userDetailsPromises = userList.map(username => 
        adminService.getUserDetails(username)
      );
      const userDetails = await Promise.all(userDetailsPromises);
      setUsers(userDetails);
    } catch (error) {
      console.error('Kullanıcılar yüklenemedi:', error);
      showToast('error', 'Hata', 'Kullanıcılar yüklenemedi');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await adminService.deleteUser(selectedUser);
      showToast('success', 'Başarılı', 'Kullanıcı silindi');
      loadUsers();
    } catch (error) {
      showToast('error', 'Hata', 'Kullanıcı silinemedi');
    } finally {
      setShowDeleteDialog(false);
      setSelectedUser(null);
    }
  };

  const handleUpdateBalance = async () => {
    if (!selectedUser || !balanceAmount) return;

    try {
      await adminService.updateUserBalance({
        username: selectedUser,
        amount: parseFloat(balanceAmount)
      });
      showToast('success', 'Başarılı', 'Bakiye güncellendi');
      loadUsers();
    } catch (error) {
      showToast('error', 'Hata', 'Bakiye güncellenemedi');
    } finally {
      setShowBalanceDialog(false);
      setSelectedUser(null);
      setBalanceAmount('');
    }
  };

  const handleViewPortfolio = async (username: string) => {
    try {
      const stocks = await tradeService.getUserStocks(username);
      setSelectedUser(username);
      setSelectedUserStocks(stocks);
      setShowPortfolioDialog(true);
    } catch (error) {
      showToast('error', 'Hata', 'Portföy bilgileri alınamadı');
    }
  };

  const showToast = (type: 'success' | 'error', text1: string, text2: string) => {
    Toast.show({
      type,
      text1,
      text2,
      visibilityTime: 3000,
      topOffset: 60,
    });
  };

  const filteredUsers = users.filter(user =>
    user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderUserItem = ({ item }: { item: UserData }) => (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.userHeader}>
          <Text style={styles.username}>{item.username}</Text>
          <Text style={styles.balance}>
            {item.balance.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
          </Text>
        </View>

        <View style={styles.actions}>
          <Button
            mode="contained"
            onPress={() => handleViewPortfolio(item.username)}
            style={[styles.actionButton, styles.portfolioButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Portföy
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedUser(item.username);
              setShowBalanceDialog(true);
            }}
            style={[styles.actionButton, styles.balanceButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Bakiye Ekle
          </Button>
          <Button
            mode="contained"
            onPress={() => {
              setSelectedUser(item.username);
              setShowDeleteDialog(true);
            }}
            style={[styles.actionButton, styles.deleteButton]}
            contentStyle={styles.buttonContent}
            labelStyle={styles.buttonLabel}
          >
            Sil
          </Button>
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
      <Searchbar
        placeholder="Kullanıcı ara..."
        onChangeText={setSearchQuery}
        value={searchQuery}
        style={styles.searchBar}
      />

      <FlatList
        data={filteredUsers}
        renderItem={renderUserItem}
        keyExtractor={(item) => item.username}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={loadUsers} />
        }
        contentContainerStyle={styles.listContent}
      />

      <Portal>
        <Dialog visible={showDeleteDialog} onDismiss={() => setShowDeleteDialog(false)}>
          <Dialog.Title>Kullanıcı Sil</Dialog.Title>
          <Dialog.Content>
            <Text>"{selectedUser}" kullanıcısını silmek istediğinize emin misiniz?</Text>
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowDeleteDialog(false)}>İptal</Button>
            <Button onPress={handleDeleteUser} textColor="#DC2626">Sil</Button>
          </Dialog.Actions>
        </Dialog>

        <Dialog visible={showBalanceDialog} onDismiss={() => setShowBalanceDialog(false)}>
          <Dialog.Title>Bakiye Ekle</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Miktar (₺)"
              value={balanceAmount}
              onChangeText={setBalanceAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.balanceInput}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setShowBalanceDialog(false)}>İptal</Button>
            <Button onPress={handleUpdateBalance}>Ekle</Button>
          </Dialog.Actions>
        </Dialog>
        <Dialog visible={showPortfolioDialog} onDismiss={() => setShowPortfolioDialog(false)}>
          <Dialog.Title>{selectedUser ? selectedUser.charAt(0).toUpperCase() + selectedUser.slice(1) : 'Kullanıcı' } Portföyü</Dialog.Title>
          <Dialog.Content>
            <ScrollView style={styles.dialogScroll} contentContainerStyle={styles.scrollContent}>
              {selectedUserStocks && selectedUserStocks.length > 0 ? (
                <>
                 
                  {selectedUserStocks.map((stock, index) => (
                    <View key={index} style={styles.portfolioItem}>
                      <Text style={styles.portfolioStockName}>{stock.stockName}</Text>
                      <View style={styles.portfolioDetails}>
                        <Text style={styles.portfolioQuantity}>{stock.quantity} adet</Text>
                        <Text style={styles.portfolioPrice}>
                          {stock.purchasePrice.toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                        <Text style={styles.portfolioTotal}>
                          Toplam: {(stock.quantity * stock.purchasePrice).toLocaleString('tr-TR', { minimumFractionDigits: 2 })} ₺
                        </Text>
                      </View>
                    </View>
                  ))}
                </>
              ) : (
                <Text style={styles.noStocksText}>Portföyde hisse bulunmuyor</Text>
              )}
            </ScrollView>
          </Dialog.Content>
       
          <View style={styles.portfolioSummary}>
                    <Text style={styles.portfolioSummaryText}>
                      Toplam Portföy Değeri: {
                        selectedUserStocks.reduce((total, stock) => 
                          total + (stock.quantity * stock.purchasePrice), 0
                        ).toLocaleString('tr-TR', { minimumFractionDigits: 2 })
                      } ₺
                    </Text>
                  </View>
                  <Dialog.Actions>
            <Button onPress={() => setShowPortfolioDialog(false)}>Kapat</Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>

      <Toast />
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
  searchBar: {
    margin: 16,
    elevation: 2,
  },
  listContent: {
    padding: 16,
  },
  card: {
    marginBottom: 12,
    elevation: 3,
  },
  userHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  balance: {
    fontSize: 16,
    fontWeight: '500',
    color: '#059669',
  },
  stocksContainer: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 6,
    marginVertical: 8,
  },
  stocksTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4A5568',
    marginBottom: 4,
  },
  stockItem: {
    fontSize: 14,
    color: '#1E293B',
    marginVertical: 2,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 8,
  },
  actionButton: {
    flex: 1,
  },
  balanceButton: {
    backgroundColor: '#059669',
  },
  deleteButton: {
    backgroundColor: '#DC2626',
  },
  balanceInput: {
    marginTop: 8,
  },
  portfolioButton: {
    backgroundColor: '#1B4371',
  },
  dialogScroll: {
    maxHeight: 400,
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  portfolioItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  portfolioStockName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4371',
    marginBottom: 4,
  },
  portfolioDetails: {
    marginTop: 4,
  },
  portfolioQuantity: {
    fontSize: 14,
    color: '#059669',
    marginBottom: 2,
  },
  portfolioPrice: {
    fontSize: 14,
    color: '#4A5568',
    marginBottom: 2,
  },
  portfolioTotal: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1B4371',
  },
  noStocksText: {
    textAlign: 'center',
    color: '#64748B',
    padding: 16,
  },
  buttonContent: {
    height: 40,
  },
  buttonLabel: {
    fontSize: 14,
    marginHorizontal: 4,
  },
  portfolioSummary: {
    backgroundColor: '#1B4371',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    marginRight: 20,
    marginLeft: 20,
  },
  portfolioSummaryText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
}); 