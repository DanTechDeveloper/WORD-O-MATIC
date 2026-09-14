<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>404 — Word-O-Matic</title>
    <link href="https://fonts.bunny.net/css?family=lexend:900|plus-jakarta-sans:500,700,900&display=swap" rel="stylesheet" />
    <style>
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#0c0c1f;color:#e2e0fc;min-height:100vh;display:flex;flex-direction:column}
        a:focus-visible{outline:2px solid #ff3bc0;outline-offset:2px}
        @media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
    </style>
</head>
<body>
    {{-- ponytail: single 404 with role branch — kid gets big arcade, teacher gets dense workbench. Both share one Lime GO TO DASHBOARD. --}}
    @php
        // ponytail: auth() can be null in error views before session middleware finishes — fallback to request()->user()
        $user = auth()->user() ?? (function_exists('request') ? request()->user() : null);
        $role = $user?->role;
        $isStudent = $role === 'student';
        $home = $isStudent ? '/student/dashboard' : ($role === 'teacher' ? '/teacher/dashboard' : '/');
        $label = $role ? 'GO TO DASHBOARD' : 'Go to login';
    @endphp

    @if($isStudent)
        <main style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:24px;text-align:center">
            <h1 style="font-family:'Lexend',sans-serif;font-weight:900;font-style:italic;font-size:clamp(3rem,14vw,9rem);letter-spacing:-0.04em;line-height:0.9;color:#d1bcff">404</h1>
            <p style="margin-top:8px;font-size:1.25rem;font-weight:700;color:#ccc3da">Oops, we lost that level.</p>
            <p style="margin-top:4px;font-size:0.95rem;color:#958da3">Ask your teacher if you need help.</p>
            <a href="{{ $home }}" style="margin-top:28px;display:inline-flex;align-items:center;gap:8px;background:#a3e635;color:#0c0c1f;font-weight:900;text-transform:uppercase;font-style:italic;letter-spacing:-0.02em;padding:16px 32px;border-radius:0.75rem;border-bottom:6px solid #3f6212;text-decoration:none">{{ $label }}</a>
            <img src="{{ asset('images/avatars/ana/head.png') }}" alt="Friendly Word-O-Matic character waving" style="margin-top:24px;width:96px;height:96px;object-fit:cover;border-radius:1rem;border:2px solid #7000ff;background:#1e1e32">
        </main>
    @else
        <main style="flex:1;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:32px;text-align:center;max-width:560px;margin:0 auto">
            <p style="font-size:0.75rem;font-weight:900;letter-spacing:0.12em;text-transform:uppercase;color:#958da3">Error 404</p>
            <h1 style="margin-top:8px;font-family:'Lexend',sans-serif;font-weight:900;font-size:1.75rem;color:#e2e0fc">Page not found</h1>
            <p style="margin-top:8px;font-size:0.9rem;color:#ccc3da;line-height:1.6">The page you requested does not exist. Check the address or return to your dashboard.</p>
            <a href="{{ $home }}" style="margin-top:20px;display:inline-flex;align-items:center;gap:8px;background:#a3e635;color:#0c0c1f;font-weight:900;text-transform:uppercase;letter-spacing:0.04em;font-size:0.8rem;padding:12px 24px;border-radius:0.5rem;border-bottom:4px solid #3f6212;text-decoration:none">{{ $label }}</a>
        </main>
    @endif
    @if(!$isStudent)
    <footer style="border-top:2px solid rgba(149,141,163,0.2);padding:12px 16px;display:flex;justify-content:space-between;align-items:center;font-size:0.75rem;color:#958da3">
        <span style="font-weight:900;letter-spacing:-0.02em;font-style:italic">WORD-O-MATIC</span>
        <span><a href="/privacy" style="color:#d1bcff;text-decoration:none">Privacy</a> · <a href="/terms" style="color:#d1bcff;text-decoration:none">Terms</a></span>
    </footer>
    @else
    <footer style="border-top:2px solid rgba(149,141,163,0.2);padding:12px 16px;display:flex;justify-content:center;align-items:center;font-size:0.75rem;color:#958da3">
        <span style="font-weight:900;letter-spacing:-0.02em;font-style:italic">WORD-O-MATIC</span>
    </footer>
    @endif
    <script>
    // ponytail: client fallback — if server rendered Go to login but session exists (exception before StartSession), fix to GO TO DASHBOARD
    (function(){
        var a=document.querySelector('a[href="/"]');
        if(!a||a.textContent.trim()!=='Go to login') return;
        fetch('/auth/check',{credentials:'same-origin',headers:{'Accept':'application/json'}})
            .then(function(r){return r.ok?r.json():Promise.reject();})
            .then(function(j){
                var s=j.role==='student';
                a.href=s?'/student/dashboard':'/teacher/dashboard';
                a.textContent='GO TO DASHBOARD';
            }).catch(function(){});
    })();
    </script>
</body>
</html>
