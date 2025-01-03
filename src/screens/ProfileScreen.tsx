import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Platform,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '../theme/theme';
import { LinearGradient } from 'expo-linear-gradient';
import SettingsModal from '../components/modals/SettingsModal';
import AddFriendsModal from '../components/modals/AddFriendsModal';
import { useProfile } from '../hooks/useProfile';
import { useExpertise } from '../hooks/useExpertise';
import { useFriends } from '../hooks/useFriends';
import { AvatarImage } from '../components/avatars/AvatarImage';

// Temporary dummy data
const DUMMY_ACHIEVEMENTS = [
  {
    id: '1',
    name: 'Early Bird',
    description: 'First to report at 10 different bars',
    icon: '🌅',
    earned: true,
  },
  {
    id: '2',
    name: 'Crowd Master',
    description: 'Accurately reported crowd levels 50 times',
    icon: '👥',
    earned: true,
  },
  {
    id: '3',
    name: 'Bar Veteran',
    description: 'Visited 100 different bars',
    icon: '🏆',
    earned: false,
  },
];

const ProfileScreen: React.FC = () => {
  const theme = useTheme();
  const { profile, loading: profileLoading, error: profileError, refreshProfile } = useProfile();
  const { expertiseLevels, loading: expertiseLoading, error: expertiseError, refreshExpertise } = useExpertise();
  const { friends, loading: friendsLoading, error: friendsError, refreshFriends } = useFriends();
  const [activeTab, setActiveTab] = useState<'achievements' | 'expertise' | 'friends'>('achievements');
  const [showSettings, setShowSettings] = useState(false);
  const [showAddFriends, setShowAddFriends] = useState(false);

  const onRefresh = async () => {
    refreshProfile();
    refreshExpertise();
    refreshFriends();
  };

  const renderHeader = () => (
    <LinearGradient
      colors={[theme.colors.primary, theme.colors.secondary]}
      style={styles.headerGradient}
    >
      <View style={styles.headerContent}>
        {profileLoading ? (
          <ActivityIndicator size="large" color="#fff" />
        ) : profileError ? (
          <TouchableOpacity onPress={refreshProfile}>
            <Text style={styles.errorText}>Error loading profile. Tap to retry.</Text>
          </TouchableOpacity>
        ) : profile ? (
          <>
            <AvatarImage
              avatarUrl={profile.avatar_url}
              size={100}
              style={styles.avatar}
            />
            <Text style={styles.displayName}>{profile.display_name}</Text>
            <Text style={styles.bio}>{profile.bio}</Text>
            <View style={styles.statsContainer}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.reputation_score}</Text>
                <Text style={styles.statLabel}>Reputation</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.status}</Text>
                <Text style={styles.statLabel}>Status</Text>
              </View>
            </View>
          </>
        ) : null}
      </View>
    </LinearGradient>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'achievements' && styles.activeTab]}
        onPress={() => setActiveTab('achievements')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'achievements' && styles.activeTabText
        ]}>Achievements</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'expertise' && styles.activeTab]}
        onPress={() => setActiveTab('expertise')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'expertise' && styles.activeTabText
        ]}>Expertise</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.tab, activeTab === 'friends' && styles.activeTab]}
        onPress={() => setActiveTab('friends')}
      >
        <Text style={[
          styles.tabText,
          activeTab === 'friends' && styles.activeTabText
        ]}>Friends</Text>
      </TouchableOpacity>
    </View>
  );

  const renderAchievements = () => (
    <View style={styles.achievementsContainer}>
      {DUMMY_ACHIEVEMENTS.map((achievement) => (
        <View key={achievement.id} style={styles.achievementCard}>
          <Text style={styles.achievementIcon}>{achievement.icon}</Text>
          <View style={styles.achievementInfo}>
            <Text style={styles.achievementName}>{achievement.name}</Text>
            <Text style={styles.achievementDescription}>{achievement.description}</Text>
          </View>
          {achievement.earned && (
            <MaterialCommunityIcons
              name="check-circle"
              size={24}
              color={theme.colors.primary}
              style={styles.earnedIcon}
            />
          )}
        </View>
      ))}
    </View>
  );

  const renderExpertise = () => (
    <View style={styles.expertiseContainer}>
      {expertiseLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : expertiseError ? (
        <TouchableOpacity onPress={refreshExpertise} style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading expertise. Tap to retry.</Text>
        </TouchableOpacity>
      ) : expertiseLevels.length === 0 ? (
        <View style={styles.noExpertiseContainer}>
          <Text style={styles.noExpertiseEmoji}>👀</Text>
          <Text style={styles.noExpertiseTitle}>Keeping Secrets, Are We?</Text>
          <Text style={styles.noExpertiseText}>
            While you're out there enjoying perfect bar timing, hundreds of others are standing in lines wondering how long the wait is... 
            Be the hero they need - start reporting those wait times!
          </Text>
          <Text style={styles.noExpertiseSubtext}>
            (We promise to pretend we never saw your selfish phase once you start helping) 😉
          </Text>
        </View>
      ) : (
        expertiseLevels.map((expertise) => (
          <View key={expertise.bar_id} style={styles.expertiseCard}>
            <View style={styles.expertiseHeader}>
              <Text style={styles.barName}>{expertise.bar_name}</Text>
              <Text style={styles.expertiseLevel}>Level {expertise.level}</Text>
            </View>
            <View style={styles.expertiseStats}>
              <Text style={styles.expertiseStat}>
                Reports: {expertise.total_reports}
              </Text>
              <Text style={styles.expertiseStat}>
                Accuracy: {Math.round(expertise.accuracy_rate)}%
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  { width: `${(expertise.level / 5) * 100}%` }
                ]}
              />
            </View>
            <Text style={styles.lastReported}>
              Last reported: {new Date(expertise.last_report_at).toLocaleDateString()}
            </Text>
          </View>
        ))
      )}
    </View>
  );

  const renderFriends = () => (
    <View style={styles.friendsContainer}>
      <TouchableOpacity 
        style={styles.addFriendButton}
        onPress={() => setShowAddFriends(true)}
      >
        <Ionicons name="person-add" size={24} color={theme.colors.primary} />
        <Text style={styles.addFriendText}>Add New Friends</Text>
      </TouchableOpacity>

      {friendsLoading ? (
        <ActivityIndicator size="large" color={theme.colors.primary} />
      ) : friendsError ? (
        <TouchableOpacity onPress={refreshFriends} style={styles.errorContainer}>
          <Text style={styles.errorText}>Error loading friends. Tap to retry.</Text>
        </TouchableOpacity>
      ) : friends.length === 0 ? (
        <View style={styles.noFriendsContainer}>
          <Text style={styles.noFriendsText}>You have no friends 😢</Text>
          <Text style={styles.noFriendsSubtext}>Add some friends to get started!</Text>
        </View>
      ) : (
        friends.map((friend) => (
          <View key={friend.friend_id} style={styles.friendCard}>
            <AvatarImage
              avatarUrl={friend.friend_avatar_url}
              size={50}
              style={styles.friendAvatar}
            />
            <View style={styles.friendInfo}>
              <View style={styles.friendNameRow}>
                <Text style={styles.friendName}>{friend.friend_name}</Text>
                <Text style={[styles.friendReputation, { color: theme.colors.primary }]}>
                  {friend.friend_reputation_score} Rep
                </Text>
              </View>
              <Text style={styles.friendBio} numberOfLines={2}>
                {friend.friend_bio}
              </Text>
              <View style={styles.friendStatusRow}>
                <Text style={styles.friendStatus}>
                  {friend.friendship_status}
                </Text>
                <Text style={styles.friendshipDate}>
                  Friends since {new Date(friend.friendship_created_at).toLocaleDateString()}
                </Text>
              </View>
            </View>
          </View>
        ))
      )}
    </View>
  );

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: '#fff',
    },
    scrollView: {
      flex: 1,
    },
    headerGradient: {
      paddingTop: Platform.OS === 'ios' ? 20 : 60,
      paddingBottom: 20,
    },
    headerContent: {
      alignItems: 'center',
      paddingHorizontal: 20,
      paddingTop: 20,
    },
    avatar: {
      width: 100,
      height: 100,
      borderRadius: 50,
      marginBottom: 10,
      borderWidth: 3,
      borderColor: '#fff',
    },
    displayName: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#fff',
      marginBottom: 5,
    },
    bio: {
      fontSize: 16,
      color: '#fff',
      textAlign: 'center',
      marginBottom: 15,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: 'rgba(255,255,255,0.2)',
      borderRadius: 15,
      padding: 15,
    },
    statItem: {
      flex: 1,
      alignItems: 'center',
    },
    statDivider: {
      width: 1,
      height: 30,
      backgroundColor: 'rgba(255,255,255,0.3)',
      marginHorizontal: 15,
    },
    statValue: {
      fontSize: 18,
      fontWeight: 'bold',
      color: '#fff',
    },
    statLabel: {
      fontSize: 14,
      color: 'rgba(255,255,255,0.8)',
    },
    settingsButton: {
      position: 'absolute',
      top: Platform.OS === 'ios' ? 60 : 40,
      right: 20,
      zIndex: 1,
      padding: 8,
      borderRadius: 20,
      backgroundColor: 'rgba(255,255,255,0.9)',
    },
    tabBar: {
      flexDirection: 'row',
      paddingHorizontal: 20,
      backgroundColor: '#fff',
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    tab: {
      flex: 1,
      paddingVertical: 15,
      alignItems: 'center',
    },
    activeTab: {
      borderBottomWidth: 2,
    },
    tabText: {
      fontSize: 16,
      fontWeight: '500',
    },
    activeTabText: {
      color: '#000',
    },
    content: {
      padding: 20,
    },
    achievementsContainer: {
      gap: 15,
    },
    achievementCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    achievementIcon: {
      fontSize: 30,
      marginRight: 15,
    },
    achievementInfo: {
      flex: 1,
    },
    achievementName: {
      fontSize: 16,
      fontWeight: 'bold',
      marginBottom: 4,
    },
    achievementDescription: {
      fontSize: 14,
      color: '#666',
    },
    earnedIcon: {
      marginLeft: 10,
    },
    expertiseContainer: {
      gap: 15,
    },
    expertiseCard: {
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    expertiseHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 10,
    },
    barName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    expertiseLevel: {
      fontSize: 16,
      fontWeight: '500',
      color: '#666',
    },
    expertiseStats: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: 10,
    },
    expertiseStat: {
      fontSize: 14,
      color: '#666',
    },
    progressBar: {
      height: 6,
      backgroundColor: '#eee',
      borderRadius: 3,
    },
    progressFill: {
      height: '100%',
      backgroundColor: '#4CAF50',
      borderRadius: 3,
    },
    friendsContainer: {
      gap: 15,
    },
    friendCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      elevation: 2,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
    },
    friendAvatar: {
      width: 50,
      height: 50,
      borderRadius: 25,
      marginRight: 15,
    },
    friendInfo: {
      flex: 1,
    },
    friendNameRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: 4,
    },
    friendName: {
      fontSize: 16,
      fontWeight: 'bold',
    },
    friendReputation: {
      fontSize: 14,
      fontWeight: '600',
    },
    friendBio: {
      fontSize: 14,
      color: '#666',
      marginBottom: 4,
    },
    friendStatusRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    friendStatus: {
      fontSize: 14,
      color: '#666',
    },
    friendshipDate: {
      fontSize: 12,
      color: '#999',
    },
    addFriendButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: '#fff',
      padding: 15,
      borderRadius: 10,
      borderWidth: 2,
      borderStyle: 'dashed',
      borderColor: '#ddd',
    },
    addFriendText: {
      marginLeft: 10,
      fontSize: 16,
      fontWeight: '500',
    },
    errorText: {
      color: '#fff',
      textAlign: 'center',
      padding: 20,
    },
    lastReported: {
      fontSize: 12,
      color: '#666',
      marginTop: 8,
    },
    errorContainer: {
      padding: 20,
      alignItems: 'center',
    },
    noDataText: {
      fontSize: 16,
      color: '#666',
      textAlign: 'center',
      padding: 20,
    },
    noFriendsContainer: {
      alignItems: 'center',
      marginTop: 20,
      padding: 20,
    },
    noFriendsText: {
      fontSize: 18,
      fontWeight: '600',
      color: '#333',
      marginBottom: 8,
    },
    noFriendsSubtext: {
      fontSize: 14,
      color: '#666',
    },
    noExpertiseContainer: {
      alignItems: 'center',
      padding: 20,
      backgroundColor: '#f8f8f8',
      borderRadius: 12,
      marginTop: 10,
    },
    noExpertiseEmoji: {
      fontSize: 48,
      marginBottom: 16,
    },
    noExpertiseTitle: {
      fontSize: 20,
      fontWeight: 'bold',
      color: theme.colors.primary,
      marginBottom: 12,
    },
    noExpertiseText: {
      fontSize: 16,
      textAlign: 'center',
      color: '#666',
      marginBottom: 8,
      lineHeight: 22,
    },
    noExpertiseSubtext: {
      fontSize: 14,
      textAlign: 'center',
      color: '#888',
      fontStyle: 'italic',
    },
  });

  return (
    <SafeAreaView style={styles.container}>
      <TouchableOpacity
        style={styles.settingsButton}
        onPress={() => setShowSettings(true)}
      >
        <Ionicons name="settings-outline" size={24} color={theme.colors.text} />
      </TouchableOpacity>

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl 
            refreshing={profileLoading || expertiseLoading || friendsLoading} 
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
          />
        }
      >
        {renderHeader()}
        {renderTabBar()}
        <View style={styles.content}>
          {activeTab === 'achievements' && renderAchievements()}
          {activeTab === 'expertise' && renderExpertise()}
          {activeTab === 'friends' && renderFriends()}
        </View>
      </ScrollView>

      <SettingsModal
        visible={showSettings}
        onClose={() => setShowSettings(false)}
        onProfileUpdate={refreshProfile}
      />

      <AddFriendsModal
        visible={showAddFriends}
        onClose={() => setShowAddFriends(false)}
      />
    </SafeAreaView>
  );
};

export default ProfileScreen;
