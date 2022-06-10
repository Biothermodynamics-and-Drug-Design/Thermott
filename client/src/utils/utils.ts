import { AppData, ExperimentWell, NumberRange, XYpoint, XYarray, BindingExperiment, BindingModelParams, Fluorescence } from "@/models";
import { TmModelFunc } from "@/utils/tm_models";

export function TmModelFuncGraph(expWell: ExperimentWell): XYpoint[] {
  const x: number[] = [];
  for (let i = 0; i < expWell.fit_points.length; i++) {
    if (expWell.fit_points[i]) {
      x.push(expWell.temperature[i]);
    }
  }
  const x_range: number[] = [Math.min(...x), Math.max(...x)];
  const graph_points: XYpoint[] = [];
  for (let index = x_range[0]; index <= x_range[1]; index += 0.5) {
    const point: XYpoint = {
      x: index,
      y: TmModelFunc(index, expWell.tm_model_params),
    };
    graph_points.push(point);
  }
  return graph_points;
}

export function ActiveFluorescence(expWell: ExperimentWell): number[] {
  return expWell.fluorescence.find((x) => x.id === expWell.active_gain).data;
}

export function ActiveFluorescenceXYArray(expWell: ExperimentWell, selectedPointsOnly = true, tempRange: NumberRange = null): XYarray {
  const selectedPoints = expWell.fit_points;
  const temperature = expWell.temperature;
  const fluorescence = ActiveFluorescence(expWell);

  let XYarray: XYarray = {
    x: expWell.temperature,
    y: ActiveFluorescence(expWell),
  };

  if (selectedPointsOnly) {
    const XYarray_x: number[] = [];
    const XYarray_y: number[] = [];
    for (let index = 0; index < temperature.length; index++) {
      if (selectedPoints[index]) {
        XYarray_x.push(temperature[index]);
        XYarray_y.push(fluorescence[index]);
      }
    }
    XYarray = { x: XYarray_x, y: XYarray_y };
  }

  if (tempRange) {
    const XYarray_x: number[] = [];
    const XYarray_y: number[] = [];
    for (let index = 0; index < temperature.length; index++) {
      const X = temperature[index];
      if (X >= tempRange.min && X <= tempRange.max) {
        XYarray_x.push(X);
        XYarray_y.push(fluorescence[index]);
      }
    }
    XYarray = { x: XYarray_x, y: XYarray_y };
  }

  return XYarray;
}

export function ActiveGain(expWell: ExperimentWell): Fluorescence {
  return expWell.fluorescence.find((x) => x.id === expWell.active_gain);
}

export interface CSVHeader {
  value: string;
  text: string;
  type?: "numeric" | "text";
  multiplyAmount?: number;
}

export function GenerateCSV(headers: CSVHeader[], items: any[], seperator: string, excluded: string[] = []) {
  let table = "";

  let row = [];
  for (const header of headers) {
    if (!excluded.includes(header.value)) {
      row.push(`"${header.text}"`);
    }
  }
  table += row.join(seperator) + "\n";

  for (const item of items) {
    row = [];
    for (const header of headers) {
      if (!excluded.includes(header.value)) {
        const split = header.value.split(".");
        let data_cell = null;
        if (split.length > 1) {
          data_cell = item[split[0]][split[1]];
        } else {
          data_cell = item[header.value];
        }
        if (Array.isArray(data_cell)) {
          data_cell = `"${data_cell.join(", ")}"`;
        }

        if (header.multiplyAmount && header.type == "numeric") {
          console.log(data_cell);
          data_cell = (data_cell as number) * header.multiplyAmount;
        } else if (header.type == "text") {
          data_cell = `"${data_cell}"`;
        }
        row.push(data_cell);
      }
    }
    table += row.join(seperator) + "\n";
  }
  return table;
}

