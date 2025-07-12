import React from 'react';
import { View, StyleSheet, Animated, Text } from 'react-native';

const ProgressBar = ({ progress }) => {
  const animatedWidth = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    Animated.timing(animatedWidth, {
      toValue: progress,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [progress]);

  // Calculate percentage for display
  const percentage = Math.round(progress * 100);

  return (
    <View style={styles.container}>
      <View style={styles.progressTextContainer}>
        <Text style={styles.progressText}>{`${percentage}%`}</Text>
      </View>
      <View style={styles.barContainer}>
        <Animated.View
          style={[
            styles.bar,
            {
              width: animatedWidth.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressTextContainer: {
    alignItems: 'center',
    marginBottom: 5,
  },
  progressText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#667eea',
  },
  barContainer: {
    height: 10,
    backgroundColor: '#f0f0f0',
    borderRadius: 5,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    backgroundColor: '#667eea',
    borderRadius: 5,
  },
});

export default ProgressBar;