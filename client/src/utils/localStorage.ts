import {
  AppData,
  AppSettings,
  BindingThermodynamicPreset,
  DefaultModelParameters,
  DevelopmentSettings,
  OriginFile,
  SessionInfo,
  TabPreferences,
} from "@/models";
import { useAppData, useAppSettings } from "@/store";
import localForage from "localforage";
import { v4 as uuidv4 } from "uuid";
import { versionFile } from "@/components/Main/Changelog";

localForage.config({
  name: "Thermott",
  version: 1.0,
  storeName: "ThermottData", // Should be alphanumeric, with underscores.
  description: "-",
});

export function CompatibilityFix(appData: AppData) {
  if (!appData) return;

  //old session that don't have 'sessionInfo'
  if (!appData.sessionInfo) {
    appData.sessionInfo = new SessionInfo();
  }
  //old session that don't have 'errorBindingExpGroups'
  if (!appData.errorBindingExpGroups) {
    appData.errorBindingExpGroups = [];
  }

  //1.6 -> 1.7
  //Origin file format changed due to File object not being serializable
  for (let index = 0; index < appData.originFiles.length; index++) {
    const originFile = appData.originFiles[index];
    if ((originFile as unknown as { filename: string }).filename && !originFile.name) {
      originFile.name = (originFile as unknown as { filename: string }).filename;
      const newOriginFile: OriginFile = { id: originFile.id, name: (originFile as unknown as { filename: string }).filename };
      appData.originFiles[index] = newOriginFile;
    }
  }
  //

  //1.12 -> 1.13
  //Each binding experiment now has an UUID
  for (const bindingExperiment of appData.bindingExperiments) {
    bindingExperiment.uuid ??= uuidv4();
  }

  //1.13 -> 1.14
  //Added ActiveLigandFraction into binding parameters
  for (const bindingExperiment of appData.bindingExperiments) {
    bindingExperiment.params.ActiveLigandFraction ??= 1;
  }

  //1.14 -> 1.15
  if ((appData.sessionInfo as unknown as Record<string, string>)["clientVersion"]) {
    appData.sessionInfo.createdClientVersion = (appData.sessionInfo as unknown as Record<string, string>)["clientVersion"];
  }

  //Renew current client version to the newest (indicating migration)
  appData.sessionInfo.currentClientVersion = versionFile.CurrentVersion;

  // //Generic wrong date format fix
  // if (appData.sessionInfo?.experimentDate && appData.sessionInfo?.experimentDate.length == 6 && !Number.isNaN(parseInt(appData.sessionInfo?.experimentDate))){
  //   const oldDate = appData.sessionInfo?.experimentDate;
  //   appData.sessionInfo.experimentDate = `20${oldDate.slice(0, 2)}-${oldDate.slice(2, 4)}-${oldDate.slice(4, 6)}`
  // }

  return appData;
}

export function Delete_AppData() {
  const appData = useAppData();

  appData.sessionInfo = new SessionInfo();
  appData.experimentWells.splice(0, appData.experimentWells.length);
  appData.bindingExperiments.splice(0, appData.bindingExperiments.length);
  appData.originFiles.splice(0, appData.originFiles.length);
  appData.errorBindingExpGroups.splice(0, appData.errorBindingExpGroups.length);
}

export async function SaveAppSetting_LocalStorage() {
  const appSettings = useAppSettings();
  await localForage.setItem("appSettings", appSettings);
}

export async function loadDefaultBindingModelPresets() {
  const appSettings = useAppSettings();

  const protein_presets_res = await fetch("/assets/binding_model_presets/presets.json");
  const protein_presets: BindingThermodynamicPreset[] = await protein_presets_res.json();
  for (let index = 0; index < protein_presets.length; index++) {
    protein_presets[index].id = index + 1;
  }
  appSettings.BindingParamPresets = protein_presets;
  await SaveAppSetting_LocalStorage();
}

export async function SaveAppData_LocalStorage() {
  const appData = useAppData();
  await localForage.setItem("appData", appData);
}

export function Load_Appdata(loadedAppData: AppData) {
  const appData = useAppData();

  Delete_AppData();
  loadedAppData = CompatibilityFix(loadedAppData);
  appData.sessionInfo = loadedAppData?.sessionInfo || new SessionInfo();
  if (loadedAppData?.experimentWells) appData.experimentWells.push(...loadedAppData?.experimentWells);
  if (loadedAppData?.bindingExperiments) appData.bindingExperiments.push(...loadedAppData?.bindingExperiments);
  if (loadedAppData?.originFiles) appData.originFiles.push(...loadedAppData?.originFiles);
  if (loadedAppData?.errorBindingExpGroups) appData.errorBindingExpGroups.push(...loadedAppData?.errorBindingExpGroups);
  SaveAppData_LocalStorage();
}

export async function InitLocalStorage() {
  const appData = useAppData();
  const appSettings = useAppSettings();
  //AppData
  const localAppData: AppData = await localForage.getItem("appData");
  appData.sessionInfo = new SessionInfo();
  appData.bindingExperiments = [];
  appData.experimentWells = [];
  appData.originFiles = [];
  appData.errorBindingExpGroups = [];
  Load_Appdata(localAppData);
  console.log(appData);

  //AppSettings
  const localAppSettings: AppSettings = await localForage.getItem("appSettings");

  if (localAppSettings !== null) {
    appSettings.BindingParamPresets = localAppSettings?.BindingParamPresets || [];
    appSettings.DevelopmentSettings = localAppSettings?.DevelopmentSettings || new DevelopmentSettings();
    appSettings.TabPreferences = localAppSettings?.TabPreferences || new TabPreferences();
    appSettings.DefaultModelParameters = localAppSettings?.DefaultModelParameters || new DefaultModelParameters();
    appSettings.AlwaysShowRawFileNames = localAppSettings?.AlwaysShowRawFileNames || false;
  } else {
    await loadDefaultBindingModelPresets();

    await SaveAppSetting_LocalStorage();
  }

  return { appData, appSettings };
}

export function Read_AppData(loadedAppData: AppData) {
  loadedAppData = CompatibilityFix(loadedAppData);
  return loadedAppData;
}