export function BindingModelFunc(Tm: number, p: BindingModelParams) {
  const R = 8.314;
  Tm = Tm + 273.15;
  const Tr = p.Tr + 273.15;
  const T0 = p.T0 + 273.15;

  const DuH_Tr = p.DuH_Tr;
  const DuCp = p.DuCp;
  const DbH_T0 = p.DbH_T0;
  const DbCp = p.DbCp;
  const Pt = p.Pt;

  const DbG_T0 = -R * T0 * Math.log(p.Kb);

  const DuS_Tr = DuH_Tr / Tr;
  const DbS_T0 = (DbH_T0 - DbG_T0) / T0;

  const a = (DuH_Tr + DuCp * (Tm - Tr) - Tm * (DuS_Tr + DuCp * Math.log(Tm / Tr))) / (R * Tm);
  const b = (DbH_T0 + DbCp * (Tm - T0) - Tm * (DbS_T0 + DbCp * Math.log(Tm / T0))) / (R * Tm);
  const result = (Math.exp(-a) - 1) * ((Pt / 2) * Math.exp(a) + Math.exp(b));

  return result;
}

export function formatConc(conc: number, unit: string, show_unit = true) {
  if (conc === null || conc === undefined) return "-";

  switch (unit) {
    case "micromolar":
      return (conc * 10 ** 6).toFixed(1) + (show_unit ? " μM" : "");
      // code block
      break;

    default:
      return conc;
    // code block
  }
}

export function formatTemp(temp: number, unit = "celsius", places = 2, show_unit = true) {
  switch (unit) {
    case "celsius":
      return temp.toFixed(places) + (show_unit ? " °C" : "");
      break;
    case "kelvin":
      return (temp + 273.15).toFixed(places) + (show_unit ? " K" : "");
      break;

    default:
      return temp.toFixed(places);
    // code block
  }
}

export function getNewBindingExpIndex(bindingExperiments: BindingExperiment[]): number {
  if (bindingExperiments.length == 0) return 1;
  if (bindingExperiments.length > 0) {
    const id = Math.max(...bindingExperiments.map((x) => x.id));
    return id + 1;
  }
}

export function getNewExperimentWellIndex(experimentWells: ExperimentWell[]): number {
  if (experimentWells.length == 0) return 1;
  if (experimentWells.length > 0) {
    const index = Math.max(...experimentWells.map((x) => x.id));
    return index + 1;
  }
}

export function numericAverage(array: number[]) {
  const averageFunction = (arr: number[]) => arr.reduce((a: number, b: number) => a + b, 0) / array.length;
  return averageFunction(array);
}

export function calculateBindingExpTr(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]) {
  const expWells = experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
  const controlWells = expWells.filter((x) => x.ligand_conc === 0);
  const TrValues = controlWells.map((x) => x.tm_model_params.Tm);
  const averageTr = numericAverage(TrValues);
  bindingExperiment.params.Tr = averageTr;
}

export function calculateBindingExpPt(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]) {
  const expWells = experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
  const PtValues = expWells.map((x) => x.protein_conc);
  const MostCommonPt = PtValues.sort((a, b) => PtValues.filter((v) => v === a).length - PtValues.filter((v) => v === b).length).pop();
  bindingExperiment.params.Tr = MostCommonPt;
}

export function parseConc(label: string): number {
  if (label.includes("uM") || label.includes("μM")) {
    const trimmed_label = label.replace("uM", "").replace("μM", "").trim();
    return parseFloat(trimmed_label) / 10 ** 6;
  } else if (label.includes("mM")) {
    const trimmed_label = label.replace("mM", "").trim();
    return parseFloat(trimmed_label) / 10 ** 3;
  } else {
    return parseFloat(label) / 10 ** 6;
  }
}

export function clearArray(array: []) {
  if (array.length > 0) {
    array.splice(0, array.length);
  }
}

export function getExperimentWell(index: number, experimentWells: ExperimentWell[]): ExperimentWell {
  return experimentWells.find((x) => x.id === index);
}
export function getExperimentWells(indexes: number[], experimentWells: ExperimentWell[]): ExperimentWell[] {
  const filtered_expWells = experimentWells.filter((x) => indexes.includes(x.id));
  const ordered_expWells: ExperimentWell[] = [];
  indexes.forEach((index) => {
    ordered_expWells.push(filtered_expWells.find((x) => x.id === index));
  });
  return ordered_expWells;
}

export function getBindingExperimentWells(bindingExperiment: BindingExperiment, experimentWells: ExperimentWell[]): ExperimentWell[] {
  return experimentWells.filter((x) => bindingExperiment.expPointIndexes.includes(x.id));
}

