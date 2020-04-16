from rest_framework import serializers
from .models import Repo, Category, Release


class repoSerializer(serializers.ModelSerializer):

    class Meta:
        model = Repo
        fields = ('__all__')


class categorySerializer(serializers.ModelSerializer):

    class Meta:
        model = Category
        fields = ('__all__')


class releaseSerializer(serializers.ModelSerializer):

    class Meta:
        model = Release
        fields = ('__all__')
