import numpy as np
from scipy.optimize import curve_fit
from dataclasses import dataclass
from app.models.models import BindingModelParams, BindingExperiment, KbError
from typing import List, Iterable, Callable, Tuple
from lmfit import Model, Parameters, Parameter


def BindingModelFunc(
    Tm: float,
    DuH_Tr: float,
    DuCp: float,
    DbH_T0: float,
    DbCp: float,
    Pt: float,
    Tr: float,
    T0: float,
    Kb: float,
):
    """[Function defining the binding model]

    Args:
        Tm (float): [Melting temperature]
        DuH_Tr (float): [Unfolding enthalpy]
        DuCp (float): [Unfolding heat capacity]
        DbH_T0 (float): [Binding enthalpy]
        DbCp (float): [Binding heat capacity]
        Pt (float): [Protein concentration, molar]
        Tr (float): [Melting temperature with no added ligand]
        T0 (float): [Temperature of binding, e.g. 25/37 degrees celsius]
        Kb (float): [Binding constant]

    Returns:
        [float]: [Added ligand concentration, binding model value, molar]
    """
    R = 8.314
    Tm = Tm + 273.15
    Tr = Tr + 273.15
    T0 = T0 + 273.15
    DbG_T0 = -R * T0 * np.log(Kb)

    DuS_Tr = DuH_Tr / Tr
    DbS_T0 = (DbH_T0 - DbG_T0) / T0

    a = (DuH_Tr + DuCp * (Tm - Tr) - Tm * (DuS_Tr + DuCp * np.log(Tm / Tr))) / (R * Tm)
    b = (DbH_T0 + DbCp * (Tm - T0) - Tm * (DbS_T0 + DbCp * np.log(Tm / T0))) / (R * Tm)
    result = (np.exp(-a) - 1) * (Pt / 2 * np.exp(a) + np.exp(b))
    return result


def BindingModelFuncParams(Tm: float, params: BindingModelParams) -> float:
    result = BindingModelFunc(
        Tm=Tm,
        DuH_Tr=params.DuH_Tr,
        DuCp=params.DuCp,
        DbH_T0=params.DbH_T0,
        DbCp=params.DbCp,
        Pt=params.Pt,
        Tr=params.Tr,
        T0=params.T0,
        Kb=params.Kb,
    )
    return result


def BindingModelParamsFit(
    Tm: Iterable[float], C: Iterable[float], params: BindingModelParams, fitparams
):
    bindingModel = Model(BindingModelFunc)

    print(params)

    filter_Tm = []
    filter_C = []
    for t, c in zip(Tm, C):
        if t != None and c != None:
            filter_Tm.append(t)
            filter_C.append(c * params.ActiveLigandFraction)

    maxC = max(C)
    minKb = 1 / maxC

    # Setting up parameters: initial value, range, whether is fixed
    fit_params = Parameters()
    fit_params.add("DuH_Tr", value=params.DuH_Tr, min=50_000, max=2_000_000, vary=fitparams.DuH_Tr)
    fit_params.add("DuCp", value=params.DuCp, min=4_000, max=100_000, vary=fitparams.DuCp)
    fit_params.add("DbH_T0", value=params.DbH_T0, min=-100_000, max=50_000, vary=fitparams.DbH_T0)
    fit_params.add("DbCp", value=params.DbCp, min=-10_000, max=10_000, vary=fitparams.DbCp)
    fit_params.add("Pt", value=params.Pt, min=10 ** -7, max=10 ** -4, vary=fitparams.Pt)
    fit_params.add("Tr", value=params.Tr, vary=fitparams.Tr)
    fit_params.add("T0", value=params.T0, min=0, max=100, vary=fitparams.T0)
    fit_params.add("Kb", value=minKb, min=minKb, max=10 ** 16, vary=fitparams.Kb)
    #fit_params.add('ActiveLigandFraction', value=minKb, min=0.1, max=1.0, vary=fitparams.ActiveLigandFraction)

    result = bindingModel.fit(filter_C, Tm=filter_Tm, params=fit_params)

    # Rounding numbers
    result.best_values["Kb"] = round(result.best_values["Kb"], 0)
    result.best_values["T0"] = round(result.best_values["T0"], 2)
    result.best_values["Tr"] = round(result.best_values["Tr"], 2)
    result.best_values["DuH_Tr"] = round(result.best_values["DuH_Tr"], 0)
    result.best_values["DuCp"] = round(result.best_values["DuCp"], 0)
    result.best_values["DbH_T0"] = round(result.best_values["DbH_T0"], 0)
    result.best_values["DbCp"] = round(result.best_values["DbCp"], 0)
    result.best_values["Pt"] = round(result.best_values["Pt"] * 10 ** 6, 4) / 10 ** 6
    #result.best_values['ActiveLigandFraction'] = round(result.best_values['ActiveLigandFraction'],2)
    return result.best_values


