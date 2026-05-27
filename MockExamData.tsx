export interface ExamQuestion {
  question: string;
  options: string[];
  correct: number;
  page: number;
}

export interface ScientificConstant {
  symbol: string;
  name: string;
  value: string;
}

export const UsefulConstants: ScientificConstant[] = [
  { symbol: "h", name: "Planck's Constant", value: "6.626 x 10⁻³⁴ J·s" },
  { symbol: "c", name: "Speed of Light", value: "2.998 x 10⁸ m/s" },
  { symbol: "e", name: "Elementary Charge", value: "1.602 x 10⁻¹⁹ C" },
  { symbol: "m_e", name: "Electron Mass", value: "9.109 x 10⁻³¹ kg" },
  { symbol: "G", name: "Gravitational Constant", value: "6.674 x 10⁻¹¹ N·m²/kg²" },
  { symbol: "N_A", name: "Avogadro's Number", value: "6.022 x 10²³ mol⁻¹" },
  { symbol: "R", name: "Universal Gas Constant", value: "8.314 J/(mol·K)" },
  { symbol: "k_B", name: "Boltzmann Constant", value: "1.380 x 10⁻²³ J/K" },
  { symbol: "ε_0", name: "Vacuum Permittivity", value: "8.854 x 10⁻¹² F/m" },
  { symbol: "μ_0", name: "Vacuum Permeability", value: "4π x 10⁻⁷ T·m/A" }
];

