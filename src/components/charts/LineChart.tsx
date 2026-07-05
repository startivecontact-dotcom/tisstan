import React, { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '@/constants/theme';

interface Props {
  data: number[];
  labels?: string[];
  height?: number;
  color?: string;
  /** Ligne horizontale d'objectif (dans l'unité des données). */
  goal?: number;
  formatValue?: (v: number) => string;
}

/**
 * Courbe lissée (spline Catmull-Rom → Bézier) avec dégradé sous la courbe,
 * point sur la dernière valeur et ligne d'objectif en pointillés.
 */
export function LineChart({ data, labels, height = 160, color = colors.brand, goal, formatValue }: Props) {
  const [width, setWidth] = useState(0);
  const pad = { top: 16, bottom: labels ? 24 : 10, left: 8, right: 8 };

  const { path, areaPath, points, goalY, min, max } = useMemo(() => {
    if (data.length === 0 || width === 0)
      return { path: '', areaPath: '', points: [] as { x: number; y: number }[], goalY: null as number | null, min: 0, max: 0 };

    const values = [...data];
    let lo = Math.min(...values, goal ?? Infinity);
    let hi = Math.max(...values, goal ?? -Infinity);
    if (hi === lo) { hi += 1; lo -= 1; }
    const range = hi - lo;
    lo -= range * 0.1;
    hi += range * 0.1;

    const w = width - pad.left - pad.right;
    const h = height - pad.top - pad.bottom;
    const x = (i: number) => pad.left + (values.length === 1 ? w / 2 : (i / (values.length - 1)) * w);
    const y = (v: number) => pad.top + h - ((v - lo) / (hi - lo)) * h;

    const pts = values.map((v, i) => ({ x: x(i), y: y(v) }));

    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[Math.max(0, i - 1)];
      const p1 = pts[i];
      const p2 = pts[i + 1];
      const p3 = pts[Math.min(pts.length - 1, i + 2)];
      const c1x = p1.x + (p2.x - p0.x) / 6;
      const c1y = p1.y + (p2.y - p0.y) / 6;
      const c2x = p2.x - (p3.x - p1.x) / 6;
      const c2y = p2.y - (p3.y - p1.y) / 6;
      d += ` C ${c1x} ${c1y}, ${c2x} ${c2y}, ${p2.x} ${p2.y}`;
    }
    const area = `${d} L ${pts[pts.length - 1].x} ${height - pad.bottom} L ${pts[0].x} ${height - pad.bottom} Z`;

    return {
      path: d,
      areaPath: area,
      points: pts,
      goalY: goal != null ? y(goal) : null,
      min: Math.min(...values),
      max: Math.max(...values),
    };
  }, [data, width, height, goal, pad.left, pad.right, pad.top, pad.bottom]);

  const last = points[points.length - 1];
  const fmt = formatValue ?? ((v: number) => String(Math.round(v * 10) / 10));

  return (
    <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && data.length > 0 ? (
        <>
          <Svg width={width} height={height}>
            <Defs>
              <LinearGradient id="area" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={color} stopOpacity={0.28} />
                <Stop offset="1" stopColor={color} stopOpacity={0.01} />
              </LinearGradient>
            </Defs>
            {goalY != null ? (
              <Path d={`M ${pad.left} ${goalY} H ${width - pad.right}`} stroke={colors.mute} strokeWidth={1} strokeDasharray="4 6" />
            ) : null}
            <Path d={areaPath} fill="url(#area)" />
            <Path d={path} stroke={color} strokeWidth={2.5} fill="none" strokeLinecap="round" />
            {last ? (
              <>
                <Circle cx={last.x} cy={last.y} r={7} fill={`${color}44`} />
                <Circle cx={last.x} cy={last.y} r={4} fill={color} />
              </>
            ) : null}
          </Svg>
          <View className="flex-row justify-between px-1">
            {labels?.map((l, i) => (
              <Text key={`${l}-${i}`} className="text-[10px] text-mute">{l}</Text>
            ))}
          </View>
          <View className="mt-1 flex-row justify-between px-1">
            <Text className="text-[10px] text-mute">min {fmt(min)}</Text>
            <Text className="text-[10px] text-mute">max {fmt(max)}</Text>
          </View>
        </>
      ) : (
        <View style={{ height }} className="items-center justify-center">
          <Text className="text-sm text-mute">Pas encore de données</Text>
        </View>
      )}
    </View>
  );
}
