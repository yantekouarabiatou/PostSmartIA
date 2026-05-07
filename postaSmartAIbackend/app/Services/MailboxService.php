<?php

namespace App\Services;

use App\Models\EmailInbox;
use Illuminate\Support\Facades\Log;
use Webklex\PHPIMAP\ClientManager;

class MailboxService
{
    public function fetchUnreadEmails(): array
    {
        try {
            $cm     = new ClientManager(config('imap'));
            $client = $cm->account('default');

            $client->connect();
            $folder  = $client->getFolder('INBOX');
            $message = $folder->query()->unseen()->get();

            $emails = [];
            foreach ($message as $msg) {
                $emails[] = $this->parseEmail($msg);
            }

            return $emails;
        } catch (\Exception $e) {
            Log::error('IMAP fetch error: ' . $e->getMessage());
            return [];
        }
    }

    public function fetchEmailById(string $messageId): ?array
    {
        $email = EmailInbox::where('message_id', $messageId)->first();
        return $email ? $email->toArray() : null;
    }

    public function markAsRead(string $messageId): bool
    {
        return (bool) EmailInbox::where('message_id', $messageId)->update(['is_read' => true]);
    }

    public function moveToFolder(string $messageId, string $folder): bool
    {
        // Would be implemented with IMAP client
        return true;
    }

    private function parseEmail($msg): array
    {
        $from = $msg->getFrom()->first();

        try {
            $date = \Carbon\Carbon::parse((string) $msg->getDate())->toDateTimeString();
        } catch (\Exception) {
            $date = now()->toDateTimeString();
        }

        return [
            'id'          => (string) $msg->getMessageId(),
            'from_name'   => $from?->personal ?? null,
            'from_email'  => $from?->mail ?? '',
            'subject'     => (string) $msg->getSubject(),
            'body_text'   => (string) $msg->getTextBody(),
            'body_html'   => (string) $msg->getHtmlBody(),
            'received_at' => $date,
            'is_read'     => false,
            'attachments' => [],
        ];
    }

    public function syncEmailToDatabase(array $emailData): EmailInbox
    {
        return EmailInbox::updateOrCreate(
            ['message_id' => $emailData['id']],
            [
                'from_name'   => $emailData['from_name'],
                'from_email'  => $emailData['from_email'],
                'subject'     => $emailData['subject'],
                'body_text'   => $emailData['body_text'],
                'body_html'   => $emailData['body_html'],
                'received_at' => $emailData['received_at'],
                'is_read'     => false,
            ]
        );
    }
}
