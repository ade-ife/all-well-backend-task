
import { Injectable } from '@nestjs/common';
import * as Mailjet from 'node-mailjet';

@Injectable()
export class MailjetService {
  private mailjet: Mailjet.Email.Client;

  constructor() {
    this.mailjet = Mailjet.connect(
      process.env.MAILJET_API_KEY,
      process.env.MAILJET_SECRET_KEY,
    );
  }

  async sendEmail(
    from: string,
    to: string,
    subject: string,
    text: string,
    html?: string,
  ): Promise<void> {
    const request = this.mailjet.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: { Email: from, Name: 'Your Name' },
          To: [{ Email: to, Name: 'Recipient Name' }],
          Subject: subject,
          TextPart: text,
          HTMLPart: html || text,
        },
      ],
    });

    try {
      await request;
    } catch (error) {
      console.error(error.statusCode);
      throw error;
    }
  }
}
