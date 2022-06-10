import { BindingExperiment, ExperimentWell } from '@/models';
import { ParamHTML} from "@/utils/utils"



export function DetermineErrors(bindingExperiments: BindingExperiment[], experimentWells: ExperimentWell[]) {
    const errorList: BindingError[] = [];
    bindingExperiments.sort((a, b) => a.id - b.id);
    //console.log(bindingExperiments)
    for (let index = 0; index < bindingExperiments.length; index++) {
        const bindingExperiment = bindingExperiments[index];
        const filterExperimentWells = experimentWells.filter(x => bindingExperiment.expPointIndexes.includes(x.id));

        //No ligand concentration provided
        CheckIfAnyExpWells(bindingExperiment, filterExperimentWells, errorList);
        CheckParams(bindingExperiment, filterExperimentWells, errorList);
        const IsAllLigandConcDefined = CheckLigandConc(bindingExperiment, filterExperimentWells, errorList);
        if (IsAllLigandConcDefined) CheckIfControlExists(bindingExperiment, filterExperimentWells, errorList);
    }

    return errorList;
}


function CheckLigandConc(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[], errorList: BindingError[]) {
    const expWellsWithNoLigandConc = experimentWells.filter(x => x.ligand_conc === null).map(x => x.id);
    if (expWellsWithNoLigandConc.length > 0) {
        const error: BindingError = {
            bindingExperimentID: bindingExperiment.id,
            title: `${bindingExperimentIdText(bindingExperiment)} Undefined ligand concentration`,
            description: `Experiment wells [${expWellsWithNoLigandConc.join(", ")}]`,
        }
        errorList.push(error);
        return false;
    }
    return true;
}



function CheckParams(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[], errorList: BindingError[]) {
    const undefinedParams: string[] = []
    const params = bindingExperiment.params;
    
    if (CheckIfNumberIsUndefined(params.Pt)) undefinedParams.push("Pt");
    if (CheckIfNumberIsUndefined(params.DbCp)) undefinedParams.push("DbCp");
    if (CheckIfNumberIsUndefined(params.DbH_T0)) undefinedParams.push("DbH_T0");
    if (CheckIfNumberIsUndefined(params.DuCp)) undefinedParams.push("DuCp");
    if (CheckIfNumberIsUndefined(params.DuH_Tr)) undefinedParams.push("DuH_Tr");
    if (CheckIfNumberIsUndefined(params.T0)) undefinedParams.push("T0");

    if (undefinedParams.length > 0) {
        const error: BindingError = {
            bindingExperimentID: bindingExperiment.id,
            title: `${bindingExperimentIdText(bindingExperiment)} Undefined binding experiment parameters`,
            description: undefinedParams.join(", "),
            htmlDescription: undefinedParams.map(x => ParamHTML(x)).join(", "),
        }
        errorList.push(error);

    }

}

function CheckIfControlExists(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[], errorList: BindingError[]) {
    const control_expWells = experimentWells.filter(x => x.ligand_conc === 0);
    if (control_expWells.length === 0) {
        const error: BindingError = {
            bindingExperimentID: bindingExperiment.id,
            title: `${bindingExperimentIdText(bindingExperiment)} No control wells`,
            description: "No experiment wells with no ligand added",
        }
        errorList.push(error);
    }
}


function CheckIfAnyExpWells(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[], errorList: BindingError[]) {
    if (bindingExperiment.expPointIndexes.length === 0) {
        const error: BindingError = {
            bindingExperimentID: bindingExperiment.id,
            title: `${bindingExperimentIdText(bindingExperiment)} No exp. wells`,
            description: "No experiment wells added to experiment",
        }
        errorList.push(error);
    }
}




function CheckIfNumberIsUndefined(value: number | string) {
    return value === null || value === 0 || value === undefined || (value as string) === "";
}




function bindingExperimentIdText(bindingExperiment: BindingExperiment){
    return `(${bindingExperiment.id}) ${bindingExperiment.name} |`
}

export interface BindingError {
    bindingExperimentID: number;
    title: string;
    description: string;
    htmlDescription?: string;
    //icon: string;
}

