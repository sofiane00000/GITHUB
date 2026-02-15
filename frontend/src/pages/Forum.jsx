import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, MessageCircle, Plus, Search, ThumbsUp, 
  MessageSquare, Clock
} from 'lucide-react';
import { forumAPI, subjectsAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Badge } from '../components/ui/badge';
import { Avatar, AvatarFallback } from '../components/ui/avatar';
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

export function Forum() {
  const { user } = useAuthStore();
  const [posts, setPosts] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', subject_id: '' });
  const [replyContent, setReplyContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [postsRes, subjectsRes] = await Promise.all([
        forumAPI.getAll(),
        subjectsAPI.getAll(),
      ]);
      
      setPosts(postsRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching forum data:', error);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.content.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreatePost = async () => {
    if (!newPost.title.trim() || !newPost.content.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    setIsSubmitting(true);
    try {
      await forumAPI.create(newPost.title, newPost.content, null, newPost.subject_id || null);
      toast.success('Discussion créée !');
      setIsNewPostOpen(false);
      setNewPost({ title: '', content: '', subject_id: '' });
      fetchData();
    } catch (error) {
      toast.error('Erreur lors de la création');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = async () => {
    if (!replyContent.trim() || !selectedPost) return;

    setIsSubmitting(true);
    try {
      await forumAPI.reply(selectedPost.id, replyContent);
      toast.success('Réponse ajoutée !');
      setReplyContent('');
      
      // Refresh the selected post
      const { data } = await forumAPI.getAll();
      setPosts(data || []);
      const updatedPost = data.find(p => p.id === selectedPost.id);
      if (updatedPost) setSelectedPost(updatedPost);
    } catch (error) {
      toast.error('Erreur lors de l\'envoi');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getInitials = (name) => {
    return name?.split(' ').map(n => n[0]).join('').toUpperCase() || '?';
  };

  // Demo posts
  const demoPosts = [
    {
      id: 'demo-1',
      title: 'Aide pour les équations du second degré',
      content: 'Bonjour, quelqu\'un peut m\'expliquer comment utiliser le discriminant ?',
      author_name: 'Marie D.',
      created_at: new Date(Date.now() - 3600000).toISOString(),
      replies: [
        {
          id: 'reply-1',
          author_name: 'Thomas L.',
          content: 'Le discriminant Δ = b² - 4ac permet de savoir combien de solutions a l\'équation !',
          created_at: new Date(Date.now() - 1800000).toISOString(),
        }
      ],
    },
    {
      id: 'demo-2',
      title: 'Révisions brevet - Histoire',
      content: 'On se fait un groupe de révision pour le brevet ?',
      author_name: 'Lucas M.',
      created_at: new Date(Date.now() - 86400000).toISOString(),
      replies: [],
    },
  ];

  const displayPosts = filteredPosts.length > 0 ? filteredPosts : demoPosts;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="forum-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <Users className="w-6 h-6 text-primary" />
            Forum d'entraide
          </CardTitle>
          <Button onClick={() => setIsNewPostOpen(true)} data-testid="new-post-btn">
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle discussion
          </Button>
        </CardHeader>
        <CardContent>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une discussion..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="forum-search-input"
            />
          </div>
        </CardContent>
      </Card>

      {/* Posts List */}
      <div className="grid lg:grid-cols-5 gap-6">
        {/* Posts */}
        <div className="lg:col-span-3 space-y-4">
          {displayPosts.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">Aucune discussion</h3>
                <p className="text-muted-foreground">
                  Soyez le premier à lancer une discussion !
                </p>
              </CardContent>
            </Card>
          ) : (
            displayPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <Card 
                  className={`cursor-pointer transition-all hover:border-primary/50 ${
                    selectedPost?.id === post.id ? 'border-primary' : ''
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-start gap-4">
                      <Avatar>
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {getInitials(post.author_name)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold line-clamp-1">{post.title}</h3>
                        <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                          {post.content}
                        </p>
                        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <MessageSquare className="w-4 h-4" />
                            {post.replies?.length || 0} réponses
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDistanceToNow(new Date(post.created_at), { 
                              addSuffix: true, 
                              locale: fr 
                            })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </div>

        {/* Selected Post Detail */}
        <div className="lg:col-span-2">
          {selectedPost ? (
            <Card className="sticky top-6">
              <CardHeader>
                <CardTitle className="text-lg">{selectedPost.title}</CardTitle>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Avatar className="w-6 h-6">
                    <AvatarFallback className="text-xs bg-primary/10 text-primary">
                      {getInitials(selectedPost.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <span>{selectedPost.author_name}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(selectedPost.created_at), { 
                      addSuffix: true, 
                      locale: fr 
                    })}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm">{selectedPost.content}</p>

                <div className="border-t border-border pt-4">
                  <h4 className="font-medium mb-3">
                    Réponses ({selectedPost.replies?.length || 0})
                  </h4>
                  <ScrollArea className="h-48">
                    <div className="space-y-3">
                      {(selectedPost.replies || []).map((reply) => (
                        <div 
                          key={reply.id} 
                          className="p-3 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-2 mb-2">
                            <Avatar className="w-6 h-6">
                              <AvatarFallback className="text-xs">
                                {getInitials(reply.author_name)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium">{reply.author_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {formatDistanceToNow(new Date(reply.created_at), { 
                                addSuffix: true, 
                                locale: fr 
                              })}
                            </span>
                          </div>
                          <p className="text-sm">{reply.content}</p>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                </div>

                <div className="border-t border-border pt-4">
                  <Textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    placeholder="Votre réponse..."
                    rows={3}
                    data-testid="forum-reply-input"
                  />
                  <Button 
                    onClick={handleReply} 
                    disabled={!replyContent.trim() || isSubmitting}
                    className="mt-2 w-full"
                    data-testid="submit-reply-btn"
                  >
                    {isSubmitting ? 'Envoi...' : 'Répondre'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="py-12 text-center">
                <MessageCircle className="w-12 h-12 mx-auto text-muted-foreground mb-2" />
                <p className="text-muted-foreground">
                  Sélectionnez une discussion
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* New Post Dialog */}
      <Dialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvelle discussion</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Titre</label>
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost(prev => ({ ...prev, title: e.target.value }))}
                placeholder="Sujet de votre discussion"
                data-testid="new-post-title-input"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Matière (optionnel)</label>
              <Select
                value={newPost.subject_id}
                onValueChange={(value) => setNewPost(prev => ({ ...prev, subject_id: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une matière" />
                </SelectTrigger>
                <SelectContent>
                  {subjects.map(subject => (
                    <SelectItem key={subject.id} value={subject.id}>
                      {subject.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Message</label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost(prev => ({ ...prev, content: e.target.value }))}
                placeholder="Décrivez votre question ou sujet de discussion..."
                rows={4}
                data-testid="new-post-content-input"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNewPostOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreatePost} disabled={isSubmitting} data-testid="create-post-btn">
              {isSubmitting ? 'Création...' : 'Créer la discussion'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
