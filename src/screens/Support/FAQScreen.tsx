/**
 * FAQScreen
 * Câu hỏi thường gặp với accordion và navigation links
 */
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  links?: { text: string; route: string }[];
}

export default function FAQScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const faqs: FAQItem[] = [
    {
      id: 'q1',
      question: t('faq.q1'),
      answer: t('faq.a1'),
      links: [{ text: 'Trang chủ', route: '/(tabs)' }],
    },
    {
      id: 'q2',
      question: t('faq.q2'),
      answer: t('faq.a2'),
      links: [{ text: 'Lịch sử nhận diện', route: '/photo-history' }],
    },
    {
      id: 'q3',
      question: t('faq.q3'),
      answer: t('faq.a3'),
      links: [{ text: 'Lịch sử hỏi đáp chuyên gia', route: '/expert-conversations' }],
    },
    {
      id: 'q4',
      question: t('faq.q4'),
      answer: t('faq.a4'),
      links: [{ text: 'Đổi mật khẩu', route: '/change-password' }],
    },
    {
      id: 'q5',
      question: t('faq.q5'),
      answer: t('faq.a5'),
    },
    {
      id: 'q6',
      question: t('faq.q6'),
      answer: t('faq.a6'),
    },
    {
      id: 'q7',
      question: t('faq.q7'),
      answer: t('faq.a7'),
      links: [{ text: 'Bản đồ', route: '/(tabs)/mapFarm' }],
    },
    {
      id: 'q8',
      question: t('faq.q8'),
      answer: t('faq.a8'),
      links: [{ text: 'Trang chủ', route: '/(tabs)' }],
    },
  ];

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleLinkPress = (route: string) => {
    router.push(route as any);
  };

  /**
   * Parse answer text and highlight navigation links
   */
  const renderAnswer = (answer: string, links?: { text: string; route: string }[]) => {
    if (!links || links.length === 0) {
      return <Text style={styles.answerText}>{answer}</Text>;
    }

    // Split answer by link texts
    const parts: JSX.Element[] = [];
    let remainingText = answer;
    let keyIndex = 0;

    links.forEach((link) => {
      const index = remainingText.indexOf(link.text);
      if (index !== -1) {
        // Add text before link
        if (index > 0) {
          parts.push(
            <Text key={`text-${keyIndex++}`} style={styles.answerText}>
              {remainingText.substring(0, index)}
            </Text>
          );
        }

        // Add link
        parts.push(
          <TouchableOpacity
            key={`link-${keyIndex++}`}
            onPress={() => handleLinkPress(link.route)}
            activeOpacity={0.7}
          >
            <Text style={styles.linkText}>{link.text}</Text>
          </TouchableOpacity>
        );

        // Update remaining text
        remainingText = remainingText.substring(index + link.text.length);
      }
    });

    // Add remaining text
    if (remainingText) {
      parts.push(
        <Text key={`text-${keyIndex++}`} style={styles.answerText}>
          {remainingText}
        </Text>
      );
    }

    return <Text style={styles.answerContainer}>{parts}</Text>;
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('faq.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* FAQ List */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {faqs.map((faq, index) => (
          <View key={faq.id}>
            <TouchableOpacity
              style={styles.questionContainer}
              onPress={() => toggleExpand(faq.id)}
              activeOpacity={0.7}
            >
              <View style={styles.questionRow}>
                <View style={styles.questionNumber}>
                  <Text style={styles.questionNumberText}>{index + 1}</Text>
                </View>
                <Text style={styles.questionText}>{faq.question}</Text>
                <Ionicons
                  name={expandedId === faq.id ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color="#4CAF50"
                />
              </View>
            </TouchableOpacity>

            {expandedId === faq.id && (
              <View style={styles.answerContainer}>
                {renderAnswer(faq.answer, faq.links)}
              </View>
            )}

            {index < faqs.length - 1 && <View style={styles.separator} />}
          </View>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#4CAF50',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },

  // Scroll View
  scrollView: {
    flex: 1,
  },

  // Question
  questionContainer: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  questionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  questionNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#4CAF50',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  questionNumberText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff',
  },
  questionText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },

  // Answer
  answerContainer: {
    backgroundColor: '#F9F9F9',
    paddingVertical: 16,
    paddingHorizontal: 16,
    paddingLeft: 56, // Align with question text
  },
  answerText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#666',
  },
  linkText: {
    fontSize: 15,
    lineHeight: 24,
    color: '#4CAF50',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },

  // Separator
  separator: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginHorizontal: 16,
  },
});

