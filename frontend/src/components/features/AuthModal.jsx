import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Sparkles, Loader2, Eye, EyeOff, ExternalLink } from 'lucide-react';
import { useAuthStore } from '../../store/useStore';
import { authAPI, entAPI } from '../../lib/api';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';

export function AuthModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [provider, setProvider] = useState('pronote');
  const [ents, setEnts] = useState([]);
  
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    pronote_url: '',
    ent_id: 'direct',
  });

  useEffect(() => {
    if (isOpen) {
      fetchEnts();
    }
  }, [isOpen]);

  const fetchEnts = async () => {
    try {
      const { data } = await entAPI.getList();
      setEnts(data.ents || []);
    } catch (error) {
      console.error('Error fetching ENTs:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // URL always required for Pronote
    if (provider === 'pronote' && !formData.pronote_url) {
      toast.error('Veuillez entrer l\'URL de votre Pronote');
      return;
    }
    
    setIsLoading(true);

    try {
      const { data } = await authAPI.login(
        provider,
        formData.username,
        formData.password,
        provider === 'pronote' ? formData.pronote_url : null,
        provider === 'pronote' ? formData.ent_id : null
      );
      
      setAuth(data.user, data.token);
      toast.success('Connexion réussie !');
      onClose();
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail || 'Identifiants incorrects';
      toast.error(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-md bg-card rounded-2xl shadow-2xl border border-border overflow-hidden"
            data-testid="auth-modal"
          >
            {/* Header */}
            <div className="p-6 pb-0 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Connexion</h2>
                  <p className="text-sm text-muted-foreground">
                    Connectez-vous avec votre ENT
                  </p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={onClose}>
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Provider Selection */}
            <div className="px-6 pt-4">
              <Tabs value={provider} onValueChange={setProvider}>
                <TabsList className="grid grid-cols-2 w-full">
                  <TabsTrigger value="pronote" data-testid="pronote-tab">
                    <img src="https://www.index-education.com/contenu/img/commun/logo-pronote-menu.png" alt="Pronote" className="h-5 mr-2" />
                    Pronote
                  </TabsTrigger>
                  <TabsTrigger value="ecoledirecte" data-testid="ecoledirecte-tab">
                    EcoleDirecte
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {provider === 'pronote' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="ent">ENT / Académie</Label>
                    <Select
                      value={formData.ent_id}
                      onValueChange={(value) => handleChange('ent_id', value)}
                    >
                      <SelectTrigger data-testid="ent-select">
                        <SelectValue placeholder="Sélectionnez votre ENT" />
                      </SelectTrigger>
                      <SelectContent className="max-h-60">
                        {ents.map((ent) => (
                          <SelectItem key={ent.id} value={ent.id}>
                            {ent.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      {formData.ent_id === 'direct' 
                        ? 'Connexion directe sans passer par un ENT' 
                        : 'Votre authentification passera par cet ENT'}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pronote_url">URL Pronote de votre établissement</Label>
                    <Input
                      id="pronote_url"
                      value={formData.pronote_url}
                      onChange={(e) => handleChange('pronote_url', e.target.value)}
                      placeholder="https://0000000a.index-education.net/pronote/eleve.html"
                      required
                      data-testid="pronote-url-input"
                    />
                    <p className="text-xs text-muted-foreground">
                      Trouvez l'URL dans votre navigateur quand vous êtes sur Pronote
                    </p>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="username">Identifiant</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => handleChange('username', e.target.value)}
                  placeholder="Votre identifiant ENT"
                  required
                  data-testid="username-input"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Mot de passe</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.password}
                    onChange={(e) => handleChange('password', e.target.value)}
                    placeholder="••••••••"
                    required
                    className="pr-10"
                    data-testid="password-input"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <Button
                  type="submit"
                  className="w-full rounded-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                  disabled={isLoading}
                  data-testid="submit-login-btn"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Connexion en cours...
                    </>
                  ) : (
                    'Se connecter'
                  )}
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                Vos identifiants sont envoyés directement à {provider === 'pronote' ? 'Pronote' : 'EcoleDirecte'}.
                <br />
                Papillon ne stocke pas vos mots de passe en clair.
              </p>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
