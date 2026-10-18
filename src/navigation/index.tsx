import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useAuth } from '../auth/AuthContext';
import { LoginScreen, SignUpScreen } from '../screens/AuthScreens';
import { makePlaceholder } from '../screens/Placeholder';
import { colors } from '../theme';

const Stack = createNativeStackNavigator();
const Tabs = createBottomTabNavigator();
const theme = { ...DarkTheme, colors: { ...DarkTheme.colors, background: colors.bg, card: colors.bg2,
  text: colors.text, border: colors.border, primary: colors.cyan } };

const screens = [
  ['Home', 'Phase 3'], ['Transactions', 'Phase 2'], ['Groups', 'Phase 4'],
  ['Budgets', 'Phase 3'], ['AI', 'Phase 5'],
].map(([n, p]) => ({ name: n, component: makePlaceholder(n, p) }));
const Profile = makePlaceholder('Profile', 'Phase 2', true);

function MainTabs() {
  return (
    <Tabs.Navigator screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.cyan,
      tabBarInactiveTintColor: colors.muted, tabBarStyle: { backgroundColor: colors.bg2, borderTopColor: colors.border },
      tabBarLabelStyle: { fontSize: 11 } }}>
      {screens.map((s) => <Tabs.Screen key={s.name} name={s.name} component={s.component} />)}
      <Tabs.Screen name="Profile" component={Profile} />
    </Tabs.Navigator>
  );
}

export default function Root() {
  const { session, loading } = useAuth();
  if (loading) return <View style={{ flex: 1, backgroundColor: colors.bg, justifyContent: 'center' }}><ActivityIndicator color={colors.cyan} /></View>;
  return (
    <NavigationContainer theme={theme}>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? <Stack.Screen name="Main" component={MainTabs} /> : (<>
          <Stack.Screen name="Login" component={LoginScreen} />
          <Stack.Screen name="SignUp" component={SignUpScreen} />
        </>)}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