// Core 20 Biology Questions (NEST Syllabus focus)
export const BiologyQuestions: ExamQuestion[] = [
  {
    question: "Observe page 4 diagram. Identify the folded structure within the inner membrane where ATP synthase complex proteins reside.",
    options: ["Cristae folding shelves", "Thylakoid disk membrane", "Mitochondrial Matrix fluid", "Stroma outer envelope"],
    correct: 0, page: 4
  },
  {
    question: "Inside which specific sub-compartment of the mitochondrion does the citric acid (Krebs) cycle metabolic cascade occur?",
    options: ["Mitochondrial Matrix", "Outer membrane surface", "Inner membrane boundary", "Intermembrane slot zone"],
    correct: 0, page: 4
  },
  {
    question: "Which cellular subunit component triggers mRNA reading translation and ribosomal peptide assembly in the cytoplasm?",
    options: ["60S and 40S eukaryotic subunits", "Lysosomal vesicular membranes", "Peroxisomal oxidative elements", "Golgi cisternae structures"],
    correct: 0, page: 4
  },
  {
    question: "Based on Watson-Crick B-DNA double-helix dimensional parameters, what is the exact physical radius spacing of the helix spin?",
    options: ["1.0 nanometer radius", "2.4 nanometer radius", "0.34 nanometer radius", "3.4 nanometer radius"],
    correct: 0, page: 4
  },
  {
    question: "What is the primary carbon fixation catalyst crucial for carbon uptake in the Calvin cycle of standard C3 botanical plants?",
    options: ["RuBisCO enzyme active", "PEP carboxylase agent", "Pyruvate kinase complex", "Malate dehydrogenase tool"],
    correct: 0, page: 4
  },
  {
    question: "In botanical light reaction models, which pigment center converts photon energy inside Photosystem II?",
    options: ["P680 chlorophyll center", "P700 reaction element", "Phytochrome red sensor", "Carotenoid shield cluster"],
    correct: 0, page: 4
  },
  {
    question: "Calculate the net generation of adenosine triphosphate (ATP) molecules yielded strictly by anaerobic Glycolysis of a single glucose cell unit.",
    options: ["2 ATP net yield", "36 ATP total yield", "4 ATP gross output", "38 ATP theoretical max"],
    correct: 0, page: 4
  },
  {
    question: "During mitosis spindle fiber checkpoints, which molecular hook secures sister chromatids to micro-tubular vectors?",
    options: ["Kinetochore complex", "Centrosomal pool point", "Telomeric end sleeve", "Histone octamer spool"],
    correct: 0, page: 4
  },
  {
    question: "Which specific plant phytohormone governs phototropic bending elongation of lateral apical meristem cells?",
    options: ["Auxin (Indole-3-acetic acid)", "Abscisic acid inhibitor", "Ethylene gas ripening", "Gibberellic acid synthesis"],
    correct: 0, page: 4
  },
  {
    question: "Which organelle acts as the lymphoid cellular filter for aging erythrocytes and blood-borne antigens in humans?",
    options: ["Spleen lymphoid tissue", "Thymus gland cortex", "Bone marrow cavity", "Peyer's patch mucosal"],
    correct: 0, page: 4
  },
  {
    question: "Within the nephron tubule, which segment is responsible for absorbing 65% of filtered water and sodium?",
    options: ["Proximal Convoluted Tubule", "Loop of Henle descending link", "Distal Convoluted Tubule", "Collecting system terminal duct"],
    correct: 0, page: 4
  },
  {
    question: "Select the primary cardiac pacemaker node that coordinates autonomous rhythmic depolarizations across the human atrium.",
    options: ["Sinoatrial (SA) Node focus", "Atrioventricular (AV) Node delay", "Bundle of His connection", "Purkinje fiber system"],
    correct: 0, page: 4
  },
  {
    question: "At synaptic junctions, the rapid exocytosis release of neurotransmitter vesicles is triggered by an influx of which ion?",
    options: ["Calcium ions (Ca2+)", "Sodium ions (Na+)", "Potassium ions (K+)", "Chloride ions (Cl-)"],
    correct: 0, page: 4
  },
  {
    question: "In what direction does the replication machinery of DNA polymerase synthesize new daughter strands along the template?",
    options: ["5' to 3' direction only", "3' to 5' direction only", "Bidirectional loop shifts", "Random fragmentation nodes"],
    correct: 0, page: 4
  },
  {
    question: "Under the lactose (Lac) operon regulation hypothesis, where does the active repressor block transcription?",
    options: ["Operator DNA region", "Promoter promoter site", "Structural lacZ cistron", "Catabolite activator binding site"],
    correct: 0, page: 4
  },
  {
    question: "Which specific palindromic DNA sequence does the restriction endonuclease enzyme EcoRI recognize and break?",
    options: ["5'-GAATTC-3' pattern", "5'-GGATCC-3' pattern", "5'-AAGCTT-3' pattern", "5'-CTGCAG-3' pattern"],
    correct: 0, page: 4
  },
  {
    question: "In a typical Polymerase Chain Reaction (PCR) loop, what is the thermal peak temperature required for DNA strand denaturation?",
    options: ["94 - 96 degrees Celsius", "50 - 55 degrees Celsius", "72 - 75 degrees Celsius", "37 - 40 degrees Celsius"],
    correct: 0, page: 4
  },
  {
    question: "Which piece of evidence strongly reinforces the endosymbiotic theory of eukaryotic organelle evolutionary development?",
    options: ["Mitochondria possess circular DNA", "Mitochondria contain multi-layer lipid matrices", "Mitochondria synthesize heavy glucose structures", "Mitochondria replicate via mitosis"],
    correct: 0, page: 4
  },
  {
    question: "During angiosperm double fertilization, what nuclear fusion event creates the triploid endosperm nutrient storage cell?",
    options: ["One male gamete with two polar nuclei", "One male gamete with one egg cell", "Two male gametes with the active synergid", "One polar nuclei with two antipodal cells"],
    correct: 0, page: 4
  },
  {
    question: "Which surface receptor molecule must helper T-lymphocytes present to bind with MHC Class II peptide complexes?",
    options: ["CD4 glycoprotein receptor", "CD8 cytotoxic receptor", "B-cell receptor monomer", "IgD heavy chain antibody"],
    correct: 0, page: 4
  }
];

