// 🚗 Driver statistics endpoint
router.get("/stats", async (req, res) => {
  try {
    res.status(200).json({
      success: true,
      stats: {
        todayEarnings: 2450.75,
        tripsCompleted: 12,
        averageRating: 4.8,
        hoursWorked: 8.5,
        weeklyGrowth: 15.2,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching ride stats",
      error: error.message,
    });
  }
});
