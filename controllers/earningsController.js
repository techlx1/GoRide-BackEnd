// controllers/earningsController.js
export const getEarningsSummary = async (req, res) => {
  try {
    const driverId = req.params.driverId;
    // Replace with real DB query
    const summary = {
      driver_id: driverId,
      totalEarnings: 15200,
      completedRides: 37,
      pendingPayments: 2,
    };
    res.status(200).json({ success: true, data: summary });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
