
from django.contrib import admin
from django.urls import path, include
from chats.views import CustomObtainAuthTokenView
from chats.views import ConversationViewSet, MessageViewSet,UserViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('users', UserViewSet)
router.register("conversations", ConversationViewSet)
router.register("messages", MessageViewSet)

urlpatterns = router.urls + [
    path('admin/', admin.site.urls),
    path("auth-token/", CustomObtainAuthTokenView.as_view()),
]
