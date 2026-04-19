@echo off

cd /d C:\Users\hp\Lucidia-project\backend

call venv\Scripts\activate

python manage.py ingest_data --company-id=2

echo Ingestion job finished