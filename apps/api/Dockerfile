FROM python:3.12-slim
WORKDIR /app
RUN apt-get update && apt-get install -y --no-install-recommends build-essential && rm -rf /var/lib/apt/lists/*
COPY apps/api/requirements.txt /app/apps/api/requirements.txt
RUN pip install --no-cache-dir -r apps/api/requirements.txt
COPY apps/api /app/apps/api
COPY services /app/services
COPY packages/localization /app/packages/localization
COPY scripts/fetch_ephemeris.py /app/scripts/fetch_ephemeris.py
RUN python scripts/fetch_ephemeris.py
RUN useradd --create-home app
USER app
EXPOSE 8000
CMD ["uvicorn", "apps.api.main:app", "--host", "0.0.0.0", "--port", "8000"]
