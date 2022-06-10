import numpy as np
from app.models.models import *
import scipy.optimize

def TmModelFunc(T, Tm, k, d,yf, yfs, yu, yus):
    T = np.array(T) + 273.15
    Tm = Tm + 273.15
    a = yf+yfs*(T-Tm)
    b = (yu-yf)+(yus-yfs)*(T-Tm)
    c = (Tm-T)/k
    return a + b / (1 + np.exp(c))**d


def CalcInitialParams(data_x_fit, data_y_fit):
    initial_yf = np.min(data_y_fit)
    initial_yu = np.max(data_y_fit)

    if (len(data_x_fit) > 3 and len(data_y_fit) > 3):
        initial_yfs = round((data_y_fit[0] - data_y_fit[2])/(data_x_fit[0] - data_x_fit[2]),4)
        initial_yus = round((data_y_fit[-1] - data_y_fit[-3])/(data_x_fit[-1] - data_x_fit[-3]),4)
    else:
        initial_yfs = -0.05
        initial_yus = -0.05
    

    #Testing: limit coeffs to negative numbers only
    if (initial_yfs > 0):
        initial_yfs = -0.05
    if (initial_yus > 0):
        initial_yus = -0.05
    return (initial_yf, initial_yfs, initial_yu, initial_yus)


def PerformInitialFit(data_x, data_y):
    derivative = Derivative(data_x, data_y)
    iTm = derivative[0][np.argmax(derivative[1])]

    xRange = (iTm - 11.5, iTm + 6.5)

    data_x_fit = [x for x in data_x if x > xRange[0] and x < xRange[1]]
    data_y_fit = [y for x,y in zip(data_x,data_y) if x > xRange[0] and x < xRange[1]] 
    data_points = [True if x > xRange[0] and x < xRange[1] else False for x in data_x]
        
    i_yf, i_yfs, i_yu, i_yus = CalcInitialParams(data_x_fit, data_y_fit)
    #p0 = TmModelParams(Tm = iTm, dH = 25_000, dCp = 2_500, yf = i_yf , yfs = i_yfs , yu = i_yu, yus = i_yus)
    p0 = TmModelParams_BoltzmannTrans(Tm = np.average(data_x_fit), k=1, d=1, yf = i_yf , yfs = i_yfs , yu = i_yu, yus = i_yus)
    fit_params = TmModelFit(data_x_fit, data_y_fit, p0)
    
    return (data_points, fit_params)


def TmModelFit(data_x_fit, data_y_fit, p0):
    # Tm, dH, yf, yfs, yu, yus
    # p0 = [273.15+50, 10_000, 5, -0.5, 90, -0.5]
    initial_params = [p0.Tm, p0.k, p0.d, p0.yf, p0.yfs, p0.yu, p0.yus]
    bounds = [[],[]]
    bounds[0] = [np.min(data_x_fit), 0.001, 0.1, -5, -10, -5, -10]
    #Testing: limit coeffs to negative numbers only
    #bounds[1] = [np.max(data_x_fit), 350_000, 80_000, 100, 10, 130, 10]
    bounds[1] = [np.max(data_x_fit), 10, 5, 100, -0.001, 130, -0.001]

    #Weights
    # sigma =  []
    # l_sigma = len(data_x_fit)
    # for n, x in enumerate(data_x_fit):
    #     if n <  l_sigma*2/4:
    #         sigma.append(1)
    #     elif n > l_sigma*3/4   and n <= (l_sigma*4/4):
    #         sigma.append(1)
    #     else:
    #         sigma.append(2)


    p, pcov = scipy.optimize.curve_fit(TmModelFunc, data_x_fit, data_y_fit, p0=initial_params, bounds=bounds)
    params = TmModelParams_Sigmoid5Trans(Tm=p[0], k=p[1], d=p[2], yf=p[3], yfs=p[4], yu=p[5], yus=p[6])
    params.round()#for rounding paramamers
    return params


        
def TmModelFitRange(data_x_fit, data_y_fit):
    p = CalcInitialParams(data_x_fit, data_y_fit)
    p0 = TmModelParams_Sigmoid5Trans(Tm=np.average(data_x_fit), k = 1, d=1, yf=p[0], yfs=p[1], yu=p[2], yus=p[3])
    return TmModelFit(data_x_fit, data_y_fit, p0)

def Derivative(x, y):
        y_out = np.gradient(y)
        x_out = []
        for n, t in enumerate(x[:-1]):
            x_out.append((t + x[n+1])/2)
        return [x_out, y_out]

