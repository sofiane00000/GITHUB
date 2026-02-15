import { useState } from 'react';
import { motion } from 'framer-motion';
import { 
  Settings as SettingsIcon, User, Palette, Bell, 
  Shield, Moon, Sun, Monitor, Check
} from 'lucide-react';
import { useAuthStore, useThemeStore } from '../store/useStore';
import { authAPI } from '../lib/api';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Slider } from '../components/ui/slider';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';
import { cn } from '../lib/utils';

const PRESET_COLORS = [
  { name: 'Indigo', hue: 243 },
  { name: 'Rose', hue: 350 },
  { name: 'Cyan', hue: 199 },
  { name: 'Vert', hue: 142 },
  { name: 'Orange', hue: 25 },
  { name: 'Violet', hue: 270 },
  { name: 'Rouge', hue: 0 },
  { name: 'Bleu', hue: 210 },
];

export function Settings() {
  const { user, updateUser } = useAuthStore();
  const { 
    theme, setTheme, 
    primaryHue, setPrimaryHue,
    secondaryHue, setSecondaryHue,
    accentHue, setAccentHue,
    borderRadius, setBorderRadius,
    resetTheme
  } = useThemeStore();
  
  const [profileData, setProfileData] = useState({
    first_name: user?.first_name || '',
    last_name: user?.last_name || '',
    avatar_url: user?.avatar_url || '',
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveProfile = async () => {
    setIsSaving(true);
    try {
      await authAPI.updateProfile(profileData);
      updateUser(profileData);
      toast.success('Profil mis à jour !');
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = () => {
    return `${profileData.first_name?.[0] || ''}${profileData.last_name?.[0] || ''}`.toUpperCase();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6 max-w-4xl mx-auto"
      data-testid="settings-page"
    >
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SettingsIcon className="w-6 h-6 text-primary" />
            Paramètres
          </CardTitle>
          <CardDescription>
            Personnalisez votre profil et l'apparence de Papillon
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="profile">Profil</TabsTrigger>
          <TabsTrigger value="appearance">Apparence</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="w-20 h-20">
                  <AvatarImage src={profileData.avatar_url} />
                  <AvatarFallback className="text-2xl bg-primary text-primary-foreground">
                    {getInitials()}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <Label>URL de l'avatar</Label>
                  <Input
                    value={profileData.avatar_url}
                    onChange={(e) => setProfileData(prev => ({ ...prev, avatar_url: e.target.value }))}
                    placeholder="https://..."
                    data-testid="avatar-url-input"
                  />
                </div>
              </div>

              {/* Name */}
              <div className="grid md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Prénom</Label>
                  <Input
                    value={profileData.first_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, first_name: e.target.value }))}
                    data-testid="first-name-settings-input"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Nom</Label>
                  <Input
                    value={profileData.last_name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, last_name: e.target.value }))}
                    data-testid="last-name-settings-input"
                  />
                </div>
              </div>

              <Button 
                onClick={handleSaveProfile} 
                disabled={isSaving}
                data-testid="save-profile-btn"
              >
                {isSaving ? 'Enregistrement...' : 'Enregistrer les modifications'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance" className="space-y-6">
          {/* Theme Mode */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Thème
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <button
                  onClick={() => setTheme('light')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    theme === 'light' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                  data-testid="theme-light-btn"
                >
                  <Sun className="w-6 h-6" />
                  <span className="text-sm font-medium">Clair</span>
                  {theme === 'light' && <Check className="w-4 h-4 text-primary" />}
                </button>
                
                <button
                  onClick={() => setTheme('dark')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    theme === 'dark' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                  data-testid="theme-dark-btn"
                >
                  <Moon className="w-6 h-6" />
                  <span className="text-sm font-medium">Sombre</span>
                  {theme === 'dark' && <Check className="w-4 h-4 text-primary" />}
                </button>
                
                <button
                  onClick={() => setTheme('system')}
                  className={cn(
                    "p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2",
                    theme === 'system' ? "border-primary bg-primary/10" : "border-border hover:border-primary/50"
                  )}
                  data-testid="theme-system-btn"
                >
                  <Monitor className="w-6 h-6" />
                  <span className="text-sm font-medium">Système</span>
                  {theme === 'system' && <Check className="w-4 h-4 text-primary" />}
                </button>
              </div>
            </CardContent>
          </Card>

          {/* Primary Color */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Couleur principale</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hue}
                    onClick={() => setPrimaryHue(color.hue)}
                    className={cn(
                      "w-12 h-12 rounded-xl transition-all",
                      primaryHue === color.hue && "ring-2 ring-offset-2 ring-foreground"
                    )}
                    style={{ backgroundColor: `hsl(${color.hue}, 75%, 59%)` }}
                    title={color.name}
                    data-testid={`primary-color-${color.hue}`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Personnalisé (Teinte: {primaryHue})</Label>
                <Slider
                  value={[primaryHue]}
                  onValueChange={([value]) => setPrimaryHue(value)}
                  min={0}
                  max={360}
                  step={1}
                  className="w-full"
                  data-testid="primary-hue-slider"
                />
              </div>
            </CardContent>
          </Card>

          {/* Secondary Color */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Couleur secondaire</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-3">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color.hue}
                    onClick={() => setSecondaryHue(color.hue)}
                    className={cn(
                      "w-12 h-12 rounded-xl transition-all",
                      secondaryHue === color.hue && "ring-2 ring-offset-2 ring-foreground"
                    )}
                    style={{ backgroundColor: `hsl(${color.hue}, 89%, 60%)` }}
                    title={color.name}
                    data-testid={`secondary-color-${color.hue}`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Personnalisé (Teinte: {secondaryHue})</Label>
                <Slider
                  value={[secondaryHue]}
                  onValueChange={([value]) => setSecondaryHue(value)}
                  min={0}
                  max={360}
                  step={1}
                  data-testid="secondary-hue-slider"
                />
              </div>
            </CardContent>
          </Card>

          {/* Border Radius */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Arrondis</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                {[0, 0.25, 0.5, 0.75, 1, 1.5].map((radius) => (
                  <button
                    key={radius}
                    onClick={() => setBorderRadius(radius)}
                    className={cn(
                      "w-12 h-12 bg-primary transition-all",
                      borderRadius === radius && "ring-2 ring-offset-2 ring-foreground"
                    )}
                    style={{ borderRadius: `${radius}rem` }}
                    data-testid={`border-radius-${radius}`}
                  />
                ))}
              </div>
              <div className="space-y-2">
                <Label>Rayon: {borderRadius}rem</Label>
                <Slider
                  value={[borderRadius]}
                  onValueChange={([value]) => setBorderRadius(value)}
                  min={0}
                  max={2}
                  step={0.05}
                  data-testid="border-radius-slider"
                />
              </div>
            </CardContent>
          </Card>

          {/* Reset */}
          <Button variant="outline" onClick={resetTheme} data-testid="reset-theme-btn">
            Réinitialiser l'apparence
          </Button>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nouvelles notes</p>
                  <p className="text-sm text-muted-foreground">
                    Recevoir une notification pour chaque nouvelle note
                  </p>
                </div>
                <Switch defaultChecked data-testid="notif-grades-switch" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nouveaux devoirs</p>
                  <p className="text-sm text-muted-foreground">
                    Être alerté quand un devoir est publié
                  </p>
                </div>
                <Switch defaultChecked data-testid="notif-homework-switch" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Messages</p>
                  <p className="text-sm text-muted-foreground">
                    Notifications pour les nouveaux messages
                  </p>
                </div>
                <Switch defaultChecked data-testid="notif-messages-switch" />
              </div>
              
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Rappels de devoirs</p>
                  <p className="text-sm text-muted-foreground">
                    Rappel la veille de la date limite
                  </p>
                </div>
                <Switch defaultChecked data-testid="notif-reminders-switch" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
}
