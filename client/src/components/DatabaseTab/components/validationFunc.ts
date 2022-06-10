import { BindingExperiment } from "@/models";
import { Auth, Compound, ExperimentTSA, ExperimentTSA_ProteinCompoundView, Protein } from "../database";
import { DownloadDbTable } from "../databaseFunc";



export async function findProteinCompoundDuplicates(bindingExperiments: BindingExperiment[], dbUrl: string, auth: Auth): Promise<ExperimentTSA_ProteinCompoundView[]> {
    const proteinCompoundCombinations: { protein: Protein; compound: Compound }[] = [];
    for (const bindingExperiment of bindingExperiments) {
        const experiment = bindingExperiment.PLBDAnnotation;
        if (!experiment.compound || !experiment.protein) continue;
        const c = { protein: experiment.protein, compound: experiment.compound };
        const alreadyExists = proteinCompoundCombinations.some(x => x.protein.id == c.protein.id && c.compound.id == c.compound.id);
        if (!alreadyExists) proteinCompoundCombinations.push(c);
    }

    const duplicates: ExperimentTSA_ProteinCompoundView[] = [];
    const duplicatePromises: Promise<void>[] = [];

    const findDuplicate = async (protein: Protein, compound: Compound) => {
        const filter = `((protein_label = "${protein.label}") AND (compound_name = "${compound.name}"))`;
        const filterData = await DownloadDbTable(`${dbUrl}`, "experiment_tsa_protein_compound_view", auth, { format: "csv", rows: 5, filter: filter }) as ExperimentTSA_ProteinCompoundView[];
        duplicates.push(...filterData);
    }

    for (const combo of proteinCompoundCombinations) {
        const dup = findDuplicate(combo.protein, combo.compound);
        duplicatePromises.push(dup);
    }

    await Promise.all(duplicatePromises);
    return duplicates;
}

export async function findExperimentTsaUuidDuplicates(bindingExperiments: BindingExperiment[], dbUrl: string, auth: Auth): Promise<ExperimentTSA[]>{
    const duplicates: ExperimentTSA[] = [];
    const duplicatePromises: Promise<void>[] = [];

    const findDuplicate = async (uuid: string) => {
        const filter = `((uuid = "${uuid}"))`;
        const filterData = await DownloadDbTable(`${dbUrl}`, "experiment_tsa", auth, { format: "csv", rows: 5, filter: filter }) as ExperimentTSA[];
        duplicates.push(...filterData);
    }

    for (const bindingExperiment of bindingExperiments) {
        if (!bindingExperiment.uuid) continue;

        const dup = findDuplicate(bindingExperiment.uuid);
        duplicatePromises.push(dup);
    }

    await Promise.all(duplicatePromises);
    return duplicates;
}