/* eslint-disable */
import { Plugin, ChartType, Chart, Scale, UpdateMode, ScaleTypeRegistry } from "chart.js";

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    rangeSelect: RangeSelectOptions;
  }
}

interface RangeSelectOptions {
  onSelectionChanged?: (filteredDataSets: any) => void;
  fillColor?: string | CanvasGradient | CanvasPattern;
  cursorColor?: string | CanvasGradient | CanvasPattern;
  cursorWidth?: number;
  state?: RangeSelectState;
}

interface RangeSelectState {
  canvas: HTMLCanvasElement;
}

interface ActiveSelection {
  x: number;
  w: number;
}
interface xRange {
  xMin: number;
  xMax: number;
}

export interface result {
  xrange: xRange;
  event: MouseEvent;
}

function createOverlayCanvas(chart: Chart): HTMLCanvasElement {
  const overlay = createOverlayHtmlCanvasElement(chart);
  const ctx = overlay.getContext("2d");

  let selection: ActiveSelection = { x: 0, w: 0 };
  let isDragging = false;

  chart.canvas.addEventListener("pointerdown", (evt: MouseEvent) => {
    const rect = chart.canvas.getBoundingClientRect();
    selection.x = getXInChartArea(evt.clientX - rect.left, chart);
    isDragging = true;
  });

  chart.canvas.addEventListener("pointerleave", (evt: MouseEvent) => {
    if (!isDragging) {
      ctx.clearRect(0, 0, overlay.width, overlay.height);
    }
  });

  chart.canvas.addEventListener("pointermove", (evt: MouseEvent) => {
    const rangeSelectOptions = (chart.config.options.plugins as any).rangeSelect as RangeSelectOptions;
    ctx.clearRect(0, 0, chart.canvas.width, chart.canvas.height);
    rangeSelectOptions.state.canvas.width = chart.width;
    rangeSelectOptions.state.canvas.height = chart.height;

    const chartContentRect = chart.canvas.getBoundingClientRect();
    const currentX = getXInChartArea(evt.clientX - chartContentRect.left, chart);
    if (isDragging) {
      selection.w = currentX - selection.x;
      ctx.fillStyle = rangeSelectOptions.fillColor || "#00000044";
      ctx.fillRect(selection.x, chart.chartArea.top, selection.w, chart.chartArea.bottom - chart.chartArea.top);
    } else {
      const cursorWidth = rangeSelectOptions.cursorWidth || 1;
      ctx.fillStyle = rangeSelectOptions.cursorColor || "#00000088";
      ctx.fillRect(currentX, chart.chartArea.top, cursorWidth, chart.chartArea.bottom - chart.chartArea.top);
    }
  });

  chart.canvas.addEventListener("pointerup", (evt: MouseEvent) => {
    const rangeSelectOptions = (chart.config.options.plugins as any).rangeSelect as RangeSelectOptions;
    const onSelectionChanged = rangeSelectOptions.onSelectionChanged;
    if (onSelectionChanged) {
      onSelectionChanged(getDataSetDataInSelection(selection, chart, evt));
    }
    selection = { w: 0, x: 0 };
    isDragging = false;
    ctx.clearRect(0, 0, overlay.width, overlay.height);
  });
  return overlay;
}

function createOverlayHtmlCanvasElement(chartInstance: Chart): HTMLCanvasElement {
  const overlay = document.createElement("canvas");
  overlay.style.position = "absolute";
  overlay.style.pointerEvents = "none";
  overlay.width = chartInstance.canvas.width;
  overlay.height = chartInstance.canvas.height;
  return overlay;
}

function getXInChartArea(val: number, chartInstance: Chart) {
  return Math.min(Math.max(val, chartInstance.chartArea.left), chartInstance.chartArea.right);
}

function getDataSetDataInSelection(selection: ActiveSelection, chart: Chart, event: MouseEvent): result {
  const canvasLeft = chart.scales["xAxis"].left;
  const canvasRight = chart.scales["xAxis"].right;
  const chartMin = chart.scales["xAxis"].min;
  const chartMax = chart.scales["xAxis"].max;
  const selectionMin = Math.min(selection.x, selection.x + selection.w);
  const selectionMax = Math.max(selection.x, selection.x + selection.w);

  const xChartStart = ((selectionMin - canvasLeft) / (canvasRight - canvasLeft)) * (chartMax - chartMin) + chartMin;
  const xChartEnd = ((selectionMax - canvasLeft) / (canvasRight - canvasLeft)) * (chartMax - chartMin) + chartMin;
  const xrange: xRange = { xMin: xChartStart, xMax: xChartEnd };
  return { xrange: xrange, event: event };
}

export default {
  id: "rangeSelect",

  // eslint-disable-next-line
  beforeInit(chart: Chart, options?: any) {
    const rangeSelectOptions = (chart.config.options.plugins as any).rangeSelect as RangeSelectOptions;
    if (!rangeSelectOptions) return;
    const canvas = createOverlayCanvas(chart);
    rangeSelectOptions.state = { canvas: canvas };
    chart.canvas.parentElement.prepend(canvas);
  },

  // eslint-disable-next-line
  resize(chart: Chart, args: { size: { height: number; width: number } }, options?: any) {
    // eslint-disable-next-line
    const rangeSelectOptions = (chart.config.options.plugins as any).rangeSelect;
    if (rangeSelectOptions?.state?.canvas) {
      rangeSelectOptions.state.canvas.width = args.size.width;
      rangeSelectOptions.state.canvas.height = args.size.height;
    }
  },

  destroy(chart: Chart) {
    // eslint-disable-next-line
    const rangeSelectOptions = (chart.config.options.plugins as any).rangeSelect as RangeSelectOptions;
    if (rangeSelectOptions?.state?.canvas) {
      rangeSelectOptions.state.canvas.remove();
      delete rangeSelectOptions.state;
    }
  },
};
