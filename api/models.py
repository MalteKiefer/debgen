from django.db import models


class Release(models.Model):
    name = models.CharField(max_length=250, default='Stable')

    def __str__(self):
        return self.name


class Category(models.Model):
    name = models.CharField(max_length=250, default='Software')

    def __str__(self):
        return self.name


class Repo(models.Model):
    id = models.AutoField(primary_key=True)
    name = models.CharField(max_length=250)
    desc = models.TextField()
    url = models.TextField()
    url_src = models.TextField(blank=True)
    gpg = models.TextField()
    arch = models.TextField()
    homepage = models.TextField()
    documentation = models.TextField()
    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    release = models.ForeignKey(Release, on_delete=models.CASCADE)

    def __str__(self):
        return self.name
