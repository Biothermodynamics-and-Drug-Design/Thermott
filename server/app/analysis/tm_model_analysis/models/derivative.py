import numpy as np
from app.models.models import *
import scipy.optimize
from scipy.interpolate import interp1d
from scipy import signal
import pandas as pd


def PerformInitialFit(data_x, data_y):
    Tm = CalculateTmFromDerivative(data_x, data_y)
    data_points = [True for x in data_x]
    fit_params = TmModelParams_Derivative(Tm=Tm)
    fit_params.round()

    return (data_points, fit_params)


def TmModelFitRange(data_x, data_y):
    Tm = CalculateTmFromDerivative(data_x, data_y)

    fit_params = TmModelParams_Derivative(Tm=Tm)
    fit_params.round()

    return fit_params


def Derivative(x, y):

    table = pd.DataFrame({"x": x, "y": y})

    table = table.groupby(by="x", as_index=False).mean().reset_index(drop=True)

    x = table["x"].to_list()
    y = table["y"].to_list()

    b, a = signal.butter(3, 0.1)  # order 3 lowpass butterworth filter
    filtered_y = signal.filtfilt(b, a, y)

    y_derivative = np.gradient(filtered_y)

    interpolation_func = interp1d(x, y_derivative, kind="cubic")
    x_interpolated = np.arange(x[0], x[-1], 0.1)
    y_interpolated = interpolation_func(x_interpolated)
    return [x_interpolated, y_interpolated]


def CalculateTmFromDerivative(x, y):
    d = Derivative(x, y)
    return d[0][np.argmax(d[1])]
