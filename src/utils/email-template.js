const emailTemplate = (enteredData) => {
  return {
    from: `"${enteredData.fullName}" <support@capp.to>`,
    to: enteredData.sendTo, // list of receivers
    subject: `${enteredData.subject} - [Capp Contact Form]`,
    text: "Hello world?", // plain‑text body
    html: `
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
  <div style="
    max-width: 600px;
    margin: 0 auto;
    background-color: #ffffff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    border: 1px solid #e0e0e0;
  ">
    <!-- Header -->
    <div style="
      background: linear-gradient(135deg, #6a11cb 0%, #2575fc 100%);
      color: white;
      padding: 25px;
      text-align: center;
    ">
      <h1 style="margin: 0; font-size: 24px;">New Message Received</h1>
    </div>
    
    <!-- Content -->
    <div style="padding: 30px 25px;">
      <div style="
        background-color: #f9f9f9;
        border-left: 4px solid #2575fc;
        padding: 15px;
        margin-bottom: 20px;
      ">
        <h2 style="margin-top: 0; color: #333; font-size: 18px;">Message Details</h2>
      </div>

      <table style="width: 100%; border-collapse: collapse;">
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; width: 120px; color: #777; font-weight: bold;">From:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${enteredData.fullName} <span style="color: #2575fc;">&lt;${enteredData.email}&gt;</span></td>
        </tr>
        <tr>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee; color: #777; font-weight: bold;">Subject:</td>
          <td style="padding: 10px 0; border-bottom: 1px solid #eee;">${enteredData.subject}</td>
        </tr>
      </table>
      
      <div style="margin-top: 25px;">
        <h3 style="color: #555; font-size: 16px; margin-bottom: 15px; font-weight: 500;">Message:</h3>
        <div style="
          background-color: #f9f9f9;
          border-radius: 4px;
          padding: 20px;
          line-height: 1.5;
          color: #444;
        ">${enteredData.message}</div>
      </div>
    </div>
    
    <!-- Footer -->
    <div style="
      background-color: #f5f5f5;
      padding: 20px;
      text-align: center;
      font-size: 12px;
      color: #777;
      border-top: 1px solid #e0e0e0;
    ">
      <p style="margin: 0;">This is an automated message from your website contact form.</p>
    </div>
  </div>
</body>`, // html body
  };
};

module.exports = emailTemplate;
