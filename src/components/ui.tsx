import React, { useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradient, radius, space, type } from '../theme';

export function GradientButton({ label, onPress, loading, disabled }:
  { label: string; onPress: () => void; loading?: boolean; disabled?: boolean }) {
  const off = disabled || loading;
  return (
    <Pressable onPress={onPress} disabled={off} accessibilityRole="button" accessibilityState={{ disabled: !!off }}
      style={{ opacity: off ? 0.6 : 1 }}>
      <LinearGradient colors={[...gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
        {loading ? <ActivityIndicator color="#070B14" /> : <Text style={s.btnText}>{label}</Text>}
      </LinearGradient>
    </Pressable>
  );
}

export function Field({ label, error, secure, ...rest }: TextInputProps & { label: string; error?: string; secure?: boolean }) {
  const [hidden, setHidden] = useState(!!secure);
  const [focus, setFocus] = useState(false);
  return (
    <View style={{ marginBottom: space.md }}>
      <Text style={type.caption}>{label}</Text>
      <View style={[s.field, focus && { borderColor: colors.cyan }, !!error && { borderColor: colors.negative }]}>
        <TextInput {...rest} secureTextEntry={hidden} placeholderTextColor={colors.muted}
          onFocus={() => setFocus(true)} onBlur={() => setFocus(false)} style={s.input} accessibilityLabel={label} />
        {secure && (
          <Pressable onPress={() => setHidden(!hidden)} hitSlop={12} accessibilityLabel={hidden ? 'Show password' : 'Hide password'}>
            <Text style={{ color: colors.cyan }}>{hidden ? 'Show' : 'Hide'}</Text>
          </Pressable>
        )}
      </View>
      {!!error && <Text style={{ color: colors.negative, fontSize: 13, marginTop: 4 }}>{error}</Text>}
    </View>
  );
}

export const Banner = ({ text, tone }: { text: string; tone: 'error' | 'info' }) => (
  <View style={[s.banner, { borderColor: tone === 'error' ? colors.negative : colors.cyan }]}>
    <Text style={{ color: colors.text }}>{text}</Text>
  </View>
);

const s = StyleSheet.create({
  btn: { height: 52, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
  btnText: { color: '#070B14', fontSize: 16, fontWeight: '700' },
  field: { flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card, borderRadius: radius.md,
    borderWidth: 1, borderColor: colors.border, paddingHorizontal: space.md, marginTop: 6, height: 52 },
  input: { flex: 1, color: colors.text, fontSize: 16 },
  banner: { borderWidth: 1, borderRadius: radius.md, padding: space.md, marginBottom: space.md, backgroundColor: colors.card },
});
