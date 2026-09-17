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
        // needsSupport is a legacy alias of support — normalize so both get the same subject.
        // atRisk wording stays soft on purpose: subjects alarm parents faster than body copy.
        $status = $this->data['status'] ?? null;
        $status = $status === 'needsSupport' ? 'support' : $status;

        $subject = match ($status) {
            'onTrack' => "Great News — {$this->data['name']} is On Track!",
            'support' => "Progress Update — {$this->data['name']} Needs Support",
            'atRisk' => "Support Needed — {$this->data['name']}'s Progress Report",
            'in_progress' => "Progress Update — {$this->data['name']} is In Progress",
            'notStarted' => "Getting Started — {$this->data['name']}'s Word-O-Matic Report",
            default => "Performance Report — {$this->data['name']}",
        };

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
