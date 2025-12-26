import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  PanResponder,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { Audio } from "expo-av";
import { COLORS, SIZES } from "@/constants/theme";
import * as Haptics from "expo-haptics";

interface VoiceRecorderProps {
  onRecordingComplete: (audioUri: string, duration: number) => void;
  maxDuration?: number; // in seconds
}

export function VoiceRecorder({
  onRecordingComplete,
  maxDuration = 60,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [cancelled, setCancelled] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const waveAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setDuration((prev) => {
          if (prev >= maxDuration) {
            stopRecording();
            return prev;
          }
          return prev + 1;
        });
      }, 1000);

      // Wave animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(waveAnim, {
            toValue: 1.3,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(waveAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isRecording]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        slideAnim.setValue(gestureState.dx);
        if (gestureState.dx < -100) {
          setCancelled(true);
        } else {
          setCancelled(false);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -100) {
          // Cancelled
          cancelRecording();
        } else {
          // Send
          stopRecording();
        }
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
        }).start();
      },
    })
  ).current;

  const startRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
      setDuration(0);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Animated.spring(scaleAnim, {
        toValue: 1.2,
        useNativeDriver: true,
      }).start();
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (uri && !cancelled) {
        onRecordingComplete(uri, duration);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Error stopping recording:", error);
    }

    setRecording(null);
    setDuration(0);
    setCancelled(false);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const cancelRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    try {
      await recording.stopAndUnloadAsync();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } catch (error) {
      console.error("Error cancelling recording:", error);
    }

    setRecording(null);
    setDuration(0);
    setCancelled(false);

    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
    }).start();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  if (isRecording) {
    return (
      <View style={styles.recordingContainer} {...panResponder.panHandlers}>
        <Animated.View
          style={[
            styles.recordingContent,
            { transform: [{ translateX: slideAnim }] },
          ]}
        >
          <View style={styles.cancelHint}>
            <Ionicons name="chevron-back" size={20} color={COLORS.danger} />
            <Text style={styles.cancelText}>Slide to cancel</Text>
          </View>

          <Animated.View
            style={[styles.waveform, { transform: [{ scale: waveAnim }] }]}
          >
            <View style={styles.waveDot} />
          </Animated.View>

          <Text style={styles.durationText}>{formatDuration(duration)}</Text>

          <TouchableOpacity style={styles.stopButton} onPress={stopRecording}>
            <Ionicons name="stop" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </Animated.View>

        {cancelled && (
          <View style={styles.cancelledOverlay}>
            <Ionicons name="close-circle" size={48} color={COLORS.danger} />
            <Text style={styles.cancelledText}>Release to cancel</Text>
          </View>
        )}
      </View>
    );
  }

  return (
    <TouchableOpacity
      style={styles.micButton}
      onPressIn={startRecording}
      activeOpacity={0.8}
    >
      <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
        <Ionicons name="mic" size={24} color={COLORS.primary} />
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  micButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary + "20",
    justifyContent: "center",
    alignItems: "center",
  },
  recordingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: COLORS.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  recordingContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingHorizontal: 20,
  },
  cancelHint: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  cancelText: {
    fontSize: SIZES.sm,
    color: COLORS.textSecondary,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  waveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
  },
  durationText: {
    fontSize: SIZES.lg,
    fontWeight: "600",
    color: COLORS.text,
    minWidth: 60,
    textAlign: "center",
  },
  stopButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: COLORS.danger,
    justifyContent: "center",
    alignItems: "center",
  },
  cancelledOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
  },
  cancelledText: {
    fontSize: SIZES.base,
    fontWeight: "600",
    color: COLORS.white,
  },
});
