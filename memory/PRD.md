# Papillon ENT Aggregator - Product Requirements Document

## Original Problem Statement
Créer un agrégateur ENT comme Papillon où les élèves se connectent avec leurs identifiants Pronote ou EcoleDirecte (PAS d'inscription). L'app récupère les données depuis ces plateformes via leurs APIs non officielles.

## Core Requirements
1. **Agrégation ENT** - Consolider Pronote et EcoleDirecte dans une seule interface
2. **Connexion simplifiée** - ID + mot de passe + sélection ENT (sans URL sauf connexion directe)
3. **Support tous les ENTs** - Liste complète des 43+ académies/régions françaises
4. **Assistant IA** - Claude pour aide aux devoirs, quiz, révisions
5. **Thème personnalisable** - Interface 100% customisable

## What's Been Implemented (Feb 2026)

### Backend (FastAPI + MongoDB)
- ✅ Connexion Pronote via pronotepy (43 ENTs régionaux supportés)
- ✅ Connexion EcoleDirecte via ecoledirecte (bibliothèque async)
- ✅ Récupération des notes depuis Pronote/ED
- ✅ Récupération des devoirs depuis Pronote/ED  
- ✅ Récupération de l'emploi du temps
- ✅ Assistant IA Claude (aide devoirs, génération quiz)
- ✅ Soutien scolaire IA
- ✅ Sessions JWT avec sauvegarde des identifiants

### Frontend (React + Tailwind)
- ✅ Landing page moderne "Tous vos ENT réunis"
- ✅ Modal connexion avec tabs Pronote/EcoleDirecte
- ✅ Sélecteur ENT pour Pronote (43 académies complètes)
- ✅ Formulaire simplifié (URL uniquement pour connexion directe)
- ✅ Dashboard avec données ENT réelles
- ✅ Page Notes avec graphiques
- ✅ Page Devoirs
- ✅ Page Emploi du temps
- ✅ Page Quiz & Aide IA
- ✅ Paramètres avec personnalisation thème
- ✅ Assistant IA intégré

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Zustand, Framer Motion, Recharts
- Backend: FastAPI, pronotepy, ecoledirecte (async), Motor (MongoDB)
- AI: Claude Sonnet 4.5 via emergentintegrations

## ENT Supportés (43 au total)
### Île-de-France
- Île-de-France (MonLycée.net)
- Paris Classe Numérique
- ENT 77 (Seine-et-Marne)
- ENT 78 / e-Collège 78 (Yvelines) ✅
- ENT 91 (Essonne)
- ENT 93 (Seine-Saint-Denis)
- ENT 94 (Val-de-Marne)
- ENT 95 (Val-d'Oise)

### Autres régions
- Mon Bureau Numérique (Grand Est)
- ENT Hauts-de-France, Auvergne-Rhône-Alpes
- Académies: Lyon, Rennes, Bordeaux, Reims, Poitiers, etc.
- ECLAT-BFC, Atrium PACA, e-lyco
- Outre-mer: Réunion, Mayotte, Guadeloupe
- Et 30+ autres...

## API Endpoints
- `GET /api/ents` - Liste des 43 ENTs
- `POST /api/auth/login` - Connexion Pronote/EcoleDirecte
- `GET /api/auth/me` - Info utilisateur
- `GET /api/grades` - Notes
- `GET /api/homework` - Devoirs
- `GET /api/timetable` - Emploi du temps
- `POST /api/ai/chat` - Assistant IA
- `POST /api/ai/quiz/generate` - Générateur de quiz

## Completed Issues (Feb 15, 2026)
1. ✅ Ajout de tous les ENTs (43 au total, dont ENT78)
2. ✅ Simplification du formulaire (URL uniquement pour connexion directe)
3. ✅ Migration EcoleDirecte vers bibliothèque async

## Pending Tasks
1. Tester connexion réelle avec identifiants utilisateur
2. Implémenter sauvegarde des identifiants en localStorage
3. Ajouter messagerie Pronote/ED
4. Push notifications pour nouvelles notes
5. Mode hors-ligne avec cache local

## Limitations Connues
- APIs Pronote et EcoleDirecte sont non officielles
- Certaines fonctionnalités varient selon l'ENT
- Les sessions doivent être recréées à chaque requête
