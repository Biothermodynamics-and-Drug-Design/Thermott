import { BindingExperiment, BindingModelParams, ExperimentWell, XYpoint } from "@/models";
import type { Chart } from "chart.js";
import { BindingModelFunc, getExperimentWell } from "../../utils/utils";
import { unparse } from "papaparse";

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

function average(array: number[]) {
  return array.reduce((a, b) => a + b) / array.length;
}

export function DrawDatasets(
  bindingExperiments: BindingExperiment[],
  experimentWells: ExperimentWell[],
  chart: Chart,
  showConfInterval = true
) {
  if (!chart.data) return;
  chart.data.datasets = [];

  //const avgPt = average(bindingExperiments.map(x => x.params.Pt));
  const minPt = Math.min(...bindingExperiments.map((x) => x.params.Pt));
  for (let index = 0; index < bindingExperiments.length; index++) {
    DrawDataset(bindingExperiments[index], experimentWells, chart, color_pallete[index % color_pallete.length], minPt, showConfInterval);
  }

  chart.data.datasets.push({
    data: [],
    label: "model",
    yAxisID: "yAxis",
    xAxisID: "xAxis",
    borderColor: "#4B4B4B4B",
    showLine: true,
    fill: false,
    pointRadius: 0,
    pointHitRadius: 0,
  });
  chart.update();
}

