import API from "./api";

export const getRoomsApi = async () => {
  const res = await API.get("/hostel/rooms");
  return res.data;
};

export const addRoomApi = async (payload) => {
  const res = await API.post("/hostel/rooms", payload);
  return res.data;
};

export const updateRoomApi = async (id, payload) => {
  const res = await API.put(`/hostel/rooms/${id}`, payload);
  return res.data;
};

export const assignRoomApi = async (payload) => {
  const res = await API.post("/hostel/rooms/assign", payload);
  return res.data;
};

export const getMyFeeApi = async () => {
  const res = await API.get("/hostel/fees/me");
  return res.data;
};

export const payMyFeeApi = async (payload) => {
  const res = await API.post("/hostel/fees/pay", payload);
  return res.data;
};

export const getFeesApi = async () => {
  const res = await API.get("/hostel/fees");
  return res.data;
};

export const updateFeeStatusApi = async (id, payload) => {
  const res = await API.put(`/hostel/fees/${id}/status`, payload);
  return res.data;
};

export const getNoticesApi = async () => {
  const res = await API.get("/hostel/notices");
  return res.data;
};

export const addNoticeApi = async (payload) => {
  const res = await API.post("/hostel/notices", payload);
  return res.data;
};

export const updateNoticeApi = async (id, payload) => {
  const res = await API.put(`/hostel/notices/${id}`, payload);
  return res.data;
};

export const getMyComplaintsApi = async () => {
  const res = await API.get("/hostel/complaints/me");
  return res.data;
};

export const getAllComplaintsApi = async () => {
  const res = await API.get("/hostel/complaints");
  return res.data;
};

export const addComplaintApi = async (payload) => {
  const res = await API.post("/hostel/complaints", payload);
  return res.data;
};

export const updateComplaintStatusApi = async (id, payload) => {
  const res = await API.put(`/hostel/complaints/${id}/status`, payload);
  return res.data;
};

export const getMyLeavesApi = async () => {
  const res = await API.get("/hostel/leaves/me");
  return res.data;
};

export const getAllLeavesApi = async () => {
  const res = await API.get("/hostel/leaves");
  return res.data;
};

export const addLeaveApi = async (payload) => {
  const res = await API.post("/hostel/leaves", payload);
  return res.data;
};

export const updateLeaveStatusApi = async (id, payload) => {
  const res = await API.put(`/hostel/leaves/${id}/status`, payload);
  return res.data;
};

export const getFoodMenuApi = async () => {
  const res = await API.get("/hostel/food-menu");
  return res.data;
};

export const updateFoodMenuApi = async (id, payload) => {
  const res = await API.put(`/hostel/food-menu/${id}`, payload);
  return res.data;
};

export const getStudentsApi = async () => {
  const res = await API.get("/hostel/students");
  return res.data;
};

export const updateStudentApi = async (id, payload) => {
  const res = await API.put(`/hostel/students/${id}`, payload);
  return res.data;
};

export const getNotificationsApi = async () => {
  const res = await API.get("/hostel/notifications");
  return res.data;
};

export const markAllNotificationsReadApi = async () => {
  const res = await API.put("/hostel/notifications/read-all");
  return res.data;
};