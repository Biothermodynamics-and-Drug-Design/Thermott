<template>
  <v-dialog v-model="dialog" eager fullscreen>
    <template #activator="{ on, attrs }">
      <v-btn
        x-small
        v-bind="attrs"
        depressed
        color="blue-grey darken-1"
        outlined
        :disabled="isButtonDisabled"
        class="ma-1"
        v-on="on"
        ><template v-if="button.includes('text')">Report Chart</template>
        <v-icon
          v-if="button.includes('icon')"
          small
          v-text="'mdi-chart-bell-curve-cumulative'"
        />
      </v-btn>
    </template>
    <v-card>
      <v-card-title class="grey lighten-2 text-subtitle-1 py-1">
        Report chart
        <v-spacer />

        <v-btn icon @click="dialog = false">
          <v-icon v-text="'mdi-close'" />
        </v-btn>
      </v-card-title>

      <v-card-text class="pa-2" align="center" justify="center">
        <v-row no-gutters justify="center">
          <v-col
            ref="chart"
            class="overflow-y-auto"
            style="max-height: 60vh"
            xs="12"
            sm="12"
            md="12"
            lg="8"
            xl="5"
          >
          </v-col>
        </v-row>
        <v-row no-gutters justify="center">
          <DownloadMenu @download="downloadImage" />
        </v-row>
        <v-divider class="my-2" />
        <v-row no-gutters>
          <v-col>
            <v-row no-gutters justify="center" class="text-h6"
              >Chart options</v-row
            >
            <!-- <v-row no-gutters justify='center'></v-row> -->
            <div v-if="dialog" class="d-flex flex-row justify-center">
              <ExperimentWellSelect
                v-if="
                  reportChartOptions.ChartType == 'Melting' ||
                  reportChartOptions.ChartType == 'Both'
                "
                :selected-experiment-wells="selectedExperimentWells"
                :experiment-wells="_experimentWells"
                @update-selectedexperimentwells="
                  selectedExperimentWells = $event;
                  draw();
                "
              />
              <GenericOptions
                class="mx-2"
                :options="reportChartOptions"
                @draw="draw"
              />
              <BoundOptions
                :options="reportChartOptions"
                @draw="draw"
                @changeBindingYAxisBounds="changeBindingYAxisBounds"
                @changeRawDataXAxisBounds="changeRawDataXAxisBounds"
              />
            </div>
          </v-col>
        </v-row>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts">
import { BindingExperiment, ExperimentWell } from "@/models";
import {
  defineComponent,
  ref,
  computed,
  PropType,
  Ref,
  watch,
} from "@vue/composition-api";
//import * as Plotly from "@/utils/plotly.js";
//import "@/utils/plotly.js";
import { Plotly } from "@/utils/plotly";
import { getExperimentWellsFromBindingExperiment } from "@/utils/bindingexperiment_manager";
import {
  DrawBindingExperimentWithRawFluorescence,
  DrawBindingExperiments,
  DrawExperimentWells,
  drawAxisBreak,
  calculateTemperatureRange,
  ReportChartOptions,
  ChartType,
  calculateYAxisBounds,
  KbFormat,
} from "./ReportChartPlotlyFunc";
import ExperimentWellSelect from "./ReportChartPlotly/ExperimentWellSelect.vue";
import GenericOptions from "./ReportChartPlotly/GenericOptions.vue";
import DownloadMenu from "./ReportChartPlotly/DownloadMenu.vue";
import BoundOptions from "./ReportChartPlotly/BoundOptions.vue";

