const nodemailer = require("nodemailer");

const mailSender = async (email, title, body) => {
    try{
        //Transporter function
        let transporter = nodemailer.createTransport({
        host:process.env.MAIL_HOST,
        auth:{
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
        }
        })
        //SENDING MAIL
        let info = await transporter.sendMail({
        from: 'StudyNotion || CodeHelp - by Lokesh Malav',
        to:`${email}`,
        subject: `${title}`,
        html: `${body}`,
        })
        console.log(info);
        return info;
    }
    catch(error) {
        console.log(error.message);
    }
}

module.exports = mailSender;