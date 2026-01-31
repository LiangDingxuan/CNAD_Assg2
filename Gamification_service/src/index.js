const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const UserGamification = require('./models/userGamification.model');
const Badge = require('./models/badge.model');
const UserBadge = require('./models/userBadge.model');
const VoucherRedemption = require('./models/voucherRedemption.model');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.GAMIFICATION_SERVICE_PORT || 3004;
const DB_NAME = process.env.GAMIFICATION_DB_NAME || 'gamification';

async function connectDb() {
  await mongoose.connect(process.env.MONGODB_URI, { dbName: DB_NAME });
  console.log(`Connected to MongoDB (db: ${DB_NAME})`);
}

app.get('/health', (_, res) => {
  res.json({ status: 'ok' });
});

// GET /api/gamification/user/:userId
app.get('/api/gamification/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;
    const stats = await UserGamification.findOne({ userId }).lean();
    const badges = await UserBadge.find({ userId }).populate('badgeId').lean();

    return res.json({
      userId,
      points: stats?.points || 0,
      currentStreak: stats?.currentStreak || 0,
      longestStreak: stats?.longestStreak || 0,
      badges: badges.map((b) => ({
        id: String(b.badgeId?._id || b.badgeId),
        name: b.badgeId?.name || 'Unknown',
        code: b.badgeId?.code || '',
        awardedAt: b.awardedAt
      }))
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gamification/award-points (internal)
app.post('/api/gamification/award-points', async (req, res) => {
  try {
    const { userId, points = 0 } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ message: 'points must be a positive number' });
    }

    const updated = await UserGamification.findOneAndUpdate(
      { userId },
      { $inc: { points }, $setOnInsert: { currentStreak: 0, longestStreak: 0 } },
      { new: true, upsert: true }
    );

    return res.json({ userId, points: updated.points });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gamification/check-badges (internal stub)
app.post('/api/gamification/check-badges', async (req, res) => {
  try {
    const { userId } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    return res.json({ userId, awarded: [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/gamification/redeem-voucher
app.post('/api/gamification/redeem-voucher', async (req, res) => {
  try {
    const { userId, points } = req.body || {};
    if (!userId) return res.status(400).json({ message: 'userId is required' });
    if (typeof points !== 'number' || points <= 0) {
      return res.status(400).json({ message: 'points must be a positive number' });
    }

    const stats = await UserGamification.findOne({ userId });
    if (!stats || stats.points < points) {
      return res.status(400).json({ message: 'Insufficient points' });
    }

    stats.points -= points;
    await stats.save();

    const voucherCode = `VCH-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
    const redemption = await VoucherRedemption.create({ userId, pointsSpent: points, voucherCode });

    return res.json({
      userId,
      pointsRemaining: stats.points,
      voucherCode,
      redemptionId: String(redemption._id)
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/gamification/stats (staff dashboard aggregate)
app.get('/api/gamification/stats', async (_req, res) => {
  try {
    const [userStats, redemptions] = await Promise.all([
      UserGamification.find().lean(),
      VoucherRedemption.find().lean()
    ]);

    const totalUsers = userStats.length;
    const totalPoints = userStats.reduce((sum, u) => sum + (u.points || 0), 0);
    const totalRedemptions = redemptions.length;

    const topUsers = userStats
      .sort((a, b) => (b.points || 0) - (a.points || 0))
      .slice(0, 5)
      .map((u) => ({ userId: u.userId, points: u.points || 0 }));

    return res.json({
      totalUsers,
      totalPoints,
      totalRedemptions,
      topUsers
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

connectDb()
  .then(() => app.listen(PORT, () => console.log(`Gamification service running on ${PORT}`)))
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });
