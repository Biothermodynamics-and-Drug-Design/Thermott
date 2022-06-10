import * as Models from "../../models";
import type { Chart } from "chart.js";
import { FitTm, ThermottResponse } from "@/utils/api_hub";
import { ActiveFluorescence, NumberIsBetween } from "@/utils/utils";
import { TmModelFunc } from "@/utils/tm_models";
import { TmModelParams, XYarray } from "@/models";

const color_pallete: string[] = [
  "#1f77b4", // muted blue
  "#ff7f0e", // safety orange
  "#2ca02c", // cooked asparagus green
  "#d62728", // brick red
  "#9467bd", // muted purple
  "#8c564b", // chestnut brown
  "#e377c2", // raspberry yogurt pink
  "#7f7f7f", // middle gray
  "#bcbd22", // curry yellow-green
  "#17becf", // blue-teal
];

function AddDataset(expWell: Models.ExperimentWell, chart: Chart, color: string) {
  const data = GetActiveDisabledSets(expWell);
  const data_active: Models.XYpoint[] = data.data_active;
  const data_disabled: Models.XYpoint[] = data.data_disabled;

  chart.data.datasets.push({
    data: data_active,
    label: "Raw active",
    yAxisID: "yAxis",
    backgroundColor: color + "8A",
    cubicInterpolationMode: expWell.tm_model_params?.Model === "derivative" ? "default" : null,
    showLine: expWell.tm_model_params?.Model === "derivative",
    fill: false,
    borderColor: color,
    borderWidth: 2,
  });

  chart.data.datasets.push({
    data: data_disabled,
    label: "Raw disabled",
    yAxisID: "yAxis",
    backgroundColor: "#b8b8b88a",
  });
  if (expWell.tm_model_params && expWell.tm_model_params.Tm) {
    const data_model: Models.XYpoint[] = [];
    const startIndex = expWell.fit_points.findIndex((x) => x === true);
    let endIndex = expWell.fit_points
      .slice()
      .reverse()
      .findIndex((x) => x === true);
    if (startIndex === -1 && endIndex === -1) return;
    endIndex = expWell.fit_points.length - 1 - endIndex;
    for (let T = expWell.temperature[startIndex]; T < expWell.temperature[endIndex]; T += 0.5) {
      const point: Models.XYpoint = { x: T, y: TmModelFunc(T, expWell.tm_model_params) };
      data_model.push(point);
    }
    chart.data.datasets.push({
      data: data_model,
      label: `#${expWell.id} ${expWell.name || ""} (${expWell.tm_model_params.Tm.toFixed(1)}°C)`,
      yAxisID: "yAxis",
      backgroundColor: color,
      fill: false,
      tension: 0.4,
      borderWidth: 2,
      borderColor: color,
      pointRadius: 0,
      showLine: true,
    });
  }
}

export function GraphDataset(expWellItems: Models.ExperimentWell[], chart: Chart, showTmLine = false) {
  if (!chart?.data?.datasets) return;
  chart.data.datasets = [];

  for (let index = 0; index < expWellItems.length; index++) {
    if (expWellItems[index].temperature === null) continue;

    AddDataset(expWellItems[index], chart, color_pallete[index % color_pallete.length]);
  }
  if (chart.data.datasets.length === 0) chart.data.datasets = [];

  chart.update();
  if (showTmLine) {
    DrawTmLine(expWellItems, chart);
    chart.update();
  }
}

