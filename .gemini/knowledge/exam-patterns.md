# KEAM & NEET Exam Patterns - Reference Guide

## KEAM (Kerala Engineering Architecture Medical)

### Exam Structure
- **Paper I (Physics + Chemistry)**: 2.5 hours
  - Physics: 72 questions
  - Chemistry: 72 questions
  - Total: 144 questions
- **Paper II (Mathematics)**: 2.5 hours
  - Mathematics: 120 questions

### Marking Scheme
- Correct answer: +4 marks
- Wrong answer: -1 mark (negative marking)
- Unanswered: 0 marks

### Subjects & Chapters

#### Physics (Plus One + Plus Two)
1. Units and Measurement
2. Motion in One Dimension
3. Motion in Two Dimensions
4. Laws of Motion
5. Work, Energy and Power
6. Rotational Motion
7. Gravitation
8. Properties of Matter (Elasticity, Surface Tension, Viscosity)
9. Heat and Thermodynamics
10. Oscillations
11. Waves
12. Electrostatics
13. Current Electricity
14. Magnetic Effects of Current
15. Electromagnetic Induction
16. Alternating Current
17. Electromagnetic Waves
18. Ray Optics
19. Wave Optics
20. Dual Nature of Matter
21. Atoms and Nuclei
22. Semiconductor Electronics

#### Chemistry (Plus One + Plus Two)
1. Basic Concepts of Chemistry
2. Structure of Atom
3. Classification of Elements
4. Chemical Bonding
5. States of Matter
6. Thermodynamics
7. Equilibrium
8. Redox Reactions
9. Hydrogen
10. s-Block Elements
11. p-Block Elements
12. Organic Chemistry Basics
13. Hydrocarbons
14. Environmental Chemistry
15. Solid State
16. Solutions
17. Electrochemistry
18. Chemical Kinetics
19. Surface Chemistry
20. Coordination Compounds
21. Haloalkanes and Haloarenes
22. Alcohols, Phenols, Ethers
23. Aldehydes, Ketones, Carboxylic Acids
24. Amines
25. Biomolecules
26. Polymers

#### Mathematics
1. Sets, Relations and Functions
2. Trigonometry
3. Complex Numbers
4. Sequences and Series
5. Permutations and Combinations
6. Binomial Theorem
7. Matrices and Determinants
8. Quadratic Equations
9. Linear Inequalities
10. Mathematical Induction
11. Limits and Derivatives
12. Statistics
13. Probability
14. Relations and Functions (cont.)
15. Inverse Trigonometric Functions
16. Continuity and Differentiability
17. Applications of Derivatives
18. Integrals
19. Applications of Integrals
20. Differential Equations
21. Vectors
22. Three Dimensional Geometry
23. Linear Programming

---

## NEET (National Eligibility cum Entrance Test)

### Exam Structure
- **Duration**: 3 hours 20 minutes
- **Total Questions**: 200 (180 to be answered)
- **Mode**: Pen and Paper (OMR)

### Subject Distribution
- **Physics**: 50 questions (45 to attempt)
  - Section A: 35 questions (all mandatory)
  - Section B: 15 questions (attempt 10)
- **Chemistry**: 50 questions (45 to attempt)
  - Section A: 35 questions (all mandatory)
  - Section B: 15 questions (attempt 10)
- **Biology**: 100 questions (90 to attempt)
  - Botany: 50 (45 to attempt)
  - Zoology: 50 (45 to attempt)

### Marking Scheme
- Correct answer: +4 marks
- Wrong answer: -1 mark
- Total marks: 720

---

## Mock Test Configuration

### KEAM Mock Test Settings
```json
{
  "paperI": {
    "name": "Physics + Chemistry",
    "duration_minutes": 150,
    "physics_questions": 72,
    "chemistry_questions": 72,
    "marks_per_correct": 4,
    "marks_per_wrong": -1
  },
  "paperII": {
    "name": "Mathematics",
    "duration_minutes": 150,
    "math_questions": 120,
    "marks_per_correct": 4,
    "marks_per_wrong": -1
  }
}
```

### NEET Mock Test Settings
```json
{
  "duration_minutes": 200,
  "sections": {
    "physics": { "section_a": 35, "section_b": 15 },
    "chemistry": { "section_a": 35, "section_b": 15 },
    "biology_botany": { "section_a": 35, "section_b": 15 },
    "biology_zoology": { "section_a": 35, "section_b": 15 }
  },
  "marks_per_correct": 4,
  "marks_per_wrong": -1,
  "total_marks": 720
}
```

---

## Question Difficulty Weightage

| Difficulty | KEAM % | NEET % |
|-----------|--------|--------|
| Easy      | 30-35% | 25-30% |
| Medium    | 45-50% | 50-55% |
| Hard      | 15-20% | 15-20% |

---

## Important Topics (High Weightage)

### KEAM Physics
- Laws of Motion (7-8 questions)
- Current Electricity (6-7 questions)
- Ray Optics (5-6 questions)
- Electromagnetic Induction (5-6 questions)

### KEAM Chemistry
- Chemical Bonding (6-7 questions)
- Coordination Compounds (5-6 questions)
- Organic Chemistry (15-18 questions total)
- p-Block Elements (6-7 questions)

### KEAM Mathematics
- Calculus (20-25 questions)
- Trigonometry (12-15 questions)
- Coordinate Geometry (10-12 questions)
- Probability (8-10 questions)
