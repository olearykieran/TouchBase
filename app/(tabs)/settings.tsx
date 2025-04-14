import { View, Text, StyleSheet, Switch, TouchableOpacity, ScrollView } from 'react-native';
import { useState } from 'react';
import { Bell, Clock, Share2, HelpCircle, LogOut } from 'lucide-react-native';
import { supabase } from '@/lib/supabase';

export default function SettingsScreen() {
  const [notifications, setNotifications] = useState(true);
  const [weekendReminders, setWeekendReminders] = useState(false);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Bell size={24} color="#007AFF" />
            <Text style={styles.settingText}>Enable Notifications</Text>
          </View>
          <Switch
            value={notifications}
            onValueChange={setNotifications}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={notifications ? '#007AFF' : '#f4f3f4'}
          />
        </View>
        <View style={styles.setting}>
          <View style={styles.settingInfo}>
            <Clock size={24} color="#007AFF" />
            <Text style={styles.settingText}>Weekend Reminders</Text>
          </View>
          <Switch
            value={weekendReminders}
            onValueChange={setWeekendReminders}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={weekendReminders ? '#007AFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>General</Text>
        <TouchableOpacity style={styles.setting}>
          <View style={styles.settingInfo}>
            <Share2 size={24} color="#007AFF" />
            <Text style={styles.settingText}>Share App</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity style={styles.setting}>
          <View style={styles.settingInfo}>
            <HelpCircle size={24} color="#007AFF" />
            <Text style={styles.settingText}>Help & Support</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <TouchableOpacity style={styles.signOutButton} onPress={handleSignOut}>
          <LogOut size={24} color="#FF3B30" />
          <Text style={styles.signOutText}>Sign Out</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.version}>Version 1.0.0</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  section: {
    marginTop: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    marginHorizontal: 16,
    padding: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    color: '#000',
  },
  setting: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#000',
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  signOutText: {
    fontSize: 16,
    marginLeft: 12,
    color: '#FF3B30',
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
});