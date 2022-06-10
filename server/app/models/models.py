from pydantic import BaseModel
from typing import List, Optional, Union


class TmModelParams(BaseModel):
    Model: str
    Tm: Optional[float]

    @property
    def TmK(self)->float:
        return self.Tm+273.15
    
    def round(self, digits=[2]):
        self.Tm = round(self.Tm, digits[0])


class TmModelParams_Thermodynamic(TmModelParams):
    Model: str = "thermodynamic"
    dH: float
    dCp: float
    yf: float
    yfs: float
    yu: float
    yus: float

    def round(self, digits=[2,0,0,4,4,4,4]):
        self.Tm = round(self.Tm, digits[0])
        self.dH = round(self.dH, digits[1])
        self.dCp = round(self.dCp, digits[2])
        self.yf = round(self.yf, digits[3])
        self.yfs = round(self.yfs, digits[4])
        self.yu = round(self.yu, digits[5])
        self.yus = round(self.yus, digits[6])

class TmModelParams_BoltzmannTrans(TmModelParams):
    Model: str = "boltzmann_trans"
    k: float
    yf: float
    yfs: float
    yu: float
    yus: float
    
    def round(self, digits=[2,4,4,4,4,4]):
        self.Tm = round(self.Tm, digits[0])
        self.k = round(self.k, digits[1])
        self.yf = round(self.yf, digits[2])
        self.yfs = round(self.yfs, digits[3])
        self.yu = round(self.yu, digits[4])
        self.yus = round(self.yus, digits[5])

class TmModelParams_Sigmoid5Trans(TmModelParams):
    Model: str = "sigmoid5_trans"
    k: float
    d: float
    yf: float
    yfs: float
    yu: float
    yus: float
    
    def round(self, digits=[2,4,4,4,4,4,4]):
        self.Tm = round(self.Tm, digits[0])
        self.k = round(self.k, digits[1])
        self.d = round(self.k, digits[2])
        self.yf = round(self.yf, digits[3])
        self.yfs = round(self.yfs, digits[4])
        self.yu = round(self.yu, digits[5])
        self.yus = round(self.yus, digits[6])

class TmModelParams_Derivative(TmModelParams):
    Model: str = "derivative"

class TmModelParams_Derivative_Sovgal(TmModelParams):
    Model: str = "derivative_sovgal"


class BindingModelParams(BaseModel):
    DuH_Tr: float
    DuCp: float
    DbH_T0: float
    DbCp: float
    Pt: float
    Tr: float
    T0: float
    Kb: Optional[float]
    ActiveLigandFraction: float

class XYarray(BaseModel):
    x: List[float]
    y: List[float]



class FluorescenceGain(BaseModel):
    id: int
    name: Optional[str] = None
    data: List[float]

# class Fluorescence(BaseModel):
#     active_gain: int
#     fluorescence: List[FluorescenceGain]



class ExperimentWell(BaseModel):
    name: str = None
    id: int = None
    i_id: str = None
    file_id: int = None
    temperature: List[float] = None
    fluorescence: List[FluorescenceGain] = None
    active_gain: int = None
    fit_points: List[bool] = None
    origin_filename: str = None
    protein: str = None
    protein_conc: float = None
    ligand: str = None
    ligand_conc: float = None
    derivative: dict = None
    tm_model_params: Union[TmModelParams_Thermodynamic, TmModelParams_BoltzmannTrans, TmModelParams_Derivative] = None
    comment: str = None

    @property
    def ActiveFluorescence(self) -> List[float]:
        find_f = [f for f in self.fluorescence if f.id == self.active_gain]
        if (len(find_f) > 0):
            return find_f[0].data
        else:
            return None


class OriginFile(BaseModel):
    id: int = None
    filename: str

class BindingExperiment(BaseModel):
    id: int
    name: str
    protein: str
    ligand: str
    expPointIndexes: List[int]
    params: BindingModelParams
    comment: str = None

class KbError(BaseModel):
    averageKb: float
    errorKb: List[float]