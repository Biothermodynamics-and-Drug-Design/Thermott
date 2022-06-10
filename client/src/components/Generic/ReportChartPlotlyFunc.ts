import { BindingModelFunc, ActiveFluorescenceXYArray } from "@/utils/utils";
import { TmModelFunc } from "../../utils/tm_models";
import { getExperimentWellsFromBindingExperiment } from "../../utils/bindingexperiment_manager";
//import * as Plotly from "@/utils/plotly.js";
//import "@/utils/plotly.js";
import { Plotly } from "@/utils/plotly";
import { BindingExperiment, ExperimentWell, NumberRange } from "@/models";
import { formatKb } from "@/utils/utils";

const globalFontSize = 22;
const globalTickFontSize: number = globalFontSize + 2;
const spineWidth = 1.5;

export type KbFormat = "Kd" | "Kb" | "both";
export type ChartType = "Binding" | "Melting" | "Both" | "BothMany";

export class ReportChartOptions {
  ChartType: ChartType = "Both";
  FullReport = false;
  Kb_format: KbFormat = "both";
  RawDataXAxisBounds = { enabled: false, min: 0, max: 100 };
  BindingYAxisBounds = {
    enabled: false,
    min: 0,
    max: 100,
  };
  IsAxisBreak = true;
  Color = true;
  ColorGradientRawData = true;
  ColorGradientBinding = true;
  Title = true;
  ChartRatio = 1;
  BindingChartLegendLabel: "Name" | "ProteinLigand" = "ProteinLigand";
}

export function calculateYAxisBounds(bindingExperiments: BindingExperiment[]) {
  const Tms = bindingExperiments
    .map((x) => getExperimentWellsFromBindingExperiment(x))
    .flat()
    .map((x) => x.tm_model_params.Tm);
  return { min: Math.min(...Tms) - 1, max: Math.max(...Tms) + 3 };
}

export class ReportChartReturn {
  BindingYAxisRange: NumberRange;
}

const gradient_func = (conc: number, min: number, max: number, maxColor: [number, number, number], alpha = 0.5) => {
  const maxL10 = Math.log10(max);
  const minL10 = Math.log10(min) * 1.01;

  const gradient_color = (d: number, a1: [number, number, number], a2: [number, number, number]) => {
    // find a color d% between a1 and a2
    return a1.map((p, i) => Math.floor(a1[i] + d * (a2[i] - a1[i])));
  };

  maxColor = maxColor || [0, 78, 201];
  const minColor: [number, number, number] = [220, 220, 220];
  const ratio = (conc: number) => (conc !== 0 ? (Math.log10(conc) - minL10) / (maxL10 - minL10) : 0);

  const color = gradient_color(ratio(conc), minColor, maxColor);
  return `rgba(${color.join(",")}, ${alpha})`;
};