function DrawTmLine(expWells: Models.ExperimentWell[], chart: Chart) {
  const axis_start: number = (chart as any).scales["yAxis"].start;

  for (let index = 0; index < expWells.length; index++) {
    const expWell = expWells[index];

    if (!expWell.tm_model_params || !expWell.tm_model_params.Tm || !expWell.tm_model_params.Model) continue;

    let y_point: number = null;

    //Derivative model has no "model", so need to approximate Tm y point
    if (expWell.tm_model_params.Model === "derivative" || expWell.tm_model_params.Model === "derivative_sovgal") {
      //y_point = Math.max(...ActiveFluorescence(expWell))
      const Tm = expWell.tm_model_params.Tm;
      const x_point_i = expWell.temperature.findIndex((a) => a >= Tm);
      if (x_point_i !== 0) {
        const t2 = expWell.temperature[x_point_i];
        const t1 = expWell.temperature[x_point_i - 1];
        const dTm = t2 - t1;
        const k2 = (t2 - Tm) / dTm;
        const k1 = (Tm - t1) / dTm;
        y_point = ActiveFluorescence(expWell)[x_point_i] * k1 + ActiveFluorescence(expWell)[x_point_i - 1] * k2;
      } else expWell.temperature[x_point_i];

      //For all models that have a "model"
    } else {
      y_point = TmModelFunc(expWell.tm_model_params.Tm, expWell.tm_model_params);
    }

    const data_TmLine: Models.XYpoint[] = [
      { x: expWell.tm_model_params.Tm, y: axis_start },
      { x: expWell.tm_model_params.Tm + 0.001, y: y_point },
    ];
    chart.data.datasets.push({
      data: data_TmLine,
      label: "Tm line",
      yAxisID: "yAxis",
      pointRadius: 0,
      borderColor: color_pallete[index % color_pallete.length] + "33",
      showLine: true,
    });

    //AddDataset(expWells[index], chart, color_pallete[index % color_pallete.length], showTmLine)
  }
}

function GetActiveDisabledSets(expWell: Models.ExperimentWell) {
  const data_active: Models.XYpoint[] = [];
  const data_disabled: Models.XYpoint[] = [];

  for (let i = 0; i < expWell.temperature.length; i++) {
    const point = {
      x: expWell.temperature[i],
      y: ActiveFluorescence(expWell)[i],
    };
    if (expWell.fit_points[i]) {
      data_active.push(point);
    } else {
      data_disabled.push(point);
    }
  }

  return { data_active: data_active, data_disabled: data_disabled };
}

export function CalculateModelGraph(experimentWell: Models.ExperimentWell): Models.XYpoint[] {
  const data_model: Models.XYpoint[] = [];
  const startIndex = experimentWell.fit_points.findIndex((x) => x === true);
  let endIndex = experimentWell.fit_points
    .slice()
    .reverse()
    .findIndex((x) => x === true);
  if (startIndex === -1 && endIndex === -1) return [];
  endIndex = experimentWell.fit_points.length - endIndex;
  for (let T = experimentWell.temperature[startIndex]; T < experimentWell.temperature[endIndex]; T += 0.5) {
    const point: Models.XYpoint = { x: T, y: TmModelFunc(T, experimentWell.tm_model_params) };
    data_model.push(point);
  }
  return data_model;
}

export async function SelectnFitTm2(
  expWells: Models.ExperimentWell[],
  xrange: { xMin: number; xMax: number },
  event: MouseEvent
): Promise<number[]> {
  const xMin: number = xrange.xMin;
  const xMax: number = xrange.xMax;

  const failedFitIDs: number[] = [];

  // Selection - select just the interval
  if ((!event.ctrlKey && !event.shiftKey) || (event.ctrlKey && event.shiftKey)) {
    if (Math.round(xMin * 5) / 5 === Math.round(xMax * 5) / 5) return [-1];

    for (const expWell of expWells) {
      if (expWell.temperature == null) continue;

      const active_points: boolean[] = [];
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points.push(true);
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        } else active_points.push(false);
      }
      const params = await SendFitTmRequest(expWell, XYarray, failedFitIDs);
      if (params !== null) {
        expWell.fit_points = active_points;
        expWell.tm_model_params = params;
      }
    }
  }
  // Additive selection
  else if (event.ctrlKey && !event.shiftKey) {
    for (const expWell of expWells) {
      const active_points: boolean[] = expWell.fit_points;
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points[index] = true;
        }
        if (active_points[index]) {
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        }
      }
      const params = await SendFitTmRequest(expWell, XYarray, failedFitIDs);
      if (params !== null) {
        expWell.fit_points = active_points;
        expWell.tm_model_params = params;
      }
    }
  }
  // Deselection
  else if (!event.ctrlKey && event.shiftKey) {
    for (const expWell of expWells) {
      const active_points: boolean[] = expWell.fit_points;
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points[index] = false;
        }
        if (active_points[index]) {
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        }
      }
      const params = await SendFitTmRequest(expWell, XYarray, failedFitIDs);
      if (params !== null) {
        expWell.fit_points = active_points;
        expWell.tm_model_params = params;
      }
    }
  }

  return failedFitIDs;
}

