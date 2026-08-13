const db = require("../config/db");

const ROOM_PRICE_MAP = {
  "AC-1": 8000,
  "AC-2": 7800,
  "AC-3": 7000,
  "AC-4": 6500,
  "Non AC-1": 7000,
  "Non AC-2": 6200,
  "Non AC-3": 5600,
  "Non AC-4": 5000,
};

const getRoomPrice = (roomType, sharing) => {
  return ROOM_PRICE_MAP[`${roomType}-${sharing}`] || 5500;
};

const allAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });

const getAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });

const runAsync = (sql, params = []) =>
  new Promise((resolve, reject) => {
    db.run(sql, params, function (err) {
      if (err) reject(err);
      else resolve(this);
    });
  });

const normalizeFee = (fee) => {
  if (!fee) return null;

  return {
    ...fee,
    paymentHistory: fee.paymentHistory ? JSON.parse(fee.paymentHistory) : [],
  };
};

/* ---------------------- Rooms ---------------------- */

const getRooms = async (req, res) => {
  try {
    const rooms = await allAsync(`SELECT * FROM rooms ORDER BY roomNo ASC`);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addRoom = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { roomSeries, roomNo, floor, sharing, roomType } = req.body;

    if (!roomSeries || !roomNo || !floor || !sharing || !roomType) {
      return res.status(400).json({ message: "All room fields are required" });
    }

    const existing = await getAsync(`SELECT * FROM rooms WHERE roomNo = ?`, [roomNo]);
    if (existing) {
      return res.status(400).json({ message: "Room number already exists" });
    }

    const numericSharing = Number(sharing);
    const monthlyFee = getRoomPrice(roomType, numericSharing);

    const result = await runAsync(
      `INSERT INTO rooms (roomSeries, roomNo, block, floor, sharing, roomType, capacity, occupied, monthlyFee)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        roomSeries,
        roomNo,
        roomSeries,
        Number(floor),
        numericSharing,
        roomType,
        numericSharing,
        0,
        monthlyFee,
      ]
    );

    const room = await getAsync(`SELECT * FROM rooms WHERE id = ?`, [result.lastID]);
    res.status(201).json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateRoom = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const existing = await getAsync(`SELECT * FROM rooms WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ message: "Room not found" });
    }

    const nextRoomSeries = req.body.roomSeries ?? existing.roomSeries;
    const nextRoomNo = req.body.roomNo ?? existing.roomNo;
    const nextFloor = Number(req.body.floor ?? existing.floor);
    const nextSharing = Number(req.body.sharing ?? existing.sharing);
    const nextRoomType = req.body.roomType ?? existing.roomType;
    const nextMonthlyFee = getRoomPrice(nextRoomType, nextSharing);

    const duplicate = await getAsync(
      `SELECT * FROM rooms WHERE roomNo = ? AND id != ?`,
      [nextRoomNo, id]
    );

    if (duplicate) {
      return res.status(400).json({ message: "Another room already uses this room number" });
    }

    await runAsync(
      `UPDATE rooms
       SET roomSeries = ?, roomNo = ?, block = ?, floor = ?, sharing = ?, roomType = ?, capacity = ?, monthlyFee = ?
       WHERE id = ?`,
      [
        nextRoomSeries,
        nextRoomNo,
        nextRoomSeries,
        nextFloor,
        nextSharing,
        nextRoomType,
        nextSharing,
        nextMonthlyFee,
        id,
      ]
    );

    const updated = await getAsync(`SELECT * FROM rooms WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const assignRoomToStudent = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { studentId, roomId } = req.body;

    const student = await getAsync(`SELECT * FROM users WHERE id = ?`, [studentId]);
    const targetRoom = await getAsync(`SELECT * FROM rooms WHERE id = ?`, [roomId]);

    if (!student || student.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    if (!targetRoom) {
      return res.status(404).json({ message: "Room not found" });
    }

    if (Number(targetRoom.occupied) >= Number(targetRoom.capacity)) {
      return res.status(400).json({ message: "Selected room is already full" });
    }

    const previousRoom = student.room && student.room !== "Not Allotted"
      ? await getAsync(`SELECT * FROM rooms WHERE roomNo = ?`, [student.room])
      : null;

    if (previousRoom && Number(previousRoom.id) === Number(targetRoom.id)) {
      return res.status(400).json({ message: "Student is already allotted to this room" });
    }

    if (previousRoom) {
      await runAsync(
        `UPDATE rooms SET occupied = ? WHERE id = ?`,
        [Math.max(0, Number(previousRoom.occupied || 0) - 1), previousRoom.id]
      );
    }

    await runAsync(
      `UPDATE rooms SET occupied = ? WHERE id = ?`,
      [Number(targetRoom.occupied || 0) + 1, targetRoom.id]
    );

    await runAsync(
      `UPDATE users SET room = ?, hostelBlock = ? WHERE id = ?`,
      [targetRoom.roomNo, targetRoom.block, student.id]
    );

    const fee = await getAsync(`SELECT * FROM fees WHERE studentId = ? ORDER BY id DESC LIMIT 1`, [
      student.studentId,
    ]);

    if (fee) {
      const paidAmount = Number(fee.paidAmount || 0);
      const nextStatus =
        paidAmount >= Number(targetRoom.monthlyFee)
          ? "Paid"
          : paidAmount > 0
          ? "Partial"
          : "Pending";

      await runAsync(
        `UPDATE fees SET amount = ?, status = ? WHERE id = ?`,
        [Number(targetRoom.monthlyFee), nextStatus, fee.id]
      );
    } else {
      await runAsync(
        `INSERT INTO fees (studentId, studentName, amount, paidAmount, dueDate, status, paymentHistory)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          student.studentId,
          student.name,
          Number(targetRoom.monthlyFee),
          0,
          "2026-04-10",
          "Pending",
          "[]",
        ]
      );
    }

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "student",
        "Room Allotted",
        `You have been allotted room ${targetRoom.roomNo}.`,
        0,
      ]
    );

    const updatedStudent = await getAsync(`SELECT * FROM users WHERE id = ?`, [student.id]);
    res.json(updatedStudent);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Fees ---------------------- */

