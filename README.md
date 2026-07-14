npm install phaser
cd backend
python -m venv venv
.\venv\Scripts\activate
pip install django django-cors-headers
python manage.py makemigrations
python manage.py migrate
