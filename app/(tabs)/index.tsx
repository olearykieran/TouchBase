import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  RefreshControl,
  Share,
  Linking,
  Platform,
  Alert,
} from 'react-native';
import { useEffect, useState } from 'react';
import { Phone, Mail, Clock, MessageCircle } from 'lucide-react-native';
import { useContactStore } from '@/lib/store';
import { formatDistanceToNow } from 'date-fns';
import { supabase } from '@/lib/supabase';

export default function ContactsScreen() {
  const { contacts, loading, error, fetchContacts, updateLastContact } =
    useContactStore();
  const [refreshing, setRefreshing] = useState(false);
  const [generatingMessage, setGeneratingMessage] = useState<string | null>(
    null
  );

  useEffect(() => {
    fetchContacts();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchContacts();
    setRefreshing(false);
  };

  const handleMessageGeneration = async (contact) => {
    try {
      setGeneratingMessage(contact.id);
      console.log('Fetching last message for contact:', contact.id);

      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('content')
        .eq('contact_id', contact.id)
        .order('created_at', { ascending: false })
        .limit(1);

      if (messagesError) {
        console.error('Error fetching messages:', messagesError);
        throw messagesError;
      }

      const lastMessage = messages?.[0]?.content;
      console.log('Last message found:', lastMessage ? 'yes' : 'no');

      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw new Error('Authentication failed');
      }
      if (!session) {
        console.error('No session found');
        throw new Error('Please sign in again');
      }

      console.log('Making request to generate message');
      const response = await fetch(
        `${process.env.EXPO_PUBLIC_SUPABASE_URL}/functions/v1/generate-message`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ contact, lastMessage }),
        }
      );

      const responseData = await response.json();
      console.log('Response received:', responseData);

      if (!response.ok) {
        throw new Error(
          responseData.error ||
            responseData.details ||
            'Failed to generate message'
        );
      }

      const { message } = responseData;
      if (!message) {
        throw new Error('No message was generated');
      }

      console.log('Saving generated message');
      const { error: insertError } = await supabase.from('messages').insert({
        contact_id: contact.id,
        content: message,
      });

      if (insertError) {
        console.error('Error saving message:', insertError);
        throw insertError;
      }

      await updateLastContact(contact.id);
      await fetchContacts();

      // Handle sharing based on platform
      if (Platform.OS === 'web') {
        await Share.share({
          title: 'Message',
          text: message,
        });
      } else {
        // On mobile, open SMS if phone number exists, otherwise share
        if (contact.phone) {
          const smsUrl = `sms:${contact.phone}${
            Platform.OS === 'ios' ? '&' : '?'
          }body=${encodeURIComponent(message)}`;
          const canOpen = await Linking.canOpenURL(smsUrl);

          if (canOpen) {
            await Linking.openURL(smsUrl);
          } else {
            await Share.share({
              message: message,
            });
          }
        } else {
          await Share.share({
            message: message,
          });
        }
      }
    } catch (error) {
      console.error('Error generating message:', error);
      Alert.alert(
        'Error',
        error instanceof Error
          ? error.message
          : 'Failed to generate message. Please try again later.'
      );
    } finally {
      setGeneratingMessage(null);
    }
  };

  const handlePhonePress = async (phone) => {
    if (phone) {
      const phoneUrl = `tel:${phone}`;
      const canOpen = await Linking.canOpenURL(phoneUrl);
      if (canOpen) {
        await Linking.openURL(phoneUrl);
      }
    }
  };

  const handleEmailPress = async (email) => {
    if (email) {
      const emailUrl = `mailto:${email}`;
      const canOpen = await Linking.canOpenURL(emailUrl);
      if (canOpen) {
        await Linking.openURL(emailUrl);
      }
    }
  };

  const renderContact = ({ item }) => (
    <TouchableOpacity style={styles.contactCard}>
      <View style={styles.contactInfo}>
        <Text style={styles.name}>{item.name}</Text>
        <View style={styles.contactDetails}>
          {item.phone && <Text style={styles.contactText}>{item.phone}</Text>}
          {item.email && <Text style={styles.contactText}>{item.email}</Text>}
        </View>
        <View style={styles.actionRow}>
          {item.phone && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handlePhonePress(item.phone)}
            >
              <Phone size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          {item.email && (
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => handleEmailPress(item.email)}
            >
              <Mail size={20} color="#007AFF" />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[
              styles.messageButton,
              generatingMessage === item.id && styles.messageButtonGenerating,
            ]}
            onPress={() => handleMessageGeneration(item)}
            disabled={generatingMessage === item.id}
          >
            {generatingMessage === item.id ? (
              <ActivityIndicator color="white" size="small" />
            ) : (
              <>
                <MessageCircle size={20} color="white" />
                <Text style={styles.messageButtonText}>Generate Message</Text>
              </>
            )}
          </TouchableOpacity>
          <View style={styles.nextContact}>
            <Clock size={16} color="#666" />
            <Text style={styles.nextContactText}>
              Next:{' '}
              {formatDistanceToNow(new Date(item.nextContact), {
                addSuffix: true,
              })}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity style={styles.retryButton} onPress={fetchContacts}>
          <Text style={styles.retryButtonText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={contacts}
        renderItem={renderContact}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.loader} color="#007AFF" />
          ) : (
            <Text style={styles.emptyText}>No contacts yet. Add some!</Text>
          )
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  list: {
    padding: 16,
  },
  contactCard: {
    backgroundColor: 'white',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactInfo: {
    flex: 1,
  },
  contactDetails: {
    marginBottom: 12,
  },
  contactText: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000',
  },
  actionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionButton: {
    padding: 8,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  messageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 8,
  },
  messageButtonGenerating: {
    opacity: 0.7,
  },
  messageButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  nextContact: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 'auto',
  },
  nextContactText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  loader: {
    marginTop: 32,
  },
  emptyText: {
    textAlign: 'center',
    marginTop: 32,
    color: '#666',
    fontSize: 16,
  },
  errorText: {
    color: '#FF3B30',
    marginBottom: 16,
    fontSize: 16,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '600',
  },
});
