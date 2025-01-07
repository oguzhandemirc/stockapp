import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { TokenService } from '../services/tokenService';
import { DrawerContentScrollView, DrawerItemList } from '@react-navigation/drawer';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface UserData {
  username: string;
  role: string;
}

export default function DrawerLayout() {
  const [userData, setUserData] = useState<UserData | null>(null);

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    const data = await TokenService.getUserData();
    if (data) {
      setUserData(data);
    }
  };

  const handleLogout = async () => {
    await TokenService.removeToken();
    await TokenService.removeUserData();
    router.replace('/');
  };

  const capitalizeFirstLetter = (str: string) => {
    return str ? str.charAt(0).toUpperCase() + str.slice(1).toLowerCase() : '';
  };

  const getUserRole = (role?: string) => {
    if (!role) return 'Kullanıcı';
    
    const roles: { [key: string]: string } = {
      'admin': 'Yönetici',
      'user': 'Kullanıcı'
    };
    return roles[role.toLowerCase()] || role;
  };

  return (
    <Drawer
      screenOptions={{
        headerStyle: {
          backgroundColor: '#1B4371',
        },
        headerTintColor: '#fff',
        drawerStyle: {
          backgroundColor: '#F5F7FA',
        },
        drawerActiveTintColor: '#1B4371',
        swipeEnabled: true,
        drawerType: 'front'
      }}
      drawerContent={(props) => (
        <View style={{ flex: 1 }}>
          <DrawerContentScrollView {...props}>
            <DrawerItemList {...props} />
          </DrawerContentScrollView>
          
          <View style={styles.bottomSection}>
            <Divider style={styles.divider} />
            
            {userData && (
              <View style={styles.userInfo}>
                <View style={styles.userDetails}>
                  <Text style={styles.userName}>
                    {capitalizeFirstLetter(userData.username)}
                  </Text>
                  <Text style={styles.userRole}>
                    {getUserRole(userData.role)}
                  </Text>
                </View>
              </View>
            )}
            
            <TouchableOpacity 
              style={styles.logoutButton} 
              onPress={handleLogout}
            >
              <MaterialIcons name="logout" size={24} color="#DC2626" />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    >
      <Drawer.Screen
        name="home"
        options={{
          drawerLabel: 'Borsa İstanbul',
          title: 'Borsa İstanbul',
        }}
      />
      {userData?.role === 'admin' && (
        <Drawer.Screen
          name="admin"
          options={{
            drawerLabel: 'Yönetici Paneli',
            title: 'Yönetici Paneli',
          }}
        />
      )}
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profil',
          title: 'Profil',
        }}
      />
    </Drawer>
  );
}

const styles = StyleSheet.create({
  bottomSection: {
    borderTopWidth: 1,
    borderTopColor: '#E0E7FF',
  },
  divider: {
    backgroundColor: '#E0E7FF',
    height: 1,
  },
  userInfo: {
    padding: 16,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1B4371',
  },
  userRole: {
    fontSize: 14,
    color: '#4A5568',
    marginTop: 4,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FEF2F2',
  },
  logoutText: {
    marginLeft: 12,
    color: '#DC2626',
    fontSize: 16,
    fontWeight: '500',
  }
}); 