export function DrawDataset(
  bindingExperiment: BindingExperiment,
  experimentWells: ExperimentWell[],
  chart: Chart,
  color: string,
  minPt: number,
  shadeConfidence = false
): void {
  const activeLigandFraction = bindingExperiment.params.ActiveLigandFraction ?? 1;

  const filteredExpWells = experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
  //Check if control samples exists
  let control_Tms = filteredExpWells.filter((x) => x.ligand_conc === 0).map((x) => x.tm_model_params.Tm);
  if (control_Tms.length == 0) {
    const sorted_ligand = filteredExpWells
      .map((x) => ({ Tm: x.tm_model_params.Tm, ligand_conc: x.ligand_conc }))
      .sort((a, b) => a.ligand_conc - b.ligand_conc);
    control_Tms = [sorted_ligand[0].Tm];
  }

  if (control_Tms.length !== 0 && bindingExperiment.params.Kb) {
    const control_Tm = average(control_Tms);

    bindingExperiment.params.Tr = control_Tm;

    const Tms = filteredExpWells.map((x) => x.tm_model_params.Tm);
    const maxTm = Math.max(...Tms);
    const minTm = Math.min(...Tms);

    const concs = filteredExpWells.map((x) => x.ligand_conc * activeLigandFraction);
    const maxConc = Math.max(...concs);
    //const minConc = Math.min(...concs);

    const dTm = maxTm - minTm < 2 ? 0.01 : 0.02;

    //const Pt = bindingExperiment.params.Pt;
    //{x: 0, y: control_Tm}
    const dataset_model_full: XYpoint[] = [];
    for (let T = control_Tm + 0.01; T < maxTm + 5; T += dTm) {
      const C = BindingModelFunc(T, bindingExperiment.params);
      if (C > 3 * maxConc) break;
      const point = {
        x: C, // Added ligand conc., C
        y: T, // Melting temperature, T
      };
      dataset_model_full.push(point);
    }

    let dataset_model = dataset_model_full.filter((p) => p.x >= minPt * axisBounds.start);
    if (dataset_model.length > 0) {
      dataset_model = [{ x: minPt * axisBounds.start, y: dataset_model[0].y }, ...dataset_model];
    }

    chart.data.datasets.push({
      data: dataset_model.map((p) => ({ x: Math.log10(p.x), y: p.y })),
      label: "_model",
      yAxisID: "yAxis",
      xAxisID: "xAxis",
      borderColor: color,
      showLine: true,
      fill: false,
      pointRadius: 0,
      pointHitRadius: 0,
    });

    const controlModel = [{ x: 0, y: control_Tm }, ...dataset_model_full.filter((p) => p.x <= minPt * axisBounds.end)];
    if (dataset_model_full.length > 0) {
      const lastPoint = Object.assign({}, controlModel.slice(-1)[0]);
      lastPoint.x = minPt * axisBounds.end;
      controlModel.push(lastPoint);
    }

    chart.data.datasets.push({
      data: controlModel,
      label: "_modelControl",
      yAxisID: "yAxis",
      xAxisID: "xAxisControl",
      borderColor: color,
      showLine: true,
      fill: false,
      pointRadius: 0,
      pointHitRadius: 0,
    });

    const maxModelTm = Math.max(...dataset_model.map((x) => x.y));

    if (shadeConfidence && bindingExperiment.params.Kb_confidence_interval) {
      const dataset_shade1 = [{ x: 0, y: control_Tm + dTm / 10 }];
      for (let T = control_Tm + 0.05; T <= maxModelTm; T += dTm / 2) {
        const C = BindingModelFuncShade(T, bindingExperiment.params, false);
        if (C > 3 * maxConc) break;
        const point = {
          x: C, // Added ligand conc., C
          y: T, // Melting temperature, T
        };
        dataset_shade1.push(point);
      }
      dataset_shade1.push(dataset_model_full[dataset_model_full.length - 1]);

      chart.data.datasets.push({
        data: dataset_shade1.map((p) => ({ x: Math.log10(p.x), y: p.y })),
        label: "_confShade",
        yAxisID: "yAxis",
        xAxisID: "xAxis",
        // borderColor: color + "00",
        backgroundColor: color + "50",
        fill: "+1",
        pointRadius: 0,
        pointHitRadius: 0,
      });

      const dataset_shade2 = [{ x: 0, y: control_Tm + dTm }];
      for (let T = control_Tm + 0.05; T <= maxModelTm; T += dTm / 2) {
        const C = BindingModelFuncShade(T, bindingExperiment.params, true);
        if (C > 3 * maxConc) break;
        const point = {
          x: C, // Added ligand conc., C
          y: T, // Melting temperature, T
        };
        dataset_shade2.push(point);
      }
      dataset_shade2.push(dataset_model_full[dataset_model_full.length - 1]);

      chart.data.datasets.push({
        data: dataset_shade2.map((p) => ({ x: Math.log10(p.x), y: p.y })),
        label: "_confShade",
        yAxisID: "yAxis",
        xAxisID: "xAxis",
        showLine: true,
        fill: false,
        pointRadius: 0,
        pointHitRadius: 0,
      });
    }
  }
  //const withLigandPoints = filteredExpWells.filter(x => x.ligand_conc != 0);

  const dataset_test: { x: number; y: number; id: number; name: string; bindingExperimentId: number }[] = [];
  filteredExpWells.forEach((expWell) => {
    //filteredExpWells.forEach(expWell => {
    if (expWell.ligand_conc != null && expWell.tm_model_params.Tm != null) {
      const point = {
        x: expWell.ligand_conc * activeLigandFraction,
        y: expWell.tm_model_params.Tm,
        i_id: expWell.i_id,
        id: expWell.id,
        bindingExperimentId: bindingExperiment.id,
        name: expWell.name,
      };
      dataset_test.push(point);
    }
  });
  chart.data.datasets.push({
    data: dataset_test
      .filter((p) => p.x !== 0)
      .map((p) => ({ x: Math.log10(p.x), y: p.y, id: p.id, name: p.name, bindingExperimentId: p.bindingExperimentId })),
    label: `(${bindingExperiment.id}) ${bindingExperiment.name}`,
    backgroundColor: color + "8A",
    radius: 6,
    yAxisID: "yAxis",
    xAxisID: "xAxis",
  });

  chart.data.datasets.push({
    data: dataset_test
      .filter((p) => p.x === 0)
      .map((p) => ({ x: p.x, y: p.y, id: p.id, name: p.name, bindingExperimentId: p.bindingExperimentId })),
    label: `_controlTest`,
    backgroundColor: color + "8A",
    radius: 6,
    yAxisID: "yAxis",
    xAxisID: "xAxisControl",
  });

  // chart.data.datasets.push({
  //     data: [{ x: 0, y: control_Tm }],
  //     label: `_(${bindingExperiment.id}) ${bindingExperiment.name}`,
  //     backgroundColor: color + "8A",
  //     radius: 6,
  //     yAxisID: "yAxis",
  //     xAxisID: "xAxisControl",
  // });
  chart.update();
}

