import { AppHeader } from "@/components/ui";
import { useTextSize } from "@/contexts/TextSizeContext";
import { getExperts, type Expert } from "@/services/expert.service";
import { useExpertTranslation } from "@/utils/expert-translations";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { Image } from "expo-image";
import { useRouter } from "expo-router";
import React, { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ExpertListScreen() {
  const { t } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { scale } = useTextSize();
  const { translateExpertise, translateEducation } = useExpertTranslation();

  const [experts, setExperts] = useState<Expert[]>([]);
  const [filteredExperts, setFilteredExperts] = useState<Expert[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showOnlineOnly, setShowOnlineOnly] = useState(false);

  const loadExperts = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getExperts({ online: showOnlineOnly });
      setExperts(data);
      filterExperts(data, searchQuery);
    } catch (error) {
      console.error("Failed to load experts:", error);
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  }, [showOnlineOnly, searchQuery]);

  useFocusEffect(
    useCallback(() => {
      loadExperts();
    }, [loadExperts])
  );

  const filterExperts = (data: Expert[], query: string) => {
    if (!query.trim()) {
      setFilteredExperts(data);
      return;
    }

    const filtered = data.filter((expert) =>
      expert.displayName.toLowerCase().includes(query.toLowerCase())
    );
    setFilteredExperts(filtered);
  };

  const handleSearch = (text: string) => {
    setSearchQuery(text);
    filterExperts(experts, text);
  };

  const toggleOnlineFilter = () => {
    setShowOnlineOnly(!showOnlineOnly);
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadExperts();
  };

  const handleExpertPress = (expertId: string) => {
    router.push(`/expert-detail?id=${expertId}` as any);
  };

  const handleAskQuestion = (expertId: string) => {
    router.push(`/expert-chat?expertId=${expertId}` as any);
  };

  const renderExpertItem = ({ item }: { item: Expert }) => (
    <TouchableOpacity
      style={styles.expertCard}
      onPress={() => handleExpertPress(item._id)}
      activeOpacity={0.7}
    >
      <View style={styles.expertInfo}>
        {/* Avatar */}
        <View style={styles.avatarContainer}>
          {item.avatar ? (
            <Image source={{ uri: item.avatar }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Ionicons name="person" size={32 * scale} color="#fff" />
            </View>
          )}
          {/* Online status indicator */}
          <View
            style={[
              styles.statusIndicator,
              { backgroundColor: item.isOnline ? "#4CAF50" : "#9E9E9E" },
            ]}
          />
        </View>

        {/* Expert details */}
        <View style={styles.expertDetails}>
          <View style={styles.expertHeader}>
            <Text
              style={[styles.expertName, { fontSize: 16 * scale }]}
              numberOfLines={1}
            >
              {item.displayName}
            </Text>
            <View style={styles.ratingRow}>
              <View style={styles.ratingContainer}>
                <Ionicons name="star" size={14 * scale} color="#FFC107" />
                <Text style={[styles.ratingText, { fontSize: 14 * scale }]}>
                  {item.rating.toFixed(1)}
                </Text>
                <Text
                  style={[styles.ratingCountText, { fontSize: 12 * scale }]}
                >
                  ({item.totalRatings ?? 0})
                </Text>
              </View>
              <View style={styles.commentContainer}>
                <Ionicons
                  name="chatbubble-ellipses-outline"
                  size={13 * scale}
                  color="#4CAF50"
                />
                <Text style={[styles.commentText, { fontSize: 12 * scale }]}>
                  {t("experts.list.reviewCount", {
                    count: item.commentCount ?? 0,
                  })}
                </Text>
              </View>
            </View>
          </View>

          {item.expertise && (
            <Text
              style={[styles.expertise, { fontSize: 13 * scale }]}
              numberOfLines={1}
            >
              <Ionicons
                name="briefcase-outline"
                size={12 * scale}
                color="#666"
              />{" "}
              {translateExpertise(item.expertise)}
            </Text>
          )}

          {item.education && (
            <Text
              style={[styles.education, { fontSize: 12 * scale }]}
              numberOfLines={2}
            >
              <Ionicons
                name="school-outline"
                size={12 * scale}
                color="#4CAF50"
              />{" "}
              {translateEducation(item.education)}
            </Text>
          )}

          <View style={styles.statusBadge}>
            <View
              style={[
                styles.statusDot,
                { backgroundColor: item.isOnline ? "#4CAF50" : "#9E9E9E" },
              ]}
            />
            <Text style={[styles.statusText, { fontSize: 12 * scale }]}>
              {item.isOnline
                ? t("experts.list.status.online")
                : t("experts.list.status.offline")}
            </Text>
          </View>
        </View>
      </View>

      {/* Action button */}
      <TouchableOpacity
        style={styles.askButton}
        onPress={(e) => {
          e.stopPropagation();
          handleAskQuestion(item._id);
        }}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chatbubble-ellipses-outline"
          size={18 * scale}
          color="#fff"
        />
        <Text style={[styles.askButtonText, { fontSize: 13 * scale }]}>
          {t("experts.list.askButton")}
        </Text>
      </TouchableOpacity>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <AppHeader title={t("experts.list.title")} showBackButton />

      {/* Search and filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20 * scale} color="#999" />
          <TextInput
            style={[styles.searchInput, { fontSize: 15 * scale }]}
            placeholder={t("experts.list.searchPlaceholder")}
            placeholderTextColor="#999"
            value={searchQuery}
            onChangeText={handleSearch}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => handleSearch("")}>
              <Ionicons name="close-circle" size={20 * scale} color="#999" />
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity
          style={[
            styles.filterButton,
            showOnlineOnly && styles.filterButtonActive,
          ]}
          onPress={toggleOnlineFilter}
          activeOpacity={0.7}
        >
          <Ionicons
            name="radio-button-on"
            size={18 * scale}
            color={showOnlineOnly ? "#fff" : "#4CAF50"}
          />
          <Text
            style={[
              styles.filterButtonText,
              { fontSize: 13 * scale },
              showOnlineOnly && styles.filterButtonTextActive,
            ]}
          >
            {t("experts.list.onlineFilter")}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Expert list */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4CAF50" />
        </View>
      ) : filteredExperts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="people-outline" size={80 * scale} color="#ccc" />
          <Text style={[styles.emptyText, { fontSize: 16 * scale }]}>
            {searchQuery
              ? t("experts.list.empty.noResults")
              : showOnlineOnly
              ? t("experts.list.empty.noOnline")
              : t("experts.list.empty.none")}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredExperts}
          renderItem={renderExpertItem}
          keyExtractor={(item) => item._id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 20 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={["#4CAF50"]}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  searchContainer: {
    flexDirection: "row",
    paddingHorizontal: 15,
    paddingVertical: 12,
    gap: 10,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F5F5F5",
    borderRadius: 10,
    paddingHorizontal: 12,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    color: "#333",
  },
  filterButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#4CAF50",
    gap: 5,
  },
  filterButtonActive: {
    backgroundColor: "#4CAF50",
  },
  filterButtonText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  filterButtonTextActive: {
    color: "#fff",
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
    marginHorizontal: 15,
    marginTop: 12,
    borderRadius: 12,
    padding: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  expertInfo: {
    flexDirection: "row",
    marginBottom: 12,
  },
  avatarContainer: {
    position: "relative",
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#E0E0E0",
  },
  avatarPlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: "#4CAF50",
    justifyContent: "center",
    alignItems: "center",
  },
  statusIndicator: {
    position: "absolute",
    bottom: 2,
    right: 2,
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: "#fff",
  },
  expertDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: "center",
  },
  expertHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  expertName: {
    flex: 1,
    fontWeight: "bold",
    color: "#333",
  },
  ratingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  ratingText: {
    color: "#666",
    fontWeight: "600",
  },
  ratingCountText: {
    color: "#999",
    marginLeft: 4,
  },
  commentContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  commentText: {
    color: "#4CAF50",
    fontWeight: "600",
  },
  expertise: {
    color: "#666",
    marginBottom: 4,
  },
  education: {
    color: "#4CAF50",
    lineHeight: 18,
    marginBottom: 4,
    fontStyle: "italic",
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 6,
    gap: 5,
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
  askButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4CAF50",
    borderRadius: 8,
    paddingVertical: 10,
    gap: 6,
  },
  askButtonText: {
    color: "#fff",
    fontWeight: "600",
  },
});
