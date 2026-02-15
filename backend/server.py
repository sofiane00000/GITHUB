from fastapi import FastAPI, APIRouter, HTTPException, Depends
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict
from typing import List, Optional, Literal, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import asyncio
import pronotepy
from pronotepy import ent as pronote_ent
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Config
JWT_SECRET = os.environ.get('JWT_SECRET', 'papillon-secret-key-2024')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_DAYS = 30  # Long session for saved credentials

# Claude API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Papillon ENT Aggregator API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== ENT CONFIGURATIONS ====================

# All available ENTs with their display names and pronote base URLs
ENT_LIST = [
    # Connexion directe
    {"id": "direct", "name": "Connexion directe (sans ENT)", "ent_func": None, "requires_url": True},
    
    # Île-de-France
    {"id": "ile_de_france", "name": "Île-de-France (MonLycée.net)", "ent_func": "ile_de_france"},
    {"id": "paris_classe_numerique", "name": "Paris Classe Numérique", "ent_func": "paris_classe_numerique"},
    {"id": "ent77", "name": "ENT 77 (Seine-et-Marne)", "ent_func": "ent77"},
    {"id": "ent_ecollege78", "name": "ENT 78 / e-Collège 78 (Yvelines)", "ent_func": "ent_ecollege78"},
    {"id": "ent_essonne", "name": "ENT 91 (Essonne)", "ent_func": "ent_essonne"},
    {"id": "ent_94", "name": "ENT 94 (Val-de-Marne)", "ent_func": "ent_94"},
    {"id": "val_doise", "name": "ENT 95 (Val-d'Oise)", "ent_func": "val_doise"},
    {"id": "cas_seinesaintdenis_edu", "name": "ENT 93 (Seine-Saint-Denis)", "ent_func": "cas_seinesaintdenis_edu"},
    
    # Grand Est
    {"id": "monbureaunumerique", "name": "Mon Bureau Numérique (Grand Est)", "ent_func": "monbureaunumerique"},
    {"id": "ac_reims", "name": "Académie de Reims", "ent_func": "ac_reims"},
    
    # Hauts-de-France
    {"id": "ent_hdf", "name": "ENT Hauts-de-France (NEO)", "ent_func": "ent_hdf"},
    {"id": "ent_somme", "name": "ENT Somme", "ent_func": "ent_somme"},
    {"id": "extranet_colleges_somme", "name": "Extranet Collèges Somme", "ent_func": "extranet_colleges_somme"},
    
    # Auvergne-Rhône-Alpes
    {"id": "ent_auvergnerhonealpe", "name": "ENT Auvergne-Rhône-Alpes", "ent_func": "ent_auvergnerhonealpe"},
    {"id": "laclasse_lyon", "name": "laclasse.com (Lyon)", "ent_func": "laclasse_lyon"},
    {"id": "laclasse_educonnect", "name": "laclasse.com (EduConnect)", "ent_func": "laclasse_educonnect"},
    {"id": "cas_cybercolleges42_edu", "name": "Cybercolleges42 (Loire)", "ent_func": "cas_cybercolleges42_edu"},
    
    # Nouvelle-Aquitaine
    {"id": "bordeaux", "name": "Académie de Bordeaux", "ent_func": "bordeaux"},
    {"id": "ac_poitiers", "name": "Académie de Poitiers", "ent_func": "ac_poitiers"},
    {"id": "lyceeconnecte_aquitaine", "name": "Lycée Connecté Aquitaine", "ent_func": "lyceeconnecte_aquitaine"},
    {"id": "lyceeconnecte_edu", "name": "Lycée Connecté (EduConnect)", "ent_func": "lyceeconnecte_edu"},
    
    # Occitanie
    {"id": "occitanie_montpellier", "name": "ENT Occitanie (Montpellier)", "ent_func": "occitanie_montpellier"},
    {"id": "occitanie_montpellier_educonnect", "name": "ENT Occitanie Montpellier (EduConnect)", "ent_func": "occitanie_montpellier_educonnect"},
    {"id": "occitanie_toulouse_edu", "name": "ENT Occitanie (Toulouse)", "ent_func": "occitanie_toulouse_edu"},
    {"id": "ecollege_haute_garonne_edu", "name": "eCollège Haute-Garonne", "ent_func": "ecollege_haute_garonne_edu"},
    
    # Bretagne
    {"id": "ac_rennes", "name": "Académie de Rennes (Toutatice)", "ent_func": "ac_rennes"},
    
    # Pays de la Loire
    {"id": "ent_elyco", "name": "e-lyco (Pays de la Loire)", "ent_func": "ent_elyco"},
    {"id": "ac_orleans_tours", "name": "Académie Orléans-Tours", "ent_func": "ac_orleans_tours"},
    
    # Normandie
    {"id": "l_normandie", "name": "L'Educ de Normandie", "ent_func": "l_normandie"},
    {"id": "cas_arsene76", "name": "Arsène 76 (Seine-Maritime)", "ent_func": "cas_arsene76"},
    {"id": "cas_arsene76_edu", "name": "Arsène 76 (EduConnect)", "ent_func": "cas_arsene76_edu"},
    {"id": "cas_ent27", "name": "ENT 27 (Eure)", "ent_func": "cas_ent27"},
    
    # PACA
    {"id": "atrium_sud", "name": "Atrium PACA", "ent_func": "atrium_sud"},
    {"id": "ent_var", "name": "ENT Var", "ent_func": "ent_var"},
    {"id": "cas_agora06", "name": "Agora 06 (Alpes-Maritimes)", "ent_func": "cas_agora06"},
    
    # Bourgogne-Franche-Comté
    {"id": "eclat_bfc", "name": "ECLAT-BFC", "ent_func": "eclat_bfc"},
    
    # Centre-Val de Loire
    {"id": "ent_creuse", "name": "ENT Creuse", "ent_func": "ent_creuse"},
    {"id": "ent_creuse_educonnect", "name": "ENT Creuse (EduConnect)", "ent_func": "ent_creuse_educonnect"},
    
    # Outre-mer
    {"id": "ac_reunion", "name": "Académie de La Réunion", "ent_func": "ac_reunion"},
    {"id": "ent_mayotte", "name": "ENT Mayotte", "ent_func": "ent_mayotte"},
    {"id": "neoconnect_guadeloupe", "name": "Neoconnect Guadeloupe", "ent_func": "neoconnect_guadeloupe"},
    
    # Autres
    {"id": "cas_kosmos", "name": "Kosmos (Multi-régions)", "ent_func": "cas_kosmos"},
]