// Core 20 Physics Questions (NEST Syllabus focus)
export const PhysicsQuestions: ExamQuestion[] = [
  {
    question: "Observe page 1 cyclotron trajectory layout. Calculate the exact frequency of uniform circular orbit rotation of charge q in field B.",
    options: ["f = qB / (2πm)", "f = 2πm / (qB)", "f = mv / (qBR)", "f = qBR / m"],
    correct: 0, page: 1
  },
  {
    question: "If radius R of the cyclotron orbital cylinder is precisely doubled, what is the corresponding change to orbital time period T?",
    options: ["T remains completely constant", "T is doubled in value", "T is reduced to half value", "T increases fourfold"],
    correct: 0, page: 1
  },
  {
    question: "Choose the fundamental law of electromagnetism that determines polarity orientation of induced electromotive force (EMF) loops.",
    options: ["Lenz's Law of back conservation", "Faraday's Law of absolute flux", "Gauss's surface divergence theorem", "Coulomb's inverse square formulation"],
    correct: 0, page: 1
  },
  {
    question: "According to Einstein's photoelectric effect, what determines the threshold cut-off emission frequency of target atoms?",
    options: ["Work function of target metal", "Incident light photon intensity", "Speed of incident wave packet", "Surface area of active plate"],
    correct: 0, page: 1
  },
  {
    question: "Based on Bohr atomic models, how does orbit radius r of an orbital electron scale relative to shell quantum number n?",
    options: ["r is directly proportional to n²", "r is directly proportional to n", "r is inversely proportional to n", "r is proportional to root(n)"],
    correct: 0, page: 1
  },
  {
    question: "Calculate the geometric fringe width spacing w of interference patterns in a Young's Double Slit experiment.",
    options: ["w = (λ * D) / d", "w = (λ * d) / D", "w = (d * D) / λ", "w = λ * d * D"],
    correct: 0, page: 1
  },
  {
    question: "Determine thermal efficiency parameter efficiency coefficient e of a perfect reversible Carnot heat engine bounding temperature limits.",
    options: ["e = 1 - (T_cold / T_hot)", "e = 1 + (T_cold / T_hot)", "e = T_cold / T_hot", "e = (T_hot - T_cold) / T_cold"],
    correct: 0, page: 1
  },
  {
    question: "Kepler's third law states that orbital period square T² of planetary tracks scales with semi-major radius axis a in what ratio?",
    options: ["T² is directly proportional to a³", "T² is directly proportional to a²", "T is proportional to a", "T³ is proportional to a²"],
    correct: 0, page: 1
  },
  {
    question: "Identify the Gauss theorem expression evaluating total electrical flux escaping closed boundary surface space containing free charge Q.",
    options: ["Flux = Q / ε_0", "Flux = Q * ε_0", "Flux = ε_0 / Q", "Flux = integral of E · dL"],
    correct: 0, page: 1
  },
  {
    question: "Which formula governs constructive X-ray powder diffraction reflections off atomic crystal planes separated by spacing d?",
    options: ["2d * sin(θ) = n * λ", "d * sin(θ) = 2n * λ", "2d * cos(θ) = λ", "d * tan(θ) = n * λ"],
    correct: 0, page: 1
  },
  {
    question: "Due to the acoustic Doppler effect, what shift in frequency occurs when a source recedes away from a stationary observer at speed v_s?",
    options: ["Frequency decreases to lower pitch", "Frequency increases to higher pitch", "Frequency remains constant but volume drops", "Frequency fluctuates in sinusoidal loops"],
    correct: 0, page: 1
  },
  {
    question: "In a balanced Wheatstone bridge configuration network (R1/R2 = R3/R4), what is the voltage difference across the central galvanometer?",
    options: ["Exactly 0 Volts", "Exactly 5 Volts", "Directly proportional to input battery", "Infinity due to line resistance exclusion"],
    correct: 0, page: 1
  },
  {
    question: "For a projectile launched at speed v over horizontal plains, what launching angle yields maximum reach distance?",
    options: ["Exactly 45 degrees angle", "Exactly 30 degrees angle", "Exactly 60 degrees angle", "Exactly 90 degrees angle vertical"],
    correct: 0, page: 1
  },
  {
    question: "According to Stokes' Law, how does terminal velocity v_t of an falling spherical bead scale with its radius r in viscous fluids?",
    options: ["v_t is proportional to r²", "v_t is proportional to r", "v_t is inversely proportional to r", "v_t is independent of r"],
    correct: 0, page: 1
  },
  {
    question: "During an isobaric thermodynamic gas expansion process, which formula accounts for heat transfer balance Q?",
    options: ["Q = n * C_p * ΔT", "Q = n * C_v * ΔT", "Q = W + U", "Q = n * R * ln(V_2 / V_1)"],
    correct: 0, page: 1
  },
  {
    question: "To spark optical laser chain reactions, what thermodynamic population shift must be triggered inside atomic gain media?",
    options: ["Population inversion of excited electrons", "Rapid absolute zero state freezing", "Maximal thermal velocity conduction", "Complete atomic ionization plasma state"],
    correct: 0, page: 1
  },
  {
    question: "A radioactive isotope sample decays to 1/16 of its starting raw count activity. Identify active half-life interval counts elapsed.",
    options: ["Exactly 4 half-lives", "Exactly 3 half-lives", "Exactly 5 half-lives", "Exactly 16 half-lives"],
    correct: 0, page: 1
  },
  {
    question: "On acoustic decibel (dB) log level charts, if sound waves power doubles, what logarithmic decibel increment is added?",
    options: ["Approximately +3.0 dB", "Approximately +10.0 dB", "Exactly +1.0 dB", "Approximately +6.0 dB"],
    correct: 0, page: 1
  },
  {
    question: "An ideal transformer features 500 primary coils and 100 secondary coils. If input voltage is 220V, what is output voltage?",
    options: ["Exactly 44 Volts", "Exactly 1100 Volts", "Exactly 110 Volts", "Exactly 22 Volts"],
    correct: 0, page: 1
  },
  {
    question: "The Hall voltage induced across magnetic semiconductor plates is inversely proportional to which micro parameter?",
    options: ["Charge carrier concentration density", "Physical magnetic flux density", "Applied primary current value", "Width of active channel boundary"],
    correct: 0, page: 1
  }
];

