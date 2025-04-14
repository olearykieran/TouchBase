import { create } from 'zustand';
import { supabase } from './supabase';
import { addDays, addWeeks, addMonths } from 'date-fns';

interface Contact {
  id: string;
  name: string;
  email: string;
  phone: string;
  frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
  lastContact: Date;
  nextContact: Date;
}

interface ContactStore {
  contacts: Contact[];
  loading: boolean;
  error: string | null;
  fetchContacts: () => Promise<void>;
  addContact: (contact: Omit<Contact, 'id' | 'lastContact' | 'nextContact'>) => Promise<void>;
  updateLastContact: (contactId: string) => Promise<void>;
}

const calculateNextContact = (frequency: Contact['frequency'], lastContact: Date) => {
  switch (frequency) {
    case 'daily':
      return addDays(lastContact, 1);
    case 'weekly':
      return addWeeks(lastContact, 1);
    case 'monthly':
      return addMonths(lastContact, 1);
    case 'quarterly':
      return addMonths(lastContact, 3);
  }
};

export const useContactStore = create<ContactStore>((set, get) => ({
  contacts: [],
  loading: false,
  error: null,

  fetchContacts: async () => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('contacts')
        .select('*')
        .order('next_contact', { ascending: true });

      if (error) throw error;

      set({
        contacts: data.map(contact => ({
          ...contact,
          lastContact: new Date(contact.last_contact),
          nextContact: new Date(contact.next_contact),
        })),
        loading: false,
      });
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  addContact: async (contact) => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const lastContact = new Date();
      const nextContact = calculateNextContact(contact.frequency, lastContact);

      const { data, error } = await supabase
        .from('contacts')
        .insert({
          ...contact,
          user_id: user.id,
          last_contact: lastContact.toISOString(),
          next_contact: nextContact.toISOString(),
        })
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        contacts: [...state.contacts, {
          ...data,
          lastContact: new Date(data.last_contact),
          nextContact: new Date(data.next_contact),
        }],
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },

  updateLastContact: async (contactId) => {
    set({ loading: true, error: null });
    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) throw userError;
      if (!user) throw new Error('Not authenticated');

      const contact = get().contacts.find(c => c.id === contactId);
      if (!contact) throw new Error('Contact not found');

      const lastContact = new Date();
      const nextContact = calculateNextContact(contact.frequency, lastContact);

      const { data, error } = await supabase
        .from('contacts')
        .update({
          last_contact: lastContact.toISOString(),
          next_contact: nextContact.toISOString(),
        })
        .eq('id', contactId)
        .eq('user_id', user.id) // Add this line to ensure RLS policy is satisfied
        .select()
        .single();

      if (error) throw error;

      set(state => ({
        contacts: state.contacts.map(c =>
          c.id === contactId
            ? {
                ...c,
                lastContact: new Date(data.last_contact),
                nextContact: new Date(data.next_contact),
              }
            : c
        ),
        loading: false,
      }));
    } catch (error) {
      set({ error: (error as Error).message, loading: false });
    }
  },
}));