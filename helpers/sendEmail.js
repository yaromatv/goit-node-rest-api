import {
    ApiClient,
    EmailsApi,
    EmailMessageData,
    EmailRecipient,
    BodyPart,
} from "@elasticemail/elasticemail-client";
import dotenv from "dotenv";

dotenv.config();

const defaultClient = ApiClient.instance;

const { ELASTICEMAIL_API_KEY } = process.env;
const apikey = defaultClient.authentications["apikey"];
apikey.apiKey = ELASTICEMAIL_API_KEY;

const api = new EmailsApi();

function sendEmail(data) {
    const email = EmailMessageData.constructFromObject({
        Recipients: [new EmailRecipient(data.to)],
        Content: {
            Body: [
                BodyPart.constructFromObject({
                    ContentType: "HTML",
                    Content: data.content,
                }),
            ],
            Subject: data.subject,
            From: "yaromatv@gmail.com",
        },
    });

    const callback = function (error, data, response) {
        if (error) {
            console.error(error);
        } else {
            console.log("Email sent successfully.");
        }
    };

    api.emailsPost(email, callback);
}

// sendEmail({
//     to: "jakiha3912@darkse.com",
//     subject: "Email Fn",
//     content: "Hello from Fn",
// });

export default sendEmail;
