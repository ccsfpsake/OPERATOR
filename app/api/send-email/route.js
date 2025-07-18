import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
  try {
    const { to, firstName, otp, status, type } = await request.json();

    if (!to) {
      return new Response("Recipient email is required", { status: 400 });
    }

    let msg;

    if (type === "driver_account_creation") {
      // Email for Driver Account Creation
      msg = {
        to,
        bcc: "ccsfpsake@gmail.com",
        from: process.env.EMAIL_FROM,
        replyTo: "sakeccsfp24@gmail.com", 
        subject: "Welcome to SAKE - Your Driver Account is Ready",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            <p>Your Driver Account for SAKE has been successfully created.</p>
            <p>You can use the following credentials to log in:</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${otp}</p>
            <div style="margin: 20px 0;">
              <a href="https://drive.google.com/file/d/1TDwO4g-sgOsNGbEpjdwq4wEkfDJhTjnz/view?usp=drive_link" 
                 style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                 Log in to your driver account
              </a>
            </div>
            <p><strong>Note:</strong> Please change your password after logging in for security reasons.</p>
            <p>Drive safely, and welcome aboard!</p>
          </div>
        `,
      };
    } else if (type === "driver_status_update") {
      let statusMessage = "";

      if (status === "Verified") {
        statusMessage = `
          <p>Great news! Your driver account has been verified.</p>
          <p>You are now ready to start accepting rides on SAKE.</p>
          <div style="margin: 20px 0;">
            <a href="https://drive.google.com/file/d/1TDwO4g-sgOsNGbEpjdwq4wEkfDJhTjnz/view?usp=drive_link" 
               style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Log in to your driver account
            </a>
          </div>
          <p>Drive safely and welcome aboard!</p>
        `;
      } else if (status === "Suspended") {
        statusMessage = `
          <p>We regret to inform you that your driver account has been suspended.</p>
          <p>If you believe this is a mistake, please contact our support team.</p>
        `;
      } else {
        statusMessage = `<p>Your driver account status has been updated to: <strong>${status}</strong>.</p>`;
      }

      // Email for Driver Status Update
      msg = {
        to,
        bcc: "ccsfpsake@gmail.com",
        from: process.env.EMAIL_FROM,
        replyTo: "sakeccsfp24@gmail.com", // <-- Added here
        subject: "Driver Account Status Update - SAKE",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            ${statusMessage}
          </div>
        `,
      };
    } else {
      return new Response("Invalid email type", { status: 400 });
    }

    await sendgrid.send(msg);
    return new Response("Email sent successfully", { status: 200 });
  } catch (error) {
    console.error("Error sending email:", error);
    return new Response("Error sending email", { status: 500 });
  }
}