export async function SelectnFitTm(
  expWells: Models.ExperimentWell[],
  xrange: { xMin: number; xMax: number },
  event: MouseEvent
): Promise<ThermottResponse & { FitData: { id: number; tm_params: TmModelParams; ok: boolean }[] }> {
  const xMin: number = xrange.xMin;
  const xMax: number = xrange.xMax;

  const activePointsList: { id: number; activePoints: boolean[] }[] = [];

  const request: { id: number; data: XYarray; tm_model: string }[] = [];

  // Selection - select just the interval
  if ((!event.ctrlKey && !event.shiftKey) || (event.ctrlKey && event.shiftKey)) {
    if (Math.round(xMin * 5) / 5 === Math.round(xMax * 5) / 5) return null;

    for (const expWell of expWells) {
      if (expWell.temperature == null) continue;

      const active_points: boolean[] = [];
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points.push(true);
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        } else active_points.push(false);
      }
      request.push({ id: expWell.id, data: XYarray, tm_model: expWell.tm_model_params.Model });
      activePointsList.push({ id: expWell.id, activePoints: active_points });
    }
  }
  // Additive selection
  else if (event.ctrlKey && !event.shiftKey) {
    for (const expWell of expWells) {
      const active_points: boolean[] = expWell.fit_points;
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points[index] = true;
        }
        if (active_points[index]) {
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        }
      }
      request.push({ id: expWell.id, data: XYarray, tm_model: expWell.tm_model_params.Model });
      activePointsList.push({ id: expWell.id, activePoints: active_points });
    }
  }
  // Deselection
  else if (!event.ctrlKey && event.shiftKey) {
    for (const expWell of expWells) {
      const active_points: boolean[] = expWell.fit_points;
      const XYarray: Models.XYarray = { x: [], y: [] };

      for (let index = 0; index < expWell.temperature.length; index++) {
        if (NumberIsBetween(expWell.temperature[index], xMin, xMax, true)) {
          active_points[index] = false;
        }
        if (active_points[index]) {
          XYarray.x.push(expWell.temperature[index]);
          XYarray.y.push(ActiveFluorescence(expWell)[index]);
        }
      }
      request.push({ id: expWell.id, data: XYarray, tm_model: expWell.tm_model_params.Model });
      activePointsList.push({ id: expWell.id, activePoints: active_points });
    }
  }

  const response = await FitTm(request);
  if (response.ok == false) return response;

  response.FitData.forEach((fit) => {
    const expWell = expWells.find((x) => x.id == fit.id);
    const activePoints = activePointsList.find((x) => x.id == fit.id);
    if (fit.ok) {
      if (expWell && activePoints) {
        expWell.tm_model_params = fit.tm_params;
        expWell.fit_points = activePoints.activePoints;
      }
    } else {
      expWell.tm_model_params = { Tm: null, Model: expWell.tm_model_params.Model };
    }
  });

  return response;
}

export async function SendFitTmRequest(
  expWell: Models.ExperimentWell,
  XYarray: Models.XYarray,
  failedFitIDs: number[]
): Promise<Models.TmModelParams> {
  if (XYarray.x.length === 0) {
    expWell.tm_model_params.Tm = null;
  }

  const request: TmFitDataRequest = { data: XYarray, tm_model: expWell.tm_model_params.Model };

  const postSettings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  //console.log(request)
  const res = await fetch("/api/FitTm", postSettings);
  if (res.status == 500) {
    failedFitIDs.push(expWell.id);
    return null;
  }
  const params: Promise<Models.TmModelParams> = await res.json();
  return params;
}

interface TmFitDataRequest {
  data: Models.XYarray;
  tm_model: string;
}
