import { ThermottResponse, FitBinding_KbOnly, BindingFit_KbOnly_RequestInput, FitTm } from "@/utils/api_hub";
import { BindingExperiment, ExperimentWell, XYarray } from "@/models";
import { ActiveFluorescenceXYArray } from "./utils";

export async function Fit_KbOnly(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]): Promise<ThermottResponse> {
  const expWells = experimentWells
    .filter((x) => bindingExperiment.expPointIndexes.includes(x.id))
    .filter((x) => x.ligand_conc != 0)
    .filter((x) => x.tm_model_params.Tm != null);
  const C = expWells.map((x) => x.ligand_conc);
  const Tm = expWells.map((x) => x.tm_model_params.Tm);

  //Calculate Tr (control Tm)
  const Trs = experimentWells
    .filter((x) => bindingExperiment.expPointIndexes.includes(x.id))
    .filter((x) => x.ligand_conc === 0)
    .map((x) => x.tm_model_params.Tm);
  bindingExperiment.params.Tr = Trs.reduce((acc, c) => acc + c, 0) / Trs.length;

  const requestInput: BindingFit_KbOnly_RequestInput = { C: C, Tm: Tm, params: bindingExperiment.params };

  const response = await FitBinding_KbOnly(requestInput);
  if (response.ok) {
    response.message = "Fit successful";
    bindingExperiment.params.Kb = response.data.Kb;
    bindingExperiment.params.Kb_confidence_interval = response.data.confInterval;
  }
  return response;
}

export async function FitExperimentWellsTm(experimentWells: ExperimentWell[]) {
  const requests: { id: number; data: XYarray; tm_model: string }[] = [];
  for (const experimentWell of experimentWells) {
    const data = ActiveFluorescenceXYArray(experimentWell);
    requests.push({
      data: data,
      id: experimentWell.id,
      tm_model: experimentWell.tm_model_params.Model,
    });
  }
  const res = await FitTm(requests);
  return res;
}
