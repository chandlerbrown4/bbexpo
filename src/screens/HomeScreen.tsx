import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  TextInput,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { BarCard } from '../components/BarCard';
import { useNearbyBars } from '../hooks/useNearbyBars';
import { useLocation } from '../hooks/useLocation';
import { useTheme } from '../theme/theme';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../navigation/types';

export const HomeScreen: React.FC = () => {
  const theme = useTheme();
  const navigation = useNavigation<StackNavigationProp<RootStackParamList>>();
  const [searchQuery, setSearchQuery] = useState('');
  const { location, loading: locationLoading } = useLocation();
  const { bars, loading: barsLoading, error, refetch } = useNearbyBars({
    userLatitude: location?.latitude ?? 36.1584,
    userLongitude: location?.longitude ?? -81.1476,
    maxDistance: 10000,
  });
  const [refreshing, setRefreshing] = useState(false);

  const loading = locationLoading || barsLoading;

  const filteredBars = React.useMemo(() => {
    if (!searchQuery.trim()) return bars;
    const query = searchQuery.toLowerCase();
    return bars.filter(
      (bar) =>
        bar.name.toLowerCase().includes(query) ||
        bar.address.toLowerCase().includes(query)
    );
  }, [bars, searchQuery]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  const handleBarPress = (barId: string) => {
    navigation.navigate('BarDetails', { barId });
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: theme.spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: theme.colors.background,
    },
    searchInput: {
      backgroundColor: theme.colors.surface,
      borderRadius: theme.borderRadius.md,
      padding: theme.spacing.md,
      marginBottom: theme.spacing.md,
      color: theme.colors.text,
      fontSize: theme.typography.body.fontSize,
    },
    listContent: {
      paddingBottom: theme.spacing.xl,
    },
  });

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.searchInput}
        placeholder="Search bars..."
        value={searchQuery}
        onChangeText={setSearchQuery}
        placeholderTextColor={theme.colors.textSecondary}
      />

      <FlatList
        data={filteredBars}
        renderItem={({ item }) => (
          <BarCard
            bar={item}
            onPress={() => handleBarPress(item.id)}
          />
        )}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={[theme.colors.primary]}
          />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};
