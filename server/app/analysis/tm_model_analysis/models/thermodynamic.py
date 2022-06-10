from typing import Set
import numpy as np
from app.models.models import *
import scipy.optimize
from scipy.stats import linregress


def TmModelFunc(T, Tm, dH, dCp, yf, yfs, yu, yus):
    yfs = yfs
    yus = yus
    # dCp = 2_500
    R = 1.9872
    T = np.array(T) + 273.15
    Tm = Tm + 273.15
    a = yf + yfs * (T - Tm)
    b = (yu - yf) + (yus - yfs) * (T - Tm)
    c = dH / R * (1 / T - 1 / Tm) - dCp / R * (Tm / T - 1 + np.log(T / Tm))
    return a + b / (1 + np.exp(c))


def TmModelFunc_Param(T, params: TmModelParams_Thermodynamic):
    return TmModelFunc(
        T,
        params.Tm,
        params.dH,
        params.dCp,
        params.yf,
        params.yfs,
        params.yu,
        params.yus,
    )


def CalcInitialParams(data_x_fit, data_y_fit):
    unique_x = sorted(list(set(data_x_fit)))

    initial_yf = np.min(data_y_fit)
    initial_yu = np.max(data_y_fit)

    if len(unique_x) > 3:

        start_x_lim = unique_x[:3]
        end_x_lim = unique_x[-3:]

        start_x, start_y = zip(
            *[(x, y) for (x, y) in zip(data_x_fit, data_y_fit) if x <= start_x_lim[-1]]
        )
        end_x, end_y = zip(
            *[(x, y) for (x, y) in zip(data_x_fit, data_y_fit) if x >= end_x_lim[0]]
        )

        slope, intercept, r, p, se = linregress(start_x, start_y)
        initial_yfs = round(slope, 4)

        slope, intercept, r, p, se = linregress(end_x, end_y)
        initial_yus = round(slope, 4)

        print("params", initial_yfs, initial_yus)
    else:
        initial_yfs = -0.05
        initial_yus = -0.05

    # Testing: limit coeffs to negative numbers only
    if initial_yfs > 0:
        initial_yfs = -0.05
    if initial_yus > 0:
        initial_yus = -0.05

    print("test4")

    return (initial_yf, initial_yfs, initial_yu, initial_yus)


def PerformInitialFit(data_x, data_y):
    derivative = Derivative(data_x, data_y)
    iTm = derivative[0][np.argmax(derivative[1])]

    xRange = (iTm - 13.5, iTm + 8.5)

    data_x_fit = [x for x in data_x if x > xRange[0] and x < xRange[1]]
    data_y_fit = [y for x, y in zip(data_x, data_y) if x > xRange[0] and x < xRange[1]]
    data_points = [True if x > xRange[0] and x < xRange[1] else False for x in data_x]

    i_yf, i_yfs, i_yu, i_yus = CalcInitialParams(data_x_fit, data_y_fit)
    p0 = TmModelParams_Thermodynamic(
        Tm=iTm, dH=100_000, dCp=2_500, yf=i_yf, yfs=i_yfs, yu=i_yu, yus=i_yus
    )
    # p0 = TmModelParams_Thermodynamic(Tm = np.average(data_x_fit), dH = 100_000, dCp = 2_500, yf = i_yf , yfs = i_yfs , yu = i_yu, yus = i_yus)
    fit_params = TmModelFit(data_x_fit, data_y_fit, p0)

    return (data_points, fit_params)


def TmModelFit(data_x_fit, data_y_fit, p0):
    # Tm, dH, yf, yfs, yu, yus
    # p0 = [273.15+50, 10_000, 5, -0.5, 90, -0.5]
    initial_params = [p0.Tm, p0.dH, p0.dCp, p0.yf, p0.yfs, p0.yu, p0.yus]
    bounds = [[], []]
    # bounds[0] = [np.min(data_x_fit), 5_000, 1_000,  p0.yf-10, -10, p0.yu-1, -10]
    minTm, maxTm = np.min(data_x_fit), np.max(data_x_fit)
    bounds[0] = [
        (p0.Tm - 2 if minTm < (p0.Tm - 2) else minTm),
        80_000,
        1_000,
        p0.yf / 2,
        -np.inf,
        p0.yu / 2,
        -np.inf,
    ]
    # Testing: limit coeffs to negative numbers only
    # bounds[1] = [np.max(data_x_fit), 350_000, 80_000, 100, 10, 130, 10]
    bounds[1] = [
        (p0.Tm + 2 if maxTm > (p0.Tm + 2) else minTm),
        1500_000,
        30_000,
        p0.yf * 1.5,
        -0.001,
        p0.yu * 1.5,
        -0.001,
    ]

    # changing scale of parameters (about 50% perf increase)
    x_scale = [1, 1000000, 1, 1, 1, 1, 1]

    p, pcov = scipy.optimize.curve_fit(
        TmModelFunc,
        data_x_fit,
        data_y_fit,
        p0=initial_params,
        bounds=bounds,
        x_scale=x_scale,
    )
    params = TmModelParams_Thermodynamic(
        Tm=p[0], dH=p[1], dCp=p[2], yf=p[3], yfs=p[4], yu=p[5], yus=p[6]
    )
    params.round()  # for rounding paramamers
    return params


def TmModelFitRange(data_x_fit, data_y_fit):
    p = CalcInitialParams(data_x_fit, data_y_fit)
    # p0 = TmModelParams_Thermodynamic(Tm=np.average(data_x_fit), dH=100_000, dCp=2_500, yf=p[0], yfs=p[1], yu=p[2], yus=p[3])
    derivative = Derivative(data_x_fit, data_y_fit)
    p0 = TmModelParams_Thermodynamic(
        Tm=derivative[0][np.argmax(derivative[1])],
        dH=100_000,
        dCp=2_500,
        yf=p[0],
        yfs=p[1],
        yu=p[2],
        yus=p[3],
    )
    return TmModelFit(data_x_fit, data_y_fit, p0)


def Derivative(x, y):
    y_out = np.gradient(y)
    x_out = []
    for n, t in enumerate(x[:-1]):
        x_out.append((t + x[n + 1]) / 2)
    return [x_out, y_out]
