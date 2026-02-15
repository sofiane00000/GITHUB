from fastapi import FastAPI, APIRouter, HTTPException, Depends, Query
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, ConfigDict, EmailStr
from typing import List, Optional, Literal
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
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

app = FastAPI(title="Papillon ENT API")
api_router = APIRouter(prefix="/api")
security = HTTPBearer()

# ==================== MODELS ====================

class UserBase(BaseModel):
    model_config = ConfigDict(extra="ignore")
    email: EmailStr
    first_name: str
    last_name: str
    role: Literal["student", "teacher", "parent", "admin"]
    class_id: Optional[str] = None
    avatar_url: Optional[str] = None
    theme_settings: Optional[dict] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class User(UserBase):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    xp_points: int = 0
    badges: List[str] = []
    children_ids: List[str] = []  # For parents

class ClassModel(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str  # e.g., "6ème A", "Terminale S"
    level: str  # 6eme, 5eme, 4eme, 3eme, seconde, premiere, terminale
    year: str
    teacher_ids: List[str] = []
    student_ids: List[str] = []

class Subject(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    teacher_id: str
    class_ids: List[str] = []
    color: str = "#4F46E5"

class Grade(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    student_id: str
    subject_id: str
    value: float
    max_value: float = 20.0
    coefficient: float = 1.0
    description: str
    date: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    trimester: int = 1

class HomeworkCreate(BaseModel):
    title: str
    description: str
    subject_id: str
    class_id: str
    due_date: datetime
    attachments: List[str] = []

class Homework(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    subject_id: str
    class_id: str
    teacher_id: str
    due_date: datetime
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    attachments: List[str] = []
    ai_priority: Optional[int] = None  # 1-5, calculated by AI

class HomeworkSubmission(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    homework_id: str
    student_id: str
    content: str
    attachments: List[str] = []
    submitted_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    grade: Optional[float] = None
    feedback: Optional[str] = None

class Message(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    sender_id: str
    recipient_id: str
    subject: str
    content: str
    is_ai_generated: bool = False
    read: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class MessageCreate(BaseModel):
    recipient_id: str
    subject: str
    content: str

class TimetableSlot(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    class_id: str
    subject_id: str
    teacher_id: str
    day_of_week: int  # 0=Monday, 6=Sunday
    start_time: str  # "08:00"
    end_time: str  # "09:00"
    room: str

class Resource(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    description: str
    subject_id: str
    class_level: str
    file_url: Optional[str] = None
    content: Optional[str] = None
    resource_type: Literal["document", "video", "exercise", "course"]
    created_by: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Quiz(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    subject_id: str
    class_level: str
    questions: List[dict]  # [{question, options, correct_answer, explanation}]
    created_by: str
    is_ai_generated: bool = False
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class QuizResult(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    quiz_id: str
    student_id: str
    score: float
    answers: List[dict]
    completed_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class ForumPost(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    title: str
    content: str
    author_id: str
    class_id: Optional[str] = None
    subject_id: Optional[str] = None
    replies: List[dict] = []
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class Notification(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    title: str
    message: str
    notification_type: str
    read: bool = False
    link: Optional[str] = None
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class AIMessage(BaseModel):
    message: str
    context: Optional[str] = None

class QuizGenerateRequest(BaseModel):
    subject: str
    topic: str
    class_level: str
    num_questions: int = 5
    difficulty: Literal["easy", "medium", "hard"] = "medium"

class ChatMessage(BaseModel):
    model_config = ConfigDict(extra="ignore")
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    role: Literal["user", "assistant"]
    content: str
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

# ==================== AUTH HELPERS ====================

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str, role: str) -> str:
    payload = {
        "user_id": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"id": payload["user_id"]}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="Utilisateur non trouvé")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expiré")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token invalide")

# ==================== AI HELPERS ====================

async def get_ai_response(message: str, context: str = "", session_id: str = "default") -> str:
    if not EMERGENT_LLM_KEY:
        return "L'assistant IA n'est pas configuré. Veuillez contacter l'administrateur."
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=session_id,
            system_message=f"""Tu es Papillon, l'assistant IA de l'ENT Papillon. Tu aides les élèves, professeurs et parents avec leurs questions scolaires.
Tu es amical, pédagogue et encourageant. Tu réponds toujours en français.
{context}"""
        ).with_model("anthropic", "claude-sonnet-4-5-20250929")
        
        user_message = UserMessage(text=message)
        response = await chat.send_message(user_message)
        return response
    except Exception as e:
        logging.error(f"AI Error: {e}")
        return f"Désolé, je ne peux pas répondre pour le moment. Erreur: {str(e)}"

async def prioritize_homework_ai(homework_list: List[dict]) -> List[dict]:
    if not EMERGENT_LLM_KEY or not homework_list:
        return homework_list
    
    try:
        homework_text = "\n".join([
            f"- {h['title']} ({h.get('subject_name', 'Matière')}) - Date limite: {h['due_date']}"
            for h in homework_list
        ])
        
        prompt = f"""Analyse ces devoirs et attribue une priorité de 1 à 5 (5 = très urgent) basée sur:
- La date limite
- La difficulté probable
- L'importance pour la progression

Devoirs:
{homework_text}

Réponds UNIQUEMENT avec un JSON: {{"priorities": [numéro, numéro, ...]}} dans le même ordre."""

        response = await get_ai_response(prompt, session_id="homework-priority")
        
        import json
        import re
        json_match = re.search(r'\{.*\}', response, re.DOTALL)
        if json_match:
            priorities = json.loads(json_match.group())
            for i, hw in enumerate(homework_list):
                if i < len(priorities.get("priorities", [])):
                    hw["ai_priority"] = priorities["priorities"][i]
        
        return sorted(homework_list, key=lambda x: x.get("ai_priority", 3), reverse=True)
    except Exception as e:
        logging.error(f"Priority AI Error: {e}")
        return homework_list

# ==================== AUTH ROUTES ====================

@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    existing = await db.users.find_one({"email": user_data.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email déjà utilisé")
    
    user = User(**user_data.model_dump(exclude={"password"}))
    user_dict = user.model_dump()
    user_dict["password_hash"] = hash_password(user_data.password)
    user_dict["created_at"] = user_dict["created_at"].isoformat()
    
    await db.users.insert_one(user_dict)
    token = create_token(user.id, user.role)
    
    return {"token": token, "user": User(**user_dict).model_dump()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Email ou mot de passe incorrect")
    
    token = create_token(user["id"], user["role"])
    user.pop("password_hash", None)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    current_user.pop("password_hash", None)
    return current_user

@api_router.put("/auth/profile")
async def update_profile(updates: dict, current_user: dict = Depends(get_current_user)):
    allowed_fields = ["first_name", "last_name", "avatar_url", "theme_settings"]
    update_data = {k: v for k, v in updates.items() if k in allowed_fields}
    
    await db.users.update_one({"id": current_user["id"]}, {"$set": update_data})
    return {"message": "Profil mis à jour"}

# ==================== CLASSES ROUTES ====================

@api_router.get("/classes", response_model=List[ClassModel])
async def get_classes(current_user: dict = Depends(get_current_user)):
    classes = await db.classes.find({}, {"_id": 0}).to_list(100)
    return classes

@api_router.post("/classes")
async def create_class(class_data: ClassModel, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    class_dict = class_data.model_dump()
    await db.classes.insert_one(class_dict)
    return class_data

# ==================== SUBJECTS ROUTES ====================

@api_router.get("/subjects")
async def get_subjects(current_user: dict = Depends(get_current_user)):
    subjects = await db.subjects.find({}, {"_id": 0}).to_list(100)
    return subjects

@api_router.post("/subjects")
async def create_subject(subject: Subject, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.subjects.insert_one(subject.model_dump())
    return subject

# ==================== GRADES ROUTES ====================

@api_router.get("/grades")
async def get_grades(
    student_id: Optional[str] = None,
    trimester: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if current_user["role"] == "student":
        query["student_id"] = current_user["id"]
    elif student_id:
        query["student_id"] = student_id
    
    if trimester:
        query["trimester"] = trimester
    
    grades = await db.grades.find(query, {"_id": 0}).to_list(1000)
    
    # Convert dates
    for grade in grades:
        if isinstance(grade.get("date"), str):
            grade["date"] = datetime.fromisoformat(grade["date"])
    
    return grades

@api_router.post("/grades")
async def create_grade(grade: Grade, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    grade_dict = grade.model_dump()
    grade_dict["date"] = grade_dict["date"].isoformat()
    await db.grades.insert_one(grade_dict)
    
    # Create notification
    notification = Notification(
        user_id=grade.student_id,
        title="Nouvelle note",
        message=f"Vous avez reçu une note de {grade.value}/{grade.max_value}",
        notification_type="grade"
    )
    notif_dict = notification.model_dump()
    notif_dict["created_at"] = notif_dict["created_at"].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    return grade

# ==================== HOMEWORK ROUTES ====================

@api_router.get("/homework")
async def get_homework(
    class_id: Optional[str] = None,
    prioritize: bool = True,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    elif current_user.get("class_id"):
        query["class_id"] = current_user["class_id"]
    
    homework_list = await db.homework.find(query, {"_id": 0}).to_list(100)
    
    # Get subject names
    subjects = {s["id"]: s["name"] for s in await db.subjects.find({}, {"_id": 0, "id": 1, "name": 1}).to_list(100)}
    for hw in homework_list:
        hw["subject_name"] = subjects.get(hw.get("subject_id"), "Matière")
        if isinstance(hw.get("due_date"), str):
            hw["due_date"] = datetime.fromisoformat(hw["due_date"])
        if isinstance(hw.get("created_at"), str):
            hw["created_at"] = datetime.fromisoformat(hw["created_at"])
    
    if prioritize and current_user["role"] == "student":
        homework_list = await prioritize_homework_ai(homework_list)
    
    return homework_list

@api_router.post("/homework")
async def create_homework(homework: HomeworkCreate, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    hw = Homework(
        **homework.model_dump(),
        teacher_id=current_user["id"]
    )
    hw_dict = hw.model_dump()
    hw_dict["due_date"] = hw_dict["due_date"].isoformat()
    hw_dict["created_at"] = hw_dict["created_at"].isoformat()
    
    await db.homework.insert_one(hw_dict)
    return hw

@api_router.post("/homework/{homework_id}/submit")
async def submit_homework(
    homework_id: str,
    content: str,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] != "student":
        raise HTTPException(status_code=403, detail="Seuls les élèves peuvent soumettre")
    
    submission = HomeworkSubmission(
        homework_id=homework_id,
        student_id=current_user["id"],
        content=content
    )
    sub_dict = submission.model_dump()
    sub_dict["submitted_at"] = sub_dict["submitted_at"].isoformat()
    
    await db.homework_submissions.insert_one(sub_dict)
    
    # Award XP
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"xp_points": 10}})
    
    return submission

# ==================== TIMETABLE ROUTES ====================

@api_router.get("/timetable")
async def get_timetable(
    class_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    elif current_user.get("class_id"):
        query["class_id"] = current_user["class_id"]
    elif current_user["role"] == "teacher":
        query["teacher_id"] = current_user["id"]
    
    slots = await db.timetable.find(query, {"_id": 0}).to_list(100)
    
    # Enrich with subject and teacher names
    subjects = {s["id"]: s for s in await db.subjects.find({}, {"_id": 0}).to_list(100)}
    teachers = {u["id"]: u for u in await db.users.find({"role": "teacher"}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1}).to_list(100)}
    
    for slot in slots:
        subject = subjects.get(slot.get("subject_id"), {})
        teacher = teachers.get(slot.get("teacher_id"), {})
        slot["subject_name"] = subject.get("name", "")
        slot["subject_color"] = subject.get("color", "#4F46E5")
        slot["teacher_name"] = f"{teacher.get('first_name', '')} {teacher.get('last_name', '')}"
    
    return slots

@api_router.post("/timetable")
async def create_timetable_slot(slot: TimetableSlot, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    await db.timetable.insert_one(slot.model_dump())
    return slot

# ==================== MESSAGES ROUTES ====================

@api_router.get("/messages")
async def get_messages(current_user: dict = Depends(get_current_user)):
    messages = await db.messages.find(
        {"$or": [{"sender_id": current_user["id"]}, {"recipient_id": current_user["id"]}]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(100)
    
    # Get user names
    user_ids = set()
    for msg in messages:
        user_ids.add(msg.get("sender_id"))
        user_ids.add(msg.get("recipient_id"))
    
    users = {u["id"]: u for u in await db.users.find({"id": {"$in": list(user_ids)}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1, "role": 1}).to_list(100)}
    
    for msg in messages:
        sender = users.get(msg.get("sender_id"), {})
        recipient = users.get(msg.get("recipient_id"), {})
        msg["sender_name"] = f"{sender.get('first_name', '')} {sender.get('last_name', '')}"
        msg["recipient_name"] = f"{recipient.get('first_name', '')} {recipient.get('last_name', '')}"
        if isinstance(msg.get("created_at"), str):
            msg["created_at"] = datetime.fromisoformat(msg["created_at"])
    
    return messages

@api_router.post("/messages")
async def send_message(message: MessageCreate, current_user: dict = Depends(get_current_user)):
    msg = Message(
        sender_id=current_user["id"],
        **message.model_dump()
    )
    msg_dict = msg.model_dump()
    msg_dict["created_at"] = msg_dict["created_at"].isoformat()
    
    await db.messages.insert_one(msg_dict)
    
    # Notification
    notification = Notification(
        user_id=message.recipient_id,
        title="Nouveau message",
        message=f"Vous avez reçu un message de {current_user['first_name']} {current_user['last_name']}",
        notification_type="message"
    )
    notif_dict = notification.model_dump()
    notif_dict["created_at"] = notif_dict["created_at"].isoformat()
    await db.notifications.insert_one(notif_dict)
    
    return msg

@api_router.put("/messages/{message_id}/read")
async def mark_message_read(message_id: str, current_user: dict = Depends(get_current_user)):
    await db.messages.update_one({"id": message_id, "recipient_id": current_user["id"]}, {"$set": {"read": True}})
    return {"message": "Message marqué comme lu"}

# ==================== RESOURCES ROUTES ====================

@api_router.get("/resources")
async def get_resources(
    subject_id: Optional[str] = None,
    class_level: Optional[str] = None,
    resource_type: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if subject_id:
        query["subject_id"] = subject_id
    if class_level:
        query["class_level"] = class_level
    if resource_type:
        query["resource_type"] = resource_type
    
    resources = await db.resources.find(query, {"_id": 0}).to_list(100)
    return resources

@api_router.post("/resources")
async def create_resource(resource: Resource, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    resource_dict = resource.model_dump()
    resource_dict["created_at"] = resource_dict["created_at"].isoformat()
    await db.resources.insert_one(resource_dict)
    return resource

# ==================== QUIZ ROUTES ====================

@api_router.get("/quizzes")
async def get_quizzes(
    subject_id: Optional[str] = None,
    class_level: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if subject_id:
        query["subject_id"] = subject_id
    if class_level:
        query["class_level"] = class_level
    
    quizzes = await db.quizzes.find(query, {"_id": 0}).to_list(100)
    return quizzes

@api_router.post("/quizzes/generate")
async def generate_quiz(request: QuizGenerateRequest, current_user: dict = Depends(get_current_user)):
    prompt = f"""Génère un quiz de {request.num_questions} questions sur le sujet "{request.topic}" en {request.subject} pour un élève de {request.class_level}.
Difficulté: {request.difficulty}

Réponds UNIQUEMENT avec un JSON valide dans ce format exact:
{{
    "title": "Titre du quiz",
    "questions": [
        {{
            "question": "La question",
            "options": ["Option A", "Option B", "Option C", "Option D"],
            "correct_answer": 0,
            "explanation": "Explication de la réponse"
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
            quiz = Quiz(
                title=quiz_data.get("title", f"Quiz {request.topic}"),
                subject_id=request.subject,
                class_level=request.class_level,
                questions=quiz_data.get("questions", []),
                created_by=current_user["id"],
                is_ai_generated=True
            )
            quiz_dict = quiz.model_dump()
            quiz_dict["created_at"] = quiz_dict["created_at"].isoformat()
            await db.quizzes.insert_one(quiz_dict)
            return quiz
    except json.JSONDecodeError:
        pass
    
    raise HTTPException(status_code=500, detail="Erreur lors de la génération du quiz")

@api_router.post("/quizzes/{quiz_id}/submit")
async def submit_quiz(quiz_id: str, answers: List[int], current_user: dict = Depends(get_current_user)):
    quiz = await db.quizzes.find_one({"id": quiz_id}, {"_id": 0})
    if not quiz:
        raise HTTPException(status_code=404, detail="Quiz non trouvé")
    
    questions = quiz.get("questions", [])
    score = 0
    results = []
    
    for i, (answer, question) in enumerate(zip(answers, questions)):
        correct = answer == question.get("correct_answer")
        if correct:
            score += 1
        results.append({
            "question_index": i,
            "user_answer": answer,
            "correct_answer": question.get("correct_answer"),
            "correct": correct
        })
    
    result = QuizResult(
        quiz_id=quiz_id,
        student_id=current_user["id"],
        score=(score / len(questions)) * 100 if questions else 0,
        answers=results
    )
    result_dict = result.model_dump()
    result_dict["completed_at"] = result_dict["completed_at"].isoformat()
    
    await db.quiz_results.insert_one(result_dict)
    
    # Award XP based on score
    xp_earned = int(result.score / 10)
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"xp_points": xp_earned}})
    
    return {"result": result, "xp_earned": xp_earned}

# ==================== FORUM ROUTES ====================

@api_router.get("/forum")
async def get_forum_posts(
    class_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    query = {}
    if class_id:
        query["class_id"] = class_id
    if subject_id:
        query["subject_id"] = subject_id
    
    posts = await db.forum_posts.find(query, {"_id": 0}).sort("created_at", -1).to_list(100)
    
    # Get author names
    author_ids = [p.get("author_id") for p in posts]
    users = {u["id"]: u for u in await db.users.find({"id": {"$in": author_ids}}, {"_id": 0, "id": 1, "first_name": 1, "last_name": 1}).to_list(100)}
    
    for post in posts:
        author = users.get(post.get("author_id"), {})
        post["author_name"] = f"{author.get('first_name', '')} {author.get('last_name', '')}"
    
    return posts

@api_router.post("/forum")
async def create_forum_post(
    title: str,
    content: str,
    class_id: Optional[str] = None,
    subject_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    post = ForumPost(
        title=title,
        content=content,
        author_id=current_user["id"],
        class_id=class_id,
        subject_id=subject_id
    )
    post_dict = post.model_dump()
    post_dict["created_at"] = post_dict["created_at"].isoformat()
    
    await db.forum_posts.insert_one(post_dict)
    return post

@api_router.post("/forum/{post_id}/reply")
async def reply_to_post(post_id: str, content: str, current_user: dict = Depends(get_current_user)):
    reply = {
        "id": str(uuid.uuid4()),
        "author_id": current_user["id"],
        "author_name": f"{current_user['first_name']} {current_user['last_name']}",
        "content": content,
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    
    await db.forum_posts.update_one({"id": post_id}, {"$push": {"replies": reply}})
    return reply

# ==================== NOTIFICATIONS ROUTES ====================

@api_router.get("/notifications")
async def get_notifications(current_user: dict = Depends(get_current_user)):
    notifications = await db.notifications.find(
        {"user_id": current_user["id"]},
        {"_id": 0}
    ).sort("created_at", -1).to_list(50)
    return notifications

@api_router.put("/notifications/{notification_id}/read")
async def mark_notification_read(notification_id: str, current_user: dict = Depends(get_current_user)):
    await db.notifications.update_one(
        {"id": notification_id, "user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Notification marquée comme lue"}

@api_router.put("/notifications/read-all")
async def mark_all_notifications_read(current_user: dict = Depends(get_current_user)):
    await db.notifications.update_many(
        {"user_id": current_user["id"]},
        {"$set": {"read": True}}
    )
    return {"message": "Toutes les notifications marquées comme lues"}

# ==================== AI CHAT ROUTES ====================

@api_router.post("/ai/chat")
async def ai_chat(message: AIMessage, current_user: dict = Depends(get_current_user)):
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
L'utilisateur est {current_user['first_name']} {current_user['last_name']}, un(e) {current_user['role']}.
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

@api_router.post("/ai/tutoring")
async def ai_tutoring(
    subject: str,
    topic: str,
    question: str,
    class_level: str,
    current_user: dict = Depends(get_current_user)
):
    context = f"""
Tu es un tuteur expert en {subject} pour un élève de {class_level}.
Le sujet est: {topic}
Explique de manière claire et pédagogue, avec des exemples si nécessaire.
"""
    response = await get_ai_response(question, context, session_id=f"tutor-{current_user['id']}")
    
    # Award XP for using tutoring
    await db.users.update_one({"id": current_user["id"]}, {"$inc": {"xp_points": 2}})
    
    return {"response": response, "xp_earned": 2}

# ==================== CURRICULUM DATA ====================

CURRICULUM = {
    "6eme": {
        "Mathématiques": ["Nombres entiers", "Fractions", "Géométrie plane", "Périmètres et aires"],
        "Français": ["Grammaire", "Conjugaison", "Lecture", "Expression écrite"],
        "Histoire-Géographie": ["Antiquité", "Débuts de l'humanité", "Mon espace proche"],
        "SVT": ["Environnement", "Diversité des êtres vivants", "Corps humain"],
        "Anglais": ["Présentation", "Famille", "École", "Loisirs"]
    },
    "5eme": {
        "Mathématiques": ["Nombres relatifs", "Calcul littéral", "Triangles", "Statistiques"],
        "Français": ["Récit d'aventure", "Poésie", "Théâtre", "Argumentation"],
        "Histoire-Géographie": ["Moyen Âge", "Renaissance", "Développement durable"],
        "SVT": ["Nutrition", "Respiration", "Reproduction"],
        "Anglais": ["Voyages", "Culture", "Communication"]
    },
    "4eme": {
        "Mathématiques": ["Puissances", "Équations", "Théorème de Pythagore", "Proportionnalité"],
        "Français": ["Roman XIXe", "Presse", "Correspondance", "Poésie engagée"],
        "Histoire-Géographie": ["Révolutions", "Europe industrielle", "Mondialisation"],
        "SVT": ["Activité interne de la Terre", "Reproduction", "Communication nerveuse"],
        "Anglais": ["Médias", "Technologie", "Actualités"]
    },
    "3eme": {
        "Mathématiques": ["Fonctions", "Trigonométrie", "Probabilités", "Algorithmique"],
        "Français": ["Récit autobiographique", "Poésie moderne", "Argumentation", "Brevet"],
        "Histoire-Géographie": ["Guerres mondiales", "Décolonisation", "France et Europe"],
        "SVT": ["Génétique", "Évolution", "Immunité"],
        "Anglais": ["Civilisation", "Débat", "Projet professionnel"]
    },
    "seconde": {
        "Mathématiques": ["Fonctions", "Géométrie analytique", "Probabilités", "Algorithmique"],
        "Français": ["Roman et nouvelle", "Théâtre", "Poésie", "Argumentation"],
        "Histoire-Géographie": ["Citoyenneté", "Mondialisation", "Environnement"],
        "SVT": ["Terre et vivant", "Enjeux planétaires", "Corps humain"],
        "Anglais": ["Vivre ensemble", "Représentations", "Création"]
    },
    "premiere": {
        "Mathématiques": ["Suites", "Dérivation", "Probabilités", "Géométrie repérée"],
        "Français": ["Roman", "Théâtre", "Poésie", "Littérature d'idées"],
        "Histoire-Géographie": ["Nations et nationalismes", "Démocraties", "Métropolisation"],
        "Spécialités": ["Selon choix de l'élève"]
    },
    "terminale": {
        "Mathématiques": ["Intégration", "Probabilités continues", "Suites et limites", "Géométrie dans l'espace"],
        "Philosophie": ["Conscience", "Liberté", "Vérité", "Justice"],
        "Spécialités": ["Approfondissement selon choix"]
    }
}

@api_router.get("/curriculum")
async def get_curriculum(class_level: Optional[str] = None):
    if class_level and class_level in CURRICULUM:
        return {class_level: CURRICULUM[class_level]}
    return CURRICULUM

@api_router.get("/curriculum/{class_level}/{subject}")
async def get_curriculum_topics(class_level: str, subject: str):
    if class_level in CURRICULUM and subject in CURRICULUM[class_level]:
        return {"topics": CURRICULUM[class_level][subject]}
    raise HTTPException(status_code=404, detail="Programme non trouvé")

# ==================== USERS ROUTES ====================

@api_router.get("/users")
async def get_users(
    role: Optional[str] = None,
    class_id: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    query = {}
    if role:
        query["role"] = role
    if class_id:
        query["class_id"] = class_id
    
    users = await db.users.find(query, {"_id": 0, "password_hash": 0}).to_list(1000)
    return users

# ==================== STATS ROUTES ====================

@api_router.get("/stats/student")
async def get_student_stats(current_user: dict = Depends(get_current_user)):
    student_id = current_user["id"]
    
    # Get grades
    grades = await db.grades.find({"student_id": student_id}, {"_id": 0}).to_list(1000)
    
    # Calculate average
    if grades:
        total_weighted = sum(g["value"] * g.get("coefficient", 1) for g in grades)
        total_coef = sum(g.get("coefficient", 1) for g in grades)
        average = total_weighted / total_coef if total_coef else 0
    else:
        average = 0
    
    # Get homework completion
    homework_count = await db.homework.count_documents({"class_id": current_user.get("class_id")})
    submissions_count = await db.homework_submissions.count_documents({"student_id": student_id})
    
    # Get quiz results
    quiz_results = await db.quiz_results.find({"student_id": student_id}, {"_id": 0}).to_list(100)
    quiz_average = sum(r["score"] for r in quiz_results) / len(quiz_results) if quiz_results else 0
    
    return {
        "average": round(average, 2),
        "grades_count": len(grades),
        "homework_completed": submissions_count,
        "homework_total": homework_count,
        "quiz_average": round(quiz_average, 2),
        "quizzes_completed": len(quiz_results),
        "xp_points": current_user.get("xp_points", 0),
        "badges": current_user.get("badges", [])
    }

@api_router.get("/stats/class/{class_id}")
async def get_class_stats(class_id: str, current_user: dict = Depends(get_current_user)):
    if current_user["role"] not in ["admin", "teacher"]:
        raise HTTPException(status_code=403, detail="Non autorisé")
    
    # Get all students in class
    students = await db.users.find({"class_id": class_id, "role": "student"}, {"_id": 0}).to_list(100)
    
    # Get grades for class
    student_ids = [s["id"] for s in students]
    grades = await db.grades.find({"student_id": {"$in": student_ids}}, {"_id": 0}).to_list(10000)
    
    # Calculate class average
    if grades:
        class_average = sum(g["value"] for g in grades) / len(grades)
    else:
        class_average = 0
    
    return {
        "students_count": len(students),
        "class_average": round(class_average, 2),
        "grades_count": len(grades)
    }

# ==================== SEED DATA ====================

@api_router.post("/seed")
async def seed_data():
    """Seed demo data for testing"""
    # Create demo subjects
    subjects = [
        Subject(id="math-1", name="Mathématiques", teacher_id="teacher-1", color="#4F46E5"),
        Subject(id="french-1", name="Français", teacher_id="teacher-2", color="#F43F5E"),
        Subject(id="history-1", name="Histoire-Géographie", teacher_id="teacher-3", color="#0EA5E9"),
        Subject(id="science-1", name="SVT", teacher_id="teacher-4", color="#10B981"),
        Subject(id="english-1", name="Anglais", teacher_id="teacher-5", color="#F59E0B"),
    ]
    
    for subject in subjects:
        await db.subjects.update_one({"id": subject.id}, {"$set": subject.model_dump()}, upsert=True)
    
    # Create demo class
    demo_class = ClassModel(
        id="class-6a",
        name="6ème A",
        level="6eme",
        year="2024-2025"
    )
    await db.classes.update_one({"id": demo_class.id}, {"$set": demo_class.model_dump()}, upsert=True)
    
    # Create demo timetable
    timetable_slots = [
        TimetableSlot(class_id="class-6a", subject_id="math-1", teacher_id="teacher-1", day_of_week=0, start_time="08:00", end_time="09:00", room="Salle 101"),
        TimetableSlot(class_id="class-6a", subject_id="french-1", teacher_id="teacher-2", day_of_week=0, start_time="09:00", end_time="10:00", room="Salle 102"),
        TimetableSlot(class_id="class-6a", subject_id="english-1", teacher_id="teacher-5", day_of_week=0, start_time="10:15", end_time="11:15", room="Salle 103"),
        TimetableSlot(class_id="class-6a", subject_id="history-1", teacher_id="teacher-3", day_of_week=1, start_time="08:00", end_time="09:00", room="Salle 201"),
        TimetableSlot(class_id="class-6a", subject_id="science-1", teacher_id="teacher-4", day_of_week=1, start_time="09:00", end_time="10:00", room="Salle 202"),
        TimetableSlot(class_id="class-6a", subject_id="math-1", teacher_id="teacher-1", day_of_week=2, start_time="08:00", end_time="09:00", room="Salle 101"),
        TimetableSlot(class_id="class-6a", subject_id="french-1", teacher_id="teacher-2", day_of_week=2, start_time="10:15", end_time="11:15", room="Salle 102"),
        TimetableSlot(class_id="class-6a", subject_id="science-1", teacher_id="teacher-4", day_of_week=3, start_time="14:00", end_time="15:00", room="Salle 202"),
        TimetableSlot(class_id="class-6a", subject_id="english-1", teacher_id="teacher-5", day_of_week=4, start_time="08:00", end_time="09:00", room="Salle 103"),
        TimetableSlot(class_id="class-6a", subject_id="history-1", teacher_id="teacher-3", day_of_week=4, start_time="09:00", end_time="10:00", room="Salle 201"),
    ]
    
    for slot in timetable_slots:
        await db.timetable.update_one({"id": slot.id}, {"$set": slot.model_dump()}, upsert=True)
    
    return {"message": "Données de démonstration créées"}

# ==================== ROOT ====================

@api_router.get("/")
async def root():
    return {"message": "Bienvenue sur l'API Papillon ENT", "version": "1.0.0"}

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
