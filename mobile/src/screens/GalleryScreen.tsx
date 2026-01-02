import { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  RefreshControl,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme } from '../contexts';
import api from '../lib/api';
import { format } from 'date-fns';

const BRAND_MAROON = '#800020';
const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IMAGE_SIZE = (SCREEN_WIDTH - 48 - 24) / 3;

interface GalleryRequirement {
  id: string;
  requirement: string;
  description: string | null;
  images: string[];
}

interface GalleryEvent {
  eventId: string;
  eventName: string;
  clientName: string;
  eventDate: string;
  status: string;
  requirements: GalleryRequirement[];
  totalImages: number;
}

export default function GalleryScreen() {
  const { colors, isDark } = useTheme();
  const queryClient = useQueryClient();
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const [lightboxVisible, setLightboxVisible] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  const { data: gallery = [], isLoading, refetch } = useQuery<GalleryEvent[]>({
    queryKey: ['gallery'],
    queryFn: async () => {
      return api.get<GalleryEvent[]>('/api/gallery');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async ({ requirementId, imageUrl }: { requirementId: string; imageUrl: string }) => {
      return api.delete(`/api/requirements/${requirementId}/images`, { imageUrl });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery'] });
      Alert.alert('Success', 'Image deleted successfully');
    },
    onError: (error: any) => {
      Alert.alert('Error', error.response?.data?.error || 'Failed to delete image');
    },
  });

  const toggleEvent = (eventId: string) => {
    setExpandedEvents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(eventId)) {
        newSet.delete(eventId);
      } else {
        newSet.add(eventId);
      }
      return newSet;
    });
  };

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxVisible(true);
  };

  const handleDeleteImage = (requirementId: string, imageUrl: string) => {
    Alert.alert(
      'Delete Image',
      'Are you sure you want to delete this image? This action cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => deleteMutation.mutate({ requirementId, imageUrl }),
        },
      ]
    );
  };

  const navigateLightbox = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setLightboxIndex(prev => (prev > 0 ? prev - 1 : lightboxImages.length - 1));
    } else {
      setLightboxIndex(prev => (prev < lightboxImages.length - 1 ? prev + 1 : 0));
    }
  };

  const totalImages = gallery.reduce((sum, event) => sum + event.totalImages, 0);

  if (isLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={BRAND_MAROON} />
        <Text style={[styles.loadingText, { color: colors.textSecondary }]}>Loading gallery...</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.text }]}>DDC Gallery</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {totalImages} image{totalImages !== 1 ? 's' : ''} across {gallery.length} event{gallery.length !== 1 ? 's' : ''}
        </Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={refetch} tintColor={BRAND_MAROON} />
        }
      >
        {gallery.length === 0 ? (
          <View style={[styles.emptyState, { backgroundColor: colors.card }]}>
            <Ionicons name="images-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No images yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Images uploaded to event requirements will appear here.
            </Text>
          </View>
        ) : (
          gallery.map(event => (
            <View key={event.eventId} style={[styles.eventCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <TouchableOpacity
                style={styles.eventHeader}
                onPress={() => toggleEvent(event.eventId)}
                data-testid={`accordion-event-${event.eventId}`}
              >
                <View style={styles.eventInfo}>
                  <Text style={[styles.eventName, { color: colors.text }]}>{event.eventName}</Text>
                  <View style={styles.eventMeta}>
                    <Text style={[styles.clientName, { color: colors.textSecondary }]}>{event.clientName}</Text>
                    <Text style={[styles.separator, { color: colors.textSecondary }]}>|</Text>
                    <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
                    <Text style={[styles.eventDate, { color: colors.textSecondary }]}>
                      {format(new Date(event.eventDate), 'dd MMM yyyy')}
                    </Text>
                  </View>
                </View>
                <View style={styles.eventRight}>
                  <View style={styles.imageCount}>
                    <Ionicons name="images-outline" size={16} color={colors.textSecondary} />
                    <Text style={[styles.countText, { color: colors.textSecondary }]}>{event.totalImages}</Text>
                  </View>
                  <Ionicons
                    name={expandedEvents.has(event.eventId) ? 'chevron-up' : 'chevron-down'}
                    size={20}
                    color={colors.textSecondary}
                  />
                </View>
              </TouchableOpacity>

              {expandedEvents.has(event.eventId) && (
                <View style={[styles.eventContent, { borderTopColor: colors.border }]}>
                  {event.requirements.map(req => (
                    <View key={req.id} style={styles.requirementSection}>
                      <Text style={[styles.requirementName, { color: colors.text }]}>{req.requirement}</Text>
                      {req.description && (
                        <Text style={[styles.requirementDesc, { color: colors.textSecondary }]}>{req.description}</Text>
                      )}
                      <View style={styles.imageGrid}>
                        {req.images.map((imageUrl, index) => (
                          <View key={imageUrl} style={styles.imageContainer}>
                            <TouchableOpacity
                              onPress={() => openLightbox(req.images, index)}
                              data-testid={`img-gallery-${req.id}-${index}`}
                            >
                              <Image
                                source={{ uri: imageUrl }}
                                style={[styles.thumbnail, { backgroundColor: colors.surface }]}
                              />
                            </TouchableOpacity>
                            <TouchableOpacity
                              style={styles.deleteButton}
                              onPress={() => handleDeleteImage(req.id, imageUrl)}
                              data-testid={`button-delete-image-${req.id}-${index}`}
                            >
                              <Ionicons name="trash" size={14} color="#fff" />
                            </TouchableOpacity>
                          </View>
                        ))}
                      </View>
                    </View>
                  ))}
                </View>
              )}
            </View>
          ))
        )}
        <View style={styles.bottomPadding} />
      </ScrollView>

      <Modal visible={lightboxVisible} transparent animationType="fade">
        <View style={styles.lightboxContainer}>
          <TouchableOpacity
            style={styles.lightboxClose}
            onPress={() => setLightboxVisible(false)}
            data-testid="button-close-lightbox"
          >
            <Ionicons name="close" size={28} color="#fff" />
          </TouchableOpacity>

          {lightboxImages.length > 1 && (
            <>
              <TouchableOpacity
                style={[styles.lightboxNav, styles.lightboxNavLeft]}
                onPress={() => navigateLightbox('prev')}
                data-testid="button-lightbox-prev"
              >
                <Ionicons name="chevron-back" size={32} color="#fff" />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.lightboxNav, styles.lightboxNavRight]}
                onPress={() => navigateLightbox('next')}
                data-testid="button-lightbox-next"
              >
                <Ionicons name="chevron-forward" size={32} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          <Image
            source={{ uri: lightboxImages[lightboxIndex] }}
            style={styles.lightboxImage}
            resizeMode="contain"
          />

          {lightboxImages.length > 1 && (
            <Text style={styles.lightboxCounter}>
              {lightboxIndex + 1} / {lightboxImages.length}
            </Text>
          )}

          <TouchableOpacity
            style={styles.lightboxDelete}
            onPress={() => {
              setLightboxVisible(false);
            }}
            data-testid="button-lightbox-delete"
          >
            <Ionicons name="trash" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
  },
  emptyState: {
    margin: 16,
    padding: 32,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
  },
  eventCard: {
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  eventInfo: {
    flex: 1,
  },
  eventName: {
    fontSize: 16,
    fontWeight: '600',
  },
  eventMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 6,
  },
  clientName: {
    fontSize: 13,
  },
  separator: {
    fontSize: 13,
  },
  eventDate: {
    fontSize: 13,
    marginLeft: 4,
  },
  eventRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  imageCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countText: {
    fontSize: 14,
  },
  eventContent: {
    borderTopWidth: 1,
    padding: 16,
  },
  requirementSection: {
    marginBottom: 16,
  },
  requirementName: {
    fontSize: 15,
    fontWeight: '500',
    marginBottom: 4,
  },
  requirementDesc: {
    fontSize: 13,
    marginBottom: 8,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  imageContainer: {
    position: 'relative',
  },
  thumbnail: {
    width: IMAGE_SIZE,
    height: IMAGE_SIZE,
    borderRadius: 8,
  },
  deleteButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: 'rgba(220, 38, 38, 0.9)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomPadding: {
    height: 32,
  },
  lightboxContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  lightboxClose: {
    position: 'absolute',
    top: 50,
    right: 20,
    zIndex: 10,
    padding: 8,
  },
  lightboxNav: {
    position: 'absolute',
    top: '50%',
    marginTop: -20,
    padding: 8,
    zIndex: 10,
  },
  lightboxNavLeft: {
    left: 10,
  },
  lightboxNavRight: {
    right: 10,
  },
  lightboxImage: {
    width: SCREEN_WIDTH - 40,
    height: SCREEN_WIDTH - 40,
  },
  lightboxCounter: {
    position: 'absolute',
    bottom: 100,
    color: '#fff',
    fontSize: 16,
  },
  lightboxDelete: {
    position: 'absolute',
    bottom: 50,
    backgroundColor: 'rgba(220, 38, 38, 0.8)',
    borderRadius: 24,
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
