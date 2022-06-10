import { format } from "date-fns";
import { ExperimentRequest } from "./components/DatabaseTab/database";
import { versionFile } from "@/components/Main/Changelog";

export class ExperimentWell {
  public name?: string;
  public id?: number;
  //public file_index?: number;
  public i_id?: string;
  public file_id?: number;
  public temperature?: number[];
  public fluorescence?: Fluorescence[];
  public active_gain?: number;
  public fit_points?: boolean[];
  public origin_filename?: string;
  public derivative?: { x: number[]; y: number[] };
  public tm_model_params?: TmModelParams;

  public ligand?: string;
  public protein?: string;
  public ligand_conc?: number;
  public protein_conc?: number;
  public comment?: string;
}

export interface TmModelParams_Thermodynamic extends TmModelParams {
  dH?: number;
  dCp?: number;
  yf?: number;
  yfs?: number;
  yu?: number;
  yus?: number;
}

export interface TmModelParams_BoltzmannTrans extends TmModelParams {
  k?: number;
  yf?: number;
  yfs?: number;
  yu?: number;
  yus?: number;
}

export interface TmModelParams_Simgoid5Trans extends TmModelParams {
  k?: number;
  d?: number;
  yf?: number;
  yfs?: number;
  yu?: number;
  yus?: number;
}

export type TmModelParams_Derivative = TmModelParams;

export interface TmModelParams {
  Model: string;
  Tm: number;
}

export class OriginFile {
  public lastModified?: number;
  public name: string;
  public size?: number;
  public type?: string;
  public file?: string;
  public id: number;
}

export class Fluorescence {
  public id: number;
  public name: string;
  public data: number[];
}

export class XYpoint {
  public x: number;
  public y: number;
}

export class XYarray {
  public x: number[];
  public y: number[];
}

export interface NumberRange {
  min: number;
  max: number;
}

export class BindingExperiment {
  public id: number;
  public uuid: string;
  public name: string;
  public protein: string;
  public ligand: string;
  public expPointIndexes: number[];
  public params: BindingModelParams;
  public comment: string;
  public PLBDAnnotation?: ExperimentRequest;
}

export class MetaBindingExperiment extends BindingExperiment {
  public protein_conc?: number;
  public max_ligand_conc?: number;
  public dilution_number?: number;
  public dilution_factor?: number;
  public DuH_Tr?: number;
}

export class BindingModelParams implements BindingThermodynamicParams {
  public DuH_Tr: number = null;
  public DuCp: number = null;
  public DbH_T0: number = null;
  public DbCp: number = null;
  public Tr: number = null;
  public T0 = 37;
  public Kb: number = null;
  public Pt: number = null;
  public Kb_confidence_interval?: number[] = null;
  public ActiveLigandFraction = 1;
}

export interface BindingThermodynamicParams {
  DuH_Tr: number;
  DuCp: number;
  DbH_T0: number;
  DbCp: number;
}

export interface ErrorBindingExpGroup {
  id: number;
  name: string;
  bindingExpIDs?: number[];
  averageKb: number;
  errorKb: number[] | number;
}

export class AppData {
  public sessionInfo: SessionInfo = new SessionInfo();
  public experimentWells: ExperimentWell[] = [];
  public bindingExperiments: BindingExperiment[] = [];
  public originFiles: OriginFile[] = [];
  public errorBindingExpGroups: ErrorBindingExpGroup[] = [];
}

export class DefaultModelParameters {
  DefaultBindingModelT0 = 37; //degressCelsius
}

export class AppSettings {
  BindingParamPresets: BindingThermodynamicPreset[] = [];
  DevelopmentSettings: DevelopmentSettings = new DevelopmentSettings();
  TabPreferences = new TabPreferences();
  DefaultModelParameters = new DefaultModelParameters();
  AlwaysShowRawFileNames = false;
  ShowPLBDIntegration = false;
}

export class SessionInfo {
  experimentDate: string;
  sessionDate: string = format(new Date(), "yyyy-MM-dd");
  name = "";
  author = "";
  currentClientVersion = versionFile.CurrentVersion;
  createdClientVersion = versionFile.CurrentVersion;
}

export interface BindingThermodynamicPreset extends BindingThermodynamicParams {
  id: number;
  protein: string;
  protein_aliases: string[];
}

export class DevelopmentSettings {
  ShowReportMatplotlibTest = false;
  DatabaseURL = "";
  PLBDIntegration = false;
}

export class TabPreferences {
  Meta_ExperimentBuilder_ExperimentWellList_CompactList = false;
  Meta_ExperimentBuilder_ExperimentWellList_ShowCopies = false;
}
