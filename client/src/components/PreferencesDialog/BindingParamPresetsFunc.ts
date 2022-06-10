import { BindingThermodynamicPreset } from "@/models";
import { useAppSettings } from "@/store";
import { SaveAppSetting_LocalStorage } from "@/utils/localStorage";

export async function Create(newPreset: BindingThermodynamicPreset): Promise<void> {
  const appSettings = useAppSettings();
  let newID = 1;
  if (appSettings.BindingParamPresets.length !== 0) {
    newID = Math.max(...appSettings.BindingParamPresets.map((x) => x.id)) + 1;
  }
  newPreset.id = newID;
  appSettings.BindingParamPresets.push(newPreset);

  await SaveAppSetting_LocalStorage();
}

export async function Delete(presetToDelete: BindingThermodynamicPreset): Promise<void> {
  const appSettings = useAppSettings();
  const index = appSettings.BindingParamPresets.findIndex((x) => x.id === presetToDelete.id);
  appSettings.BindingParamPresets.splice(index, 1);

  await SaveAppSetting_LocalStorage();
}

export async function Edit(editedPreset: BindingThermodynamicPreset): Promise<void> {
  const appSettings = useAppSettings();
  const index = appSettings.BindingParamPresets.findIndex((x) => x.id === editedPreset.id);
  Object.assign(appSettings.BindingParamPresets[index], editedPreset);

  await SaveAppSetting_LocalStorage();
}

export function CheckUniqueProtein(protein: string) {
  const appSettings = useAppSettings();
  if (protein === null || protein.trim() === "") return false;
  protein = protein.toLowerCase().trim();
  const existingProteinAliases = appSettings.BindingParamPresets.map((x) => [
    x.protein.toLowerCase().trim(),
    ...(x.protein_aliases ? x.protein_aliases.map((x) => x.toLowerCase().trim()) : []),
  ]).flat();

  const unique = existingProteinAliases.find((x) => x === protein);
  if (unique === undefined) return true;
  else return "Not unique protein";
}

export function CheckUniqueAliasFunction(presetID: number, isEdit = false): (protein: string) => boolean {
  const appSettings = useAppSettings();
  let bindingPresets = appSettings.BindingParamPresets;

  if (presetID !== null) {
    bindingPresets = bindingPresets.filter((x) => x.id !== presetID);
  }

  return (protein: string): boolean => {
    if (protein === null || protein.trim() === "") return false;
    protein = protein.toLowerCase().trim();
    const existingProteinAliases = bindingPresets
      .map((x) => [x.protein.toLowerCase().trim(), ...x.protein_aliases.map((x) => x.toLowerCase().trim())])
      .flat();

    if (!isEdit) {
      const unique = existingProteinAliases.find((x) => x === protein);
      return unique === undefined;
    } else {
      const count = existingProteinAliases.filter((x) => x === protein).length;
      if (count > 1) return false;
      else return true;
    }
  };
}
