const jwt = require('jsonwebtoken')
module.exports = async (req, res, next) => {
    const authHeader = req.get('Authorization');
    if (!authHeader) {
        const error = new Error('Not Authorization');
        error.statusCode = 401;
        next(error);
    }
    const token = authHeader.split(' ')[1];
    try {
        console.log(token)
        const decodedToken = await jwt.verify(token, 'This-is-a-private-key-that-only-the-server-know');
        if (!decodedToken) {
            const error = new Error('Not Authorization');
            error.statusCode = 401;
            next(error);
        }
        req.userId = decodedToken.userId;
        next();
    }
    catch (err) {
        if (!err.statusCode)
            err.statusCode = 500;
        next(err);
    }

}