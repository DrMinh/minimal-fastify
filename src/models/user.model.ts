import { InferSchemaType, model, Schema } from 'mongoose';
import { UserRole } from '@src/types/index.js';
import { BaseDocument, BaseSchemaFields, BaseTimestamps } from '@src/utils/base-model.js';

export enum VerificationStatus {
    Draft = 'draft',
    Pending = 'pending',
    Verified = 'verified',
}

export enum UserScope {
    AccountManagement = 'account_management',
    Buy = 'buy',
    Sell = 'sell',
    Quote = 'quote',
}

export const UserCollectionName = 'users';

const userSchema = new Schema(
    {
        ...BaseSchemaFields,
        name: { type: String, required: true, minlength: 1 },
        password: { type: String, required: true, minlength: 10 },
        email: { type: String, required: true, unique: true },
        role: {
            type: String,
            enum: Object.values(UserRole),
            default: UserRole.User,
            required: true,
        },
        verification: {
            type: String,
            enum: Object.values(VerificationStatus),
            default: VerificationStatus.Draft,
            required: true,
        },
        scope: {
            type: [{ type: String, enum: Object.values(UserScope) }],
            default: [UserScope.Buy, UserScope.Sell, UserScope.Quote],
            required: true,
        },
    },
    {
        collection: UserCollectionName,
        ...BaseTimestamps,
    },
);

export type User = InferSchemaType<typeof userSchema> & BaseDocument;

export const UserModel = model<User>('User', userSchema);
