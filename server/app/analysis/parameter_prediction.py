from typing import List, Iterable, Callable, Tuple

# Average amino acid weight (Da/res)
average_AA_MW = 110

# Source: Robertson, Andrew D., and Kenneth P. Murphy. 
# "Protein structure and the energetics of protein stability." 
# Chemical reviews 97.5 (1997): 1251-1268.



def Predict_dCp(n_residues: int = None, moleculer_weight: int = None) -> float:
    """Predicts protein heat capacity of unfolding (dCp). Source (Robertson & Murphy, 1997).

    Args:
        n_residues (int, optional): Residue count of protein. Defaults to None.
        moleculer_weight (int, optional): Protein size in daltons. Defaults to None.

    Raises:
        ValueError: if no input is given

    Returns:
        float: heat capacity of unfolding (dCp, J/K/mol)
    """
    if (n_residues == None and moleculer_weight == None): raise ValueError('No input value given for function.')
    elif (n_residues == None): n_residues = moleculer_weight/average_AA_MW
    return (n_residues*0.062-0.53)*1_000

def Predict_dHu(n_residues: int = None, moleculer_weight: int = None) -> float:
    """Predicts protein enthalpy of unfolding (dHu @100°C). Source (Robertson & Murphy, 1997).

    Args:
        n_residues (int, optional): Residue count of protein. Defaults to None.
        moleculer_weight (int, optional): Protein size in daltons. Defaults to None.

    Raises:
        ValueError: [description]

    Returns:
        float: [description]
    """
    if (n_residues == None and moleculer_weight == None): raise ValueError('No input value given for function.')
    elif (n_residues == None): n_residues = moleculer_weight/average_AA_MW
    return (n_residues*2.53+63.2)*1_000