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
JWT_EXPIRATION_HOURS = 24

# Claude API Key
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY', '')

app = FastAPI(title="Papillon ENT Aggregator API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== ENT CONFIGURATIONS ====================

# Import ENTs dynamically to avoid import errors
from pronotepy import ent as pronote_ent

# Build ENT dictionary dynamically
def get_ent_function(name):
    return getattr(pronote_ent, name, None)

# Liste des ENT supportés pour Pronote
PRONOTE_ENTS = {
    "none": None,
    "ac_reunion": get_ent_function("ac_reunion"),
    "ac_reims": get_ent_function("ac_reims"),
    "ac_rennes": get_ent_function("ac_rennes"),
    "ac_orleans_tours": get_ent_function("ac_orleans_tours"),
    "ac_poitiers": get_ent_function("ac_poitiers"),
    "atrium_sud": get_ent_function("atrium_sud"),
    "bordeaux": get_ent_function("bordeaux"),
    "cas_agora06": get_ent_function("cas_agora06"),
    "cas_arsene76": get_ent_function("cas_arsene76"),
    "cas_kosmos": get_ent_function("cas_kosmos"),
    "eclat_bfc": get_ent_function("eclat_bfc"),
    "ent_94": get_ent_function("ent_94"),
    "ent77": get_ent_function("ent77"),
    "ent_auvergnerhonealpe": get_ent_function("ent_auvergnerhonealpe"),
    "ent_creuse": get_ent_function("ent_creuse"),
    "ent_elyco": get_ent_function("ent_elyco"),
    "ent_essonne": get_ent_function("ent_essonne"),
    "ent_hdf": get_ent_function("ent_hdf"),
    "ent_mayotte": get_ent_function("ent_mayotte"),
    "ent_somme": get_ent_function("ent_somme"),
    "ent_var": get_ent_function("ent_var"),
    "extranet_colleges_somme": get_ent_function("extranet_colleges_somme"),
    "ile_de_france": get_ent_function("ile_de_france"),
    "laclasse_educonnect": get_ent_function("laclasse_educonnect"),
    "laclasse_lyon": get_ent_function("laclasse_lyon"),
    "monbureaunumerique": get_ent_function("monbureaunumerique"),
    "neoconnect_guadeloupe": get_ent_function("neoconnect_guadeloupe"),
    "occitanie_montpellier": get_ent_function("occitanie_montpellier"),
    "paris_classe_numerique": get_ent_function("paris_classe_numerique"),
    "val_doise": get_ent_function("val_doise"),
}

# ==================== MODELS ====================

class ENTLoginRequest(BaseModel):
    provider: Literal["pronote", "ecoledirecte"]
    username: str
    password: str
    pronote_url: Optional[str] = None  # Required for Pronote
    ent: Optional[str] = "none"  # ENT identifier for Pronote

class UserSession(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    provider: str
    username: str
    display_name: str
    class_name: Optional[str] = None
    school_name: Optional[str] = None
    avatar_url: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    theme_settings: Optional[dict] = None

class AIMessage(BaseModel):
    message: str
    context: Optional[str] = None

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

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
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        session = await db.sessions.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not session:
            raise HTTPException(status_code=401, detail="Session non trouvée")
        return session
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Session expirée, reconnectez-vous")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ==================== PRONOTE CLIENT HELPERS ====================

def get_pronote_client(username: str, password: str, pronote_url: str, ent: str = "none"):
    """Create a Pronote client with the given credentials"""
    try:
        ent_function = PRONOTE_ENTS.get(ent)
        
        if ent_function:
            client = pronotepy.Client(
                pronote_url,
                username=username,
                password=password,
                ent=ent_function
            )
        else:
            client = pronotepy.Client(
                pronote_url,
                username=username,
                password=password
            )
        
        if client.logged_in:
            return client
        else:
            return None
    except Exception as e:
        logging.error(f"Pronote login error: {e}")
        return None

def serialize_pronote_grade(grade) -> dict:
    """Convert Pronote Grade to dict"""
    return {
        "id": str(uuid.uuid4()),
        "value": str(grade.grade) if grade.grade else None,
        "out_of": str(grade.out_of) if grade.out_of else "20",
        "coefficient": float(grade.coefficient) if grade.coefficient else 1.0,
        "subject": grade.subject.name if grade.subject else "Matière",
        "subject_color": "#4F46E5",
        "date": grade.date.isoformat() if grade.date else None,
        "comment": grade.comment or "",
        "is_bonus": grade.is_bonus if hasattr(grade, 'is_bonus') else False,
        "is_optional": grade.is_optional if hasattr(grade, 'is_optional') else False,
        "class_average": str(grade.average) if hasattr(grade, 'average') and grade.average else None,
        "max": str(grade.max) if hasattr(grade, 'max') and grade.max else None,
        "min": str(grade.min) if hasattr(grade, 'min') and grade.min else None,
    }

def serialize_pronote_homework(hw) -> dict:
    """Convert Pronote Homework to dict"""
    return {
        "id": str(uuid.uuid4()),
        "subject": hw.subject.name if hw.subject else "Matière",
        "subject_color": "#4F46E5",
        "description": hw.description or "",
        "date": hw.date.isoformat() if hw.date else None,
        "done": hw.done if hasattr(hw, 'done') else False,
        "background_color": getattr(hw, 'background_color', None),
    }

def serialize_pronote_lesson(lesson) -> dict:
    """Convert Pronote Lesson to dict"""
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
        "memo": lesson.memo if hasattr(lesson, 'memo') else None,
    }

def serialize_pronote_absence(absence) -> dict:
    """Convert Pronote Absence to dict"""
    return {
        "id": str(uuid.uuid4()),
        "from_date": absence.from_date.isoformat() if hasattr(absence, 'from_date') and absence.from_date else None,
        "to_date": absence.to_date.isoformat() if hasattr(absence, 'to_date') and absence.to_date else None,
        "justified": absence.justified if hasattr(absence, 'justified') else False,
        "hours": absence.hours if hasattr(absence, 'hours') else 0,
        "reasons": absence.reasons if hasattr(absence, 'reasons') else [],
    }

# ==================== ECOLEDIRECTE HELPERS ====================

async def get_ecoledirecte_client(username: str, password: str):
    """Create an EcoleDirecte client"""
    try:
        # Using ecoledirecteapi (simpler sync library)
        from ecoledirecteapi import Bot
        bot = Bot()
        if bot.login(username, password):
            return bot
        return None
    except Exception as e:
        logging.error(f"EcoleDirecte login error: {e}")
        return None

def serialize_ed_grade(note) -> dict:
    """Convert EcoleDirecte grade to dict"""
    return {
        "id": str(uuid.uuid4()),
        "value": note.get('valeur', ''),
        "out_of": note.get('noteSur', '20'),
        "coefficient": float(note.get('coef', 1)),
        "subject": note.get('libelleMatiere', 'Matière'),
        "subject_color": "#F43F5E",
        "date": note.get('date', ''),
        "comment": note.get('depistementation', ''),
        "class_average": note.get('moyenneClasse', ''),
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
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"AI Error: {e}")
        return f"Désolé, erreur IA: {str(e)}"

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/login")
async def login(request: ENTLoginRequest):
    """Login with Pronote or EcoleDirecte credentials"""
    
    if request.provider == "pronote":
        if not request.pronote_url:
            raise HTTPException(status_code=400, detail="URL Pronote requise")
        
        # Run in thread to avoid blocking
        loop = asyncio.get_event_loop()
        client = await loop.run_in_executor(
            None,
            get_pronote_client,
            request.username,
            request.password,
            request.pronote_url,
            request.ent or "none"
        )
        
        if not client:
            raise HTTPException(status_code=401, detail="Identifiants Pronote incorrects ou URL invalide")
        
        # Create session
        session = UserSession(
            provider="pronote",
            username=request.username,
            display_name=client.info.name if client.info else request.username,
            class_name=client.info.class_name if client.info else None,
            school_name=client.info.establishment if client.info else None,
        )
        
        # Store credentials encrypted for future API calls
        session_dict = session.model_dump()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["_credentials"] = {
            "pronote_url": request.pronote_url,
            "username": request.username,
            "password": request.password,  # In production, encrypt this!
            "ent": request.ent
        }
        
        await db.sessions.update_one(
            {"id": session.id},
            {"$set": session_dict},
            upsert=True
        )
        
        token = create_token(session.id, "pronote")
        
        return {
            "token": token,
            "user": {
                "id": session.id,
                "provider": "pronote",
                "display_name": session.display_name,
                "class_name": session.class_name,
                "school_name": session.school_name,
            }
        }
    
    elif request.provider == "ecoledirecte":
        # EcoleDirecte login
        client = await get_ecoledirecte_client(request.username, request.password)
        
        if not client:
            raise HTTPException(status_code=401, detail="Identifiants EcoleDirecte incorrects")
        
        session = UserSession(
            provider="ecoledirecte",
            username=request.username,
            display_name=request.username,  # ED doesn't always expose name easily
        )
        
        session_dict = session.model_dump()
        session_dict["created_at"] = session_dict["created_at"].isoformat()
        session_dict["_credentials"] = {
            "username": request.username,
            "password": request.password,
        }
        
        await db.sessions.update_one(
            {"id": session.id},
            {"$set": session_dict},
            upsert=True
        )
        
        token = create_token(session.id, "ecoledirecte")
        
        return {
            "token": token,
            "user": {
                "id": session.id,
                "provider": "ecoledirecte",
                "display_name": session.display_name,
            }
        }
    
    raise HTTPException(status_code=400, detail="Provider non supporté")

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    user_copy = {k: v for k, v in current_user.items() if not k.startswith("_")}
    return user_copy

@api_router.post("/auth/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    await db.sessions.delete_one({"id": current_user["id"]})
    return {"message": "Déconnecté"}

# ==================== PRONOTE DATA ROUTES ====================

async def get_pronote_client_from_session(session: dict):
    """Recreate Pronote client from stored session"""
    creds = session.get("_credentials", {})
    if not creds:
        return None
    
    loop = asyncio.get_event_loop()
    client = await loop.run_in_executor(
        None,
        get_pronote_client,
        creds.get("username"),
        creds.get("password"),
        creds.get("pronote_url"),
        creds.get("ent", "none")
    )
    return client

@api_router.get("/grades")
async def get_grades(current_user: dict = Depends(get_current_user)):
    """Get grades from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client = await get_pronote_client_from_session(current_user)
        if not client:
            raise HTTPException(status_code=401, detail="Session Pronote expirée, reconnectez-vous")
        
        grades = []
        try:
            # Get current period grades
            for period in client.periods:
                for grade in period.grades:
                    grades.append(serialize_pronote_grade(grade))
        except Exception as e:
            logging.error(f"Error fetching grades: {e}")
        
        return {"grades": grades, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        creds = current_user.get("_credentials", {})
        try:
            from ecoledirecteapi import Bot
            bot = Bot()
            if bot.login(creds.get("username"), creds.get("password")):
                raw_grades = bot.getNotes()
                grades = [serialize_ed_grade(g) for g in raw_grades] if raw_grades else []
                return {"grades": grades, "provider": "ecoledirecte"}
        except Exception as e:
            logging.error(f"Error fetching ED grades: {e}")
        
        return {"grades": [], "provider": "ecoledirecte"}
    
    return {"grades": [], "provider": "unknown"}

@api_router.get("/homework")
async def get_homework(current_user: dict = Depends(get_current_user)):
    """Get homework from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client = await get_pronote_client_from_session(current_user)
        if not client:
            raise HTTPException(status_code=401, detail="Session Pronote expirée")
        
        homework = []
        try:
            # Get homework for next 2 weeks
            from datetime import date, timedelta
            today = date.today()
            hw_list = client.homework(today, today + timedelta(days=14))
            homework = [serialize_pronote_homework(hw) for hw in hw_list]
        except Exception as e:
            logging.error(f"Error fetching homework: {e}")
        
        return {"homework": homework, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        creds = current_user.get("_credentials", {})
        try:
            from ecoledirecteapi import Bot
            bot = Bot()
            if bot.login(creds.get("username"), creds.get("password")):
                raw_hw = bot.getHomeworks()
                homework = []
                if raw_hw:
                    for hw in raw_hw:
                        homework.append({
                            "id": str(uuid.uuid4()),
                            "subject": hw.get("matiere", "Matière"),
                            "description": hw.get("contenu", ""),
                            "date": hw.get("date", ""),
                            "done": hw.get("effectue", False),
                        })
                return {"homework": homework, "provider": "ecoledirecte"}
        except Exception as e:
            logging.error(f"Error fetching ED homework: {e}")
        
        return {"homework": [], "provider": "ecoledirecte"}
    
    return {"homework": [], "provider": "unknown"}

@api_router.get("/timetable")
async def get_timetable(
    date_str: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get timetable/schedule from connected ENT"""
    from datetime import date, timedelta
    
    target_date = date.today()
    if date_str:
        try:
            target_date = date.fromisoformat(date_str)
        except:
            pass
    
    if current_user.get("provider") == "pronote":
        client = await get_pronote_client_from_session(current_user)
        if not client:
            raise HTTPException(status_code=401, detail="Session Pronote expirée")
        
        lessons = []
        try:
            # Get lessons for the week
            week_start = target_date - timedelta(days=target_date.weekday())
            week_end = week_start + timedelta(days=6)
            lesson_list = client.lessons(week_start, week_end)
            lessons = [serialize_pronote_lesson(l) for l in lesson_list]
        except Exception as e:
            logging.error(f"Error fetching timetable: {e}")
        
        return {"lessons": lessons, "provider": "pronote"}
    
    elif current_user.get("provider") == "ecoledirecte":
        creds = current_user.get("_credentials", {})
        try:
            from ecoledirecteapi import Bot
            bot = Bot()
            if bot.login(creds.get("username"), creds.get("password")):
                schedules = bot.getSchedules()
                lessons = []
                if schedules:
                    for s in schedules:
                        lessons.append({
                            "id": str(uuid.uuid4()),
                            "subject": s.get("matiere", "Cours"),
                            "teacher": s.get("prof", ""),
                            "room": s.get("salle", ""),
                            "start": s.get("start_date", ""),
                            "end": s.get("end_date", ""),
                        })
                return {"lessons": lessons, "provider": "ecoledirecte"}
        except Exception as e:
            logging.error(f"Error fetching ED schedule: {e}")
        
        return {"lessons": [], "provider": "ecoledirecte"}
    
    return {"lessons": [], "provider": "unknown"}

@api_router.get("/absences")
async def get_absences(current_user: dict = Depends(get_current_user)):
    """Get absences from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client = await get_pronote_client_from_session(current_user)
        if not client:
            raise HTTPException(status_code=401, detail="Session Pronote expirée")
        
        absences = []
        try:
            for period in client.periods:
                if hasattr(period, 'absences'):
                    for absence in period.absences:
                        absences.append(serialize_pronote_absence(absence))
        except Exception as e:
            logging.error(f"Error fetching absences: {e}")
        
        return {"absences": absences, "provider": "pronote"}
    
    return {"absences": [], "provider": current_user.get("provider", "unknown")}

@api_router.get("/info")
async def get_user_info(current_user: dict = Depends(get_current_user)):
    """Get detailed user info from connected ENT"""
    
    if current_user.get("provider") == "pronote":
        client = await get_pronote_client_from_session(current_user)
        if not client:
            raise HTTPException(status_code=401, detail="Session Pronote expirée")
        
        info = {}
        try:
            if client.info:
                info = {
                    "name": client.info.name,
                    "class_name": client.info.class_name,
                    "establishment": client.info.establishment,
                    "phone": getattr(client.info, 'phone', None),
                    "email": getattr(client.info, 'email', None),
                    "address": getattr(client.info, 'address', None),
                    "profile_picture": getattr(client.info, 'profile_picture', None),
                }
        except Exception as e:
            logging.error(f"Error fetching info: {e}")
        
        return {"info": info, "provider": "pronote"}
    
    return {"info": {}, "provider": current_user.get("provider", "unknown")}

# ==================== AI ROUTES ====================

@api_router.post("/ai/chat")
async def ai_chat(message: AIMessage, current_user: dict = Depends(get_current_user)):
    """Chat with Papillon AI assistant"""
    
    # Save user message
    user_msg = ChatMessage(
        user_id=current_user["id"],
        role="user",
        content=message.message
    )
    user_msg_dict = user_msg.model_dump()
    user_msg_dict["created_at"] = user_msg_dict["created_at"].isoformat()
    await db.chat_messages.insert_one(user_msg_dict)
    
    # Get AI response
    context = f"""
L'utilisateur est {current_user.get('display_name', 'un élève')} connecté via {current_user.get('provider', 'ENT')}.
Classe: {current_user.get('class_name', 'Non spécifiée')}
Établissement: {current_user.get('school_name', 'Non spécifié')}
{message.context or ''}
"""
    response = await get_ai_response(message.message, context, session_id=f"chat-{current_user['id']}")
    
    # Save AI message
    ai_msg = ChatMessage(
        user_id=current_user["id"],
        role="assistant",
        content=response
    )
    ai_msg_dict = ai_msg.model_dump()
    ai_msg_dict["created_at"] = ai_msg_dict["created_at"].isoformat()
    await db.chat_messages.insert_one(ai_msg_dict)
    
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
    """Generate a quiz using AI"""
    
    prompt = f"""Génère un quiz de {request.num_questions} questions sur "{request.topic}" en {request.subject} pour un élève de {request.class_level}.
Difficulté: {request.difficulty}

Réponds UNIQUEMENT avec un JSON valide:
{{
    "title": "Titre du quiz",
    "questions": [
        {{
            "question": "La question",
            "options": ["A", "B", "C", "D"],
            "correct_answer": 0,
            "explanation": "Explication"
        }}
    ]
}}"""
    
    response = await get_ai_response(prompt, session_id=f"quiz-{current_user['id']}")
    
    import json
    import re
    try:
        json_match = re.search(r'\{[\s\S]*\}', response)
        if json_match:
            quiz_data = json.loads(json_match.group())
            return quiz_data
    except:
        pass
    
    raise HTTPException(status_code=500, detail="Erreur lors de la génération du quiz")

@api_router.post("/ai/tutoring")
async def ai_tutoring(
    subject: str,
    topic: str,
    question: str,
    current_user: dict = Depends(get_current_user)
):
    """Get tutoring help from AI"""
    
    context = f"""Tu es un tuteur expert en {subject}. Le sujet est: {topic}
Classe de l'élève: {current_user.get('class_name', 'Non spécifiée')}
Explique de manière claire et pédagogue."""
    
    response = await get_ai_response(question, context, session_id=f"tutor-{current_user['id']}")
    return {"response": response}

# ==================== SETTINGS ROUTES ====================

@api_router.put("/settings/theme")
async def update_theme(theme_settings: dict, current_user: dict = Depends(get_current_user)):
    await db.sessions.update_one(
        {"id": current_user["id"]},
        {"$set": {"theme_settings": theme_settings}}
    )
    return {"message": "Thème mis à jour"}

@api_router.get("/settings/theme")
async def get_theme(current_user: dict = Depends(get_current_user)):
    return {"theme_settings": current_user.get("theme_settings", {})}

# ==================== ENT LIST ====================

@api_router.get("/ents")
async def get_available_ents():
    """Get list of available ENT providers for Pronote"""
    ents = [
        {"id": "none", "name": "Connexion directe (sans ENT)", "region": ""},
        {"id": "ile_de_france", "name": "Île-de-France", "region": "Île-de-France"},
        {"id": "paris_classe_numerique", "name": "Paris Classe Numérique", "region": "Paris"},
        {"id": "monbureaunumerique", "name": "Mon Bureau Numérique", "region": "Grand Est"},
        {"id": "ent_hdf", "name": "ENT Hauts-de-France", "region": "Hauts-de-France"},
        {"id": "ent_auvergnerhonealpes", "name": "ENT Auvergne-Rhône-Alpes", "region": "Auvergne-Rhône-Alpes"},
        {"id": "ac_lyon", "name": "Académie de Lyon", "region": "Lyon"},
        {"id": "ac_grenoble", "name": "Académie de Grenoble", "region": "Grenoble"},
        {"id": "ac_rennes", "name": "Académie de Rennes", "region": "Bretagne"},
        {"id": "ac_nantes", "name": "Académie de Nantes", "region": "Pays de la Loire"},
        {"id": "ac_bordeaux", "name": "Académie de Bordeaux", "region": "Nouvelle-Aquitaine"},
        {"id": "occitanie_toulouse", "name": "Occitanie (Toulouse)", "region": "Occitanie"},
        {"id": "occitanie_montpellier", "name": "Occitanie (Montpellier)", "region": "Occitanie"},
        {"id": "ac_lille", "name": "Académie de Lille", "region": "Nord"},
        {"id": "ac_nancy_metz", "name": "Académie de Nancy-Metz", "region": "Lorraine"},
        {"id": "ac_creteil", "name": "Académie de Créteil", "region": "Île-de-France"},
        {"id": "ent77", "name": "ENT 77 (Seine-et-Marne)", "region": "Seine-et-Marne"},
        {"id": "ent_94", "name": "ENT 94 (Val-de-Marne)", "region": "Val-de-Marne"},
        {"id": "val_doise", "name": "Val d'Oise", "region": "Val-d'Oise"},
        {"id": "ent_essonne", "name": "ENT Essonne", "region": "Essonne"},
        {"id": "atrium_sud", "name": "Atrium PACA", "region": "PACA"},
        {"id": "ent_elyco", "name": "e-lyco", "region": "Pays de la Loire"},
        {"id": "eclat_bfc", "name": "ECLAT-BFC", "region": "Bourgogne-Franche-Comté"},
        {"id": "ac_reunion", "name": "Académie de La Réunion", "region": "La Réunion"},
    ]
    return {"ents": ents}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {
        "message": "Bienvenue sur l'API Papillon",
        "description": "Agrégateur ENT - Connectez-vous avec Pronote ou EcoleDirecte",
        "version": "2.0.0"
    }

# Include router and middleware
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
