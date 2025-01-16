import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Bar } from '../../types/bar';
import { useTheme } from '../../theme/theme';

interface BarSearchInputProps {
  onSelectBar: (bar: Bar) => void;
}

export const BarSearchInput: React.FC<BarSearchInputProps> = ({ onSelectBar }) => {
  const theme = useTheme();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState<Bar[]>([]);

  const handleSearch = async (text: string) => {
    setQuery(text);
    if (text.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      // TODO: Implement actual API call to search bars
      // For now, using mock data
      const mockResults: Bar[] = [
        {
          id: '1',
          name: 'The Local Pub',
          address: '123 Main St',
          rating: 4.5,
          priceLevel: 2,
          photoUrl: 'https://example.com/photo1.jpg',
        },
        {
          id: '2',
          name: 'Downtown Brewery',
          address: '456 Market St',
          rating: 4.2,
          priceLevel: 3,
          photoUrl: 'https://example.com/photo2.jpg',
        },
      ];
      setResults(mockResults);
    } catch (error) {
      console.error('Error searching bars:', error);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectBar = (bar: Bar) => {
    onSelectBar(bar);
    setQuery('');
    setResults([]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.searchContainer}>
        <MaterialIcons name="search" size={24} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.input}
          value={query}
          onChangeText={handleSearch}
          placeholder="Search for bars..."
          placeholderTextColor="#666"
        />
        {isSearching && <ActivityIndicator style={styles.loadingIndicator} />}
      </View>

      {results.length > 0 && (
        <View style={styles.resultsContainer}>
          {results.map((bar) => (
            <TouchableOpacity
              key={bar.id}
              style={styles.resultItem}
              onPress={() => handleSelectBar(bar)}
            >
              <View style={styles.resultInfo}>
                <Text style={styles.barName}>{bar.name}</Text>
                <Text style={styles.barAddress}>{bar.address}</Text>
              </View>
              <View style={styles.barMeta}>
                <Text style={styles.barRating}>
                  {bar.rating} ★
                </Text>
                <Text style={styles.barPrice}>
                  {'$'.repeat(bar.priceLevel)}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingIndicator: {
    marginLeft: 8,
  },
  resultsContainer: {
    marginTop: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
    maxHeight: 200,
  },
  resultItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultInfo: {
    flex: 1,
    marginRight: 8,
  },
  barName: {
    fontSize: 16,
    fontWeight: '500',
  },
  barAddress: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  barMeta: {
    alignItems: 'flex-end',
  },
  barRating: {
    fontSize: 14,
    color: '#FFB800',
    fontWeight: '500',
  },
  barPrice: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
});
