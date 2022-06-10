import * as Models from "@/models";
import { useAppSettings } from "@/store";
import { matchBindingModelPresets } from "@/utils/bindingexperiment_manager";
import { calculateBindingExpTr, parseConc } from "@/utils/utils";
import { v4 as uuidv4 } from 'uuid';

export function copyExperimentWells(originalExperimentWells: Models.ExperimentWell[]) {
  const tempExperimentWells: any[] = [];
  originalExperimentWells.forEach((expWell: Models.ExperimentWell) => {
    const tempExpWell = (({ id, name, protein, ligand, ligand_conc, protein_conc, i_id, file_id, tm_model_params }) =>
      ({ id, name, protein, ligand, ligand_conc, protein_conc, i_id, file_id, tm_model_params }))(expWell);
    tempExperimentWells.push(tempExpWell)
  });
  return tempExperimentWells;
}

export function getMaxWordsUsed(tempExpWells: any): getMaxWordsUsedInterface {
  const word_count_space: number[] = [];
  const word_count_underscore: number[] = [];
  let word_count = 1;
  let seperator = " "
  for (let index = 0; index < tempExpWells.length; index++) {
    const expWell = tempExpWells[index];
    if (expWell.name === null) continue;
    const trimName = expWell.name.replace(/\s+/g, ' ').trim();
    word_count_space.push(trimName.split(" ").length);
    word_count_underscore.push(trimName.split("_").length);
  }

  const max_words_space = Math.max(...word_count_space);
  const max_words_underscore = Math.max(...word_count_underscore);
  if (max_words_space > max_words_underscore) {
    seperator = " ";
    word_count = max_words_space;
  } else {
    seperator = "_";
    word_count = max_words_underscore;
  }

  return { word_count: word_count, seperator: seperator };
}

export interface getMaxWordsUsedInterface {
  word_count: number;
  seperator: string;
}

export interface IndexBasedModel {
  pointNumber: number;
  dilutionFactor: number;
  startingConc_uM: number;
  lowestConcIsControl: boolean;
  reversedConc: boolean;
  createBindingExperiments: boolean;
}

function dilutionConcentration(startConcentration: number, dilutionFactor: number){
  return (index: number) => startConcentration * ((1 / dilutionFactor) ** (index - 1));
}

export function IndexBasedGroup(experimentWells: Models.ExperimentWell[], indexBasedModel: IndexBasedModel) {
  //Error checking
  if (indexBasedModel.pointNumber === 0) return [];

  const startingConc = indexBasedModel.startingConc_uM / 10 ** 6
  const dilutionFunc = dilutionConcentration(startingConc, indexBasedModel.dilutionFactor);

  //Calculate ligand_conc for experiment wells
  if (!indexBasedModel.reversedConc) { //Normal order
    for (let index = 1; index <= experimentWells.length; index++) {
      const expWell = experimentWells[index - 1];
      const dilutionIndex = index % indexBasedModel.pointNumber;

      //Assume lowest conc. is actually 0uM if lowestConcIsControl
      if (dilutionIndex === 0) expWell.ligand_conc = indexBasedModel.lowestConcIsControl ? 0 : dilutionFunc(indexBasedModel.pointNumber);
      else expWell.ligand_conc = dilutionFunc(dilutionIndex);
    }
  } else { //Reversed order
    for (let index = 0; index < experimentWells.length; index++) {
      const expWell = experimentWells[index];
      const dilutionIndex = indexBasedModel.pointNumber - index % indexBasedModel.pointNumber;

      //Assume lowest conc. is actually 0uM if lowestConcIsControl
      if (dilutionIndex === indexBasedModel.pointNumber) expWell.ligand_conc = indexBasedModel.lowestConcIsControl ? 0 : dilutionFunc(indexBasedModel.pointNumber);
      else expWell.ligand_conc = dilutionFunc(dilutionIndex);
    }
  }

  if (indexBasedModel.createBindingExperiments) {
    const numberOfBindingExperiments = Math.ceil(experimentWells.length / indexBasedModel.pointNumber);
    if (numberOfBindingExperiments === 0) return null;

    const bindingExperiments: Models.BindingExperiment[] = [];

    //const startID = getNewBindingExpIndex();
    const startID = 1;

    for (let index = 0; index < numberOfBindingExperiments; index++) {
      const id = startID + index;
      const selectedExperimentWells = experimentWells.slice(index * indexBasedModel.pointNumber, (index + 1) * indexBasedModel.pointNumber);
      const bindingExperiment = generateBindingExperimentFromExpWells(selectedExperimentWells);
      bindingExperiment.id = id;
      bindingExperiment.name = `Exp${bindingExperiment.id}`;
      bindingExperiments.push(bindingExperiment)
    }
    return bindingExperiments;
  }
  return []
}