def get_ent_function(ent_id: str):
    """Get the ENT function from pronotepy"""
    ent_config = next((e for e in ENT_LIST if e["id"] == ent_id), None)
    if not ent_config or not ent_config.get("ent_func"):
        return None
    return getattr(pronote_ent, ent_config["ent_func"], None)

# ==================== MODELS ====================

class ENTLoginRequest(BaseModel):
    provider: Literal["pronote", "ecoledirecte"]
    username: str
    password: str
    ent_id: Optional[str] = "direct"  # ENT identifier
    pronote_url: Optional[str] = None  # Only needed for direct connection

class SavedCredentials(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str
    username: str
    password: str  # Encrypted in production
    ent_id: Optional[str] = None
    pronote_url: Optional[str] = None
    display_name: Optional[str] = None
    class_name: Optional[str] = None
    school_name: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    last_login: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    theme_settings: Optional[dict] = None

class AIMessage(BaseModel):
    message: str
    context: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    subject: str
    topic: str
    class_level: str
    num_questions: int = 5
    difficulty: Literal["easy", "medium", "hard"] = "medium"

# ==================== AUTH HELPERS ====================

def create_token(user_id: str, provider: str) -> str:
    payload = {
        "user_id": user_id,
        "provider": provider,
        "exp": datetime.now(timezone.utc) + timedelta(days=JWT_EXPIRATION_DAYS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Session non trouvée")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée, reconnectez-vous")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ==================== PRONOTE CLIENT ====================

def connect_pronote(username: str, password: str, ent_id: str, pronote_url: str = None):
    """Connect to Pronote with ENT or direct URL"""
    try:
        ent_function = get_ent_function(ent_id)
        
        if ent_id == "direct" and pronote_url:
            # Direct connection with URL
            client = pronotepy.Client(
                pronote_url,
                username=username,
                password=password
            )
        elif ent_function:
            # ENT connection - the ENT handles the URL
            client = pronotepy.Client(
                pronote_url if pronote_url else "",
                username=username,
                password=password,
                ent=ent_function
            )
        else:
            return None, "ENT non reconnu"
        
        if client.logged_in:
            return client, None
        else:
            return None, "Identifiants incorrects"
    except Exception as e:
        logging.error(f"Pronote login error: {e}")
        return None, str(e)

# ==================== ECOLEDIRECTE CLIENT ====================

def connect_ecoledirecte_sync(username: str, password: str):
    """Connect to EcoleDirecte using EcoleDirectePy (sync)"""
    try:
        import EcoleDirectePy
        
        result = EcoleDirectePy.login(username, password)
        
        if result and result.get('code') == 200:
            # Login successful
            return result, None
        elif result and result.get('code') == 505:
            return None, "Identifiants EcoleDirecte incorrects"
        else:
            return None, result.get('message', 'Erreur de connexion EcoleDirecte')
    except Exception as e:
        logging.error(f"EcoleDirecte login error: {e}")
        return None, str(e)

async def connect_ecoledirecte(username: str, password: str):
    """Async wrapper for EcoleDirecte connection"""
    loop = asyncio.get_event_loop()
    return await loop.run_in_executor(None, connect_ecoledirecte_sync, username, password)

# ==================== DATA SERIALIZERS ====================

def serialize_pronote_grade(grade) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "value": str(grade.grade) if grade.grade else None,
        "out_of": str(grade.out_of) if grade.out_of else "20",
        "coefficient": float(grade.coefficient) if grade.coefficient else 1.0,
        "subject": grade.subject.name if grade.subject else "Matière",
        "subject_color": "#4F46E5",
        "date": grade.date.isoformat() if grade.date else None,
        "comment": grade.comment or "",
        "class_average": str(grade.average) if hasattr(grade, 'average') and grade.average else None,
        "max": str(grade.max) if hasattr(grade, 'max') and grade.max else None,
        "min": str(grade.min) if hasattr(grade, 'min') and grade.min else None,
    }

def serialize_pronote_homework(hw) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "subject": hw.subject.name if hw.subject else "Matière",
        "subject_color": "#4F46E5",
        "description": hw.description or "",
        "date": hw.date.isoformat() if hw.date else None,
        "done": hw.done if hasattr(hw, 'done') else False,
    }

