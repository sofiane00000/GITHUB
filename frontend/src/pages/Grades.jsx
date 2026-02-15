import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { GraduationCap, TrendingUp, TrendingDown, Minus, Filter } from 'lucide-react';
import { gradesAPI, subjectsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';
import { format, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = ['#4F46E5', '#F43F5E', '#0EA5E9', '#10B981', '#F59E0B', '#8B5CF6'];

export function Grades() {
  const [grades, setGrades] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedTrimester, setSelectedTrimester] = useState('all');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [gradesRes, subjectsRes] = await Promise.all([
        gradesAPI.getAll(),
        subjectsAPI.getAll(),
      ]);
      
      setGrades(gradesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching grades:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredGrades = grades.filter(grade => {
    if (selectedSubject !== 'all' && grade.subject_id !== selectedSubject) return false;
    if (selectedTrimester !== 'all' && grade.trimester !== parseInt(selectedTrimester)) return false;
    return true;
  });

  const calculateStats = () => {
    if (filteredGrades.length === 0) return { average: 0, min: 0, max: 0, count: 0 };
    
    const values = filteredGrades.map(g => (g.value / g.max_value) * 20);
    const weightedSum = filteredGrades.reduce((sum, g) => 
      sum + (g.value / g.max_value) * 20 * g.coefficient, 0);
    const totalCoef = filteredGrades.reduce((sum, g) => sum + g.coefficient, 0);
    
    return {
      average: totalCoef > 0 ? (weightedSum / totalCoef).toFixed(2) : 0,
      min: Math.min(...values).toFixed(2),
      max: Math.max(...values).toFixed(2),
      count: filteredGrades.length,
    };
  };

  const getSubjectAverages = () => {
    const subjectGrades = {};
    
    grades.forEach(grade => {
      if (!subjectGrades[grade.subject_id]) {
        subjectGrades[grade.subject_id] = { total: 0, coef: 0 };
      }
      subjectGrades[grade.subject_id].total += (grade.value / grade.max_value) * 20 * grade.coefficient;
      subjectGrades[grade.subject_id].coef += grade.coefficient;
    });

    return subjects.map((subject, i) => ({
      name: subject.name,
      average: subjectGrades[subject.id] 
        ? (subjectGrades[subject.id].total / subjectGrades[subject.id].coef).toFixed(2)
        : 0,
      color: subject.color || COLORS[i % COLORS.length],
    })).filter(s => parseFloat(s.average) > 0);
  };

  const getGradesTrend = () => {
    const sorted = [...filteredGrades].sort((a, b) => 
      new Date(a.date) - new Date(b.date)
    );
    
    return sorted.map((grade, i) => ({
      name: format(parseISO(grade.date), 'dd/MM', { locale: fr }),
      value: (grade.value / grade.max_value) * 20,
      subject: subjects.find(s => s.id === grade.subject_id)?.name || 'Matière',
    }));
  };

  const stats = calculateStats();
  const subjectAverages = getSubjectAverages();
  const gradesTrend = getGradesTrend();

  const getTrendIcon = (current, previous) => {
    if (current > previous) return <TrendingUp className="w-4 h-4 text-green-500" />;
    if (current < previous) return <TrendingDown className="w-4 h-4 text-red-500" />;
    return <Minus className="w-4 h-4 text-muted-foreground" />;
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="grades-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <GraduationCap className="w-6 h-6 text-primary" />
            Mes notes
          </CardTitle>
          <div className="flex items-center gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-40" data-testid="subject-filter">
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
            
            <Select value={selectedTrimester} onValueChange={setSelectedTrimester}>
              <SelectTrigger className="w-40" data-testid="trimester-filter">
                <SelectValue placeholder="Trimestre" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="1">Trimestre 1</SelectItem>
                <SelectItem value="2">Trimestre 2</SelectItem>
                <SelectItem value="3">Trimestre 3</SelectItem>
              </SelectContent>
            </Select>
          </div>
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
              {filteredGrades.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">
                  Aucune note à afficher
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredGrades
                    .sort((a, b) => new Date(b.date) - new Date(a.date))
                    .map((grade, i) => {
                      const subject = subjects.find(s => s.id === grade.subject_id);
                      const value = (grade.value / grade.max_value) * 20;
                      
                      return (
                        <motion.div
                          key={grade.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors"
                        >
                          <div
                            className="w-2 h-12 rounded-full"
                            style={{ backgroundColor: subject?.color || '#4F46E5' }}
                          />
                          <div className="flex-1 min-w-0">
                            <p className="font-medium">{grade.description}</p>
                            <p className="text-sm text-muted-foreground">
                              {subject?.name || 'Matière'} • {format(parseISO(grade.date), 'dd MMMM yyyy', { locale: fr })}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className={`text-xl font-bold ${value >= 10 ? 'text-green-500' : 'text-secondary'}`}>
                              {grade.value}/{grade.max_value}
                            </p>
                            <Badge variant="outline">Coef. {grade.coefficient}</Badge>
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
