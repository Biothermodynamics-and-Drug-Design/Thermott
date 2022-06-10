# Troubleshooting

##Troubleshooting and general advice

###Optimization

Before committing a significant portion of your valuable protein and ligand to the binding assay it is advisable to perform a quick test screen in order to determine the optimal protein concentration, suitable reporter dye concentration, and buffer for the best signal to noise ratio and distinct protein denaturation fluorescence peak. Test runs can also help to uncover other potential issues. In some cases, the protein is not suited for TSA – for example, inherently disordered proteins might cause high fluorescence even in their native state.

###Excessive fluorescence 
If your fluorescence readings are too high, consider checking **sensitivity** of your device. Too **high** protein or reporter dye **concentration** could also be an issue. Adjust the concentrations accordingly. In rare cases, there can be issues with the buffer – when it destabilizes the protein or contains components that can contribute to fluorescence readings (for example, BSA). In that case consider changing a buffer or pH. Moreover, keep in mind that pH of some buffers is highly temperature-dependant (for example, Tris) and can thus destabilize the protein enough to cause issues during the thermal cycle. 

Quite a common case is the **ligand autofluorescence** issue, when the ligand itself emits fluorescence signal. To pinpoint this, run an experiment with a ligand-only sample (without any protein). If this turns out to be the case, consider increasing reporter dye concentration (but not beyond the point where the reporter dye could affect binding). If that does not help, consider changing reporter dye to one with different excitation and emission characteristics (for example, from ANS (1-anilinonaphthalene-8-sulfonic acid) or bis-ANS to SYPRO Orange).

###High initial fluorescence 
Common issue is having a very high initial fluorescence, which over the course of the experiment gradually drops to almost base level once the highest temperature is reached). In this case, the target protein denaturation is observed only as a small bump in the curve or not at all. This usually indicates insufficient protein purity. Some protein-based impurities can be partially unfolded and have the reporter dye bind to the exposed protein parts (that usually should not be exposed to the solvent without denaturation) or yield high fluorescence signal from the start because of other reasons, completely hiding the denaturation process. Alternatively, the protein itself can be partially unfolded due to unsuitable conditions or handling. Consider testing different protein batch or repurifying the protein. In some cases, it helps to increase the reporter dye concentration. 

###Multiple peaks or no defined peak
Multiple peaks or overlapping peaks in the sample without a ligand are usually an indication of multi domain structure of the protein, with different substructures unfolding at different temperatures. They can overlap or be distinct. In case of distinct several peaks, just measure the target peak. If the peaks overlap, the measurement accuracy might depend on multiple parameters and usually it is more expedient to conduct experiments with a single-domain truncation of the protein, containing the ligand binding site.

###Random fluorescence fluctuations
In case of sudden, seemingly random, usually temperature-dependant drastic changes in the fluorescence being observed, check whether the sample volume is not too low. Sometimes detection beam can bypass the solution if the sample evaporates at higher temperature. Make sure that the sample is properly protected from evaporation. While it is rarely a problem when test tubes are being used, it can still happen if the tube was not closed properly or the initial solution volume was too low. It is more common problem when working with well plates, where tight sealing is harder to achieve and thus it is advisable to use mineral oil in order to prevent sample evaporation. 

###No fluorescence
Check whether the reporter dye and protein are present, the correct excitation and emission ranges and sensitivity are selected, the beam passes unobstructed through the solution during the experiment, and all the controls are present and behave as expected.

###Ligand solubility problem
If the ligand is insufficiently soluble in the water-based solution and you observe its precipitation at higher ligand concentrations, consider using DMSO (dimethylsulfoxide) to up to 4% v/v final concentration.

##Unfolding and Binding parameters

The equation that relates the observed shift in protein melting temperature (<i>T</i><sub>m</sub>) to the added ligand concentration (<i>L</i><sub>t</sub>) contains two thermodynamic parameters of protein unfolding, namely, the enthalpy change upon unfolding (Δ<sub>u</sub><i>H</i><sub><i>T</i><sub>r</sub></sub>) and the heat capacity change upon unfolding (Δ<sub>u</sub><i>C</i><sub>p</sub>), and two thermodynamic parameters of protein-ligand binding, namely, the enthalpy change upon ligand binding (Δ<sub>b</sub><i>H</i><sub><i>T</i><sub>0</sub></sub>) and the heat capacity upon ligand binding (Δ<sub>b</sub><i>C</i><sub>p</sub>). The accuracy of the fit depends on all four values but to a varying extent. For optimal fit, it is best to have these values obtained experimentally for the study system using independent techniques. 

The most important parameter to obtain experimentally is Δ<sub>u</sub><i>H</i><sub><i>T</i><sub>r</sub></sub>. It can be determined using differential scanning calorimetry (DSC). Inaccuracy of Δ<sub>u</sub><i>H</i><sub><i>T</i><sub>r</sub></sub> by approximately 100 kJ/mol may be tolerated, but it could already cause the calculated <i>K</i><sub>d</sub> value to deviate 10-fold. Δ<sub>u</sub><i>C</i><sub>p</sub> has a lesser impact on the <i>K</i><sub>d</sub>. In case DSC is not available, these unfolding parameters can be predicted based on the protein MW with sufficient accuracy ([Robertson & Murphy (1997)](https://doi.org/10.1021/cr960383c)). This approximation is implemented in Thermott for your [convenience](02experimentinfo.md#creating-the-binding-experiment). 

The thermodynamic parameters of protein-ligand binding can be obtained using isothermal titration calorimetry (ITC). A single ITC experiment is required to determine Δ<sub>b</sub><i>H</i><sub><i>T</i><sub>0</sub></sub>, while a set of three ITC experiments performed at different temperatures can yield Δ<sub>b</sub><i>C</i><sub>p</sub>. Most common Δ<sub>b</sub><i>H</i><sub><i>T</i><sub>0</sub></sub> values for binding of a typical small ligand are within the -20 to -40 kJ/mol range. Therefore, if the ITC experiments are not feasible, using these values for the fit could still provide quite accurate result.








