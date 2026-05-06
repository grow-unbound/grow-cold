import {
  Actionsheet,
  ActionsheetBackdrop,
  ActionsheetContent,
  ActionsheetItem,
  ActionsheetItemText,
  Text,
} from '@gluestack-ui/themed';
import { useTranslation } from 'react-i18next';
import { Linking } from 'react-native';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  code: string;
  phone: string;
}

function waUrl(digits: string): string | null {
  const d = digits.replace(/\D/g, '');
  if (d.length === 0) return null;
  const intl = d.length === 10 ? `91${d}` : d;
  return `https://wa.me/${intl}`;
}

export function ContactSheet({ isOpen, onClose, code, phone }: Props) {
  const { t } = useTranslation('pages');
  const url = waUrl(phone);
  return (
    <Actionsheet isOpen={isOpen} onClose={onClose}>
      <ActionsheetBackdrop onPress={onClose} />
      <ActionsheetContent px="$4" pb="$8">
        <Text fontSize={18} fontWeight="$semibold" color="$textLight900" mb="$1">
          {t('parties.contact_title', { code })}
        </Text>
        <Text size="sm" color="$textLight600" mb="$3">
          {phone}
        </Text>
        <ActionsheetItem
          onPress={() => {
            void Linking.openURL(`tel:${phone.replace(/\D/g, '')}`);
            onClose();
          }}
        >
          <ActionsheetItemText fontSize={16} color="#0891B2">
            {t('parties.call')}
          </ActionsheetItemText>
        </ActionsheetItem>
        {url ? (
          <ActionsheetItem
            onPress={() => {
              void Linking.openURL(url);
              onClose();
            }}
          >
            <ActionsheetItemText fontSize={16} color="#0891B2">
              {t('parties.whatsapp')}
            </ActionsheetItemText>
          </ActionsheetItem>
        ) : null}
        <ActionsheetItem onPress={onClose}>
          <ActionsheetItemText fontSize={16} color="#374151">
            {t('parties.cancel')}
          </ActionsheetItemText>
        </ActionsheetItem>
      </ActionsheetContent>
    </Actionsheet>
  );
}