def BindingFitFunction_OnlyKb(params: BindingModelParams):
    # FittingFunction = (lambda Tm, Kb : np.log10(BindingModelFunc(Tm=Tm, DuH_Tr=params.DuH_Tr, DuCp=params.DuCp, DbH_T0=params.DbH_T0, DbCp=params.DbCp, Pt=params.Pt, Tr=params.Tr, T0=params.T0, Kb=Kb)))
    FittingFunction = lambda Tm, Kb: BindingModelFunc(
        Tm=Tm,
        DuH_Tr=params.DuH_Tr,
        DuCp=params.DuCp,
        DbH_T0=params.DbH_T0,
        DbCp=params.DbCp,
        Pt=params.Pt,
        Tr=params.Tr,
        T0=params.T0,
        Kb=Kb,
    )
    return FittingFunction


def Fit_OnlyKb(
    Tm: Iterable[float], C: Iterable[float], params: BindingModelParams
) -> float:
    C = [c * params.ActiveLigandFraction for c in C]
    # Log fit ----------------------
    # p, pcov = curve_fit(fit_func, Tm, np.log10(C), p0=p0, bounds=bounds, sigma=sigma)
    # Kb = p[0]
    # #params.Kb = Kb
    # return round(Kb, 0)
    # ----------------------

    # Linear fit ----------------------
    fit_func = BindingFitFunction_OnlyKb(params)
    bounds = [[1], [10 ** 12]]
    p0 = 1

    # Dirty fix for negative log10 values
    # [f(x) if condition else g(x) for x in sequence]
    Tm = [params.Tr + 0.01 if (t < params.Tr) else t for t in Tm]
    # ----------------------

    # p, pcov = curve_fit(fit_func, Tm, C, p0=p0, bounds=bounds, sigma=sigma)
    p, pcov = curve_fit(fit_func, Tm, C, p0=p0, bounds=bounds)

    Kb = p[0]

    # Determine the minimum Kb that can be determined (min_Kb = maxC)
    maxC = max(C)
    params.Kb = Kb
    conf = None
    if len(C) > 2:
        conf = CalculateConfidenceInterval(Tm, C, params)
    if Kb < 1 / maxC:
        Kb = 1 / maxC
        conf = None
    params.Kb = Kb

    return (round(Kb, 0), conf)


# **Confidence intervals**
# Based on Fitting Models to Biological Data using Linear and Nonlinear Regression
# (Harvey Motulsky & Arthur Chrustipoulos) Version 4.0
from scipy.stats import f


def calc_SSR_limit(SSR0, N, P):
    """
    Calculates sum of squared residuals limits for confidence interval.
    """
    F = f.isf(0.05, 1, N - 1)  # Inverse survival function (inverse of sf).
    return SSR0 * (1 + 1 / (N - P) * F)


