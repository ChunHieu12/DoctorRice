import { MotiView } from 'moti';
import { Skeleton } from 'moti/skeleton';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface ScreenSkeletonProps {
  showHeader?: boolean;
}

/**
 * ScreenSkeleton - Skeleton cho full screen loading
 * Sử dụng khi đang load data cho toàn màn hình
 */
export function ScreenSkeleton({ showHeader = true }: ScreenSkeletonProps) {
  return (
    <View style={styles.container}>
      {showHeader && (
        <View style={styles.header}>
          <Skeleton colorMode="light" width={100} height={24} />
          <Skeleton colorMode="light" width={40} height={40} radius="round" />
        </View>
      )}

      <View style={styles.content}>
        {/* Hero section skeleton */}
        <View style={styles.heroSection}>
          <Skeleton colorMode="light" width="80%" height={32} />
          <View style={{ height: 12 }} />
          <Skeleton colorMode="light" width="60%" height={20} />
        </View>

        {/* Content blocks */}
        <View style={styles.contentBlocks}>
          {[1, 2, 3].map((i) => (
            <MotiView
              key={i}
              from={{ opacity: 0.3 }}
              animate={{ opacity: 1 }}
              transition={{
                type: 'timing',
                duration: 1000,
                loop: true,
              }}
              style={styles.contentBlock}
            >
              <Skeleton colorMode="light" width="100%" height={120} />
            </MotiView>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  content: {
    padding: 20,
  },
  heroSection: {
    alignItems: 'center',
    marginVertical: 30,
  },
  contentBlocks: {
    marginTop: 20,
  },
  contentBlock: {
    marginBottom: 16,
  },
});

