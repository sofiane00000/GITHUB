# Papillon ENT - Product Requirements Document

## Original Problem Statement
Créer un site type ENT (Espace Numérique de Travail) comme Papillon combinant tous les ENT avec des fonctionnalités avancées d'IA et des UI interactifs. L'utilisateur veut:
- Tous les types d'utilisateurs (élèves, professeurs, parents, admin)
- Thème et UI personnalisables à 100%
- IA pour la messagerie et tout
- IA qui priorise les devoirs
- Claude comme assistant IA
- Toutes les fonctionnalités de base + fonctionnalités intéressantes
- Soutien scolaire avec génération de quiz
- Programme de toutes les classes depuis la 6ème

## User Personas
1. **Élève** - Consulte notes, devoirs, emploi du temps, utilise l'assistant IA pour les révisions
2. **Professeur** - Gère notes, devoirs, ressources, communique avec élèves/parents
3. **Parent** - Suit la scolarité de ses enfants, communique avec l'école
4. **Administrateur** - Gère utilisateurs, classes, configuration globale

## Core Requirements (Static)
- Authentification JWT avec rôles
- Dashboard personnalisé par rôle
- Emploi du temps interactif
- Gestion des notes avec graphiques
- Devoirs avec priorisation IA
- Messagerie interne
- Ressources pédagogiques
- Forum d'entraide
- Générateur de quiz IA
- Soutien scolaire IA (tuteur virtuel)
- Personnalisation complète du thème (couleurs, arrondis, mode sombre/clair)
- Programme scolaire de la 6ème à la Terminale

## What's Been Implemented (Jan 2026)
### Backend (FastAPI + MongoDB)
- ✅ Authentification JWT complète
- ✅ CRUD utilisateurs, classes, matières
- ✅ Gestion des notes avec coefficients et trimestres
- ✅ Devoirs avec priorisation IA (Claude Sonnet 4.5)
- ✅ Emploi du temps
- ✅ Messagerie avec notifications
- ✅ Ressources pédagogiques
- ✅ Forum avec réponses
- ✅ Générateur de quiz IA
- ✅ Soutien scolaire IA (tuteur)
- ✅ Chat IA persistant avec historique
- ✅ Système XP et gamification
- ✅ Programme scolaire complet (6ème-Terminale)
- ✅ Notifications
- ✅ Statistiques élève/classe

### Frontend (React + Tailwind)
- ✅ Landing page moderne avec animations
- ✅ Authentification (login/register)
- ✅ Dashboard avec widgets interactifs
- ✅ Sidebar responsive avec navigation
- ✅ Assistant IA (chat panel)
- ✅ Page emploi du temps (grille semaine)
- ✅ Page notes avec graphiques (Recharts)
- ✅ Page devoirs avec priorités
- ✅ Messagerie
- ✅ Ressources avec filtres
- ✅ Quiz & Soutien scolaire
- ✅ Forum
- ✅ Paramètres avec personnalisation thème
- ✅ Mode clair/sombre/système
- ✅ Couleurs personnalisables (HSL sliders)
- ✅ Arrondis personnalisables

## AI Integration
- **Provider**: Claude Sonnet 4.5 via Emergent LLM Key
- **Usage**: Chat assistant, quiz generation, homework prioritization, tutoring
- **Library**: emergentintegrations

## Tech Stack
- Frontend: React 19, Tailwind CSS, Shadcn/UI, Zustand, Framer Motion, Recharts
- Backend: FastAPI, Motor (async MongoDB), JWT, bcrypt
- Database: MongoDB
- AI: Claude Sonnet 4.5 via emergentintegrations

## Prioritized Backlog

### P0 (Critical - Done)
- [x] All core features implemented

### P1 (High Priority - Next Phase)
- [ ] File upload for homework submissions
- [ ] Real-time notifications (WebSocket)
- [ ] Parent-student linking
- [ ] Teacher grade entry interface
- [ ] Class management for admin

### P2 (Medium Priority)
- [ ] Calendar sync (Google/Apple)
- [ ] PDF report card generation
- [ ] Mobile PWA optimization
- [ ] Push notifications
- [ ] Voice input for AI chat

### P3 (Nice to Have)
- [ ] Video conferencing integration
- [ ] LTI integration for external tools
- [ ] Multi-language support
- [ ] Accessibility improvements (WCAG 2.1)

## Next Tasks
1. Add file upload functionality for homework
2. Implement WebSocket for real-time notifications
3. Create teacher-specific grade entry UI
4. Add parent dashboard with children overview
5. Implement admin panel for user management
