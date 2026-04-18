/** Base namespaces for placeholder UIs — web defaults to `en`; `te` for regional UX. */
export const resources = {
  te: {
    nav: {
      home: 'హోమ్',
      inventory: 'ఇన్వెంటరీ',
      parties: 'పార్టీలు',
      receipts: 'రసీదులు',
      payments: 'చెల్లింపులు',
    },
    menu: {
      settings: 'సెట్టింగులు',
      warehouse: 'గోడౌన్ మార్చు',
      profile: 'ప్రొఫైల్',
      sign_in: 'సైన్ ఇన్',
    },
    login: {
      title: 'సైన్ ఇన్',
      subtitle: 'మీ ఫోన్ నంబర్‌తో OTP పంపండి.',
      phone_label: 'ఫోన్ (E.164)',
      phone_placeholder: '+919876543210',
      send_otp: 'OTP పంపు',
      otp_label: 'SMS OTP',
      verify: 'ధృవీకరించు',
      back: 'వెనుకకు',
      otp_sent: 'OTP పంపబడింది. SMS చూడండి.',
      signed_in: 'సెషన్ సృష్టించబడింది. ఇక్కడ నుంచి కొనసాగించండి.',
      config_error: 'సర్వర్ కాన్ఫిగరేషన్ లేదు. .env.local తనిఖీ చేయండి.',
      back_home: 'హోమ్‌కు వెళ్లు',
    },
    common: {
      app_name: 'GrowCold',
    },
  },
  en: {
    nav: {
      home: 'Home',
      inventory: 'Inventory',
      parties: 'Parties',
      receipts: 'Receipts',
      payments: 'Payments',
    },
    menu: {
      settings: 'Settings',
      warehouse: 'Switch warehouse',
      profile: 'Profile',
      sign_in: 'Sign in',
    },
    login: {
      title: 'Sign in',
      subtitle: 'Use your phone number. We will send a one-time code (SMS).',
      phone_label: 'Phone (E.164)',
      phone_placeholder: '+919876543210',
      send_otp: 'Send code',
      otp_label: 'SMS code',
      verify: 'Verify',
      back: 'Back',
      otp_sent: 'Code sent. Check your SMS.',
      signed_in: 'Session created. Continue from the home tab.',
      config_error: 'Missing Supabase env. Copy apps/web/.env.example to .env.local.',
      back_home: 'Back to home',
    },
    common: {
      app_name: 'GrowCold',
    },
  },
} as const;
