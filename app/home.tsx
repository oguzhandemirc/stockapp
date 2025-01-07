import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { Drawer } from 'expo-router/drawer';

export default function Home() {
  return (
    <View style={styles.container}>
      <Text variant="headlineMedium" style={styles.welcome}>
        Hoş Geldiniz!
      </Text>
      <Text variant="bodyLarge" style={styles.subtitle}>
        Finans uygulamanıza erişim sağladınız.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    padding: 20,
  },
  welcome: {
    color: '#1B4371',
    marginBottom: 10,
  },
  subtitle: {
    color: '#4A5568',
    textAlign: 'center',
  },
}); 