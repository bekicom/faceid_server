const Attendance = require("../modules/attendance.model");
const Employee = require("../modules/employee.model");
exports.getAttendance = async (req, res) => {
  try {
    const { organizationId } = req.params;

    const today = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Tashkent" }),
    )
      .toISOString()
      .slice(0, 10);

    // 🔹 1. Hamma employee
    const employees = await Employee.find({
      organizationId,
      isActive: { $ne: false },
    }).populate("department");

    // 🔹 2. Bugungi attendance yozuvlari
    const records = await Attendance.find({
      organizationId,
      date: today,
    });

    // 🔹 Attendance map (tez qidirish uchun)
    const recordMap = {};
    records.forEach((r) => {
      recordMap[r.employee.toString()] = r;
    });

    const result = employees.map((emp) => {
      const attendance = recordMap[emp._id.toString()];

      // ❌ Agar kelmagan bo‘lsa
      if (!attendance) {
        return {
          employee: {
            _id: emp._id,
            fullName: emp.fullName,
            employeeCode: emp.employeeCode,
          },
          date: today,
          status: "Absent",
          workedMinutes: 0,
          workedTime: "0 minut",
          lateMinutes: 0,
          earlyLeaveMinutes: 0,
        };
      }

      const totalMinutes = Math.floor((attendance.totalHours || 0) * 60);

      let status = "On Time";
      let lateMinutes = 0;

      if (emp.department && attendance.firstEntry) {
        const checkIn = emp.department.checkInTime;
        const grace = emp.department.lateAfterMinutes || 0;

        const [h, m] = checkIn.split(":");
        const checkInMinutes = parseInt(h) * 60 + parseInt(m) + grace;

        const entry = new Date(attendance.firstEntry);
        const entryMinutes = entry.getHours() * 60 + entry.getMinutes();

        if (entryMinutes > checkInMinutes) {
          lateMinutes = entryMinutes - checkInMinutes;
          status = "Late";
        }
      }

      return {
        employee: {
          _id: emp._id,
          fullName: emp.fullName,
          employeeCode: emp.employeeCode,
        },
        date: today,
        firstEntry: attendance.firstEntry,
        lastExit: attendance.lastExit,
        workedMinutes: totalMinutes,
        workedTime: `${Math.floor(totalMinutes / 60)} soat ${
          totalMinutes % 60
        } minut`,
        lateMinutes,
        status,
      };
    });

    res.json({
      success: true,
      date: today,
      totalEmployees: employees.length,
      presentCount: records.length,
      absentCount: employees.length - records.length,
      data: result,
    });
  } catch (err) {
    console.error("GET TODAY ATTENDANCE ERROR:", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};
