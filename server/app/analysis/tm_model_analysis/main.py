
from app.models.models import TmModelParams
from enum import Enum
from typing import List, Iterable, Literal
from .models import boltzmann_trans, thermodynamic, sigmoid5_trans, derivative, derivative_sovgal

module_dict = {
    "thermodynamic": thermodynamic,
    "boltzmann_trans": boltzmann_trans,
    "sigmoid5_trans": sigmoid5_trans,
    "derivative": derivative,
    "derivative_sovgal": derivative_sovgal,
}

class TmModels(Enum):
    thermodynamic = "thermodynamic"
    boltzmann_trans = "boltzmann_trans"
    sigmoid5_trans =  "sigmoid5_trans"
    derivative = "derivative"
    derivative_sovgal = "derivative_sovgal"

def PerformInitialFit(data_x: Iterable[float], data_y: Iterable[float], tm_model:TmModels = TmModels.derivative) -> TmModelParams:
    """Calculates Tm for data when fitting range is unknown

    Args:
        data_x (Iterable[float]): Array of temperatures
        data_y (Iterable[float]): Array of fluorescence data
        tm_model (TmModels | str): Model used to fit the data

    Returns:
        [TmModelParams]: Parameter of the fitted model, always includes Tm
    """
    return module_dict[tm_model].PerformInitialFit(data_x, data_y)


def TmModelFitRange(data_x: Iterable[float], data_y: Iterable[float], tm_model:TmModels = TmModels.derivative) -> TmModelParams:
    """Calculates Tm for data when fitting range is known

    Args:
        data_x (Iterable[float]): Array of temperatures
        data_y (Iterable[float]): Array of fluorescence data
        tm_model (TmModels | str): Model used to fit the data

    Returns:
        [TmModelParams]: Parameter of the fitted model, always includes Tm
    """
    return module_dict[tm_model].TmModelFitRange(data_x, data_y)


def PlotModel (temperature: Iterable[float], tm_model_params: TmModelParams) -> Iterable[float]:
    """Calculates values for based on melting model parameters

    Args:
        temperature (Iterable[float]): Array of temperatures
        tm_model_params (TmModelParams): Model and its params used for model

    Returns:
        Iterable[float]: Model values
    """
    return module_dict[tm_model_params.Model].TmModelFunc_Param(temperature, tm_model_params)