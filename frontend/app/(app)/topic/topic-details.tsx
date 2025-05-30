import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '../../../src/context/AuthContext';
import config from '../../../src/config';

const DEFAULT_PROFILE_PHOTO = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

interface Author {
  _id: string;
  firstName: string;
  lastName: string;
  profilePhoto?: string;
}

interface Reply {
  _id: string;
  content: string;
  author: Author;
  createdAt: string;
}

interface Topic {
  _id: string;
  title: string;
  content: string;
  author: Author;
  replies: Reply[];
  createdAt: string;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

export default function TopicDetailsScreen() {
  const { id } = useLocalSearchParams();
  const { token } = useAuth();
  const [topic, setTopic] = useState<Topic | null>(null);
  const [loading, setLoading] = useState(true);

  const navigateToProfile = (userId: string) => {
    router.push(`/user-profile?id=${userId}`);
  };

  useEffect(() => {
    const fetchTopic = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${config.apiBaseUrl}/topics/${id}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        const data = await response.json();
        if (response.ok && data.success) {
          setTopic(data.data);
        }
      } catch (error) {
        console.error('Error fetching topic:', error);
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchTopic();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.container, styles.centered]}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!topic) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text>Topic not found.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigateToProfile(topic.author._id)}>
          <Image
            source={{ uri: topic.author?.profilePhoto || DEFAULT_PROFILE_PHOTO }}
            style={styles.authorPhoto}
          />
        </TouchableOpacity>
        <View>
          <TouchableOpacity onPress={() => navigateToProfile(topic.author._id)}>
            <Text style={styles.authorName}>{topic.author?.firstName} {topic.author?.lastName}</Text>
          </TouchableOpacity>
          <Text style={styles.dateText}>Posted on {formatDate(topic.createdAt)}</Text>
        </View>
      </View>
      <Text style={styles.title}>{topic.title}</Text>
      <Text style={styles.content}>{topic.content}</Text>
      <Text style={styles.repliesHeader}>Replies</Text>
      {topic.replies && topic.replies.length > 0 ? (
        topic.replies.map((reply: Reply) => (
          <View key={reply._id} style={styles.replyCard}>
            <TouchableOpacity onPress={() => navigateToProfile(reply.author._id)}>
              <Image
                source={{ uri: reply.author?.profilePhoto || DEFAULT_PROFILE_PHOTO }}
                style={styles.replyAuthorPhoto}
              />
            </TouchableOpacity>
            <View style={styles.replyContent}>
              <View style={styles.replyHeader}>
                <TouchableOpacity onPress={() => navigateToProfile(reply.author._id)}>
                  <Text style={styles.replyAuthorName}>{reply.author?.firstName} {reply.author?.lastName}</Text>
                </TouchableOpacity>
                <Text style={styles.replyDate}>{formatDate(reply.createdAt)}</Text>
              </View>
              <Text style={styles.replyText}>{reply.content}</Text>
            </View>
          </View>
        ))
      ) : (
        <Text style={styles.noReplies}>No replies yet.</Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    padding: 16,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  authorPhoto: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
    borderWidth: 2,
    borderColor: '#fff',
  },
  authorName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    textDecorationLine: 'underline',
  },
  dateText: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 8,
  },
  content: {
    fontSize: 16,
    color: '#444',
    marginBottom: 24,
  },
  repliesHeader: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#007AFF',
  },
  replyCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  replyAuthorPhoto: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  replyContent: {
    flex: 1,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  replyAuthorName: {
    fontWeight: 'bold',
    color: '#333',
    textDecorationLine: 'underline',
  },
  replyDate: {
    fontSize: 12,
    color: '#666',
  },
  replyText: {
    color: '#444',
    fontSize: 15,
  },
  noReplies: {
    color: '#888',
    fontStyle: 'italic',
    marginTop: 8,
    marginBottom: 24,
  },
}); 