export function toArray(data: number | number[]): number[] {
  if (Array.isArray(data)) return data;
  else return [data];
}

export function copyExperimentWells(originalExperimentWells: ExperimentWell[]) {
  const tempExperimentWells: ExperimentWell[] = [];
  originalExperimentWells.forEach((expWell: ExperimentWell) => {
    const tempExpWell = (({ id, name, protein, ligand, ligand_conc, protein_conc, i_id, file_id, tm_model_params }) => ({
      id,
      name,
      protein,
      ligand,
      ligand_conc,
      protein_conc,
      i_id,
      file_id,
      tm_model_params,
    }))(expWell);
    tempExperimentWells.push(tempExpWell);
  });
  return tempExperimentWells;
}

export function NumberIsBetween(value: number, min: number, max: number, inclusive = false) {
  if (inclusive) return value >= min && value <= max;
  else return value > min && value < max;
}

export function formatKb(value: number, precision = 3, format: "Kd" | "Kb" = "Kd", unit: boolean | "onlyunit" = true): string {
  if (typeof value == "string") {
    value = Number.parseFloat(value);
  }

  if (Number.isNaN(value) || value == null || value.toString().length == 0) {
    if (format == "Kd") {
      if (unit == "onlyunit") return "M";
      else if (unit == true) return "- M";
      else return "-";
    } else {
      if (unit == "onlyunit") return "M<sup>-1</sup>";
      else if (unit == true) return "- M<sup>-1</sup>";
      else return "-";
    }
  }

  if (format === "Kd") {
    const log = -Math.log10(1 / value);
    let textUnit = "M";
    let textValue = "0";
    switch (true) {
      case value === 0 || value === null:
        [textValue, textUnit] = ["0", "M"];
        break;
      case log >= 15:
        [textValue, textUnit] = [((1 / value) * 10 ** 18).toPrecision(precision), "aM"];
        break;
      case log >= 13:
        [textValue, textUnit] = [((1 / value) * 10 ** 15).toPrecision(precision), "fM"];
        break;
      case log >= 11:
        [textValue, textUnit] = [((1 / value) * 10 ** 12).toPrecision(precision), "pM"];
        break;
      case log >= 7:
        [textValue, textUnit] = [((1 / value) * 10 ** 9).toPrecision(precision), "nM"];
        break;
      case log > 4:
        [textValue, textUnit] = [((1 / value) * 10 ** 6).toPrecision(precision), "μM"];
        break;
      case log >= 3:
        [textValue, textUnit] = [((1 / value) * 10 ** 3).toPrecision(precision), "mM"];
        break;
      case log < 3:
        [textValue, textUnit] = [(1 / value).toPrecision(precision), "M"];
        break;
      default:
        [textValue, textUnit] = [(1 / value).toPrecision(precision), "M"];
        break;
    }

    if (unit == "onlyunit") return textUnit;
    else if (unit == true) return `${textValue} ${textUnit}`;
    else return textValue;
  } else {
    const splitString = value.toExponential(precision - 1).split("e"); //[1.53, +7]
    if (value == 0) return "0 M<sup>-1</sup>";
    return unit
      ? `${splitString[0]}·10<sup> ${splitString[1].substring(1)} </sup>${unit ? "M<sup>-1</sup>" : ""}`
      : `${splitString[0]}·10<sup> ${splitString[1].substring(1)}</sup>`;
  }
}

export function MultiSelect(item: object, allItems: object[], selectedItems: object[], evt: MouseEvent): object[] {
  if (!evt.shiftKey && evt.ctrlKey) {
    const index = selectedItems.findIndex((x) => x === item);

    if (index > -1) selectedItems.splice(index, 1);
    else selectedItems.push(item);
  } else if (evt.shiftKey && !evt.ctrlKey) {
    if (selectedItems.length === 0) selectedItems = [item];
    else {
      const itemIndex = allItems.findIndex((x) => x === item);

      const selectedIndexes = selectedItems.map((x) => allItems.indexOf(x));
      const maxIndex = Math.max(...selectedIndexes);
      const minIndex = Math.min(...selectedIndexes);

      if (itemIndex > maxIndex) {
        selectedItems = allItems.filter((_, i) => i >= minIndex && i <= itemIndex);
      } else if (itemIndex < minIndex) {
        console.log("min select");
        selectedItems = allItems.filter((_, i) => i >= itemIndex && i <= maxIndex);
      } else if (itemIndex <= maxIndex && itemIndex >= minIndex) {
        selectedItems = [item];
      } else if (selectedItems.length === 1 && selectedItems[0] === item) {
        selectedItems = [];
      }
    }
  } else {
    if (selectedItems.includes(item)) selectedItems = [];
    else selectedItems = [item];
  }

  return selectedItems;
}

