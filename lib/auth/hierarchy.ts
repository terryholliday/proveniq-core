export enum ClearanceLevel {
    ANALYST = 1, // Sees only their own data
    HANDLER = 2, // Sees their team
    ARCHITECT = 3, // Sees everything
    SOVEREIGN = 4 // Can break rules
}

export const checkClearance = (userLevel: ClearanceLevel, required: ClearanceLevel) => {
    if (userLevel < required) throw new Error('ACCESS_DENIED: EYES_ONLY_VIOLATION');
    return true;
};
