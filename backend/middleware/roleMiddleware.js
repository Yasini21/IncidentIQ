export const allowRoles = (...roles) => {
  return (req, res, next) => {
    // req.user comes from verifyToken
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ msg: "Access denied" });
    }

    next();
  };
};