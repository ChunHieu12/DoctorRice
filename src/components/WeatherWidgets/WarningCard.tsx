/**
 * Warning Card
 * Hiển thị cảnh báo nông nghiệp
 */

import React from 'react';
import { useTranslation } from 'react-i18next';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import type { WeatherWarning } from '@/types/weather.types';

interface WarningCardProps {
  warning: WeatherWarning;
  onPress?: () => void;
}

export const WarningCard: React.FC<WarningCardProps> = ({ warning, onPress }) => {
  const { t } = useTranslation();

  const getBackgroundColor = () => {
    switch (warning.level) {
      case 'critical':
        return '#FFEBEE';
      case 'high':
        return '#FFF3E0';
      case 'medium':
        return '#FFF9C4';
      case 'low':
        return '#E8F5E9';
      default:
        return '#F5F5F5';
    }
  };

  const getBorderColor = () => {
    switch (warning.level) {
      case 'critical':
        return '#D32F2F';
      case 'high':
        return '#F57C00';
      case 'medium':
        return '#FBC02D';
      case 'low':
        return '#4CAF50';
      default:
        return '#999';
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.container,
        {
          backgroundColor: getBackgroundColor(),
          borderLeftColor: getBorderColor(),
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {/* Icon & Title */}
      <View style={styles.header}>
        <Text style={styles.icon}>{warning.icon}</Text>
        <Text style={[styles.title, { color: warning.color }]}>
          {warning.title}
        </Text>
      </View>

      {/* Description */}
      <Text style={styles.description}>{warning.description}</Text>

      {/* Recommendation */}
      <View style={styles.recommendationBox}>
        <Text style={styles.recommendationLabel}>
          💡 {t('weather.recommendation')}:
        </Text>
        <Text style={styles.recommendationText}>{warning.recommendation}</Text>
      </View>

      {/* Diseases (if any) */}
      {warning.diseases && warning.diseases.length > 0 && (
        <View style={styles.diseasesBox}>
          <Text style={styles.diseasesLabel}>{t('weather.relatedDiseases')}:</Text>
          <View style={styles.diseasesList}>
            {warning.diseases.map((disease, index) => (
              <View key={index} style={styles.diseaseTag}>
                <Text style={styles.diseaseText}>{disease}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Tap hint */}
      {onPress && (
        <Text style={styles.tapHint}>{t('weather.tapForMoreInfo')}</Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  icon: {
    fontSize: 24,
    marginRight: 8,
  },
  title: {
    flex: 1,
    fontSize: 16,
    fontWeight: 'bold',
  },
  description: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 12,
  },
  recommendationBox: {
    backgroundColor: 'rgba(76, 175, 80, 0.1)',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  recommendationLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#2E7D32',
    marginBottom: 4,
  },
  recommendationText: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
  },
  diseasesBox: {
    marginTop: 8,
  },
  diseasesLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 6,
  },
  diseasesList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  diseaseTag: {
    backgroundColor: 'rgba(255, 152, 0, 0.2)',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  diseaseText: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '500',
  },
  tapHint: {
    fontSize: 11,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
  },
});

