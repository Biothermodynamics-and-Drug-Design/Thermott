import { Author, Auth, DBdata, ExperimentRequest, DatabaseItem } from "./database";
import Papa from "papaparse";
import { AppData, BindingExperiment } from "@/models";

export function parseAuthor(author: string, author_list: Author[]): Author {
  const found_author = author_list.find((x) => author.includes(x.name) && author.includes(x.surname));
  return found_author;
}

export function generateExperimentLabel(initialLabel: string, offset: number) {
  if (!initialLabel || initialLabel.length == 0) return "";
  const match = initialLabel.match(/\d+/);
  const numberLength = match[0].length;
  const currentInt = parseInt(match[0]);
  return `${initialLabel.slice(0, match.index)}${(currentInt + offset).toString().padStart(numberLength, "0")}`;
}

export async function DownloadDbTable(url: string, table: string, auth: Auth, searchParams: any & { format: string }): Promise<any[]> {
  let dbURL = `${url}/${table}?`;

  searchParams.format = searchParams.format ?? "csv";
  searchParams.rows = searchParams.rows ?? "100";
  for (const key in searchParams) {
    if (Object.prototype.hasOwnProperty.call(searchParams, key)) {
      const value = searchParams[key];
      dbURL += `${key}=${value}&`;
    }
  }
  const params = {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${auth.username}:${auth.password}`),
    },
  };
  const res = await fetch(dbURL.toString(), params);
  if (res.ok == false) return [] as any[];
  if ((searchParams.format as string) == "json") {
    return await res.json();
  } else if ((searchParams.format as string) == "csv") {
    const csv = await res.text();
    const headerTransformFunc = (header: string) => header.replaceAll(".", "_");
    const data = Papa.parse(csv, { header: true, transformHeader: headerTransformFunc, skipEmptyLines: true });
    for (const item of data.data as any[]) {
      item.type = table;
    }

    return data.data as any[];
  }
}

export async function TestLogin(url: string, auth: Auth): Promise<boolean> {
  const params = {
    method: "GET",
    headers: {
      Authorization: "Basic " + btoa(`${auth.username}:${auth.password}`),
    },
  };
  return await fetch(url, params)
    .then((res) => {
      return res.ok;
    })
    .catch(() => false);
}

export async function GetTSAExperimentLabel(apiUrl: string, auth: Auth): Promise<string> {
  const data = new FormData();
  data.append("action", "template");
  data.append("New", "New");
  const getURL = `${apiUrl}/experiment_tsa`;
  const postSettings = {
    method: "POST",
    headers: {
      Authorization: "Basic " + btoa(`${auth.username}:${auth.password}`),
    },
    body: data,
  };

  const res = await fetch(getURL, postSettings);
  const result = await res.text();
  const regex = new RegExp('(?<=<input type="hidden" name="" value=")(.*)(?=\\" id="select:experiment_tsa:0.label" \\/>)');
  const matching = result.match(regex);

  if (matching.length > 0) {
    const label = matching[0];
    if (label.length > 0) return label;
  }
  return "";
}

export function InitialAddDbData(dbData: DBdata, bindingExperiment: BindingExperiment) {
  const addToDataDb: (keyof ExperimentRequest)[] = ["author", "device", "buffer", "protein_batch", "compound_batch", "protein", "compound"];
  for (const key of addToDataDb) {
    if (bindingExperiment.PLBDAnnotation[key]) {
      //const item = dbData.value[key as keyof DBdata].find(x => x.uuid == (bindingExperiment.PLBDAnnotation[key] as any).uuid);
      const item = (dbData[key as keyof DBdata] as DatabaseItem[]).find(
        (x: DatabaseItem) => x.id == (bindingExperiment.PLBDAnnotation[key] as any).id
      );
      if (item == null) {
        dbData[key as keyof DBdata].push(bindingExperiment.PLBDAnnotation[key] as any);
      }
    }
  }
}

export function GetOriginFiles(session: AppData, bindingExperiment: BindingExperiment) {
  const experimentWells = session.experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
  const originFileIds = Array.from(new Set(experimentWells.map((x) => x.file_id)));
  const originFiles = session.originFiles.filter((x) => originFileIds.includes(x.id));
  return originFiles;
}

export function CompoundDilutions(compoundConcs: number[]) {
  const compoundConcentrations = compoundConcs.filter((x) => !Number.isNaN(x) && x > 0).sort((a, b) => b - a);

  const dilutionRatios: number[] = [];
  for (let index = 1; index < compoundConcentrations.length; index++) {
    const conc = compoundConcentrations[index];
    const prevConc = compoundConcentrations[index - 1];
    const ratio = prevConc / conc;
    dilutionRatios.push(ratio);
  }

  const mostCommonRatio = dilutionRatios
    .sort((a, b) => dilutionRatios.filter((v) => v === a).length - dilutionRatios.filter((v) => v === b).length)
    .pop();

  const dilutions = { step_count: 0, compound_max_concentration: 0, dilution_factor: 0 };
  dilutions.dilution_factor = mostCommonRatio;
  dilutions.step_count = new Set(compoundConcentrations).size;
  dilutions.compound_max_concentration = Math.max(...compoundConcentrations) * 10 ** 6; //uM
  return dilutions;
}