// Core 20 Chemistry Questions (NEST Syllabus focus)
export const ChemistryQuestions: ExamQuestion[] = [
  {
    question: "Observe page 2 coordinate structure. Select the precise triple bond covalent components representing N2 mole structure.",
    options: ["1 Sigma (σ) and 2 Pi (π) covalent bonds", "2 Sigma (σ) and 1 Pi (π) covalent bonds", "3 Sigma (σ) covalent bonds only", "3 Pi (π) covalent orbitals only"],
    correct: 0, page: 2
  },
  {
    question: "Identify the magnetic state descriptor of Nitrogen molecules based on the molecular orbital symmetry in the page 2 scheme.",
    options: ["Diamagnetic electronic packaging", "Paramagnetic outer electron shell", "Ferromagnetic molecular cluster", "Antiferromagnetic atomic spin alignment"],
    correct: 0, page: 2
  },
  {
    question: "According to electronic quantum wave mechanical models, what parameters define radial nodes count of atomic orbitals?",
    options: ["Nodes = n - l - 1", "Nodes = n - l", "Nodes = 2l + 1", "Nodes = n + l"],
    correct: 0, page: 2
  },
  {
    question: "Select the thermodynamic equation which sets criteria for spontaneous chemical processes at constant temperature and pressure.",
    options: ["ΔG = ΔH - TΔS < 0 spontaneous", "ΔG = ΔH + TΔS < 0 spontaneous", "ΔU = Q + W adiabatic spontaneous", "ΔS_system > 0 spontaneous only"],
    correct: 0, page: 2
  },
  {
    question: "In the industrial Haber synth of Ammonia (N2 + 3H2 <=> 2NH3), what mechanical state shifts boost absolute equilibrium yield?",
    options: ["Increasing pressure and lowering temperature", "Lowering pressure and raising temperature", "Adding inert gas at constant volume", "Removing starting reactants continuously"],
    correct: 0, page: 2
  },
  {
    question: "Through the Arrhenius equation, how does adding an active chemical catalyst alter reaction speed constants?",
    options: ["Lowering activation energy barrier", "Elevating collision frequency factor", "Increasing thermodynamic enthalpy yield", "Driving thermal temperature values up"],
    correct: 0, page: 2
  },
  {
    question: "In crystal field split theories, how do d-orbitals partition under symmetrical Octahedral coordination complexes?",
    options: ["Three lower t2g orbitals and two higher eg orbitals", "Two lower eg orbitals and three higher t2g orbitals", "Single higher dz² orbital and four lower plane orbitals", "Symmetric partitioning of all five d-orbitals equally"],
    correct: 0, page: 2
  },
  {
    question: "What primary intermolecular interaction causes real gas behavior to deviate heavily from ideal gas equations at high density?",
    options: ["Van der Waals attractive force curves", "Nuclear strong covalent linkages", "Erosion of atomic electron shells", "Thermoplastic kinetic energy losses"],
    correct: 0, page: 2
  },
  {
    question: "For a bimolecular nucleophilic SN2 substitution reaction, how is chiral three-dimensional configuration altered at carbon targets?",
    options: ["Complete transition inversion of configuration", "Complete racemization into equal isomer mix", "Retention of absolute configuration shape", "Elimination into planar alkene profiles"],
    correct: 0, page: 2
  },
  {
    question: "Evaluate active pH of standard acidic buffer solutions prepared mixing weak acids (HA) combined with conjugate salt (A-).",
    options: ["pH = pKa + log([A-] / [HA])", "pH = pKa - log([A-] / [HA])", "pH = -log([H+] * [HA])", "pH = 14 - pKb"],
    correct: 0, page: 2
  },
  {
    question: "Determine electrochemical cell potential (E_cell) of standard zinc-copper galvanic cells using the Nernst equation.",
    options: ["E_cell = E_standard - (RT/nF) * ln(Q)", "E_cell = E_standard + (RT/nF) * ln(Q)", "E_cell = -n * F * E_standard", "E_cell = Q * F * R * T"],
    correct: 0, page: 2
  },
  {
    question: "Which foundational chemical law validates addition of reaction enthalpies along cascading reaction steps to find total enthalpy?",
    options: ["Hess's Law of Constant Heat Summation", "Le Chatelier's equilibrium principle", "Raoult's law of vapor curves", "Henry's local solubility limit law"],
    correct: 0, page: 2
  },
  {
    question: "Select orbital hybridization classification and geometric structure representing Xenon Tetrafluoride (XeF4) compounds.",
    options: ["sp3d2 hybridization with Square Planar profile", "sp3d hybridization with Seesaw profile", "sp3 hybridization with Tetrahedral profile", "dsp2 hybridization with Trigonal Bipyramidal shape"],
    correct: 0, page: 2
  },
  {
    question: "According to Faraday's First Law of Electrolysis, how is electro-deposited copper metal mass m related to electrical charge Q?",
    options: ["m is directly proportional to Q", "m is proportional to square of Q", "m is inversely proportional to Q", "m is independent of electrolyzed charge"],
    correct: 0, page: 2
  },
  {
    question: "What physical mechanism drives the systematic shrinkage of atomic radii observed in Lanthanide block elements?",
    options: ["Poor shielding of nuclear charge by 4f electrons", "Massive expansion of active s-orbital pathways", "Creation of inner shell covalent links", "Relativistic contraction of electronic orbitals"],
    correct: 0, page: 2
  },
  {
    question: "Why cannot constant boiling-point binary azeotropic mixtures be separated into clean constituent parts via simple distillation?",
    options: ["Vapor and liquid phases possess identical composition", "The liquids form heavy solid salt complexes", "Boiling points of pure fluids are identical", "The mixtures are completely immiscible in liquid space"],
    correct: 0, page: 2
  },
  {
    question: "What is the reactive chemical nature of Carbon atoms in standard organometallic Grignard reagents (R-Mg-X)?",
    options: ["Strong nucleophilic and basic center", "Highly reactive electrophilic carbon element", "Stable carbon free radical node", "Neutral carbene intermediate structure"],
    correct: 0, page: 2
  },
  {
    question: "Which organic complexing agent is used to chelate calcium and magnesium ions during hard water complexometric titrations?",
    options: ["EDTA (Ethylenediaminetetraacetic acid)", "Oxalic acid crystal buffer", "Sodium dodecyl sulfate polymer", "Dimethylglyoxime coordination salt"],
    correct: 0, page: 2
  },
  {
    question: "For first-order reaction decay dynamics, how does transient half-life time t_1/2 scale with starting reactant concentration [A]0?",
    options: ["t_1/2 is completely independent of [A]0", "t_1/2 is directly proportional to [A]0", "t_1/2 is proportional to ([A]0)²", "t_1/2 scales inversely with [A]0"],
    correct: 0, page: 2
  },
  {
    question: "Which functional group serves as a powerful deactivating meta-director during typical electrophilic aromatic substitutions on benzene?",
    options: ["Nitro group (-NO2)", "Methyl group (-CH3)", "Hydroxyl group (-OH)", "Chlorine halogen group (-Cl)"],
    correct: 0, page: 2
  }
];

