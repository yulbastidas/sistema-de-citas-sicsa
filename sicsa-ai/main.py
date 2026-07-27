from __future__ import annotations

import re
import unicodedata
from typing import Literal

from fastapi import FastAPI
from pydantic import BaseModel, Field, field_validator


app = FastAPI(
    title="SICSA AI",
    description=(
        "Motor de apoyo para calcular la prioridad administrativa "
        "de solicitudes de citas médicas."
    ),
    version="3.0.0",
)


PriorityLevel = Literal["alta", "media", "baja"]


class AppointmentData(BaseModel):
    specialtyId: int | None = Field(
        default=None,
        ge=1,
        description="Identificador de la especialidad",
    )

    specialtyName: str | None = None

    motivoConsulta: str = Field(
        min_length=3,
        max_length=1500,
    )

    observaciones: str | None = Field(
        default=None,
        max_length=3000,
    )

    edad: int | None = Field(
        default=None,
        ge=0,
        le=120,
    )

    embarazada: bool = False
    discapacidad: bool = False

    dolorIntenso: bool = False
    sangrado: bool = False
    dificultadRespiratoria: bool = False
    fiebre: bool = False

    @field_validator("motivoConsulta")
    @classmethod
    def validar_motivo(cls, value: str) -> str:
        value = " ".join(value.strip().split())

        if len(value) < 3:
            raise ValueError(
                "El motivo de consulta debe tener al menos 3 caracteres"
            )

        return value


class PriorityResponse(BaseModel):
    prioridad: PriorityLevel
    score: int
    explicacion: str
    razones: list[str]

    alertaUrgencias: bool
    mensajeUrgencias: str | None

    specialtyId: int | None
    tipoEvaluacion: str

    requiereRevisionHumana: bool
    versionMotor: str


def normalizar_texto(texto: str | None) -> str:
    if not texto:
        return ""

    texto = texto.lower().strip()

    texto = unicodedata.normalize("NFD", texto)

    texto = "".join(
        caracter
        for caracter in texto
        if unicodedata.category(caracter) != "Mn"
    )

    texto = re.sub(r"[^a-z0-9ñ\s]", " ", texto)
    texto = re.sub(r"\s+", " ", texto)

    return texto.strip()


def contiene(texto: str, expresiones: list[str]) -> bool:
    return any(
        normalizar_texto(expresion) in texto
        for expresion in expresiones
    )


def agregar_razon(
    razones: list[str],
    razon: str,
) -> None:
    if razon not in razones:
        razones.append(razon)


def obtener_texto_completo(data: AppointmentData) -> str:
    return normalizar_texto(
        f"{data.motivoConsulta} {data.observaciones or ''}"
    )


def aplicar_condiciones_generales(
    data: AppointmentData,
    score: int,
    razones: list[str],
) -> tuple[int, list[str]]:
    if data.edad is not None:
        if data.edad >= 65:
            score += 12
            agregar_razon(
                razones,
                "persona adulta mayor",
            )

        elif data.edad < 5:
            score += 10
            agregar_razon(
                razones,
                "menor de cinco años",
            )

    if data.embarazada:
        score += 12
        agregar_razon(
            razones,
            "embarazo reportado",
        )

    if data.discapacidad:
        score += 8
        agregar_razon(
            razones,
            "condición de discapacidad reportada",
        )

    return score, razones


def evaluar_medico_general(
    data: AppointmentData,
) -> tuple[int, list[str], bool]:
    texto = obtener_texto_completo(data)

    score = 0
    razones: list[str] = []
    alerta_urgencias = False

    if data.dificultadRespiratoria or contiene(
        texto,
        [
            "dificultad para respirar",
            "dificultad respiratoria",
            "falta de aire",
            "me falta el aire",
            "no puedo respirar",
            "ahogo",
        ],
    ):
        score += 40
        agregar_razon(
            razones,
            "dificultad respiratoria reportada",
        )
        alerta_urgencias = True

    if contiene(
        texto,
        [
            "dolor en el pecho",
            "dolor de pecho",
            "opresion en el pecho",
            "pecho apretado",
        ],
    ):
        score += 40
        agregar_razon(
            razones,
            "dolor u opresión en el pecho",
        )
        alerta_urgencias = True

    if data.sangrado or contiene(
        texto,
        [
            "sangrado",
            "hemorragia",
            "sangrado abundante",
            "no para de sangrar",
        ],
    ):
        score += 30
        agregar_razon(
            razones,
            "sangrado reportado",
        )
        alerta_urgencias = True

    if contiene(
        texto,
        [
            "convulsion",
            "convulsiones",
            "inconsciente",
            "perdida del conocimiento",
            "desmayo",
            "no responde",
        ],
    ):
        score += 40
        agregar_razon(
            razones,
            "alteración del estado de conciencia",
        )
        alerta_urgencias = True

    if data.dolorIntenso or contiene(
        texto,
        [
            "dolor fuerte",
            "dolor intenso",
            "intensidad del dolor fuerte",
        ],
    ):
        score += 18
        agregar_razon(
            razones,
            "dolor intenso reportado",
        )

    elif contiene(
        texto,
        [
            "dolor moderado",
            "intensidad del dolor moderado",
        ],
    ):
        score += 10
        agregar_razon(
            razones,
            "dolor moderado reportado",
        )

    elif contiene(
        texto,
        [
            "dolor leve",
            "intensidad del dolor leve",
        ],
    ):
        score += 4
        agregar_razon(
            razones,
            "dolor leve reportado",
        )

    if data.fiebre or contiene(
        texto,
        [
            "fiebre",
            "fiebre alta",
            "temperatura alta",
        ],
    ):
        score += 10
        agregar_razon(
            razones,
            "fiebre reportada",
        )

    if contiene(
        texto,
        [
            "nauseas",
            "vomito",
            "vomitos",
            "diarrea",
            "dolor abdominal",
        ],
    ):
        score += 6
        agregar_razon(
            razones,
            "síntomas digestivos reportados",
        )

    if contiene(
        texto,
        [
            "mareo",
            "fatiga",
            "dolor de cabeza",
            "dolor muscular",
            "tos",
        ],
    ):
        score += 4
        agregar_razon(
            razones,
            "síntomas generales reportados",
        )

    return score, razones, alerta_urgencias


