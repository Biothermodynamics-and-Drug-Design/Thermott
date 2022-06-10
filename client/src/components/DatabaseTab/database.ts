import { AppData } from "@/models";

export type DbType = "protein" | "protein_batch" | "compound" | "compound_batch" | "author" | "device";

export interface DatabaseItem {
  type: DbType;
  uuid: string;
  id: string | number;
}

export interface Author extends DatabaseItem {
  name: string;
  surname: string;
  birth_name: string;
  middle_names: string;
}

export interface Device extends DatabaseItem {
  manufacturer: string;
  model: string;
  notes: string;
  serial: string;
}

export interface Buffer extends DatabaseItem {
  //"id": 1, "label": "Pi_6,8", "notes": null, "ph": 6.8, "salt": "NaCl", "salt_concentration": 100, "system": "Pi"
  label: string;
  notes: string;
  pH: number;
  salt: string;
  salt_concentration: number;
  system: string;
}

export interface Protein extends DatabaseItem {
  id: number;
  label: string;
  name: string;
  notes: string;
  sequence: string;
  molecular_weight: number;
  isoelectric_point: number;
}

export interface ProteinBatch extends DatabaseItem {
  id: number;
  label: string;
  plasmid: string;
  notes: string;
  protein_id: number;
  protein_label: string;
  purification_date: string;
  protein_uuid: string;
  uuid: string;
}

export interface Compound extends DatabaseItem {
  id: number;
  date: string;
  name: string;
  compound_id: number;
  label: string;
  notes: string;
  generic_name: string;
}

export interface CompoundBatch extends DatabaseItem {
  date: string;
  compound_name: string;
  compound_generic_name: string;
  compound_id: number;
  compound_uuid: string;
  label: string;
  notes: string;
}

export interface ExperimentTSA extends DatabaseItem {
  label: string;
  uuid: string;
  ph: string;
  temperature: string;
  dmso_concentration: number;
  kb_obs: number;
  reliability: number;
  notes: string;
}

export interface ExperimentTSA_ProteinCompoundView extends ExperimentTSA {
  protein_label: string;
  compound_name: string;
}

export interface ExperimentRequest {
  enabled: boolean;
  //bindingExperimentID: number;
  label: string;
  //notes: string;
  ph: number;
  //temperature: number;
  reliability: number;
  dmso_concentration: number;
  date: string;
  datestamp: string;
  author: Author;
  device: Device;
  buffer: Buffer;
  compound?: Compound;
  compound_batch?: CompoundBatch;
  protein?: Protein;
  protein_batch?: ProteinBatch;
  step_count: number;
  dilution_factor: number;
  compound_max_concentration: number;
  buffer_concentration: number;
}

export class DBdata {
  author: Author[] = [];
  device: Device[] = [];
  buffer: Buffer[] = [];
  protein: Protein[] = [];
  compound: Compound[] = [];
  protein_batch: ProteinBatch[] = [];
  compound_batch: CompoundBatch[] = [];
  file: File[] = [];
}

export interface File extends DatabaseItem {
  uri?: string;
  file_name: string;
  mimetype?: string;
  notes: string;
}

export interface FileRequest {
  id: number;
  originFile_id: number;
  file: File;
  name: string;
  notes?: string;
}

export interface AnalysisFileRequest {
  file: File;
  notes?: string;
  sessionFileName?: string;
}

export class DatabaseInfo {
  name = "BVTS_test";
  baseApiLink = "/plbd";
  get apiLink() {
    return `${this.baseApiLink}/${this.name}`;
  }
  get dbLink() {
    return `https://plbd.ibt.lt/db/${this.name}`;
  }
}

export class DatabasePageModel {
  dbData: DBdata = new DBdata();
  databaseInfo = new DatabaseInfo();
  // experimentRequests: ExperimentRequest[] = [];
  initialExperimentLabel = "";
  step = 1;
  files: FileRequest[] = [];
  auth: Auth = { username: "", password: "" };
  isDbLoaded = false;
  analysisFile: AnalysisFileRequest = null;
  session: AppData = null;
  validations = {
    proteinCompoundDuplicates: [] as ExperimentTSA_ProteinCompoundView[],
    experimentTsaUuidDuplicates: [] as ExperimentTSA[],
  };
  submissionResult?= { data: [] as DatabaseItem[], errors: [] as { detail: string }[] };
  submissionResponse?: Response = null;
}

export interface PLBDExperimentTSA {
  type: "experiment_tsa";
  attributes: {
    uuid: string;
    author_id?: number | string;
    device_id?: number | string;
    buffer_id?: number | string;
    label: string;
    private_notes: string;
    temperature: number;
    reliability: number;
    dmso_concentration: number;
    kb_obs: number;
    ph: number;
    date: string;
    datestamp: string;
    compound_batch_id?: number | string;
    protein_batch_id: number;
    buffer_concentration: number; //mM
    compound_max_concentration: number;
    dilution_factor: number;
    step_count: number;
    protein_concentration: number;
  };
  relationships: {
    tsa_file: {
      data: { type: "tsa_file"; attributes: { file_id: string | number } }[];
    };
  };
}

export interface Auth {
  username: string;
  password: string;
}

export const databases = ["BVTS", "BVTS_test"];
