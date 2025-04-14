import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, ActivityIndicator } from 'react-native';
import { useState } from 'react';
import { useContactStore } from '@/lib/store';
import { router } from 'expo-router';

export default function AddContactScreen() {
  const addContact = useContactStore(state => state.addContact);
  const loading = useContactStore(state => state.loading);
  const error = useContactStore(state => state.error);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    frequency: 'weekly',
  });

  const frequencies = ['daily', 'weekly', 'monthly', 'quarterly'];

  const handleSubmit = async () => {
    await addContact(formData);
    if (!error) {
      router.push('/(tabs)/');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.form}>
        {error && (
          <Text style={styles.errorText}>{error}</Text>
        )}

        <Text style={styles.label}>Name</Text>
        <TextInput
          style={styles.input}
          value={formData.name}
          onChangeText={(text) => setFormData({ ...formData, name: text })}
          placeholder="Enter name"
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          style={styles.input}
          value={formData.email}
          onChangeText={(text) => setFormData({ ...formData, email: text })}
          placeholder="Enter email"
          keyboardType="email-address"
        />

        <Text style={styles.label}>Phone</Text>
        <TextInput
          style={styles.input}
          value={formData.phone}
          onChangeText={(text) => setFormData({ ...formData, phone: text })}
          placeholder="Enter phone number"
          keyboardType="phone-pad"
        />

        <Text style={styles.label}>Contact Frequency</Text>
        <View style={styles.frequencyButtons}>
          {frequencies.map((freq) => (
            <TouchableOpacity
              key={freq}
              style={[
                styles.frequencyButton,
                formData.frequency === freq && styles.frequencyButtonActive,
              ]}
              onPress={() => setFormData({ ...formData, frequency: freq })}>
              <Text
                style={[
                  styles.frequencyButtonText,
                  formData.frequency === freq && styles.frequencyButtonTextActive,
                ]}>
                {freq.charAt(0).toUpperCase() + freq.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity 
          style={[styles.submitButton, loading && styles.submitButtonDisabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.submitButtonText}>Add Contact</Text>
          )}
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  form: {
    padding: 16,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  input: {
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    fontSize: 16,
  },
  frequencyButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 24,
  },
  frequencyButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
    backgroundColor: '#E5E5EA',
  },
  frequencyButtonActive: {
    backgroundColor: '#007AFF',
  },
  frequencyButtonText: {
    color: '#000',
    fontSize: 14,
  },
  frequencyButtonTextActive: {
    color: 'white',
  },
  submitButton: {
    backgroundColor: '#007AFF',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    fontSize: 14,
  },
});