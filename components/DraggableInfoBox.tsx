import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Gesture, GestureDetector, TouchableOpacity } from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';

interface DraggableInfoBoxProps {
  title: string;
  description: string;
  onClose: () => void;
  initialPosition: { x: number; y: number };
}

export default function DraggableInfoBox({
  title,
  description,
  onClose,
  initialPosition,
}: DraggableInfoBoxProps) {
  const left = useSharedValue(initialPosition.x);
  const top = useSharedValue(initialPosition.y);
  const startX = useSharedValue(initialPosition.x);
  const startY = useSharedValue(initialPosition.y);
  const width = useSharedValue(280);
  const height = useSharedValue(180);
  const startWidth = useSharedValue(280);
  const startHeight = useSharedValue(180);

  const dragGesture = Gesture.Pan()
    .onBegin(() => {
      startX.value = left.value;
      startY.value = top.value;
    })
    .onUpdate((event) => {
      left.value = startX.value + event.translationX;
      top.value = startY.value + event.translationY;
    });

  const resizeGesture = Gesture.Pan()
    .onBegin(() => {
      startWidth.value = width.value;
      startHeight.value = height.value;
    })
    .onUpdate((event) => {
      width.value = startWidth.value + event.translationX;
      height.value = startHeight.value + event.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    left: left.value,
    top: top.value,
    width: withSpring(width.value),
    height: withSpring(height.value),
  }));

  return (
    <Animated.View style={[styles.infoBox, animatedStyle]}>
      <BlurView intensity={80} tint="dark" style={styles.blurView}>
        <GestureDetector gesture={dragGesture}>
          <View style={styles.infoBoxHeader}>
            <Text style={styles.infoBoxTitle}>{title}</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButtonContainer}>
              <Ionicons name="close-circle" size={28} color="#E0E0E0" />
            </TouchableOpacity>
          </View>
        </GestureDetector>
        <Text style={styles.infoBoxDescription} numberOfLines={15} ellipsizeMode="tail">
          {description}
        </Text>
        <GestureDetector gesture={resizeGesture}>
          <View style={styles.resizeHandleContainer}>
            <Ionicons name="resize" size={20} color="#E0E0E0" />
          </View>
        </GestureDetector>
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  infoBox: {
    position: 'absolute',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  blurView: {
    flex: 1,
    padding: 20,
  },
  infoBoxHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoBoxTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#E0E0E0',
  },
  infoBoxDescription: {
    fontSize: 16,
    color: '#E0E0E0',
  },
  closeButtonContainer: {
    padding: 5,
  },
  resizeHandleContainer: {
    position: 'absolute',
    bottom: 5,
    right: 5,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});