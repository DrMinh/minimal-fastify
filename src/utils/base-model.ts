import { SchemaDefinitionProperty } from 'mongoose';
import { CollectionStatus } from '../types/common.js';

export interface BaseDocument {
    status: CollectionStatus;
    createdDate: Date;
    updatedDate: Date;
}

/**
 * Schema fields shared by every collection.
 * Spread into a Mongoose schema definition: `new Schema({ ...BaseSchemaFields, ...customFields })`.
 *
 * `createdDate` / `updatedDate` are wired to Mongoose's `timestamps` option in the model so
 * they update automatically on save.
 */
export const BaseSchemaFields = {
    status: {
        type: String,
        enum: Object.values(CollectionStatus),
        default: CollectionStatus.Active,
        required: true,
    } as SchemaDefinitionProperty<CollectionStatus>,
} as const;

export const BaseTimestamps = {
    timestamps: { createdAt: 'createdDate', updatedAt: 'updatedDate' },
} as const;
