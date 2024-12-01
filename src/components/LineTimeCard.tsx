import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { formatDistance } from 'date-fns';
import { zonedTimeToUtc, utcToZonedTime } from 'date-fns-tz';
import { useTheme } from '../theme/theme';
import { useAuth } from '../context/AuthContext';

interface LineTimeCardProps {
  lineTime: {
    id: string;
    line: string;
    minutes: number;
    timestamp: string;
    user_id: string;
    reporter_name: string;
    reporter_reputation: number;
    reporter_status: string;
    upvotes: number;
    downvotes: number;
    user_vote?: 'up' | 'down' | null;
  };
  onVote: (lineTimeId: string, voteType: 'up' | 'down') => Promise<void>;
}

export const LineTimeCard: React.FC<LineTimeCardProps> = ({ lineTime, onVote }) => {
  const theme = useTheme();
  const { user } = useAuth();
  
  const getStatusColor = (line: string) => {
    switch (line) {
      case 'No Line':
        return theme.colors.success;
      case 'Short Line (< 5 mins)':
        return theme.colors.successLight;
      case 'Medium Line (5-15 mins)':
        return theme.colors.warning;
      case 'Long Line (15-30 mins)':
        return theme.colors.error;
      case 'Very Long Line (30+ mins)':
        return theme.colors.errorDark;
      default:
        return theme.colors.text;
    }
  };

  const getReporterBadge = () => {
    switch (lineTime.reporter_status) {
      case 'expert':
        return '🏆';
      case 'trusted':
        return '⭐';
      default:
        return '';
    }
  };

  return (
    <View style={[styles.container, { borderColor: theme.colors.border }]}>
      <View style={styles.header}>
        <View style={styles.reporterInfo}>
          <Text style={styles.reporterName}>
            {getReporterBadge()} {lineTime.reporter_name}
          </Text>
          <Text style={styles.timestamp}>
            {(() => {
              const utcDate = new Date(lineTime.timestamp);
              const now = new Date();
              const estOffset = -5 * 60 * 60 * 1000;
              const localDate = new Date(utcDate.getTime() + estOffset);
              return formatDistance(localDate, now, { addSuffix: true });
            })()}
          </Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={[styles.lineStatus, { color: getStatusColor(lineTime.line) }]}>
          {lineTime.line}
        </Text>
        {lineTime.minutes > 0 && (
          <Text style={styles.waitTime}>~{lineTime.minutes} min wait</Text>
        )}
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.voteButton,
            lineTime.user_vote === 'up' && styles.activeVote,
          ]}
          onPress={() => onVote(lineTime.id, 'up')}
          disabled={!user}
        >
          <MaterialCommunityIcons
            name={lineTime.user_vote === 'up' ? 'thumb-up' : 'thumb-up-outline'}
            size={20}
            color={lineTime.user_vote === 'up' ? theme.colors.primary : theme.colors.text}
          />
          <Text style={[
            styles.voteCount,
            lineTime.user_vote === 'up' && styles.activeVoteText
          ]}>
            {lineTime.upvotes}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.voteButton,
            lineTime.user_vote === 'down' && styles.activeVote,
          ]}
          onPress={() => onVote(lineTime.id, 'down')}
          disabled={!user}
        >
          <MaterialCommunityIcons
            name={lineTime.user_vote === 'down' ? 'thumb-down' : 'thumb-down-outline'}
            size={20}
            color={lineTime.user_vote === 'down' ? theme.colors.error : theme.colors.text}
          />
          <Text style={[
            styles.voteCount,
            lineTime.user_vote === 'down' && styles.activeVoteText
          ]}>
            {lineTime.downvotes}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  reporterInfo: {
    flex: 1,
  },
  reporterName: {
    fontSize: 15,
    fontWeight: '600',
  },
  timestamp: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  content: {
    marginBottom: 12,
  },
  lineStatus: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  waitTime: {
    fontSize: 14,
    color: '#666',
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  voteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    marginRight: 16,
  },
  activeVote: {
    backgroundColor: '#f0f0f0',
  },
  voteCount: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  activeVoteText: {
    fontWeight: '600',
  },
});
