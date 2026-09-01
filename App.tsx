import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, View, LogBox } from 'react-native';
import { initDatabase } from './src/db/database';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/services/i18n';
import { SettingsService } from './src/services/settingsService';
import i18n from './src/services/i18n';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);

  useEffect(() => {
    async function setupDb(){
      try{
        const savedLang = await SettingsService.getLanguage();
        await i18n.changeLanguage(savedLang);

        await initDatabase();
        setIsDbReady(true);
      }
      catch(error){
        console.error('Greška pri inicijalizaciji aplikacije:', error);
      }
    }
    setupDb();
  }, []);

  if(!isDbReady){
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#6200ee" />
      </View>
    )
  }

  return (
    <SafeAreaProvider>
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
});
