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

def analizar_motivo(motivo: str):
    motivo = motivo.lower()

    score = 0
    razones = []

    # 🔥 Palabras clave críticas
    if any(p in motivo for p in ["infarto", "dolor en el pecho", "opresión"]):
        score += 6
        razones.append("posible evento cardíaco")

    if any(p in motivo for p in ["convulsión", "desmayo", "inconsciente"]):
        score += 6
        razones.append("evento neurológico")

    if any(p in motivo for p in ["fractura", "accidente", "trauma"]):
        score += 4
        razones.append("trauma")

    if any(p in motivo for p in ["dificultad para respirar", "ahogo"]):
        score += 5
        razones.append("problema respiratorio")

    if any(p in motivo for p in ["fiebre alta", "infección fuerte"]):
        score += 3
        razones.append("posible infección")

    if any(p in motivo for p in ["dolor", "inflamación"]):
        score += 1
        razones.append("síntoma general")

    return score, razones


def calcular_prioridad(data: AppointmentData):
    score = 0
    razones = []

    # 🔥 Signos clínicos críticos
    if data.dificultadRespiratoria:
        score += 6
        razones.append("dificultad respiratoria")

    if data.sangrado:
        score += 5
        razones.append("sangrado")

    if data.dolorIntenso:
        score += 4
        razones.append("dolor intenso")

    if data.fiebre:
        score += 2
        razones.append("fiebre")

    # 🔥 Condiciones especiales
    if data.embarazada:
        score += 3
        razones.append("embarazo")

    if data.discapacidad:
        score += 2
        razones.append("discapacidad")

    # 🔥 Edad
    if data.edad:
        if data.edad > 65:
            score += 3
            razones.append("adulto mayor")
        elif data.edad < 5:
            score += 2
            razones.append("menor de 5 años")

    # 🔥 Análisis del motivo (NUEVO)
    motivo_score, motivo_razones = analizar_motivo(data.motivoConsulta)
    score += motivo_score
    razones.extend(motivo_razones)

    # 🔥 Clasificación más realista
    if score >= 10:
        prioridad = "alta"
    elif score >= 5:
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