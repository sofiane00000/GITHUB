import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, TrendingUp, Filter } from 'lucide-react';
import { gradesAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#4F46E5', '#F43F5E', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'];

export function Grades() {
  const { user } = useAuthStore();
  const [grades, setGrades] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchGrades();
  }, []);

  const fetchGrades = async () => {
    try {
      const { data } = await gradesAPI.getAll();
      setGrades(data.grades || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Parse grade value
  const parseGrade = (g) => {
    if (!g.value) return null;
    const value = parseFloat(g.value.replace(',', '.'));
    const outOf = parseFloat(g.out_of?.replace(',', '.') || '20');
    return { value, outOf, normalized: (value / outOf) * 20 };
  };

  // Calculate stats
  const calculateStats = () => {
    const validGrades = grades.map(parseGrade).filter(g => g !== null);
    if (validGrades.length === 0) return { average: 0, min: 0, max: 0, count: 0 };
    
    const totalWeighted = grades.reduce((sum, g) => {
      const parsed = parseGrade(g);
      if (!parsed) return sum;
      return sum + parsed.normalized * (g.coefficient || 1);
    }, 0);
    const totalCoef = grades.reduce((sum, g) => sum + (g.coefficient || 1), 0);
    
    return {
      average: totalCoef > 0 ? (totalWeighted / totalCoef).toFixed(2) : 0,
      min: Math.min(...validGrades.map(g => g.normalized)).toFixed(2),
      max: Math.max(...validGrades.map(g => g.normalized)).toFixed(2),
      count: grades.length,
    };
  };

  // Get subject averages
  const getSubjectAverages = () => {
    const subjectGrades = {};
    
    grades.forEach(grade => {
      const parsed = parseGrade(grade);
      if (!parsed) return;
      
      const subject = grade.subject || 'Autre';
      if (!subjectGrades[subject]) {
        subjectGrades[subject] = { total: 0, coef: 0, color: grade.subject_color || COLORS[Object.keys(subjectGrades).length % COLORS.length] };
      }
      subjectGrades[subject].total += parsed.normalized * (grade.coefficient || 1);
      subjectGrades[subject].coef += (grade.coefficient || 1);
    });

    return Object.entries(subjectGrades).map(([name, data]) => ({
      name,
      average: data.coef > 0 ? (data.total / data.coef).toFixed(2) : 0,
      color: data.color,
    })).sort((a, b) => parseFloat(b.average) - parseFloat(a.average));
  };

  // Get grades trend
  const getGradesTrend = () => {
    return grades
      .filter(g => g.date && parseGrade(g))
      .sort((a, b) => new Date(a.date) - new Date(b.date))
      .slice(-15)
      .map((grade) => {
        const parsed = parseGrade(grade);
        return {
          name: format(parseISO(grade.date), 'dd/MM', { locale: fr }),
          value: parsed?.normalized || 0,
          subject: grade.subject || 'Matière',
        };
      });
  };

  const stats = calculateStats();
  const subjectAverages = getSubjectAverages();
  const gradesTrend = getGradesTrend();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="grades-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Mes notes
            <Badge variant="outline" className="ml-2">
              {user?.provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}
            </Badge>
          </CardTitle>
        </CardHeader>
      </Card>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Moyenne générale</p>
            <p className="text-3xl font-bold text-primary">{stats.average}/20</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Meilleure note</p>
            <p className="text-3xl font-bold text-green-500">{stats.max}/20</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Note la plus basse</p>
            <p className="text-3xl font-bold text-secondary">{stats.min}/20</p>
          </CardContent>
        </Card>
        <Card className="card-hover">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground">Nombre de notes</p>
            <p className="text-3xl font-bold">{stats.count}</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <Tabs defaultValue="trend" className="space-y-4">
        <TabsList>
          <TabsTrigger value="trend">Évolution</TabsTrigger>
          <TabsTrigger value="subjects">Par matière</TabsTrigger>
          <TabsTrigger value="list">Liste</TabsTrigger>
        </TabsList>

        <TabsContent value="trend">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Évolution des notes</CardTitle>
            </CardHeader>
            <CardContent>
              {gradesTrend.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune note à afficher
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={gradesTrend}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 20]} tick={{ fontSize: 12 }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value, name, props) => [
                          `${value.toFixed(2)}/20`,
                          props.payload.subject
                        ]}
                      />
                      <Line
                        type="monotone"
                        dataKey="value"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        dot={{ fill: 'hsl(var(--primary))', strokeWidth: 2 }}
                        activeDot={{ r: 6 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="subjects">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Moyennes par matière</CardTitle>
            </CardHeader>
            <CardContent>
              {subjectAverages.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  Aucune note à afficher
                </div>
              ) : (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={subjectAverages} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis type="number" domain={[0, 20]} tick={{ fontSize: 12 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={100} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: 'hsl(var(--card))',
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '0.5rem'
                        }}
                        formatter={(value) => [`${value}/20`, 'Moyenne']}
                      />
                      <Bar dataKey="average" radius={[0, 4, 4, 0]}>
                        {subjectAverages.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Toutes les notes</CardTitle>
            </CardHeader>
            <CardContent>
              {grades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune note à afficher
                </div>
              ) : (
                <div className="space-y-3">
                  {grades
                    .sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
                    .map((grade, i) => {
                      const parsed = parseGrade(grade);
                      
                      return (
                        <motion.div
                          key={grade.id || i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.03 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div
                            className="w-2 h-12 rounded-full"
                            style={{ backgroundColor: grade.subject_color || '#4F46E5' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{grade.comment || 'Note'}</p>
                            <p className="text-sm text-muted-foreground">
                              {grade.subject || 'Matière'}
                              {grade.date && ` • ${format(parseISO(grade.date), 'dd MMMM yyyy', { locale: fr })}`}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${parsed && parsed.normalized >= 10 ? 'text-green-500' : 'text-secondary'}`}>
                              {grade.value}/{grade.out_of || '20'}
                            </p>
                            <Badge variant="outline">Coef. {grade.coefficient || 1}</Badge>
                          </div>
                        </motion.div>
                      );
                    })}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
