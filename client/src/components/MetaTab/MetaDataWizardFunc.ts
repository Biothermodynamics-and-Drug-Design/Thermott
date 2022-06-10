import * as Models from "@/models";

export function copyExperimentWells(originalExperimentWells: Models.ExperimentWell[]){
    const tempExperimentWells: any[] = [];
    originalExperimentWells.forEach((expWell: Models.ExperimentWell) => {
        const tempExpWell = (({ id, name, protein, ligand, ligand_conc, protein_conc,i_id,file_id, tm_model_params }) => 
        ({ id, name, protein, ligand, ligand_conc, protein_conc, i_id,file_id, tm_model_params }))(expWell);
        tempExperimentWells.push(tempExpWell)
    });
    return tempExperimentWells;
}

export function getMaxWordsUsed(tempExpWells: any): getMaxWordsUsedInterface {
    const word_count_space: number[] = [];
    const word_count_underscore: number[] = [];
    let word_count = 1;
    let seperator = " "
    tempExpWells.forEach((expWell: Models.ExperimentWell) => {
      if(expWell.name !== null){
        word_count_space.push(expWell.name.trim().split(" ").length);
        word_count_underscore.push(expWell.name.trim().split("_").length);
      }
    });

    const max_words_space = Math.max(...word_count_space);
    const max_words_underscore = Math.max(...word_count_underscore);
    if (max_words_space > max_words_underscore) {
      seperator = " ";
      word_count = max_words_space;
    } else {
      seperator = "_";
      word_count = max_words_underscore;
    }
    return {word_count:word_count, seperator: seperator};
  }

  export interface getMaxWordsUsedInterface{
      word_count: number;
      seperator: string;
  }