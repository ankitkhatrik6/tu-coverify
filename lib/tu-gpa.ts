import { TU_CSIT_COURSES, TUCourse } from "./tu-courses";

export interface TUGradingTier {
  letter: string;
  minScore: number;
  maxScore: number;
  gradePoint: number;
  remarks: string;
  description: string;
}

/**
 * Official Tribhuvan University (TU) Institute of Science and Technology (IoST)
 * Grading System for B.Sc. CSIT
 */
export const TU_GRADING_SYSTEM: TUGradingTier[] = [
  { letter: "A+", minScore: 90, maxScore: 100, gradePoint: 4.0, remarks: "Outstanding", description: "90 – 100%" },
  { letter: "A", minScore: 80, maxScore: 89.999, gradePoint: 3.7, remarks: "Excellent", description: "80 – less than 90%" },
  { letter: "B+", minScore: 70, maxScore: 79.999, gradePoint: 3.3, remarks: "Very Good", description: "70 – less than 80%" },
  { letter: "B", minScore: 60, maxScore: 69.999, gradePoint: 3.0, remarks: "Good", description: "60 – less than 70%" },
  { letter: "C+", minScore: 50, maxScore: 59.999, gradePoint: 2.7, remarks: "Satisfactory", description: "50 – less than 60%" },
  { letter: "C", minScore: 40, maxScore: 49.999, gradePoint: 2.3, remarks: "Pass*", description: "40 – less than 50%" },
  { letter: "F", minScore: 0, maxScore: 39.999, gradePoint: 0.0, remarks: "Fail", description: "0 – less than 40%" },
];

export function getTierByLetter(letter: string): TUGradingTier {
  const normalized = letter.trim().toUpperCase();
  const tier = TU_GRADING_SYSTEM.find((t) => t.letter.toUpperCase() === normalized);
  return tier || TU_GRADING_SYSTEM[TU_GRADING_SYSTEM.length - 1]; // Default to F
}

export function getTierByPercentage(score: number): TUGradingTier {
  const clamped = Math.max(0, Math.min(100, score));
  for (const tier of TU_GRADING_SYSTEM) {
    if (clamped >= tier.minScore && clamped <= tier.maxScore) {
      return tier;
    }
  }
  return TU_GRADING_SYSTEM[TU_GRADING_SYSTEM.length - 1];
}

export interface CourseGradeEntry {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  inputMode: "grade" | "marks";
  letterGrade: string; // "A+", "A", "B+", "B", "C+", "C", "F"
  // Breakdown for marks mode:
  theoryExternal: number; // Max 60 (Pass: 24)
  internalAssessment: number; // Max 20 (Pass: 8)
  practicalExternal: number; // Max 20 (Pass: 8)
}

export interface CourseCalculationDetail {
  id: string;
  courseCode: string;
  courseTitle: string;
  creditHours: number;
  letterGrade: string;
  gradePoint: number;
  qualityPoints: number; // creditHours * gradePoint
  isPass: boolean;
  remarks: string;
  totalMarks?: number;
  percentage?: number;
  categoryFailReason?: string;
}

export interface SGPAResult {
  sgpa: number;
  totalCredits: number;
  totalQualityPoints: number;
  passedCredits: number;
  hasBacklog: boolean;
  divisionRemarks: string;
  courseDetails: CourseCalculationDetail[];
}

export interface SemesterSGPAInput {
  semesterNumber: number;
  semesterName: string;
  sgpa: number;
  credits: number;
  hasBacklog: boolean;
  courses?: CourseGradeEntry[];
}

export interface CGPAResult {
  cgpa: number;
  totalCompletedCredits: number;
  totalQualityPoints: number;
  totalPossibleCredits: number;
  division: string;
  isComplete: boolean;
  hasBacklogsAcrossDegree: boolean;
  semestersSummary: {
    semesterNumber: number;
    semesterName: string;
    sgpa: number;
    credits: number;
    qualityPoints: number;
    hasBacklog: boolean;
  }[];
}

/**
 * Calculate SGPA for a semester
 */
