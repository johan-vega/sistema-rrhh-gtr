<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreLaborRequest;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\LaborRequestResource;
use App\Models\LaborRequest;
use App\Models\RequestCategory;
use App\Models\RequestDocument;
use App\Services\LaborRequestService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class LaborRequestController extends ApiController
{
    public function __construct(private readonly LaborRequestService $service) {}

    public function categories()
    {
        return $this->success(CategoryResource::collection(RequestCategory::where('active', true)->orderBy('name')->get()));
    }

    public function index(Request $request)
    {
        $query = LaborRequest::with('category')->where('worker_id', $request->user()->worker->id)->latest('requested_at');

        return $this->success(LaborRequestResource::collection($query->paginate(15)));
    }

    public function store(StoreLaborRequest $request)
    {
        abort_unless($request->user()->worker?->active, 403);
        $item = $this->service->create($request->user()->worker, $request->validated(), $request->file('documents', []), $request->user());

        return $this->success(new LaborRequestResource($item->load(['category', 'documents'])), 'Solicitud creada correctamente', 201);
    }

    public function show(LaborRequest $request)
    {
        $this->authorize('view', $request);

        return $this->success(new LaborRequestResource($request->load(['category', 'worker.area', 'worker.position', 'documents', 'histories.user'])));
    }

    public function cancel(Request $httpRequest, LaborRequest $request)
    {
        $this->authorize('cancel', $request);
        $this->service->cancel($request->load('category', 'worker.user'), $httpRequest->user(), $httpRequest->validate(['comment' => ['nullable', 'string', 'max:1000']])['comment'] ?? null);

        return $this->success(null, 'Solicitud cancelada correctamente');
    }

    public function download(LaborRequest $request, RequestDocument $document)
    {
        $this->authorize('downloadDocument', $request);
        abort_unless($document->labor_request_id === $request->id, 404);
        abort_unless(Storage::disk('local')->exists($document->path), 404);

        return Storage::disk('local')->download($document->path, $document->original_name, ['Content-Type' => $document->mime_type]);
    }

    public function calendar(Request $request)
    {
        $items = LaborRequest::with('category')->where('worker_id', $request->user()->worker->id)->where('status', 'APROBADA')->whereDate('end_date', '>=', $request->query('from', today()->startOfMonth()))->when($request->query('to'), fn ($q, $to) => $q->whereDate('start_date', '<=', $to))->get();

        return $this->success(LaborRequestResource::collection($items));
    }
}
