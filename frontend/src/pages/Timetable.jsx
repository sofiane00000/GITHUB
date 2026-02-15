import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin } from 'lucide-react';
import { timetableAPI, subjectsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';
import { format, addWeeks, subWeeks, startOfWeek, addDays } from 'date-fns';
import { fr } from 'date-fns/locale';

const HOURS = Array.from({ length: 12 }, (_, i) => i + 8); // 8h to 19h
const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi'];

export function Timetable() {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const [timetable, setTimetable] = useState([]);
  const [subjects, setSubjects] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [timetableRes, subjectsRes] = await Promise.all([
        timetableAPI.get(),
        subjectsAPI.getAll(),
      ]);
      
      setTimetable(timetableRes.data || []);
      
      const subjectsMap = {};
      (subjectsRes.data || []).forEach(s => {
        subjectsMap[s.id] = s;
      });
      setSubjects(subjectsMap);
    } catch (error) {
      console.error('Error fetching timetable:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 1 });

  const getSlotStyle = (slot) => {
    const startHour = parseInt(slot.start_time.split(':')[0]);
    const startMin = parseInt(slot.start_time.split(':')[1]);
    const endHour = parseInt(slot.end_time.split(':')[0]);
    const endMin = parseInt(slot.end_time.split(':')[1]);
    
    const top = ((startHour - 8) * 60 + startMin) * (80 / 60);
    const height = ((endHour - startHour) * 60 + (endMin - startMin)) * (80 / 60);
    
    return { top: `${top}px`, height: `${height}px` };
  };

  const getSlotsByDay = (dayIndex) => {
    return timetable.filter(slot => slot.day_of_week === dayIndex);
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
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="w-6 h-6 text-primary" />
            Emploi du temps
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(subWeeks(currentWeek, 1))}
              data-testid="prev-week-btn"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-sm font-medium min-w-[200px] text-center">
              Semaine du {format(weekStart, 'd MMMM yyyy', { locale: fr })}
            </span>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setCurrentWeek(addWeeks(currentWeek, 1))}
              data-testid="next-week-btn"
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
            <div className="flex-1 flex">
              {DAYS.map((day, dayIndex) => {
                const date = addDays(weekStart, dayIndex);
                const isToday = format(new Date(), 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
                const slots = getSlotsByDay(dayIndex);

                return (
                  <div key={day} className="flex-1 min-w-0 border-r border-border last:border-r-0">
                    {/* Day Header */}
                    <div className={cn(
                      "h-12 flex flex-col items-center justify-center border-b border-border",
                      isToday && "bg-primary/10"
                    )}>
                      <span className="text-sm font-medium">{day}</span>
                      <span className={cn(
                        "text-xs",
                        isToday ? "text-primary font-semibold" : "text-muted-foreground"
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
                      {slots.map((slot, i) => {
                        const style = getSlotStyle(slot);
                        const subject = subjects[slot.subject_id] || {};
                        
                        return (
                          <motion.div
                            key={slot.id}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            className="absolute left-1 right-1 rounded-lg p-2 overflow-hidden cursor-pointer hover:z-10 transition-all hover:shadow-lg"
                            style={{
                              ...style,
                              backgroundColor: slot.subject_color || subject.color || '#4F46E5',
                            }}
                            data-testid={`timetable-slot-${slot.id}`}
                          >
                            <div className="text-white text-xs font-medium truncate">
                              {slot.subject_name || subject.name}
                            </div>
                            <div className="text-white/80 text-xs truncate flex items-center gap-1 mt-0.5">
                              <Clock className="w-3 h-3" />
                              {slot.start_time} - {slot.end_time}
                            </div>
                            <div className="text-white/80 text-xs truncate flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {slot.room}
                            </div>
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

      {/* Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap gap-3">
            {Object.values(subjects).map(subject => (
              <Badge
                key={subject.id}
                variant="outline"
                className="gap-2"
                style={{ borderColor: subject.color }}
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: subject.color }}
                />
                {subject.name}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
