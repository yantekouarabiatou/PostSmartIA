<?php

namespace App\Http\Controllers;

use App\Models\CallReport;
use App\Models\EmailInbox;
use App\Models\KnowledgeBase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SearchController extends Controller
{
    public function global(Request $request): JsonResponse
    {
        $q = $request->validate(['q' => 'required|string|min:2|max:100'])['q'];

        $emails = EmailInbox::where(function ($query) use ($q) {
                $query->where('subject',   'like', "%{$q}%")
                      ->orWhere('from_name', 'like', "%{$q}%")
                      ->orWhere('body_text', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get()
            ->map(fn ($e) => [
                'id'       => $e->id,
                'type'     => 'email',
                'icon'     => '📧',
                'title'    => $e->subject,
                'subtitle' => $e->from_name ? "De : {$e->from_name}" : $e->from_email,
                'status'   => $e->status,
                'url'      => "/dashboard/incoming?id={$e->id}",
            ]);

        $calls = CallReport::where('user_id', auth()->id())
            ->where(function ($query) use ($q) {
                $query->where('client_name',  'like', "%{$q}%")
                      ->orWhere('call_summary','like', "%{$q}%")
                      ->orWhere('demand_type', 'like', "%{$q}%");
            })
            ->limit(5)
            ->get()
            ->map(fn ($c) => [
                'id'       => $c->id,
                'type'     => 'call',
                'icon'     => '📞',
                'title'    => "Appel — {$c->client_name}",
                'subtitle' => $c->demand_type,
                'status'   => $c->status,
                'url'      => "/dashboard/call-report",
            ]);

        $kb = KnowledgeBase::active()
            ->where(function ($query) use ($q) {
                $query->where('title',   'like', "%{$q}%")
                      ->orWhere('content', 'like', "%{$q}%");
            })
            ->limit(3)
            ->get()
            ->map(fn ($k) => [
                'id'       => $k->id,
                'type'     => 'knowledge',
                'icon'     => '📚',
                'title'    => $k->title,
                'subtitle' => ucfirst($k->type),
                'status'   => null,
                'url'      => "/dashboard/knowledge",
            ]);

        $results = $emails->concat($calls)->concat($kb);

        return response()->json([
            'success' => true,
            'data'    => $results,
            'total'   => $results->count(),
            'query'   => $q,
        ]);
    }
}
