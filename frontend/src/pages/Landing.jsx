import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, GraduationCap, MessageSquare, 
  Brain, BookOpen, Users, ChevronRight, Star
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { AuthModal } from '../components/features/AuthModal';

const features = [
  {
    icon: Calendar,
    title: 'Emploi du temps',
    description: 'Consultez votre planning interactif en temps réel',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: GraduationCap,
    title: 'Notes & Bulletins',
    description: 'Suivez vos résultats avec des graphiques détaillés',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Brain,
    title: 'Assistant IA',
    description: 'Papillon vous aide avec vos devoirs et révisions',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: BookOpen,
    title: 'Ressources',
    description: 'Accédez à tous vos cours et supports pédagogiques',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: MessageSquare,
    title: 'Messagerie',
    description: 'Communiquez avec vos professeurs et camarades',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: Users,
    title: 'Forum',
    description: 'Entraidez-vous sur le forum de discussion',
    color: 'from-rose-500 to-pink-500',
  },
];

const stats = [
  { value: '10K+', label: 'Élèves actifs' },
  { value: '500+', label: 'Professeurs' },
  { value: '95%', label: 'Satisfaction' },
  { value: '24/7', label: 'Support IA' },
];

export function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const [authMode, setAuthMode] = useState('login');
  const navigate = useNavigate();

  const openAuth = (mode) => {
    setAuthMode(mode);
    setShowAuth(true);
  };

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Mesh gradient background */}
      <div className="fixed inset-0 mesh-gradient opacity-50" />
      <div className="fixed inset-0 noise-overlay" />
      
      {/* Navigation */}
      <nav className="relative z-10 px-6 py-4 flex items-center justify-between max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold gradient-text">Papillon</span>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            onClick={() => openAuth('login')}
            data-testid="login-btn"
          >
            Connexion
          </Button>
          <Button 
            onClick={() => openAuth('register')}
            className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
            data-testid="register-btn"
          >
            S'inscrire
          </Button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative z-10 px-6 py-20 max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary mb-6">
              <Star className="w-4 h-4 fill-current" />
              <span className="text-sm font-medium">L'ENT nouvelle génération</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              L'école qui vous donne{' '}
              <span className="gradient-text">des ailes</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Papillon réunit tous les outils dont vous avez besoin : emploi du temps, notes, 
              devoirs, messagerie et un assistant IA pour vous accompagner au quotidien.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                onClick={() => openAuth('register')}
                className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 px-8 active:scale-95 transition-transform"
                data-testid="get-started-btn"
              >
                Commencer gratuitement
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
              <Button 
                size="lg"
                variant="outline"
                onClick={() => openAuth('login')}
                className="rounded-full px-8"
              >
                Démo
              </Button>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src="https://images.unsplash.com/photo-1767102060241-130cb9260718?crop=entropy&cs=srgb&fm=jpg&q=85&w=800"
                alt="Étudiants utilisant Papillon"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
            </div>
            
            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -left-8 top-1/4 glass rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-green-500" />
                </div>
                <div>
                  <p className="font-semibold">Moyenne générale</p>
                  <p className="text-2xl font-bold text-green-500">15.8/20</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute -right-4 bottom-1/4 glass rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Assistant IA</p>
                  <p className="font-medium">Prêt à aider !</p>
                </div>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Stats */}
      <section className="relative z-10 py-12 border-y border-border bg-card/50 backdrop-blur">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="text-center"
              >
                <p className="text-3xl md:text-4xl font-bold gradient-text">{stat.value}</p>
                <p className="text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="relative z-10 py-20 px-6 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Tout ce dont vous avez besoin
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une plateforme complète pour gérer votre vie scolaire avec des fonctionnalités 
            avancées et une interface moderne.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all duration-300 card-hover"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <feature.icon className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative z-10 py-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-12 rounded-3xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20"
          >
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Prêt à décoller ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Rejoignez des milliers d'élèves et de professeurs qui utilisent déjà Papillon 
              pour transformer leur expérience scolaire.
            </p>
            <Button 
              size="lg"
              onClick={() => openAuth('register')}
              className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 px-12 text-lg active:scale-95 transition-transform"
              data-testid="cta-register-btn"
            >
              Créer mon compte
              <ChevronRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-8 px-6 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <span className="font-semibold">Papillon ENT</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2024 Papillon. Tous droits réservés.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
        mode={authMode}
        onModeChange={setAuthMode}
      />
    </div>
  );
}
