from django.contrib import admin
from .models import Repo, Category, Release

# Register your models here.
admin.site.register(Repo)
admin.site.register(Category)
admin.site.register(Release)


