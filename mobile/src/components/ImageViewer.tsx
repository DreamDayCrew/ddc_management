import { useState } from 'react';
import {
  Modal,
  View,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  StatusBar,
  ActivityIndicator,
  Text,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

interface ImageViewerProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
  onDelete?: () => void;
  showDeleteButton?: boolean;
}

export default function ImageViewer({
  visible,
  imageUrl,
  onClose,
  onDelete,
  showDeleteButton = true,
}: ImageViewerProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleDelete = () => {
    if (onDelete) {
      onDelete();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.headerButton}
            onPress={onClose}
            data-testid="button-close-image-viewer"
          >
            <Ionicons name="close" size={28} color="#ffffff" />
          </TouchableOpacity>
          
          {showDeleteButton && onDelete && (
            <TouchableOpacity
              style={[styles.headerButton, styles.deleteButton]}
              onPress={handleDelete}
              data-testid="button-delete-image"
            >
              <Ionicons name="trash-outline" size={24} color="#ef4444" />
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.imageContainer}>
          {isLoading && (
            <ActivityIndicator
              size="large"
              color="#ffffff"
              style={styles.loader}
            />
          )}
          
          {hasError ? (
            <View style={styles.errorContainer}>
              <Ionicons name="image-outline" size={64} color="#6b7280" />
              <Text style={styles.errorText}>Failed to load image</Text>
            </View>
          ) : (
            <Image
              source={{ uri: imageUrl }}
              style={styles.image}
              resizeMode="contain"
              onLoadStart={() => {
                setIsLoading(true);
                setHasError(false);
              }}
              onLoadEnd={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setHasError(true);
              }}
            />
          )}
        </View>

        <View style={styles.footer}>
          <Text style={styles.hint}>Tap X to close</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  headerButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
  },
  imageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: screenWidth,
    height: screenHeight * 0.7,
  },
  loader: {
    position: 'absolute',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: '#6b7280',
    fontSize: 16,
    marginTop: 12,
  },
  footer: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  hint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
