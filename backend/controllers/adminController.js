import { User } from '../models/User.js';
import { AppError } from '../utils/AppError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

export const updateUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { status: req.body.status },
    { new: true },
  );
  if (!user) throw new AppError('User not found', 404);
  res.json({ user });
});
