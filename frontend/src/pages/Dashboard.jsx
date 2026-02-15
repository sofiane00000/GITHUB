import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  GraduationCap, BookOpen, Calendar, MessageSquare, 
  Brain, Trophy, TrendingUp, Clock, ChevronRight,
  Sparkles, CheckCircle2, AlertCircle
} from 'lucide-react';
import { useAuthStore } from '../store/useStore';
import { statsAPI, homeworkAPI, timetableAPI, gradesAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Progress } from '../components/ui/progress';
import { Badge } from '../components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { format, isToday, isTomorrow, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export function Dashboard() {
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [homework, setHomework] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, homeworkRes, timetableRes, gradesRes] = await Promise.all([
        statsAPI.getStudent().catch(() => ({ data: null })),
        homeworkAPI.getAll({ prioritize: true }).catch(() => ({ data: [] })),
        timetableAPI.get().catch(() => ({ data: [] })),
        gradesAPI.getAll().catch(() => ({ data: [] })),
      ]);

      setStats(statsRes.data);
      setHomework(homeworkRes.data?.slice(0, 5) || []);
      setTimetable(timetableRes.data || []);
      setGrades(gradesRes.data || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getTodaySchedule = () => {
    const today = new Date().getDay();
    const dayIndex = today === 0 ? 6 : today - 1;
    return timetable
      .filter(slot => slot.day_of_week === dayIndex)
      .sort((a, b) => a.start_time.localeCompare(b.start_time));
  };

  const getGradesTrend = () => {
    const sortedGrades = [...grades].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return sortedGrades.slice(-10).map((grade, i) => ({
      name: `Note ${i + 1}`,
      value: (grade.value / grade.max_value) * 20,
    }));
  };

  const getDueDateLabel = (dueDate) => {
    const date = typeof dueDate === 'string' ? parseISO(dueDate) : dueDate;
    if (isToday(date)) return { label: "Aujourd'hui", variant: 'destructive' };
    if (isTomorrow(date)) return { label: 'Demain', variant: 'warning' };
    return { label: format(date, 'dd MMM', { locale: fr }), variant: 'secondary' };
  };

  const xpProgress = ((user?.xp_points || 0) % 100);
  const level = Math.floor((user?.xp_points || 0) / 100) + 1;
  const todaySchedule = getTodaySchedule();
  const gradesTrend = getGradesTrend();

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
      data-testid="student-dashboard"
    >
      {/* Welcome Banner */}
      <motion.div variants={itemVariants}>
        <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-none overflow-hidden relative">
          <div className="absolute right-0 top-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <CardContent className="p-6 relative">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Bonjour, {user?.first_name} ! 👋
                </h1>
                <p className="text-muted-foreground">
                  {format(new Date(), "EEEE d MMMM yyyy", { locale: fr })}
                </p>
              </div>
              
              {user?.role === 'student' && (
                <div className="hidden md:flex items-center gap-4 bg-card/80 backdrop-blur rounded-2xl p-4">
                  <div className="flex items-center gap-2">
                    <Trophy className="w-8 h-8 text-yellow-500" />
                    <div>
                      <p className="text-sm text-muted-foreground">Niveau</p>
                      <p className="text-2xl font-bold">{level}</p>
                    </div>
                  </div>
                  <div className="w-px h-12 bg-border" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">{user?.xp_points || 0} XP</p>
                    <Progress value={xpProgress} className="w-24 h-2" />
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Stats Grid */}
      <motion.div variants={itemVariants} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Moyenne</p>
                <p className="text-xl font-bold">{stats?.average || '—'}/20</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
                <BookOpen className="w-5 h-5 text-secondary" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Devoirs</p>
                <p className="text-xl font-bold">{stats?.homework_completed || 0}/{stats?.homework_total || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Brain className="w-5 h-5 text-accent" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quiz</p>
                <p className="text-xl font-bold">{stats?.quizzes_completed || 0}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="card-hover">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Quiz Avg</p>
                <p className="text-xl font-bold">{stats?.quiz_average || '—'}%</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Main Content Grid */}
      <div className="grid lg:grid-cols-12 gap-6">
        {/* Today's Schedule */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
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
              {todaySchedule.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Calendar className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Pas de cours aujourd'hui</p>
                </div>
              ) : (
                todaySchedule.map((slot, i) => (
                  <motion.div
                    key={slot.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div 
                      className="w-1 h-12 rounded-full"
                      style={{ backgroundColor: slot.subject_color || '#4F46E5' }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{slot.subject_name}</p>
                      <p className="text-sm text-muted-foreground">
                        {slot.start_time} - {slot.end_time} • {slot.room}
                      </p>
                    </div>
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
                Devoirs prioritaires
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/homework')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent className="space-y-3">
              {homework.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle2 className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>Tous les devoirs sont faits !</p>
                </div>
              ) : (
                homework.map((hw, i) => {
                  const dueInfo = getDueDateLabel(hw.due_date);
                  return (
                    <motion.div
                      key={hw.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-3 p-3 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-pointer"
                      onClick={() => navigate('/homework')}
                    >
                      {hw.ai_priority >= 4 ? (
                        <AlertCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
                      ) : (
                        <Clock className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">{hw.title}</p>
                        <p className="text-sm text-muted-foreground truncate">
                          {hw.subject_name}
                        </p>
                      </div>
                      <Badge variant={dueInfo.variant === 'warning' ? 'secondary' : dueInfo.variant}>
                        {dueInfo.label}
                      </Badge>
                    </motion.div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Grades Trend */}
        <motion.div variants={itemVariants} className="lg:col-span-4">
          <Card className="h-full">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-lg flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-500" />
                Évolution des notes
              </CardTitle>
              <Button variant="ghost" size="sm" onClick={() => navigate('/grades')}>
                <ChevronRight className="w-4 h-4" />
              </Button>
            </CardHeader>
            <CardContent>
              {gradesTrend.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <GraduationCap className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Pas encore de notes</p>
                </div>
              ) : (
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradesTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={false} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value) => [`${value.toFixed(1)}/20`, 'Note']}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="value" 
                        stroke="hsl(var(--primary))" 
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
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
                onClick={() => navigate('/tutoring')}
                data-testid="quick-quiz-btn"
              >
                <Brain className="w-6 h-6 text-primary" />
                <span>Générer un quiz</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-secondary hover:bg-secondary/5"
                onClick={() => navigate('/messages')}
                data-testid="quick-message-btn"
              >
                <MessageSquare className="w-6 h-6 text-secondary" />
                <span>Messagerie</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-accent hover:bg-accent/5"
                onClick={() => navigate('/resources')}
                data-testid="quick-resources-btn"
              >
                <BookOpen className="w-6 h-6 text-accent" />
                <span>Ressources</span>
              </Button>
              <Button
                variant="outline"
                className="h-auto py-4 flex flex-col items-center gap-2 hover:border-green-500 hover:bg-green-500/5"
                onClick={() => navigate('/forum')}
                data-testid="quick-forum-btn"
              >
                <Sparkles className="w-6 h-6 text-green-500" />
                <span>Forum</span>
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </motion.div>
  );
}
