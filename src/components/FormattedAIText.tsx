/**
 * FormattedAIText - Format AI response with colors and styles
 * Removes markdown * and ** while adding visual styling
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface FormattedAITextProps {
  text: string;
}

export default function FormattedAIText({ text }: FormattedAITextProps) {
  // Split text into sections
  const sections = text.split('\n\n');

  const renderSection = (section: string, index: number) => {
    const lines = section.split('\n');
    
    return (
      <View key={index} style={styles.section}>
        {lines.map((line, lineIndex) => renderLine(line, lineIndex))}
      </View>
    );
  };

  const renderLine = (line: string, index: number) => {
    // Remove ** and * from text
    let cleanLine = line.replace(/\*\*/g, '').replace(/\*/g, '');
    
    // Detect line type and apply styling
    
    // Headers (lines with emoji at start or ALL CAPS)
    if (/^[🔍📊⚠️💡📋🌤️☁️💊✅📅🎯🌾💬🦠⏱️💾🗑️]/.test(cleanLine)) {
      return (
        <Text key={index} style={styles.header}>
          {cleanLine}
        </Text>
      );
    }
    
    // Numbered lists (1., 2., 3.)
    if (/^\s*\d+\./.test(cleanLine)) {
      return (
        <View key={index} style={styles.listItem}>
          <Text style={styles.listNumber}>{cleanLine.match(/^\s*\d+\./)}</Text>
          <Text style={styles.listText}>{cleanLine.replace(/^\s*\d+\.\s*/, '')}</Text>
        </View>
      );
    }
    
    // Sub-items (with leading spaces or emoji bullets)
    if (/^\s{2,}/.test(cleanLine) || /^\s*[•·→◦]/.test(cleanLine)) {
      return (
        <Text key={index} style={styles.subItem}>
          {cleanLine.trim()}
        </Text>
      );
    }
    
    // Important notes (lines with colons)
    if (cleanLine.includes(':') && cleanLine.length < 80) {
      const [label, ...rest] = cleanLine.split(':');
      return (
        <View key={index} style={styles.labelRow}>
          <Text style={styles.label}>{label}:</Text>
          <Text style={styles.value}>{rest.join(':').trim()}</Text>
        </View>
      );
    }
    
    // Regular text
    if (cleanLine.trim()) {
      return (
        <Text key={index} style={styles.regularText}>
          {cleanLine}
        </Text>
      );
    }
    
    return null;
  };

  return (
    <View style={styles.container}>
      {sections.map((section, index) => renderSection(section, index))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: 8,
  },
  section: {
    marginBottom: 12,
  },
  header: {
    fontSize: 16,
    fontWeight: '700',
    color: '#2E7D32',
    marginBottom: 8,
    lineHeight: 24,
  },
  listItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingLeft: 8,
  },
  listNumber: {
    fontSize: 15,
    fontWeight: '700',
    color: '#4CAF50',
    marginRight: 8,
    minWidth: 24,
  },
  listText: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  subItem: {
    fontSize: 14,
    color: '#555',
    marginLeft: 32,
    marginBottom: 4,
    lineHeight: 20,
  },
  labelRow: {
    flexDirection: 'row',
    marginBottom: 6,
    flexWrap: 'wrap',
  },
  label: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1976D2',
    marginRight: 6,
  },
  value: {
    flex: 1,
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
  },
  regularText: {
    fontSize: 15,
    color: '#333',
    lineHeight: 22,
    marginBottom: 4,
  },
});

