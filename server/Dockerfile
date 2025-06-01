FROM python:3.12-alpine

WORKDIR /app

# Установка uv
RUN pip install --no-cache-dir uv

# Копируем только файлы для установки зависимостей
COPY pyproject.toml uv.lock* ./

# Создаем виртуальное окружение и устанавливаем зависимости через uv
RUN uv venv .venv && \
    uv sync \
    --no-dev \
    --no-install-project \
    --frozen

# Добавляем путь к виртуальному окружению в PATH
ENV PATH="/app/.venv/bin:$PATH"

# Копируем код приложения
COPY . .

# Настраиваем переменные окружения
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    UV_LINK_MODE=copy

# Миграции
RUN uv run manage.py migrate

EXPOSE 8000

# Запуск через Gunicorn с логированием
CMD ["uv", "run", "gunicorn", "server.wsgi:application", "--bind", "0.0.0.0:8000", "--workers", "2", "--access-logfile", "-", "--error-logfile", "-", "--log-level", "info"] 