// Core 20 Mathematics Questions (NEST Syllabus focus)
export const MathQuestions: ExamQuestion[] = [
  {
    question: "Observe page 3 bounded graph. Calculate precise integration area bounded between parabola y = x² and line y = x.",
    options: ["1/6 square units", "1/12 square units", "1/3 square units", "1/2 square units"],
    correct: 0, page: 3
  },
  {
    question: "Determine exactly the slope of the tangent coordinate line to curve y = x² evaluated at intersection mark (1, 1).",
    options: ["Slope = 2", "Slope = 1", "Slope = 1/2", "Slope = 0"],
    correct: 0, page: 3
  },
  {
    question: "Evaluate calculus equation: limit of sin(3x) divided by x as variable x tends directly to zero.",
    options: ["Limit = 3", "Limit = 1", "Limit = 1/3", "Limit = 0"],
    correct: 0, page: 3
  },
  {
    question: "If a 3x3 square matrix A possesses a determinant value of 5, what is the determinant of matrix product 2A?",
    options: ["40", "10", "20", "5"],
    correct: 0, page: 3
  },
  {
    question: "For two dimensional vectors U = 2i + k*j and V = 3i - 2j, what value of k establishes perpendicular orthogonality?",
    options: ["k = 3", "k = -3", "k = 2", "k = -2"],
    correct: 0, page: 3
  },
  {
    question: "Calculate the product of all three eigenvalues of a 3x3 square matrix whose principal trace is 6 and determinant is 12.",
    options: ["Exactly 12", "Exactly 6", "Exactly 18", "Exactly 72"],
    correct: 0, page: 3
  },
  {
    question: "Express the complex value Z = 1 + i*root(3) in its corresponding Euler exponential polar coordinate representation.",
    options: ["Z = 2 * e^(i * π/3)", "Z = 2 * e^(i * π/6)", "Z = root(2) * e^(i * π/4)", "Z = e^(i * π/3)"],
    correct: 0, page: 3
  },
  {
    question: "Determine the total count of distinct visual terms when expanding algebra equation (x + y + z)^10.",
    options: ["66 terms", "11 terms", "55 terms", "121 terms"],
    correct: 0, page: 3
  },
  {
    question: "Calculate numerical derivative dy/dx of inverse trigonometric function y = arcsin(3x) relative to variable x.",
    options: ["3 / root(1 - 9x²)", "1 / root(1 - 9x²)", "3 / (1 + 9x²)", "1 / root(1 - x²)"],
    correct: 0, page: 3
  },
  {
    question: "Two independent dice rolls are thrown. What is standard joint probability of obtaining double 6 scores?",
    options: ["1/36 utility probability", "1/6 probability", "1/12 probability", "1/18 probability"],
    correct: 0, page: 3
  },
  {
    question: "Solve separable calculus differential equation: dy/dx = (3x²) * y given starting boundary criteria y(0) = 2.",
    options: ["y = 2 * e^(x³)", "y = e^(x³) + 1", "y = 2 * e^(3x²)", "y = 3 * e^(x³)"],
    correct: 0, page: 3
  },
  {
    question: "The sum of the first n terms of an arithmetic progression is S_n = 2n² + 3n. Calculate the 5th term (a_5) of this sequence.",
    options: ["21", "25", "19", "35"],
    correct: 0, page: 3
  },
  {
    question: "Find the exact mathematical value of the trigonometric expression: sin(22.5 degrees) using double-angle formula paths.",
    options: ["0.5 * root(2 - root(2))", "0.5 * root(2 + root(2))", "root(2 - root(2))", "root(2) - 1"],
    correct: 0, page: 3
  },
  {
    question: "Identify the critical coordinate index bounds where the curve f(x) = x³ - 3x possesses a local local relative minimum point.",
    options: ["x = 1 (Minimum value = -2)", "x = -1 (Minimum value = 2)", "x = 0 (Minimum value = 0)", "x = root(3) (Minimum value = 0)"],
    correct: 0, page: 3
  },
  {
    question: "State the equation of the directrix line of the parabola defined by formula y² = 12x.",
    options: ["x = -3", "x = 3", "y = -3", "y = 3"],
    correct: 0, page: 3
  },
  {
    question: "Calculate the eccentricity parameter e of the canonical ellipse defined by the rational inequality equation (x²/16) + (y²/9) = 1.",
    options: ["e = root(7) / 4", "e = 3/4", "e = 7/16", "e = root(7) / 3"],
    correct: 0, page: 3
  },
  {
    question: "Compute definite integral evaluation: integral of x * e^(x) * dx from bounded limit 0 going to absolute limits 1.",
    options: ["Exactly 1", "Exactly e", "Exactly e - 1", "Exactly 0"],
    correct: 0, page: 3
  },
  {
    question: "How many unique 4-letter permit code sequences can be constructed from word 'NEST' without repeating letters?",
    options: ["24 permutations", "12 permutations", "16 permutations", "256 permutations"],
    correct: 0, page: 3
  },
  {
    question: "Applying the Lagrange Mean Value Theorem on function f(x) = x² on interval [1, 3], find intermediate point c.",
    options: ["c = 2", "c = 1.5", "c = 2.5", "c = 1.8"],
    correct: 0, page: 3
  },
  {
    question: "Find the coefficient of the x² term in the Taylor series expansion of f(x) = e^(3x) centered around point a = 0.",
    options: ["4.5", "9", "3", "1"],
    correct: 0, page: 3
  }
];

// Scatter function to randomize choices and correct pointer
export function scatterQuestionsList(questions: ExamQuestion[]): ExamQuestion[] {
  return questions.map(q => {
    const originalCorrectText = q.options[q.correct];
    const optionsCopy = [...q.options];
    
    // Fisher-Yates shuffle
    for (let i = optionsCopy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [optionsCopy[i], optionsCopy[j]] = [optionsCopy[j], optionsCopy[i]];
    }
    
    let newCorrectIdx = optionsCopy.indexOf(originalCorrectText);
    if (newCorrectIdx === -1) {
      newCorrectIdx = 0; // fallback safety
    }
    
    return {
      ...q,
      options: optionsCopy,
      correct: newCorrectIdx
    };
  });
}