def evaluar_odontologia(
    data: AppointmentData,
) -> tuple[int, list[str], bool]:
    texto = obtener_texto_completo(data)

    score = 0
    razones: list[str] = []
    alerta_urgencias = False

    if contiene(
        texto,
        [
            "limpieza dental",
            "control odontologico",
            "revision odontologica",
        ],
    ):
        score += 2
        agregar_razon(
            razones,
            "atención odontológica preventiva o de control",
        )

    if contiene(
        texto,
        [
            "dolor dental",
            "dolor de muela",
            "muela duele",
            "diente duele",
        ],
    ):
        score += 12
        agregar_razon(
            razones,
            "dolor dental reportado",
        )

    if contiene(
        texto,
        [
            "dolor fuerte",
            "dolor intenso",
            "intensidad del dolor fuerte",
        ],
    ) or data.dolorIntenso:
        score += 18
        agregar_razon(
            razones,
            "dolor odontológico intenso",
        )

    elif contiene(
        texto,
        [
            "dolor moderado",
            "intensidad del dolor moderado",
        ],
    ):
        score += 10
        agregar_razon(
            razones,
            "dolor odontológico moderado",
        )

    if contiene(
        texto,
        [
            "inflamacion facial",
            "cara inflamada",
            "hinchazon de la cara",
        ],
    ):
        score += 30
        agregar_razon(
            razones,
            "inflamación facial reportada",
        )
        alerta_urgencias = True

    if contiene(
        texto,
        [
            "dificultad para abrir la boca",
            "no puedo abrir la boca",
            "trismus",
        ],
    ):
        score += 25
        agregar_razon(
            razones,
            "dificultad para abrir la boca",
        )
        alerta_urgencias = True

    if contiene(
        texto,
        [
            "golpe dental",
            "trauma dental",
            "diente fracturado",
            "diente partido",
        ],
    ):
        score += 18
        agregar_razon(
            razones,
            "trauma o fractura dental",
        )

    if contiene(
        texto,
        [
            "sangrado de encias",
            "sangrado dental",
            "sangrado abundante",
        ],
    ) or data.sangrado:
        score += 12
        agregar_razon(
            razones,
            "sangrado oral reportado",
        )

    if contiene(
        texto,
        [
            "fiebre",
            "fiebre alta",
        ],
    ) or data.fiebre:
        score += 12
        agregar_razon(
            razones,
            "fiebre asociada con molestias odontológicas",
        )

    if contiene(
        texto,
        [
            "caries",
            "inflamacion de encia",
            "encias inflamadas",
        ],
    ):
        score += 8
        agregar_razon(
            razones,
            "caries o inflamación de encías",
        )

    if contiene(
        texto,
        [
            "extraccion dental",
            "tratamiento pendiente",
        ],
    ):
        score += 5
        agregar_razon(
            razones,
            "procedimiento odontológico pendiente",
        )

    return score, razones, alerta_urgencias


def evaluar_higiene_oral(
    data: AppointmentData,
) -> tuple[int, list[str], bool]:
    texto = obtener_texto_completo(data)

    score = 0
    razones: list[str] = []
    alerta_urgencias = False

    if contiene(
        texto,
        [
            "limpieza oral",
            "limpieza dental",
            "control de higiene oral",
            "aplicacion de fluor",
            "educacion en higiene oral",
            "control de placa",
        ],
    ):
        score += 2
        agregar_razon(
            razones,
            "atención preventiva de higiene oral",
        )

    if contiene(
        texto,
        [
            "sangrado de encias",
            "encias sangran",
        ],
    ):
        score += 10
        agregar_razon(
            razones,
            "sangrado frecuente de encías",
        )

    if contiene(
        texto,
        [
            "sensibilidad dental",
            "dolor dental",
            "dolor de muela",
        ],
    ):
        score += 10
        agregar_razon(
            razones,
            "sensibilidad o dolor dental",
        )

    if contiene(
        texto,
        [
            "inflamacion facial",
            "cara inflamada",
            "dificultad para abrir la boca",
        ],
    ):
        score += 25
        agregar_razon(
            razones,
            "síntomas que requieren valoración odontológica",
        )
        alerta_urgencias = True

    return score, razones, alerta_urgencias


