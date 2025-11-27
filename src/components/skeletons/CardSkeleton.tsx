import { Skeleton } from 'moti/skeleton';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface CardSkeletonProps {
  width?: number | string;
  height?: number;
}

/**
 * CardSkeleton - Skeleton cho card/photo item
 * Sử dụng cho gallery grid items
 */
export function CardSkeleton({ width = '100%', height = 200 }: CardSkeletonProps) {
  return (
    <View style={[styles.container, { width }]}>
      <Skeleton colorMode="light" width="100%" height={height} radius={12} />
      <View style={styles.footer}>
        <Skeleton colorMode="light" width="60%" height={14} />
        <View style={{ height: 6 }} />
        <Skeleton colorMode="light" width="40%" height={12} />
      </View>
    </View>
  );
}

/**
 * PhotoGridSkeleton - Skeleton cho photo grid
 */
export function PhotoGridSkeleton({ itemCount = 6 }: { itemCount?: number }) {
  return (
    <View style={styles.gridContainer}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <View key={index} style={styles.gridItem}>
          <Skeleton colorMode="light" width="100%" height={120} radius={8} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  footer: {
    padding: 12,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
  },
  gridItem: {
    width: '48%',
    margin: '1%',
  },
});