export const ParamDict: Record<string, string> = {
  DuH_Tr: "Δ<sub>u</sub><i>H</i><sub><i>T</i><sub>r</sub></sub>",
  DuCp: "Δ<sub>u</sub><i>C</i><sub>p</sub>",
  DbH_T0: "Δ<sub>b</sub><i>H</i><sub><i>T</i><sub>0</sub></sub>",
  DbCp: "Δ<sub>b</sub><i>C</i><sub>p</sub>",
  Tm: "<i>T</i><sub>m</sub>",
  T0: "<i>T</i><sub>0</sub>",
  Tr: "<i>T</i><sub>r</sub>",
  Kb: "<i>K</i><sub>b</sub>",
  Kb_obs: "<i>K</i><sub>b obs</sub>",
  Kd: "K<sub>d</sub>",
  Kd_obs: "K<sub>d obs</sub>",
  dH: "d<i>H</i>",
  DH: "Δ<i>H</i>",
  dCp: "d<i>C</i><sub>p</sub>",
  DCp: "Δ<i>C</i><sub>p</sub>",
  Pt: "<i>P</i><sub>t</sub>",
  uM: "μM",
  "M-1": "M<sup>-1</span>",
};

export function ParamHTML(key: string, options = { italics: false }): string {
  return ParamDict[key] ?? (options.italics ? `<i>${key}</i>` : key);
}

type DownloadFileOptions = { anchor: HTMLElement | Document; mimetype: string };

export function DownloadFile(
  data: string,
  filename: string,
  options: DownloadFileOptions = {
    anchor: document,
    mimetype: "data:text/plain;charset=utf-8",
  }
) {
  const element = document.createElement("a");

  if (options.anchor == document) {
    options.anchor = document.body;
  }

  element.setAttribute("href", `${options.mimetype},${encodeURIComponent(data)}`);
  element.setAttribute("download", filename);
  element.style.display = "none";
  options.anchor.appendChild(element);
  element.click();
  options.anchor.removeChild(element);
}

export function CopyToClipboard(text: string) {
  return navigator.clipboard.writeText(text).then(
    () => true,
    () => false
  );
}

export function MergeFiles(appDataSessions: AppData[]) {
  const mergedSession = new AppData();

  let expWellCount = 1;
  let bindingExperimentCount = 1;
  let originFileCount = 1;
  for (let index = 0; index < appDataSessions.length; index++) {
    const session = appDataSessions[index];
    const wellMap: { old: number; new: number }[] = [];
    for (let index2 = 0; index2 < session.experimentWells.length; index2++) {
      const expWell = session.experimentWells[index2];
      const oldId = expWell.id;
      const newId = expWellCount;
      wellMap.push({ old: oldId, new: newId });
      expWell.id = newId;
      expWellCount++;
    }

    session.bindingExperiments.forEach((bindingExperiment) => {
      bindingExperiment.expPointIndexes = bindingExperiment.expPointIndexes.map((id) => wellMap.find((x) => x.old === id).new);
    });

    session.bindingExperiments.forEach((bindingExperiment) => {
      const newId = bindingExperimentCount;
      bindingExperiment.id = newId;
      bindingExperimentCount++;
    });

    session.originFiles.forEach((originFile) => {
      const oldId = originFile.id;
      const newId = originFileCount;
      originFileCount++;
      originFile.id = newId;
      session.experimentWells.forEach((expWell) => {
        expWell.file_id === oldId ? (expWell.file_id = newId) : null;
      });
    });

    mergedSession.experimentWells.push(...session.experimentWells);
    mergedSession.bindingExperiments.push(...session.bindingExperiments);
    mergedSession.originFiles.push(...session.originFiles);
  }

  return mergedSession;
}