from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

class AppointmentData(BaseModel):
    motivoConsulta: str
    edad: int | None = None
    embarazada: bool = False
    discapacidad: bool = False
    dolorIntenso: bool = False
    sangrado: bool = False
    dificultadRespiratoria: bool = False
    fiebre: bool = False

def calcular_prioridad(data: AppointmentData):
    score = 0
    razones = []

    if data.dolorIntenso:
        score += 3
        razones.append("dolor intenso")

    if data.sangrado:
        score += 4
        razones.append("sangrado")

    if data.dificultadRespiratoria:
        score += 5
        razones.append("dificultad respiratoria")

    if data.fiebre:
        score += 2
        razones.append("fiebre")

    if data.edad and data.edad > 65:
        score += 2
        razones.append("edad avanzada")

    if data.embarazada:
        score += 2
        razones.append("embarazo")

    if data.discapacidad:
        score += 1
        razones.append("discapacidad")

    # Clasificación
    if score >= 7:
        prioridad = "alta"
    elif score >= 4:
        prioridad = "media"
    else:
        prioridad = "baja"

    return prioridad, score, ", ".join(razones)

@app.post("/prioridad")
def prioridad(data: AppointmentData):
    prioridad, score, explicacion = calcular_prioridad(data)

    return {
        "prioridad": prioridad,
        "score": score,
        "explicacion": explicacion
    }