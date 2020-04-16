from django.shortcuts import render
from django.http import HttpResponse
from rest_framework.renderers import JSONRenderer
from rest_framework.decorators import api_view
from .models import Repo, Category
from .serializers import repoSerializer, categorySerializer, releaseSerializer

# Just wraps a simple HTTP Response to a JSON Response


class JSONResponse(HttpResponse):
    def __init__(self, data, **kwargs):
        content = JSONRenderer().render(data)
        kwargs['content_type'] = 'application/json'
        super(JSONResponse, self).__init__(content, **kwargs)


def index(request):
    return HttpResponse("<h3>Welcome to DebGen API v1.0</h3>")


@api_view(['GET'])
def repos(request):
    repos = Repo.objects.all()
    serializer = repoSerializer(repos, many=True)
    return JSONResponse(serializer.data)


@api_view(['GET'])
def categories(request):
    categories = Category.objects.all()
    serializer = categorySerializer(categories, many=True)
    return JSONResponse(serializer.data)


@api_view(['GET'])
def releases(request):
    releases = Release.objects.all()
    serializer = releaseSerializer(releases, many=True)
    return JSONResponse(serializer.data)


@api_view(['GET'])
def random(request):
    return JSONResponse(random())


# Create your views here.
