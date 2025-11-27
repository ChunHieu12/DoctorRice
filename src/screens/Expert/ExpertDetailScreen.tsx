import { AppHeader } from "@/components/ui";
import { useTextSize } from "@/contexts/TextSizeContext";
import {
  getExpertDetail,
  type Expert,
  type ExpertDetail,
  type ExpertReview,
} from "@/services/expert.service";
import { useExpertTranslation } from "@/utils/expert-translations";
import { Ionicons } from "@expo/vector-icons";
import { Image } from "expo-image";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width * 0.7;
const CARD_MARGIN = 10;

export default function ExpertDetailScreen() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const params = useLocalSearchParams();
  const insets = useSafeAreaInsets();
  const { scale } = useTextSize();
  const { translateExpertise, translateEducation, translatePosition } =
    useExpertTranslation();

  const expertId = params.id as string;
  const locale = i18n.language === "vi" ? "vi-VN" : "en-US";

  const [expert, setExpert] = useState<ExpertDetail | null>(null);
  const [suggestions, setSuggestions] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoScrollInterval = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const [reviews, setReviews] = useState<ExpertReview[]>([]);

  // Filter reviews: only show reviews with comments
  const reviewsWithComments = useMemo(() => {
    return reviews.filter(
      (review) => review.comment && review.comment.trim().length > 0
    );
  }, [reviews]);

  const loadExpertDetail = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExpertDetail(expertId);
      console.log("👨‍⚕️ Expert detail loaded:", {
        name: data.expert.displayName,
        education: data.expert.education,
        detailedWorkHistory: data.expert.detailedWorkHistory?.length || 0,
      });
      setExpert(data.expert);
      setSuggestions(data.suggestions);
      setReviews(data.expert.reviews || []);
    } catch (error) {
      console.error("Failed to load expert detail:", error);
    } finally {
      setIsLoading(false);
    }
  }, [expertId]);

  useEffect(() => {
    loadExpertDetail();
    return () => {
      if (autoScrollInterval.current) {
        clearInterval(autoScrollInterval.current);
      }
    };
  }, [loadExpertDetail]);

  // Auto-scroll carousel every 5 seconds
  useEffect(() => {
    if (suggestions.length > 1) {
      autoScrollInterval.current = setInterval(() => {
        setCurrentIndex((prev) => {
          const nextIndex = (prev + 1) % suggestions.length;
          scrollViewRef.current?.scrollTo({
            x: nextIndex * (CARD_WIDTH + CARD_MARGIN * 2),
            animated: true,
          });
          return nextIndex;
        });
      }, 5000);

      return () => {
        if (autoScrollInterval.current) {
          clearInterval(autoScrollInterval.current);
        }
      };
    }
  }, [suggestions]);

  const handleAskQuestion = (id: string) => {
    router.push(`/expert-chat?expertId=${id}` as any);
  };

  const renderSuggestionCard = (item: Expert) => (
    <View key={item._id} style={styles.suggestionCard}>
      <TouchableOpacity
        style={styles.suggestionContent}
        onPress={() => router.push(`/expert-detail?id=${item._id}` as any)}
        activeOpacity={0.8}
      >
        {/* Avatar */}
        <View style={styles.suggestionAvatarContainer}>
          {item.avatar ? (
            <Image
              source={{ uri: item.avatar }}
              style={styles.suggestionAvatar}
            />
          ) : (
            <View style={styles.suggestionAvatarPlaceholder}>
              <Ionicons name="person" size={28 * scale} color="#fff" />
            </View>
          )}
          <View
            style={[
              styles.suggestionStatusDot,
              { backgroundColor: item.isOnline ? "#4CAF50" : "#9E9E9E" },
            ]}
          />
        </View>

        {/* Info */}
        <View style={styles.suggestionInfo}>
          <Text
            style={[styles.suggestionName, { fontSize: 15 * scale }]}
            numberOfLines={1}
          >
            {item.displayName}
          </Text>
          <View style={styles.suggestionRating}>
            <Ionicons name="star" size={13 * scale} color="#FFC107" />
            <Text
              style={[styles.suggestionRatingText, { fontSize: 13 * scale }]}
            >
              {item.rating.toFixed(1)}
            </Text>
          </View>
          <Text style={[styles.suggestionStatus, { fontSize: 12 * scale }]}>
            {item.isOnline
              ? t("experts.detail.suggestionStatusOnline")
              : t("experts.detail.suggestionStatusOffline")}
          </Text>
        </View>

        {/* Ask button */}
        <TouchableOpacity
          style={styles.suggestionAskButton}
          onPress={(e) => {
            e.stopPropagation();
            handleAskQuestion(item._id);
          }}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.suggestionAskButtonText, { fontSize: 12 * scale }]}
          >
            {t("experts.detail.suggestionAsk")}
          </Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.container}>
        <AppHeader title={t("experts.detail.title")} showBackButton />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      </View>
    );
  }

  if (!expert) {
    return (
      <View style={styles.container}>
        <AppHeader title={t("experts.detail.title")} showBackButton />
        <View style={styles.emptyContainer}>
          <Ionicons
            name="alert-circle-outline"
            size={80 * scale}
            color="#ccc"
          />
          <Text style={[styles.emptyText, { fontSize: 16 * scale }]}>
            {t("experts.detail.notFound")}
          </Text>
        </View>
      </View>
    );
  }

  // Calculate counts correctly - use backend values for consistency
  const totalRatings =
    expert.totalRatings ?? expert.reviews?.length ?? reviews.length ?? 0; // All ratings (with or without comment)
  const commentCount = reviewsWithComments.length; // Only reviews with comments

  // Show "View More" button if more than 5 reviews with comments
  const showViewMore = reviewsWithComments.length > 5;
  const displayedReviews = showViewMore
    ? reviewsWithComments.slice(0, 5)
    : reviewsWithComments;

  return (
    <View style={styles.container}>
      <AppHeader title={t("experts.detail.title")} showBackButton />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={{ paddingBottom: insets.bottom + 100 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Expert Info Card */}
        <View style={styles.expertCard}>
          {/* Avatar */}
          <View style={styles.avatarContainer}>
            {expert.avatar ? (
              <Image source={{ uri: expert.avatar }} style={styles.avatar} />
            ) : (
              <View style={styles.avatarPlaceholder}>
                <Ionicons name="person" size={50 * scale} color="#fff" />
              </View>
            )}
            <View
              style={[
                styles.statusIndicator,
                { backgroundColor: expert.isOnline ? "#4CAF50" : "#9E9E9E" },
              ]}
            />
          </View>

          {/* Name & Rating */}
          <Text style={[styles.expertName, { fontSize: 22 * scale }]}>
            {expert.displayName}
          </Text>

          <View style={styles.ratingContainer}>
            <Ionicons name="star" size={18 * scale} color="#FFC107" />
            <Text style={[styles.ratingText, { fontSize: 16 * scale }]}>
              {expert.rating.toFixed(1)}
            </Text>
          </View>
          <View style={styles.ratingMetaRow}>
            <Text style={[styles.ratingCount, { fontSize: 13 * scale }]}>
              {t("experts.detail.ratingCount", { count: totalRatings })}
            </Text>
            <View style={styles.commentBadge}>
              <Ionicons
                name="chatbubble-ellipses-outline"
                size={14 * scale}
                color="#4CAF50"
              />
              <Text style={[styles.commentBadgeText, { fontSize: 13 * scale }]}>
                {t("experts.detail.commentCount", { count: commentCount })}
              </Text>
            </View>
          </View>

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: expert.isOnline ? "#4CAF50" : "#9E9E9E" },
              ]}
            />
            <Text style={[styles.statusText, { fontSize: 14 * scale }]}>
              {expert.isOnline
                ? t("experts.detail.statusOnline")
                : t("experts.detail.statusOffline")}
            </Text>
          </View>

          {/* Expertise */}
          {expert.expertise && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="briefcase" size={20 * scale} color="#4CAF50" />
                <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                  {t("experts.detail.sections.expertise")}
                </Text>
              </View>
              <Text style={[styles.sectionContent, { fontSize: 14 * scale }]}>
                {translateExpertise(expert.expertise)}
              </Text>
            </View>
          )}

          {/* Education */}
          {expert.education && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="school" size={20 * scale} color="#4CAF50" />
                <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                  {t("experts.detail.sections.education")}
                </Text>
              </View>
              <Text style={[styles.sectionContent, { fontSize: 14 * scale }]}>
                {translateEducation(expert.education)}
              </Text>
            </View>
          )}

          {/* Experience */}
          {expert.experience && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name="briefcase-outline"
                  size={20 * scale}
                  color="#4CAF50"
                />
                <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                  {t("experts.detail.sections.experience")}
                </Text>
              </View>
              <Text style={[styles.sectionContent, { fontSize: 14 * scale }]}>
                {expert.experience}
              </Text>
            </View>
          )}

          {/* Work History Summary */}
          {expert.workHistory && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="time" size={20 * scale} color="#4CAF50" />
                <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                  {t("experts.detail.sections.workHistory")}
                </Text>
              </View>
              <Text style={[styles.sectionContent, { fontSize: 14 * scale }]}>
                {expert.workHistory}
              </Text>
            </View>
          )}

          {/* Detailed Work History */}
          {expert.detailedWorkHistory &&
            expert.detailedWorkHistory.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons
                    name="document-text"
                    size={20 * scale}
                    color="#4CAF50"
                  />
                  <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                    {t("experts.detail.sections.workHistoryDetail")}
                  </Text>
                </View>
                {expert.detailedWorkHistory.map((work: any, index: number) => (
                  <View key={index} style={styles.workHistoryItem}>
                    <View style={styles.workHistoryHeader}>
                      <Text
                        style={[styles.workPosition, { fontSize: 15 * scale }]}
                      >
                        {translatePosition(work.position)}
                      </Text>
                      <Text
                        style={[styles.workPeriod, { fontSize: 12 * scale }]}
                      >
                        {work.period}
                      </Text>
                    </View>
                    <Text
                      style={[
                        styles.workOrganization,
                        { fontSize: 14 * scale },
                      ]}
                    >
                      {work.organization}
                    </Text>
                    {work.description && (
                      <Text
                        style={[
                          styles.workDescription,
                          { fontSize: 13 * scale },
                        ]}
                      >
                        {work.description}
                      </Text>
                    )}
                  </View>
                ))}
              </View>
            )}

          {/* Reviews Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Ionicons
                name="chatbubble-ellipses"
                size={20 * scale}
                color="#4CAF50"
              />
              <Text style={[styles.sectionTitle, { fontSize: 16 * scale }]}>
                {t("experts.detail.sections.reviews", {
                  count: commentCount,
                })}
              </Text>
            </View>
            {reviewsWithComments.length === 0 ? (
              <Text
                style={[
                  styles.sectionContent,
                  { fontSize: 14 * scale, fontStyle: "italic", color: "#777" },
                ]}
              >
                {t("experts.detail.noReviews")}
              </Text>
            ) : (
              <>
                {displayedReviews.map((review, index) => {
                  const reviewDate = review.completedAt || review.createdAt;
                  const formattedDate = reviewDate
                    ? new Date(reviewDate).toLocaleDateString(locale)
                    : undefined;
                  return (
                    <View
                      key={`${review.farmer?._id || "review"}-${index}`}
                      style={styles.reviewItem}
                    >
                      <View style={styles.reviewHeader}>
                        <View style={styles.reviewAvatar}>
                          {review.farmer?.avatar ? (
                            <Image
                              source={{ uri: review.farmer.avatar }}
                              style={styles.reviewAvatarImage}
                            />
                          ) : (
                            <View style={styles.reviewAvatarPlaceholder}>
                              <Ionicons
                                name="person"
                                size={18 * scale}
                                color="#fff"
                              />
                            </View>
                          )}
                        </View>
                        <View style={styles.reviewInfo}>
                          <Text
                            style={[
                              styles.reviewName,
                              { fontSize: 14 * scale },
                            ]}
                          >
                            {review.farmer?.displayName ||
                              t("experts.detail.anonymousFarmer")}
                          </Text>
                          {formattedDate && (
                            <Text
                              style={[
                                styles.reviewDate,
                                { fontSize: 12 * scale },
                              ]}
                            >
                              {formattedDate}
                            </Text>
                          )}
                        </View>
                        <View style={styles.reviewRating}>
                          <Ionicons
                            name="star"
                            size={14 * scale}
                            color="#FFC107"
                          />
                          <Text
                            style={[
                              styles.reviewRatingText,
                              { fontSize: 13 * scale },
                            ]}
                          >
                            {review.rating?.toFixed(1)}
                          </Text>
                        </View>
                      </View>
                      {review.comment && (
                        <Text
                          style={[
                            styles.reviewComment,
                            { fontSize: 13 * scale },
                          ]}
                        >
                          {review.comment}
                        </Text>
                      )}
                    </View>
                  );
                })}
                {showViewMore && (
                  <TouchableOpacity
                    style={styles.viewMoreButton}
                    onPress={() =>
                      router.push(
                        `/expert-reviews?expertId=${expert._id}` as any
                      )
                    }
                    activeOpacity={0.7}
                  >
                    <Text
                      style={[
                        styles.viewMoreButtonText,
                        { fontSize: 14 * scale },
                      ]}
                    >
                      {t("experts.detail.viewMoreReviews")}
                    </Text>
                    <Ionicons
                      name="chevron-forward"
                      size={16 * scale}
                      color="#4CAF50"
                    />
                  </TouchableOpacity>
                )}
              </>
            )}
          </View>
        </View>

        {/* Suggestions Carousel */}
        {suggestions.length > 0 && (
          <View style={styles.suggestionsContainer}>
            <Text style={[styles.suggestionsTitle, { fontSize: 18 * scale }]}>
              {t("experts.detail.sections.otherExperts")}
            </Text>

            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled={false}
              showsHorizontalScrollIndicator={false}
              decelerationRate="fast"
              snapToInterval={CARD_WIDTH + CARD_MARGIN * 2}
              snapToAlignment="center"
              contentContainerStyle={styles.carouselContent}
              onMomentumScrollEnd={(e) => {
                const index = Math.round(
                  e.nativeEvent.contentOffset.x / (CARD_WIDTH + CARD_MARGIN * 2)
                );
                setCurrentIndex(index);
              }}
            >
              {suggestions.map(renderSuggestionCard)}
            </ScrollView>

            {/* Pagination dots */}
            {suggestions.length > 1 && (
              <View style={styles.paginationContainer}>
                {suggestions.map((_, index) => (
                  <View
                    key={index}
                    style={[
                      styles.paginationDot,
                      index === currentIndex && styles.paginationDotActive,
                    ]}
                  />
                ))}
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {/* Fixed bottom button */}
      <View
        style={[
          styles.bottomButtonContainer,
          { paddingBottom: insets.bottom + 15 },
        ]}
      >
        <TouchableOpacity
          style={styles.askButton}
          onPress={() => handleAskQuestion(expert._id)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={20 * scale} color="#fff" />
          <Text style={[styles.askButtonText, { fontSize: 16 * scale }]}>
            {t("experts.detail.askButton")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  emptyText: {
    color: "#999",
    marginTop: 15,
    textAlign: "center",
  },
  expertCard: {
    backgroundColor: "#fff",
    margin: 15,
    borderRadius: 15,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 15,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E0E0E0",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 5,
    right: 5,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 3,
    borderColor: "#fff",
  },
  expertName: {
    fontWeight: "bold",
    color: "#333",
    textAlign: "center",
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  ratingMetaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    marginBottom: 12,
  },
  ratingText: {
    color: "#333",
    fontWeight: "600",
  },
  ratingCount: {
    color: "#999",
  },
  commentBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentBadgeText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 15,
    gap: 6,
    marginBottom: 20,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    color: "#666",
    fontWeight: "500",
  },
  section: {
    width: "100%",
    marginTop: 20,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  sectionTitle: {
    fontWeight: "600",
    color: "#333",
  },
  sectionContent: {
    color: "#666",
    lineHeight: 22,
  },
  suggestionsContainer: {
    marginTop: 10,
    paddingBottom: 20,
  },
  suggestionsTitle: {
    fontWeight: "bold",
    color: "#333",
    marginHorizontal: 15,
    marginBottom: 15,
  },
  carouselContent: {
    paddingHorizontal: (width - CARD_WIDTH) / 2,
  },
  suggestionCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_MARGIN,
  },
  suggestionContent: {
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 15,
    flexDirection: "row",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionAvatarContainer: {
    position: "relative",
  },
  suggestionAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#E0E0E0",
  },
  suggestionAvatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  suggestionStatusDot: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: "#fff",
  },
  suggestionInfo: {
    flex: 1,
    marginLeft: 12,
  },
  suggestionName: {
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  suggestionRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    marginBottom: 4,
  },
  suggestionRatingText: {
    color: "#666",
    fontWeight: "600",
  },
  suggestionStatus: {
    color: "#999",
  },
  suggestionAskButton: {
    backgroundColor: "#4CAF50",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  suggestionAskButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
  paginationContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 15,
    gap: 6,
  },
  paginationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D0D0D0",
  },
  paginationDotActive: {
    backgroundColor: "#4CAF50",
    width: 20,
  },
  workHistoryItem: {
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  workHistoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 6,
  },
  workPosition: {
    fontWeight: "600",
    color: "#333",
    flex: 1,
  },
  workPeriod: {
    color: "#4CAF50",
    fontWeight: "500",
    marginLeft: 10,
  },
  workOrganization: {
    color: "#666",
    marginBottom: 4,
    fontStyle: "italic",
  },
  workDescription: {
    color: "#777",
    marginTop: 6,
    lineHeight: 20,
  },
  reviewItem: {
    backgroundColor: "#F2F2F2",
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    width: "100%",
  },
  reviewHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  reviewAvatar: {
    marginRight: 10,
  },
  reviewAvatarImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  reviewAvatarPlaceholder: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  reviewInfo: {
    flex: 1,
  },
  reviewName: {
    color: "#333",
    fontWeight: "600",
  },
  reviewDate: {
    color: "#999",
    marginTop: 2,
  },
  reviewRating: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  reviewRatingText: {
    color: "#333",
    fontWeight: "600",
  },
  reviewComment: {
    marginTop: 8,
    color: "#555",
    lineHeight: 18,
  },
  viewMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 12,
    paddingVertical: 12,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    gap: 6,
  },
  viewMoreButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  bottomButtonContainer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    paddingHorizontal: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  askButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
});
