<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Setting extends Model
{
    protected $fillable = ['key', 'value'];

    public static function getValue($key, $default = null)
    {
        // ponytail: request-scoped memo (request attributes, NOT a static prop —
        // statics survive across requests in FrankenPHP workers and would go stale).
        // Kills the duplicate Setting query on teacher Inertia responses
        // (auth.deadline + teacher.has_deadline read the same key).
        $memoKey = "setting.{$key}";
        $request = request();
        if ($request->attributes->has($memoKey)) {
            return $request->attributes->get($memoKey);
        }

        $setting = static::where('key', $key)->first();
        $value = $setting ? $setting->value : $default;
        $request->attributes->set($memoKey, $value);

        return $value;
    }

    public static function setValue($key, $value)
    {
        $result = static::updateOrCreate(
            ['key' => $key],
            ['value' => $value]
        );
        request()->attributes->set("setting.{$key}", $value);

        return $result;
    }
}
