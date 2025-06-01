from django.db import models


class SearchQueryModel(models.Model):
    """Модель для хранения поисковых запросов"""
    id = models.AutoField(primary_key=True, verbose_name="ID")
    query_text = models.CharField(max_length=255, verbose_name="Текст запроса", unique=True)
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")
    is_completed = models.BooleanField(default=False, verbose_name="Завершен ли парсинг")
    total_results = models.IntegerField(default=0, verbose_name="Общее количество результатов")

    class Meta:
        db_table = 'search_queries'
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.query_text} ({self.created_at.strftime('%d.%m.%Y %H:%M')})"


class ProductResultModel(models.Model):
    """Модель для хранения результатов парсинга товаров"""
    id = models.AutoField(primary_key=True, verbose_name="ID")
    search_query = models.ForeignKey(
        SearchQueryModel, 
        on_delete=models.CASCADE,
        related_name='results'
    )

    external_id = models.BigIntegerField(verbose_name="Внешний ID товара")
    name = models.CharField(max_length=255, verbose_name="Название товара")
    brand = models.CharField(max_length=255, verbose_name="Бренд")
    supplier = models.CharField(max_length=255, verbose_name="Поставщик")
    supplier_rating = models.FloatField(verbose_name="Рейтинг поставщика")
    review_rating = models.FloatField(verbose_name="Рейтинг отзывов")
    feedbacks = models.IntegerField(verbose_name="Количество отзывов")
    price = models.BigIntegerField(verbose_name="Цена")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="Дата создания")

    class Meta:
        db_table = 'product_results'
        ordering = ['id']

    def __str__(self):
        return f"{self.name} - {self.brand}"

