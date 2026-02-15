import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { BookOpen, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { homeworkAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Checkbox } from '../components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '../components/ui/dialog';
import { format, parseISO, isToday, isTomorrow, isPast, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Homework() {
  const { user } = useAuthStore();
  const [homework, setHomework] = useState([]);
  const [selectedHomework, setSelectedHomework] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchHomework();
  }, []);

  const fetchHomework = async () => {
    try {
      const { data } = await homeworkAPI.getAll();
      setHomework(data.homework || []);
    } catch (error) {
      console.error('Error fetching homework:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getDueStatus = (dateStr) => {
    if (!dateStr) return { label: 'Date inconnue', variant: 'secondary', icon: Clock };
    
    try {
      const date = parseISO(dateStr);
      
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
    } catch {
      return { label: dateStr, variant: 'secondary', icon: Clock };
    }
  };

  // Group homework by date
  const groupedHomework = homework.reduce((acc, hw) => {
    const dateKey = hw.date || 'unknown';
    if (!acc[dateKey]) acc[dateKey] = [];
    acc[dateKey].push(hw);
    return acc;
  }, {});

  const sortedDates = Object.keys(groupedHomework).sort((a, b) => {
    if (a === 'unknown') return 1;
    if (b === 'unknown') return -1;
    return new Date(a) - new Date(b);
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="homework-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-primary" />
            Mes devoirs
            <Badge variant="outline" className="ml-2">
              {user?.provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-primary">{homework.length}</p>
            <p className="text-sm text-muted-foreground">Total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-secondary">
              {homework.filter(hw => {
                if (!hw.date) return false;
                try {
                  const date = parseISO(hw.date);
                  return isToday(date) || isTomorrow(date);
                } catch { return false; }
              }).length}
            </p>
            <p className="text-sm text-muted-foreground">Urgents</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-3xl font-bold text-green-500">
              {homework.filter(hw => hw.done).length}
            </p>
            <p className="text-sm text-muted-foreground">Faits</p>
          </CardContent>
        </Card>
      </div>

      {/* Homework List */}
      <Card>
        <CardContent className="p-6">
          {homework.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="w-16 h-16 mx-auto text-green-500 mb-4" />
              <h3 className="text-xl font-semibold mb-2">Aucun devoir !</h3>
              <p className="text-muted-foreground">Profitez de votre temps libre</p>
            </div>
          ) : (
            <div className="space-y-6">
              {sortedDates.map((dateKey) => {
                const dateHomework = groupedHomework[dateKey];
                const dueStatus = getDueStatus(dateKey);
                
                return (
                  <div key={dateKey}>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant={dueStatus.variant} className="gap-1">
                        <dueStatus.icon className="w-3 h-3" />
                        {dueStatus.label}
                      </Badge>
                      {dateKey !== 'unknown' && (
                        <span className="text-sm text-muted-foreground">
                          {format(parseISO(dateKey), 'EEEE d MMMM', { locale: fr })}
                        </span>
                      )}
                    </div>
                    
                    <div className="space-y-3">
                      {dateHomework.map((hw, i) => (
                        <motion.div
                          key={hw.id || i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className={`flex items-start gap-4 p-4 rounded-xl border border-border hover:border-primary/50 transition-all cursor-pointer ${hw.done ? 'opacity-60' : ''}`}
                          onClick={() => setSelectedHomework(hw)}
                        >
                          <Checkbox checked={hw.done} className="mt-1" />
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-semibold">{hw.subject}</span>
                            </div>
                            <p className={`text-sm text-muted-foreground ${hw.done ? 'line-through' : ''}`}>
                              {hw.description?.substring(0, 100)}
                              {hw.description?.length > 100 && '...'}
                            </p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
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
            <DialogTitle>{selectedHomework?.subject}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4">
            {selectedHomework?.date && (
              <div className="flex items-center gap-2">
                <Badge variant={getDueStatus(selectedHomework.date).variant}>
                  Pour le {format(parseISO(selectedHomework.date), 'EEEE d MMMM', { locale: fr })}
                </Badge>
              </div>
            )}
            
            <div className="prose prose-sm max-w-none dark:prose-invert">
              <p className="whitespace-pre-wrap">{selectedHomework?.description}</p>
            </div>
            
            {selectedHomework?.done && (
              <Badge variant="outline" className="gap-1">
                <CheckCircle2 className="w-3 h-3 text-green-500" />
                Marqué comme fait
              </Badge>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