const getStudentFee = async (req, res) => {
  try {
    const studentId = req.user.studentId;

    const fee = await getAsync(
      `SELECT * FROM fees WHERE studentId = ? ORDER BY id DESC LIMIT 1`,
      [studentId]
    );

    res.json(normalizeFee(fee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const payStudentFee = async (req, res) => {
  try {
    const studentId = req.user.studentId;
    const { amount, paymentMethod, paymentDetails } = req.body;

    const fee = await getAsync(
      `SELECT * FROM fees WHERE studentId = ? ORDER BY id DESC LIMIT 1`,
      [studentId]
    );

    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    const paymentAmount = Number(amount || 0);
    if (!paymentAmount || paymentAmount <= 0) {
      return res.status(400).json({ message: "Valid payment amount is required" });
    }

    const totalFee = Number(fee.amount || 0);
    const currentPaid = Number(fee.paidAmount || 0);
    const nextPaid = Math.min(currentPaid + paymentAmount, totalFee);
    const remaining = Math.max(0, totalFee - nextPaid);

    const nextStatus =
      remaining <= 0 ? "Paid" : nextPaid > 0 ? "Partial" : "Pending";

    const currentHistory = fee.paymentHistory ? JSON.parse(fee.paymentHistory) : [];
    const updatedHistory = [
      {
        id: `PAY${Date.now()}`,
        amount: paymentAmount,
        method: paymentMethod || "UPI",
        details: paymentDetails || {},
        date: new Date().toISOString(),
      },
      ...currentHistory,
    ];

    await runAsync(
      `UPDATE fees
       SET paidAmount = ?, status = ?, paymentHistory = ?
       WHERE id = ?`,
      [nextPaid, nextStatus, JSON.stringify(updatedHistory), fee.id]
    );

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "warden",
        "Fee Payment Update",
        `${req.user.name} made a fee payment using ${paymentMethod || "UPI"}.`,
        0,
      ]
    );

    const updatedFee = await getAsync(`SELECT * FROM fees WHERE id = ?`, [fee.id]);
    res.json(normalizeFee(updatedFee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllFees = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const fees = await allAsync(`SELECT * FROM fees ORDER BY id DESC`);
    const normalized = fees.map(normalizeFee);
    res.json(normalized);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFeeStatus = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ message: "Status is required" });
    }

    const fee = await getAsync(`SELECT * FROM fees WHERE id = ?`, [id]);
    if (!fee) {
      return res.status(404).json({ message: "Fee record not found" });
    }

    await runAsync(`UPDATE fees SET status = ? WHERE id = ?`, [status, id]);

    const updatedFee = await getAsync(`SELECT * FROM fees WHERE id = ?`, [id]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "warden",
        "Fee Status Updated",
        `Fee status for ${fee.studentName} has been updated to ${status}.`,
        0,
      ]
    );

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "student",
        "Fee Status Updated",
        `Your fee status has been updated to ${status}.`,
        0,
      ]
    );

    res.json(normalizeFee(updatedFee));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Notices ---------------------- */

