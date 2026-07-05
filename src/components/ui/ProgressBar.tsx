import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { colors } from '@/constants/theme';

interface Props {
  /** Progression 0..1 (les dépassements sont bornés). */
  value: number;
  color?: string;
  height?: number;
}

export function ProgressBar({ value, color = colors.brand, height = 8 }: Props) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withSpring(Math.min(1, Math.max(0, value)), { damping: 18 });
  }, [value, progress]);

  const style = useAnimatedStyle(() => ({ width: `${progress.value * 100}%` }));

  return (
    <View className="w-full overflow-hidden rounded-full bg-line" style={{ height }}>
      <Animated.View style={[style, { height, borderRadius: 99, backgroundColor: color }]} />
    </View>
  );
}