def serialize_pronote_lesson(lesson) -> dict:
    return {
        "id": str(uuid.uuid4()),
        "subject": lesson.subject.name if lesson.subject else "Cours",
        "subject_color": "#4F46E5",
        "teacher": lesson.teacher_name if hasattr(lesson, 'teacher_name') else "",
        "room": lesson.classroom if hasattr(lesson, 'classroom') else "",
        "start": lesson.start.isoformat() if lesson.start else None,
        "end": lesson.end.isoformat() if lesson.end else None,
        "canceled": lesson.canceled if hasattr(lesson, 'canceled') else False,
        "status": lesson.status if hasattr(lesson, 'status') else None,
    }

# ==================== AI HELPERS ====================

async def get_ai_response(message: str, context: str = "", session_id: str = "default") -> str:
    if not EMERGENT_LLM_KEY:
        return "L'assistant IA n'est pas configuré."
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=f"""Tu es Papillon, l'assistant IA de l'application Papillon qui agrège les ENT (Pronote, EcoleDirecte).
Tu aides les élèves avec leurs cours, devoirs et révisions. Tu es amical et pédagogue. Tu réponds en français.
{context}"""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        response = await chat.send_message(UserMessage(text=message))
        return response
    except Exception as e:
        logging.error(f"AI Error: {e}")
        return f"Erreur IA: {str(e)}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(request: ENTLoginRequest):
    """Login with Pronote or EcoleDirecte credentials - saves for future auto-login"""
    
    if request.provider == "pronote":
        # Check if direct connection needs URL
        if request.ent_id == "direct" and not request.pronote_url:
            raise HTTPException(status_code=400, detail="URL Pronote requise pour connexion directe")
        
        # Connect to Pronote
        loop = asyncio.get_event_loop()
        client, error = await loop.run_in_executor(
            None,
            connect_pronote,
            request.username,
            request.password,
            request.ent_id,
            request.pronote_url
        )
        
        if error:
            raise HTTPException(status_code=401, detail=f"Connexion Pronote échouée: {error}")
        
        # Get user info
        display_name = client.info.name if client.info else request.username
        class_name = client.info.class_name if client.info else None
        school_name = client.info.establishment if client.info else None
        
        # Save or update user credentials
        user_id = str(uuid.uuid4())
        existing = await db.users.find_one({
            "provider": "pronote",
            "username": request.username,
            "ent_id": request.ent_id
        })
        
        if existing:
            user_id = existing["id"]
            await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "password": request.password,
                    "pronote_url": request.pronote_url,
                    "display_name": display_name,
                    "class_name": class_name,
                    "school_name": school_name,
                    "last_login": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            user_data = {
                "id": user_id,
                "provider": "pronote",
                "username": request.username,
                "password": request.password,
                "ent_id": request.ent_id,
                "pronote_url": request.pronote_url,
                "display_name": display_name,
                "class_name": class_name,
                "school_name": school_name,
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "theme_settings": {}
            }
            await db.users.insert_one(user_data)
        
        token = create_token(user_id, "pronote")
        
        return {
            "token": token,
            "user": {
                "id": user_id,
                "provider": "pronote",
                "display_name": display_name,
                "class_name": class_name,
                "school_name": school_name,
                "ent_id": request.ent_id
            }
        }
    
    elif request.provider == "ecoledirecte":
        # Connect to EcoleDirecte (async wrapper)
        ed_result, error = await connect_ecoledirecte(
            request.username,
            request.password
        )
        
        if error:
            raise HTTPException(status_code=401, detail=f"Connexion EcoleDirecte échouée: {error}")
        
        # Get user info from ED response (dict format from EcoleDirectePy)
        display_name = request.username
        class_name = None
        school_name = None
        
        try:
            # EcoleDirectePy returns a dict with 'data' containing account info
            data = ed_result.get('data', {})
            accounts = data.get('accounts', [])
            
            if accounts:
                account = accounts[0]
                prenom = account.get('prenom', '')
                nom = account.get('nom', '')
                if prenom or nom:
                    display_name = f"{prenom} {nom}".strip()
                
                # Get class and school info
                profile = account.get('profile', {})
                class_name = profile.get('classe', {}).get('libelle') if profile.get('classe') else None
                
                # Get school name from nomEtablissement
                school_name = account.get('nomEtablissement', '')
        except Exception as e:
            logging.error(f"Error parsing ED user info: {e}")
        
        # Save or update user
        user_id = str(uuid.uuid4())
        existing = await db.users.find_one({
            "provider": "ecoledirecte",
            "username": request.username
        })
        
        if existing:
            user_id = existing["id"]
            await db.users.update_one(
                {"id": user_id},
                {"$set": {
                    "password": request.password,
                    "display_name": display_name,
                    "class_name": class_name,
                    "school_name": school_name,
                    "ed_token": ed_result.get('token', ''),
                    "last_login": datetime.now(timezone.utc).isoformat()
                }}
            )
        else:
            user_data = {
                "id": user_id,
                "provider": "ecoledirecte",
                "username": request.username,
                "password": request.password,
                "display_name": display_name,
                "class_name": class_name,
                "school_name": school_name,
                "ed_token": ed_result.get('token', ''),
                "created_at": datetime.now(timezone.utc).isoformat(),
                "last_login": datetime.now(timezone.utc).isoformat(),
                "theme_settings": {}
            }
            await db.users.insert_one(user_data)
        
        token = create_token(user_id, "ecoledirecte")
        
        return {
            "token": token,
            "user": {
                "id": user_id,
                "provider": "ecoledirecte",
                "display_name": display_name,
                "class_name": class_name,
                "school_name": school_name,
            }
        }
    
    raise HTTPException(status_code=400, detail="Provider non supporté")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    """Get current user info (without password)"""
    return {
        "id": current_user.get("id"),
        "provider": current_user.get("provider"),
        "display_name": current_user.get("display_name"),
        "class_name": current_user.get("class_name"),
        "school_name": current_user.get("school_name"),
        "ent_id": current_user.get("ent_id"),
        "theme_settings": current_user.get("theme_settings", {})
    }

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout - credentials remain saved for next login"""
    return {"message": "Déconnecté"}

# ==================== PRONOTE DATA ROUTES ====================

async def get_pronote_client(user: dict):
    """Reconnect to Pronote using saved credentials"""
    if user.get("provider") != "pronote":
        return None, "Non connecté à Pronote"
    
    loop = asyncio.get_event_loop()
    client, error = await loop.run_in_executor(
        None,
        connect_pronote,
        user.get("username"),
        user.get("password"),
        user.get("ent_id", "direct"),
        user.get("pronote_url")
    )
    return client, error

async def get_ecoledirecte_client(user: dict):
    """Reconnect to EcoleDirecte using saved credentials"""
    if user.get("provider") != "ecoledirecte":
        return None, "Non connecté à EcoleDirecte"
    
    client, error = await connect_ecoledirecte(
        user.get("username"),
        user.get("password")
    )
    return client, error

@api_router.get("/grades")
async def get_grades(current_user: dict = Depends(get_current_user)):
    """Get grades from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client, error = await get_pronote_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        grades = []
        try:
            for period in client.periods:
                for grade in period.grades:
                    grades.append(serialize_pronote_grade(grade))
        except Exception as e:
            logging.error(f"Error fetching grades: {e}")
        
        return {"grades": grades, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        client, error = await get_ecoledirecte_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        grades = []
        try:
            # Get grades from async ecoledirecte client
            if hasattr(client, 'get_grades'):
                raw_notes = await client.get_grades()
                if raw_notes:
                    for note in raw_notes:
                        grades.append({
                            "id": str(uuid.uuid4()),
                            "value": str(note.get("valeur", "")) if note.get("valeur") else "",
                            "out_of": str(note.get("noteSur", "20")),
                            "coefficient": float(note.get("coef", 1)) if note.get("coef") else 1.0,
                            "subject": note.get("libelleMatiere", "Matière"),
                            "subject_color": "#F43F5E",
                            "date": note.get("date", ""),
                            "comment": note.get("devoir", ""),
                            "class_average": str(note.get("moyenneClasse", "")) if note.get("moyenneClasse") else "",
                        })
        except Exception as e:
            logging.error(f"Error fetching ED grades: {e}")
        
        return {"grades": grades, "provider": "ecoledirecte"}
    
    return {"grades": [], "provider": "unknown"}

@api_router.get("/homework")
async def get_homework(current_user: dict = Depends(get_current_user)):
    """Get homework from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client, error = await get_pronote_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        homework = []
        try:
            from datetime import date, timedelta
            today = date.today()
            hw_list = client.homework(today, today + timedelta(days=14))
            homework = [serialize_pronote_homework(hw) for hw in hw_list]
        except Exception as e:
            logging.error(f"Error fetching homework: {e}")
        
        return {"homework": homework, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        client, error = await get_ecoledirecte_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        homework = []
        try:
            # Get homework from async ecoledirecte client
            if hasattr(client, 'get_homework'):
                from datetime import date, timedelta
                today = date.today()
                raw_hw = await client.get_homework()
                if raw_hw:
                    for hw in raw_hw:
                        homework.append({
                            "id": str(uuid.uuid4()),
                            "subject": hw.get("matiere", "Matière"),
                            "subject_color": "#F43F5E",
                            "description": hw.get("contenu", "") or hw.get("aFaire", {}).get("contenu", ""),
                            "date": hw.get("date", ""),
                            "done": hw.get("effectue", False),
                        })
        except Exception as e:
            logging.error(f"Error fetching ED homework: {e}")
        
        return {"homework": homework, "provider": "ecoledirecte"}
    
    return {"homework": [], "provider": "unknown"}

@api_router.get("/timetable")
async def get_timetable(date_str: Optional[str] = None, current_user: dict = Depends(get_current_user)):
    """Get timetable from connected ENT"""
    from datetime import date, timedelta
    
    target_date = date.today()
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except:
            pass
    
    if current_user.get("provider") == "pronote":
        client, error = await get_pronote_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        lessons = []
        try:
            week_start = target_date - timedelta(days=target_date.weekday())
            week_end = week_start + timedelta(days=6)
            lesson_list = client.lessons(week_start, week_end)
            lessons = [serialize_pronote_lesson(l) for l in lesson_list]
        except Exception as e:
            logging.error(f"Error fetching timetable: {e}")
        
        return {"lessons": lessons, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        client, error = await get_ecoledirecte_client(current_user)
        if error:
            raise HTTPException(status_code=401, detail=error)
        
        lessons = []
        try:
            # Get timetable from async ecoledirecte client
            if hasattr(client, 'get_timetable'):
                week_start = target_date - timedelta(days=target_date.weekday())
                week_end = week_start + timedelta(days=6)
                raw_edt = await client.get_timetable(week_start, week_end)
                if raw_edt:
                    for cours in raw_edt:
                        lessons.append({
                            "id": str(uuid.uuid4()),
                            "subject": cours.get("matiere", "Cours"),
                            "subject_color": "#F43F5E",
                            "teacher": cours.get("prof", ""),
                            "room": cours.get("salle", ""),
                            "start": cours.get("start_date", "") or cours.get("startDate", ""),
                            "end": cours.get("end_date", "") or cours.get("endDate", ""),
                            "canceled": cours.get("isAnnule", False),
                        })
        except Exception as e:
            logging.error(f"Error fetching ED schedule: {e}")
        
        return {"lessons": lessons, "provider": "ecoledirecte"}
    
    return {"lessons": [], "provider": "unknown"}

# ==================== AI ROUTES ====================

@api_router.post("/ai/chat")
async def ai_chat(message: AIMessage, current_user: dict = Depends(get_current_user)):
    context = f"L'utilisateur est {current_user.get('display_name', 'un élève')}. {message.context or ''}"
    response = await get_ai_response(message.message, context, session_id=f"chat-{current_user['id']}")
    return {"response": response}

@api_router.get("/ai/chat/history")
async def get_chat_history(limit: int = 50, current_user: dict = Depends(get_current_user)):
    messages = await db.chat_messages.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).limit(limit).to_list(limit)
    return list(reversed(messages))

@api_router.post("/ai/quiz/generate")
async def generate_quiz(request: QuizGenerateRequest, current_user: dict = Depends(get_current_user)):
    prompt = f"""Génère un quiz de {request.num_questions} questions sur "{request.topic}" en {request.subject} pour un élève de {request.class_level}.
Difficulté: {request.difficulty}

Réponds UNIQUEMENT avec un JSON valide:
{{"title": "Titre", "questions": [{{"question": "Q", "options": ["A","B","C","D"], "correct_answer": 0, "explanation": "E"}}]}}"""
    
    response = await get_ai_response(prompt, session_id=f"quiz-{current_user['id']}")
    
    import json, re
    try:
        match = re.search(r'\{[\s\S]*\}', response)
        if match:
            return json.loads(match.group())
    except:
        pass
    
    raise HTTPException(status_code=500, detail="Erreur génération quiz")

@api_router.post("/ai/tutoring")
async def ai_tutoring(subject: str, topic: str, question: str, current_user: dict = Depends(get_current_user)):
    context = f"Tu es un tuteur expert en {subject}. Sujet: {topic}"
    response = await get_ai_response(question, context, session_id=f"tutor-{current_user['id']}")
    return {"response": response}

# ==================== SETTINGS ====================

@api_router.put("/settings/theme")
async def update_theme(theme_settings: dict, current_user: dict = Depends(get_current_user)):
    await db.users.update_one({"id": current_user["id"]}, {"$set": {"theme_settings": theme_settings}})
    return {"message": "Thème mis à jour"}

# ==================== ENT LIST ====================

@api_router.get("/ents")
async def get_available_ents():
    """Get list of all available ENTs"""
    return {"ents": [{"id": e["id"], "name": e["name"], "requires_url": e.get("requires_url", False)} for e in ENT_LIST]}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Papillon API", "version": "2.0.0"}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO)
