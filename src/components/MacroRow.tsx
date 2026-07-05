import React from 'react';
import { Text, View } from 'react-native';
import { ProgressBar } from '@/components/ui/ProgressBar';
import { colors } from '@/constants/theme';
import type { Goals } from '@/types/models';
import type { MacroTotals } from '@/utils/nutrition';

interface Props {
  totals: MacroTotals;
  goals: Goals;
}

const ROWS = [
  { key: 'proteinG', label: 'Protéines', goalKey: 'proteinG', color: colors.brand, unit: 'g' },
  { key: 'carbsG', label: 'Glucides', goalKey: 'carbsG', color: colors.sky, unit: 'g' },
  { key: 'fatG', label: 'Lipides', goalKey: 'fatG', color: colors.warn, unit: 'g' },
] as const;

/** Les trois barres de macros (protéines / glucides / lipides). */
export function MacroRow({ totals, goals }: Props) {
  return (
    <View className="gap-3">
      {ROWS.map((r) => {
        const value = totals[r.key];
        const goal = goals[r.goalKey];
        return (
          <View key={r.key}>
            <View className="mb-1 flex-row justify-between">
              <Text className="text-xs font-semibold text-mute">{r.label}</Text>
              <Text className="text-xs font-semibold text-ink">
                {Math.round(value)} / {goal} {r.unit}
              </Text>
            </View>
            <ProgressBar value={goal ? value / goal : 0} color={r.color} height={6} />
          </View>
        );
      })}
    </View>
  );
}
