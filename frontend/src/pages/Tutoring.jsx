import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Brain, Sparkles, BookOpen, Play, CheckCircle2, 
  XCircle, ChevronRight, Loader2, GraduationCap
} from 'lucide-react';
import { aiAPI } from '../lib/api';
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
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('quiz-generator');
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

  const handleGenerateQuiz = async () => {
    if (!quizParams.subject || !quizParams.topic) {
      toast.error('Veuillez sélectionner une matière et un sujet');
      return;
    }

    setIsLoading(true);
    try {
      const { data } = await aiAPI.generateQuiz(quizParams);
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
      // Calculate result
      const questions = activeQuiz.questions;
      let correct = 0;
      newAnswers.forEach((answer, i) => {
        if (answer === questions[i]?.correct_answer) correct++;
      });
      
      setQuizResult({
        score: (correct / questions.length) * 100,
        correct,
        total: questions.length,
        answers: newAnswers.map((a, i) => ({
          userAnswer: a,
          correctAnswer: questions[i]?.correct_answer,
          isCorrect: a === questions[i]?.correct_answer
        }))
      });
      setShowResult(true);
    }
  };

  const handleTutoring = async () => {
    if (!tutoringQuestion.trim()) return;

    setIsTutoring(true);
    try {
      const { data } = await aiAPI.tutoring(
        quizParams.subject || 'Général',
        quizParams.topic || 'Question libre',
        tutoringQuestion
      );
      setTutoringResponse(data.response);
    } catch (error) {
      toast.error('Erreur lors de la demande');
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
              <h1 className="text-2xl font-bold">Quiz & Aide IA</h1>
              <p className="text-muted-foreground">
                Générez des quiz et obtenez de l'aide avec l'IA Papillon
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="quiz-generator">Générateur</TabsTrigger>
          <TabsTrigger value="take-quiz" disabled={!activeQuiz}>Quiz</TabsTrigger>
          <TabsTrigger value="tutoring">Aide</TabsTrigger>
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
                  <label className="text-sm font-medium">Matière</label>
                  <Select
                    value={quizParams.subject}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, subject: value }))}
                  >
                    <SelectTrigger>
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
                <Input
                  value={quizParams.topic}
                  onChange={(e) => setQuizParams(prev => ({ ...prev, topic: e.target.value }))}
                  placeholder="Ex: Les fractions, La Révolution française..."
                />
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
                    max={10}
                    step={1}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Difficulté</label>
                  <Select
                    value={quizParams.difficulty}
                    onValueChange={(value) => setQuizParams(prev => ({ ...prev, difficulty: value }))}
                  >
                    <SelectTrigger>
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
                  <GraduationCap className="w-10 h-10 text-white" />
                </div>
                
                <h2 className="text-2xl font-bold mb-2">Quiz terminé !</h2>
                <p className="text-4xl font-bold text-primary mb-4">
                  {quizResult.score.toFixed(0)}%
                </p>
                
                <div className="flex justify-center gap-4 mb-6">
                  <div className="flex items-center gap-2 text-green-500">
                    <CheckCircle2 className="w-5 h-5" />
                    <span>{quizResult.correct} correct</span>
                  </div>
                  <div className="flex items-center gap-2 text-red-500">
                    <XCircle className="w-5 h-5" />
                    <span>{quizResult.total - quizResult.correct} incorrect</span>
                  </div>
                </div>

                <Button onClick={resetQuiz} className="rounded-full">
                  Nouveau quiz
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
                Aide aux devoirs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Posez une question sur n'importe quel sujet et recevez une explication claire.
              </p>

              <div className="space-y-2">
                <label className="text-sm font-medium">Votre question</label>
                <textarea
                  value={tutoringQuestion}
                  onChange={(e) => setTutoringQuestion(e.target.value)}
                  placeholder="Ex: Comment résoudre une équation du second degré ?"
                  className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <Button
                onClick={handleTutoring}
                disabled={isTutoring || !tutoringQuestion.trim()}
                className="w-full"
              >
                {isTutoring ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Réflexion...
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
