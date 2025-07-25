import sendgrid from "@sendgrid/mail";

sendgrid.setApiKey(process.env.SENDGRID_API_KEY);

export async function POST(request) {
  try {
    const { to, firstName, otp, status, type } = await request.json();

    if (!to) {
      return new Response("Recipient email is required", { status: 400 });
    }

    let msg;

    if (type === "account_creation") {
      // Email for Account Creation
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Admin Account Created - SAKE",
        html: `
          <div style="font-family: Arial, sans-serif; line-height: 1.5;">
            <h2>Hi, <strong>${firstName}</strong></h2>
            <p>Your Admin Account for SAKE has been created successfully. You can use the following credentials to log in:</p>
            <p><strong>Email:</strong> ${to}</p>
            <p><strong>Password:</strong> ${otp}</p>
            <div style="margin: 20px 0;">
              <a href="https://yourwebsite.com/login" 
                 style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                 Go to your profile page
              </a>
            </div>
            <p><strong>Note:</strong> It is important to change this default password after logging in for the first time.</p>
            <p>Thank you!</p>
          </div>
        `,
      };
    } else if (type === "status_update") {
      let statusMessage = "";

      if (status === "Verified") {
        statusMessage = `
          <p>Congratulations! Your admin account has been verified. You now have full access to the SAKE system.</p>
          <p>You can log in and start managing your operations.</p>
          <div style="margin: 20px 0;">
            <a href="https://yourwebsite.com/login" 
               style="display: inline-block; background-color:rgb(40, 55, 167); color: #ffffff; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
               Log in to your account
            </a>
          </div>
          <p>Thank you for being part of SAKE!</p>
        `;
      } else if (status === "Suspended") {
        statusMessage = `
          <p>We regret to inform you that your admin account has been suspended.</p>
          <p>If you believe this is an error or wish to appeal, please contact our support team for further assistance.</p>
          <p>We appreciate your understanding.</p>
        `;
      } else {
        statusMessage = `<p>Your account status has been updated to: <strong>${status}</strong>.</p>`;
      }

      // Email for Status Update
      msg = {
        to,
        from: process.env.EMAIL_FROM,
        subject: "Account Status Update - SAKE",
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
