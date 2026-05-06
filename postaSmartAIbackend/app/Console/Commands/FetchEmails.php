<?php

namespace App\Console\Commands;

use App\Services\MailboxService;
use Illuminate\Console\Command;

class FetchEmails extends Command
{
    protected $signature   = 'emails:fetch';
    protected $description = 'Récupère les mails non lus depuis la boîte de réception IMAP';

    public function handle(MailboxService $mailbox): int
    {
        $this->info('Récupération des mails en cours...');

        try {
            $emails = $mailbox->fetchUnreadEmails();
            $count  = 0;

            foreach ($emails as $emailData) {
                $mailbox->syncEmailToDatabase($emailData);
                $count++;
            }

            $this->info("{$count} mail(s) récupéré(s) avec succès.");
            return Command::SUCCESS;
        } catch (\Exception $e) {
            $this->error('Erreur lors de la récupération des mails: ' . $e->getMessage());
            return Command::FAILURE;
        }
    }
}