export function DrawBindingExperimentWithRawFluorescence(
  chart: HTMLElement,
  bindingExperiment: BindingExperiment,
  experimentWells_raw: ExperimentWell[],
  experimentWells_binding: ExperimentWell[],
  options: ReportChartOptions = new ReportChartOptions()
) {
  const activeLigandFraction = bindingExperiment.params.ActiveLigandFraction ?? 1;

  const experimentWellsPoints = experimentWells_binding.map((x) => ({
    id: x.id,
    name: x.name,
    protein: x.protein,
    protein_conc: x.protein_conc,
    ligand: x.ligand,
    ligand_conc: x.ligand_conc * activeLigandFraction,
    tm_model_params: x.tm_model_params,
  }));

  //const blanks: ExperimentWell[] = experimentWellsPoints.filter((x) => x.ligand_conc === 0);

  const ligand_conc: number[] = experimentWellsPoints.filter((x) => x.ligand_conc !== 0).map((x) => x.ligand_conc);

  const minLigandConc = Math.min(...ligand_conc);
  const maxLigandConc = Math.max(...ligand_conc);
  const gradientF = (conc: number, alpha: number) => gradient_func(conc, minLigandConc, maxLigandConc, [0, 78, 201], alpha);

  const minRange = Math.log10(Math.min(minLigandConc / 7, bindingExperiment.params.Pt / 20));

  const maxRange = Math.log10(Math.max(...ligand_conc) * 1.5);

  const traces: any[] = [];

  const model = calculateBindingModel(bindingExperiment, experimentWells_binding);

  const trace_bindingmodel = {
    x: model.x,
    y: model.y,
    mode: "lines",
    type: "scatter",
    name: "after",
    xaxis: "x2",
    yaxis: "y2",
    showlegend: false,
    line: { color: "black" },
  };

  const trace_bindingmodel2 = {
    x: model.x,
    y: model.y,
    mode: "lines",
    type: "scatter",
    name: "before",
    xaxis: "x3",
    yaxis: "y3",
    showlegend: false,
    line: { color: "black" },
  };

  traces.push(trace_bindingmodel, trace_bindingmodel2);

  const trace_bindingpoints = {
    x: experimentWellsPoints.map((x) => x.ligand_conc),
    y: experimentWellsPoints.map((x) => x.tm_model_params.Tm),
    mode: "markers",
    type: "scatter",
    xaxis: "x2",
    yaxis: "y2",
    showlegend: false,
    marker: {
      symbol: "diamond",
      //color: options.Color ? "rgb(17, 157, 255)" : "rgb(144, 144, 144)",
      color: experimentWellsPoints.map((x) => gradientF(x.ligand_conc, 0.95)),
      line: {
        color: "rgba(0,0,0,1)",
        width: 1,
      },
      size: 13,
    },
  };

  const trace_bindingpoints2 = {
    x: experimentWellsPoints.map((x) => x.ligand_conc),
    y: experimentWellsPoints.map((x) => x.tm_model_params.Tm),
    mode: "markers",
    type: "scatter",
    xaxis: "x3",
    yaxis: "y3",
    showlegend: false,
    marker: {
      symbol: "diamond",
      //color: options.Color ? "rgb(17, 157, 255)" : "rgb(144, 144, 144)",
      color: options.ColorGradientBinding
        ? experimentWellsPoints.map((x) => gradientF(x.ligand_conc, 0.95))
        : `rgb(${[0, 78, 201].join(",")})`,
      line: {
        color: "rgba(0,0,0,1)",
        width: 1,
      },
      size: 13,
    },
  };

  traces.push(trace_bindingpoints, trace_bindingpoints2);

  const tickvals_log: number[] = [10 ** -7, 10 ** -6, 10 ** -5, 10 ** -4, 10 ** -3];
  const ticktext_log = ["10<sup>-7</sup>", "10<sup>-6</sup>", "10<sup>-5</sup>", "10<sup>-4</sup>", "10<sup>-3</sup>"];

  experimentWells_raw.sort((a, b) => (a.ligand_conc > b.ligand_conc ? 1 : -1));
  for (let index = 0; index < experimentWells_raw.length; index++) {
    const expWell = experimentWells_raw[index];

    if (expWell.temperature == null || expWell.tm_model_params.Tm == null) continue;

    const raw_fluorescence_data = ActiveFluorescenceXYArray(
      expWell,
      false,
      options.RawDataXAxisBounds.enabled ? options.RawDataXAxisBounds : null
    );

    const trace_raw_fluorescence = {
      x: raw_fluorescence_data.x,
      y: raw_fluorescence_data.y,
      mode: "markers",
      type: "scatter",
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
      marker: {
        //color: options.ColorGradientRawData ? gradient_func(expWell.ligand_conc, 0.3) : (options.Color ? "rgba(31,119,180, 0.7)" : "#66666699"),
        color: options.ColorGradientRawData ? gradientF(expWell.ligand_conc * activeLigandFraction, 0.9) : `rgb(${[0, 78, 201].join(",")})`,
        line: {
          color: "rgba(0,0,0,0.4)",
          width: 0.6,
        },
        size: 9,
      },
    };
    traces.push(trace_raw_fluorescence);
    const model = calculateFluorescenceModel(expWell, options.RawDataXAxisBounds.enabled ? options.RawDataXAxisBounds : null);
    const trace_model_fluorescence = {
      x: model.x,
      y: model.y,
      mode: "line",
      type: "scatter",
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
      line: {
        //color: options.ColorGradientRawData ? gradient_func(expWell.ligand_conc) : "black",
        color: "rgba(0,0,0, 0.5)",
      },
    };

    traces.push(trace_model_fluorescence);
  }

  const layout = {
    showlegend: false,
    autosize: false,
    width: 1400,
    height: 500 * options.ChartRatio,
    font: {
      size: globalFontSize,
    },
    title: {
      text: options.Title
        ? `#${bindingExperiment.id} ${bindingExperiment.name}     ${formatKbPlotly(
          bindingExperiment.params.Kb,
          2,
          options.Kb_format
        )}<br>` +
        `Protein: ${bindingExperiment.protein}(${bindingExperiment.params.Pt * 10 ** 6}μM) |` +
        `Ligand: ${bindingExperiment.ligand}(${0}-${Math.max(...ligand_conc) * 10 ** 6}μM)`
        : null,
      font: { size: globalFontSize + 2 },
    },
    xaxis: {
      domain: [0, 0.45],
      range: options.RawDataXAxisBounds.enabled
        ? [options.RawDataXAxisBounds.min, options.RawDataXAxisBounds.max]
        : calculateTemperatureRange(experimentWells_binding),
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Temperature (°C)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
    },
    yaxis: {
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Fluorescence (a.u.)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
      nticks: 5,
    },
    yaxis2: {
      anchor: "x2",
      linecolor: "black",
      linewidth: spineWidth,
      range: options.BindingYAxisBounds.enabled ? [options.BindingYAxisBounds.min, options.BindingYAxisBounds.max] : null,
      tickmode: "auto",
      nticks: 5,
      mirror: false,
      side: "left",
      title: {
        text: "Melting temperature (°C)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
    },
    yaxis3: {
      anchor: "x3",
      range: options.BindingYAxisBounds.enabled ? [options.BindingYAxisBounds.min, options.BindingYAxisBounds.max] : null,
      tickfont: { color: "rgba(17, 157, 255,0.0)", size: globalTickFontSize },
      linecolor: "black",
      linewidth: spineWidth,
      mirror: false,
      side: "right",
      tickmode: "auto",
      nticks: 5,
    },
    xaxis2: {
      type: "linear",
      domain: [0.55, 0.59],
      range: [0, 10 ** minRange],
      ticks: "inside",
      tickmode: "array",
      tickvals: [0],
      ticktext: ["0"],
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      tickfont: { size: globalTickFontSize },
    },
    xaxis3: {
      type: "log",
      domain: [0.605, 1],
      range: [minRange, maxRange],
      ticks: "inside",
      tickmode: "array",
      tickvals: tickvals_log,
      ticktext: ticktext_log,
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Added ligand concentration (M)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
    },
  };

  if (!options.Title) {
    (layout as any).annotations = [
      {
        xref: "paper",
        yref: "paper",
        x: 0.56,
        xanchor: "left",
        y: 0.86,
        yanchor: "bottom",
        text: `${formatKbPlotly(bindingExperiment.params.Kb, 2, options.Kb_format)}`,
        showarrow: false,
      },
    ];
  }

  const config = {
    staticPlot: true,
    displayModeBar: false,
  };

  (Plotly as any).newPlot(chart, traces, layout, config);
}

export function drawAxisBreak(chart: HTMLElement, subplot_names: string[] = ["x2y2", "x3y3"]) {
  const x2y2_border_path_element = chart.querySelector(`.${subplot_names[0]} .xlines-above`) as SVGPathElement;
  let path = x2y2_border_path_element.getAttribute("d");
  //const original_path = x2y2_border_path_element.getAttribute("d");
  const path_split = path.split("M");
  const x_point = parseFloat(path_split[1].split("H")[1]);
  const bot_point = parseFloat(path_split[1].split(",")[1]);
  const top_point = parseFloat(path_split[2].split(",")[1]);
  const break_size = 5;
  path += `M${x_point - break_size},${bot_point + break_size} L${x_point + break_size}, ${bot_point - break_size}`;
  path += `M${x_point - break_size},${top_point + break_size} L${x_point + break_size}, ${top_point - break_size}`;
  x2y2_border_path_element.setAttribute("d", path);

  const x3y3_border_path_element = chart.querySelector(`.${subplot_names[1]} .xlines-above`) as SVGPathElement;

  //const original_path2 = x3y3_border_path_element.getAttribute("d");
  let path2 = x3y3_border_path_element.getAttribute("d");

  const path_split2 = path2.split("M");

  const x_point2 = parseFloat(path_split2[1].split(",")[0]);

  path2 += `M${x_point2 - break_size},${bot_point + break_size} L${x_point2 + break_size}, ${bot_point - break_size}`;
  path2 += `M${x_point2 - break_size},${top_point + break_size} L${x_point2 + break_size}, ${top_point - break_size}`;
  x3y3_border_path_element.setAttribute("d", path2);
}

//export function DrawBindingExperiments(chart: HTMLElement, bindingExperiments: BindingExperiment[], color: boolean = true, colorBindingModel: boolean = true, Kb_format = "Kd") {
export function DrawBindingExperiments(chart: HTMLElement, bindingExperiments: BindingExperiment[], options = new ReportChartOptions()) {
  const traces: any[] = [];

  let minRange = null;
  let maxRange = null;

  const getColor = (index: number) =>
    options.Color ? color_pallete[index % color_pallete.length] + "A8" : `#${["666666", "333333"][index % 2]}`;
  const getMarker = (index: number) => (options.Color ? index : index % 2 === 0 ? index + 100 : index);

  for (let index = 0; index < bindingExperiments.length; index++) {
    const bindingExperiment = bindingExperiments[index];
    const experimentWells: ExperimentWell[] = getExperimentWellsFromBindingExperiment(bindingExperiment);

    const activeLigandFraction = bindingExperiment.params.ActiveLigandFraction ?? 1;

    const experimentWellsPoints = experimentWells.map((x) => ({
      id: x.id,
      name: x.name,
      protein: x.protein,
      protein_conc: x.protein_conc,
      ligand: x.ligand,
      ligand_conc: x.ligand_conc * activeLigandFraction,
      tm_model_params: x.tm_model_params,
    }));

    const ligand_conc: number[] = experimentWells.filter((x) => x.ligand_conc !== 0).map((x) => x.ligand_conc * activeLigandFraction);

    minRange = minRange === null ? Math.log10(Math.min(...ligand_conc) / 5) : minRange;
    maxRange = maxRange === null ? Math.log10(Math.max(...ligand_conc) * 1.5) : maxRange;
    minRange = Math.log10(Math.min(...ligand_conc) / 5) < minRange ? Math.log10(Math.min(...ligand_conc) / 5) : minRange;
    maxRange = Math.log10(Math.max(...ligand_conc) * 1.5) > maxRange ? Math.log10(Math.max(...ligand_conc) * 1.5) : maxRange;

    const model = calculateBindingModel(bindingExperiment, experimentWells);

    const color = getColor(index);
    const gradientF = (conc: number) => gradient_func(conc, Math.min(...ligand_conc), Math.max(...ligand_conc), hexToRgb(color), 0.9);

    const trace_bindingmodel = {
      x: model.x,
      y: model.y,
      mode: "lines",
      type: "scatter",
      legendgroup: `binding_model_${bindingExperiment.id}`,
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
      line: { color: color, width: 3 },
    };

    const trace_bindingmodel2 = {
      x: model.x,
      y: model.y,
      mode: "lines",
      type: "scatter",
      legendgroup: `binding_model_${bindingExperiment.id}`,
      showlegend: false,
      xaxis: "x2",
      yaxis: "y2",
      line: { color: color, width: 3 },
    };

    traces.push(trace_bindingmodel, trace_bindingmodel2);

    console.log(
      experimentWellsPoints.map((x) => x.ligand_conc),
      experimentWellsPoints.map((x) => x.tm_model_params.Tm)
    );

    const trace_bindingpoints = {
      x: experimentWellsPoints.map((x) => x.ligand_conc),
      y: experimentWellsPoints.map((x) => x.tm_model_params.Tm),
      mode: "markers",
      type: "scatter",
      showlegend: false,
      legendgroup: `binding_model_${bindingExperiment.id}`,
      xaxis: "x1",
      yaxis: "y1",
      marker: {
        symbol: getMarker(index),
        color: options.ColorGradientBinding ? experimentWellsPoints.map((x) => gradientF(x.ligand_conc * activeLigandFraction)) : color,
        size: 13,
        line: {
          color: "rgba(0,0,0,1)",
          width: 1,
        },
      },
    };

    let legendLabel = "";

    if (options.BindingChartLegendLabel == "ProteinLigand") {
      legendLabel = `#${bindingExperiment.id} ${formatKbPlotly(bindingExperiment.params.Kb, 2, options.Kb_format)}${bindingExperiments.length > 7 ? " | " : "<br>"
        }${bindingExperiment.protein}:${bindingExperiment.ligand}`
    } else {
      legendLabel = `#${bindingExperiment.id} ${formatKbPlotly(bindingExperiment.params.Kb, 2, options.Kb_format)}${bindingExperiments.length > 7 ? " | " : "<br>"
        }${bindingExperiment.name}`
    }

    const trace_bindingpoints2 = {
      x: experimentWellsPoints.map((x) => x.ligand_conc),
      y: experimentWellsPoints.map((x) => x.tm_model_params.Tm),
      mode: "markers",
      type: "scatter",
      legendgroup: `binding_model_${bindingExperiment.id}`,
      name: legendLabel,
      xaxis: "x2",
      yaxis: "y2",
      marker: {
        symbol: getMarker(index),
        color: options.ColorGradientBinding ? experimentWellsPoints.map((x) => gradientF(x.ligand_conc)) : color,
        size: 13,
        line: {
          color: "rgba(0,0,0,1)",
          width: 1,
        },
      },
    };

    traces.push(trace_bindingpoints, trace_bindingpoints2);
  }

  const tickvals_log: number[] = [10 ** -7, 10 ** -6, 10 ** -5, 10 ** -4];
  // let ticktext_log = tickvals_log.map((x) =>
  //     (x * 10 ** 6).toFixed(x * 10 ** 6 >= 1 ? 0 : 1)
  // );
  // ticktext_log = ticktext_log.map((x) => x + " μM");
  //const tickvals_log: number[] = [10 ** -7, 10 ** -6, 10 ** -5, 10 ** -4, 10 ** -3];
  const ticktext_log = ["10<sup>-7</sup>", "10<sup>-6</sup>", "10<sup>-5</sup>", "10<sup>-4</sup>", "10<sup>-3</sup>"];
  //const ticktext_log = tickvals_log.map(x => Math.log10(x));

  const layout = {
    showlegend: true,
    autosize: false,
    hovermode: false,
    width: 600 + calculateTraceNameMax(traces) * 10,
    height: 500 * options.ChartRatio,
    // title: {
    //     text: ``,
    // },
    margin: { r: 10 },
    font: {
      size: globalFontSize,
    },
    legend: {
      tracegroupgap: bindingExperiments.length > 5 ? 0 : 10,
      font: {
        //size: (bindingExperiments.length > 7) ? globalFontSize -5 : globalFontSize,
      },
      itemdoubleclick: false,
      itemclick: false,
    },

    yaxis: {
      anchor: "x1",
      linecolor: "black",
      linewidth: spineWidth,
      range: options.BindingYAxisBounds.enabled ? [options.BindingYAxisBounds.min, options.BindingYAxisBounds.max] : "auto",
      mirror: false,
      nticks: 5,
      side: "left",
      title: {
        text: "Melting temperature (°C)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
      fixedrange: true,
    },
    yaxis2: {
      anchor: "x2",
      tickfont: { color: "rgba(17, 157, 255,0.0)" },
      range: options.BindingYAxisBounds.enabled ? [options.BindingYAxisBounds.min, options.BindingYAxisBounds.max] : "auto",
      linecolor: "black",
      tickmode: "auto",
      nticks: 5,
      linewidth: spineWidth,
      mirror: false,
      side: "right",
      fixedrange: true,
    },
    xaxis: {
      type: "linear",
      domain: [0.0, 0.05],
      range: [0, 10 ** minRange],
      ticks: "inside",
      tickmode: "array",
      tickvals: [0],
      ticktext: ["0"],
      linecolor: "black",
      linewidth: 1,
      mirror: true,
      tickfont: { size: globalTickFontSize },
      fixedrange: true,
    },
    xaxis2: {
      type: "log",
      domain: [0.075, 1],
      range: [minRange, maxRange],
      ticks: "inside",
      tickmode: "array",
      tickvals: tickvals_log,
      ticktext: ticktext_log,
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Added ligand concentration (M)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
      fixedrange: true,
    },
  };

  const config = {
    staticPlot: true,
    displayModeBar: false,
  };

  //let chart = this.$refs.chart as HTMLDivElement;

  (Plotly as any).newPlot(chart, traces, layout, config);
  drawAxisBreak(chart, ["xy", "x2y2"]);
}

export function DrawExperimentWells(chart: HTMLElement, experimentWells: ExperimentWell[], options = new ReportChartOptions()) {
  experimentWells.sort((a, b) => (a.id > b.id ? 1 : -1));
  const tm_list: number[] = experimentWells.map((x) => x.tm_model_params.Tm);

  const gradient_func = (tm: number, type = "marker", alpha = 0.5, grayscale_coef = 0.6) => {
    if (tm_list.length === 1) {
      if (type === "marker") return options.Color ? `rgba(0,0,255, 0.5)` : `rgba(0,0,0, 0.5)`;
      else return options.Color ? `rgba(0,0,0, 0.6)` : `rgba(0,0,0, 0.8)`;
    }

    const max = Math.min(...tm_list);
    const min = Math.max(...tm_list);

    const calc = (tm: number) => (tm - min) / (max - min);
    const _color = options.Color
      ? `rgba(${(1 - calc(tm)) * 255}, 0, ${calc(tm) * 255}, ${alpha})`
      : `rgba(${(1 - calc(tm)) * 255 * grayscale_coef}, ${(1 - calc(tm)) * 255 * grayscale_coef}, ${(1 - calc(tm)) * 255 * grayscale_coef
      }, 0.5)`;
    return _color;
  };
  const traces: any[] = [];

  const getColor = (index: number) => color_pallete[index % color_pallete.length];

  for (let index = 0; index < experimentWells.length; index++) {
    const expWell = experimentWells[index];
    if (expWell.temperature == null) continue;

    const model = calculateFluorescenceModel(expWell, options.RawDataXAxisBounds.enabled ? options.RawDataXAxisBounds : null);
    const trace_model_fluorescence = {
      x: model.x,
      y: model.y,
      mode: "line",
      type: "scatter",
      xaxis: "x1",
      yaxis: "y1",
      showlegend: false,
      legendgroup: `expWell_${expWell.id}`,
      line: {
        //color: gradient_func(expWell.tm_model_params.Tm, "line"),
        color: options.ColorGradientRawData ? gradient_func(expWell.tm_model_params.Tm, "line") : "black",
      },
    };
    traces.push(trace_model_fluorescence);

    const raw_fluorescence_data = ActiveFluorescenceXYArray(
      expWell,
      false,
      options.RawDataXAxisBounds.enabled ? options.RawDataXAxisBounds : null
    );

    const trace_raw_fluorescence = {
      x: raw_fluorescence_data.x,
      y: raw_fluorescence_data.y,
      mode: "markers",
      type: "scatter",
      xaxis: "x1",
      yaxis: "y1",
      name: `#${expWell.id} ${expWell.name || ""} (${expWell.tm_model_params.Tm}°C)`,
      legendgroup: `expWell_${expWell.id}`,
      marker: {
        //color: gradient_func(expWell.tm_model_params.Tm, "marker", 0.3),
        color: options.ColorGradientRawData ? gradient_func(expWell.tm_model_params.Tm, "marker", 0.3) : getColor(index) + "CC",
        size: 9,
      },
    };
    traces.push(trace_raw_fluorescence);
  }

  const layout = {
    showlegend: true,
    legend: {
      tracegroupgap: experimentWells.length > 5 ? 0 : 10,
      itemsizing: "constant",
    },
    autosize: false,
    width: 700 + calculateTraceNameMax(traces) * 9,
    height: 500 * options.ChartRatio,
    font: {
      size: globalFontSize,
    },
    title: {
      text: "",
    },
    xaxis: {
      domain: [0, 1],
      linecolor: "black",
      range: options.RawDataXAxisBounds.enabled
        ? [options.RawDataXAxisBounds.min, options.RawDataXAxisBounds.max]
        : calculateTemperatureRange(experimentWells),
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Temperature (°C)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
    },
    yaxis: {
      linecolor: "black",
      linewidth: spineWidth,
      mirror: true,
      title: {
        text: "Fluorescence (a.u.)",
        font: { size: globalTickFontSize * 0.95 },
      },
      tickfont: { size: globalTickFontSize },
    },
  };

  const config = {
    staticPlot: true,
    displayModeBar: false,
  };

  //let chart = this.$refs.chart as HTMLDivElement;
  (Plotly as any).newPlot(chart, traces, layout, config);
}

function calculateFluorescenceModel(expWell: ExperimentWell, tempRange: NumberRange = null) {
  const data_model: XYarray = { x: [], y: [] };
  const startIndex = expWell.fit_points.findIndex((x) => x === true);
  let endIndex = expWell.fit_points
    .slice()
    .reverse()
    .findIndex((x) => x === true);
  if (startIndex === -1 && endIndex === -1) return;
  endIndex = expWell.fit_points.length - endIndex;
  for (let T = expWell.temperature[startIndex]; T < expWell.temperature[endIndex]; T += 0.5) {
    if (tempRange && (T < tempRange.min || T > tempRange.max)) continue;

    data_model.x.push(T);
    data_model.y.push(TmModelFunc(T, expWell.tm_model_params));
  }
  return data_model;
}

function calculateBindingModel(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]): XYarray {
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

    const filteredTms = filteredExpWells.map((x) => x.tm_model_params.Tm);
    const maxTm = Math.max(...filteredTms);
    //const minTm = Math.min(...filteredTms);

    const maxConc = Math.max(...filteredExpWells.map((x) => x.ligand_conc));

    //const dTm = 0.05;
    let dTm = 0.001;
    const model: XYarray = { x: [0], y: [control_Tm + dTm] };
    for (let T = control_Tm + 0.05; T < maxTm + 5; T += dTm) {
      const C = BindingModelFunc(T, bindingExperiment.params);
      if (C > 3 * maxConc) break;
      model.x.push(C);
      model.y.push(T);
      dTm = model.x[model.x.length - 1] - model.x[model.x.length - 2] < 0.05 ? 0.005 : 0.1;
    }

    return model;
  }
}

