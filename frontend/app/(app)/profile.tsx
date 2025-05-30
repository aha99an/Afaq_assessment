import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import { Picker } from '@react-native-picker/picker';
import config from '../../src/config';

// Add interfaces for our data types
interface Topic {
  _id: string;
  title: string;
  content: string;
  createdAt: string;
  replies: Array<any>;
}

interface Reply {
  _id: string;
  content: string;
  createdAt: string;
  topic: {
    _id: string;
    title: string;
  };
}

// Use the User type from auth context
type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  country?: string;
  githubUrl?: string;
  profilePhoto?: string;
  joinDate: string;
};

const DEFAULT_PROFILE_PHOTO = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

const COUNTRIES = [
  // North America
  { label: 'North America', value: 'NA', disabled: true },
  { label: 'United States', value: 'United States' },
  { label: 'Canada', value: 'Canada' },
  { label: 'Mexico', value: 'Mexico' },
  
  // South America
  { label: 'South America', value: 'SA', disabled: true },
  { label: 'Brazil', value: 'Brazil' },
  { label: 'Argentina', value: 'Argentina' },
  { label: 'Colombia', value: 'Colombia' },
  { label: 'Peru', value: 'Peru' },
  { label: 'Chile', value: 'Chile' },
  
  // Europe
  { label: 'Europe', value: 'EU', disabled: true },
  { label: 'United Kingdom', value: 'United Kingdom' },
  { label: 'France', value: 'France' },
  { label: 'Germany', value: 'Germany' },
  { label: 'Italy', value: 'Italy' },
  { label: 'Spain', value: 'Spain' },
  { label: 'Netherlands', value: 'Netherlands' },
  { label: 'Switzerland', value: 'Switzerland' },
  { label: 'Sweden', value: 'Sweden' },
  { label: 'Norway', value: 'Norway' },
  { label: 'Denmark', value: 'Denmark' },
  
  // Africa
  { label: 'Africa', value: 'AF', disabled: true },
  { label: 'South Africa', value: 'South Africa' },
  { label: 'Egypt', value: 'Egypt' },
  { label: 'Nigeria', value: 'Nigeria' },
  { label: 'Kenya', value: 'Kenya' },
  { label: 'Morocco', value: 'Morocco' },
  { label: 'Ethiopia', value: 'Ethiopia' },
  { label: 'Ghana', value: 'Ghana' },
  { label: 'Tanzania', value: 'Tanzania' },
];

