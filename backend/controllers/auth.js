const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../model/db/user');
const crypto = require('crypto');
const Transporter = require('../APIs/nodemailer');

exports.postLogin = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Could not find the email in the db please try again or signup');
            error.statusCode = 404;
            throw error;
        }

        const isPasswordsEqual = await bcrypt.compare(password, user.password);
        if (!isPasswordsEqual) {
            const error = new Error('The psasword is wrong please try again');
            error.statusCode = 403;
            throw error;
        }

        const userId = user._id.toString();
        const token = await jwt.sign({
            email,
            userId
        },
            'This-is-a-private-key-that-only-the-server-know',
            { expiresIn: '1h' }
        );
        res.status(200).json({ token, userId });

    }
    catch (err) {
        errorsHandler(err, next);
    }
}

exports.postSignUp = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    try {
        let existingUser = await User.find({ email });
        if (existingUser.length !== 0) {
            const error = new Error('this email is already exsit')
            error.statusCode = 409;
            throw error;
        }
        const hashedPassword = await bcrypt.hash(password, 12);
        let user = new User({
            email,
            password: hashedPassword,
        })
        await user.save();
        res.status(201).json({ message: 'a user created!', user_id: user._id, email })

    }
    catch (err) {
        errorsHandler(err, next)
    }


}
const errorsHandler = (err, next) => {
    if (!err.statusCode) {
        err.statusCode = 500;
    }
    next(err);
}
exports.postReset = async (req, res, next) => {
    let email = req.body.email;
    try {
        const user = await User.findOne({ email });
        if (!user) {
            const error = new Error('Could not find the email in the db please try again or signup');
            error.statusCode = 404;
            throw error;
        }
        await crypto.randomBytes(32, async (err, buffer) => {
            if (err) {
                const error = new Error('Some problem with the server');
                error.statusCode = 500;
                throw error;
            }
            const cryptoToken = await buffer.toString('hex');
            user.resetToken = cryptoToken;
            user.resetExpireToken = Date.now() + 3600000;
            await user.save();
            await Transporter.sendMail({
                to: email,
                from: 'leonazraevdev@gmail.com',
                subject: 'Password reset',
                html: `<p>You requested a password reset</p>
                <p>press <a href="http://localhost:8080/#/reset/${cryptoToken}">here </a> to reset your password </p>`
            })
            res.status(200).json({ message: 'reset token created!', cryptoToken });
        })


    }
    catch (err) {
        errorsHandler(err, next);
    }
}
exports.postNewPassword = async (req, res, next) => {
    const resetToken = req.body.resetToken;
    const newPassword = req.body.newPassword;
    try{
         let user = await User.findOne({ resetToken, resetExpireToken: { $gt: Date.now() } });
         if(!user){
             const error = new Error('user not exist or the token has expire, please try to reset again');
             error.statusCode = 401;
             throw error;
         }
         const hashedPassword = await bcrypt.hash(newPassword,12);
         user.password = await hashedPassword;
         await user.save();
         res.status(201).json({message: 'Password changed!'});
         

    }
    catch(err){
        errorsHandler(err,next)
    }
   




}