const htmlreplace = ["<sub>", "</sub>", "<sup>", "</sup>"];
function calculateTraceNameMax(traces: any[]) {
  let max = 0;
  traces.forEach((trace) => {
    if (trace.name) {
      let text = trace.name as string;
      htmlreplace.forEach((tag) => {
        text = text.replaceAll(tag, "");
      });
      const length = Math.max(...text.split("<br>").map((x) => x.length));
      max = length > max ? length : max;
    }
  });
  return max;
}

// export function formatKb(value: number, precision = 3, format = "Kd"): string {
//     if (format === "Kd") {
//         let log = -Math.log10(1 / value);
//         log = Math.ceil(log);
//         switch (true) {
//             case (value === 0 || value === null): return "0";
//             case (log >= 11): return (`${(1 / value * 10 ** 12).toPrecision(precision)} pM`);
//             case (log >= 8): return (`${(1 / value * 10 ** 9).toPrecision(precision)} nM`);
//             case (log >= 5): return (`${(1 / value * 10 ** 6).toPrecision(precision)} μM`);
//             case (log >= 3): return (`${(1 / value * 10 ** 3).toPrecision(precision)} mM`);

//             default: return (`${(1 / value * 10 ** 3).toPrecision(precision)} M`);
//         }
//     } else {
//         const split_string = value.toExponential(precision - 1).split("e");//[1.53, +7]
//         return `${split_string[0]}·10<sup>${split_string[1].substring(1)}</sup> M<sup>-1</sup>`;
//     }

