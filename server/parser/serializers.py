from rest_framework import serializers
from .models import SearchQueryModel, ProductResultModel


class SearchQuerySerializer(serializers.ModelSerializer):
    """Сериализатор для модели поискового запроса"""

    class Meta:
        model = SearchQueryModel
        fields = ["id", "query_text", "created_at", "is_completed", "total_results"]


class ProductResultSerializer(serializers.ModelSerializer):
    """Сериализатор для модели результата поиска"""

    class Meta:
        model = ProductResultModel
        fields = "__all__"


class CreateSearchQuerySerializer(serializers.ModelSerializer):
    """Сериализатор для создания поискового запроса"""

    class Meta:
        model = SearchQueryModel
        fields = ["query_text"]


class QueryTextSerializer(serializers.Serializer):
    """Сериализатор для валидации текста запроса"""
    
    query = serializers.CharField(required=True, max_length=500)


class SearchQueryDetailSerializer(serializers.ModelSerializer):
    """Детальный сериализатор для запроса с результатами"""
    results_count = serializers.SerializerMethodField()

    class Meta:
        model = SearchQueryModel
        fields = ['id', 'query_text', 'created_at', 'is_completed', 'total_results', 'results_count']

    def get_results_count(self, obj):
        return obj.results.count()
