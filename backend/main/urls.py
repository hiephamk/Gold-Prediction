
from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    # path('api/', include('Healthcare.urls')),
    path('api/', include('FxPred.urls')),
    # path('api/', include('FX_Currencies.urls')),
]
