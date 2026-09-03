from rest_framework import serializers
from .models import User, Project, Chat, Message, Task, Agent, Deck, Flashcard

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "email", "name", "default_model", "study_field", "created_at"]

class ProjectSerializer(serializers.ModelSerializer):
    class Meta:
        model = Project
        fields = ["id", "name", "created_at"]

class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = ["id", "chat", "role", "content", "attachment_url", "attachment_type", "attachment_name", "created_at"]

class ChatSerializer(serializers.ModelSerializer):
    messages = MessageSerializer(many=True, read_only=True)
    class Meta:
        model = Chat
        fields = ["id", "title", "project", "agent", "messages", "created_at", "updated_at"]

class TaskSerializer(serializers.ModelSerializer):
    class Meta:
        model = Task
        fields = ["id", "title", "status", "project", "created_at"]

class AgentSerializer(serializers.ModelSerializer):
    class Meta:
        model = Agent
        fields = ["id", "name", "system_prompt", "default_model", "created_at"]

class FlashcardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Flashcard
        fields = ["id", "front", "back", "deck", "interval", "ease_factor", "repetitions", "next_review", "created_at"]

class DeckSerializer(serializers.ModelSerializer):
    cards = FlashcardSerializer(many=True, read_only=True)
    class Meta:
        model = Deck
        fields = ["id", "name", "cards", "created_at"]
