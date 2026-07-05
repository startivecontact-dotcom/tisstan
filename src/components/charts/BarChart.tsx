import React, { useEffect } from 'react';
import { Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/theme';

interface Props {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  /** Valeur d'objectif : les barres qui l'atteignent sont accentuées. */
  goal?: number;
}

function Bar({ value, max, height, color, delay, reached }: { value: number; max: number; height: number; color: string; delay: number; reached: boolean }) {
  const scale = useSharedValue(0);
  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 16 }));
  }, [delay, scale]);
  const style = useAnimatedStyle(() => ({
    height: Math.max(4, (value / max) * height) * scale.value,
  }));
  return (
    <Animated.View
      style={[style, { backgroundColor: reached ? color : `${color}55`, borderRadius: 6, width: '100%' }]}
    />
  );
}

/** Barres animées (7 jours typiquement), avec labels et ligne d'objectif implicite. */
export function BarChart({ data, labels, height = 120, color = colors.sky, goal }: Props) {
  const max = Math.max(...data, goal ?? 0, 1);
  return (
    <View>
      <View className="flex-row items-end justify-between" style={{ height }}>
        {data.map((v, i) => (
          <View key={i} className="mx-0.5 flex-1 items-center justify-end" style={{ height }}>
            <Bar value={v} max={max} height={height} color={color} delay={i * 60} reached={goal == null || v >= goal} />
          </View>
        ))}
      </View>
      {labels ? (
        <View className="mt-1.5 flex-row justify-between">
          {labels.map((l, i) => (
            <Text key={`${l}-${i}`} className="flex-1 text-center text-[10px] text-mute">{l}</Text>
          ))}
        </View>
      ) : null}
    </View>
  );
}
