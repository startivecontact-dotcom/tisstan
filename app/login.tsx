import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, View } from 'react-native';
import { router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { useForm } from 'react-hook-form';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { Avatar } from '@/components/ui/Avatar';
import { Button } from '@/components/ui/Button';
import { FormInput } from '@/components/ui/Input';
import { USERS, USER_IDS } from '@/constants/config';
import { colors } from '@/constants/theme';
import { isFirebaseEnabled } from '@/services/firebase';
import { useAuth } from '@/stores/auth';
import type { UserId } from '@/types/models';

interface LoginForm {
  password: string;
}

export default function LoginScreen() {
  const [selected, setSelected] = useState<UserId | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const login = useAuth((s) => s.login);
  const { control, handleSubmit } = useForm<LoginForm>({ defaultValues: { password: '' } });

  const onSubmit = handleSubmit(async ({ password }) => {
    if (!selected) return;
    setLoading(true);
    setError(null);
    try {
      await login(selected, password);
      router.replace('/(tabs)');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Connexion impossible');
    } finally {
      setLoading(false);
    }
  });

  return (
    <View className="flex-1 bg-bg">
      <LinearGradient
        colors={['#10B98122', 'transparent']}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 320 }}
      />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="flex-1 justify-center px-6"
      >
        <Animated.View entering={FadeInUp.duration(600)}>
          <Text className="text-center text-5xl">⚡</Text>
          <Text className="mt-3 text-center text-4xl font-bold tracking-tight text-ink">TisStan</Text>
          <Text className="mt-2 text-center text-base text-mute">
            Le QG fitness de Stanne & Tissam
          </Text>
        </Animated.View>

        <Animated.View entering={FadeInDown.delay(200).duration(600)} className="mt-12 flex-row justify-center gap-4">
          {USER_IDS.map((id) => {
            const u = USERS[id];
            const active = selected === id;
            return (
              <Pressable
                key={id}
                onPress={() => setSelected(id)}
                className={`w-36 items-center rounded-3xl border p-5 ${active ? 'bg-card' : 'bg-surface'}`}
                style={{ borderColor: active ? u.color : colors.line, borderWidth: active ? 2 : 1 }}
              >
                <Avatar profile={u} size={64} />
                <Text className="mt-3 text-lg font-bold text-ink">{u.name}</Text>
                <Text className="text-xs text-mute">{active ? 'Sélectionné' : 'Appuyer'}</Text>
              </Pressable>
            );
          })}
        </Animated.View>

        {selected ? (
          <Animated.View entering={FadeInDown.duration(400)} className="mt-8">
            <FormInput
              control={control}
              name="password"
              label={isFirebaseEnabled ? 'Mot de passe' : 'Code (mode démo : 4 chiffres au choix)'}
              placeholder="••••"
              secureTextEntry
              keyboardType={isFirebaseEnabled ? 'default' : 'number-pad'}
              rules={{ required: 'Code requis', minLength: { value: 4, message: '4 caractères minimum' } }}
            />
            {error ? <Text className="mb-2 text-sm text-danger">{error}</Text> : null}
            <Button title={`Continuer en tant que ${USERS[selected].name}`} onPress={onSubmit} loading={loading} />
          </Animated.View>
        ) : null}

        <Text className="mt-10 text-center text-xs text-mute">
          {isFirebaseEnabled ? 'Connecté à Firebase' : 'Mode démo — données locales, aucune configuration requise'}
        </Text>
      </KeyboardAvoidingView>
    </View>
  );
}
