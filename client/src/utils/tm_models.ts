import * as Models from "@/models";

export interface TmModelDescription {
  key: string;
  display_name: string;
  enabled: boolean;
}

export const TmModels: TmModelDescription[] = [
  { key: "thermodynamic", display_name: "Thermodynamic", enabled: true },
  { key: "boltzmann_trans", display_name: "Boltzmann*", enabled: false },
  { key: "derivative", display_name: "Derivative", enabled: true },
  { key: "derivative_sovgal", display_name: "Derivative (Sovgal)", enabled: false },
  { key: "sigmoid5_trans", display_name: "Sigmoid5*", enabled: false },
];

function TmModelFunc_Thermodynamic(T: number, p: Models.TmModelParams_Thermodynamic): number {
  const R = 1.9872;
  T += 273.15;
  const Tm = 273.15 + p.Tm;
  const a = p.yf + p.yfs * (T - Tm);
  const b = p.yu - p.yf + (p.yus - p.yfs) * (T - Tm);
  const c = (p.dH / R) * (1 / T - 1 / Tm) - (p.dCp / R) * (Tm / T - 1 + Math.log(T / Tm));
  return a + b / (1 + Math.exp(c));
}

function TmModelFunc_BoltzmannTrans(T: number, p: Models.TmModelParams_BoltzmannTrans): number {
  T += 273.15;
  const Tm = 273.15 + p.Tm;
  const a = p.yf + p.yfs * (T - Tm);
  const b = p.yu - p.yf + (p.yus - p.yfs) * (T - Tm);
  const c = (Tm - T) / p.k;
  return a + b / (1 + Math.exp(c));
}

function TmModelFunc_Sigmdoid5Trans(T: number, p: Models.TmModelParams_Simgoid5Trans): number {
  T += 273.15;
  const Tm = 273.15 + p.Tm;
  const a = p.yf + p.yfs * (T - Tm);
  const b = p.yu - p.yf + (p.yus - p.yfs) * (T - Tm);
  const c = (Tm - T) / p.k;
  return a + b / Math.pow(1 + Math.exp(c), p.d);
}
function TmModelFunc_Derivative(): number {
  return null;
}

export function TmModelFunc(T: number, p: Models.TmModelParams): number {
  switch (p.Model) {
    case "thermodynamic":
      return TmModelFunc_Thermodynamic(T, p as Models.TmModelParams_Thermodynamic);
      break;
    case "boltzmann_trans":
      return TmModelFunc_BoltzmannTrans(T, p as Models.TmModelParams_BoltzmannTrans);
      break;
    case "sigmoid5_trans":
      return TmModelFunc_Sigmdoid5Trans(T, p as Models.TmModelParams_Simgoid5Trans);
      break;
    case "derivative":
      return TmModelFunc_Derivative();
      break;
    case "derivative_sovgal":
      return TmModelFunc_Derivative();
      break;
    default:
      break;
  }
}

export function TmModelFuncGraph(expWell: Models.ExperimentWell): Models.XYpoint[] {
  const x: number[] = [];
  for (let i = 0; i < expWell.fit_points.length; i++) {
    if (expWell.fit_points[i]) {
      x.push(expWell.temperature[i]);
    }
  }
  const x_range: number[] = [Math.min(...x), Math.max(...x)];
  const graph_points: Models.XYpoint[] = [];
  for (let index = x_range[0]; index <= x_range[1]; index += 0.5) {
    const point: Models.XYpoint = { x: index, y: TmModelFunc(index, expWell.tm_model_params) };
    graph_points.push(point);
  }
  return graph_points;
}
