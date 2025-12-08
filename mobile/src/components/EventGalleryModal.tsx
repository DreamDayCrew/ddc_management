import { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  ActivityIndicator,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts';
import ImageViewer from './ImageViewer';
import type { Requirement } from '../types';

const { width: screenWidth } = Dimensions.get('window');
const COLUMN_COUNT = 3;
const GRID_SPACING = 4;
const IMAGE_SIZE = (screenWidth - 32 - (COLUMN_COUNT - 1) * GRID_SPACING) / COLUMN_COUNT;

interface ImageItem {
  url: string;
  requirementName: string;
  requirementId: string;
}

interface EventGalleryModalProps {
  visible: boolean;
  onClose: () => void;
  requirements: Requirement[];
  eventName?: string;
}

export default function EventGalleryModal({
  visible,
  onClose,
  requirements,
  eventName,
}: EventGalleryModalProps) {
  const { colors, isDark } = useTheme();
  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const [loadingImages, setLoadingImages] = useState<Set<string>>(new Set());
  const [errorImages, setErrorImages] = useState<Set<string>>(new Set());

  const allImages: ImageItem[] = requirements
    .filter(req => req.images && req.images.length > 0)
    .flatMap(req =>
      (req.images || []).map(url => ({
        url,
        requirementName: req.requirement,
        requirementId: req.id,
      }))
    );

  const totalImages = allImages.length;

  const handleImageLoadStart = (url: string) => {
    setLoadingImages(prev => new Set(prev).add(url));
    setErrorImages(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleImageLoadEnd = (url: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
  };

  const handleImageError = (url: string) => {
    setLoadingImages(prev => {
      const next = new Set(prev);
      next.delete(url);
      return next;
    });
    setErrorImages(prev => new Set(prev).add(url));
  };

  const handlePreviousImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex > 0) {
      setSelectedImageIndex(selectedImageIndex - 1);
    }
  };

  const handleNextImage = () => {
    if (selectedImageIndex !== null && selectedImageIndex < totalImages - 1) {
      setSelectedImageIndex(selectedImageIndex + 1);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
    >
      <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={onClose}
            data-testid="button-close-gallery"
          >
            <Ionicons name="close" size={24} color={colors.text} />
          </TouchableOpacity>
          
          <View style={styles.titleContainer}>
            <Text style={[styles.title, { color: colors.text }]}>
              {eventName ? `${eventName}` : 'Event Gallery'}
            </Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              {totalImages} {totalImages === 1 ? 'image' : 'images'}
            </Text>
          </View>
          
          <View style={styles.placeholder} />
        </View>

        {totalImages === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="images-outline" size={64} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No images uploaded yet
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.gridContainer}
            showsVerticalScrollIndicator={false}
          >
            {allImages.map((item, index) => (
              <TouchableOpacity
                key={`${item.requirementId}-${index}`}
                style={styles.imageWrapper}
                onPress={() => setSelectedImageIndex(index)}
                data-testid={`gallery-image-${index}`}
                activeOpacity={0.7}
              >
                <View style={[styles.imageContainer, { backgroundColor: colors.surface }]}>
                  {loadingImages.has(item.url) && (
                    <ActivityIndicator
                      size="small"
                      color={colors.primary}
                      style={styles.loader}
                    />
                  )}
                  
                  {errorImages.has(item.url) ? (
                    <View style={styles.errorPlaceholder}>
                      <Ionicons name="image-outline" size={32} color={colors.textSecondary} />
                    </View>
                  ) : (
                    <Image
                      source={{ uri: item.url }}
                      style={styles.image}
                      resizeMode="cover"
                      onLoadStart={() => handleImageLoadStart(item.url)}
                      onLoadEnd={() => handleImageLoadEnd(item.url)}
                      onError={() => handleImageError(item.url)}
                    />
                  )}
                </View>
                <Text
                  style={[styles.imageLabel, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.requirementName}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}

        {selectedImageIndex !== null && (
          <Modal
            visible={true}
            transparent={true}
            animationType="fade"
            onRequestClose={() => setSelectedImageIndex(null)}
          >
            <StatusBar barStyle="light-content" backgroundColor="#000000" />
            <View style={styles.fullscreenContainer}>
              <View style={styles.fullscreenHeader}>
                <TouchableOpacity
                  style={styles.navButton}
                  onPress={() => setSelectedImageIndex(null)}
                  data-testid="button-close-fullscreen"
                >
                  <Ionicons name="close" size={28} color="#ffffff" />
                </TouchableOpacity>
                
                <View style={styles.imageCounter}>
                  <Text style={styles.counterText}>
                    {selectedImageIndex + 1} / {totalImages}
                  </Text>
                </View>
                
                <View style={styles.placeholder} />
              </View>

              <View style={styles.fullscreenImageContainer}>
                {selectedImageIndex > 0 && (
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.leftArrow]}
                    onPress={handlePreviousImage}
                    data-testid="button-prev-image"
                  >
                    <Ionicons name="chevron-back" size={32} color="#ffffff" />
                  </TouchableOpacity>
                )}

                <Image
                  source={{ uri: allImages[selectedImageIndex].url }}
                  style={styles.fullscreenImage}
                  resizeMode="contain"
                />

                {selectedImageIndex < totalImages - 1 && (
                  <TouchableOpacity
                    style={[styles.arrowButton, styles.rightArrow]}
                    onPress={handleNextImage}
                    data-testid="button-next-image"
                  >
                    <Ionicons name="chevron-forward" size={32} color="#ffffff" />
                  </TouchableOpacity>
                )}
              </View>

              <View style={styles.fullscreenFooter}>
                <Text style={styles.imageTitle}>
                  {allImages[selectedImageIndex].requirementName}
                </Text>
                <Text style={styles.swipeHint}>
                  Use arrows or swipe to navigate
                </Text>
              </View>
            </View>
          </Modal>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 16,
    paddingBottom: 32,
  },
  imageWrapper: {
    width: IMAGE_SIZE,
    marginRight: GRID_SPACING,
    marginBottom: 12,
  },
  imageContainer: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  loader: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -10,
    marginLeft: -10,
  },
  errorPlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageLabel: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  emptyText: {
    fontSize: 16,
    marginTop: 16,
    textAlign: 'center',
  },
  fullscreenContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
  },
  fullscreenHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  navButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageCounter: {
    flex: 1,
    alignItems: 'center',
  },
  counterText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
  },
  fullscreenImageContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenImage: {
    width: screenWidth,
    height: '80%',
  },
  arrowButton: {
    position: 'absolute',
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  leftArrow: {
    left: 16,
  },
  rightArrow: {
    right: 16,
  },
  fullscreenFooter: {
    paddingBottom: 40,
    alignItems: 'center',
  },
  imageTitle: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  swipeHint: {
    color: 'rgba(255, 255, 255, 0.5)',
    fontSize: 14,
  },
});