export function generateBindingExperimentFromExpWells(experimentWells: Models.ExperimentWell[]): Models.BindingExperiment{
  const appSettings = useAppSettings();

  const expWellIndexes = experimentWells.map(x => x.id);
  const ligand_names = Array.from(new Set(experimentWells.map(x => x.ligand))).filter(x => x !== null || (x !== null && x.trim() !== ""));
  const ligand = ligand_names[0] || "unnamed ligand";
  const protein_names = Array.from(new Set(experimentWells.map(x => x.protein))).filter(x => x !== null || (x !== null && x.trim() !== ""));
  const protein = protein_names[0] || "unnamed protein";
  const protein_concs = Array.from(new Set(experimentWells.map(x => x.protein_conc))).filter(x => x !== null || x !== 0);
  const protein_conc = protein_concs[0] || null;


  const matchedPresets = matchBindingModelPresets(protein);
  const paramPreset = matchedPresets ?  matchedPresets[0] : null;

  const bindingExperiment: Models.BindingExperiment = {
    id: null,
    uuid: uuidv4(),
    name: `${protein} : ${ligand}`,
    protein: protein,
    ligand: ligand,
    expPointIndexes: expWellIndexes,
    comment: "",
    params: {
      DuH_Tr: paramPreset?.DuH_Tr,
      DuCp: paramPreset?.DuCp,
      DbH_T0: paramPreset?.DbH_T0,
      DbCp: paramPreset?.DbCp,
      T0: appSettings.DefaultModelParameters.DefaultBindingModelT0,
      Tr: null,
      Kb: null,
      Pt: protein_conc,
      ActiveLigandFraction: 1,
    }
  };
  return bindingExperiment;
}


export interface WordEntry {
  label: string;
  index: number;
  disabled: boolean;
}

export function TextTrim(text: string){
  return text.replace(/\s+/g, ' ').trim();
}

function selectWord(label: string, index: number, seperator = " "){
  return TextTrim(label).split(seperator)[index];
}

function isValidName(text: string): boolean{
  return text != null && text.trim().length > 0
}

export function LabelBasedModel(appData: Models.AppData, labelModel: any, seperator: string, createBindingExperiments = true) {
  let id = 1;
  const expWells = appData.experimentWells;
  const groups: {protein: string; ligand: string; expWells: Models.ExperimentWell[]}[] = [];

  for (const expWell of expWells) {
    
    if (expWell.name === null) continue;

    for (const label in labelModel) {
      if (Object.prototype.hasOwnProperty.call(labelModel, label)) {
        const index = labelModel[label];
        if (index == null) continue;
        let value: string | number = selectWord(expWell.name, index, seperator);
        if (value == null) continue;
        if (label.includes("conc")) value = parseConc(value);
        (expWell as any)[label] = value;
        
      }
    }

    if (isValidName(expWell.protein) && isValidName(expWell.ligand)){
      const findGroup = groups.find(x => x.protein == expWell.protein && x.ligand == expWell.ligand);
      if (findGroup != null){
        findGroup.expWells.push(expWell);
      } else {
        const group = {protein: expWell.protein, ligand: expWell.ligand, expWells: [expWell]};
        groups.push(group)
      }
    }

  }


  if (groups && createBindingExperiments == true) {
    const tempBindingExperiments: Models.BindingExperiment[] = [];
    for (const group of groups) {
      const bindingExperiment = generateBindingExperimentFromExpWells(group.expWells);
      bindingExperiment.id = id;
      id += 1;
      calculateBindingExpTr(bindingExperiment, group.expWells);
      tempBindingExperiments.push(bindingExperiment);
    }
    appData.bindingExperiments = tempBindingExperiments;
  }

}

function StringIsNullOrWhitespace(value: string){
  return value == null || value.trim().length == 0;
}


export function PropertyBasedGroup(expWells: Models.ExperimentWell[]): Models.BindingExperiment[]{

  const groups: {protein: string; ligand: string; protein_conc: number}[] = [];

  for (const expWell of expWells) {
    if (StringIsNullOrWhitespace(expWell.protein) ||  StringIsNullOrWhitespace(expWell.ligand) || expWell.protein_conc == null) continue;

    const group = {protein: expWell.protein, ligand: expWell.ligand, protein_conc: expWell.protein_conc};

    if (groups.find(x => x.ligand == group.ligand && x.protein == group.protein && x.protein_conc == group.protein_conc)) continue;

    else groups.push(group);
  }

  let bindingExpID = 1;
  const bindingExperiments: Models.BindingExperiment[] = [];
  for (const group of groups) {
    const groupExpWells = expWells.filter(x => x.protein == group.protein && x.ligand == group.ligand && x.protein_conc == group.protein_conc);
    const bindingExperiment = generateBindingExperimentFromExpWells(groupExpWells);
    bindingExperiment.id = bindingExpID;
    calculateBindingExpTr(bindingExperiment, groupExpWells);
    bindingExpID++;
    bindingExperiments.push(bindingExperiment);

  }

  return bindingExperiments;
}


