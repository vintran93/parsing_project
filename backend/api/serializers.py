from rest_framework import serializers
from .models import WordTest

class OptionSerializer(serializers.CharField):
    pass

class QuestionSerializer(serializers.Serializer):
    number = serializers.IntegerField(required=False)
    question = serializers.CharField(required=True)
    options = serializers.ListSerializer(
        child=OptionSerializer(), min_length=1, max_length=10
    )
    explanation = serializers.CharField(required=False, allow_blank=True)
    correct_answer = serializers.CharField(required=True, max_length=1)

class ParsedJsonSerializer(serializers.Serializer):
    title = serializers.CharField(required=False, allow_blank=True)
    questions = serializers.ListSerializer(child=QuestionSerializer())

class WordTestSerializer(serializers.ModelSerializer):
    parsed_json = ParsedJsonSerializer(required=False)

    class Meta:
        model = WordTest
        fields = '__all__'
        extra_kwargs = {
            'title': {'required': False, 'allow_blank': True},
            'parsed_json': {'required': False},
        }

    def update(self, instance, validated_data):
        title = validated_data.get('title')
        if title is not None:
            instance.title = title

        parsed_json_data = validated_data.get('parsed_json')
        if parsed_json_data:
            existing_parsed = instance.parsed_json or {}
            new_parsed = existing_parsed.copy()

            if 'title' in parsed_json_data:
                new_parsed['title'] = parsed_json_data['title']

            if 'questions' in parsed_json_data:
                new_parsed['questions'] = parsed_json_data['questions']

            instance.parsed_json = new_parsed

        instance.save()
        return instance