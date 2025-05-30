import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import config from '../../src/config';

interface Reply {
  _id: string;
  content: string;
  createdAt: string;
  topic: {
    _id: string;
    title: string;
  };
}

export default function MyRepliesScreen() {
  const { user, token } = useAuth();
  const [replies, setReplies] = useState<Reply[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedReplies, setSelectedReplies] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  const fetchReplies = async (pageNum: number) => {
    if (!user?.id || !token) return;

    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/replies?userId=${user.id}&page=${pageNum}&limit=10&sortBy=createdAt&sortOrder=desc`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        if (pageNum === 1) {
          setReplies(data.data);
        } else {
          setReplies(prev => [...prev, ...data.data]);
        }
        setHasMore(data.data.length === 10);
      }
    } catch (error) {
      console.error('Error fetching replies:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReplies(1);
  }, [user?.id, token]);

  const loadMore = () => {
    if (!loading && hasMore) {
      setPage(prev => prev + 1);
      fetchReplies(page + 1);
    }
  };

  const handleLongPress = (replyId: string) => {
    setIsSelectionMode(true);
    setSelectedReplies([replyId]);
  };

  const handlePress = (replyId: string) => {
    if (isSelectionMode) {
      setSelectedReplies(prev => {
        if (prev.includes(replyId)) {
          const newSelected = prev.filter(id => id !== replyId);
          if (newSelected.length === 0) {
            setIsSelectionMode(false);
          }
          return newSelected;
        } else {
          return [...prev, replyId];
        }
      });
    } else {
      const reply = replies.find(r => r._id === replyId);
      if (reply) {
        router.push(`/topic/topic-details?id=${reply.topic._id}` as any);
      }
    }
  };

  const handleDelete = () => {
    if (selectedReplies.length === 0) return;

    const confirmMessage = `Are you sure you want to delete ${selectedReplies.length} reply${selectedReplies.length > 1 ? 's' : ''}?`;
    const isConfirmed = window.confirm(confirmMessage);

    if (isConfirmed) {
      const deleteReplies = async () => {
        try {
          setLoading(true);
          
          const deletePromises = selectedReplies.map(async (replyId) => {
            const response = await fetch(`${config.apiBaseUrl}/replies/${replyId}`, {
              method: 'DELETE',
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || 'Failed to delete reply');
            }
            
            return response.json();
          });

          await Promise.all(deletePromises);
          
          window.alert(`Successfully deleted ${selectedReplies.length} reply${selectedReplies.length > 1 ? 's' : ''}`);
          
          setReplies(prev => prev.filter(reply => !selectedReplies.includes(reply._id)));
          setSelectedReplies([]);
          setIsSelectionMode(false);
        } catch (error) {
          console.error('Error deleting replies:', error);
          window.alert(error instanceof Error ? error.message : 'Failed to delete replies. Please try again.');
        } finally {
          setLoading(false);
        }
      };

      deleteReplies();
    }
  };

  const renderReply = ({ item }: { item: Reply }) => (
    <TouchableOpacity
      style={[
        styles.replyItem,
        selectedReplies.includes(item._id) && styles.selectedReply
      ]}
      onPress={() => handlePress(item._id)}
      onLongPress={() => handleLongPress(item._id)}
      delayLongPress={500}
    >
      <Text style={styles.replyContent} numberOfLines={3}>
        {item.content}
      </Text>
      <Text style={styles.replyMeta}>
        On topic: {item.topic.title} • {new Date(item.createdAt).toLocaleDateString()}
      </Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        {isSelectionMode ? (
          <>
            <TouchableOpacity onPress={() => {
              setSelectedReplies([]);
              setIsSelectionMode(false);
            }} style={styles.backButton}>
              <Text style={styles.backButtonText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>
              {selectedReplies.length} selected
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
            <Text style={styles.headerTitle}>My Replies</Text>
          </>
        )}
      </View>

      {loading && page === 1 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      ) : replies.length > 0 ? (
        <FlatList
          data={replies}
          renderItem={renderReply}
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
          <Text style={styles.emptyText}>You haven't made any replies yet</Text>
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
  replyItem: {
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
  replyContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 8,
  },
  replyMeta: {
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
  selectedReply: {
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