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
      bg="$backgroundLight0"
      style={{
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.06,
        shadowRadius: 3,
        elevation: 2,
      }}
    >
      <VStack space="xs">
        <Text size="xs" color="$textLight500" fontWeight="$medium">
          {title}
        </Text>
        <Text fontSize={20} fontWeight="$bold" color="$textLight900">
          {primary}
        </Text>
        {secondary ? (
          <Text size="sm" color="$textLight500">
            {secondary}
          </Text>
        ) : null}
        {trend ? (
          <Text
            size="sm"
            color={
              trendPositive === true
                ? '$dashboardMoney'
                : trendPositive === false
                  ? '$dashboardDanger'
                  : '$textLight500'
            }
          >
            {trend}
          </Text>
        ) : null}
      </VStack>
    </Box>
  );
}
