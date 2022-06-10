<template>
  <div>
    <v-container v-show="!showChartComponent && experimentWells && experimentWells.length > 0">
      Selected experiment well(s) only contain the <i>T</i><sub>m</sub> value
    </v-container>

    <v-container>
      <div class="chart-container" style="position: relative">
        <canvas ref="chartContainer"></canvas>
      </div>

      <v-row v-if="showChartComponent" no-gutters class="mt-8" align="center" style="user-select: none">
        <v-spacer />
        <div class="d-flex align-center">
          <span class="mr-2">Select</span> <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
          <div class="mr-6" />
          <span class="mr-2">Additive</span>
          <div class="inputHint">Ctrl</div>
          <span style="padding: 4px">+</span> <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
          <div class="mr-6" />
          <span class="mr-2">Deselect</span>
          <div class="inputHint">Shift</div>
          <span style="padding: 4px">+</span> <v-icon small color="grey lighten-1">mdi-mouse</v-icon>
        </div>

        <v-spacer />
        <v-menu v-model="menu" absolute offset-y style="max-width: 600px">
          <template #activator="{ on }">
            <v-btn class="mx-2" icon small data-cy="tmChartMenuButton" v-on="on">
              <v-icon dark>mdi-cog</v-icon>
            </v-btn>
          </template>

          <v-list dense @click.prevent>
            <v-list-item dense @click="downloadChartJPG">
              <v-list-item-title>Save plot image</v-list-item-title>
            </v-list-item>
            <v-list-item dense @click="copyGraphData">
              <v-list-item-title>Copy graph data</v-list-item-title>
            </v-list-item>
            <v-list-item dense @click="downloadGraphData">
              <v-list-item-title>Download graph data (.csv)</v-list-item-title>
            </v-list-item>
            <v-list-item dense @click="tmLineSwitch">
              <v-list-item-title>
                <template v-if="isTmLine">Disable T<sub>m</sub> line</template>
                <template v-else>Enable T<sub>m</sub> line</template>
              </v-list-item-title>
            </v-list-item>
          </v-list>
        </v-menu>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, ref, computed, onMounted, Ref, watch } from "@vue/composition-api";
import { Chart, ChartConfiguration } from "chart.js";
import { ActiveFluorescence, CopyToClipboard, DownloadFile } from "../../utils/utils";
import rangeSelect from "@/utils/chartjs-plugin-range-select";
import afterDraw from "@/utils/chartjs-plugin-afterdraw";
import { GraphDataset, CalculateModelGraph, SelectnFitTm } from "./TmChartFunc";
import { ExperimentWell, XYpoint } from "@/models";
import { useNotify } from "../Generic/GlobalSnackbarStore";

