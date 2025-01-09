import { Drawer } from 'expo-router/drawer';
import { useEffect, useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text, Divider } from 'react-native-paper';
import { TokenService } from '../services/tokenService';
import { 
  DrawerContentScrollView, 
  DrawerItemList,
  DrawerItem,
  DrawerContentComponentProps 
} from '@react-navigation/drawer';
import { router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

interface UserData {
  username: string;
  role: string;
}

interface DrawerIconProps {
  size: number;
  color: string;
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
      drawerContent={(props: DrawerContentComponentProps) => (
        <View style={{ flex: 1 }}>
          <DrawerContentScrollView {...props}>
            {props.state.routes.map((route, index) => {
              if (route.name === 'admin') return null;
              
              return (
                <DrawerItem
                  key={route.key}
                  label={props.descriptors[route.key].options.drawerLabel || route.name}
                  icon={props.descriptors[route.key].options.drawerIcon}
                  focused={props.state.index === index}
                  onPress={() => props.navigation.navigate(route.name)}
                  activeTintColor="#1B4371"
                />
              );
            })}
            
            {userData?.role === 'admin' && (
              <DrawerItem
                label="Yönetici Paneli"
                icon={({ size, color }: DrawerIconProps) => (
                  <MaterialIcons name="admin-panel-settings" size={size} color={color} />
                )}
                onPress={() => props.navigation.navigate('admin')}
                activeTintColor="#1B4371"
              />
            )}
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
          drawerLabel: "Ana Sayfa",
          title: "Ana Sayfa",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="home" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="trade-history"
        options={{
          drawerLabel: "İşlem Geçmişi",
          title: "İşlem Geçmişi",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="history" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="portfolio"
        options={{
          drawerLabel: "Portföyüm",
          title: "Portföyüm",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="account-balance-wallet" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="profile"
        options={{
          drawerLabel: 'Profil',
          title: 'Profil',
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="person" size={size} color={color} />
          ),
        }}
      />
      <Drawer.Screen
        name="mail"
        options={{
          drawerLabel: "E-posta Yönetimi",
          title: "E-posta Yönetimi",
          drawerIcon: ({ size, color }) => (
            <MaterialIcons name="email" size={size} color={color} />
          ),
        }}
      />
      {userData?.role === 'admin' && (
        <Drawer.Screen
          name="admin"
          options={{
            drawerLabel: 'Yönetici Paneli',
            title: 'Yönetici Paneli',
            drawerIcon: ({ size, color }) => (
              <MaterialIcons name="admin-panel-settings" size={size} color={color} />
            ),
          }}
        />
      )}
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