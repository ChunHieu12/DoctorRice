/**
 * Simple Language Switcher Component (for Header)
 * Minimal design without background and dropdown icon
 */
import { changeLanguage } from '@/i18n';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const SimpleLanguageSwitcher: React.FC = () => {
  const { i18n } = useTranslation();
  const [visible, setVisible] = useState(false);

  const currentLanguage = i18n.language;

  const languages = [
    { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'en', label: 'English', flag: '🇬🇧' },
  ];

  const currentLang = languages.find(lang => lang.code === currentLanguage) || languages[0];

  const handleSelectLanguage = async (code: string) => {
    try {
      await changeLanguage(code as 'vi' | 'en');
      setVisible(false);
    } catch (error) {
      console.error('Failed to change language:', error);
    }
  };

  return (
    <>
      {/* Language Button - Simple version */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.flag}>{currentLang.flag}</Text>
        <Text style={styles.languageCode}>{currentLang.code.toUpperCase()}</Text>
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setVisible(false)}
        >
          <View style={styles.dropdown}>
            {languages.map((lang) => (
              <TouchableOpacity
                key={lang.code}
                style={[
                  styles.languageItem,
                  currentLanguage === lang.code && styles.languageItemActive,
                ]}
                onPress={() => handleSelectLanguage(lang.code)}
                activeOpacity={0.7}
              >
                <Text style={styles.languageFlag}>{lang.flag}</Text>
                <Text
                  style={[
                    styles.languageLabel,
                    currentLanguage === lang.code && styles.languageLabelActive,
                  ]}
                >
                  {lang.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
  },
  flag: {
    fontSize: 20,
    marginRight: 4,
  },
  languageCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#fff',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
    paddingTop: 100,
    paddingRight: 24,
  },
  dropdown: {
    backgroundColor: '#fff',
    borderRadius: 12,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  languageItemActive: {
    backgroundColor: '#E8F5E9',
  },
  languageFlag: {
    fontSize: 20,
    marginRight: 12,
  },
  languageLabel: {
    flex: 1,
    fontSize: 15,
    color: '#333',
  },
  languageLabelActive: {
    fontWeight: '600',
    color: '#4CAF50',
  },
});

export default SimpleLanguageSwitcher;

