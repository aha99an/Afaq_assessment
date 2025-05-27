import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import config from '../../src/config';
import { changePasswordStyles as styles } from '../../src/styles/change-password.styles';

interface ValidationError {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
}

export default function ChangePasswordScreen() {
  const { token } = useAuth();
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [serverError, setServerError] = useState('');
  const [validationErrors, setValidationErrors] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false,
    match: false
  });

  // Password validation regex
  const hasUpperCase = /[A-Z]/.test(newPassword);
  const hasLowerCase = /[a-z]/.test(newPassword);
  const hasNumber = /\d/.test(newPassword);
  const hasSpecial = /[@$!%*?&]/.test(newPassword);
  const hasMinLength = newPassword.length >= 8;

  // Check password match whenever either password changes
  useEffect(() => {
    if (newPassword && confirmPassword && newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      setValidationErrors(prev => ({ ...prev, match: true }));
    } else {
      setPasswordError('');
      setValidationErrors(prev => ({ ...prev, match: false }));
    }
  }, [newPassword, confirmPassword]);

  // Update validation errors when new password changes
  useEffect(() => {
    setValidationErrors({
      length: !hasMinLength,
      uppercase: !hasUpperCase,
      lowercase: !hasLowerCase,
      number: !hasNumber,
      special: !hasSpecial,
      match: newPassword !== confirmPassword
    });
  }, [newPassword]);

  const handleChangePassword = async () => {
    // Clear previous errors
    setServerError('');
    setPasswordError('');

    // Validate passwords
    if (!oldPassword || !newPassword || !confirmPassword) {
      Alert.alert('Error', 'Please fill in all password fields');
      return;
    }

    if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber || !hasSpecial) {
      Alert.alert('Error', 'Please ensure your new password meets all requirements');
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch(`${config.apiBaseUrl}/auth/change-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          oldPassword,
          newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        // Clear the form
        setOldPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setPasswordError('');
        setServerError('');
        setValidationErrors({
          length: false,
          uppercase: false,
          lowercase: false,
          number: false,
          special: false,
          match: false
        });
        
        // Directly navigate to profile page
        router.replace('/(app)/profile');
      } else {
        if (data.errors && Array.isArray(data.errors)) {
          // Handle validation errors from server
          const error = data.errors[0];
          if (error.path === 'newPassword') {
            setServerError(error.msg);
          } else {
            Alert.alert('Error', error.msg || 'Failed to change password');
          }
        } else {
          Alert.alert('Error', data.message || 'Failed to change password');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'An error occurred while changing password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Change Password</Text>
        
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>Current Password</Text>
            <View style={styles.passwordInputContainer}>
              <TextInput
                style={styles.passwordInput}
                value={oldPassword}
                onChangeText={setOldPassword}
                placeholder="Enter your current password"
                secureTextEntry={!showOldPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowOldPassword(!showOldPassword)}
              >
                <Ionicons 
                  name={showOldPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>New Password</Text>
            <View style={[
              styles.passwordInputContainer,
              serverError ? styles.errorInput : null
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={newPassword}
                onChangeText={(text) => {
                  setNewPassword(text);
                  setServerError(''); // Clear server error when user types
                }}
                placeholder="Enter new password"
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowNewPassword(!showNewPassword)}
              >
                <Ionicons 
                  name={showNewPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {serverError ? (
              <Text style={styles.errorText}>{serverError}</Text>
            ) : null}
            {newPassword.length > 0 && (
              <View style={styles.validationContainer}>
                <Text style={[styles.validationText, hasMinLength && styles.validText]}>
                  • At least 8 characters long
                </Text>
                <Text style={[styles.validationText, hasUpperCase && styles.validText]}>
                  • At least one uppercase letter
                </Text>
                <Text style={[styles.validationText, hasLowerCase && styles.validText]}>
                  • At least one lowercase letter
                </Text>
                <Text style={[styles.validationText, hasNumber && styles.validText]}>
                  • At least one number
                </Text>
                <Text style={[styles.validationText, hasSpecial && styles.validText]}>
                  • At least one special character (@$!%*?&)
                </Text>
              </View>
            )}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Confirm New Password</Text>
            <View style={[
              styles.passwordInputContainer,
              passwordError ? styles.errorInput : null
            ]}>
              <TextInput
                style={styles.passwordInput}
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                placeholder="Confirm new password"
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                <Ionicons 
                  name={showConfirmPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {passwordError ? (
              <Text style={styles.errorText}>{passwordError}</Text>
            ) : null}
          </View>

          <TouchableOpacity
            style={[styles.button, loading && styles.disabledButton]}
            onPress={handleChangePassword}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Changing Password...' : 'Change Password'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, { backgroundColor: '#FF3B30' }]}
            onPress={() => router.back()}
          >
            <Text style={styles.buttonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
} 