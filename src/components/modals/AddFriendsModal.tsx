import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  FlatList,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../theme/theme';
import { useAuth } from '../../context/AuthContext';
import { AvatarImage } from '../avatars/AvatarImage';
import { getAvatarUrl } from '../../constants/avatars';
import { supabase } from '../../services/supabase';

interface AddFriendsModalProps {
  visible: boolean;
  onClose: () => void;
}

interface UserResult {
  id: string;
  display_name: string;
  username: string;
  avatar_url: string | null;
  friendship_status: 'pending' | 'accepted' | 'rejected' | 'blocked' | null;
}

const AddFriendsModal: React.FC<AddFriendsModalProps> = ({ visible, onClose }) => {
  const theme = useTheme();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isProcessingRequest, setIsProcessingRequest] = useState(false);

  const handleSearch = useCallback(async (query: string) => {
    setSearchQuery(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }

    if (!user?.profile?.id) {
      console.error('No profile ID available');
      Alert.alert('Error', 'Unable to search. Please try logging in again.');
      return;
    }

    setIsSearching(true);
    try {
      const { data, error } = await supabase.rpc('search_users_by_username', {
        p_search_term: query,
        p_current_user_id: user.profile.id
      });

      if (error) {
        console.error('Search error:', error);
        Alert.alert('Error', 'Failed to search for users. Please try again.');
        return;
      }

      setSearchResults(data || []);
    } catch (error) {
      console.error('Search error:', error);
      Alert.alert('Error', 'Failed to search for users. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [user?.profile?.id]);

  const handleSendFriendRequest = async (addresseeId: string) => {
    if (!profile?.id || isProcessingRequest) return;

    setIsProcessingRequest(true);
    try {
      const { data, error } = await supabase.rpc('send_friend_request', {
        p_requester_id: profile.id,
        p_addressee_id: addresseeId
      });

      if (error) {
        console.error('Friend request error:', error);
        Alert.alert('Error', 'Failed to send friend request. Please try again.');
        return;
      }

      // Update the local state to show pending status
      setSearchResults(prev => 
        prev.map(user => 
          user.id === addresseeId 
            ? { ...user, friendship_status: 'pending' }
            : user
        )
      );

      Alert.alert('Success', 'Friend request sent!');
    } catch (error) {
      console.error('Friend request error:', error);
      Alert.alert('Error', 'Failed to send friend request. Please try again.');
    } finally {
      setIsProcessingRequest(false);
    }
  };

  const renderUserItem = ({ item }: { item: UserResult }) => (
    <View style={styles.userItem}>
      <AvatarImage 
        avatarUrl={item.avatar_url || getAvatarUrl('walrus')}
        size={50}
        style={styles.avatar}
      />
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{item.display_name}</Text>
        <Text style={styles.userHandle}>@{item.username}</Text>
      </View>
      <TouchableOpacity
        style={[
          styles.addButton,
          item.friendship_status && styles.addButtonDisabled
        ]}
        disabled={!!item.friendship_status || isProcessingRequest}
        onPress={() => handleSendFriendRequest(item.id)}
      >
        {item.friendship_status ? (
          <Text style={styles.statusText}>
            {item.friendship_status === 'pending' ? 'Pending' : 'Friends'}
          </Text>
        ) : (
          <Ionicons 
            name="person-add" 
            size={20} 
            color={isProcessingRequest ? theme.colors.text : theme.colors.primary} 
          />
        )}
      </TouchableOpacity>
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalContainer}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Add Friends</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <View style={styles.searchContainer}>
            <View style={styles.searchBar}>
              <Ionicons name="search" size={20} color="#666" />
              <TextInput
                style={styles.searchInput}
                placeholder="Search by username"
                value={searchQuery}
                onChangeText={handleSearch}
                autoCapitalize="none"
                autoCorrect={false}
              />
              {isSearching && (
                <ActivityIndicator size="small" color={theme.colors.primary} />
              )}
            </View>

            <FlatList
              data={searchResults}
              renderItem={renderUserItem}
              keyExtractor={(item) => item.id}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={() => (
                <View style={styles.emptyContainer}>
                  {searchQuery.length > 0 && !isSearching && (
                    <Text style={styles.emptyText}>
                      No users found matching "{searchQuery}"
                    </Text>
                  )}
                </View>
              )}
            />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  searchContainer: {
    flex: 1,
    padding: 15,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    marginBottom: 15,
  },
  searchInput: {
    flex: 1,
    marginLeft: 10,
    fontSize: 16,
  },
  listContent: {
    paddingHorizontal: 20,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  avatar: {
    width: 50,
    height: 50,
    backgroundColor: 'transparent',
  },
  userInfo: {
    flex: 1,
    marginLeft: 15,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userHandle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  addButton: {
    padding: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  addButtonDisabled: {
    backgroundColor: '#f5f5f5',
    borderColor: '#eee',
  },
  statusText: {
    fontSize: 12,
    color: '#666',
    paddingHorizontal: 8,
  },
  separator: {
    height: 1,
    backgroundColor: '#eee',
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyText: {
    color: '#666',
    fontSize: 16,
  },
});

export default AddFriendsModal;
