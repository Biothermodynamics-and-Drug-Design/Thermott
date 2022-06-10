import enum
from unittest import skip
import pandas as pd
from io import StringIO

# from exp_well_class import exp_well
from app.models.models import (
    ExperimentWell,
    FluorescenceGain,
    OriginFile,
    TmModelParams,
)
from typing import List, Tuple
import numpy as np


from defusedxml.ElementTree import fromstring


def RawDataParse(data, filename: str, file_type: str):
    if file_type == "RotorGeneQ_TExcel":
        return Parse_CorbettQGene_TExcel(data, filename)
    elif file_type == "RotorGeneQ_Rex":
        return Parse_CorbettQGene_Rex(data, filename)
    elif file_type == "GenericCSV":
        return Parse_GenericCSV(data, filename)
    elif file_type == "TmOnlyCSV":
        return TmOnlyCSV(data, filename)
    elif file_type == "Biorad_cfx":
        return Parse_BioradCFX(data, filename)
    elif file_type == "Applied_biosystems_sds":
        return Parse_AppliedBiosystemsSDS(data, filename)
    elif file_type == "Agilent_mxpro":
        return Parse_AgilentMxPro(data, filename)
    else:
        pass


def TmOnlyCSV(data, filename: str):
    datatable = pd.read_csv(StringIO(data))

    datatable.applymap(lambda x: x.strip().lower() if isinstance(x, str) else x)

    datatable.columns = map(str.lower, datatable.columns)
    datatable.columns = map(str.strip, datatable.columns)

    if "tm" not in datatable.columns:
        raise Exception("No Tm column")

    experimentWells = []

    for index, row in datatable.iterrows():

        sample_name = row["name"] if "name" in row else None
        sample_number = row["id"] if "id" in row else None
        Tm = row["tm"]
        experimentWell = ExperimentWell(
            id=-1,
            name=sample_name,
            i_id=sample_number,
            tm_model_params=TmModelParams(Tm=Tm, Model="none"),
        )
        experimentWells.append(experimentWell)

    originFile = OriginFile(id=-1, filename=filename)
    return experimentWells


def Parse_CorbettQGene_TExcel(
    data, filename: str
) -> Tuple[OriginFile, List[ExperimentWell]]:
    lines = data.split("\n")
    gain_names = [
        line.split("Channel Melt A.")[1].split(",")[0]
        for line in lines
        if ("Channel Melt A" in line)
    ]

    lines = [
        line
        for line in lines
        if (line) and ("ID" not in line) and ("Channel Melt A" not in line)
    ]  # remove empty lines or unneeded lines
    col_names = [line for line in lines if (line) and ("Page 1" in line)][0].split(",")
    col_names = [name.replace('"', "").strip() for name in col_names][1:]

    grouped_data = []
    limits = []
    for n, line in enumerate(lines):
        if "Page 1" in line:
            limits.append(n)
    limits.append(len(lines))
    for n in range(len(limits) - 1):
        string_table = "\n".join(lines[limits[n] : limits[n + 1]])
        grouped_data.append(pd.read_csv(StringIO(string_table)))

    dictList = []
    for n, data in enumerate(grouped_data):
        table = data.loc[:, data.columns != "Page 1"]
        mx_i = table.values.max()
        mn_i = table.values.mean()
        dictList.append({"gain": n, "max": mx_i, "avg": mn_i})

    dictList = sorted(dictList, key=lambda i: i["avg"], reverse=True)
    active_gain_data = dictList[-1]
    for n, i in enumerate(dictList):
        if i["avg"] > active_gain_data["avg"] and i["max"] < 100:
            active_gain_data = dictList[n]
    active_gain = active_gain_data["gain"]

    export_data: List[ExperimentWell] = []
    g = grouped_data[-1]
    g.rename(columns={"Page 1": "Temperature"}, inplace=True)
    for n, column in enumerate(g.columns[1:]):
        # sample_name = column
        sample_name = col_names[n].strip()
        sample_number = str(n + 1)  # temp, turėtų būti paimta iš csv
        temperature = g["Temperature"].dropna().to_list()
        fluorescence_gains = []
        for index, i in enumerate(grouped_data):
            fluorescence_data = i[column].dropna()
            fluorescence_data = [round(number, 3) for number in fluorescence_data]
            gain_name = gain_names[index] if gain_names[index] else ""
            fluorescence_gain = CreateFluorescenceGain(
                id=(index + 1), name=gain_name, fluorescence_data=fluorescence_data
            )
            fluorescence_gains.append(fluorescence_gain)

        # fluorescence[-1] = np.around(fluorescence[-1],3).tolist()

        # active_gain += 1
        exp = CreateExperimentWell(
            name=sample_name,
            i_id=sample_number,
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=active_gain,
        )
        export_data.append(exp)
    # originFile = OriginFile(id = -1, filename = filename)

    return export_data


