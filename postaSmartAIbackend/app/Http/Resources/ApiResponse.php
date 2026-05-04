<?php

namespace App\Http\Resources;

use Illuminate\Http\JsonResponse;

class ApiResponse
{
    /**
     * Return a successful response
     */
    public static function success($data = null, string $message = 'Success', int $statusCode = 200): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'errors' => null,
        ], $statusCode);
    }

    /**
     * Return an error response
     */
    public static function error($errors = null, string $message = 'Error', int $statusCode = 400): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], $statusCode);
    }

    /**
     * Return a validation error response
     */
    public static function validationError(array $errors, string $message = 'Validation Error'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => $errors,
        ], 422);
    }

    /**
     * Return a not found response
     */
    public static function notFound(string $message = 'Not Found'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], 404);
    }

    /**
     * Return an unauthorized response
     */
    public static function unauthorized(string $message = 'Unauthorized'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], 401);
    }

    /**
     * Return a forbidden response
     */
    public static function forbidden(string $message = 'Forbidden'): JsonResponse
    {
        return response()->json([
            'success' => false,
            'message' => $message,
            'data' => null,
            'errors' => null,
        ], 403);
    }
}
