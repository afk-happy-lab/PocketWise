import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { supabase, isConfigured } from '../lib/supabase';
import { isEmail, passwordProblems } from '../lib/validation';
import { Banner, Field, GradientButton } from '../components/ui';
import { colors, space, type } from '../theme';

function Shell({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ padding: space.lg, paddingTop: insets.top + space.xl, paddingBottom: insets.bottom + space.lg }}>
        <Text style={type.title}>{title}</Text>
        <Text style={[type.caption, { marginBottom: space.lg, marginTop: 4 }]}>{subtitle}</Text>
        {!isConfigured && <Banner tone="error" text="Supabase is not configured. Copy .env.example to .env and add your project URL and anon key." />}
        {children}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

export function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState(''); const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  const submit = async () => {
    if (busy) return;
    setErr(''); setInfo('');
    if (!isEmail(email)) return setErr('Enter a valid email address.');
    if (!password) return setErr('Enter your password.');
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (error) setErr(error.message); // success is handled by the session listener
  };
  const reset = async () => {
    setErr(''); setInfo('');
    if (!isEmail(email)) return setErr('Enter your email above, then tap Forgot password.');
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim());
    if (error) setErr(error.message); else setInfo('If that account exists, a reset email has been sent.');
  };
  return (
    <Shell title="Welcome back" subtitle="Sign in to continue">
      {!!err && <Banner tone="error" text={err} />}{!!info && <Banner tone="info" text={info} />}
      <Field label="Email" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
      <Field label="Password" value={password} onChangeText={setPassword} secure autoComplete="password" />
      <Pressable onPress={reset} style={{ alignSelf: 'flex-end', marginBottom: space.md }}>
        <Text style={{ color: colors.cyan }}>Forgot password?</Text>
      </Pressable>
      <GradientButton label="Sign in" onPress={submit} loading={busy} />
      <Pressable onPress={() => navigation.navigate('SignUp')} style={{ marginTop: space.lg, alignItems: 'center' }}>
        <Text style={type.caption}>New to PocketWise? <Text style={{ color: colors.cyan }}>Create account</Text></Text>
      </Pressable>
    </Shell>
  );
}

export function SignUpScreen({ navigation }: any) {
  const [f, setF] = useState({ name: '', email: '', pw: '', pw2: '' });
  const [busy, setBusy] = useState(false); const [err, setErr] = useState(''); const [info, setInfo] = useState('');
  const set = (k: keyof typeof f) => (v: string) => setF({ ...f, [k]: v });
  const submit = async () => {
    if (busy) return;
    setErr(''); setInfo('');
    if (f.name.trim().length < 2) return setErr('Enter your full name.');
    if (!isEmail(f.email)) return setErr('Enter a valid email address.');
    const bad = passwordProblems(f.pw);
    if (bad.length) return setErr('Password needs: ' + bad.join(', ').toLowerCase() + '.');
    if (f.pw !== f.pw2) return setErr('Passwords do not match.');
    setBusy(true);
    const { data, error } = await supabase.auth.signUp({
      email: f.email.trim(), password: f.pw, options: { data: { full_name: f.name.trim() } } });
    setBusy(false);
    if (error) return setErr(error.message);
    if (!data.session) setInfo('Account created. Check your email to verify it, then sign in.');
  };
  return (
    <Shell title="Create your account" subtitle="Track, split and plan with friends">
      {!!err && <Banner tone="error" text={err} />}{!!info && <Banner tone="info" text={info} />}
      <Field label="Full name" value={f.name} onChangeText={set('name')} autoComplete="name" />
      <Field label="Email" value={f.email} onChangeText={set('email')} autoCapitalize="none" keyboardType="email-address" />
      <Field label="Password" value={f.pw} onChangeText={set('pw')} secure />
      <Field label="Confirm password" value={f.pw2} onChangeText={set('pw2')} secure />
      <GradientButton label="Create account" onPress={submit} loading={busy} />
      <Pressable onPress={() => navigation.goBack()} style={{ marginTop: space.lg, alignItems: 'center' }}>
        <Text style={type.caption}>Already have an account? <Text style={{ color: colors.cyan }}>Sign in</Text></Text>
      </Pressable>
    </Shell>
  );
}
