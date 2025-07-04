from rest_framework import serializers
from .models import WordTest

class WordTestSerializer(serializers.ModelSerializer):
    title = serializers.CharField(required=False, allow_blank=True)
    doc_file = serializers.FileField(required=True)  # 
    class Meta:
        model = WordTest
        fields = '__all__'
        extra_kwargs = {
            'parsed_json': {'required': False},  # ← allow missing
        }