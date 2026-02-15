import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, BookOpen, Play, CheckCircle2, 
  XCircle, ChevronRight, Trophy, Loader2, GraduationCap
} from 'lucide-react';
import { quizzesAPI, aiAPI, curriculumAPI } from '../lib/api';
import { useAuthStore } from '../store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Badge } from '../components/ui/badge';
import { Progress } from '../components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/ui/select';
import { Slider } from '../components/ui/slider';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const CLASS_LEVELS = [
  { value: '6eme', label: '6ème' },
  { value: '5eme', label: '5ème' },
  { value: '4eme', label: '4ème' },
  { value: '3eme', label: '3ème' },
  { value: 'seconde', label: 'Seconde' },
  { value: 'premiere', label: 'Première' },
  { value: 'terminale', label: 'Terminale' },
];

const SUBJECTS = [
  'Mathématiques', 'Français', 'Histoire-Géographie', 
  'SVT', 'Anglais', 'Physique-Chimie', 'Philosophie'
];

export function Tutoring() {
  const { user, updateUser } = useAuthStore();
  const [activeTab, setActiveTab] = useState('quiz-generator');
  const [quizzes, setQuizzes] = useState([]);
  const [curriculum, setCurriculum] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  
  // Quiz Generator State
  const [quizParams, setQuizParams] = useState({
    subject: '',
    topic: '',
    class_level: '6eme',
    num_questions: 5,
    difficulty: 'medium',
  });
  
  // Active Quiz State
  const [activeQuiz, setActiveQuiz] = useState(null);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answers, setAnswers] = useState([]);
  const [showResult, setShowResult] = useState(false);
  const [quizResult, setQuizResult] = useState(null);

  // Tutoring State
  const [tutoringQuestion, setTutoringQuestion] = useState('');
  const [tutoringResponse, setTutoringResponse] = useState('');
  const [isTutoring, setIsTutoring] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [quizzesRes, curriculumRes] = await Promise.all([
        quizzesAPI.getAll().catch(() => ({ data: [] })),
        curriculumAPI.getAll().catch(() => ({ data: {} })),
      ]);
      
      setQuizzes(quizzesRes.data || []);
      setCurriculum(curriculumRes.data || {});
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const getTopicsForSubject = () => {
    const levelData = curriculum[quizParams.class_level];
    if (!levelData) return [];
    return levelData[quizParams.subject] || [];
  };

  const handleGenerateQuiz = async () => {
    if (!quizParams.subject || !quizParams.topic) {
      toast.error('Veuillez sélectionner une matière et un sujet');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await quizzesAPI.generate(quizParams);
      toast.success('Quiz généré avec succès !');
      setActiveQuiz(data);
      setCurrentQuestion(0);
      setAnswers([]);
      setShowResult(false);
      setQuizResult(null);
      setActiveTab('take-quiz');
    } catch (error) {
      toast.error('Erreur lors de la génération du quiz');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectAnswer = (answerIndex) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) return;
    
    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestion < activeQuiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Quiz finished, submit
      handleSubmitQuiz(newAnswers);
    }
  };

  const handleSubmitQuiz = async (finalAnswers) => {
    try {
      const { data } = await quizzesAPI.submit(activeQuiz.id, finalAnswers);
      setQuizResult(data);
      setShowResult(true);
      
      // Update user XP
      if (data.xp_earned) {
        updateUser({ xp_points: (user?.xp_points || 0) + data.xp_earned });
        toast.success(`+${data.xp_earned} XP gagnés !`);
      }
    } catch (error) {
      toast.error('Erreur lors de la soumission du quiz');
    }
  };

  const handleTutoring = async () => {
    if (!tutoringQuestion.trim()) return;

    setIsTutoring(true);
    try {
      const { data } = await aiAPI.tutoring(
        quizParams.subject || 'Général',
        quizParams.topic || 'Question libre',
        tutoringQuestion,
        quizParams.class_level
      );
      setTutoringResponse(data.response);
      
      if (data.xp_earned) {
        updateUser({ xp_points: (user?.xp_points || 0) + data.xp_earned });
        toast.success(`+${data.xp_earned} XP pour avoir utilisé le soutien !`);
      }
    } catch (error) {
      toast.error('Erreur lors de la demande de soutien');
    } finally {
      setIsTutoring(false);
    }
  };

  const resetQuiz = () => {
    setActiveQuiz(null);
    setCurrentQuestion(0);
    setSelectedAnswer(null);
    setAnswers([]);
    setShowResult(false);
    setQuizResult(null);
    setActiveTab('quiz-generator');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
      data-testid="tutoring-page"
    >
      {/* Header */}
      <Card className="bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border-none">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Brain className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Quiz & Soutien scolaire</h1>
              <p className="text-muted-foreground">
                Générez des quiz personnalisés et obtenez de l'aide avec l'IA
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="quiz-generator">Générateur</TabsTrigger>
          <TabsTrigger value="take-quiz" disabled={!activeQuiz}>Quiz actif</TabsTrigger>
          <TabsTrigger value="tutoring">Soutien</TabsTrigger>
        </TabsList>

        {/* Quiz Generator */}
        <TabsContent value="quiz-generator" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-primary" />
                Créer un quiz personnalisé
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Niveau</label>
                  <Select
                    value={quizParams.class_level}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, class_level: value, topic: '' }))}
                  >
                    <SelectTrigger data-testid="quiz-level-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CLASS_LEVELS.map(level => (
                        <SelectItem key={level.value} value={level.value}>
                          {level.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Matière</label>
                  <Select
                    value={quizParams.subject}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, subject: value, topic: '' }))}
                  >
                    <SelectTrigger data-testid="quiz-subject-select">
                      <SelectValue placeholder="Choisir une matière" />
                    </SelectTrigger>
                    <SelectContent>
                      {SUBJECTS.map(subject => (
                        <SelectItem key={subject} value={subject}>
                          {subject}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Sujet / Thème</label>
                {getTopicsForSubject().length > 0 ? (
                  <Select
                    value={quizParams.topic}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, topic: value }))}
                  >
                    <SelectTrigger data-testid="quiz-topic-select">
                      <SelectValue placeholder="Choisir un sujet du programme" />
                    </SelectTrigger>
                    <SelectContent>
                      {getTopicsForSubject().map(topic => (
                        <SelectItem key={topic} value={topic}>
                          {topic}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    value={quizParams.topic}
                    onChange={(e) => setQuizParams(prev => ({ ...prev, topic: e.target.value }))}
                    placeholder="Ex: Les fractions, La Révolution française..."
                    data-testid="quiz-topic-input"
                  />
                )}
              </div>

              <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">
                    Nombre de questions: {quizParams.num_questions}
                  </label>
                  <Slider
                    value={[quizParams.num_questions]}
                    onValueChange={([value]) => setQuizParams(prev => ({ ...prev, num_questions: value }))}
                    min={3}
                    max={15}
                    step={1}
                    data-testid="quiz-questions-slider"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulté</label>
                  <Select
                    value={quizParams.difficulty}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger data-testid="quiz-difficulty-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="easy">Facile</SelectItem>
                      <SelectItem value="medium">Moyen</SelectItem>
                      <SelectItem value="hard">Difficile</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={handleGenerateQuiz}
                disabled={isLoading || !quizParams.subject || !quizParams.topic}
                className="w-full rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                data-testid="generate-quiz-btn"
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Générer le quiz
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Existing Quizzes */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Quiz disponibles</CardTitle>
            </CardHeader>
            <CardContent>
              {quizzes.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Aucun quiz disponible</p>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => (
                    <motion.button
                      key={quiz.id}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        setActiveQuiz(quiz);
                        setCurrentQuestion(0);
                        setAnswers([]);
                        setShowResult(false);
                        setActiveTab('take-quiz');
                      }}
                      className="p-4 rounded-xl border border-border text-left hover:border-primary/50 transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-medium">{quiz.title}</h3>
                          <p className="text-sm text-muted-foreground">
                            {quiz.questions?.length || 0} questions
                          </p>
                        </div>
                        {quiz.is_ai_generated && (
                          <Badge variant="secondary" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            IA
                          </Badge>
                        )}
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Take Quiz */}
        <TabsContent value="take-quiz">
          {activeQuiz && !showResult && (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{activeQuiz.title}</CardTitle>
                  <Badge variant="outline">
                    Question {currentQuestion + 1}/{activeQuiz.questions?.length || 0}
                  </Badge>
                </div>
                <Progress 
                  value={((currentQuestion + 1) / (activeQuiz.questions?.length || 1)) * 100} 
                  className="h-2 mt-2"
                />
              </CardHeader>
              <CardContent className="space-y-6">
                {activeQuiz.questions?.[currentQuestion] && (
                  <>
                    <h2 className="text-xl font-medium">
                      {activeQuiz.questions[currentQuestion].question}
                    </h2>

                    <div className="space-y-3">
                      {activeQuiz.questions[currentQuestion].options?.map((option, index) => (
                        <motion.button
                          key={index}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                          onClick={() => handleSelectAnswer(index)}
                          className={cn(
                            "w-full p-4 rounded-xl border-2 text-left transition-all",
                            selectedAnswer === index
                              ? "border-primary bg-primary/10"
                              : "border-border hover:border-primary/50"
                          )}
                          data-testid={`answer-option-${index}`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium",
                              selectedAnswer === index
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted"
                            )}>
                              {String.fromCharCode(65 + index)}
                            </div>
                            <span>{option}</span>
                          </div>
                        </motion.button>
                      ))}
                    </div>

                    <Button
                      onClick={handleNextQuestion}
                      disabled={selectedAnswer === null}
                      className="w-full"
                      data-testid="next-question-btn"
                    >
                      {currentQuestion < activeQuiz.questions.length - 1 ? (
                        <>
                          Question suivante
                          <ChevronRight className="w-5 h-5 ml-2" />
                        </>
                      ) : (
                        'Terminer le quiz'
                      )}
                    </Button>
                  </>
                )}
              </CardContent>
            </Card>
          )}

          {showResult && quizResult && (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
                  <Trophy className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
                <p className="text-4xl font-bold text-primary mb-4">
                  {quizResult.result?.score?.toFixed(0)}%
                </p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{quizResult.result?.answers?.filter(a => a.correct).length || 0} correct</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="w-5 h-5" />
                    <span>{quizResult.result?.answers?.filter(a => !a.correct).length || 0} incorrect</span>
                  </div>
                </div>

                {quizResult.xp_earned > 0 && (
                  <Badge className="mb-6 gap-1">
                    <Sparkles className="w-3 h-3" />
                    +{quizResult.xp_earned} XP gagnés
                  </Badge>
                )}

                <Button onClick={resetQuiz} className="rounded-full" data-testid="restart-quiz-btn">
                  Créer un nouveau quiz
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Tutoring */}
        <TabsContent value="tutoring" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-primary" />
                Soutien scolaire IA
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Posez une question sur n'importe quel sujet et recevez une explication claire et adaptée à votre niveau.
              </p>

              <div className="grid md:grid-cols-2 gap-4">
                <Select
                  value={quizParams.subject}
                  onValueChange={(value) => setQuizParams(prev => ({ ...prev, subject: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Matière (optionnel)" />
                  </SelectTrigger>
                  <SelectContent>
                    {SUBJECTS.map(subject => (
                      <SelectItem key={subject} value={subject}>
                        {subject}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={quizParams.class_level}
                  onValueChange={(value) => setQuizParams(prev => ({ ...prev, class_level: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CLASS_LEVELS.map(level => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Votre question</label>
                <textarea
                  value={tutoringQuestion}
                  onChange={(e) => setTutoringQuestion(e.target.value)}
                  placeholder="Ex: Comment résoudre une équation du second degré ?"
                  className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                  data-testid="tutoring-question-input"
                />
              </div>

              <Button
                onClick={handleTutoring}
                disabled={isTutoring || !tutoringQuestion.trim()}
                className="w-full"
                data-testid="ask-tutor-btn"
              >
                {isTutoring ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Réflexion en cours...
                  </>
                ) : (
                  <>
                    <Brain className="w-5 h-5 mr-2" />
                    Demander de l'aide
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {tutoringResponse && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Sparkles className="w-5 h-5 text-primary" />
                  Réponse de Papillon
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose prose-sm max-w-none dark:prose-invert">
                  <p className="whitespace-pre-wrap">{tutoringResponse}</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