def evaluar_generica(
    data: AppointmentData,
) -> tuple[int, list[str], bool]:
    texto = obtener_texto_completo(data)

    score = 0
    razones: list[str] = []
    alerta_urgencias = False

    if contiene(
        texto,
        [
            "primera valoracion",
            "primera consulta",
        ],
    ):
        score += 5
        agregar_razon(
            razones,
            "primera valoración",
        )

    if contiene(
        texto,
        [
            "control",
            "seguimiento",
            "resultado de examen",
            "procedimiento programado",
        ],
    ):
        score += 2
        agregar_razon(
            razones,
            "consulta de control o seguimiento",
        )

    if data.dolorIntenso or contiene(
        texto,
        [
            "dolor fuerte",
            "dolor intenso",
        ],
    ):
        score += 15
        agregar_razon(
            razones,
            "dolor intenso reportado",
        )

    if data.dificultadRespiratoria:
        score += 35
        agregar_razon(
            razones,
            "dificultad respiratoria reportada",
        )
        alerta_urgencias = True

    if data.sangrado:
        score += 25
        agregar_razon(
            razones,
            "sangrado reportado",
        )
        alerta_urgencias = True

    if data.fiebre:
        score += 8
        agregar_razon(
            razones,
            "fiebre reportada",
        )

    return score, razones, alerta_urgencias


def clasificar_prioridad(
    score: int,
    alerta_urgencias: bool,
) -> PriorityLevel:
    if alerta_urgencias or score >= 40:
        return "alta"

    if score >= 15:
        return "media"

    return "baja"


def determinar_tipo_evaluacion(
    specialty_id: int | None,
    specialty_name: str | None,
) -> str:
    nombre = normalizar_texto(specialty_name)

    if specialty_id == 13:
        return "medicina_general"

    if specialty_id == 15:
        return "odontologia"

    if specialty_id == 9:
        return "higiene_oral"

    if "medico general" in nombre or "medicina general" in nombre:
        return "medicina_general"

    if "odontolog" in nombre:
        return "odontologia"

    if "higienista" in nombre or "higiene oral" in nombre:
        return "higiene_oral"

    return "generica"


def calcular_prioridad(
    data: AppointmentData,
) -> PriorityResponse:
    tipo_evaluacion = determinar_tipo_evaluacion(
        data.specialtyId,
        data.specialtyName,
    )

    if tipo_evaluacion == "medicina_general":
        score, razones, alerta_urgencias = evaluar_medico_general(data)

    elif tipo_evaluacion == "odontologia":
        score, razones, alerta_urgencias = evaluar_odontologia(data)

    elif tipo_evaluacion == "higiene_oral":
        score, razones, alerta_urgencias = evaluar_higiene_oral(data)

    else:
        score, razones, alerta_urgencias = evaluar_generica(data)

    score, razones = aplicar_condiciones_generales(
        data,
        score,
        razones,
    )

    score = min(score, 100)

    prioridad = clasificar_prioridad(
        score,
        alerta_urgencias,
    )

    if razones:
        explicacion = "; ".join(razones)
    else:
        explicacion = (
            "No se identificaron factores adicionales de prioridad"
        )

    mensaje_urgencias = None

    if alerta_urgencias:
        mensaje_urgencias = (
            "La información ingresada contiene señales que podrían "
            "requerir atención inmediata. Esta herramienta no realiza "
            "diagnósticos ni reemplaza la valoración de un profesional. "
            "La solicitud debe ser revisada por el personal encargado."
        )

    return PriorityResponse(
        prioridad=prioridad,
        score=score,
        explicacion=explicacion,
        razones=razones,
        alertaUrgencias=alerta_urgencias,
        mensajeUrgencias=mensaje_urgencias,
        specialtyId=data.specialtyId,
        tipoEvaluacion=tipo_evaluacion,
        requiereRevisionHumana=True,
        versionMotor="sicsa-rules-v3.0.0",
    )


@app.get("/")
def root():
    return {
        "service": "SICSA AI",
        "status": "running",
        "version": "3.0.0",
    }


@app.get("/health")
def health():
    return {
        "status": "ok",
        "service": "sicsa-ai",
        "version": "3.0.0",
    }


@app.post(
    "/prioridad",
    response_model=PriorityResponse,
)
def prioridad(data: AppointmentData):
    return calcular_prioridad(data)