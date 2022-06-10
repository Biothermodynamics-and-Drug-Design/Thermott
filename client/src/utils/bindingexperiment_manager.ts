import { BindingExperiment, ExperimentWell, BindingThermodynamicPreset } from "@/models";
import { useAppData, useAppSettings } from "@/store";
import { v4 as uuidv4, validate as validateUuid } from "uuid";

export function getNewBindingExpIndex(): number {
  const appData = useAppData();
  const bindingExperiments = appData.bindingExperiments;
  if (bindingExperiments.length == 0) return 1;
  if (bindingExperiments.length > 0) {
    const id = Math.max(...bindingExperiments.map((x) => x.id));
    return id + 1;
  }
}

export function createBindingExperiment(bindingExperiment: BindingExperiment) {
  const appData = useAppData();
  const bindingExperiment_clone = Object.assign({}, bindingExperiment);
  if (!validateUuid(bindingExperiment_clone.uuid)) {
    bindingExperiment_clone.uuid = uuidv4();
  }
  bindingExperiment_clone.id = getNewBindingExpIndex();
  appData.bindingExperiments.push(bindingExperiment_clone);
}

export function getExperimentWellsFromBindingExperiment(bindingExperiment: BindingExperiment): ExperimentWell[] {
  const appData = useAppData();
  return appData.experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
}

export function getExperimentWellsFromIndexes(indexes: number[]): ExperimentWell[] {
  const appData = useAppData();
  return appData.experimentWells.filter((x) => indexes.includes(x.id));
}

export function getBindingExperimentsFromIndexes(indexes: number[]): BindingExperiment[] {
  const appData = useAppData();
  return appData.bindingExperiments.filter((x) => indexes.includes(x.id));
}

export function getBindingExperimentFromIndex(index: number): BindingExperiment {
  const appData = useAppData();
  return appData.bindingExperiments.find((x) => index === x.id);
}

export function matchBindingModelPresets(protein_name: string): BindingThermodynamicPreset[] | null {
  const appSettings = useAppSettings();
  if (protein_name == null) return null;
  protein_name = protein_name.toLowerCase().trim();

  const modelPresets = appSettings.BindingParamPresets.filter(
    (x) => x.protein.toLowerCase().trim() === protein_name || x.protein_aliases.map((x) => x.toLowerCase().trim()).includes(protein_name)
  );

  if (modelPresets.length > 0) {
    return modelPresets;
  }
  return null;
}
