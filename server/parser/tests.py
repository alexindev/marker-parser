from django.test import TransactionTestCase
from django.urls import reverse
from rest_framework.test import APIClient
from rest_framework import status
from .models import SearchQueryModel, ProductResultModel
from unittest.mock import patch


class SearchQueryAPITests(TransactionTestCase):
    """Тесты для API поисковых запросов"""

    def setUp(self):
        """Подготовка данных для тестирования"""
        self.client = APIClient()

        # Создаем тестовый поисковый запрос
        self.test_query = SearchQueryModel.objects.create(
            query_text="тестовый запрос", is_completed=True, total_results=5
        )

        # Создаем несколько результатов для этого запроса
        for i in range(5):
            ProductResultModel.objects.create(
                search_query=self.test_query,
                external_id=10000 + i,
                name=f"Товар {i+1}",
                brand="Тестовый бренд",
                supplier="Тестовый поставщик",
                supplier_rating=4.5,
                review_rating=4.2,
                feedbacks=100 + i * 10,
                price=1000 + i * 100,
            )

    def test_create_search_query(self):
        """Тест создания нового поискового запроса"""
        url = reverse("search-list")
        data = {"query_text": "джинсы мужские"}
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(SearchQueryModel.objects.count(), 2)  # 1 из setUp + 1 новый

        # Проверяем, что запрос создан с правильными данными
        new_query = SearchQueryModel.objects.filter(query_text="джинсы мужские").first()
        self.assertIsNotNone(new_query)
        self.assertEqual(new_query.is_completed, False)
        self.assertEqual(new_query.total_results, 0)

    def test_create_duplicate_search_query(self):
        """Тест создания дубликата поискового запроса"""
        url = reverse("search-list")
        data = {"query_text": "тестовый запрос"}  # Дубликат существующего запроса
        response = self.client.post(url, data, format="json")

        self.assertEqual(response.status_code, status.HTTP_409_CONFLICT)
        self.assertEqual(SearchQueryModel.objects.count(), 1)  # Только исходный запрос
        self.assertIn("error", response.data)

    def test_get_search_queries_list(self):
        """Тест получения списка поисковых запросов"""
        url = reverse("search-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 1)
        self.assertEqual(response.data["results"][0]["query_text"], "тестовый запрос")

    def test_get_search_query_detail(self):
        """Тест получения деталей поискового запроса"""
        url = reverse("search-detail", args=[self.test_query.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["query_text"], "тестовый запрос")
        self.assertEqual(response.data["is_completed"], True)
        self.assertEqual(response.data["total_results"], 5)

    def test_validate_query(self):
        """Тест валидации поискового запроса"""
        # URL для валидации запроса формируется как [basename]-[action_name]
        url = reverse("search-validate-query")
        data = {"query": "новый валидный запрос"}

        # Мокаем сервис MarketplaceParserService для теста
        with patch("parser.views.MarketplaceParserService") as MockParserService:
            mock_instance = MockParserService.return_value
            mock_instance.get_data.return_value = (True, 100, [], None)

            response = self.client.post(url, data, format="json")

            # Проверяем, что сервис был вызван
            mock_instance.get_data.assert_called_once()
            # Проверяем ответ
            self.assertEqual(response.status_code, status.HTTP_200_OK)
            self.assertEqual(response.data.get("total"), 100)

    def test_get_search_history(self):
        """Тест получения истории поисковых запросов"""
        url = reverse("search-history")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)

        # Если данные пагинированы, результаты будут в 'results'
        if "results" in response.data:
            results = response.data["results"]
            self.assertTrue(len(results) > 0, "История поиска пуста")
            # Ищем наш тестовый запрос в результатах
            found = False
            for item in results:
                if item.get("query_text") == "тестовый запрос":
                    found = True
                    break
            self.assertTrue(found, "Тестовый запрос не найден в истории")
        # Если данные не пагинированы, результаты будут прямо в response.data
        else:
            self.assertTrue(len(response.data) > 0, "История поиска пуста")
            # Ищем наш тестовый запрос в результатах
            found = False
            for item in response.data:
                if (
                    isinstance(item, dict)
                    and item.get("query_text") == "тестовый запрос"
                ):
                    found = True
                    break
            self.assertTrue(found, "Тестовый запрос не найден в истории")


class ProductResultAPITests(TransactionTestCase):
    """Тесты для API результатов парсинга"""

    def setUp(self):
        """Подготовка данных для тестирования"""
        self.client = APIClient()

        # Создаем тестовый поисковый запрос
        self.test_query = SearchQueryModel.objects.create(
            query_text="тестовый запрос", is_completed=True, total_results=10
        )

        # Создаем результаты для тестирования
        for i in range(8):
            ProductResultModel.objects.create(
                search_query=self.test_query,
                external_id=20001 + i,
                name=f"Товар {i+1}",
                brand=f"Бренд {i % 3 + 1}",
                supplier=f"Поставщик {i % 2 + 1}",
                supplier_rating=4.0 + (i % 5) / 10,
                review_rating=3.5 + (i % 5) / 10,
                feedbacks=50 + i * 20,
                price=1000 + i * 500,
            )

    def test_get_all_products(self):
        """Тест получения всех результатов"""
        url = reverse("products-list")
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 8)  # Общее количество товаров

    def test_get_product_detail(self):
        """Тест получения деталей конкретного товара"""
        product = ProductResultModel.objects.first()
        url = reverse("products-detail", args=[product.id])
        response = self.client.get(url)

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["name"], product.name)
        self.assertEqual(response.data["brand"], product.brand)
        self.assertEqual(float(response.data["price"]), product.price)

    def test_get_products_for_query(self):
        """Тест получения результатов для конкретного поискового запроса"""
        url = reverse("products-result")
        response = self.client.get(f"{url}?id={self.test_query.id}")

        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("results", response.data)
        self.assertEqual(len(response.data["results"]), 8)  # Все товары для запроса

        # Проверяем, что все товары соответствуют запросу
        for item in response.data["results"]:
            product = ProductResultModel.objects.get(id=item["id"])
            self.assertEqual(product.search_query_id, self.test_query.id)

    def test_sort_products_by_price(self):
        """Тест сортировки товаров по цене"""
        url = reverse("products-result")

        # Сортировка по возрастанию
        response_asc = self.client.get(f"{url}?id={self.test_query.id}&price_sort=asc")
        self.assertEqual(response_asc.status_code, status.HTTP_200_OK)

        prices_asc = [float(item["price"]) for item in response_asc.data["results"]]
        self.assertEqual(
            prices_asc, sorted(prices_asc)
        )  # Проверяем сортировку по возрастанию

        # Сортировка по убыванию
        response_desc = self.client.get(
            f"{url}?id={self.test_query.id}&price_sort=desc"
        )
        self.assertEqual(response_desc.status_code, status.HTTP_200_OK)

        prices_desc = [float(item["price"]) for item in response_desc.data["results"]]
        self.assertEqual(
            prices_desc, sorted(prices_desc, reverse=True)
        )  # Проверяем сортировку по убыванию

    def test_nonexistent_query_id(self):
        """Тест поведения при запросе несуществующего ID запроса"""
        url = reverse("products-result")
        response = self.client.get(f"{url}?id=999")  # Несуществующий ID

        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.assertIn("error", response.data)