def Parse_CorbettQGene_Rex(data: str, filename: str):
    root = fromstring(data)
    a = root.find("Samples").find("Page")
    samples = a.findall("Sample")

    f_channels = root.find("RawChannels").findall("RawChannel")
    f_values = [[] for i in f_channels]
    channel_names = []
    for f in f_channels:
        name = f.find("Name").text
        name = name.split(".")[1]
        channel_names.append(name)

    startTemp = float(f_channels[0].find("StartX").text)
    stepTemp = float(f_channels[0].find("StepX").text)

    export_data = []
    for i in samples:

        sample_number = i.find("ID").text
        sample_name = i.find("Name").text

        is_selected = i.find("Selected").text
        if is_selected == "False":
            continue

        fluorescence = []
        f_points = -1
        for n, f in enumerate(f_channels):
            index = int(sample_number) - 1
            ff = f.findall("Reading")[index].text.split(" ")
            ff = [round(float(i), 3) for i in ff]
            if f_points == -1 or len(ff) < f_points:
                f_points = len(ff)
            fluorescence.append(ff)
            f_values[n].append(ff)

        for f in fluorescence:
            f = f[0 : f_points - 1]

        temperature = [startTemp + i * stepTemp for i in range(f_points)]

        fluorescence_gains = []
        index = 1
        for fluorescence_data, gain_name in zip(fluorescence, channel_names):
            fluorescence_gain = CreateFluorescenceGain(
                id=index, name=gain_name, fluorescence_data=fluorescence_data
            )
            index += 1
            fluorescence_gains.append(fluorescence_gain)

        exp = CreateExperimentWell(
            name=sample_name,
            i_id=sample_number,
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=0,
        )
        export_data.append(exp)

    selected_gain = findOptimalGain(f_values)
    for i in export_data:
        i.active_gain = selected_gain + 1

    # originFile = OriginFile(id = -1, filename = filename)
    return export_data


def Parse_GenericCSV(data: str, filename: str) -> List[ExperimentWell]:
    datatable = pd.read_csv(StringIO(data))
    temperature = datatable.iloc[:, 0].to_list()
    sample_names = datatable.iloc[:, 1:].columns
    sample_names = [s.strip() for s in sample_names]
    fluorescences = datatable.iloc[:, 1:]

    export_data: List[ExperimentWell] = []

    for n, (name, f) in enumerate(zip(sample_names, fluorescences)):
        fluorescence_gains = [
            CreateFluorescenceGain(
                id=1, name="", fluorescence_data=fluorescences[f].tolist()
            )
        ]
        exp = CreateExperimentWell(
            name=name,
            i_id=str(n),
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=0,
        )
        export_data.append(exp)

    originFile = OriginFile(id=-1, filename=filename)
    return export_data


def Parse_BioradCFX(data: str, filename: str):
    data_lines = data.split("\n")
    data_lines = [x.strip() for x in data_lines]
    data = "\n".join(data_lines)

    table = pd.read_csv(StringIO(data), sep="\t")
    print(table)
    if len(table.columns) < 1 and table.columns[0] != "Temperature":
        return []

    table["Temperature"] = table["Temperature"].astype(float)

    temperature = table["Temperature"].to_list()

    export_data: List[ExperimentWell] = []

    for n, column in enumerate(table.columns[1:]):

        column_data = table[column].astype(float).to_list()

        fluorescence_gains = [
            CreateFluorescenceGain(id=1, name=column, fluorescence_data=column_data)
        ]
        experiment = CreateExperimentWell(
            name=column,
            i_id=str(n),
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=0,
        )

        export_data.append(experiment)

    return export_data


