import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
const JWT_SECRET = process.env.JWT_SECRET || 'risk-management-secret-key-2026';
const JWT_EXPIRES_IN = '7d';
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
export const hashPassword = async (password) => {
    return bcrypt.hash(password, 10);
};
export const comparePassword = async (password, hashedPassword) => {
    return bcrypt.compare(password, hashedPassword);
};