export default function ProfileScreen() {
  const { user, token, signin, updateUser, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    country: user?.country || '',
    githubUrl: user?.githubUrl || '',
    profilePhoto: user?.profilePhoto || '',
  });
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [userTopics, setUserTopics] = useState<Topic[]>([]);
  const [userReplies, setUserReplies] = useState<Reply[]>([]);
  const [topicsLoading, setTopicsLoading] = useState(true);
  const [repliesLoading, setRepliesLoading] = useState(true);

  // Fetch user data and topics when component mounts
  useEffect(() => {
    const fetchData = async () => {
      if (!user && token) {
        try {
          const response = await fetch(`${config.apiBaseUrl}/auth/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          });

          const data = await response.json();

          if (response.ok && data.success && data.data) {
            await signin(token, data.data);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
        }
      }
      setInitialLoading(false);
    };

    fetchData();
  }, [user, token, signin]);

  // Fetch user's topics
  useEffect(() => {
    const fetchUserTopics = async () => {
      if (user?.id && token) {
        try {
          setTopicsLoading(true);
          const response = await fetch(
            `${config.apiBaseUrl}/topics?userId=${user.id}&limit=2&sortBy=createdAt&sortOrder=desc`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            setUserTopics(data.data);
          }
        } catch (error) {
          console.error('Error fetching user topics:', error);
        } finally {
          setTopicsLoading(false);
        }
      }
    };

    fetchUserTopics();
  }, [user?.id, token]);

  // Fetch user's replies
  useEffect(() => {
    const fetchUserReplies = async () => {
      if (user?.id && token) {
        try {
          setRepliesLoading(true);
          const response = await fetch(
            `${config.apiBaseUrl}/replies?userId=${user.id}&limit=2&sortBy=createdAt&sortOrder=desc`,
            {
              headers: {
                'Authorization': `Bearer ${token}`,
              },
            }
          );

          const data = await response.json();

          if (response.ok && data.success) {
            setUserReplies(data.data);
          }
        } catch (error) {
          console.error('Error fetching user replies:', error);
        } finally {
          setRepliesLoading(false);
        }
      }
    };

    fetchUserReplies();
  }, [user?.id, token]);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/signin');
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setEditedUser({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      country: user?.country || '',
      githubUrl: user?.githubUrl || '',
      profilePhoto: user?.profilePhoto || '',
    });
    setIsEditing(false);
  };

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.5,
    });

    if (!result.canceled) {
      setEditedUser(prev => ({
        ...prev,
        profilePhoto: result.assets[0].uri
      }));
    }
  };

  const handleUpdateProfile = async () => {
    try {
      setLoading(true);

      const response = await fetch(`${config.apiBaseUrl}/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          firstName: editedUser.firstName,
          lastName: editedUser.lastName,
          country: editedUser.country,
          githubUrl: editedUser.githubUrl,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Update the user data in context
        if (token) {
          await updateUser(data.data.user);
          setIsEditing(false);
          Alert.alert('Success', 'Profile updated successfully');
        } else {
          Alert.alert('Error', 'Authentication token is missing');
        }
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!user) {
    router.replace('/(auth)/signin');
    return null;
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={isEditing ? pickImage : undefined}>
          <Image
            source={{ uri: editedUser.profilePhoto || DEFAULT_PROFILE_PHOTO }}
            style={styles.profilePhoto}
          />
          {isEditing && (
            <View style={styles.editPhotoOverlay}>
              <Text style={styles.editPhotoText}>Change Photo</Text>
            </View>
          )}
        </TouchableOpacity>
        {!isEditing ? (
          <>
            <Text style={styles.name}>{`${user.firstName} ${user.lastName}`}</Text>
            <Text style={styles.email}>{user.email}</Text>
          </>
        ) : (
          <View style={styles.editNameContainer}>
            <TextInput
              style={styles.nameInput}
              value={editedUser.firstName}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, firstName: text }))}
              placeholder="First Name"
            />
            <TextInput
              style={styles.nameInput}
              value={editedUser.lastName}
              onChangeText={(text) => setEditedUser(prev => ({ ...prev, lastName: text }))}
              placeholder="Last Name"
            />
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Personal Information</Text>
          {!isEditing ? (
            <TouchableOpacity onPress={handleEdit} style={styles.editButton}>
              <Text style={styles.editButtonText}>Edit Profile</Text>
            </TouchableOpacity>
          ) : null}
        </View>

        <View style={styles.infoCard}>
          {!isEditing ? (
            <>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Full Name</Text>
                <Text style={styles.value}>{`${user.firstName} ${user.lastName}`}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Email</Text>
                <Text style={styles.value}>{user.email}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Country</Text>
                <Text style={styles.value}>{user.country || 'Not specified'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>GitHub Profile</Text>
                <Text style={styles.value}>{user.githubUrl || 'Not specified'}</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.label}>Member Since</Text>
                <Text style={styles.value}>
                  {new Date(user.joinDate).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </Text>
              </View>
            </>
          ) : (
            <>
              <View style={styles.editField}>
                <Text style={styles.label}>Country</Text>
                <View style={styles.pickerContainer}>
                  <Picker
                    selectedValue={editedUser.country}
                    onValueChange={(value) => setEditedUser(prev => ({ ...prev, country: value }))}
                    style={styles.picker}
                  >
                    <Picker.Item label="Select your country" value="" />
                    {COUNTRIES.map((item, index) => (
                      <Picker.Item
                        key={index}
                        label={item.label}
                        value={item.value}
                        enabled={!item.disabled}
                        color={item.disabled ? '#666' : '#000'}
                      />
                    ))}
                  </Picker>
                </View>
              </View>

              <View style={styles.editField}>
                <Text style={styles.label}>GitHub Profile</Text>
                <TextInput
                  style={styles.input}
                  value={editedUser.githubUrl}
                  onChangeText={(text) => setEditedUser(prev => ({ ...prev, githubUrl: text }))}
                  placeholder="Enter your GitHub URL"
                  autoCapitalize="none"
                />
              </View>
            </>
          )}
        </View>

        {isEditing && (
          <View style={styles.editActionsContainer}>
            <TouchableOpacity onPress={handleCancel} style={styles.cancelButton}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              onPress={handleUpdateProfile} 
              style={[styles.saveButton, loading && styles.disabledButton]}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Saving...' : 'Save Changes'}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Topics</Text>
          <TouchableOpacity 
            onPress={() => router.push('/topics' as any)}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          {topicsLoading ? (
            <Text style={styles.loadingText}>Loading topics...</Text>
          ) : userTopics.length > 0 ? (
            userTopics.map((topic) => (
              <TouchableOpacity
                key={topic._id}
                style={styles.topicItem}
                onPress={() => router.push(`/topic/topic-details?id=${topic._id}` as any)}
              >
                <Text style={styles.topicTitle}>{topic.title}</Text>
                <Text style={styles.topicMeta}>
                  {new Date(topic.createdAt).toLocaleDateString()} • {topic.replies?.length || 0} replies
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTopicsText}>You haven't created any topics yet</Text>
          )}
        </View>
      </View>

      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>My Replies</Text>
          <TouchableOpacity 
            onPress={() => router.push('/replies' as any)}
            style={styles.viewAllButton}
          >
            <Text style={styles.viewAllButtonText}>View All</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.infoCard}>
          {repliesLoading ? (
            <Text style={styles.loadingText}>Loading replies...</Text>
          ) : userReplies.length > 0 ? (
            userReplies.map((reply) => (
              <TouchableOpacity
                key={reply._id}
                style={styles.replyItem}
                onPress={() => router.push(`/topic/topic-details?id=${reply.topic._id}` as any)}
              >
                <Text style={styles.replyContent} numberOfLines={2}>
                  {reply.content}
                </Text>
                <Text style={styles.replyMeta}>
                  On topic: {reply.topic.title} • {new Date(reply.createdAt).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            <Text style={styles.noTopicsText}>You haven't made any replies yet</Text>
          )}
        </View>
      </View>

      <TouchableOpacity 
        style={[styles.button, { backgroundColor: '#007AFF', marginBottom: 10 }]} 
        onPress={() => router.push('/(app)/change-password')}
      >
        <Text style={styles.buttonText}>Change Password</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
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
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    marginBottom: 15,
    backgroundColor: '#e0e0e0',
  },
  editPhotoOverlay: {
    position: 'absolute',
    bottom: 15,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 8,
    borderRadius: 20,
  },
  editPhotoText: {
    color: '#fff',
    textAlign: 'center',
    fontSize: 12,
  },
  name: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  email: {
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  editNameContainer: {
    width: '100%',
    paddingHorizontal: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    marginBottom: 10,
    fontSize: 16,
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  editButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  editButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  editActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 20,
    marginTop: 20,
    paddingHorizontal: 20,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 120,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  editField: {
    marginBottom: 15,
  },
  label: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
  },
  value: {
    fontSize: 16,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 5,
    padding: 10,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#FF3B30',
    margin: 20,
    padding: 15,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    backgroundColor: '#fff',
    overflow: 'hidden',
    marginBottom: 15,
  },
  picker: {
    height: 50,
  },
  viewAllButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  viewAllButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  topicItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
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
  loadingText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  noTopicsText: {
    textAlign: 'center',
    color: '#666',
    padding: 20,
  },
  replyItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  replyContent: {
    fontSize: 16,
    color: '#333',
    marginBottom: 4,
  },
  replyMeta: {
    fontSize: 14,
    color: '#666',
  },
}); 