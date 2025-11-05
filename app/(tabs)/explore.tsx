/**
 * Explore Tab Screen - Deprecated (use account.tsx instead)
 * This tab is no longer used in the new design
 */
import { StyleSheet, Text, View } from 'react-native';

export default function ExploreTab() {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>This tab is deprecated. Use Account tab instead.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  text: {
    fontSize: 16,
    color: '#666',
  },
});

