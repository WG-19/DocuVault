from django.urls import path, include
from rest_framework.routers import DefaultRouter
from django.views.decorators.csrf import csrf_exempt
from . import views
from rest_framework_simplejwt.views import TokenRefreshView
from .views import MyTokenObtainPairView, register_view, me_view, logout_view

app_name = "users"

router = DefaultRouter()
router.register(r'profile', views.ProfileView, basename='profile')
router.register(r'addresses', views.AddressViewSet, basename='address')
router.register(r'phones', views.PhoneNumberViewSet, basename='phone')
router.register(r'files', views.FileViewSet, basename='file')

urlpatterns = [
    path('token/', csrf_exempt(MyTokenObtainPairView.as_view()), name='token_obtain_pair'),
    path('token/refresh/', csrf_exempt(TokenRefreshView.as_view()), name='token_refresh'),
    path('logout/', csrf_exempt(logout_view), name='logout'),
    path('register/', register_view, name='register'),  
    path('me/',       me_view,       name='me'),        
    path('~redirect/', view=views.user_redirect_view, name="redirect"),
    path('~update/', view=views.user_update_view, name="update"),
    path('', include(router.urls)),
    path('<str:email>/', view=views.user_detail_view, name="detail"),
]