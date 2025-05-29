import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import config from '../../src/config';
import { authStyles as styles } from '../../src/styles/auth.styles';

interface ValidationError {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
}

export default function SigninScreen() {
  const { signin } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSignin = async () => {
    try {
      setLoading(true);
      setErrors({});
      setGeneralError('');

      const response = await fetch(`${config.apiBaseUrl}/auth/signin`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        if (data.success && data.data) {
          await signin(data.data.token, data.data.user);
          router.replace('/(app)/profile');
        } else {
          setGeneralError('Invalid response format from server');
        }
      } else {
        if (data.errors) {
          // Handle validation errors
          const newErrors: { [key: string]: string } = {};
          data.errors.forEach((error: ValidationError) => {
            newErrors[error.path] = error.msg;
          });
          setErrors(newErrors);
        } else if (data.message) {
          // Handle general error message
          setGeneralError(data.message);
        } else {
          setGeneralError('Failed to sign in');
        }
      }
    } catch (error) {
      setGeneralError('An error occurred while signing in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={60}
    >
      <ScrollView style={styles.container} keyboardShouldPersistTaps="handled">
        <View style={styles.form}>
          <Text style={styles.title}>Sign In</Text>
          
          {generalError ? (
            <View style={styles.errorContainer}>
              <Text style={styles.generalErrorText}>{generalError}</Text>
            </View>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                if (errors.email) {
                  setErrors(prev => ({ ...prev, email: '' }));
                }
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) {
                    setErrors(prev => ({ ...prev, password: '' }));
                  }
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity 
                style={styles.eyeIcon}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons 
                  name={showPassword ? "eye-off" : "eye"} 
                  size={24} 
                  color="#666"
                />
              </TouchableOpacity>
            </View>
            {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Signing in...' : 'Sign In'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/(auth)/signup')}
          >
            <Text style={styles.linkText}>Don't have an account? Sign up</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 