<?php

namespace App\Utils;

class ResponseTransformer
{
    /**
     * Convert snake_case array keys to camelCase recursively
     */
    public static function toCamelCase($data)
    {
        if (is_array($data)) {
            $result = [];
            foreach ($data as $key => $value) {
                $camelKey = self::snakeToCamel($key);
                $result[$camelKey] = self::toCamelCase($value);
            }
            return $result;
        } elseif (is_object($data)) {
            $result = new \stdClass();
            foreach (get_object_vars($data) as $key => $value) {
                $camelKey = self::snakeToCamel($key);
                $result->$camelKey = self::toCamelCase($value);
            }
            return $result;
        }

        return $data;
    }

    /**
     * Convert snake_case string to camelCase
     */
    private static function snakeToCamel($string)
    {
        return lcfirst(str_replace('_', '', ucwords($string, '_')));
    }

    /**
     * Transform API response data to camelCase
     */
    public static function transformResponse($data)
    {
        if (is_array($data) && isset($data['data'])) {
            // Handle standard API response format
            $data['data'] = self::toCamelCase($data['data']);
        } else {
            // Handle direct data transformation
            $data = self::toCamelCase($data);
        }

        return $data;
    }

    /**
     * Transform collection of models to camelCase
     */
    public static function transformCollection($collection)
    {
        if ($collection instanceof \Illuminate\Database\Eloquent\Collection) {
            return $collection->map(function ($item) {
                return self::toCamelCase($item->toArray());
            });
        }

        return self::toCamelCase($collection);
    }

    /**
     * Transform single model to camelCase
     */
    public static function transformModel($model)
    {
        if ($model instanceof \Illuminate\Database\Eloquent\Model) {
            return self::toCamelCase($model->toArray());
        }

        return self::toCamelCase($model);
    }
}