def calc_SSR(
    C_list: List[float],
    Tm_list: List[float],
    Kb: float,
    bindingFunc: Callable[[float, float], float],
):
    """
    Calculates sum of squared residuals for a given binding model function.
    """
    SSR = 0
    for c, t in zip(C_list, Tm_list):
        c_teor = bindingFunc(t, Kb)
        SSR += (c_teor - c) ** 2
    return SSR


def CalculateConfidenceInterval(Tms, concs, params) -> Tuple[float, float]:
    """
    Calculates Kb confidence interval
    """
    # sanitize Tms values
    for n, (c, t) in enumerate(zip(concs, Tms)):
        if t < params.Tr:
            # Tms[n] = params.Tr + 0.001
            Tms[n] = 2 * params.Tr - t

    Kb_best = params.Kb

    binding_func = lambda Tm, Kb: BindingModelFunc(
        Tm=Tm,
        DuH_Tr=params.DuH_Tr,
        DuCp=params.DuCp,
        DbH_T0=params.DbH_T0,
        DbCp=params.DbCp,
        Pt=params.Pt,
        Tr=params.Tr,
        T0=params.T0,
        Kb=Kb,
    )

    SSR0_best = calc_SSR(concs, Tms, Kb_best, binding_func)

    Kbs = np.logspace(np.log10(Kb_best) - 0.5, np.log10(Kb_best) + 0.5, 500)
    SSRs = [calc_SSR(concs, Tms, Kb, binding_func) for Kb in Kbs]

    SSR_limit = calc_SSR_limit(SSR0_best, N=len(concs), P=1)
    print(SSR_limit)

    Kb_range = [Kb for Kb, SSR in zip(Kbs, SSRs) if SSR < SSR_limit]
    min_Kb, max_Kb = Kb_range[0], Kb_range[-1]

    return (min_Kb, max_Kb)


from scipy.stats import sem


from scipy import stats

# Pagal http://www.fbml.ff.vu.lt/sites/default/files/I_knyga_-_2_skyrius_-_Matavimai_ir_matavimu_paklaidos_0.pdf 12psl.
def CalculateBindingExpGroupError(
    BindingModelParamsGroup: List[BindingModelParams],
) -> KbError:
    n = len(BindingModelParamsGroup)

    if n <= 1:
        raise Exception(
            f"Binding experiment group does not have enough experiments ({len(BindingModelParamsGroup)})"
        )
    if any([params.Kb <= 1 for params in BindingModelParamsGroup]):
        raise Exception(f"Binding experiment group cannot have negative Kb values.")
    T0_list = [params.T0 for params in BindingModelParamsGroup]
    if len(set(T0_list)) != 1:
        raise Exception(
            f"All binding experiments must have the same T0 parameter. ({', '.join([str(x) for x in T0_list])})"
        )

    R = 8.314  # J/mol/K

    dG_list = [-R * (x.T0 + 273.15) * np.log(x.Kb) for x in BindingModelParamsGroup]
    dG_average = np.mean(dG_list)

    dsq_dG_list = [(dG_average - dG) ** 2 for dG in dG_list]  # delta squared of dG's
    dsq_dG_sum = sum(dsq_dG_list)

    s = (dsq_dG_sum / (n * (n - 1))) ** (1 / 2)  # standard average deviation
    # s = stats.median_abs_deviation(dG_list)

    t = stats.t.ppf(
        1 - 0.05 / 2, n
    )  # Student critical t-value (p < 0.05, n , two-tailed)

    error_dG = t * s

    Kb_average = np.exp(-dG_average / (R * (BindingModelParamsGroup[0].T0 + 273.15)))

    Kb_error = [
        np.exp(
            -(dG_average + error_dG) / (R * (BindingModelParamsGroup[0].T0 + 273.15))
        ),
        np.exp(
            -(dG_average - error_dG) / (R * (BindingModelParamsGroup[0].T0 + 273.15))
        ),
    ]

    return KbError(averageKb=Kb_average, errorKb=Kb_error)
