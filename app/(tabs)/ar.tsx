import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { StatusBar } from 'expo-status-bar';
import React, { useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import DraggableInfoBox from '../../components/DraggableInfoBox';
import { landmarkRecognition } from '../utils/api';

const { width, height } = Dimensions.get('window');

export default function ARScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [showInfoBox, setShowInfoBox] = useState(false);
  const [info, setInfo] = useState({ title: '', description: '' });
  const [position, setPosition] = useState({ x: width / 6 , y: height / 3 });
  const [loading, setLoading] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const isFocused = useIsFocused();

  if (!permission) {
    // Camera permissions are still loading
    return <View />;
  }

  if (!permission.granted) {
    // Camera permissions are not granted yet
    return (
      <View style={styles.container}>
        <Text style={{ textAlign: 'center' }}>
          We need your permission to show the camera
        </Text>
        <TouchableOpacity
          onPress={requestPermission}
          style={styles.permissionButton}
        >
          <Text style={styles.permissionButtonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const handleTapToCapture = async () => {
    if (loading) return;

    setLoading(true);

    try {
      const picture = await cameraRef.current?.takePictureAsync({
        quality: 0.5,
        base64: true,
      });

      if (picture && picture.base64) {
        const result = await landmarkRecognition(picture.base64);
        if (result && result.landmark) {
          setInfo({
            title: result.landmark,
            description: result.description,
          });
          setShowInfoBox(true);
        } else {
          Alert.alert(
            'No landmark detected',
            'Could not identify a landmark in the image.'
          );
        }
      }
    } catch (error) {
      console.error('Failed to capture or identify image:', error);
      Alert.alert('Error', 'Failed to process the image.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View style={styles.container}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          onPress={handleTapToCapture}
          activeOpacity={1}
        >
          {isFocused && (
            <CameraView style={styles.camera} ref={cameraRef}>
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#FFF" />
                </View>
              )}
            </CameraView>
          )}
        </TouchableOpacity>

        {showInfoBox && (
          <DraggableInfoBox
            title={info.title}
            description={info.description}
            onClose={() => setShowInfoBox(false)}
            initialPosition={position}
          />
        )}

        <StatusBar style="auto" />
      </View>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  camera: {
    flex: 1,
  },
  permissionButton: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#6366F1',
    borderRadius: 5,
  },
  permissionButtonText: {
    color: 'white',
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
});