export default defineComponent({
  components: {
    ExperimentWellSelect,
    GenericOptions,
    DownloadMenu,
    BoundOptions,
  },
  props: {
    bindingExperiments: {
      type: Array as PropType<BindingExperiment[]>,
      default: () => [] as BindingExperiment[],
    },
    experimentWells: {
      type: Array as PropType<ExperimentWell[]>,
      default: () => [] as ExperimentWell[],
    },
    preselectedExperimentWells: {
      type: Array as PropType<ExperimentWell[]>,
      default: () => [] as ExperimentWell[],
    },
    button: {
      type: String as PropType<"text" | "icon" | "texticon">,
      default: "texticon",
    },
  },

  setup(props) {
    const dialog = ref(false);
    const menu = ref(false);

    const _experimentWells = computed(() =>
      props.experimentWells.filter((x) => x.tm_model_params.Tm != null)
    );

    const selectedExperimentWells: Ref<ExperimentWell[]> = ref([]);

    const reportOptions = ref(new ReportChartOptions());

    const chart: Ref<HTMLElement> = ref(null);

    const isButtonDisabled = computed(() => {
      console.log(props.experimentWells, props.bindingExperiments);
      if (
        (!props.preselectedExperimentWells ||
          props.preselectedExperimentWells.length) == 0 &&
        (!props.bindingExperiments || props.bindingExperiments.length == 0)
      )
        return true;
      return false;
    });

    const reportChartOptions: Ref<ReportChartOptions> = ref({
      ChartType: "Both" as ChartType,
      FullReport: false,
      Kb_format: "both" as KbFormat,
      Color: true,
      RawDataXAxisBounds: { enabled: false, min: 0, max: 100 },
      ColorGradientRawData: true,
      ColorGradientBinding: true,
      IsAxisBreak: true,
      Title: reportOptions.value.Title,
      BindingYAxisBounds: { enabled: false, min: 0, max: 100 },
      ChartRatio: 1,
      BindingChartLegendLabel: "ProteinLigand" as "ProteinLigand" | "Name",
    });

    const chartType = computed(
      (): "Both" | "Binding" | "BothMany" | "Melting" => {
        if (props.bindingExperiments && props.bindingExperiments.length === 1)
          return "Both";
        else if (
          props.bindingExperiments &&
          props.bindingExperiments.length > 1 &&
          reportChartOptions.value.FullReport === false
        )
          return "Binding";
        else if (
          props.bindingExperiments &&
          props.bindingExperiments.length > 1 &&
          reportChartOptions.value.FullReport === true
        )
          return "BothMany";
        else if (
          (!props.bindingExperiments ||
            props.bindingExperiments.length === 0) &&
          props.experimentWells &&
          props.experimentWells.length > 0
        ) {
          return "Melting";
        }
        return "Both";
      }
    );

    const formatBindingHTML = () => {
      if (reportChartOptions.value.Kb_format === "Kd") return "K<sub>d</sub>";
      else if (reportChartOptions.value.Kb_format === "Kb")
        return "K<sub>b</sub>";
      else if (reportChartOptions.value.Kb_format === "both") return "both";
      else return reportChartOptions.value.Kb_format;
    };

    const getChipText = (experimentWell: ExperimentWell) => {
      return `#${experimentWell.id} (${(
        experimentWell.ligand_conc *
        10 ** 6
      ).toPrecision(4)}μM)`;
    };

    const getMenuText = (experimentWell: ExperimentWell) => {
      return `#${experimentWell.id} ${experimentWell.name} | ${(
        experimentWell.ligand_conc *
        10 ** 6
      ).toPrecision(4)}μM | ${experimentWell.tm_model_params.Tm}°C`;
    };

    const draw = async () => {
      chart.value.innerHTML = "";

      reportChartOptions.value.ChartType = chartType.value;

      if (props.bindingExperiments && props.bindingExperiments.length > 0) {
        if (
          props.bindingExperiments.length === 1 &&
          selectedExperimentWells.value.length !== 0
        ) {
          if (
            selectedExperimentWells.value.filter((x) => x.temperature !== null)
              .length == 0
          ) {
            DrawBindingExperiments(
              chart.value,
              props.bindingExperiments,
              reportChartOptions.value
            );
          } else {
            DrawBindingExperimentWithRawFluorescence(
              chart.value,
              props.bindingExperiments[0],
              selectedExperimentWells.value,
              _experimentWells.value,
              reportChartOptions.value
            );
          }
        } else if (props.bindingExperiments.length > 1) {
          if (reportChartOptions.value.FullReport) drawBindingChartsStack();
          else
            DrawBindingExperiments(
              chart.value,
              props.bindingExperiments,
              reportChartOptions.value
            );
        }
      } else if (
        (!props.bindingExperiments || props.bindingExperiments.length === 0) &&
        _experimentWells.value.length > 0
      )
        DrawExperimentWells(
          chart.value,
          selectedExperimentWells.value,
          reportChartOptions.value
        );

      chart.value.innerHTML = await generateSvg();
    };

    const drawBindingChartsStack = async () => {
      if (!props.bindingExperiments) return;

      const svgContainer = document.createElement("svg");

      for (let index = 0; index < props.bindingExperiments.length; index++) {
        const bindingExperiment = props.bindingExperiments[index];
        const options = Object.assign({}, reportChartOptions.value);
        options.IsAxisBreak = false;
        DrawBindingExperimentWithRawFluorescence(
          chart.value,
          bindingExperiment,
          getExperimentWellsFromBindingExperiment(bindingExperiment),
          getExperimentWellsFromBindingExperiment(bindingExperiment),
          options
        );
        //chart.innerHTML = (await this.generateSvg()).replaceAll("svg", "g");
        chart.value.innerHTML = await generateSvg(true, false);
        svgContainer.appendChild(chart.value.firstChild);
      }
      let height = 0;
      let width = 0;

      for (let index = 0; index < svgContainer.children.length; index++) {
        const svg = svgContainer.children[index];
        const viewbox = svg.getAttribute("viewBox");
        const w = parseInt(viewbox.split(" ")[2]);
        const h = parseInt(viewbox.split(" ")[3]);
        svg.removeAttribute("xmlns");
        svg.removeAttribute("xmlns:xlink");
        drawAxisBreak(svg as HTMLElement);
        svg.removeAttribute("viewBox");
        svg.setAttribute("y", height.toString());
        //svg.setAttribute("transform", `translate(0,${height})`);
        width = Math.max(width, w);
        height += h;
      }

      svgContainer.setAttribute("viewBox", `${0} ${0} ${width} ${height}`);
      svgContainer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
      svgContainer.setAttribute("xmlns:xlink", "http://www.w3.org/1999/xlink");

      chart.value.innerHTML = svgContainer.outerHTML;
      //chart.innerHTML = await this.generateSvg();
      svgContainer.remove();
    };

    const generateSvg = async (removeSize = true, drawBreak = true) => {
      const img: string = await Plotly.toImage(chart.value, {
        format: "svg",
      });
      let decodedImg = decodeURIComponent(img);
      decodedImg = decodedImg.replace("data:image/svg+xml,", "");

      const template = document.createElement("template");
      decodedImg = decodedImg.trim(); // Never return a text node of whitespace as the result
      template.innerHTML = decodedImg;
      const svg_element = template.content.firstChild;

      if (removeSize) {
        (svg_element as SVGElement).removeAttribute("height");
        (svg_element as SVGElement).removeAttribute("width");
      }

      if (
        props.bindingExperiments &&
        props.bindingExperiments.length > 1 &&
        drawBreak
      ) {
        drawAxisBreak(svg_element as HTMLElement, ["xy", "x2y2"]);
      } else if (
        props.bindingExperiments &&
        props.bindingExperiments.length === 1 &&
        drawBreak
      ) {
        drawAxisBreak(svg_element as HTMLElement);
      }

      let downloadImg = (svg_element as HTMLElement).outerHTML;
      downloadImg = downloadImg.replaceAll(
        "vector-effect: non-scaling-stroke;",
        ""
      );
      return downloadImg;
    };

    const changeBindingYAxisBounds = () => {
      if (reportChartOptions.value.BindingYAxisBounds.enabled === false) {
        const bounds = calculateYAxisBounds(props.bindingExperiments);
        reportChartOptions.value.RawDataXAxisBounds.min = bounds.min;
        reportChartOptions.value.RawDataXAxisBounds.max = bounds.max;
      }
      draw();
    };

    const changeRawDataXAxisBounds = () => {
      if (reportChartOptions.value.RawDataXAxisBounds.enabled === false) {
        const expWells = props.bindingExperiments
          .map((x) => getExperimentWellsFromBindingExperiment(x))
          .flat()
          .filter((x) => x.tm_model_params.Tm !== null);
        [
          reportChartOptions.value.RawDataXAxisBounds.min,
          reportChartOptions.value.RawDataXAxisBounds.max,
        ] = calculateTemperatureRange(expWells);
      }
      draw();
    };

    const downloadImage = (imagetype: string) => {
      // const height: number = (chart.value as any).layout.height as number;
      // const width: number = (chart.value as any).layout.width as number;

      //(Plotly as any).downloadImage(chart, {format: "png", height: height, width:width, filename: "hello.png"})

      if (imagetype === "svg") {
        //const downloadImg = await this.generateSvg();

        const element = document.createElement("a");
        element.setAttribute(
          "href",
          "data:image/svg+xml," + encodeURIComponent(chart.value.innerHTML)
        );
        element.setAttribute("download", "image.svg");

        element.style.display = "none";
        chart.value.appendChild(element);

        element.click();

        chart.value.removeChild(element);
      } else {
        //png save
        const svgElement = chart.value.querySelector("svg") as SVGElement;
        const dimensions = svgElement.getAttribute("viewBox").split(" ");
        const width = parseInt(dimensions[2]) * 2;
        const height = parseInt(dimensions[3]) * 2;
        //svgElement.setAttribute("width", parseInt(dimensions[2]).toString());
        //svgElement.setAttribute("height", parseInt(dimensions[3]).toString());

        let svg = svgElement.outerHTML;
        svg = svg.replace(
          "viewBox=",
          `width="${parseInt(dimensions[2])}" height="${parseInt(
            dimensions[3]
          )}" viewBox=`
        );

        const blob = new Blob([svg], { type: "image/svg+xml;charset=utf-8" });
        const URL = window.URL || window.webkitURL;
        const blobURL = URL.createObjectURL(blob);

        const image = new Image();
        const canvas = document.createElement("canvas");
        image.onload = () => {
          canvas.width = width;

          canvas.height = height;
          const context = canvas.getContext("2d");
          // draw image in canvas starting left-0 , top - 0
          context.drawImage(image, 0, 0, width, height);
          const png = canvas.toDataURL(); // default png
          const element = document.createElement("a");
          element.setAttribute("href", png);
          element.setAttribute("download", "image.png");

          element.style.display = "none";
          document.body.appendChild(element);

          element.click();

          document.body.removeChild(element);
        };
        image.src = blobURL;

        //await (Plotly as any).downloadImage(chart, { format: imagetype });
      }
    };

    watch(
      () => dialog.value,
      async (newVal, oldVal) => {
        if (newVal === true && oldVal === false) {
          reportChartOptions.value.FullReport = false;
          selectedExperimentWells.value = [];
          if (props.preselectedExperimentWells.length > 0) {
            selectedExperimentWells.value.push(
              ...props.preselectedExperimentWells
            );
          } else {
            selectedExperimentWells.value.push(..._experimentWells.value);
          }
          chart.value.innerHTML = "";

          if (_experimentWells.value && _experimentWells.value.length > 0) {
            [
              reportChartOptions.value.RawDataXAxisBounds.min,
              reportChartOptions.value.RawDataXAxisBounds.max,
            ] = calculateTemperatureRange(_experimentWells.value);
          }

          if (props.bindingExperiments && props.bindingExperiments.length > 0) {
            const bounds = calculateYAxisBounds(props.bindingExperiments);
            reportChartOptions.value.RawDataXAxisBounds.min = bounds.min;
            reportChartOptions.value.RawDataXAxisBounds.max = bounds.max;

            const expWells = props.bindingExperiments
              .map((x) => getExperimentWellsFromBindingExperiment(x))
              .flat()
              .filter((x) => x.tm_model_params.Tm !== null);
            [
              reportChartOptions.value.RawDataXAxisBounds.min,
              reportChartOptions.value.RawDataXAxisBounds.max,
            ] = calculateTemperatureRange(expWells);
          }

          reportChartOptions.value.ChartType = chartType.value;
          await draw();
        }
      }
    );

    return {
      getChipText,
      getMenuText,
      formatBindingHTML,
      downloadImage,
      chartType,
      chart,
      reportChartOptions,
      changeBindingYAxisBounds,
      changeRawDataXAxisBounds,
      dialog,
      menu,
      draw,
      _experimentWells,
      selectedExperimentWells,
      isButtonDisabled,
    };
  },
});
</script>

<style>
.plotly {
  display: inline-block;
}
</style>
