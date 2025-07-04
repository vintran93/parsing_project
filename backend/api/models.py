from django.db import models
from django.contrib.postgres.fields import JSONField  # or models.JSONField in recent Django

class WordTest(models.Model):
    title = models.CharField(max_length=200, blank=True, null=True)
    doc_file = models.FileField(upload_to='uploads/')
    parsed_json = models.JSONField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)  # ✅ fix here
    created_at = models.DateTimeField(auto_now_add=True)   # sets on create

    def __str__(self):
        return self.title or "Untitled Test"
    
    def create(self, request, *args, **kwargs):
        print("FILES received:", request.FILES)  # <--- Check uploaded files here
        print("DATA received:", request.data)    # <--- Check form data here
        return super().create(request, *args, **kwargs)