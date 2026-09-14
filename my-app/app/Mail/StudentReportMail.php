<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Address;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class StudentReportMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public array $data,
    ) {}

    public function envelope(): Envelope
    {
        $subject = $this->data['status'] === 'onTrack'
            ? "Great News — {$this->data['name']} is On Track!"
            : "Performance Report — {$this->data['name']}";

        $teacherEmail = $this->data['teacher_email'] ?? null;
        $teacherName = $this->data['teacher_name'] ?? config('mail.from.name');

        return new Envelope(
            subject: $subject,
            replyTo: $teacherEmail ? [new Address($teacherEmail, $teacherName)] : [],
        );
    }

    public function content(): Content
    {
        return new Content(
            view: 'emails.student-report',
        );
    }
}
