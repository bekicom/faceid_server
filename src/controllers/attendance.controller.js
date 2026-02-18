const Attendance = require("../modules/attendance.model");

exports.getAttendance = async (req, res) => {
  try {
    const { organizationId } = req.params;
    const { date, departmentId } = req.query;

    const filter = { organizationId };

    if (date) filter.date = date;
    if (departmentId) filter.department = departmentId;

    const records = await Attendance.find(filter)
      .populate("employee", "fullName employeeCode")
      .populate("department", "name")
      .sort({ date: -1 });

    const formatted = records.map((r) => {
      const totalMinutes = Math.floor(r.totalHours * 60);

      const hours = Math.floor(totalMinutes / 60);
      const minutes = totalMinutes % 60;

      let workedTime = "";

      if (hours > 0 && minutes > 0) {
        workedTime = `${hours} soat ${minutes} minut`;
      } else if (hours > 0) {
        workedTime = `${hours} soat`;
      } else {
        workedTime = `${minutes} minut`;
      }

      return {
        _id: r._id,
        date: r.date,
        firstEntry: r.firstEntry,
        lastExit: r.lastExit,
        workedMinutes: totalMinutes,
        workedTime,
        employee: r.employee,
        department: r.department,
      };
    });

    res.json({
      success: true,
      count: formatted.length,
      data: formatted,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

