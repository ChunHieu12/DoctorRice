/**
 * Language Switcher Component
 * Dropdown to switch between Vietnamese and English
 */
import { changeLanguage } from '@/i18n';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const LanguageSwitcher: React.FC = () => {
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
      {/* Language Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => setVisible(true)}
        activeOpacity={0.8}
      >
        <Text style={styles.flag}>{currentLang.flag}</Text>
        <Text style={styles.languageCode}>{currentLang.code.toUpperCase()}</Text>
        <Ionicons name="chevron-down" size={16} color="#4CAF50" />
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
                {currentLanguage === lang.code && (
                  <Ionicons name="checkmark" size={20} color="#4CAF50" />
                )}
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
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#4CAF50',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flag: {
    fontSize: 18,
    marginRight: 6,
  },
  languageCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4CAF50',
    marginRight: 4,
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
    backgroundColor: '#F5F5F5',
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

export default LanguageSwitcher;

