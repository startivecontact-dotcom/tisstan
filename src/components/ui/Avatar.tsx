import React from 'react';
import { Image, Text, View } from 'react-native';
import type { UserProfile } from '@/types/models';

interface Props {
  profile: Pick<UserProfile, 'name' | 'emoji' | 'color' | 'photoUrl'>;
  size?: number;
}

export function Avatar({ profile, size = 44 }: Props) {
  if (profile.photoUrl) {
    return (
      <Image
        source={{ uri: profile.photoUrl }}
        style={{ width: size, height: size, borderRadius: size / 2, borderWidth: 2, borderColor: profile.color }}
      />
    );
  }
  return (
    <View
      className="items-center justify-center"
      style={{
        width: size, height: size, borderRadius: size / 2,
        backgroundColor: `${profile.color}22`, borderWidth: 2, borderColor: profile.color,
      }}
    >
      <Text style={{ fontSize: size * 0.5 }}>{profile.emoji}</Text>
    </View>
  );
}
