import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import config from '../../src/config';

interface Topic {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  replies: Array<any>;
}

export default function MyTopicsScreen() {
  const { user, token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchTopics = async (pageNum: number) => {
    if (!user?.id || !token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/topics?userId=${user.id}&page=${pageNum}&limit=10&sortBy=createdAt&sortOrder=desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        if (pageNum === 1) {
          setTopics(data.data);
        } else {
          setTopics(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics(1);
  }, [user?.id, token]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchTopics(page + 1);
    }
  };

  const handleLongPress = (topicId: string) => {
    setIsSelectionMode(true);
    setSelectedTopics([topicId]);
  };

  const handlePress = (topicId: string) => {
    if (isSelectionMode) {
      setSelectedTopics(prev => {
        if (prev.includes(topicId)) {
          const newSelected = prev.filter(id => id !== topicId);
          if (newSelected.length === 0) {
            setIsSelectionMode(false);
          }
          return newSelected;
        } else {
          return [...prev, topicId];
        }
      });
    } else {
      router.push(`/topic/topic-details?id=${topicId}` as any);
    }
  };

  const handleDelete = () => {
    if (selectedTopics.length === 0) return;

    // Use window.confirm for web
    const confirmMessage = `Are you sure you want to delete ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}?`;
    const isConfirmed = window.confirm(confirmMessage);

    if (isConfirmed) {
      const deleteTopics = async () => {
        try {
          setLoading(true);
          console.log('Starting delete process...');
          
          const deletePromises = selectedTopics.map(async (topicId) => {
            console.log(`Attempting to delete topic: ${topicId}`);
            const response = await fetch(`${config.apiBaseUrl}/topics/${topicId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete topic');
            }
            
            return response.json();
          });

          const results = await Promise.all(deletePromises);
          console.log('Delete results:', results);
          
          // Show success message
          window.alert(`Successfully deleted ${selectedTopics.length} topic${selectedTopics.length > 1 ? 's' : ''}`);
          
          setTopics(prev => prev.filter(topic => !selectedTopics.includes(topic._id)));
          setSelectedTopics([]);
          setIsSelectionMode(false);
        } catch (error) {
          console.error('Error deleting topics:', error);
          // Show error message
          window.alert(error instanceof Error ? error.message : 'Failed to delete topics. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      deleteTopics();
    }
  };

  const renderTopic = ({ item }: { item: Topic }) => (
    <TouchableOpacity
      style={[
        styles.topicItem,
        selectedTopics.includes(item._id) && styles.selectedTopic
      ]}
      onPress={() => handlePress(item._id)}
      onLongPress={() => handleLongPress(item._id)}
      delayLongPress={500}
    >
      <Text style={styles.topicTitle}>{item.title}</Text>
      <Text style={styles.topicMeta}>
        {new Date(item.createdAt).toLocaleDateString()} • {item.replies?.length || 0} replies
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={() => {
              setSelectedTopics([]);
              setIsSelectionMode(false);
            }} style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedTopics.length} selected
            </Text>
            <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
              <Text style={styles.deleteButtonText}>Delete</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
              <Text style={styles.backButtonText}>← Back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>My Topics</Text>
          </>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : topics.length > 0 ? (
        <FlatList
          data={topics}
          renderItem={renderTopic}
          keyExtractor={item => item._id}
          contentContainerStyle={styles.listContainer}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          ListFooterComponent={() => (
            loading && page > 1 ? (
              <ActivityIndicator style={styles.footerLoader} color="#007AFF" />
            ) : null
          )}
        />
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't created any topics yet</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    marginRight: 15,
  },
  backButtonText: {
    color: '#007AFF',
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  listContainer: {
    padding: 15,
  },
  topicItem: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topicTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginBottom: 4,
  },
  topicMeta: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  footerLoader: {
    paddingVertical: 20,
  },
  selectedTopic: {
    backgroundColor: '#e3f2fd',
    borderColor: '#2196f3',
    borderWidth: 1,
  },
  deleteButton: {
    marginLeft: 'auto',
  },
  deleteButtonText: {
    color: '#ff3b30',
    fontSize: 16,
    fontWeight: '500',
  },
}); 