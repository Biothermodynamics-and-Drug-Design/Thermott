import { BindingExperiment, ExperimentWell } from "@/models";
import {GenerateGraphDataCSV} from "./BindingChartFunc"
const ctx: Worker = self as any;

ctx.addEventListener('message', ({ data}) => {
    const d = data as {bindingExperiments: BindingExperiment[]; experimentWells: ExperimentWell[]; sep: string};
    const csv = GenerateGraphDataCSV(d.bindingExperiments, d.experimentWells, d.sep);
    ctx.postMessage(csv);
  });