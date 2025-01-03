import React from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AVATARS, getAvatarUrl } from '../../constants/avatars';
import { AvatarImage } from '../avatars/AvatarImage';
import { useTheme } from '../../theme/theme';

interface AvatarPickerModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectAvatar: (avatarUrl: string) => void;
  currentAvatarUrl?: string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  visible,
  onClose,
  onSelectAvatar,
  currentAvatarUrl,
}) => {
  const theme = useTheme();

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
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <Ionicons name="close" size={24} color={theme.colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.avatarGrid} contentContainerStyle={styles.avatarGridContent}>
            {AVATARS.map((avatar) => (
              <TouchableOpacity
                key={avatar.id}
                style={[
                  styles.avatarItem,
                  currentAvatarUrl === getAvatarUrl(avatar.id) && styles.selectedAvatar,
                ]}
                onPress={() => onSelectAvatar(getAvatarUrl(avatar.id))}
              >
                <AvatarImage
                  avatarUrl={getAvatarUrl(avatar.id)}
                  size={80}
                  style={styles.avatar}
                />
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: Dimensions.get('window').height * 0.8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 15,
  },
  closeButton: {
    padding: 5,
  },
  avatarGrid: {
    padding: 10,
  },
  avatarGridContent: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
  },
  avatarItem: {
    alignItems: 'center',
    margin: 10,
    padding: 10,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedAvatar: {
    borderColor: '#007AFF',
    backgroundColor: 'rgba(0,122,255,0.1)',
  },
  avatar: {
    marginBottom: 5,
  },
});