function BindingModelFuncShade(T: number, params: BindingModelParams, end: boolean) {
  const paramCopy = Object.assign({}, params);
  if (end) paramCopy.Kb = paramCopy.Kb_confidence_interval[0];
  else paramCopy.Kb = paramCopy.Kb_confidence_interval[1];
  return BindingModelFunc(T, paramCopy);
}

export function calculateBindingModel(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]): XYpoint[] {
  const filteredExpWells = experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));

  //Check if control samples exists
  const control_Tms = filteredExpWells.filter((x) => x.ligand_conc === 0).map((x) => x.tm_model_params.Tm);
  if (!control_Tms) {
    return;
  }

  if (control_Tms.length != 0) {
    const average = (array: any[]) => array.reduce((a, b) => a + b) / array.length;
    const control_Tm = average(control_Tms);
    bindingExperiment.params.Tr = control_Tm;

    const proteinConc = bindingExperiment.params.Pt;

    const activeLigandFraction = bindingExperiment.params.ActiveLigandFraction ?? 1;

    const concs = filteredExpWells.map((x) => x.ligand_conc * activeLigandFraction);
    const maxConc = Math.max(...concs);
    const dTm = 0.1;
    //const model: XYpoint[] = [{ x: 0, y: control_Tm + dTm }];
    const model: XYpoint[] = [];
    let C = 0;
    const Climit = Math.max(8 * maxConc, 40 * proteinConc);

    //for (let T = control_Tm; T < maxTm+100; T += dTm) {
    //for (let T = control_Tm; T < 1; T += dTm) {
    for (let T = control_Tm; C < Climit && T < 100; T += dTm) {
      //const C = BindingModelFunc(T, bindingExperiment.params);
      C = BindingModelFunc(T, bindingExperiment.params);
      //if (C > 3 * maxConc) break;
      const point = {
        x: C, // Added ligand conc., C
        y: T, // Melting temperature, T
      };
      model.push(point);
    }

    return model;
  }
}

export function GenerateGraphDataCSV(bindingExperiments: BindingExperiment[], experimentWells: ExperimentWell[], sep: string): string {
  let text = "";

  let maxLength = 0;
  // bindingExperiments.forEach((bindingExperiment: BindingExperiment) => {
  //     const model = calculateBindingModel(bindingExperiment, experimentWells);
  //     const length = Math.max(...[bindingExperiment.expPointIndexes.length, model.length]);
  //     if (length > maxLength) maxLength = length;
  //     const name = `${bindingExperiment.name} (${bindingExperiment.protein}${bindingExperiment.ligand})`
  //     text += `\"${name} (exp. C)\"${sep}\"${name} (exp. Tm)\"`;
  //     text += sep;
  //     text += `\"${name} (model C)\"${sep}\"${name} (model Tm)\"`;
  //     //text += expWell.name + " (fit T)" + sep + expWell.name + " (fit F)" + sep;
  // });
  const bindingExperimentModels: XYpoint[][] = [];
  const columns: { bindingExperiment: string[]; type: string[] } = {
    bindingExperiment: [],
    type: [],
  };

  bindingExperiments.forEach((bindingExperiment: BindingExperiment) => {
    const model = calculateBindingModel(bindingExperiment, experimentWells);
    bindingExperimentModels.push(model);
    const length = Math.max(...[bindingExperiment.expPointIndexes.length, model.length]);
    if (length > maxLength) maxLength = length;
    const name = `${bindingExperiment.name} (${bindingExperiment.protein}${bindingExperiment.ligand})`;
    //text += `"${name}"`
    columns.bindingExperiment.push(...[name, "", "", ""]);
    columns.type.push(...["exp. C", "exp. Tm", "model C", "model Tm"]);
  });

  // console.log([columns.bindingExperiment, columns.type]);

  text = unparse({ fields: columns.bindingExperiment, data: columns.type }, { delimiter: sep });
  text += "\n";

  for (let index = 0; index < maxLength; index++) {
    bindingExperiments.forEach((bindingExperiment: BindingExperiment) => {
      const model = calculateBindingModel(bindingExperiment, experimentWells);
      if (bindingExperiment.expPointIndexes[index]) {
        const expWell = getExperimentWell(bindingExperiment.expPointIndexes[index], experimentWells);
        text += expWell.ligand_conc + sep + expWell.tm_model_params.Tm + sep;
      } else text += "" + sep + "" + sep;

      if (model[index]) text += model[index].x + sep + model[index].y + sep;
      else text += "" + sep + "" + sep;
    });
    text += "\n";
  }
  return text;
}

