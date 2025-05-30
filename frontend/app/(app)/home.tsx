import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Image } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import config from '../../src/config';

interface ReplyAuthor {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  profilePhoto: string;
  githubUrl: string;
  country: string;
}

interface Reply {
  _id: string;
  content: string;
  author: ReplyAuthor;
  topic: string;
  createdAt: string;
  updatedAt: string;
}

interface Topic {
  _id: string;
  title: string;
  content: string;
  author: {
    _id: string;
    firstName: string;
    lastName: string;
    profilePhoto: string;
  };
  views: number;
  replies: Reply[];
  createdAt: string;
  updatedAt: string;
}

interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

const DEFAULT_PROFILE_PHOTO = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const ReplyAuthors = ({ replies }: { replies: Reply[] }) => {
  const [selectedAuthor, setSelectedAuthor] = useState<string | null>(null);
  const uniqueAuthors = Array.from(new Set(replies.map(reply => reply.author._id)))
    .map(id => replies.find(reply => reply.author._id === id)?.author)
    .filter((author): author is ReplyAuthor => author !== undefined)
    .slice(0, 5);

  return (
    <View style={styles.replyAuthorsContainer}>
      {uniqueAuthors.map((author) => (
        <TouchableOpacity
          key={author._id}
          style={styles.replyAuthorWrapper}
          onPress={() => setSelectedAuthor(selectedAuthor === author._id ? null : author._id)}
        >
          <Image
            source={{ uri: author.profilePhoto || DEFAULT_PROFILE_PHOTO }}
            style={styles.replyAuthorPhoto}
          />
          {selectedAuthor === author._id && (
            <View style={styles.replyAuthorTooltip}>
              <Text style={styles.replyAuthorEmail}>{author.email}</Text>
            </View>
          )}
        </TouchableOpacity>
      ))}
      {replies.length > 5 && (
        <View style={styles.moreReplies}>
          <Text style={styles.moreRepliesText}>+{replies.length - 5}</Text>
        </View>
      )}
    </View>
  );
};

const formatActivityTime = (dateString: string) => {
  const now = new Date();
  const updatedAt = new Date(dateString);
  const diffInMs = now.getTime() - updatedAt.getTime();
  
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

  if (diffInMinutes < 60) {
    return `active ${diffInMinutes}m ago`;
  } else if (diffInHours < 24) {
    return `active ${diffInHours}h ago`;
  } else if (diffInDays < 7) {
    const remainingHours = Math.floor((diffInMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    if (remainingHours > 0) {
      return `active ${diffInDays}d ${remainingHours}h ago`;
    }
    return `active ${diffInDays}d ago`;
  } else {
    return `active ${Math.floor(diffInDays / 7)}w ago`;
  }
};

export default function HomeScreen() {
  const { token } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState<PaginationData>({
    total: 0,
    page: 1,
    limit: 10,
    totalPages: 0,
  });

  const fetchTopics = async (page: number) => {
    try {
      setLoading(true);
      const response = await fetch(
        `${config.apiBaseUrl}/topics?page=${page}&limit=${pagination.limit}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const data = await response.json();

      if (response.ok && data.success) {
        setTopics(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Error fetching topics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTopics(1);
  }, []);

  const handlePageChange = (newPage: number) => {
    if (newPage >= 1 && newPage <= pagination.totalPages) {
      fetchTopics(newPage);
    }
  };

  if (loading && topics.length === 0) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Topics</Text>
        <TouchableOpacity 
          style={styles.newTopicButton}
          onPress={() => router.push('/topic/new-topic')}
        >
          <Text style={styles.newTopicButtonText}>New Topic</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.topicsList}>
        {topics.map((topic, index) => (
          <TouchableOpacity
            key={topic._id}
            style={styles.topicCard}
            onPress={() => router.push(`../../app/(app)/topic/${topic._id}`)}
          >
            <View style={styles.topicHeader}>
              <View style={styles.topicNumberContainer}>
                <Text style={styles.topicNumber}>#{((pagination.page - 1) * pagination.limit) + index + 1}</Text>
              </View>
              <Text style={styles.activityTime}>{formatActivityTime(topic.updatedAt)}</Text>
            </View>

            <Text style={styles.topicTitle}>{topic.title}</Text>

            <View style={styles.topicStats}>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{topic.views}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.stat}>
                <Text style={styles.statValue}>{topic.replies.length}</Text>
                <Text style={styles.statLabel}>Replies</Text>
              </View>
            </View>

            {topic.replies.length > 0 && (
              <View style={styles.repliesSection}>
                <Text style={styles.repliesLabel}>Recent Replies:</Text>
                <ReplyAuthors replies={topic.replies} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>

      <View style={styles.pagination}>
        <TouchableOpacity
          style={[styles.pageButton, pagination.page === 1 && styles.disabledButton]}
          onPress={() => handlePageChange(pagination.page - 1)}
          disabled={pagination.page === 1}
        >
          <Text style={styles.pageButtonText}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageInfo}>
          Page {pagination.page} of {pagination.totalPages}
        </Text>

        <TouchableOpacity
          style={[styles.pageButton, pagination.page === pagination.totalPages && styles.disabledButton]}
          onPress={() => handlePageChange(pagination.page + 1)}
          disabled={pagination.page === pagination.totalPages}
        >
          <Text style={styles.pageButtonText}>Next</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    backgroundColor: '#fff',
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  newTopicButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  newTopicButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  topicsList: {
    flex: 1,
    padding: 15,
  },
  topicCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  topicHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  topicNumberContainer: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  topicNumber: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  activityTime: {
    fontSize: 12,
    color: '#666',
  },
  topicTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  topicStats: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    paddingTop: 10,
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 20,
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#007AFF',
    marginRight: 5,
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  pageButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  pageButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  pageInfo: {
    fontSize: 14,
    color: '#666',
  },
  repliesSection: {
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  repliesLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  replyAuthorsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  replyAuthorWrapper: {
    marginRight: -8,
    position: 'relative',
  },
  replyAuthorPhoto: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  replyAuthorTooltip: {
    position: 'absolute',
    bottom: '100%',
    left: '50%',
    transform: [{ translateX: -50 }],
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 6,
    borderRadius: 4,
    marginBottom: 4,
    zIndex: 1,
    minWidth: 100,
    alignItems: 'center',
  },
  replyAuthorEmail: {
    color: '#fff',
    fontSize: 12,
    textAlign: 'center',
  },
  moreReplies: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  moreRepliesText: {
    fontSize: 12,
    color: '#666',
  },
}); 