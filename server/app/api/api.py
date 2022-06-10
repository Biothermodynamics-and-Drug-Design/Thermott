from fastapi import APIRouter, File, Form, UploadFile, HTTPException

from pydantic import BaseModel

from app.analysis.binding_fit import (
    Fit_OnlyKb,
    CalculateBindingExpGroupError,
    BindingModelParamsFit,
)
from app.analysis.tm_model_analysis import PerformInitialFit, TmModelFitRange
from app.analysis.parameter_prediction import Predict_dCp, Predict_dHu
from app.models.models import (
    XYarray,
    ExperimentWell,
    BindingModelParams,
    TmModelParams,
    KbError,
)
from typing import List, Union, Optional, Dict
import app.analysis.raw_data_parse as parse

import logging



router = APIRouter()


def ActiveGainFluorescence(experimentWell: ExperimentWell):
    for gain in experimentWell.fluorescence:
        if gain.id == experimentWell.active_gain:
            return gain.data
    raise Exception


@router.post("/api/UploadRawData")
def upload_file(
    file: UploadFile = File(...),
    file_type: str = Form(...),
    tm_model: str = Form(...),
    response_model=List[ExperimentWell],
):

    if file:
        filename = file.filename
        txt0 = file.file.readlines()
        txt0 = [line.decode("utf-8") for line in txt0]
        txt = "".join(txt0)
        experimentWells = parse.RawDataParse(txt, filename, file_type)
        tm_model = tm_model.lower().strip()

        # for expwell in data:
        #     item = PerformInitialFit(expwell.temperature, ActiveGainFluorescence(expwell))
        #     expwell.tm_model_params,  expwell.fit_points = item[1], item[0]
        #     expwell.derivative = {}
        if file_type != "TmOnlyCSV":
            for n, expwell in enumerate(experimentWells):
                try:
                    item = PerformInitialFit(
                        expwell.temperature, ActiveGainFluorescence(expwell), tm_model
                    )
                    expwell.tm_model_params, expwell.fit_points = item[1], item[0]
                    expwell.derivative = {}
                except BaseException:
                    expwell.tm_model_params = TmModelParams(Model=tm_model, Tm=None)
                    logging.exception(f"Could not fit experiment well ({n})")

        return experimentWells


class BindingFit_KbOnly_request(BaseModel):
    C: List[float]
    Tm: List[float]
    params: BindingModelParams


class BindingFit_KbOnly_response(BaseModel):
    Kb: float
    confInterval: Optional[List[float]]


@router.post("/api/BindingFit_KbOnly")
def BindingFit_KbOnly(
    request: BindingFit_KbOnly_request, response_model=BindingFit_KbOnly_response
):
    try:
        Kb, interval = Fit_OnlyKb(request.Tm, request.C, request.params)
        request.params.Kb = Kb

        response = BindingFit_KbOnly_response(Kb=Kb, confInterval=interval)
        return response
    except Exception as e:
        print(str(e))
        print(traceback.format_exc())
        raise HTTPException(status_code=500, detail="Could not fit the data")


class BindingFit_request(BaseModel):
    C: List[Union[float, None]]
    Tm: List[Union[float, None]]
    params: BindingModelParams
    fitparams: BindingModelParams


class BindingFit_response(BaseModel):
    params: Dict


@router.post("/api/BindingFit")
def BindingFit_AnyParams(
    request: BindingFit_request, response_model=BindingFit_response
):
    print(request)
    try:
        results = BindingModelParamsFit(
            request.Tm, request.C, request.params, request.fitparams
        )
        response = BindingFit_response(params=results)
        return response
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=500, detail="Could not fit the data")


# class TmFitDataRequest(BaseModel):
#     id: Optional[int]
#     data: XYarray
#     tm_model: str

# @router.post('/api/FitTm')
# def fitTm(request: TmFitDataRequest):
#     try:
#         params = TmModelFitRange(request.data.x, request.data.y, request.tm_model)
#         return params
#     except BaseException as e:
#         raise HTTPException(status_code=500, detail="Could not fit the data")


class TmFitDataManyResponse(BaseModel):
    id: int
    tm_params: Optional[TmModelParams]
    ok: bool


class TmFitDataRequest(BaseModel):
    id: int
    data: XYarray
    tm_model: str


# response:List[TmFitDataManyResponse]
@router.post("/api/FitTm")
def fitTm(request: List[TmFitDataRequest], response_model=List[TmFitDataManyResponse]):
    response = []
    for expWell in request:
        # params = TmModelFitRange(expWell.data.x, expWell.data.y, expWell.tm_model)
        # response.append(TmFitDataManyResponse(id=expWell.id, tm_params=params, ok=True))
        try:
            params = TmModelFitRange(expWell.data.x, expWell.data.y, expWell.tm_model)
            response.append(
                TmFitDataManyResponse(id=expWell.id, tm_params=params, ok=True)
            )
        except BaseException:
            logging.exception("Failed to fit melting curve.")
            response.append(
                TmFitDataManyResponse(
                    id=expWell.id,
                    tm_params=TmModelParams(Model=expWell.tm_model, Tm=None),
                    ok=False,
                )
            )
    return response

@router.post("/api/CalculateBindingExpGroupError")
def calculateBindingExpGroupError(
    BindingModelParamsGroup: List[BindingModelParams],
) -> KbError:
    # return CalculateBindingExpGroupError(BindingModelParamsGroup)
    try:
        return CalculateBindingExpGroupError(BindingModelParamsGroup)
    except Exception as e:
        print(str(e))
        raise HTTPException(status_code=400, detail=str(e))


class PredictParameterRequest(BaseModel):
    n_residues: Union[None, int]
    molecular_weight: Union[None, int]


@router.post("/api/Predict_dCp")
def predict_dCp(request: PredictParameterRequest):
    return round(
        Predict_dCp(
            n_residues=request.n_residues, moleculer_weight=request.molecular_weight
        ),
        0,
    )


@router.post("/api/Predict_dHu")
def predict_dHu(request: PredictParameterRequest):
    return round(
        Predict_dHu(
            n_residues=request.n_residues, moleculer_weight=request.molecular_weight
        ),
        0,
    )
