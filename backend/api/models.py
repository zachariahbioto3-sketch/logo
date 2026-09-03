from django.db import models
from django.contrib.auth.models import AbstractBaseUser, BaseUserManager

class UserManager(BaseUserManager):
    def create_user(self, email, password, **extra):
        user = self.model(email=self.normalize_email(email), **extra)
        user.set_password(password)
        user.save()
        return user

class User(AbstractBaseUser):
    email = models.EmailField(unique=True)
    name = models.CharField(max_length=255, blank=True, null=True)
    default_model = models.CharField(max_length=100, default="gemini-2.0-flash")
    study_field = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = []
    objects = UserManager()

class Project(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="projects")
    created_at = models.DateTimeField(auto_now_add=True)

class Agent(models.Model):
    name = models.CharField(max_length=255)
    system_prompt = models.TextField()
    default_model = models.CharField(max_length=100)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="agents")
    created_at = models.DateTimeField(auto_now_add=True)

class Chat(models.Model):
    title = models.CharField(max_length=255, default="New chat")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="chats")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="chats")
    agent = models.ForeignKey(Agent, on_delete=models.SET_NULL, null=True, blank=True, related_name="chats")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

class Message(models.Model):
    chat = models.ForeignKey(Chat, on_delete=models.CASCADE, related_name="messages")
    role = models.CharField(max_length=20)
    content = models.TextField()
    attachment_url = models.CharField(max_length=500, blank=True, null=True)
    attachment_type = models.CharField(max_length=100, blank=True, null=True)
    attachment_name = models.CharField(max_length=255, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

class Task(models.Model):
    title = models.CharField(max_length=255)
    status = models.CharField(max_length=50, default="todo")
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="tasks")
    project = models.ForeignKey(Project, on_delete=models.SET_NULL, null=True, blank=True, related_name="tasks")
    created_at = models.DateTimeField(auto_now_add=True)

class Deck(models.Model):
    name = models.CharField(max_length=255)
    owner = models.ForeignKey(User, on_delete=models.CASCADE, related_name="decks")
    created_at = models.DateTimeField(auto_now_add=True)

class Flashcard(models.Model):
    front = models.TextField()
    back = models.TextField()
    deck = models.ForeignKey(Deck, on_delete=models.CASCADE, related_name="cards")
    interval = models.IntegerField(default=1)
    ease_factor = models.FloatField(default=2.5)
    repetitions = models.IntegerField(default=0)
    next_review = models.DateTimeField(auto_now_add=True)
    created_at = models.DateTimeField(auto_now_add=True)
