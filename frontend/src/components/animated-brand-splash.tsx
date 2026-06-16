import { useEffect, useRef } from "react";
import { Animated, Image, StyleSheet, View } from "react-native";

const splashBackgroundColor = "#F7F1E8";

type AnimatedBrandSplashProps = {
  onFinish: () => void;
};

export function AnimatedBrandSplash({ onFinish }: AnimatedBrandSplashProps) {
  const scale = useRef(new Animated.Value(0.82)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.sequence([
      Animated.parallel([
        Animated.spring(scale, {
          toValue: 1,
          friction: 7,
          tension: 90,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
      ]),
      Animated.delay(280),
      Animated.timing(opacity, {
        toValue: 0,
        duration: 260,
        useNativeDriver: true,
      }),
    ]);

    animation.start(({ finished }) => {
      if (finished) {
        onFinish();
      }
    });

    return () => animation.stop();
  }, [onFinish, opacity, scale]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View style={{ opacity, transform: [{ scale }] }}>
        <Image
          source={require("../../assets/Logo.png")}
          style={styles.logo}
          resizeMode="contain"
          accessibilityLabel="SMB logo"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: splashBackgroundColor,
    zIndex: 999,
  },
  logo: {
    width: 180,
    height: 180,
  },
});
