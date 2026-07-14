import json
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from .models import Puntaje

@csrf_exempt  # Desactiva protección CSRF temporalmente para facilitar la API local
def registrar_puntaje(request):
    if request.method == 'POST':
        try:
            # Leer el JSON enviado por el juego
            datos = json.loads(request.body)
            nuevo_puntaje = Puntaje.objects.create(
                nombre=datos['nombre'],
                score=datos['score']
            )
            return JsonResponse({'mensaje': 'Puntaje guardado con éxito', 'id': nuevo_puntaje.id}, status=201)
        except Exception as e:
            return JsonResponse({'error': str(e)}, status=400)
            
    elif request.method == 'GET':
        # Retorna el Top 10 de mejores puntajes
        mejores = Puntaje.objects.order_by('-score')[:10]
        lista_mejores = list(mejores.values('nombre', 'score', 'fecha'))
        return JsonResponse(lista_mejores, safe=False)