export interface AcademyModule {
    id: string;
    title: string;
    description: string;
    icon: string; // Lucid icon name
    difficulty: "CADET" | "OFFICER" | "COMMAND";
    durationMinutes: number;
    lessons: AcademyLesson[];
}

export interface AcademyLesson {
    id: string;
    title: string;
    content: string[]; // Paragaphs
    quiz?: {
        question: string;
        options: string[];
        correctIndex: number;
    };
}

export interface PilotProgress {
    completedModuleIds: string[];
    completedLessonIds: string[];
    rank: "CADET" | "OFFICER" | "COMMANDER";
    xp: number;
}

// Simple Storage Wrapper
const STORAGE_KEY = "proveniq_flight_school_v1";

export const ACADEMY_ENGINE = {
    getProgress: (): PilotProgress => {
        if (typeof window === 'undefined') return { completedModuleIds: [], completedLessonIds: [], rank: "CADET", xp: 0 };
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
        return { completedModuleIds: [], completedLessonIds: [], rank: "CADET", xp: 0 };
    },

    completeLesson: (moduleId: string, lessonId: string) => {
        const progress = ACADEMY_ENGINE.getProgress();
        if (!progress.completedLessonIds.includes(lessonId)) {
            progress.completedLessonIds.push(lessonId);
            progress.xp += 100;
            ACADEMY_ENGINE.saveProgress(progress);
        }
        return progress;
    },

    completeModule: (moduleId: string) => {
        const progress = ACADEMY_ENGINE.getProgress();
        if (!progress.completedModuleIds.includes(moduleId)) {
            progress.completedModuleIds.push(moduleId);
            progress.xp += 500;

            // Rank Up Logic
            if (progress.completedModuleIds.length >= 2) progress.rank = "OFFICER";
            if (progress.completedModuleIds.length >= 5) progress.rank = "COMMANDER";

            ACADEMY_ENGINE.saveProgress(progress);
        }
        return progress;
    },

    saveProgress: (progress: PilotProgress) => {
        if (typeof window !== 'undefined') {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
            // Trigger event for UI updates if needed
            window.dispatchEvent(new Event('academy-update'));
        }
    }
};
