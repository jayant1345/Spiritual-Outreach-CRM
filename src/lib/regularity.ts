/**
 * Course Regularity & Attendance Calculation Engine
 * Categorizes students based on multi-session attendance ratios
 */

export interface AttendanceEvaluation {
  totalCompletedSessions: number;
  attendedSessions: number;
  attendancePercent: number;
  status: 'REGULAR' | 'IRREGULAR' | 'LOW_ATTENDANCE' | 'COMPLETED' | 'DISCONTINUED';
  statusLabel: string;
  badgeColorClass: string;
}

export function evaluateCourseRegularity(
  totalCompletedSessions: number,
  attendedCount: number,
  isDiscontinued = false
): AttendanceEvaluation {
  if (isDiscontinued) {
    return {
      totalCompletedSessions,
      attendedSessions: attendedCount,
      attendancePercent: 0,
      status: 'DISCONTINUED',
      statusLabel: 'Discontinued',
      badgeColorClass: 'bg-gray-100 text-gray-700 border-gray-300',
    };
  }

  if (totalCompletedSessions === 0) {
    return {
      totalCompletedSessions: 0,
      attendedSessions: 0,
      attendancePercent: 100,
      status: 'REGULAR',
      statusLabel: 'Enrolled (New)',
      badgeColorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  }

  const percent = Math.round((attendedCount / totalCompletedSessions) * 100);

  if (percent >= 75) {
    return {
      totalCompletedSessions,
      attendedSessions: attendedCount,
      attendancePercent: percent,
      status: 'REGULAR',
      statusLabel: 'Regular',
      badgeColorClass: 'bg-emerald-50 text-emerald-700 border-emerald-300',
    };
  } else if (percent >= 50) {
    return {
      totalCompletedSessions,
      attendedSessions: attendedCount,
      attendancePercent: percent,
      status: 'IRREGULAR',
      statusLabel: 'Irregular',
      badgeColorClass: 'bg-amber-50 text-amber-700 border-amber-300',
    };
  } else {
    return {
      totalCompletedSessions,
      attendedSessions: attendedCount,
      attendancePercent: percent,
      status: 'LOW_ATTENDANCE',
      statusLabel: 'Low Attendance',
      badgeColorClass: 'bg-red-50 text-red-700 border-red-300',
    };
  }
}
