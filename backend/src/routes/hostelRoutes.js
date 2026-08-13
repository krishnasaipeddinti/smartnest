const express = require("express");
const router = express.Router();

const {
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
} = require("../controllers/hostelController");

const { protect } = require("../middleware/authMiddleware");

router.get("/rooms", protect, getRooms);
router.post("/rooms", protect, addRoom);
router.put("/rooms/:id", protect, updateRoom);
router.post("/rooms/assign", protect, assignRoomToStudent);

router.get("/fees/me", protect, getStudentFee);
router.post("/fees/pay", protect, payStudentFee);
router.get("/fees", protect, getAllFees);
router.put("/fees/:id/status", protect, updateFeeStatus);

router.get("/notices", protect, getStudentNotices);
router.post("/notices", protect, addNotice);
router.put("/notices/:id", protect, updateNotice);

router.get("/complaints/me", protect, getMyComplaints);
router.get("/complaints", protect, getAllComplaints);
router.post("/complaints", protect, addComplaint);
router.put("/complaints/:id/status", protect, updateComplaintStatus);

router.get("/leaves/me", protect, getMyLeaves);
router.get("/leaves", protect, getAllLeaves);
router.post("/leaves", protect, addLeaveRequest);
router.put("/leaves/:id/status", protect, updateLeaveStatus);

router.get("/food-menu", protect, getFoodMenu);
router.put("/food-menu/:id", protect, updateFoodMenuItem);

router.get("/students", protect, getStudents);
router.put("/students/:id", protect, updateStudentByAdminOrWarden);

router.get("/notifications", protect, getNotificationsByRole);
router.put("/notifications/read-all", protect, markAllNotificationsRead);

module.exports = router;