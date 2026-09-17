<?php

namespace App\Http\Controllers;

use App\Enums\RequestStatus;
use App\Http\Requests\ManageResourceRequest;
use App\Http\Requests\StoreWorkerRequest;
use App\Http\Requests\UpdateWorkerRequest;
use App\Http\Resources\AreaResource;
use App\Http\Resources\CategoryResource;
use App\Http\Resources\LaborRequestResource;
use App\Http\Resources\PositionResource;
use App\Http\Resources\WorkerResource;
use App\Models\Area;
use App\Models\LaborRequest;
use App\Models\Position;
use App\Models\RequestCategory;
use App\Models\Role;
use App\Models\User;
use App\Models\Worker;
use App\Services\WorkerPhotoService;
use Throwable;
use App\Services\LaborRequestService;
use App\Services\RequestReportExportService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class HrController extends ApiController
{
    public function __construct(private readonly LaborRequestService $service) {}

    public function dashboard()
    {
        $recent = LaborRequest::with(['category', 'worker.area', 'worker.position'])
            ->where('status', RequestStatus::PENDING)
            ->latest('requested_at')
            ->limit(5)
            ->get();

        return $this->success([
            'pending' => LaborRequest::where('status', RequestStatus::PENDING)->count(),
            'approved' => LaborRequest::where('status', RequestStatus::APPROVED)->count(),
            'rejected' => LaborRequest::where('status', RequestStatus::REJECTED)->count(),
            'cancelled' => LaborRequest::where('status', RequestStatus::CANCELLED)->count(),
            'active_workers' => Worker::where('active', true)->count(),
            'requests_this_month' => LaborRequest::whereBetween('requested_at', [now()->startOfMonth(), now()->endOfMonth()])->count(),
            'recent_requests' => LaborRequestResource::collection($recent)->resolve(request()),
        ]);
    }

    public function workers(Request $request)
    {
        $q = Worker::with(['user', 'area', 'position'])->when($request->query('active') !== null, fn ($q) => $q->where('active', filter_var($request->query('active'), FILTER_VALIDATE_BOOLEAN)))->when($request->query('search'), fn ($q, $s) => $q->where(fn ($w) => $w->where('dni', 'like', "%$s%")->orWhere('first_name', 'like', "%$s%")->orWhere('last_name', 'like', "%$s%")));

        return $this->success(WorkerResource::collection($q->orderBy('last_name')->paginate(20)));
    }

    public function storeWorker(StoreWorkerRequest $request, WorkerPhotoService $photos)
    {
        $data = $request->validated();
        unset($data['photo']);
        $newPhoto = $request->hasFile('photo') ? $photos->store($request->file('photo')) : null;
        if ($newPhoto) $data['photo_path'] = $newPhoto;
        try {
            $worker = DB::transaction(function () use ($data) {
                $role = Role::where('code', Role::WORKER)->firstOrFail();
                $user = User::create(['name' => "{$data['first_name']} {$data['last_name']}", 'email' => $data['email'], 'password' => $data['password'], 'role_id' => $role->id]);

                return Worker::create(array_merge(collect($data)->except(['email', 'password', 'password_confirmation'])->all(), ['user_id' => $user->id]));
            });
        } catch (Throwable $exception) {
            $photos->delete($newPhoto);
            throw $exception;
        }
        return $this->success(new WorkerResource($worker->load(['user', 'area', 'position'])), 'Trabajador creado correctamente', 201);
    }

    public function showWorker(Worker $worker)
    {
        return $this->success(new WorkerResource($worker->load(['user', 'area', 'position'])));
    }

    public function updateWorker(UpdateWorkerRequest $request, Worker $worker, WorkerPhotoService $photos)
    {
        $data = $request->validated();
        unset($data['photo']);
        $newPhoto = $request->hasFile('photo') ? $photos->store($request->file('photo')) : null;
        $oldPhoto = null;
        try {
            DB::transaction(function () use ($worker, $data, $newPhoto, &$oldPhoto) {
                $locked = Worker::whereKey($worker->id)->lockForUpdate()->firstOrFail();
                $oldPhoto = $locked->photo_path;
                $locked->user->update(['email' => $data['email'], 'name' => "{$data['first_name']} {$data['last_name']}"]);
                $locked->update(array_merge(collect($data)->except('email')->all(), $newPhoto ? ['photo_path' => $newPhoto] : []));
            });
        } catch (Throwable $exception) {
            $photos->delete($newPhoto);
            throw $exception;
        }
        if ($newPhoto) $photos->delete($oldPhoto);

        return $this->success(new WorkerResource($worker->fresh()->load(['user', 'area', 'position'])), 'Trabajador actualizado correctamente');
    }

    public function workerStatus(Request $request, Worker $worker)
    {
        $data = $request->validate(['active' => ['required', 'boolean']]);
        $worker->update($data);

        return $this->success(new WorkerResource($worker->load(['user', 'area', 'position'])), 'Estado actualizado correctamente');
    }

    public function areas()
    {
        return $this->success(AreaResource::collection(Area::orderBy('name')->get()));
    }

    public function storeArea(ManageResourceRequest $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', 'unique:areas,name'], 'max_simultaneous_permissions' => ['nullable', 'integer', 'min:1', 'max:4294967295'], 'description' => ['nullable', 'string', 'max:1000'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'active' => ['sometimes', 'boolean']]);

        return $this->success(new AreaResource(Area::create($data)), 'Área creada correctamente', 201);
    }

    public function updateArea(ManageResourceRequest $request, Area $area)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', "unique:areas,name,{$area->id}"], 'max_simultaneous_permissions' => ['nullable', 'integer', 'min:1', 'max:4294967295'], 'description' => ['nullable', 'string', 'max:1000'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365']]);
        $area->update($data);

        return $this->success(new AreaResource($area), 'Área actualizada correctamente');
    }

    public function areaStatus(Request $request, Area $area)
    {
        $area->update($request->validate(['active' => ['required', 'boolean']]));

        return $this->success(new AreaResource($area), 'Estado actualizado correctamente');
    }

    public function positions()
    {
        return $this->success(PositionResource::collection(Position::orderBy('name')->get()));
    }

    public function storePosition(ManageResourceRequest $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', 'unique:positions,name'], 'description' => ['nullable', 'string', 'max:1000'], 'active' => ['sometimes', 'boolean']]);

        return $this->success(new PositionResource(Position::create($data)), 'Puesto creado correctamente', 201);
    }

    public function updatePosition(ManageResourceRequest $request, Position $position)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', "unique:positions,name,{$position->id}"], 'description' => ['nullable', 'string', 'max:1000']]);
        $position->update($data);

        return $this->success(new PositionResource($position), 'Puesto actualizado correctamente');
    }

    public function positionStatus(Request $request, Position $position)
    {
        $position->update($request->validate(['active' => ['required', 'boolean']]));

        return $this->success(new PositionResource($position), 'Estado actualizado correctamente');
    }

    public function categories()
    {
        return $this->success(CategoryResource::collection(RequestCategory::orderBy('name')->get()));
    }

    public function storeCategory(ManageResourceRequest $request)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', 'unique:request_categories,name'], 'description' => ['nullable', 'string', 'max:1000'], 'requires_document' => ['required', 'boolean'], 'minimum_notice_days' => ['required', 'integer', 'min:0', 'max:365'], 'maximum_past_days' => ['nullable', 'integer', 'min:0', 'max:365'], 'allow_approved_cancellation' => ['sometimes', 'boolean'], 'is_absence' => ['sometimes', 'boolean'], 'active' => ['sometimes', 'boolean']]);

        return $this->success(new CategoryResource(RequestCategory::create($data)), 'Categoría creada correctamente', 201);
    }

    public function showCategory(RequestCategory $category)
    {
        return $this->success(new CategoryResource($category));
    }

    public function updateCategory(ManageResourceRequest $request, RequestCategory $category)
    {
        $data = $request->validate(['name' => ['required', 'string', 'max:150', "unique:request_categories,name,{$category->id}"], 'description' => ['nullable', 'string', 'max:1000'], 'requires_document' => ['required', 'boolean'], 'minimum_notice_days' => ['required', 'integer', 'min:0', 'max:365'], 'maximum_past_days' => ['nullable', 'integer', 'min:0', 'max:365'], 'allow_approved_cancellation' => ['sometimes', 'boolean'], 'is_absence' => ['sometimes', 'boolean']]);
        $category->update($data);

        return $this->success(new CategoryResource($category), 'Categoría actualizada correctamente');
    }

    public function categoryStatus(Request $request, RequestCategory $category)
    {
        $category->update($request->validate(['active' => ['required', 'boolean']]));

        return $this->success(new CategoryResource($category), 'Estado actualizado correctamente');
    }

    public function requests(Request $request)
    {
        $q = LaborRequest::with(['category', 'worker.area', 'worker.position'])->when($request->query('worker_id'), fn ($q, $id) => $q->where('worker_id', $id))->when($request->query('area_id'), fn ($q, $id) => $q->whereHas('worker', fn ($w) => $w->where('area_id', $id)))->when($request->query('category_id'), fn ($q, $id) => $q->where('category_id', $id))->when($request->query('status'), fn ($q, $s) => $q->where('status', $s))->when($request->query('from'), fn ($q, $d) => $q->whereDate('end_date', '>=', $d))->when($request->query('to'), fn ($q, $d) => $q->whereDate('start_date', '<=', $d));

        return $this->success(LaborRequestResource::collection($q->latest('requested_at')->paginate(20)));
    }

    public function showRequest(LaborRequest $request)
    {
        return $this->success(new LaborRequestResource($request->load(['category', 'worker.area', 'worker.position', 'documents', 'histories.user'])));
    }

    public function approve(Request $httpRequest, LaborRequest $request)
    {
        $data = $httpRequest->validate(['observation' => ['nullable', 'string', 'max:2000']]);
        $this->service->respond($request->load(['worker.user']), $httpRequest->user(), true, $data['observation'] ?? '');

        return $this->success(new LaborRequestResource($request->fresh()->load(['category', 'worker.area', 'worker.position', 'documents', 'histories.user'])), 'Solicitud aprobada correctamente');
    }

    public function reject(Request $httpRequest, LaborRequest $request)
    {
        $data = $httpRequest->validate(['observation' => ['required', 'string', 'max:2000']]);
        $this->service->respond($request->load(['worker.user']), $httpRequest->user(), false, $data['observation']);

        return $this->success(new LaborRequestResource($request->fresh()->load(['category', 'worker.area', 'worker.position', 'documents', 'histories.user'])), 'Solicitud rechazada correctamente');
    }

    public function cancelRequest(Request $httpRequest, LaborRequest $request)
    {
        $data = $httpRequest->validate(['comment' => ['nullable', 'string', 'max:1000']]);
        $this->service->cancel($request->load(['category', 'worker.user']), $httpRequest->user(), $data['comment'] ?? null);

        return $this->success(new LaborRequestResource($request->fresh()->load(['category', 'worker.area', 'worker.position', 'documents', 'histories.user'])), 'Solicitud cancelada correctamente');
    }

    public function calendar(Request $request)
    {
        $q = LaborRequest::with(['category', 'worker.area', 'worker.position'])->where('status', RequestStatus::APPROVED)->when($request->query('worker_id'), fn ($q, $id) => $q->where('worker_id', $id))->when($request->query('area_id'), fn ($q, $id) => $q->whereHas('worker', fn ($w) => $w->where('area_id', $id)))->when($request->query('category_id'), fn ($q, $id) => $q->where('category_id', $id))->when($request->query('from'), fn ($q, $d) => $q->whereDate('end_date', '>=', $d))->when($request->query('to'), fn ($q, $d) => $q->whereDate('start_date', '<=', $d));

        return $this->success(LaborRequestResource::collection($q->orderBy('start_date')->get()));
    }

    public function report(Request $request)
    {
        $filters = $this->reportFilters($request);
        $items = $this->reportQuery($filters)->orderBy('requested_at')->get();

        return $this->success([
            'summary' => $this->reportSummary($items),
            'items' => LaborRequestResource::collection($items)->resolve($request),
        ]);
    }

    public function exportReport(Request $request, RequestReportExportService $exporter)
    {
        $filters = $this->reportFilters($request);
        return $exporter->download($this->reportQuery($filters)->orderBy('requested_at')->get(), $filters);
    }

    public function requestAnalytics(Request $request)
    {
        $filters = $this->reportFilters($request);
        $items = $this->reportQuery($filters)->get();
        $approved = $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::APPROVED)->count();
        $rejected = $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::REJECTED)->count();

        return $this->success([
            'total' => $approved + $rejected,
            'approved' => $approved,
            'rejected' => $rejected,
            'series' => [
                ['label' => 'Aprobadas', 'value' => $approved, 'color' => '#10B981'],
                ['label' => 'Rechazadas', 'value' => $rejected, 'color' => '#EF4444'],
            ],
        ]);
    }

    private function reportFilters(Request $request): array
    {
        return $request->validate([
            'from' => ['nullable', 'date'],
            'to' => ['nullable', 'date', 'after_or_equal:from'],
            'worker_id' => ['nullable', 'integer', 'exists:workers,id'],
            'area_id' => ['nullable', 'integer', 'exists:areas,id'],
            'category_id' => ['nullable', 'integer', 'exists:request_categories,id'],
            'status' => ['nullable', 'in:PENDIENTE,APROBADA,RECHAZADA,CANCELADA'],
        ]);
    }

    private function reportQuery(array $filters)
    {
        return LaborRequest::with(['category', 'worker.user', 'worker.area', 'worker.position'])
            ->when($filters['worker_id'] ?? null, fn ($q, $id) => $q->where('worker_id', $id))
            ->when($filters['area_id'] ?? null, fn ($q, $id) => $q->whereHas('worker', fn ($worker) => $worker->where('area_id', $id)))
            ->when($filters['category_id'] ?? null, fn ($q, $id) => $q->where('category_id', $id))
            ->when($filters['status'] ?? null, fn ($q, $status) => $q->where('status', $status))
            ->when($filters['from'] ?? null, fn ($q, $from) => $q->whereDate('end_date', '>=', $from))
            ->when($filters['to'] ?? null, fn ($q, $to) => $q->whereDate('start_date', '<=', $to));
    }

    private function reportSummary($items): array
    {
        return [
            'total' => $items->count(),
            'pending' => $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::PENDING)->count(),
            'approved' => $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::APPROVED)->count(),
            'rejected' => $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::REJECTED)->count(),
            'cancelled' => $items->filter(fn (LaborRequest $item) => $item->status === RequestStatus::CANCELLED)->count(),
        ];
    }
}
