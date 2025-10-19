import React from 'react';
import { StyleSheet, Text, View, TextInput } from 'react-native'; // 1. Import TextInput
import Animated, {
  useAnimatedSensor,
  SensorType,
  useAnimatedStyle,
  useDerivedValue,
  useAnimatedProps, // 2. Import useAnimatedProps
} from 'react-native-reanimated';

// 3. Create an animatable version of TextInput
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

export function SensorTestScreen() {
  const gyroscope = useAnimatedSensor(SensorType.GYROSCOPE, {
    interval: 100,
  });

  // This part is fine
  const animatedStyle = useAnimatedStyle(() => {
    const sensorValue = gyroscope.sensor.value;
    if (!sensorValue || typeof sensorValue.y === 'undefined') {
      return { transform: [{ translateX: 0 }] };
    }
    return { transform: [{ translateX: sensorValue.y * 50 }] };
  });

  // This derived value is also fine
  const sensorText = useDerivedValue(() => {
    const sensorValue = gyroscope.sensor.value;
    if (!sensorValue || typeof sensorValue.x === 'undefined') {
      return 'Gyroscope:\nx: N/A\ny: N/A\nz: N/A';
    }
    const { x, y, z } = sensorValue;
    return `Gyroscope:\nx: ${x.toFixed(3)}\ny: ${y.toFixed(3)}\nz: ${z.toFixed(3)}`;
  });

  // 4. Create animated props to bridge the derived value to the UI
  const animatedProps = useAnimatedProps(() => {
    return {
      text: sensorText.value,
    };
  });

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Reanimated Sensor Test</Text>
      <Text style={styles.text}>
        If the library is working, the numbers below should change when you
        rotate your phone, and the red box should move.
      </Text>
      
      {/* 5. Use the AnimatedTextInput with the animatedProps */}
      <AnimatedTextInput
        style={styles.sensorText}
        animatedProps={animatedProps}
        editable={false} // Make it behave like a Text component
        multiline
      />

      <Animated.View style={[styles.box, animatedStyle]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 20,
  },
  text: {
    color: 'white',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  sensorText: {
    color: 'lime',
    fontSize: 18,
    fontFamily: 'monospace',
    textAlign: 'center',
  },
  box: {
    width: 100,
    height: 100,
    backgroundColor: 'red',
    marginTop: 40,
  },
});