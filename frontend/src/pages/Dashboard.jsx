import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Calendar, Clock,
  Brain, TrendingUp, ChevronRight, Sparkles, 
  CheckCircle2, AlertCircle, User
} from 'lucide-react';
import { useAuthStore, useUIStore } from '../store/useStore';
import { gradesAPI, homeworkAPI, timetableAPI, userInfoAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format, parseISO, isToday, isTomorrow, differenceInDays } from 'date-fns';
import { fr } from 'date-fns/locale';

export function Dashboard() {
  const { user } = useAuthStore();
  const { toggleAIChat } = useUIStore();
  const navigate = useNavigate();
  const [grades, setGrades] = useState([]);
  const [homework, setHomework] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, homeworkRes, timetableRes, infoRes] = await Promise.all([
        gradesAPI.getAll().catch(() => ({ data: { grades: [] } })),
        homeworkAPI.getAll().catch(() => ({ data: { homework: [] } })),
        timetableAPI.get().catch(() => ({ data: { lessons: [] } })),
        userInfoAPI.get().catch(() => ({ data: { info: {} } })),
      ]);

      setGrades(gradesRes.data?.grades || []);
      setHomework(homeworkRes.data?.homework || []);
      setLessons(timetableRes.data?.lessons || []);
      setUserInfo(infoRes.data?.info || {});
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate average
  const calculateAverage = () => {
    const validGrades = grades.filter(g => g.value && !isNaN(parseFloat(g.value)));
    if (validGrades.length === 0) return '—';
    
    let totalWeighted = 0;
    let totalCoef = 0;
    
    validGrades.forEach(g => {
      const value = parseFloat(g.value.replace(',', '.'));
      const outOf = parseFloat(g.out_of?.replace(',', '.') || '20');
      const coef = g.coefficient || 1;
      
      totalWeighted += (value / outOf) * 20 * coef;
      totalCoef += coef;
    });
    
    return totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : '—';
  };

  // Get today's lessons
  const getTodayLessons = () => {
    return lessons.filter(l => {
      if (!l.start) return false;
      try {
        const lessonDate = parseISO(l.start);
        return isToday(lessonDate);
      } catch {
        return false;
      }
    }).sort((a, b) => a.start?.localeCompare(b.start));
  };

  // Get upcoming homework
  const getUpcomingHomework = () => {
    return homework
      .filter(hw => !hw.done)
      .sort((a, b) => {
        if (!a.date || !b.date) return 0;
        return new Date(a.date) - new Date(b.date);
      })
      .slice(0, 5);
  };

  const getDueDateLabel = (dateStr) => {
    if (!dateStr) return { label: 'Date inconnue', variant: 'secondary' };
    try {
      const date = parseISO(dateStr);
      if (isToday(date)) return { label: "Aujourd'hui", variant: 'destructive' };
      if (isTomorrow(date)) return { label: 'Demain', variant: 'secondary' };
      const days = differenceInDays(date, new Date());
      if (days < 0) return { label: 'En retard', variant: 'destructive' };
      if (days <= 3) return { label: `Dans ${days} jours`, variant: 'secondary' };
      return { label: format(date, 'dd MMM', { locale: fr }), variant: 'outline' };
    } catch {
      return { label: dateStr, variant: 'secondary' };
    }
  };

  const todayLessons = getTodayLessons();
  const upcomingHomework = getUpcomingHomework();
  const average = calculateAverage();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
      data-testid="dashboard"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-none overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Bonjour{userInfo?.name ? `, ${userInfo.name.split(' ')[0]}` : ''} ! 👋
                </h1>
                <p className="text-muted-foreground">
                  {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
                {user?.school_name && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {user.school_name} {user.class_name && `• ${user.class_name}`}
                  </p>
                )}
              </div>
              
              <Badge variant="outline" className="gap-2">
                <div className={`w-2 h-2 rounded-full ${user?.provider === 'pronote' ? 'bg-blue-500' : 'bg-green-500'}`} />
                {user?.provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover cursor-pointer" onClick={() => navigate('/grades')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moyenne</p>
                <p className="text-xl font-bold">{average}/20</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer" onClick={() => navigate('/homework')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Devoirs</p>
                <p className="text-xl font-bold">{upcomingHomework.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer" onClick={() => navigate('/timetable')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Calendar className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Cours aujourd'hui</p>
                <p className="text-xl font-bold">{todayLessons.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover cursor-pointer" onClick={() => navigate('/grades')}>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Notes</p>
                <p className="text-xl font-bold">{grades.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-5">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" />
                Aujourd'hui
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/timetable')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {todayLessons.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Pas de cours aujourd'hui</p>
                </div>
              ) : (
                todayLessons.map((lesson, i) => (
                  <motion.div
                    key={lesson.id || i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className={`flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors ${lesson.canceled ? 'opacity-50 line-through' : ''}`}
                  >
                    <div 
                      className="w-1 h-12 rounded-full bg-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{lesson.subject}</p>
                      <p className="text-sm text-muted-foreground">
                        {lesson.start && format(parseISO(lesson.start), 'HH:mm', { locale: fr })}
                        {lesson.end && ` - ${format(parseISO(lesson.end), 'HH:mm', { locale: fr })}`}
                        {lesson.room && ` • ${lesson.room}`}
                      </p>
                    </div>
                    {lesson.canceled && (
                      <Badge variant="destructive">Annulé</Badge>
                    )}
                  </motion.div>
                ))
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Homework */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-secondary" />
                Devoirs à faire
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/homework')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {upcomingHomework.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>Tous les devoirs sont faits !</p>
                </div>
              ) : (
                upcomingHomework.map((hw, i) => {
                  const dueInfo = getDueDateLabel(hw.date);
                  return (
                    <motion.div
                      key={hw.id || i}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate('/homework')}
                    >
                      <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hw.subject}</p>
                        <p className="text-sm text-muted-foreground line-clamp-1">
                          {hw.description}
                        </p>
                      </div>
                      <Badge variant={dueInfo.variant}>
                        {dueInfo.label}
                      </Badge>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* AI Assistant Promo */}
        <motion.div variants={itemVariants} className="lg:col-span-3">
          <Card className="h-full bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4 animate-pulse-glow">
                <Sparkles className="w-8 h-8 text-white" />
              </div>
              <h3 className="font-bold text-lg mb-2">Assistant Papillon</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Besoin d'aide pour tes devoirs ? L'IA est là pour t'aider !
              </p>
              <Button 
                onClick={toggleAIChat}
                className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                data-testid="open-ai-chat-btn"
              >
                <Brain className="w-4 h-4 mr-2" />
                Discuter avec l'IA
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Quick Actions */}
      <motion.div variants={itemVariants}>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Actions rapides</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-primary hover:bg-primary/5"
                onClick={() => navigate('/grades')}
                data-testid="quick-grades-btn"
              >
                <GraduationCap className="w-6 h-6 text-primary" />
                <span>Mes notes</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-secondary hover:bg-secondary/5"
                onClick={() => navigate('/timetable')}
                data-testid="quick-timetable-btn"
              >
                <Calendar className="w-6 h-6 text-secondary" />
                <span>Emploi du temps</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
                onClick={() => navigate('/homework')}
                data-testid="quick-homework-btn"
              >
                <BookOpen className="w-6 h-6 text-accent" />
                <span>Devoirs</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-green-500 hover:bg-green-500/5"
                onClick={() => navigate('/tutoring')}
                data-testid="quick-tutoring-btn"
              >
                <Brain className="w-6 h-6 text-green-500" />
                <span>Quiz & Aide</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
