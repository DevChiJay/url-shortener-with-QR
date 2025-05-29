const transporter = require("../config/mailer");
const emailTemplate = require("../utils/email-template");

function isEmpty(value) {
  return !value || value.trim() === "";
}

const contactUs = async (req, res, next) => {
  const enteredData = req.body;
  enteredData.sendTo = "devchijay@gmail.com"; // Default recipient email

  try {
    if (
      isEmpty(enteredData.fullName) ||
      isEmpty(enteredData.message)
    ) {
      return res.status(400).json({
        message:
          "Please check your input. Be sure to provide a valid email, subject and message",
        status: "invalid",
      });
    }
    await transporter.sendMail(emailTemplate(enteredData));
    return res
      .status(200)
      .json({ message: "Message sent successfully!", status: "success" });
  } catch (error) {
    return next(error);
  }
};

module.exports = contactUs;
