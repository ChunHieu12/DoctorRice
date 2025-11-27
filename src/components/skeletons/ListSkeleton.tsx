import { Skeleton } from 'moti/skeleton';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { COLORS } from '@/constants/colors';

interface ListSkeletonProps {
  itemCount?: number;
}

/**
 * ListSkeleton - Skeleton cho danh sách items
 * Sử dụng trong FlatList khi đang load data
 */
export function ListSkeleton({ itemCount = 5 }: ListSkeletonProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: itemCount }).map((_, index) => (
        <ListItemSkeleton key={index} />
      ))}
    </View>
  );
}

/**
 * ListItemSkeleton - Skeleton cho một item trong list
 */
export function ListItemSkeleton() {
  return (
    <View style={styles.itemContainer}>
      <Skeleton colorMode="light" width={60} height={60} radius={8} />
      <View style={styles.itemContent}>
        <Skeleton colorMode="light" width="70%" height={16} />
        <View style={{ height: 8 }} />
        <Skeleton colorMode="light" width="50%" height={14} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  itemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  itemContent: {
    flex: 1,
    marginLeft: 12,
  },
});

