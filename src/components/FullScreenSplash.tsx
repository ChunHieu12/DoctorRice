import { memo } from "react";
import { StyleSheet, View } from "react-native";
import { Image } from "expo-image";

const FullScreenSplash = () => {
  return (
    <View style={styles.container}>
      <Image
        source={require("@/assets/images/onboarding-1.png")}
        style={styles.image}
        contentFit="cover"
        cachePolicy="memory-disk"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default memo(FullScreenSplash);

