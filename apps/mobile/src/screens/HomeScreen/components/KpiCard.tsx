import { Box, Text, VStack } from '@gluestack-ui/themed';

interface KpiCardProps {
  title: string;
  primary: string;
  secondary?: string;
  trend?: string;
  trendPositive?: boolean | null;
}

export function KpiCard({ title, primary, secondary, trend, trendPositive }: KpiCardProps) {
  return (
    <Box
      flex={1}
      minHeight={100}
      p="$4"
      borderRadius={12}
      bg="$bgSurface"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <VStack space="xs">
        <Text size="xs" color="$textTertiary" fontWeight="$medium">
          {title}
        </Text>
        <Text fontSize={20} fontWeight="$bold" color="$textPrimary">
          {primary}
        </Text>
        {secondary ? (
          <Text size="sm" color="$textTertiary">
            {secondary}
          </Text>
        ) : null}
        {trend ? (
          <Text
            size="sm"
            color={
              trendPositive === true
                ? '$inward'
                : trendPositive === false
                  ? '$outward'
                  : '$textTertiary'
            }
          >
            {trend}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
}
