import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  MessageSquare, Send, Search, User, Plus, 
  Inbox, ArrowLeft, Check, CheckCheck 
} from 'lucide-react';
import { messagesAPI, usersAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { ScrollArea } from '../components/ui/scroll-area';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

export function Messages() {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewMessageOpen, setIsNewMessageOpen] = useState(false);
  const [newMessage, setNewMessage] = useState({ recipient_id: '', subject: '', content: '' });
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [messagesRes] = await Promise.all([
        messagesAPI.getAll(),
      ]);
      
      setMessages(messagesRes.data || []);
      
      // Try to fetch users for compose
      try {
        const usersRes = await usersAPI.getAll();
        setUsers(usersRes.data || []);
      } catch {
        // Non-admin users may not have access
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Group messages by conversation
  const getConversations = () => {
    const conversations = {};
    
    messages.forEach(msg => {
      const otherUserId = msg.sender_id === user?.id ? msg.recipient_id : msg.sender_id;
      const otherUserName = msg.sender_id === user?.id ? msg.recipient_name : msg.sender_name;
      
      if (!conversations[otherUserId]) {
        conversations[otherUserId] = {
          userId: otherUserId,
          userName: otherUserName,
          messages: [],
          unread: 0,
          lastMessage: null,
        };
      }
      
      conversations[otherUserId].messages.push(msg);
      
      if (!msg.read && msg.recipient_id === user?.id) {
        conversations[otherUserId].unread++;
      }
      
      if (!conversations[otherUserId].lastMessage || 
          new Date(msg.created_at) > new Date(conversations[otherUserId].lastMessage.created_at)) {
        conversations[otherUserId].lastMessage = msg;
      }
    });

    return Object.values(conversations)
      .filter(conv => 
        conv.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        conv.lastMessage?.subject.toLowerCase().includes(searchQuery.toLowerCase())
      )
      .sort((a, b) => 
        new Date(b.lastMessage?.created_at) - new Date(a.lastMessage?.created_at)
      );
  };

  const handleSendMessage = async () => {
    if (!newMessage.recipient_id || !newMessage.subject.trim() || !newMessage.content.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSending(true);
    try {
      await messagesAPI.send(newMessage);
      toast.success('Message envoyé !');
      setIsNewMessageOpen(false);
      setNewMessage({ recipient_id: '', subject: '', content: '' });
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSending(false);
    }
  };

  const handleMarkRead = async (messageId) => {
    try {
      await messagesAPI.markRead(messageId);
      setMessages(prev => prev.map(m => 
        m.id === messageId ? { ...m, read: true } : m
      ));
    } catch (error) {
      console.error('Error marking message read:', error);
    }
  };

  const conversations = getConversations();
  const selectedMessages = selectedConversation 
    ? conversations.find(c => c.userId === selectedConversation)?.messages || []
    : [];

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="h-[calc(100vh-200px)]"
      data-testid="messages-page"
    >
      <Card className="h-full flex overflow-hidden">
        {/* Conversations List */}
        <div className={cn(
          "w-full md:w-80 border-r border-border flex flex-col",
          selectedConversation && "hidden md:flex"
        )}>
          <div className="p-4 border-b border-border space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-primary" />
                Messages
              </h2>
              <Button 
                size="icon" 
                variant="ghost" 
                onClick={() => setIsNewMessageOpen(true)}
                data-testid="new-message-btn"
              >
                <Plus className="w-5 h-5" />
              </Button>
            </div>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>

          <ScrollArea className="flex-1">
            {conversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <Inbox className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Aucune conversation</p>
              </div>
            ) : (
              <div className="p-2 space-y-1">
                {conversations.map((conv) => (
                  <button
                    key={conv.userId}
                    onClick={() => {
                      setSelectedConversation(conv.userId);
                      // Mark unread messages as read
                      conv.messages
                        .filter(m => !m.read && m.recipient_id === user?.id)
                        .forEach(m => handleMarkRead(m.id));
                    }}
                    className={cn(
                      "w-full p-3 rounded-xl text-left transition-colors",
                      selectedConversation === conv.userId
                        ? "bg-primary/10"
                        : "hover:bg-muted"
                    )}
                    data-testid={`conversation-${conv.userId}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(conv.userName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-medium truncate">{conv.userName}</span>
                          {conv.unread > 0 && (
                            <Badge className="ml-2">{conv.unread}</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground truncate">
                          {conv.lastMessage?.subject}
                        </p>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Message Thread */}
        <div className={cn(
          "flex-1 flex flex-col",
          !selectedConversation && "hidden md:flex"
        )}>
          {selectedConversation ? (
            <>
              {/* Thread Header */}
              <div className="p-4 border-b border-border flex items-center gap-3">
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setSelectedConversation(null)}
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <Avatar>
                  <AvatarFallback className="bg-primary/10 text-primary">
                    {getInitials(conversations.find(c => c.userId === selectedConversation)?.userName)}
                  </AvatarFallback>
                </Avatar>
                <span className="font-semibold">
                  {conversations.find(c => c.userId === selectedConversation)?.userName}
                </span>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="space-y-4">
                  {selectedMessages
                    .sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
                    .map((msg) => (
                      <motion.div
                        key={msg.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={cn(
                          "flex",
                          msg.sender_id === user?.id ? "justify-end" : "justify-start"
                        )}
                      >
                        <div className={cn(
                          "max-w-[80%] rounded-2xl p-4",
                          msg.sender_id === user?.id
                            ? "bg-primary text-primary-foreground rounded-br-sm"
                            : "bg-muted rounded-bl-sm"
                        )}>
                          <p className="font-medium text-sm mb-1">{msg.subject}</p>
                          <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                          <div className="flex items-center justify-end gap-1 mt-2">
                            <span className="text-xs opacity-70">
                              {formatDistanceToNow(new Date(msg.created_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                            {msg.sender_id === user?.id && (
                              msg.read ? (
                                <CheckCheck className="w-4 h-4 opacity-70" />
                              ) : (
                                <Check className="w-4 h-4 opacity-70" />
                              )
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                </div>
              </ScrollArea>

              {/* Reply Input */}
              <div className="p-4 border-t border-border">
                <div className="flex gap-2">
                  <Input
                    placeholder="Répondre..."
                    className="flex-1"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        setNewMessage({
                          recipient_id: selectedConversation,
                          subject: `Re: ${selectedMessages[0]?.subject || ''}`,
                          content: e.target.value,
                        });
                        e.target.value = '';
                        // Auto-send
                      }
                    }}
                  />
                  <Button size="icon">
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <div className="text-center">
                <MessageSquare className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>Sélectionnez une conversation</p>
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* New Message Dialog */}
      <Dialog open={isNewMessageOpen} onOpenChange={setIsNewMessageOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouveau message</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Destinataire</label>
              <Select
                value={newMessage.recipient_id}
                onValueChange={(value) => setNewMessage(prev => ({ ...prev, recipient_id: value }))}
              >
                <SelectTrigger data-testid="recipient-select">
                  <SelectValue placeholder="Sélectionner un destinataire" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.id !== user?.id).map(u => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.first_name} {u.last_name} ({u.role})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Sujet</label>
              <Input
                value={newMessage.subject}
                onChange={(e) => setNewMessage(prev => ({ ...prev, subject: e.target.value }))}
                placeholder="Objet du message"
                data-testid="message-subject-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={newMessage.content}
                onChange={(e) => setNewMessage(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Votre message..."
                rows={4}
                data-testid="message-content-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewMessageOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleSendMessage} disabled={isSending} data-testid="send-message-btn">
              {isSending ? 'Envoi...' : 'Envoyer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