export function calculateSemesterSGPA(entries: CourseGradeEntry[]): SGPAResult {
  if (!entries || entries.length === 0) {
    return {
      sgpa: 0,
      totalCredits: 0,
      totalQualityPoints: 0,
      passedCredits: 0,
      hasBacklog: false,
      divisionRemarks: "No Courses",
      courseDetails: [],
    };
  }

  let totalCredits = 0;
  let totalQualityPoints = 0;
  let passedCredits = 0;
  let hasBacklog = false;

  const courseDetails: CourseCalculationDetail[] = entries.map((entry) => {
    let letterGrade = entry.letterGrade;
    let gradePoint = 0;
    let remarks = "";
    let isPass = false;
    let totalMarks: number | undefined;
    let percentage: number | undefined;
    let categoryFailReason: string | undefined;

    if (entry.inputMode === "marks") {
      const ext = Math.max(0, Math.min(60, Number(entry.theoryExternal) || 0));
      const internal = Math.max(0, Math.min(20, Number(entry.internalAssessment) || 0));
      const practical = Math.max(0, Math.min(20, Number(entry.practicalExternal) || 0));

      totalMarks = ext + internal + practical;
      percentage = totalMarks;

      // TU Rule: Student should secure minimum 40% in each category to pass
      const failExt = ext < 24;
      const failInternal = internal < 8;
      const failPractical = practical < 8;

      if (failExt || failInternal || failPractical) {
        isPass = false;
        letterGrade = "F";
        gradePoint = 0;
        const reasons = [];
        if (failExt) reasons.push("Theory External < 24/60");
        if (failInternal) reasons.push("Internal < 8/20");
        if (failPractical) reasons.push("Practical Lab < 8/20");
        categoryFailReason = reasons.join(", ");
        remarks = "Fail (Category requirement not met)";
      } else {
        const tier = getTierByPercentage(percentage);
        letterGrade = tier.letter;
        gradePoint = tier.gradePoint;
        remarks = tier.remarks;
        isPass = letterGrade !== "F";
      }
    } else {
      const tier = getTierByLetter(letterGrade);
      letterGrade = tier.letter;
      gradePoint = tier.gradePoint;
      remarks = tier.remarks;
      isPass = letterGrade !== "F";
    }

    const credits = Math.max(0, Number(entry.creditHours) || 0);
    const qualityPoints = credits * gradePoint;

    totalCredits += credits;
    totalQualityPoints += qualityPoints;

    if (isPass) {
      passedCredits += credits;
    } else {
      hasBacklog = true;
    }

    return {
      id: entry.id,
      courseCode: entry.courseCode,
      courseTitle: entry.courseTitle,
      creditHours: credits,
      letterGrade,
      gradePoint,
      qualityPoints: Number(qualityPoints.toFixed(2)),
      isPass,
      remarks,
      totalMarks,
      percentage,
      categoryFailReason,
    };
  });

  const rawSgpa = totalCredits > 0 ? totalQualityPoints / totalCredits : 0;
  const sgpa = Number(rawSgpa.toFixed(2));

  let divisionRemarks = "Pass";
  if (hasBacklog) {
    divisionRemarks = "Backpaper / Incomplete";
  } else if (sgpa >= 3.7) {
    divisionRemarks = "Distinction (Outstanding / Excellent)";
  } else if (sgpa >= 3.0) {
    divisionRemarks = "First Division";
  } else if (sgpa >= 2.3) {
    divisionRemarks = "Second Division (Acceptable)";
  } else {
    divisionRemarks = "Fail";
  }

  return {
    sgpa,
    totalCredits,
    totalQualityPoints: Number(totalQualityPoints.toFixed(2)),
    passedCredits,
    hasBacklog,
    divisionRemarks,
    courseDetails,
  };
}

/**
 * Calculate CGPA across all completed semesters
 */
export function calculateOverallCGPA(semesters: SemesterSGPAInput[]): CGPAResult {
  const validSemesters = semesters.filter((s) => s.credits > 0 && s.sgpa >= 0);

  let totalQualityPoints = 0;
  let totalCompletedCredits = 0;
  let hasBacklogsAcrossDegree = false;

  const semestersSummary = validSemesters.map((sem) => {
    const qp = Number((sem.sgpa * sem.credits).toFixed(2));
    totalQualityPoints += qp;
    totalCompletedCredits += sem.credits;
    if (sem.hasBacklog) hasBacklogsAcrossDegree = true;

    return {
      semesterNumber: sem.semesterNumber,
      semesterName: sem.semesterName,
      sgpa: sem.sgpa,
      credits: sem.credits,
      qualityPoints: qp,
      hasBacklog: sem.hasBacklog,
    };
  });

  const rawCgpa = totalCompletedCredits > 0 ? totalQualityPoints / totalCompletedCredits : 0;
  const cgpa = Number(rawCgpa.toFixed(2));

  let division = "In Progress";
  if (totalCompletedCredits === 0) {
    division = "No Semesters Completed";
  } else if (hasBacklogsAcrossDegree) {
    division = "Backpaper (Pending Clearing)";
  } else if (cgpa >= 3.7) {
    division = "Distinction (Outstanding / Excellent)";
  } else if (cgpa >= 3.0) {
    division = "First Division";
  } else if (cgpa >= 2.3) {
    division = "Second Division (Pass)";
  } else {
    division = "Fail";
  }

  return {
    cgpa,
    totalCompletedCredits,
    totalQualityPoints: Number(totalQualityPoints.toFixed(2)),
    totalPossibleCredits: 120, // Total B.Sc. CSIT degree credits (8 sem * 15 cr)
    division,
    isComplete: totalCompletedCredits >= 120 && !hasBacklogsAcrossDegree,
    hasBacklogsAcrossDegree,
    semestersSummary,
  };
}

/**
 * Helper to build initial CourseGradeEntry list from TU_CSIT_COURSES
 */
export function getDefaultCoursesForSemester(semesterNumber: number): CourseGradeEntry[] {
  const semesterCourses = TU_CSIT_COURSES.filter(
    (c) => c.semesterNumber === semesterNumber && !c.isElective
  );

  // If there are electives in this semester (e.g. Sem 5, 6, 7, 8), grab the first elective as default
  const electiveCourses = TU_CSIT_COURSES.filter(
    (c) => c.semesterNumber === semesterNumber && c.isElective
  );

  let coursesToInclude: TUCourse[] = [...semesterCourses];
  if (electiveCourses.length > 0) {
    // E.g. Sem 5 has Elective I, Sem 6 has Elective II, Sem 7 has Elective III, Sem 8 has Elective IV & V
    if (semesterNumber === 8) {
      // Sem 8 has two electives
      const electiveGroupIV = electiveCourses.filter((c) => c.electiveType?.includes("IV") || c.title.includes("Advanced Database") === false);
      const uniqueElectives = electiveCourses.slice(0, 2);
      coursesToInclude = [...coursesToInclude, ...uniqueElectives];
    } else {
      coursesToInclude.push(electiveCourses[0]);
    }
  }

  return coursesToInclude.map((course, idx) => ({
    id: `${course.code}-${idx}`,
    courseCode: course.code,
    courseTitle: course.title,
    creditHours: course.creditHours,
    inputMode: "grade",
    letterGrade: "A",
    theoryExternal: 48,
    internalAssessment: 16,
    practicalExternal: 16,
  }));
}
