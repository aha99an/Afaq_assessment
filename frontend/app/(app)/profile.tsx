import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, TextInput, Alert } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import * as ImagePicker from 'expo-image-picker';
import config from '../../src/config';

const DEFAULT_PROFILE_PHOTO = 'https://www.gravatar.com/avatar/00000000000000000000000000000000?d=mp&f=y';

export default function ProfileScreen() {
  const { user, token, login, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [editedUser, setEditedUser] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    country: user?.country || '',
    githubUrl: user?.githubUrl || '',
    profilePhoto: user?.profilePhoto || '',
  });
  const [loading, setLoading] = useState(false);

  const handleLogout = async () => {
    await logout();
    router.replace('/(auth)/login');
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

      const response = await fetch(`${config.apiBaseUrl}/auth/update-profile`, {
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
        await login(token, data.user);
        setIsEditing(false);
        Alert.alert('Success', 'Profile updated successfully');
      } else {
        Alert.alert('Error', data.message || 'Failed to update profile');
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while updating profile');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
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
          ) : (
            <View style={styles.editActions}>
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
                <TextInput
                  style={styles.input}
                  value={editedUser.country}
                  onChangeText={(text) => setEditedUser(prev => ({ ...prev, country: text }))}
                  placeholder="Enter your country"
                />
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
      </View>

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
  editActions: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelButton: {
    backgroundColor: '#FF3B30',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  saveButton: {
    backgroundColor: '#34C759',
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  disabledButton: {
    opacity: 0.5,
  },
  cancelButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: 'bold',
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
}); 