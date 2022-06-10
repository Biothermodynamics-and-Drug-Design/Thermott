import { BindingModelParams, ExperimentWell, TmModelParams, XYarray, ErrorBindingExpGroup } from "@/models";

export interface ThermottResponse {
  status: number;
  ok: boolean;
  message?: string;
  data?: any;
}

async function ServerCall(url: RequestInfo, settings: RequestInit): Promise<ThermottResponse> {
  const res = await fetch(url, settings);
  if (!res.ok) {
    let data = null;
    try {
      data = await res.json();
      if (data && data.detail) {
        if (Array.isArray(data.details))
          data.details = data.details.map((x: Record<string, unknown>) => JSON.stringify(x) as string).join("\n");
        const result: ThermottResponse = { status: res.status, ok: res.ok, message: data.detail, data: null };
        return result;
      }
    } catch (error) {
      const result: ThermottResponse = { status: 503, ok: res.ok, message: "Could not connect to server", data: null };
      return result;
    }
  } else {
    const result: ThermottResponse = { status: res.status, ok: res.ok, message: null, data: await res.json() };
    return result;
  }
}

export interface BindingFit_KbOnly_RequestInput {
  C: number[];
  Tm: number[];
  params: BindingModelParams;
}

interface BindingFit_KbOnly_RequestResult_Data {
  Kb: number;
  confInterval?: [number, number];
}

interface BindingFit_KbOnly_RequestResult extends ThermottResponse {
  data: BindingFit_KbOnly_RequestResult_Data;
}

export async function FitBinding_KbOnly(request: BindingFit_KbOnly_RequestInput): Promise<BindingFit_KbOnly_RequestResult> {
  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = (await ServerCall("/api/BindingFit_KbOnly", settings)) as BindingFit_KbOnly_RequestResult;
  return response;
}

export async function Predict_dCp(request: { n_residues: number; molecular_weight: number }): Promise<ThermottResponse & { dCp: number }> {
  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = (await ServerCall("/api/Predict_dCp", settings)) as ThermottResponse & { dCp: number };
  response.dCp = response.data;
  return response;
}

export async function Predict_dHu(request: { n_residues: number; molecular_weight: number }): Promise<ThermottResponse & { dHu: number }> {
  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = (await ServerCall("/api/Predict_dHu", settings)) as ThermottResponse & { dHu: number };
  response.dHu = response.data;
  return response;
}

// export async function FitTmOld(request: { data: XYarray; tm_model: string }): Promise<ThermottResponse & { tm_params: TmModelParams }> {
//   const settings = {
//     method: "POST",
//     headers: {
//       Accept: "application/json",
//       "Content-Type": "application/json",
//     },
//     body: JSON.stringify(request),
//   };
//   const response = (await ServerCall("/api/FitTm", settings)) as ThermottResponse & { tm_params: TmModelParams };
//   response.tm_params = response.data;
//   return response;
// }

export async function FitTm(
  request: { id: number; data: XYarray; tm_model: string }[]
): Promise<ThermottResponse & { FitData: { id: number; tm_params: TmModelParams; ok: boolean }[] }> {
  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = (await ServerCall("/api/FitTm", settings)) as ThermottResponse & {
    FitData: { id: number; tm_params: TmModelParams; ok: boolean }[];
  };
  response.FitData = response.data;
  return response;
}

export async function CalculateBindingExperimentGroupError(
  request: BindingModelParams[]
): Promise<Omit<ThermottResponse, "data"> & { data: ErrorBindingExpGroup }> {
  const settings = {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(request),
  };
  const response = (await ServerCall("/api/CalculateBindingExpGroupError", settings)) as ThermottResponse & { data: ErrorBindingExpGroup };
  return response;
}

export const RawDataTypes: RawUploadTypeDisplay[] = [
  {
    value: "GenericCSV",
    text: "Generic CSV (.csv)",
  },
  {
    value: "RotorGeneQ_TExcel",
    text: "RotorGeneQ Excel data sheet (transposed) (.csv)",
  },
  {
    value: "RotorGeneQ_Rex",
    text: "RotorGene experiment (.rex) (Experimental)",
  },
  {
    value: "TmOnlyCSV",
    text: "Melting temperature only (.csv)",
  },
  {
    value: "Biorad_cfx",
    text: "Biorad CFX (.txt)",
  },
  {
    value: "Applied_biosystems_sds",
    text: "Applied Biosystems SDS (.txt)",
  },
  {
    value: "Agilent_mxpro",
    text: "Agilent MxPro (.txt)",
  },
];

export type RawUploadType = "GenericCSV"
  | "RotorGeneQ_TExcel" | "RotorGeneQ_Rex"
  | "TmOnlyCSV" | "Biorad_cfx"
  | "Applied_biosystems_sds" | "Agilent_mxpro";

interface RawUploadTypeDisplay {
  value: RawUploadType;
  text: string;
  disabled?: boolean;
}

export async function UploadRawData(request: { uploadFile: File; fileType: RawUploadType; tmModel: string }) {
  const data = new FormData();
  data.append("file", request.uploadFile);
  data.append("file_type", request.fileType);
  data.append("tm_model", request.tmModel);
  const settings = {
    method: "POST",
    body: data,
  };

  const response = (await ServerCall("/api/UploadRawData", settings)) as Omit<ThermottResponse, "data"> & {
    data: ExperimentWell[];
  };
  return response;
}
