import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, Alert, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { router } from 'expo-router';
import { useAuth } from '../../src/context/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import config from '../../src/config';
import { authStyles as styles } from '../../src/styles/auth.styles';

interface ValidationError {
  type: string;
  value: string;
  msg: string;
  path: string;
  location: string;
}

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

export default function SignupScreen() {
  const { signin } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [country, setCountry] = useState('');
  const [githubUrl, setGithubUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [generalError, setGeneralError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSignup = async () => {
    try {
      setLoading(true);
      setErrors({});
      setGeneralError('');

      // Check if passwords match
      if (password !== confirmPassword) {
        setErrors(prev => ({
          ...prev,
          confirmPassword: 'Passwords do not match'
        }));
        setLoading(false);
        return;
      }

      const response = await fetch(`${config.apiBaseUrl}/auth/signup`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          firstName,
          lastName,
          email,
          password,
          country,
          githubUrl,
        }),
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
          setGeneralError('Failed to sign up');
        }
      }
    } catch (error) {
      setGeneralError('An error occurred during signup');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
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
          <Text style={styles.title}>Create Account</Text>
          
          {generalError ? (
            <Text style={styles.errorText}>{generalError}</Text>
          ) : null}

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.firstName && styles.inputError]}
              placeholder="First Name"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                clearError('firstName');
              }}
              autoCapitalize="words"
            />
            {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.lastName && styles.inputError]}
              placeholder="Last Name"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                clearError('lastName');
              }}
              autoCapitalize="words"
            />
            {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.email && styles.inputError]}
              placeholder="Email"
              value={email}
              onChangeText={(text) => {
                setEmail(text);
                clearError('email');
              }}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>Country</Text>
            <View style={[styles.pickerContainer, errors.country && styles.inputError]}>
              <Picker
                selectedValue={country}
                onValueChange={(value) => {
                  setCountry(value);
                  clearError('country');
                }}
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
            {errors.country && <Text style={styles.errorText}>{errors.country}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <TextInput
              style={[styles.input, errors.githubUrl && styles.inputError]}
              placeholder="GitHub Profile URL"
              value={githubUrl}
              onChangeText={(text) => {
                setGithubUrl(text);
                clearError('githubUrl');
              }}
              autoCapitalize="none"
              keyboardType="url"
            />
            {errors.githubUrl && <Text style={styles.errorText}>{errors.githubUrl}</Text>}
          </View>

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.password && styles.inputError]}
                placeholder="Password"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  clearError('password');
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

          <View style={styles.inputContainer}>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.passwordInput, errors.confirmPassword && styles.inputError]}
                placeholder="Confirm Password"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  clearError('confirmPassword');
                }}
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
            {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}
          </View>

          <TouchableOpacity 
            style={[styles.button, loading && styles.buttonDisabled]} 
            onPress={handleSignup}
            disabled={loading}
          >
            <Text style={styles.buttonText}>{loading ? 'Creating Account...' : 'Sign Up'}</Text>
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.linkButton} 
            onPress={() => router.push('/(auth)/signin')}
          >
            <Text style={styles.linkText}>Already have an account? Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
} 