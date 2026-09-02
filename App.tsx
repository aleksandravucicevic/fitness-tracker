import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, useWindowDimensions, View, LogBox } from 'react-native';
import { initDatabase } from './src/db/database';
import { AppNavigator } from './src/navigation/AppNavigator';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import './src/services/i18n';
import { SettingsService } from './src/services/settingsService';
import i18n from './src/services/i18n';
import { StatusBar } from 'expo-status-bar';
import { Colors } from './src/utils/theme';

LogBox.ignoreLogs([
  'expo-notifications: Android Push notifications',
  '`expo-notifications` functionality is not fully supported in Expo Go',
]);

export default function App() {
  const [isDbReady, setIsDbReady] = useState(false);
  const { width, height } = useWindowDimensions();

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
        <StatusBar style="light" backgroundColor={Colors.background} />
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    )
  }

  return (
    <SafeAreaProvider style={{ flex: 1, backgroundColor: Colors.background }}>
      <StatusBar key={`${width}-${height}`} style="light" backgroundColor={Colors.background} translucent={false} />
      <AppNavigator />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
