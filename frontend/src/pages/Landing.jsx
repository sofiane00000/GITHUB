import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  Sparkles, Calendar, GraduationCap, BookOpen, 
  Brain, CheckCircle, ChevronRight, Star, Zap,
  Shield, Clock, Smartphone
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { AuthModal } from '../components/features/AuthModal';

const features = [
  {
    icon: Calendar,
    title: 'Emploi du temps unifié',
    description: 'Consultez votre planning depuis Pronote ou EcoleDirecte en un seul endroit',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: GraduationCap,
    title: 'Notes en temps réel',
    description: 'Toutes vos notes avec moyennes et graphiques détaillés',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: BookOpen,
    title: 'Devoirs organisés',
    description: 'Vos devoirs triés par date avec rappels intelligents',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Brain,
    title: 'Assistant IA',
    description: 'Papillon vous aide pour vos révisions et exercices',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: Zap,
    title: 'Interface moderne',
    description: 'Design épuré et personnalisable à 100%',
    color: 'from-yellow-500 to-orange-500',
  },
  {
    icon: Shield,
    title: 'Sécurisé',
    description: 'Connexion directe à votre ENT, aucune donnée stockée',
    color: 'from-indigo-500 to-violet-500',
  },
];

const providers = [
  {
    name: 'Pronote',
    logo: 'https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png',
    description: 'Index-Education',
  },
  {
    name: 'EcoleDirecte',
    logo: 'https://www.ecoledirecte.com/favicon.ico',
    description: 'Aplim',
  },
];

const stats = [
  { value: 'Pronote', label: 'Compatible' },
  { value: 'EcoleDirecte', label: 'Compatible' },
  { value: 'IA', label: 'Assistant intégré' },
  { value: '100%', label: 'Gratuit' },
];

export function Landing() {
  const [showAuth, setShowAuth] = useState(false);
  const navigate = useNavigate();

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
        
        <Button 
          onClick={() => setShowAuth(true)}
          className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
          data-testid="login-btn"
        >
          Se connecter
        </Button>
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
              <span className="text-sm font-medium">Agrégateur ENT nouvelle génération</span>
            </div>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
              Tous vos ENT{' '}
              <span className="gradient-text">réunis</span>
            </h1>
            
            <p className="text-lg text-muted-foreground mb-8 max-w-lg">
              Connectez-vous avec vos identifiants <strong>Pronote</strong> ou <strong>EcoleDirecte</strong> 
              et accédez à toutes vos données dans une interface moderne et intuitive.
            </p>

            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg"
                onClick={() => setShowAuth(true)}
                className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 px-8 active:scale-95 transition-transform"
                data-testid="get-started-btn"
              >
                Se connecter
                <ChevronRight className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Supported Providers */}
            <div className="mt-8 flex items-center gap-6">
              <span className="text-sm text-muted-foreground">Compatible avec:</span>
              <div className="flex items-center gap-4">
                {providers.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-muted">
                    <img src={p.logo} alt={p.name} className="w-5 h-5 object-contain" />
                    <span className="text-sm font-medium">{p.name}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-card border border-border">
              <div className="p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Sparkles className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold">Tableau de bord</h3>
                    <p className="text-sm text-muted-foreground">Toutes vos infos en un coup d'œil</p>
                  </div>
                </div>
                
                {/* Mock Dashboard Preview */}
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-primary/10">
                      <p className="text-xs text-muted-foreground">Moyenne</p>
                      <p className="text-xl font-bold text-primary">15.8</p>
                    </div>
                    <div className="p-3 rounded-xl bg-secondary/10">
                      <p className="text-xs text-muted-foreground">Devoirs</p>
                      <p className="text-xl font-bold text-secondary">3</p>
                    </div>
                    <div className="p-3 rounded-xl bg-accent/10">
                      <p className="text-xs text-muted-foreground">Cours</p>
                      <p className="text-xl font-bold text-accent">5</p>
                    </div>
                  </div>
                  
                  <div className="p-4 rounded-xl bg-muted/50">
                    <p className="text-sm font-medium mb-2">Prochain cours</p>
                    <div className="flex items-center gap-3">
                      <div className="w-1 h-10 rounded-full bg-primary" />
                      <div>
                        <p className="font-medium">Mathématiques</p>
                        <p className="text-xs text-muted-foreground">08:00 - Salle 101</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Floating cards */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute -left-8 top-1/4 glass rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <CheckCircle className="w-8 h-8 text-green-500" />
                <div>
                  <p className="font-semibold text-sm">Données sécurisées</p>
                  <p className="text-xs text-muted-foreground">Connexion directe ENT</p>
                </div>
              </div>
            </motion.div>

            <motion.div
              animate={{ y: [0, 10, 0] }}
              transition={{ duration: 3, repeat: Infinity, delay: 1.5 }}
              className="absolute -right-4 bottom-1/4 glass rounded-xl p-4 shadow-xl"
            >
              <div className="flex items-center gap-3">
                <Brain className="w-8 h-8 text-primary" />
                <div>
                  <p className="text-sm font-medium">Assistant IA</p>
                  <p className="text-xs text-muted-foreground">Aide aux devoirs</p>
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
                <p className="text-2xl md:text-3xl font-bold gradient-text">{stat.value}</p>
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
            Pourquoi choisir Papillon ?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Une application qui réunit le meilleur de vos ENT dans une interface moderne 
            avec des fonctionnalités exclusives.
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

      {/* How it works */}
      <section className="relative z-10 py-20 px-6 bg-card/50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl md:text-4xl font-bold mb-12 text-center">
            Comment ça marche ?
          </h2>
          
          <div className="space-y-8">
            {[
              { step: '1', title: 'Choisissez votre ENT', desc: 'Pronote ou EcoleDirecte' },
              { step: '2', title: 'Entrez vos identifiants', desc: 'Les mêmes que sur votre ENT' },
              { step: '3', title: 'Profitez !', desc: 'Accédez à toutes vos données' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.2 }}
                className="flex items-center gap-6"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-xl flex-shrink-0">
                  {item.step}
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{item.title}</h3>
                  <p className="text-muted-foreground">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
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
              Prêt à simplifier votre vie scolaire ?
            </h2>
            <p className="text-lg text-muted-foreground mb-8 max-w-lg mx-auto">
              Connectez-vous avec vos identifiants ENT et découvrez une nouvelle façon 
              de gérer votre scolarité.
            </p>
            <Button 
              size="lg"
              onClick={() => setShowAuth(true)}
              className="rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90 px-12 text-lg active:scale-95 transition-transform"
              data-testid="cta-login-btn"
            >
              Se connecter maintenant
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
            <span className="font-semibold">Papillon</span>
          </div>
          <p className="text-sm text-muted-foreground text-center">
            Application non officielle. Pronote® et EcoleDirecte® sont des marques déposées.
          </p>
        </div>
      </footer>

      {/* Auth Modal */}
      <AuthModal 
        isOpen={showAuth} 
        onClose={() => setShowAuth(false)} 
      />
    </div>
  );
}
