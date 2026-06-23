import { UserModel } from '@src/models/user.model.js';
import { Mongoose } from 'mongoose';

export async function init_db(mongoose: Mongoose) {
    console.log('run migrate');

    // Sync indexes declared on each model with the database
    // (drops orphan indexes and creates any new ones).
    await UserModel.syncIndexes();
}
