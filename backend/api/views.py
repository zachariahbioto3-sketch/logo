import os
import json
from pathlib import Path
from django.conf import settings
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
import google.generativeai as genai
from .models import User, Project, Chat, Message, Task, Agent, Deck, Flashcard
from .serializers import (
    UserSerializer, ProjectSerializer, ChatSerializer,
    MessageSerializer, TaskSerializer, AgentSerializer,
    DeckSerializer, FlashcardSerializer
)

genai.configure(api_key=os.environ.get("GEMINI_API_KEY", ""))

@api_view(["POST"])
@permission_classes([AllowAny])
def signup(request):
    email = request.data.get("email")
    password = request.data.get("password")
    name = request.data.get("name", "")
    if not email or not password:
        return Response({"error": "Email and password required"}, status=400)
    if User.objects.filter(email=email).exists():
        return Response({"error": "User already exists"}, status=400)
    user = User.objects.create_user(email=email, password=password, name=name)
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)})

@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    email = request.data.get("email")
    password = request.data.get("password")
    user = authenticate(request, username=email, password=password)
    if not user:
        return Response({"error": "Invalid credentials"}, status=401)
    refresh = RefreshToken.for_user(user)
    return Response({"access": str(refresh.access_token), "refresh": str(refresh)})

@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)

@api_view(["POST"])
@permission_classes([IsAuthenticated])
@parser_classes([MultiPartParser, FormParser, JSONParser])
def send_message(request, chat_id):
    try:
        chat = Chat.objects.get(id=chat_id, owner=request.user)
    except Chat.DoesNotExist:
        return Response({"error": "Chat not found"}, status=404)

    content = request.data.get("content", "")
    agent_id = request.data.get("agent_id")
    file = request.FILES.get("file")

    attachment_url = None
    attachment_type = None
    attachment_name = None

    if file:
        upload_dir = Path(settings.MEDIA_ROOT)
        upload_dir.mkdir(parents=True, exist_ok=True)
        file_path = upload_dir / file.name
        with open(file_path, "wb+") as dest:
            for chunk in file.chunks():
                dest.write(chunk)
        attachment_url = f"/uploads/{file.name}"
        attachment_type = file.content_type
        attachment_name = file.name

    # Save user message
    user_msg = Message.objects.create(
        chat=chat, role="user", content=content,
        attachment_url=attachment_url,
        attachment_type=attachment_type,
        attachment_name=attachment_name
    )

    # Update chat title if default
    if chat.title == "Untitled Conversation" and content:
        chat.title = content[:40] + ("..." if len(content) > 40 else "")
        chat.save()

    # Build message history for Gemini
    history = Message.objects.filter(chat=chat).order_by("created_at")
    gemini_history = []
    for msg in history:
        role = "user" if msg.role == "user" else "model"
        gemini_history.append({"role": role, "parts": [msg.content]})

    # System prompt from agent or default
    system_prompt = "You are Nicole, a classy and intelligent AI assistant. Be helpful, concise, and elegant in your responses."
    if agent_id:
        try:
            agent = Agent.objects.get(id=agent_id, owner=request.user)
            system_prompt = agent.system_prompt
        except Agent.DoesNotExist:
            pass

    # Call Gemini
    try:
        model_name = "gemini-2.0-flash" if request.data.get("model") == "Nicole Flash" else "gemini-2.0-flash"
        model = genai.GenerativeModel(model_name=model_name, system_instruction=system_prompt)
        chat_session = model.start_chat(history=gemini_history[:-1])
        response = chat_session.send_message(content)
        ai_text = response.text
    except Exception as e:
        ai_text = f"AI error: {str(e)}"

    # Save AI response
    ai_msg = Message.objects.create(chat=chat, role="assistant", content=ai_text)

    return Response({
        "user_message": MessageSerializer(user_msg).data,
        "ai_message": MessageSerializer(ai_msg).data,
        "chat_title": chat.title
    })

class ProjectViewSet(viewsets.ModelViewSet):
    serializer_class = ProjectSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Project.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class ChatViewSet(viewsets.ModelViewSet):
    serializer_class = ChatSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Chat.objects.filter(owner=self.request.user).order_by("-updated_at")
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class MessageViewSet(viewsets.ModelViewSet):
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Message.objects.filter(chat__owner=self.request.user)

class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class AgentViewSet(viewsets.ModelViewSet):
    serializer_class = AgentSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Agent.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class DeckViewSet(viewsets.ModelViewSet):
    serializer_class = DeckSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Deck.objects.filter(owner=self.request.user)
    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

class FlashcardViewSet(viewsets.ModelViewSet):
    serializer_class = FlashcardSerializer
    permission_classes = [IsAuthenticated]
    def get_queryset(self):
        return Flashcard.objects.filter(deck__owner=self.request.user)