export default defineComponent({
  props: { experimentWells: Array as PropType<ExperimentWell[]> },
  setup(props) {
    const menu = ref(false);
    let chart: Chart = undefined;

    const isTmLine = ref(false);

    const notify = useNotify();

    const chartContainer: Ref<HTMLCanvasElement> = ref(null);

    const default_fontsize = 14;

    const changePointSelection = async (xrange: { xMin: number; xMax: number }, event: MouseEvent) => {
      if (props.experimentWells.length === 0) return;
      const results = await SelectnFitTm(props.experimentWells, xrange, event);
      if (results == null) return;
      else if (results.ok == true) {
        const failedFits = results.FitData.filter((x) => x.ok == false);

        if (failedFits.length > 0) notify(`Failed to fit: ${failedFits.map((x) => x.id).join(", ")}`, "error", 8000);
        else notify("Fit successful", "success", 4000);

        drawChart();
      } else {
        notify("Failed to connect to server", "error", 4000);
      }
    };

    const config: ChartConfiguration = {
      type: "scatter",
      data: {
        datasets: [],
      },
      plugins: [afterDraw, rangeSelect],
      options: {
        plugins: {
          rangeSelect: {
            onSelectionChanged: (result: { xrange: { xMin: number; xMax: number }; event: MouseEvent }) => {
              changePointSelection(result.xrange, result.event);
            },
          },
          afterDraw: { text: "No experiment well selected" },
          legend: {
            onClick: null,
            labels: {
              boxWidth: 12,
              filter: (legendItem) => !["Raw disabled", "Raw active", "Tm line"].some((x) => x.includes(legendItem.text)),
            },
          },
        },
        scales: {
          xAxis: {
            type: "linear",
            position: "bottom",
            display: true,
            axis: "x",
            ticks: {
              font: { size: default_fontsize },
            },
            title: {
              text: "Temperature (°C)",
              display: true,
              font: { size: default_fontsize },
            },
          },
          yAxis: {
            type: "linear",
            position: "left",
            display: true,
            axis: "y",
            title: {
              text: "Fluorescence (a.u.)",
              display: true,
              font: { size: default_fontsize },
            },
            ticks: {
              font: { size: default_fontsize },
            },
          },
        },
      },
    };

    const showChartComponent = computed(
      () => props.experimentWells.filter((x) => x.temperature != null || (x.temperature && x.temperature.length !== 0)).length !== 0
    );

    const drawChart = () => {
      GraphDataset(props.experimentWells, chart, isTmLine.value);
    };

    const generateGraphData = (sep = "\t") => {
      let text = "";
      let maxLength = 0;

      props.experimentWells.forEach((expWell: ExperimentWell) => {
        const model = CalculateModelGraph(expWell);

        const length = Math.max(...[expWell.temperature.length, (model as XYpoint[]).length]);
        if (length > maxLength) maxLength = length;
        text += expWell.name + " (raw T)" + sep + expWell.name + " (raw F)" + sep;
        text += expWell.name + " (fit T)" + sep + expWell.name + " (fit F)" + sep;
      });
      text += "\n";

      for (let index = 0; index < maxLength; index++) {
        props.experimentWells.forEach((expWell: ExperimentWell) => {
          const model: XYpoint[] = CalculateModelGraph(expWell);
          if (expWell.temperature[index]) text += expWell.temperature[index] + sep + ActiveFluorescence(expWell)[index] + sep;
          else text += "" + sep + "" + sep;

          if (model[index]) text += model[index].x + sep + model[index].y + sep;
          else text += "" + sep + "" + sep;
        });
        text += "\n";
      }
      return text;
    };

    const copyGraphData = () => {
      const text = generateGraphData("\t");
      CopyToClipboard(text);
    };

    const downloadGraphData = () => {
      const text = generateGraphData(",");
      DownloadFile(text, "table.csv");
    };

    const downloadChartJPG = () => {
      // this.ctx.height = this.ctx.height * 10;
      // this.ctx.width = this.ctx.height * 10;
      chart.ctx.canvas.height = chart.ctx.canvas.height * 4;
      chart.ctx.canvas.width = chart.ctx.canvas.width * 4;
      chart.ctx.scale(4, 4);
      chart.options.responsive = false;
      chart.options.animation = { duration: 0 };
      chart.update();

      //const url_base64jp = (this.$refs.chart as HTMLCanvasElement).toDataURL("image/png");
      const element = document.createElement("a");

      element.setAttribute("href", chart.toBase64Image());
      element.setAttribute("download", "image.png");

      element.style.display = "none";
      document.body.appendChild(element);

      element.click();

      document.body.removeChild(element);

      chart.ctx.canvas.height = chart.ctx.canvas.height / 4;
      chart.ctx.canvas.width = chart.ctx.canvas.width / 4;
      chart.update();
    };

    const tmLineSwitch = () => {
      isTmLine.value = !isTmLine.value;
      drawChart();
    };

    onMounted(() => {
      chart = new Chart(chartContainer.value, config);
      drawChart();
    });

    watch(
      () => props.experimentWells,
      () => {
        drawChart();
      },
      { deep: true }
    );

    return { menu, isTmLine, showChartComponent, copyGraphData, downloadGraphData, downloadChartJPG, tmLineSwitch, chartContainer };
  },
});
</script>

<style scoped>
.keyboardbutton {
  border: solid 1px #b0b0b0;
  border-radius: 5px;
  background-color: #f9f9f9;
  vertical-align: middle;
  display: inline-block;
  font-size: 0.8em;
  opacity: 0.9;
}
</style>
