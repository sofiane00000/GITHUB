import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, AlertCircle, CheckCircle2, Filter, Sparkles } from 'lucide-react';
import { homeworkAPI, subjectsAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../components/ui/dialog';
import { Textarea } from '../components/ui/textarea';
import { toast } from 'sonner';
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Homework() {
  const { user } = useAuthStore();
  const [homework, setHomework] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [submitContent, setSubmitContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [homeworkRes, subjectsRes] = await Promise.all([
        homeworkAPI.getAll({ prioritize: true }),
        subjectsAPI.getAll(),
      ]);
      
      setHomework(homeworkRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredHomework = homework.filter(hw => {
    if (selectedSubject !== 'all' && hw.subject_id !== selectedSubject) return false;
    return true;
  });

  const getDueStatus = (dueDate) => {
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    
    if (isPast(date) && !isToday(date)) {
      return { label: 'En retard', variant: 'destructive', icon: AlertCircle };
    }
    if (isToday(date)) {
      return { label: "Aujourd'hui", variant: 'destructive', icon: AlertCircle };
    }
    if (isTomorrow(date)) {
      return { label: 'Demain', variant: 'secondary', icon: Clock };
    }
    
    const days = differenceInDays(date, new Date());
    if (days <= 3) {
      return { label: `Dans ${days} jours`, variant: 'secondary', icon: Clock };
    }
    
    return { label: format(date, 'dd MMM', { locale: fr }), variant: 'outline', icon: Clock };
  };

  const getPriorityColor = (priority) => {
    if (priority >= 5) return 'bg-red-500';
    if (priority >= 4) return 'bg-orange-500';
    if (priority >= 3) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const handleSubmit = async () => {
    if (!submitContent.trim() || !selectedHomework) return;
    
    setIsSubmitting(true);
    try {
      await homeworkAPI.submit(selectedHomework.id, submitContent);
      toast.success('Devoir rendu avec succès ! +10 XP');
      setSelectedHomework(null);
      setSubmitContent('');
      fetchData();
    } catch (error) {
      toast.error('Erreur lors du rendu du devoir');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="homework-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Mes devoirs
            {user?.role === 'student' && (
              <Badge variant="secondary" className="ml-2 gap-1">
                <Sparkles className="w-3 h-3" />
                Priorisés par IA
              </Badge>
            )}
          </CardTitle>
          <Select value={selectedSubject} onValueChange={setSelectedSubject}>
            <SelectTrigger className="w-40" data-testid="homework-subject-filter">
              <SelectValue placeholder="Matière" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes</SelectItem>
              {subjects.map(subject => (
                <SelectItem key={subject.id} value={subject.id}>
                  {subject.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{filteredHomework.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">
              {filteredHomework.filter(hw => {
                const date = typeof hw.due_date === 'string' ? parseISO(hw.due_date) : hw.due_date;
                return isToday(date) || isTomorrow(date);
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">Urgents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {filteredHomework.filter(hw => hw.ai_priority && hw.ai_priority <= 2).length}
            </p>
            <p className="text-sm text-muted-foreground">Basse priorité</p>
          </CardContent>
        </Card>
      </div>

      {/* Homework List */}
      <Card>
        <CardContent className="p-6">
          {filteredHomework.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Tous les devoirs sont faits !</h3>
              <p className="text-muted-foreground">Profitez-en pour réviser avec les quiz</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredHomework.map((hw, i) => {
                const subject = subjects.find(s => s.id === hw.subject_id);
                const dueStatus = getDueStatus(hw.due_date);
                const StatusIcon = dueStatus.icon;
                
                return (
                  <motion.div
                    key={hw.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="group p-4 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer"
                    onClick={() => setSelectedHomework(hw)}
                    data-testid={`homework-item-${hw.id}`}
                  >
                    <div className="flex items-start gap-4">
                      {/* Priority Indicator */}
                      {hw.ai_priority && (
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-3 h-3 rounded-full ${getPriorityColor(hw.ai_priority)}`} />
                          <span className="text-xs text-muted-foreground">P{hw.ai_priority}</span>
                        </div>
                      )}
                      
                      {/* Subject Color */}
                      <div
                        className="w-1.5 h-16 rounded-full flex-shrink-0"
                        style={{ backgroundColor: subject?.color || '#4F46E5' }}
                      />
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h3 className="font-semibold group-hover:text-primary transition-colors">
                              {hw.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1">
                              {hw.subject_name || subject?.name}
                            </p>
                          </div>
                          <Badge variant={dueStatus.variant} className="gap-1 flex-shrink-0">
                            <StatusIcon className="w-3 h-3" />
                            {dueStatus.label}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                          {hw.description}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Homework Detail Dialog */}
      <Dialog open={!!selectedHomework} onOpenChange={() => setSelectedHomework(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedHomework?.title}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Badge variant="outline">
                {subjects.find(s => s.id === selectedHomework?.subject_id)?.name || 'Matière'}
              </Badge>
              {selectedHomework?.due_date && (
                <Badge variant={getDueStatus(selectedHomework.due_date).variant}>
                  {getDueStatus(selectedHomework.due_date).label}
                </Badge>
              )}
            </div>
            
            <p className="text-muted-foreground">{selectedHomework?.description}</p>
            
            {user?.role === 'student' && (
              <div className="space-y-2">
                <label className="text-sm font-medium">Rendre le devoir</label>
                <Textarea
                  value={submitContent}
                  onChange={(e) => setSubmitContent(e.target.value)}
                  placeholder="Entrez votre réponse ou le lien vers votre travail..."
                  rows={4}
                  data-testid="homework-submit-textarea"
                />
              </div>
            )}
          </div>
          
          {user?.role === 'student' && (
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedHomework(null)}>
                Annuler
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!submitContent.trim() || isSubmitting}
                data-testid="submit-homework-btn"
              >
                {isSubmitting ? 'Envoi...' : 'Rendre le devoir'}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
