/**
 * Generic filter chip row — shared across Stock, Parties, and Money tabs.
 * Active chip: brand-ui solid fill + white text.
 * Inactive chip: white background + border-default + text-tertiary.
 * Scrolls horizontally if chips overflow (no wrapping).
 */
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors as t } from '@growcold/tokens';

export interface FilterChipOption<T extends string> {
  id: T;
  label: string;
}

interface Props<T extends string> {
  options: FilterChipOption<T>[];
  value: T;
  onChange: (value: T) => void;
  /** Optional accessible label for the chip group */
  accessibilityLabel?: string;
}

export function FilterChipRow<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
}: Props<T>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      contentContainerStyle={styles.row}
    >
      {options.map((opt) => {
        const active = value === opt.id;
        return (
          <Pressable
            key={opt.id}
            onPress={() => onChange(opt.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={opt.label}
            style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
          >
            <Text style={[styles.label, active ? styles.labelActive : styles.labelInactive]}>
              {opt.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 16,
    paddingBottom: 4,
  },
  chip: {
    borderRadius: 9999,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chipActive: {
    backgroundColor: t.brandUi,
    borderColor: t.brandUi,
  },
  chipInactive: {
    backgroundColor: t.bgSurface,
    borderColor: t.borderDefault,
  },
  label: {
    fontSize: 13,
    fontFamily: 'NotoSans_600SemiBold',
    letterSpacing: 0,
  },
  labelActive: {
    color: '#FFFFFF',
  },
  labelInactive: {
    color: t.textTertiary,
  },
});
