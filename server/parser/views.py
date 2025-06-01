from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.pagination import PageNumberPagination
from .models import SearchQueryModel, ProductResultModel
from .serializers import (
    SearchQuerySerializer,
    ProductResultSerializer,
    CreateSearchQuerySerializer,
    QueryTextSerializer,
)
from .services import MarketplaceParserService


class StandardResultsSetPagination(PageNumberPagination):
    """Стандартная пагинация по 10 элементов"""

    page_size = 10
    max_page_size = 100
    page_size_query_param = "page_size"

    def get_paginated_response(self, data):
        """Дополняем стандартный ответ информацией о текущей странице"""
        return Response(
            {
                "count": self.page.paginator.count,
                "next": self.get_next_link(),
                "previous": self.get_previous_link(),
                "current_page": self.page.number,
                "total_pages": self.page.paginator.num_pages,
                "results": data,
            }
        )


class SearchQueryViewSet(viewsets.ModelViewSet):
    """ViewSet для управления поисковыми запросами"""

    serializer_class = SearchQuerySerializer
    pagination_class = StandardResultsSetPagination
    queryset = SearchQueryModel.objects.all()

    def get_serializer_class(self):
        if self.action == "create":
            return CreateSearchQuerySerializer
        return SearchQuerySerializer

    def create(self, request, *args, **kwargs):
        """Создание нового поискового запроса и запуск парсинга"""
        query_text = request.data.get("query_text", "")

        # Проверяем существование записи
        existing_query = SearchQueryModel.objects.filter(query_text=query_text).first()
        if existing_query:
            return Response(
                {"error": "Запрос уже добавлен"}, status=status.HTTP_409_CONFLICT
            )

        # Стандартный процесс создания
        try:
            serializer = self.get_serializer(data=request.data)
            serializer.is_valid(raise_exception=True)

            query_text = serializer.validated_data["query_text"]

            # Создаем новый запрос
            search_query = SearchQueryModel.objects.create(query_text=query_text)

            # Запускаем парсинг в фоне
            parser_service = MarketplaceParserService()
            parser_service.start_parsing(search_query.id, query_text)

            return Response(status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response(
                {"error": f"Ошибка при создании поискового запроса: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    def destroy(self, request, *args, **kwargs):
        """
        Удаление поискового запроса и связанных результатов

        DELETE /api/search/{id}/
        """
        try:
            search_query = self.get_object()
            search_query.delete()
            return Response(status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {"error": f"Ошибка при удалении запроса: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def validate_query(self, request):
        """
        Проверка валидности запроса без создания записи в БД

        Принимает JSON: {"query": "текст запроса"}
        Проверяет валидность запроса к маркетплейсу
        """
        serializer = QueryTextSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            query = serializer.validated_data["query"]

            # Проверяем, существует ли уже такой запрос
            existing_query = SearchQueryModel.objects.filter(
                query_text=query
            ).first()
            if existing_query:
                return Response(
                    {"error": "Запрос уже добавлен"},
                    status=status.HTTP_409_CONFLICT,
                )

            # Используем сервис для проверки запроса
            parser_service = MarketplaceParserService()
            is_valid, total_results, _, error_message = parser_service.get_data(
                query, return_data=False
            )

            if is_valid:
                return Response(
                    {"total": total_results},
                    status=status.HTTP_200_OK
                )
            else:
                return Response(
                    {"error": error_message},
                    status=status.HTTP_400_BAD_REQUEST,
                )

        except Exception as e:
            return Response(
                {"error": f"Ошибка при проверке запроса: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=False, methods=["post"])
    def create_parsing(self, request):
        """
        Создание задачи парсинга после согласия пользователя

        Принимает JSON: {"query": "текст запроса"}
        Создает запись в БД и запускает парсинг
        """
        serializer = QueryTextSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(
                serializer.errors,
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            query = serializer.validated_data["query"]

            # Проверяем, существует ли уже запрос с таким текстом
            existing_query = SearchQueryModel.objects.filter(
                query=query
            ).first()
            if existing_query:
                return Response(
                    {"error": "Запрос уже добавлен"},
                    status=status.HTTP_409_CONFLICT,
                )

            # Создаем новый запрос
            search_query = SearchQueryModel.objects.create(query=query)

            # Запускаем парсинг в фоне
            parser_service = MarketplaceParserService()
            parser_service.start_parsing(search_query.id, query)

            return Response(
                {"success": True},
                status=status.HTTP_201_CREATED,
            )

        except Exception as e:
            return Response(
                {"error": f"Ошибка при создании задачи парсинга: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST,
            )

    @action(detail=True, methods=["get"])
    def status(self, request, pk=None):
        """Получение статуса парсинга"""
        search_query = self.get_object()
        return Response(
            {
                "id": search_query.id,
                "query": search_query.query,
                "is_completed": search_query.is_completed,
                "total_results": search_query.total_results,
                "created_at": search_query.created_at,
            }
        )

    @action(detail=False, methods=["get"])
    def history(self, request):
        """Получение истории всех поисковых запросов"""
        queryset = self.get_queryset()
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = SearchQuerySerializer(page, many=True)
            return self.get_paginated_response(serializer.data)

        serializer = SearchQuerySerializer(queryset, many=True)
        return Response(serializer.data)


class ProductResultViewSet(viewsets.ReadOnlyModelViewSet):
    """ViewSet для просмотра результатов поиска"""

    serializer_class = ProductResultSerializer
    pagination_class = StandardResultsSetPagination
    queryset = ProductResultModel.objects.all()
    
    def get_queryset(self):
        """
        Возвращает отфильтрованный и отсортированный queryset результатов поиска.
        Поддерживает следующие параметры сортировки:
        - name_sort: asc/desc - сортировка по названию
        - brand_sort: asc/desc - сортировка по бренду
        - supplier_sort: asc/desc - сортировка по поставщику
        - supplier_rating_sort: asc/desc - сортировка по рейтингу поставщика
        - review_rating_sort: asc/desc - сортировка по рейтингу отзывов
        - feedbacks_sort: asc/desc - сортировка по количеству отзывов
        - price_sort: asc/desc - сортировка по цене
        """
        queryset = super().get_queryset()
        
        # Получаем параметры запроса
        if not hasattr(self, 'request') or not self.request:
            return queryset
            
        params = self.request.query_params
        
        # Применяем сортировку на основе параметров запроса
        order_fields = []
        
        # Сортировка по названию
        name_sort = params.get('name_sort')
        if name_sort:
            if name_sort.lower() == 'desc':
                order_fields.append('-name')
            elif name_sort.lower() == 'asc':
                order_fields.append('name')
        
        # Сортировка по бренду
        brand_sort = params.get('brand_sort')
        if brand_sort:
            if brand_sort.lower() == 'desc':
                order_fields.append('-brand')
            elif brand_sort.lower() == 'asc':
                order_fields.append('brand')
        
        # Сортировка по поставщику
        supplier_sort = params.get('supplier_sort')
        if supplier_sort:
            if supplier_sort.lower() == 'desc':
                order_fields.append('-supplier')
            elif supplier_sort.lower() == 'asc':
                order_fields.append('supplier')
        
        # Сортировка по рейтингу поставщика
        supplier_rating_sort = params.get('supplier_rating_sort')
        if supplier_rating_sort:
            if supplier_rating_sort.lower() == 'desc':
                order_fields.append('-supplier_rating')
            elif supplier_rating_sort.lower() == 'asc':
                order_fields.append('supplier_rating')
        
        # Сортировка по рейтингу отзывов
        review_rating_sort = params.get('review_rating_sort')
        if review_rating_sort:
            if review_rating_sort.lower() == 'desc':
                order_fields.append('-review_rating')
            elif review_rating_sort.lower() == 'asc':
                order_fields.append('review_rating')
        
        # Сортировка по количеству отзывов
        feedbacks_sort = params.get('feedbacks_sort')
        if feedbacks_sort:
            if feedbacks_sort.lower() == 'desc':
                order_fields.append('-feedbacks')
            elif feedbacks_sort.lower() == 'asc':
                order_fields.append('feedbacks')
        
        # Сортировка по цене
        price_sort = params.get('price_sort')
        if price_sort:
            if price_sort.lower() == 'desc':
                order_fields.append('-price')
            elif price_sort.lower() == 'asc':
                order_fields.append('price')
        
        # Применяем сортировку, если были указаны параметры
        if order_fields:
            queryset = queryset.order_by(*order_fields)
        
        return queryset
    
    @action(detail=False, methods=["get"])
    def result(self, request):
        """
        Получение результатов для конкретного поискового запроса
        
        GET /api/products/result/?id=1
        
        Параметры:
        - id: ID поискового запроса (обязательный)
    
        
        Параметры сортировки:
        - name_sort: asc/desc - сортировка по названию
        - brand_sort: asc/desc - сортировка по бренду
        - supplier_sort: asc/desc - сортировка по поставщику
        - supplier_rating_sort: asc/desc - сортировка по рейтингу поставщика
        - review_rating_sort: asc/desc - сортировка по рейтингу отзывов
        - feedbacks_sort: asc/desc - сортировка по количеству отзывов
        - price_sort: asc/desc - сортировка по цене
        
        Пример:
        /api/products/result/?id=1&price_sort=asc
        """
        params = request.query_params
        query_id = params.get('id')
        if not query_id or not query_id.isdigit():
            return Response(
                {"error": "Необходимо указать корректный параметр id"},
                status=status.HTTP_400_BAD_REQUEST
            )
            
        try:
            # Проверяем существование поискового запроса
            search_query = SearchQueryModel.objects.get(id=int(query_id))
            queryset = self.get_queryset().filter(search_query=search_query)
            
            # Формируем базовый URL для пагинации с сохранением всех фильтров
            # кроме page и page_size, которые будут добавлены пагинатором
            filter_params = params.copy()
            if 'page' in filter_params:
                filter_params.pop('page')
            if 'page_size' in filter_params:
                filter_params.pop('page_size')
            
            # Добавляем информацию о поисковом запросе для контекста
            search_query_info = {
                "id": search_query.id,
                "query_text": search_query.query_text,
                "is_completed": search_query.is_completed,
                "total_results": search_query.total_results,
                "created_at": search_query.created_at,
                "filters": dict(filter_params)
            }
            
            # Применяем пагинацию
            page = self.paginate_queryset(queryset)
            if page is not None:
                serializer = self.get_serializer(page, many=True)
                response = self.get_paginated_response(serializer.data)
                # Добавляем информацию о запросе в ответ
                response.data["search_query"] = search_query_info
                return response
            
            serializer = self.get_serializer(queryset, many=True)
            return Response({
                "search_query": search_query_info,
                "results": serializer.data
            })
            
        except SearchQueryModel.DoesNotExist:
            return Response(
                {"error": f"Поисковый запрос с ID {query_id} не найден"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"error": f"Ошибка при получении результатов: {str(e)}"},
                status=status.HTTP_400_BAD_REQUEST
            )
