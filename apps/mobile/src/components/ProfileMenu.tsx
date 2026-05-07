import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetDragIndicator,
  ActionsheetDragIndicatorWrapper,
  ActionsheetItem,
  ActionsheetItemText,
  Box,
  Pressable,
  Text,
} from '@gluestack-ui/themed';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useSessionStore, type AppRole } from '../stores/session-store';

function profileInitial(role: AppRole): string {
  switch (role) {
    case 'OWNER':
      return 'O';
    case 'MANAGER':
      return 'M';
    default:
      return 'S';
  }
}

export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { t: tMenu } = useTranslation('menu');
  const { role, setRole } = useSessionStore();

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel={tMenu('user_menu')}
        w={44}
        h={44}
        borderRadius="$full"
        bg="$bgInset"
        justifyContent="center"
        alignItems="center"
      >
        <Text fontSize="$md" fontWeight="$bold" color="$textPrimary">
          {profileInitial(role)}
        </Text>
      </Pressable>

      <Actionsheet isOpen={open} onClose={() => setOpen(false)}>
        <ActionsheetBackdrop />
        <ActionsheetContent pb="$6">
          <ActionsheetDragIndicatorWrapper>
            <ActionsheetDragIndicator />
          </ActionsheetDragIndicatorWrapper>
          <Box px="$4" py="$2">
            <Text size="xs" color="$textTertiary">
              {role}
            </Text>
          </Box>
          <ActionsheetItem onPress={() => setOpen(false)}>
            <ActionsheetItemText>{tMenu('settings')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => setOpen(false)}>
            <ActionsheetItemText>{tMenu('warehouse')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem onPress={() => setOpen(false)}>
            <ActionsheetItemText>{tMenu('profile')}</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setRole('STAFF' satisfies AppRole);
              setOpen(false);
            }}
          >
            <ActionsheetItemText>Simulate STAFF</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setRole('MANAGER' satisfies AppRole);
              setOpen(false);
            }}
          >
            <ActionsheetItemText>Simulate MANAGER</ActionsheetItemText>
          </ActionsheetItem>
          <ActionsheetItem
            onPress={() => {
              setRole('OWNER' satisfies AppRole);
              setOpen(false);
            }}
          >
            <ActionsheetItemText>Simulate OWNER</ActionsheetItemText>
          </ActionsheetItem>
        </ActionsheetContent>
      </Actionsheet>
    </>
  );
}