def Parse_AppliedBiosystemsSDS(data: str, filename: str):
    table = pd.read_csv(StringIO(data), skiprows=3, header=None, sep="\t")

    sep_index = table[table[1].str.contains("Raw Data")].index[0]

    temperature_table = table.loc[: sep_index - 1, :].reset_index(drop=True).T
    value_table = table.loc[sep_index + 1 :, :].reset_index(drop=True).T

    temperature_table.columns = temperature_table.loc[0, :]
    value_table.columns = value_table.loc[0, :]

    temperature_table = temperature_table.drop(0)
    value_table = value_table.drop(0)

    export_data: List[ExperimentWell] = []

    for n, column in enumerate(temperature_table.columns):

        temperature = temperature_table[column].astype(float).to_list()
        values = value_table[column].astype(float).to_list()

        fluorescence_gains = [
            CreateFluorescenceGain(id=1, name="none", fluorescence_data=values)
        ]

        experiment = CreateExperimentWell(
            name=column,
            i_id=str(n),
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=0,
        )

        export_data.append(experiment)

    return export_data


def Parse_AgilentMxPro(data: str, filename: str):
    print("testing")
    table = pd.read_csv(StringIO(data), skiprows=1, sep="\t")

    table["Temperature"] = table["Temperature"].astype(float)
    table["Fluorescence"] = table["Fluorescence"].astype(float)

    table = table.sort_values(by=["Well", "Temperature"])

    wells = table["Well"].unique()

    export_data: List[ExperimentWell] = []

    for n, well in enumerate(wells):

        well_table = table[table["Well"] == well]

        values = well_table["Fluorescence"].to_list()

        temperature = well_table["Temperature"].to_list()

        dyes = well_table["Dye"].unique()

        dye = ""
        if len(dyes) > 0:
            dye = dyes[0]

        fluorescence_gains = [
            CreateFluorescenceGain(id=1, name=dye, fluorescence_data=values)
        ]

        experiment = CreateExperimentWell(
            name=str(well),
            i_id=str(n),
            temperature=temperature,
            fluorescence=fluorescence_gains,
            active_gain=0,
        )

        export_data.append(experiment)
    return export_data


def CreateFluorescenceGain(name: str, fluorescence_data: List[float], id=-1):
    return FluorescenceGain(id=id, name=name, data=fluorescence_data)


# def CreateFluorescence(active_gain: int, fluorescence: List[FluorescenceGain]):
#     return Fluorescence(active_gain = active_gain, fluorescence = fluorescence)


def CreateExperimentWell(
    name: str,
    i_id: str,
    temperature: List[float],
    fluorescence: List[FluorescenceGain],
    active_gain: int = 0,
    tm_model_params=None,
    comment: str = None,
):
    id = -1
    derivative = {"x": [], "y": []}
    derivative = Derivative(temperature, fluorescence[active_gain].data)
    fit_points = [False for x in temperature]
    protein = None
    protein_conc = None
    ligand = None
    ligand_conc = None

    return ExperimentWell(
        name=name,
        id=id,
        i_id=i_id,
        temperature=temperature,
        fluorescence=fluorescence,
        active_gain=active_gain + 1,
        fit_points=fit_points,
        protein=protein,
        protein_conc=protein_conc,
        ligand=ligand,
        ligand_conc=ligand_conc,
        derivative=derivative,
        tm_model_params=tm_model_params,
        comment=comment,
    )


def Derivative(temperature, fluorescence):
    y = np.gradient(fluorescence).tolist()
    x = []
    for n, t in enumerate(temperature[:-1]):
        x.append((t + temperature[n + 1]) / 2)
    derivative = {"x": x, "y": y}
    return derivative


def findOptimalGain(f_gain_values):
    f_dict = []
    for n, f in enumerate(f_gain_values):
        entry = {"max": np.array(f).max(), "mean": np.array(f).mean(), "index": n}
        f_dict.append(entry)

    f_dict = sorted(f_dict, key=lambda k: k["mean"])
    selected_gain = f_dict[0]
    for i in f_dict:
        if i["mean"] > selected_gain["mean"] and i["max"] < 100:
            selected_gain = i
    return selected_gain["index"]
