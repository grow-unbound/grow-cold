import { Box, HStack, Text } from '@gluestack-ui/themed';
import React, { useMemo, useState } from 'react';
import { View } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';

export interface PerformanceSeriesPoint {
  label: string;
  lodged: number;
  delivered: number;
}

interface PerformanceGraphProps {
  series: PerformanceSeriesPoint[];
  lodgedColor: string;
  deliveredColor: string;
  lodgedLegend: string;
  deliveredLegend: string;
  height?: number;
  valueFormatter?: (n: number) => string;
}

export function PerformanceGraph({
  series,
  lodgedColor,
  deliveredColor,
  lodgedLegend,
  deliveredLegend,
  height = 200,
  valueFormatter = (n) => String(Math.round(n)),
}: PerformanceGraphProps) {
  const [w, setW] = useState(320);

  const { maxY, bars } = useMemo(() => {
    let max = 1;
    for (const p of series) {
      max = Math.max(max, p.lodged, p.delivered);
    }
    const pad = 32;
    const chartW = Math.max(0, w - pad * 2);
    const n = Math.max(1, series.length);
    const groupW = chartW / n;
    const barW = Math.min(14, (groupW - 4) / 2);
    const barsInner = series.map((p, i) => {
      const x0 = pad + i * groupW + (groupW / 2 - barW - 2);
      const hLodged = max > 0 ? (p.lodged / max) * (height - 40) : 0;
      const hDel = max > 0 ? (p.delivered / max) * (height - 40) : 0;
      const baseY = height - 24;
      return {
        xL: x0,
        xD: x0 + barW + 4,
        yL: baseY - hLodged,
        yD: baseY - hDel,
        hL: hLodged,
        hD: hDel,
        barW,
        label: p.label,
      };
    });
    return { maxY: max, bars: barsInner };
  }, [series, w, height]);

  if (series.length === 0) {
    return (
      <Box h={height} justifyContent="center" alignItems="center">
        <Text color="$textLight500" size="sm">
          —
        </Text>
      </Box>
    );
  }

  return (
    <View onLayout={(e) => setW(e.nativeEvent.layout.width)}>
      <HStack px="$1" pb="$2" space="md" alignItems="center">
        <HStack space="xs" alignItems="center">
          <Box w={12} h={12} borderRadius={2} style={{ backgroundColor: lodgedColor }} />
          <Text size="xs" color="$textLight500">
            {lodgedLegend}
          </Text>
        </HStack>
        <HStack space="xs" alignItems="center">
          <Box w={12} h={12} borderRadius={2} style={{ backgroundColor: deliveredColor }} />
          <Text size="xs" color="$textLight500">
            {deliveredLegend}
          </Text>
        </HStack>
      </HStack>
      <Svg width={w} height={height}>
        <SvgText x={4} y={14} fontSize={10} fill="#6B7280">
          {valueFormatter(maxY)}
        </SvgText>
        {bars.map((b, i) => (
          <React.Fragment key={`${b.label}-${i}`}>
            <Rect x={b.xL} y={b.yL} width={b.barW} height={b.hL} fill={lodgedColor} rx={2} />
            <Rect x={b.xD} y={b.yD} width={b.barW} height={b.hD} fill={deliveredColor} rx={2} />
            <SvgText x={b.xL + b.barW / 2 - 8} y={height - 6} fontSize={9} fill="#6B7280">
              {b.label}
            </SvgText>
          </React.Fragment>
        ))}
      </Svg>
    </View>
  );
}
