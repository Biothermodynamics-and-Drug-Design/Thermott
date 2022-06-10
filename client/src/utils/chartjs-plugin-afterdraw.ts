import { ChartType, Chart } from "chart.js";

declare module "chart.js" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface PluginOptionsByType<TType extends ChartType> {
    afterDraw: AfterDrawOptions;
  }
}

interface AfterDrawOptions {
  text: string;
}

export default {
  id: "afterDraw",
  // eslint-disable-next-line
  afterDraw: function (chart: Chart) {
    if (chart && chart.data.datasets.length === 0) {
      const text = chart.options.plugins?.afterDraw?.text ?? "No data";
      const chartArea = chart.chartArea;
      const ctx = chart.ctx;
      ctx.save();
      ctx.fillStyle = "gray";
      ctx.font = "25px Arial";
      ctx.textAlign = "center";
      ctx.fillText(text, chartArea.left + chartArea.width / 2, chartArea.top + chartArea.height / 2);
      ctx.restore();
    }
  },
};
