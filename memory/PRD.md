# Papillon ENT Aggregator - Product Requirements Document

## Original Problem Statement
Créer un agrégateur ENT comme Papillon où les élèves se connectent avec leurs identifiants Pronote ou EcoleDirecte (PAS d'inscription). L'app récupère les données depuis ces plateformes via leurs APIs non officielles.

## What Was Built (Jan 2026)
### Backend (FastAPI + MongoDB)
- ✅ Connexion Pronote via pronotepy (support 25+ ENT régionaux)
- ✅ Connexion EcoleDirecte via ecoledirecteapi
- ✅ Récupération des notes depuis Pronote/ED
- ✅ Récupération des devoirs depuis Pronote/ED
- ✅ Récupération de l'emploi du temps
- ✅ Récupération des absences (Pronote)
- ✅ Récupération infos utilisateur
- ✅ Assistant IA Claude (aide devoirs, génération quiz)
- ✅ Soutien scolaire IA
- ✅ Sessions JWT

### Frontend (React + Tailwind)
- ✅ Landing page moderne "Tous vos ENT réunis"
- ✅ Modal connexion avec tabs Pronote/EcoleDirecte
- ✅ Sélecteur ENT pour Pronote (25+ académies)
- ✅ Dashboard avec données ENT réelles
- ✅ Page Notes avec graphiques
- ✅ Page Devoirs
- ✅ Page Emploi du temps
- ✅ Page Quiz & Aide IA
- ✅ Paramètres avec personnalisation thème
- ✅ Assistant IA intégré

## Tech Stack
- Frontend: React, Tailwind CSS, Shadcn/UI, Zustand, Framer Motion, Recharts
- Backend: FastAPI, pronotepy, ecoledirecteapi, Motor (MongoDB)
- AI: Claude Sonnet 4.5 via emergentintegrations

## ENT Supportés (Pronote)
- Île-de-France, Paris Classe Numérique
- Mon Bureau Numérique (Grand Est)
- ENT Hauts-de-France, Auvergne-Rhône-Alpes
- Académies: Lyon, Rennes, Bordeaux, Reims, etc.
- ECLAT-BFC, Atrium PACA, e-lyco
- Et 20+ autres...

## Limitations Connues
- Les APIs Pronote et EcoleDirecte sont non officielles
- Certaines fonctionnalités peuvent varier selon l'ENT
- Les sessions doivent être recréées à chaque requête (pas de persistent session)

## Next Tasks
1. Ajouter support messagerie Pronote/ED
2. Ajouter calendrier avec absences
3. Push notifications pour nouvelles notes
4. Mode hors-ligne avec cache local
5. Intégration agenda Google/Apple
