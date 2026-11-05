import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, createNavigationContainerRef } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import {
  Home,
  PlusCircle,
  MapPin,
  ClipboardList,
  Shield,
  Settings,
} from 'lucide-react-native';

import { initI18n } from '@/i18n';
import { isOnboardingCompleted } from '@/storage';
import { notificationService } from '@/features/notifications/notificationService';
import { Colors, TouchTarget } from '@/theme';

// Screens
import { OnboardingScreen } from '@/screens/OnboardingScreen';
import { HomeScreen } from '@/screens/HomeScreen';
import { ReportFormScreen } from '@/screens/ReportFormScreen';
import { MyReportsScreen } from '@/screens/MyReportsScreen';
import { ReportDetailScreen } from '@/screens/ReportDetailScreen';
import { NearbyMapScreen } from '@/screens/NearbyMapScreen';
import { SafetyInfoScreen } from '@/screens/SafetyInfoScreen';
import { SettingsScreen } from '@/screens/SettingsScreen';

export const navigationRef = createNavigationContainerRef();

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function MainTabs({ navigation }: { navigation: any }) {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: {
          backgroundColor: '#ffffff',
        },
        headerTitleStyle: {
          fontWeight: '800',
          fontSize: 18,
          color: '#0f172a',
        },
        tabBarStyle: {
          backgroundColor: '#ffffff',
          borderTopColor: '#e2e8f0',
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: '#64748b',
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
        },
        tabBarItemStyle: {
          minHeight: TouchTarget.minHeight,
        },
        headerRight: () => (
          <Settings
            size={22}
            color="#475569"
            style={{ marginRight: 16 }}
            onPress={() => navigation.navigate('Settings')}
          />
        ),
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: t('nav.home'),
          tabBarIcon: ({ color, size }) => <Home size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="ReportTab"
        component={ReportFormScreen}
        options={{
          title: t('nav.report'),
          tabBarIcon: ({ color, size }) => <PlusCircle size={size + 2} color="#dc2626" />,
          tabBarActiveTintColor: '#dc2626',
        }}
      />
      <Tab.Screen
        name="MapTab"
        component={NearbyMapScreen}
        options={{
          title: t('nav.map'),
          tabBarIcon: ({ color, size }) => <MapPin size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="MyReportsTab"
        component={MyReportsScreen}
        options={{
          title: t('nav.myReports'),
          tabBarIcon: ({ color, size }) => <ClipboardList size={size} color={color} />,
        }}
      />
      <Tab.Screen
        name="SafetyTab"
        component={SafetyInfoScreen}
        options={{
          title: t('nav.safety'),
          tabBarIcon: ({ color, size }) => <Shield size={size} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isReady, setIsReady] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);

  useEffect(() => {
    async function prepare() {
      try {
        await initI18n();
        const onboardingDone = await isOnboardingCompleted();
        setShowOnboarding(!onboardingDone);

        // Setup Push Notifications
        notificationService.setupListeners();
        notificationService.setNavigationHandler((screen, params) => {
          if (navigationRef.isReady()) {
            (navigationRef as any).navigate(screen, params);
          }
        });
        await notificationService.registerForPushNotifications();
      } catch (e) {
        console.warn('App initialization error:', e);
      } finally {
        setIsReady(true);
      }
    }
    prepare();

    return () => {
      notificationService.cleanup();
    };
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splashContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style="dark" />
      <NavigationContainer ref={navigationRef}>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          {showOnboarding ? (
            <Stack.Screen name="Onboarding">
              {(props) => (
                <OnboardingScreen
                  {...props}
                  onComplete={() => setShowOnboarding(false)}
                />
              )}
            </Stack.Screen>
          ) : null}
          <Stack.Screen name="Main" component={MainTabs} />
          <Stack.Screen
            name="ReportForm"
            component={ReportFormScreen}
            options={{ presentation: 'modal' }}
          />
          <Stack.Screen
            name="ReportDetail"
            component={ReportDetailScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="NearbyMap"
            component={NearbyMapScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="MyReports"
            component={MyReportsScreen}
            options={{ presentation: 'card' }}
          />
          <Stack.Screen
            name="Settings"
            options={{ presentation: 'card', headerShown: true }}
          >
            {(props) => (
              <SettingsScreen
                {...props}
                onResetApp={() => setShowOnboarding(true)}
              />
            )}
          </Stack.Screen>
        </Stack.Navigator>
      </NavigationContainer>
    </>
  );
}

const styles = StyleSheet.create({
  splashContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
});

