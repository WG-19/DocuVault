from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse

def root_view(request):
    return JsonResponse({"message": "UserPortal API"})

urlpatterns = [
    path('', root_view),
    path('admin/', admin.site.urls),
    # Mount all user API endpoints (including token) under /api/ with namespace 'users'
    path('api/', include('userportal.users.urls', namespace='users')),
]

if settings.DEBUG:
    import debug_toolbar
    urlpatterns += [
        path('__debug__/', include(debug_toolbar.urls)),
    ]
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
