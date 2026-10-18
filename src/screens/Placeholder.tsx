import React from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { GradientButton } from '../components/ui';
import { useAuth } from '../auth/AuthContext';
import { colors, space, type } from '../theme';

/** Honest stub: screens for later phases say so instead of showing fake data. */
export const makePlaceholder = (title: string, phase: string, showLogout = false) => () => {
  const insets = useSafeAreaInsets();
  const { session, signOut } = useAuth();
  return (
    <View style={{ flex: 1, backgroundColor: colors.bg, padding: space.lg, paddingTop: insets.top + space.lg }}>
      <Text style={type.title}>{title}</Text>
      <Text style={[type.caption, { marginTop: 8 }]}>Not built yet. Planned for {phase}.</Text>
      {showLogout && (<View style={{ marginTop: space.lg }}>
        <Text style={[type.body, { marginBottom: space.md }]}>{session?.user.email}</Text>
        <GradientButton label="Log out" onPress={signOut} />
      </View>)}
    </View>
  );
};
