import { AssetInputs } from "./types";

const MAX_ASSET_ID_LENGTH = 128;

const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === "object" && value !== null && !Array.isArray(value);

const isFiniteNumber = (value: unknown): value is number =>
    typeof value === "number" && Number.isFinite(value);

type ParseResult<T> =
    | { ok: true; data: T }
    | { ok: false; error: string; details?: string[] };

export const parseAssetId = (value: unknown): ParseResult<string> => {
    if (typeof value !== "string") {
        return { ok: false, error: "assetId must be a string" };
    }

    const assetId = value.trim();
    if (!assetId) {
        return { ok: false, error: "assetId cannot be empty" };
    }

    if (assetId.length > MAX_ASSET_ID_LENGTH) {
        return { ok: false, error: `assetId exceeds ${MAX_ASSET_ID_LENGTH} characters` };
    }

    return { ok: true, data: assetId };
};

export const parseAssetInputs = (value: unknown): ParseResult<AssetInputs> => {
    if (!isRecord(value)) {
        return { ok: false, error: "inputs must be an object" };
    }

    const errors: string[] = [];
    const inputs: AssetInputs = {};

    const parseOptionalNumber = (
        field: keyof AssetInputs,
        options: { min?: number; max?: number } = {}
    ) => {
        const rawValue = value[field as string];
        if (rawValue === undefined || rawValue === null) {
            return;
        }

        if (!isFiniteNumber(rawValue)) {
            errors.push(`${String(field)} must be a finite number`);
            return;
        }

        if (options.min !== undefined && rawValue < options.min) {
            errors.push(`${String(field)} must be >= ${options.min}`);
        }

        if (options.max !== undefined && rawValue > options.max) {
            errors.push(`${String(field)} must be <= ${options.max}`);
        }

        inputs[field] = rawValue;
    };

    const parseOptionalBoolean = (field: keyof AssetInputs) => {
        const rawValue = value[field as string];
        if (rawValue === undefined || rawValue === null) {
            return;
        }

        if (typeof rawValue !== "boolean") {
            errors.push(`${String(field)} must be a boolean`);
            return;
        }

        inputs[field] = rawValue;
    };

    parseOptionalNumber("opticalMatch", { min: 0, max: 1 });
    parseOptionalBoolean("serialMatch");
    parseOptionalNumber("custodyEvents", { min: 0 });
    parseOptionalBoolean("custodyGaps");
    parseOptionalNumber("marketVolume", { min: 0 });
    parseOptionalNumber("tamperEvents", { min: 0 });
    parseOptionalBoolean("geoMismatch");

    const rawConditionRating = value.conditionRating;
    if (rawConditionRating !== undefined && rawConditionRating !== null) {
        if (
            rawConditionRating !== "A" &&
            rawConditionRating !== "B" &&
            rawConditionRating !== "C" &&
            rawConditionRating !== "D" &&
            rawConditionRating !== "F"
        ) {
            errors.push("conditionRating must be one of A, B, C, D, F");
        } else {
            inputs.conditionRating = rawConditionRating;
        }
    }

    const rawConditionReportDate = value.conditionReportDate;
    if (rawConditionReportDate !== undefined) {
        if (rawConditionReportDate === null) {
            inputs.conditionReportDate = null;
        } else if (
            typeof rawConditionReportDate === "string" ||
            typeof rawConditionReportDate === "number" ||
            rawConditionReportDate instanceof Date
        ) {
            const date = new Date(rawConditionReportDate);
            if (Number.isNaN(date.getTime())) {
                errors.push("conditionReportDate must be a valid date");
            } else {
                inputs.conditionReportDate = date;
            }
        } else {
            errors.push("conditionReportDate must be a date string, timestamp, or null");
        }
    }

    if (errors.length > 0) {
        return { ok: false, error: "Invalid inputs", details: errors };
    }

    return { ok: true, data: inputs };
};