// }

export function formatKbPlotly(value: number, precision = 3, format = "Kd") {
  if (value === null) {
    return "";
  }

  if (format === "Kd") return "<i>K</i><sub>d</sub> " + formatKb(value, precision, format);
  else if (format === "Kb") return "<i>K</i><sub>b</sub> " + formatKb(value, precision, format);
  else if (format === "both")
    return "<i>K</i><sub>d</sub> " + formatKb(value, precision, "Kd") + " | " + "<i>K</i><sub>b</sub> " + formatKb(value, precision, "Kb");
}

export function calculateTemperatureRange(experimentWells: ExperimentWell[]): [number, number] {
  const minT: number[] = [];
  const maxT: number[] = [];
  for (let index = 0; index < experimentWells.length; index++) {
    const experimentWell = experimentWells[index];

    if (experimentWell.temperature && experimentWell.temperature.length > 0) {
      minT.push(Math.min(...experimentWell.temperature));
      maxT.push(Math.max(...experimentWell.temperature));
    }
  }
  return [Math.min(...minT) || 20, Math.max(...maxT) || 100];
}

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

const hexToRgb = (hex: string) =>
  hex
    .replace(/^#?([a-f\d])([a-f\d])([a-f\d])$/i, (m, r, g, b) => "#" + r + r + g + g + b + b)
    .substring(1)
    .match(/.{2}/g)
    .map((x) => parseInt(x, 16)) as [number, number, number];

interface XYarray {
  x: number[];
  y: number[];
}