const getStudentNotices = async (req, res) => {
  try {
    const notices = await allAsync(`SELECT * FROM notices ORDER BY id DESC`);
    res.json(notices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addNotice = async (req, res) => {
  try {
    const { title, description, priority } = req.body;

    if (!title || !description) {
      return res.status(400).json({ message: "Title and description are required" });
    }

    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const createdBy = req.user.role === "admin" ? "Admin" : "Warden";
    const date = new Date().toISOString().split("T")[0];

    const result = await runAsync(
      `INSERT INTO notices (title, description, priority, date, createdBy)
       VALUES (?, ?, ?, ?, ?)`,
      [title, description, priority || "General", date, createdBy]
    );

    const notice = await getAsync(`SELECT * FROM notices WHERE id = ?`, [result.lastID]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "student",
        "New Notice Added",
        `${createdBy} added a new notice: ${title}`,
        0,
      ]
    );

    res.status(201).json(notice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateNotice = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, priority } = req.body;

    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const existing = await getAsync(`SELECT * FROM notices WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ message: "Notice not found" });
    }

    await runAsync(
      `UPDATE notices
       SET title = ?, description = ?, priority = ?
       WHERE id = ?`,
      [
        title ?? existing.title,
        description ?? existing.description,
        priority ?? existing.priority,
        id,
      ]
    );

    const updated = await getAsync(`SELECT * FROM notices WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Complaints ---------------------- */

const getMyComplaints = async (req, res) => {
  try {
    const complaints = await allAsync(
      `SELECT * FROM complaints WHERE studentId = ? ORDER BY id DESC`,
      [req.user.studentId]
    );

    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllComplaints = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const complaints = await allAsync(`SELECT * FROM complaints ORDER BY id DESC`);
    res.json(complaints);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addComplaint = async (req, res) => {
  try {
    const { category, title, description } = req.body;

    if (!category || !title || !description) {
      return res.status(400).json({
        message: "Category, title and description are required",
      });
    }

    const createdAtLabel = new Date().toISOString().split("T")[0];

    const result = await runAsync(
      `INSERT INTO complaints (studentId, studentName, category, title, description, status, createdAtLabel)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.studentId,
        req.user.name,
        category,
        title,
        description,
        "Pending",
        createdAtLabel,
      ]
    );

    const complaint = await getAsync(`SELECT * FROM complaints WHERE id = ?`, [
      result.lastID,
    ]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "warden",
        "New Complaint",
        `${req.user.name} submitted a complaint: ${title}`,
        0,
      ]
    );

    res.status(201).json(complaint);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateComplaintStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allowedStatuses = ["Pending", "In Progress", "Resolved"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid complaint status" });
    }

    const existing = await getAsync(`SELECT * FROM complaints WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ message: "Complaint not found" });
    }

    await runAsync(`UPDATE complaints SET status = ? WHERE id = ?`, [status, id]);

    const updated = await getAsync(`SELECT * FROM complaints WHERE id = ?`, [id]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "student",
        "Complaint Status Updated",
        `Your complaint "${updated.title}" is now marked as ${status}.`,
        0,
      ]
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Leaves ---------------------- */

const getMyLeaves = async (req, res) => {
  try {
    const leaves = await allAsync(
      `SELECT * FROM leaves_table WHERE studentId = ? ORDER BY id DESC`,
      [req.user.studentId]
    );

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllLeaves = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const leaves = await allAsync(`SELECT * FROM leaves_table ORDER BY id DESC`);
    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addLeaveRequest = async (req, res) => {
  try {
    const { fromDate, toDate, reason } = req.body;

    if (!fromDate || !toDate || !reason) {
      return res.status(400).json({
        message: "From date, to date and reason are required",
      });
    }

    const result = await runAsync(
      `INSERT INTO leaves_table (studentId, studentName, fromDate, toDate, reason, status)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        req.user.studentId,
        req.user.name,
        fromDate,
        toDate,
        reason,
        "Pending",
      ]
    );

    const leave = await getAsync(`SELECT * FROM leaves_table WHERE id = ?`, [
      result.lastID,
    ]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "warden",
        "New Leave Request",
        `${req.user.name} submitted a leave request.`,
        0,
      ]
    );

    res.status(201).json(leave);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const allowedStatuses = ["Pending", "Approved", "Rejected"];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid leave status" });
    }

    const existing = await getAsync(`SELECT * FROM leaves_table WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ message: "Leave request not found" });
    }

    await runAsync(`UPDATE leaves_table SET status = ? WHERE id = ?`, [status, id]);

    const updated = await getAsync(`SELECT * FROM leaves_table WHERE id = ?`, [id]);

    await runAsync(
      `INSERT INTO notifications (recipientRole, title, message, isRead)
       VALUES (?, ?, ?, ?)`,
      [
        "student",
        "Leave Status Updated",
        `Your leave request from ${updated.fromDate} to ${updated.toDate} is ${status}.`,
        0,
      ]
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Food Menu ---------------------- */

const getFoodMenu = async (req, res) => {
  try {
    const menu = await allAsync(`SELECT * FROM food_menu ORDER BY id ASC`);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateFoodMenuItem = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const existing = await getAsync(`SELECT * FROM food_menu WHERE id = ?`, [id]);

    if (!existing) {
      return res.status(404).json({ message: "Food menu item not found" });
    }

    const { breakfast, lunch, snacks, dinner } = req.body;

    await runAsync(
      `UPDATE food_menu
       SET breakfast = ?, lunch = ?, snacks = ?, dinner = ?
       WHERE id = ?`,
      [
        breakfast ?? existing.breakfast,
        lunch ?? existing.lunch,
        snacks ?? existing.snacks,
        dinner ?? existing.dinner,
        id,
      ]
    );

    const updated = await getAsync(`SELECT * FROM food_menu WHERE id = ?`, [id]);
    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Students ---------------------- */

const getStudents = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const students = await allAsync(
      `SELECT id, studentId, name, email, phone, course, year, parentContact, room, hostelBlock, role
       FROM users
       WHERE role = 'student'
       ORDER BY id DESC`
    );

    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateStudentByAdminOrWarden = async (req, res) => {
  try {
    if (!["admin", "warden"].includes(req.user.role)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const { id } = req.params;
    const existing = await getAsync(`SELECT * FROM users WHERE id = ?`, [id]);

    if (!existing || existing.role !== "student") {
      return res.status(404).json({ message: "Student not found" });
    }

    const nextName = req.body.name ?? existing.name;
    const nextPhone = req.body.phone ?? existing.phone;
    const nextCourse = req.body.course ?? existing.course;
    const nextYear = req.body.year ?? existing.year;
    const nextParentContact = req.body.parentContact ?? existing.parentContact;

    await runAsync(
      `UPDATE users
       SET name = ?, phone = ?, course = ?, year = ?, parentContact = ?
       WHERE id = ?`,
      [nextName, nextPhone, nextCourse, nextYear, nextParentContact, id]
    );

    await runAsync(
      `UPDATE fees SET studentName = ? WHERE studentId = ?`,
      [nextName, existing.studentId]
    );

    const updated = await getAsync(
      `SELECT id, studentId, name, email, phone, course, year, parentContact, room, hostelBlock, role
       FROM users WHERE id = ?`,
      [id]
    );

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/* ---------------------- Notifications ---------------------- */

const getNotificationsByRole = async (req, res) => {
  try {
    const notifications = await allAsync(
      `SELECT * FROM notifications
       WHERE recipientRole = ?
       ORDER BY id DESC`,
      [req.user.role]
    );

    const mapped = notifications.map((item) => ({
      ...item,
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const markAllNotificationsRead = async (req, res) => {
  try {
    await runAsync(
      `UPDATE notifications SET isRead = 1 WHERE recipientRole = ?`,
      [req.user.role]
    );

    const notifications = await allAsync(
      `SELECT * FROM notifications
       WHERE recipientRole = ?
       ORDER BY id DESC`,
      [req.user.role]
    );

    const mapped = notifications.map((item) => ({
      ...item,
      isRead: Boolean(item.isRead),
      createdAt: item.createdAt,
    }));

    res.json(mapped);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getRooms,
  addRoom,
  updateRoom,
  assignRoomToStudent,
  getStudentFee,
  payStudentFee,
  getAllFees,
  updateFeeStatus,
  getStudentNotices,
  addNotice,
  updateNotice,
  getMyComplaints,
  getAllComplaints,
  addComplaint,
  updateComplaintStatus,
  getMyLeaves,
  getAllLeaves,
  addLeaveRequest,
  updateLeaveStatus,
  getFoodMenu,
  updateFoodMenuItem,
  getStudents,
  updateStudentByAdminOrWarden,
  getNotificationsByRole,
  markAllNotificationsRead,
};