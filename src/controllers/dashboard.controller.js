const Employee = require("../modules/employee.model");
const Attendance = require("../modules/attendance.model");

/* =========================================
   DAILY DASHBOARD
   GET /dashboard/:organizationId?date=2026-02-21
========================================= */
exports.getDailyDashboard = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { date } = req.query;

    const today = date || new Date().toISOString().slice(0, 10);

    // 1️⃣ jami employee
    const totalEmployees = await Employee.countDocuments({
      organizationId,
      isActive: { $ne: false },
    });

    // 2️⃣ shu kundagi attendance
    const records = await Attendance.find({
      organizationId,
      date: today,
    }).populate("department");

    let lateCount = 0;

    records.forEach((r) => {
      if (!r.firstEntry || !r.department) return;

      const checkIn = r.department.checkInTime; // "09:00"
      const grace = r.department.lateAfterMinutes || 0;

      const [h, m] = checkIn.split(":");
      const checkInMinutes = parseInt(h) * 60 + parseInt(m) + grace;

      const entry = new Date(r.firstEntry);
      const entryMinutes = entry.getHours() * 60 + entry.getMinutes();

      if (entryMinutes > checkInMinutes) {
        lateCount++;
      }
    });

    const presentCount = records.length;
    const absentCount = totalEmployees - presentCount;

    res.json({
      success: true,
      data: {
        date: today,
        totalEmployees,
        presentCount,
        lateCount,
        absentCount,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

/* =========================================
   EMPLOYEE MONTHLY STATS
   GET /dashboard/employee/:employeeId?year=2026&month=2
========================================= */
exports.getEmployeeMonthlyStats = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { year, month } = req.query;

    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: "year va month majburiy",
      });
    }

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-31`;

    const records = await Attendance.find({
      employee: employeeId,
      date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).populate("department");

    let totalMinutes = 0;
    let lateDays = 0;
    let lateMinutesTotal = 0;

    records.forEach((r) => {
      // ✅ Jami ishlagan minut
      totalMinutes += Math.floor((r.totalHours || 0) * 60);

      if (r.firstEntry && r.department) {
        const checkIn = r.department.checkInTime;
        const grace = r.department.lateAfterMinutes || 0;

        const [h, m] = checkIn.split(":");
        const checkInMinutes = parseInt(h) * 60 + parseInt(m) + grace;

        const entry = new Date(r.firstEntry);
        const entryMinutes = entry.getHours() * 60 + entry.getMinutes();

        if (entryMinutes > checkInMinutes) {
          lateDays++;
          lateMinutesTotal += entryMinutes - checkInMinutes;
        }
      }
    });

    const presentDays = records.length;

    const workedHours = Math.floor(totalMinutes / 60);
    const workedMinutes = totalMinutes % 60;

    const lateHours = Math.floor(lateMinutesTotal / 60);
    const lateRemainingMinutes = lateMinutesTotal % 60;

    res.json({
      success: true,
      data: {
        presentDays,
        lateDays,
        totalWorkedMinutes: totalMinutes,
        totalWorkedTime: `${workedHours} soat ${workedMinutes} minut`,
        totalLateMinutes: lateMinutesTotal,
        totalLateTime: `${lateHours} soat ${lateRemainingMinutes} minut`,
      },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};
