<?php

namespace App\Contracts;

interface AiServiceInterface
{
    public function analyzeEmail(string $emailContent): array;

    public function generateEmailResponse(string $emailContent, string $serviceType = ''): array;

    public function improveEmail(string $content): array;

    public function generateCallReport(string $callData): array;

    public function chatAssistant(array $messages, string $context = ''): array;

    public function detectEscalationSignals(
        string $emailContent,
        string $serviceType,
        ?string $previousStatus = null,
        ?int $daysSinceFirstContact = null
    ): array;
}
