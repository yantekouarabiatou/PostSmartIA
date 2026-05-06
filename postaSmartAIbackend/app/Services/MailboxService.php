<?php

namespace App\Services;

use App\Models\EmailInbox;
use Illuminate\Support\Facades\Log;

class MailboxService
{
    public function fetchUnreadEmails(): array
    {
        try {
            $client = \Webklex\PHPIMAP\ClientManager::make([
                'accounts' => [
                    'default' => [
                        'host'          => config('imap.accounts.default.host'),
                        'port'          => config('imap.accounts.default.port'),
                        'encryption'    => config('imap.accounts.default.encryption'),
                        'validate_cert' => false,
                        'username'      => config('imap.accounts.default.username'),
                        'password'      => config('imap.accounts.default.password'),
                        'protocol'      => 'imap',
                    ],
                ],
            ])->account('default');

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
        $from = $msg->getFrom()[0] ?? null;

        return [
            'id'          => (string) $msg->getMessageId(),
            'from_name'   => $from ? $from->personal : null,
            'from_email'  => $from ? $from->mail : '',
            'subject'     => (string) $msg->getSubject(),
            'body_text'   => (string) $msg->getTextBody(),
            'body_html'   => (string) $msg->getHtmlBody(),
            'received_at' => $msg->getDate()->toDateTimeString(),
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
