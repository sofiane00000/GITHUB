import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  FileText, Search, Filter, Download, Video, 
  BookOpen, FileQuestion, FolderOpen
} from 'lucide-react';
import { resourcesAPI, subjectsAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';

const RESOURCE_ICONS = {
  document: FileText,
  video: Video,
  exercise: FileQuestion,
  course: BookOpen,
};

const CLASS_LEVELS = [
  { value: '6eme', label: '6ème' },
  { value: '5eme', label: '5ème' },
  { value: '4eme', label: '4ème' },
  { value: '3eme', label: '3ème' },
  { value: 'seconde', label: 'Seconde' },
  { value: 'premiere', label: 'Première' },
  { value: 'terminale', label: 'Terminale' },
];

export function Resources() {
  const [resources, setResources] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [selectedSubject, setSelectedSubject] = useState('all');
  const [selectedLevel, setSelectedLevel] = useState('all');
  const [selectedType, setSelectedType] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [resourcesRes, subjectsRes] = await Promise.all([
        resourcesAPI.getAll(),
        subjectsAPI.getAll(),
      ]);
      
      setResources(resourcesRes.data || []);
      setSubjects(subjectsRes.data || []);
    } catch (error) {
      console.error('Error fetching resources:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredResources = resources.filter(resource => {
    if (selectedSubject !== 'all' && resource.subject_id !== selectedSubject) return false;
    if (selectedLevel !== 'all' && resource.class_level !== selectedLevel) return false;
    if (selectedType !== 'all' && resource.resource_type !== selectedType) return false;
    if (searchQuery && !resource.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const getResourceIcon = (type) => {
    const Icon = RESOURCE_ICONS[type] || FileText;
    return Icon;
  };

  const getTypeColor = (type) => {
    const colors = {
      document: 'bg-blue-500',
      video: 'bg-red-500',
      exercise: 'bg-green-500',
      course: 'bg-purple-500',
    };
    return colors[type] || 'bg-gray-500';
  };

  // Demo resources if none exist
  const demoResources = [
    {
      id: 'demo-1',
      title: 'Introduction aux fractions',
      description: 'Cours complet sur les fractions pour les 6ème',
      subject_id: 'math-1',
      class_level: '6eme',
      resource_type: 'course',
    },
    {
      id: 'demo-2',
      title: 'Exercices - Les verbes du 1er groupe',
      description: 'Série d\'exercices sur la conjugaison',
      subject_id: 'french-1',
      class_level: '6eme',
      resource_type: 'exercise',
    },
    {
      id: 'demo-3',
      title: 'Vidéo - La Révolution française',
      description: 'Documentaire sur les événements de 1789',
      subject_id: 'history-1',
      class_level: '4eme',
      resource_type: 'video',
    },
    {
      id: 'demo-4',
      title: 'Fiche de révision - Photosynthèse',
      description: 'Résumé du chapitre sur la photosynthèse',
      subject_id: 'science-1',
      class_level: '5eme',
      resource_type: 'document',
    },
  ];

  const displayResources = filteredResources.length > 0 ? filteredResources : demoResources;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="resources-page"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FolderOpen className="w-6 h-6 text-primary" />
            Ressources pédagogiques
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher une ressource..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              data-testid="resource-search-input"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4">
            <Select value={selectedSubject} onValueChange={setSelectedSubject}>
              <SelectTrigger className="w-40" data-testid="resource-subject-filter">
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

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-40" data-testid="resource-level-filter">
                <SelectValue placeholder="Niveau" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                {CLASS_LEVELS.map(level => (
                  <SelectItem key={level.value} value={level.value}>
                    {level.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger className="w-40" data-testid="resource-type-filter">
                <SelectValue placeholder="Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous</SelectItem>
                <SelectItem value="course">Cours</SelectItem>
                <SelectItem value="document">Documents</SelectItem>
                <SelectItem value="exercise">Exercices</SelectItem>
                <SelectItem value="video">Vidéos</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Resources Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {displayResources.map((resource, i) => {
          const Icon = getResourceIcon(resource.resource_type);
          const subject = subjects.find(s => s.id === resource.subject_id);
          
          return (
            <motion.div
              key={resource.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card className="h-full card-hover cursor-pointer group">
                <CardContent className="p-5">
                  <div className="flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl ${getTypeColor(resource.resource_type)} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">
                        {resource.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {resource.description}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <Badge variant="outline" style={{ borderColor: subject?.color }}>
                          {subject?.name || 'Matière'}
                        </Badge>
                        <Badge variant="secondary">
                          {CLASS_LEVELS.find(l => l.value === resource.class_level)?.label || resource.class_level}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {displayResources.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <FolderOpen className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Aucune ressource trouvée</h3>
            <p className="text-muted-foreground">
              Essayez de modifier vos filtres de recherche
            </p>
          </CardContent>
        </Card>
      )}
    </motion.div>
  );
}
