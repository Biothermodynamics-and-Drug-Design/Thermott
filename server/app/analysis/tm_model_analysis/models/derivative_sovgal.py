import numpy as np
from app.models.models import *
from typing import Tuple, List
import scipy.optimize
from scipy.interpolate import interp1d
from scipy.signal import savgol_filter



def PerformInitialFit(data_x, data_y):
    Tm = CalculateTmFromDerivative(data_x, data_y)
    data_points = [True for x in data_x]
    fit_params = TmModelParams_Derivative_Sovgal(Tm = Tm)
    fit_params.round()

    return (data_points, fit_params)

        
def TmModelFitRange(data_x, data_y):
    Tm = CalculateTmFromDerivative(data_x, data_y)

    fit_params = TmModelParams_Derivative_Sovgal(Tm = Tm)
    fit_params.round()

    return fit_params

def Derivative(x: List[float], y: List[float]) -> Tuple[List[float], List[float]]:
    # Savgol filter raw data with derivative
    filter_y = savgol_filter(y, 5, 2, deriv=1, delta = 0.1)

    #interpolate data
    interpolation_func = interp1d(x, filter_y, kind='quadratic')
    x_interpolated = np.arange(x[0], x[-1], 0.01)
    y_interpolated = interpolation_func(x_interpolated)

    #filter interpolated data again
    filter_y2 = savgol_filter(y_interpolated, 701, 2, deriv=0)
    return (x_interpolated, filter_y2)

def CalculateTmFromDerivative(x, y):
    d = Derivative(x,y)
    return d[0][np.argmax(d[1])]
