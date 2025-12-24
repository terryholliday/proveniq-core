export const Haptics = {
    soft: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(10); },
    medium: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(40); },
    success: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 30, 50]); },
    error: () => { if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([50, 100, 50, 100]); }
};
