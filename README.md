# API Парсера Маркетплейса

REST API для парсинга товаров с маркетплейса с фильтрацией, сортировкой и пагинацией результатов.

## Возможности

- Многопоточный парсинг (10 страниц по 100 товаров)
- Фильтрация и сортировка товаров
- Пагинация результатов с метаданными
- Обработка дубликатов и транзакционная безопасность

## API Endpoints

### Поисковые запросы
- `GET/POST /api/search/` - получение списка/создание запроса
- `GET /api/search/{id}/` - детали запроса
- `GET /api/search/history/` - история поисковых запросов
- `POST /api/search/validate-query/` - валидация запроса

### Результаты
- `GET /api/products/` - все результаты
- `GET /api/products/result/?id=1` - результаты для конкретного запроса с сортировкой


### Сортировка (значения: `asc`/`desc`)
- `name_sort`, `brand_sort`, `supplier_sort`
- `supplier_rating_sort`, `review_rating_sort`
- `feedbacks_sort`, `price_sort`

## Установка и запуск

### Клонировать проект

```bash
git clone https://github.com/alexindev/marker-parser.git
```

### Запуск в докер
```bash
docker-compose up
```

## Примеры запросов

```bash
# Создание поискового запроса
curl -X POST http://localhost/api/search/ \
  -H "Content-Type: application/json" \
  -d '{"query_text": "джинсы мужские"}'

# Валидация запроса перед запуском парсинга
curl -X POST http://localhost/api/search/validate-query/ \
  -H "Content-Type: application/json" \
  -d '{"query": "джинсы мужские"}'

# Получение результатов с сортировкой
curl -X GET "http://localhost/api/products/result/?id=1&price_sort=asc"
```

### Запуск тестов локально

```bash
# Запуск всех тестов
uv run manage.py test
```
