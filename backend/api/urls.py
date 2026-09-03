from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from . import views

router = DefaultRouter()
router.register("projects", views.ProjectViewSet, basename="project")
router.register("chats", views.ChatViewSet, basename="chat")
router.register("messages", views.MessageViewSet, basename="message")
router.register("tasks", views.TaskViewSet, basename="task")
router.register("agents", views.AgentViewSet, basename="agent")
router.register("decks", views.DeckViewSet, basename="deck")
router.register("flashcards", views.FlashcardViewSet, basename="flashcard")

urlpatterns = [
    path("auth/signup/", views.signup),
    path("auth/login/", views.login),
    path("auth/refresh/", TokenRefreshView.as_view()),
    path("auth/me/", views.me),
    path("chats/<str:chat_id>/send/", views.send_message),
    path("", include(router.urls)),
]
