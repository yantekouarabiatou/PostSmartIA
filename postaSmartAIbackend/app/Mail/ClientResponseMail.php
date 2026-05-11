<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ClientResponseMail extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string  $clientName,
        public string  $subject,
        public string  $body,
        public string  $advisorName,
        public ?string $replyTo = null,
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(subject: $this->subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.client-response');
    }

    public function attachments(): array
    {
        return [];
    }
}
