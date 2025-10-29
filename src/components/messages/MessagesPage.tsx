import React, { useEffect, useState } from 'react';
import { supabase, Message, User } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Search, Send } from 'lucide-react';

export function MessagesPage() {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    loadConversations();
  }, [user]);

  useEffect(() => {
    if (selectedUser) {
      loadMessages(selectedUser.id);
      const subscription = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
            filter: `receiver_id=eq.${user?.id}`,
          },
          (payload) => {
            if (payload.new.sender_id === selectedUser.id) {
              setMessages(prev => [...prev, payload.new as Message]);
            }
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [selectedUser, user]);

  async function loadConversations() {
    if (!user) return;

    try {
      const { data: sentMessages, error: sentError } = await supabase
        .from('messages')
        .select('receiver_id')
        .eq('sender_id', user.id);

      const { data: receivedMessages, error: receivedError } = await supabase
        .from('messages')
        .select('sender_id')
        .eq('receiver_id', user.id);

      if (sentError) throw sentError;
      if (receivedError) throw receivedError;

      const userIds = new Set([
        ...(sentMessages?.map(m => m.receiver_id) || []),
        ...(receivedMessages?.map(m => m.sender_id) || []),
      ]);

      if (userIds.size > 0) {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('id', Array.from(userIds));

        if (usersError) throw usersError;
        setConversations(users || []);
      }
    } catch (error) {
      console.error('Error loading conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  async function loadMessages(otherUserId: string) {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*, sender:users!messages_sender_id_fkey(name), receiver:users!messages_receiver_id_fkey(name)')
        .or(`and(sender_id.eq.${user.id},receiver_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},receiver_id.eq.${user.id})`)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);

      await supabase
        .from('messages')
        .update({ read: true })
        .eq('receiver_id', user.id)
        .eq('sender_id', otherUserId)
        .eq('read', false);
    } catch (error) {
      console.error('Error loading messages:', error);
    }
  }

  async function sendMessage() {
    if (!user || !selectedUser || !newMessage.trim()) return;

    setSending(true);
    try {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          sender_id: user.id,
          receiver_id: selectedUser.id,
          content: newMessage.trim(),
        })
        .select()
        .single();

      if (error) throw error;

      setMessages(prev => [...prev, data]);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setSending(false);
    }
  }

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.organization_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-slate-600">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-slate-900 mb-8">Messages</h1>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden" style={{ height: '600px' }}>
        <div className="flex h-full">
          <div className="w-full sm:w-80 border-r border-slate-200 flex flex-col">
            <div className="p-4 border-b border-slate-200">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" size={18} />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <div className="p-6 text-center text-slate-500 text-sm">
                  No conversations yet
                </div>
              ) : (
                <div>
                  {filteredConversations.map(conv => (
                    <button
                      key={conv.id}
                      onClick={() => setSelectedUser(conv)}
                      className={`w-full p-4 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 ${
                        selectedUser?.id === conv.id ? 'bg-blue-50' : ''
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                          {conv.name.charAt(0)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-slate-900 truncate">{conv.name}</div>
                          {conv.organization_name && (
                            <div className="text-xs text-slate-500 truncate">{conv.organization_name}</div>
                          )}
                          <div className="text-xs text-slate-500">{conv.role === 'ngo' ? 'NGO' : 'Volunteer'}</div>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex-1 flex flex-col">
            {selectedUser ? (
              <>
                <div className="p-4 border-b border-slate-200 bg-slate-50">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center text-white font-bold">
                      {selectedUser.name.charAt(0)}
                    </div>
                    <div>
                      <div className="font-medium text-slate-900">{selectedUser.name}</div>
                      {selectedUser.organization_name && (
                        <div className="text-xs text-slate-600">{selectedUser.organization_name}</div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => {
                    const isOwn = msg.sender_id === user?.id;
                    return (
                      <div key={msg.id} className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-xs lg:max-w-md ${isOwn ? 'order-2' : 'order-1'}`}>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              isOwn
                                ? 'bg-blue-600 text-white'
                                : 'bg-slate-100 text-slate-900'
                            }`}
                          >
                            {msg.content}
                          </div>
                          <div className={`text-xs text-slate-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                            {new Date(msg.created_at).toLocaleString()}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-4 border-t border-slate-200">
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sending}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Send size={20} />
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center text-slate-500">
                Select a conversation to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
