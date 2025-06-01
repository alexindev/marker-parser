import threading
import concurrent.futures
import httpx
from django.db import transaction

from .models import SearchQueryModel, ProductResultModel


class MarketplaceParserService:
    """Сервис для парсинга маркетплейса"""

    # Максимальное количество страниц для парсинга
    MAX_PAGES = 10
    # Количество результатов на странице
    RESULTS_PER_PAGE = 100
    # Оптимальный размер пакета для массового создания
    BATCH_SIZE = 100

    def start_parsing(self, search_query_id: int, query_text: str):
        """Запуск парсинга в отдельном потоке"""
        thread = threading.Thread(
            target=self._parse_marketplace, args=(search_query_id, query_text)
        )
        thread.daemon = True
        thread.start()

    def _parse_marketplace(self, search_query_id: int, query_text: str):
        """Основная логика парсинга маркетплейса"""
        try:
            # Получаем объект запроса и проверяем валидность
            search_query = SearchQueryModel.objects.get(id=search_query_id)

            # Проверяем валидность запроса и получаем общее количество результатов
            is_valid, total_results, first_page_products, error_message = self.get_data(
                query_text, page=1, return_data=True
            )

            if not is_valid:
                # Запрос невалидный, обновляем запись
                with transaction.atomic():
                    search_query.is_completed = True  # Парсинг завершен, но с ошибкой
                    search_query.total_results = 0
                    search_query.save()
                print(f"Невалидный запрос: {error_message}")
                return
            
            # Определяем количество страниц для парсинга
            # Ограничиваем максимальным количеством страниц
            pages_count = min(
                self.MAX_PAGES, 
                (total_results + self.RESULTS_PER_PAGE - 1) // self.RESULTS_PER_PAGE
            )
            
            # Создаем общий счетчик результатов
            created_count = 0
            
            # Начинаем транзакцию для первой страницы
            with transaction.atomic():
                # Сначала обрабатываем результаты с первой страницы
                created_count += self._process_products(search_query, first_page_products)
            
            # Если есть дополнительные страницы, обрабатываем их в отдельных потоках
            if pages_count > 1:
                created_count += self._parse_additional_pages(search_query, query_text, pages_count)
            
            # Обновляем статус запроса внутри транзакции
            with transaction.atomic():
                search_query.refresh_from_db()  # Получаем свежие данные из БД
                search_query.is_completed = True
                search_query.total_results = created_count
                search_query.save()

        except SearchQueryModel.DoesNotExist:
            print(f"SearchQueryModel с ID {search_query_id} не найден")
        except Exception as e:
            print(f"Ошибка при парсинге: {e}")
    
    def _parse_additional_pages(self, search_query: SearchQueryModel, query_text: str, pages_count: int) -> int:
        """
        Парсинг дополнительных страниц в отдельных потоках
        
        Args:
            search_query: Объект поискового запроса
            query_text: Текст запроса
            pages_count: Общее количество страниц
            
        Returns:
            int: Количество созданных записей о товарах
        """
        created_count = 0
        # Используем ThreadPoolExecutor для параллельного выполнения запросов
        with concurrent.futures.ThreadPoolExecutor(max_workers=min(self.MAX_PAGES, pages_count - 1)) as executor:
            # Создаем список задач для обработки страниц со 2-й по pages_count
            futures = [
                executor.submit(self._parse_page, search_query, query_text, page)
                for page in range(2, pages_count + 1)
            ]
            
            # Обрабатываем результаты по мере их завершения
            for future in concurrent.futures.as_completed(futures):
                try:
                    page_results_count = future.result()
                    created_count += page_results_count
                except Exception as e:
                    print(f"Ошибка при обработке страницы: {e}")
        
        return created_count
    
    def _parse_page(self, search_query: SearchQueryModel, query_text: str, page: int) -> int:
        """
        Парсинг одной страницы результатов
        
        Args:
            search_query: Объект поискового запроса
            query_text: Текст запроса
            page: Номер страницы
            
        Returns:
            int: Количество созданных записей о товарах
        """
        try:
            # Получаем данные для указанной страницы
            _, _, products, _ = self.get_data(
                query_text, page=page, return_data=True
            )
            
            # Если нет данных, ничего не делаем
            if not products:
                return 0
                
            # Обрабатываем полученные товары в транзакции
            with transaction.atomic():
                return self._process_products(search_query, products)
            
        except Exception as e:
            print(f"Ошибка при парсинге страницы {page}: {e}")
            return 0
    
    def _process_products(self, search_query: SearchQueryModel, products: list[dict]) -> int:
        """
        Обработка и сохранение данных о товарах массово
        
        Args:
            search_query: Объект поискового запроса
            products: Список товаров
            
        Returns:
            int: Количество созданных записей
        """
        if not products:
            return 0
            
        # Подготавливаем список объектов для массового создания
        product_instances = []
        
        for item in products:
            try:
                # Извлекаем цену из первого размера если есть
                price = 0
                sizes = item.get("sizes", [])
                if sizes and len(sizes) > 0:
                    first_size = sizes[0]
                    price_data = first_size.get("price", {})
                    # Получаем цену и переводим в рубли
                    price = price_data.get("product", 0) / 100
                
                # Создаем экземпляр модели, но не сохраняем в БД
                product_instances.append(
                    ProductResultModel(
                        search_query=search_query,
                        external_id=item.get("id", 0),
                        name=item.get("name", ""),
                        brand=item.get("brand", ""),
                        supplier=item.get("supplier", ""),
                        supplier_rating=item.get("supplierRating", 0.0),
                        review_rating=item.get("reviewRating", 0.0),
                        feedbacks=item.get("feedbacks", 0),
                        price=price,
                    )
                )
            except Exception as e:
                print(f"Ошибка при подготовке данных товара: {e}")
        
        # Если есть данные для создания, выполняем массовое создание в транзакции
        if product_instances:
            with transaction.atomic():
                # Используем bulk_create для массового создания записей
                created_products = ProductResultModel.objects.bulk_create(
                    product_instances, 
                    batch_size=self.BATCH_SIZE,
                    ignore_conflicts=True
                )
                return len(created_products)
        
        return 0

    @staticmethod
    def get_data(query_text: str, page: int = 1, return_data: bool = False) -> tuple[bool, int, list[dict], str | None]:
        """
        Получение всех данных или количество товаров
        
        Args:
            query_text: Текст запроса для проверки
            page: Номер страницы результатов (1-based)
            return_data: Флаг, указывающий нужно ли возвращать данные товаров
            
        Returns:
            Tuple из четырех элементов:
            - bool: Валидность запроса (True/False)
            - int: Количество результатов (если запрос валидный)
            - list[dict]: Данные товаров (если return_data=True) или пустой список
            - str | None: Сообщение об ошибке (если запрос невалидный)
        """
        try:
            url = (
                f"https://search.wb.ru/exactmatch/ru/common/v13/search?curr=rub&"
                f"dest=-1255987&page={page}&query={query_text}&resultset=catalog&sort=popular&"
            )

            # Выполняем запрос к Wildberries
            with httpx.Client() as client:
                response = client.get(url)

            if response.status_code != 200:
                return False, 0, [], f"Ошибка запроса к маркетплейсу. Код: {response.status_code}"

            # Безопасно получаем JSON данные
            try:
                data = response.json()
            except Exception:
                return False, 0, [], "Ошибка при разборе ответа от маркетплейса"

            # Безопасно проверяем наличие данных и продуктов
            data_section = data.get("data", {})
            products = data_section.get("products", [])
            
            if products and len(products) > 0:
                # Безопасно получаем общее количество результатов
                total_results = data_section.get("total", len(products))
                result_products = products if return_data else []
                return True, total_results, result_products, None
            else:
                return False, 0, [], "Не найдено результатов"

        except Exception as e:
            return False, 0, [], f"Ошибка при проверке запроса: {str(e)}"