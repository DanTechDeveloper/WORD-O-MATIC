import '@fontsource-variable/lexend/wght.css';
import '@fontsource-variable/plus-jakarta-sans/wght.css';
import '@fontsource-variable/material-symbols-outlined/full.css';
import '../css/app.css';
// import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot } from 'react-dom/client';
import { initStudentAudio } from '@/utils/sounds';
import { initConnection } from '@/utils/connection';
import OfflineGuard from '@/Components/Shared/OfflineGuard';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.jsx`,
            import.meta.glob('./Pages/**/*.jsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);

        initStudentAudio();
        // ponytail: before the first render, so the connectivity listeners are
        // registered ahead of every page's own `online` handler — a late
        // registration would let the ASR hook's reconnect run against a stale
        // "unreachable" and kill the live round (see utils/connection.js).
        initConnection();

        root.render(
            <>
                <App {...props} />
                <OfflineGuard />
            </>,
        );
    },
    progress: {
        color: '#a3e635',
        showSpinner: true,
        delay: 100,
    },
});
