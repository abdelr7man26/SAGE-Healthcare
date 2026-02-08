const jwt = require('jsonwebtoken');

const auth = (request, response, next) => {
    const token = request.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
        return response.status(401).json({ message: 'No token, authorization denied' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        request.user = decoded.user;
        next(); 
    } catch (err) {
        response.status(401).json({ message: 'Token is not valid' });
    }
};

const authorize = (...roles) => {
    return (request, response, next) => {
        if (!roles.includes(request.user.role)) {
            return response.status(403).json({ message: 'Access denied' });
        }
        next();
    };
};

module.exports = { auth, authorize };