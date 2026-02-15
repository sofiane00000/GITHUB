import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, X } from 'lucide-react';
import { timetableAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { format, addDays, subDays, parseISO, startOfWeek, isToday } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '../lib/utils';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8);
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export function Timetable() {
  const { user } = useAuthStore();
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchTimetable();
  }, [currentWeek]);

  const fetchTimetable = async () => {
    try {
      const { data } = await timetableAPI.get(format(currentWeek, 'yyyy-MM-dd'));
      setLessons(data.lessons || []);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  // Group lessons by day
  const getLessonsByDay = (dayIndex) => {
    const targetDate = addDays(weekStart, dayIndex);
    const targetDateStr = format(targetDate, 'yyyy-MM-dd');
    
    return lessons.filter(lesson => {
      if (!lesson.start) return false;
      try {
        const lessonDate = format(parseISO(lesson.start), 'yyyy-MM-dd');
        return lessonDate === targetDateStr;
      } catch {
        return false;
      }
    }).sort((a, b) => a.start?.localeCompare(b.start));
  };

  const getSlotStyle = (lesson) => {
    if (!lesson.start || !lesson.end) return { top: '0px', height: '80px' };
    
    try {
      const start = parseISO(lesson.start);
      const end = parseISO(lesson.end);
      
      const startHour = start.getHours();
      const startMin = start.getMinutes();
      const endHour = end.getHours();
      const endMin = end.getMinutes();
      
      const top = ((startHour - 8) * 60 + startMin) * (80 / 60);
      const height = ((endHour - startHour) * 60 + (endMin - startMin)) * (80 / 60);
      
      return { top: `${top}px`, height: `${Math.max(height, 40)}px` };
    } catch {
      return { top: '0px', height: '80px' };
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="timetable-page"
    >
      {/* Header */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Emploi du temps
            <Badge variant="outline" className="ml-2">
              {user?.provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}
            </Badge>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subDays(currentWeek, 7))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentWeek(new Date())}
            >
              Aujourd'hui
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Timetable Grid */}
      <Card className="overflow-hidden">
        <CardContent className="p-0">
          <div className="flex">
            {/* Hours Column */}
            <div className="w-16 flex-shrink-0 border-r border-border bg-muted/30">
              <div className="h-12 border-b border-border" />
              {HOURS.map(hour => (
                <div
                  key={hour}
                  className="h-20 flex items-start justify-center pt-1 text-xs text-muted-foreground font-medium"
                >
                  {hour}:00
                </div>
              ))}
            </div>

            {/* Days Columns */}
            <div className="flex-1 flex overflow-x-auto">
              {DAYS.map((day, dayIndex) => {
                const date = addDays(weekStart, dayIndex);
                const todayCheck = isToday(date);
                const dayLessons = getLessonsByDay(dayIndex);

                return (
                  <div key={day} className="flex-1 min-w-[150px] border-r border-border last:border-r-0">
                    {/* Day Header */}
                    <div className={cn(
                      "h-12 flex flex-col items-center justify-center border-b border-border",
                      todayCheck && "bg-primary/10"
                    )}>
                      <span className="text-sm font-medium">{day}</span>
                      <span className={cn(
                        "text-xs",
                        todayCheck ? "text-primary font-semibold" : "text-muted-foreground"
                      )}>
                        {format(date, 'd MMM', { locale: fr })}
                      </span>
                    </div>

                    {/* Time Slots */}
                    <div className="relative">
                      {/* Hour Lines */}
                      {HOURS.map(hour => (
                        <div
                          key={hour}
                          className="h-20 border-b border-border/50"
                        />
                      ))}

                      {/* Course Slots */}
                      {dayLessons.map((lesson, i) => {
                        const style = getSlotStyle(lesson);
                        
                        return (
                          <motion.div
                            key={lesson.id || i}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className={cn(
                              "absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer hover:z-10 transition-all hover:shadow-lg",
                              lesson.canceled && "opacity-50"
                            )}
                            style={{
                              ...style,
                              backgroundColor: lesson.subject_color || '#4F46E5',
                            }}
                          >
                            <div className="text-white text-xs font-medium truncate">
                              {lesson.subject}
                            </div>
                            {lesson.start && lesson.end && (
                              <div className="text-white/80 text-xs truncate flex items-center gap-1 mt-0.5">
                                <Clock className="w-3 h-3" />
                                {format(parseISO(lesson.start), 'HH:mm')} - {format(parseISO(lesson.end), 'HH:mm')}
                              </div>
                            )}
                            {lesson.room && (
                              <div className="text-white/80 text-xs truncate flex items-center gap-1">
                                <MapPin className="w-3 h-3" />
                                {lesson.room}
                              </div>
                            )}
                            {lesson.canceled && (
                              <div className="absolute top-1 right-1">
                                <X className="w-4 h-4 text-white" />
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Today's Lessons List (Mobile Friendly) */}
      <Card className="lg:hidden">
        <CardHeader>
          <CardTitle className="text-lg">Cours du jour</CardTitle>
        </CardHeader>
        <CardContent>
          {getLessonsByDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1).length === 0 ? (
            <p className="text-center text-muted-foreground py-4">Pas de cours aujourd'hui</p>
          ) : (
            <div className="space-y-3">
              {getLessonsByDay(new Date().getDay() === 0 ? 6 : new Date().getDay() - 1).map((lesson, i) => (
                <div 
                  key={lesson.id || i}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl bg-muted/50",
                    lesson.canceled && "opacity-50"
                  )}
                >
                  <div 
                    className="w-1 h-12 rounded-full"
                    style={{ backgroundColor: lesson.subject_color || '#4F46E5' }}
                  />
                  <div className="flex-1">
                    <p className="font-medium">{lesson.subject}</p>
                    <p className="text-sm text-muted-foreground">
                      {lesson.start && format(parseISO(lesson.start), 'HH:mm')}
                      {lesson.end && ` - ${format(parseISO(lesson.end), 'HH:mm')}`}
                      {lesson.room && ` • ${lesson.room}`}
                    </p>
                  </div>
                  {lesson.canceled && <Badge variant="destructive">Annulé</Badge>}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}