export const axisBounds = { end: 1 / 20, start: 1 / 25, min: 1 / 40 };

export const afterDrawPlugin = {
  id: "afterDrawBinding",
  //afterDatasetsDraw: function (chart: Chart, args: any, options: any) {
  afterDatasetsDraw: function (chart: Chart) {
    if (chart && chart.data.datasets.length === 0) {
      const chartArea = chart.chartArea;
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = "gray";
      ctx.font = "30px Arial";
      ctx.textAlign = "center";
      ctx.fillText("No binding experiment selected", chartArea.left + chartArea.width / 2, chartArea.top + chartArea.height / 2);
      ctx.restore();
    } else {
      const ctx = chart.ctx;
      const chartArea = chart.chartArea;
      const Pt = chart.options.plugins.axisBreak;
      ctx.save();
      ctx.fillStyle = "white";

      const xAxis = chart.scales.xAxis;
      //const x_axis = (Math.log(Pt * axisBounds.start) - Math.log(xAxis.min)) / (Math.log(xAxis.max) - Math.log(xAxis.min));
      const x_axis = (Math.log10(Pt * axisBounds.start) - xAxis.min) / (xAxis.max - xAxis.min);
      const width_axis = (Math.log10(Pt * axisBounds.end) - Math.log10(Pt * axisBounds.start)) / (xAxis.max - xAxis.min);

      ctx.fillRect(chartArea.left + chartArea.width * x_axis, chartArea.top - 5, width_axis * chartArea.width, chartArea.height + 10);
      ctx.strokeStyle = "#dedede";
      const breakTickSize = 3;
      ctx.beginPath();
      ctx.moveTo(chartArea.left + chartArea.width * x_axis - breakTickSize, chartArea.bottom + breakTickSize);
      ctx.lineTo(chartArea.left + chartArea.width * x_axis + breakTickSize, chartArea.bottom - breakTickSize);
      ctx.stroke();
      ctx.moveTo(
        chartArea.left + chartArea.width * x_axis + width_axis * chartArea.width - breakTickSize,
        chartArea.bottom + breakTickSize
      );
      ctx.lineTo(
        chartArea.left + chartArea.width * x_axis + width_axis * chartArea.width + breakTickSize,
        chartArea.bottom - breakTickSize
      );
      ctx.stroke();

      ctx.moveTo(chartArea.left + chartArea.width * x_axis - breakTickSize, chartArea.top + breakTickSize);
      ctx.lineTo(chartArea.left + chartArea.width * x_axis + breakTickSize, chartArea.top - breakTickSize);
      ctx.stroke();
      ctx.moveTo(chartArea.left + chartArea.width * x_axis + width_axis * chartArea.width - breakTickSize, chartArea.top + breakTickSize);
      ctx.lineTo(chartArea.left + chartArea.width * x_axis + width_axis * chartArea.width + breakTickSize, chartArea.top - breakTickSize);
      ctx.stroke();

      ctx.restore();
    }
  },
};

export const filterAxisBreakPlugin = {
  id: "filterAxisBreakPlugin",
  //beforeDatasetsDraw(chart: Chart, args: any, options: any) {
  beforeDatasetsDraw(chart: Chart) {
    const datasets = chart.data.datasets.filter((x) => !x.label.includes("_"));
    for (let index = 0; index < datasets.length; index++) {
      const dataset = datasets[index];
      if ((dataset as any).xAxisID === "xAxis") {
        dataset.data = (dataset.data as XYpoint[]).filter((p) => p.x >= 5 * 10 ** -6 * axisBounds.min);
      } else {
        dataset.data = (dataset.data as XYpoint[]).filter((p) => p.x <= 5 * 10 ** -6 * axisBounds.end);
      }
    }
  },
};

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    axisBreak: number;
  }
}
