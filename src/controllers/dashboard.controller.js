const Employee = require("../modules/employee.model");
const Attendance = require("../modules/attendance.model");

const mongoose = require("mongoose");

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

    if (!mongoose.Types.ObjectId.isValid(employeeId)) {
      return res.status(400).json({
        success: false,
        message: "Noto‘g‘ri employeeId",
      });
    }

    const startDate = `${year}-${month.padStart(2, "0")}-01`;
    const endDate = `${year}-${month.padStart(2, "0")}-31`;

    const records = await Attendance.find({
      employee: employeeId,
      date: { $gte: startDate, $lte: endDate },
    }).populate("department");

    let totalMinutes = 0;
    let lateDays = 0;
    let lateMinutesTotal = 0;

    const dailyDetails = [];

    records.forEach((r) => {
      const workedMinutes = Math.floor((r.totalHours || 0) * 60);
      totalMinutes += workedMinutes;

      let lateMinutes = 0;
      let isLate = false;

      if (r.firstEntry && r.department) {
        const checkIn = r.department.checkInTime;
        const grace = r.department.lateAfterMinutes || 0;

        const [h, m] = checkIn.split(":");
        const checkInMinutes = parseInt(h) * 60 + parseInt(m) + grace;

        const entry = new Date(r.firstEntry);
        const entryMinutes = entry.getHours() * 60 + entry.getMinutes();

        if (entryMinutes > checkInMinutes) {
          isLate = true;
          lateDays++;
          lateMinutes = entryMinutes - checkInMinutes;
          lateMinutesTotal += lateMinutes;
        }
      }

      dailyDetails.push({
        date: r.date,
        firstEntry: r.firstEntry,
        lastExit: r.lastExit,
        workedMinutes,
        workedTime: `${Math.floor(workedMinutes / 60)} soat ${
          workedMinutes % 60
        } minut`,
        isLate,
        lateMinutes,
        lateTime: `${Math.floor(lateMinutes / 60)} soat ${
          lateMinutes % 60
        } minut`,
      });
    });

    const workedHours = Math.floor(totalMinutes / 60);
    const workedRemainingMinutes = totalMinutes % 60;

    const lateHours = Math.floor(lateMinutesTotal / 60);
    const lateRemainingMinutes = lateMinutesTotal % 60;

    res.json({
      success: true,
      data: {
        summary: {
          presentDays: records.length,
          lateDays,
          totalWorkedMinutes: totalMinutes,
          totalWorkedTime: `${workedHours} soat ${workedRemainingMinutes} minut`,
          totalLateMinutes: lateMinutesTotal,
          totalLateTime: `${lateHours} soat ${lateRemainingMinutes} minut`,
        },
        dailyDetails,
      },
    });
  } catch (err) {
    console.error("MONTHLY STATS ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
