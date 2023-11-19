import { Schema, model, Model, Document } from 'mongoose';

export interface Log extends Document {
    level: string;
    message: string;
    resourceId: string;
    timestamp: Date;
    traceId: string;
    spanId: string;
    commit: string;
    metadata: {
        parentResourceId: string;
    };
}

const logSchema: Schema = new Schema({
    level: String,
    message: String,
    resourceId: String,
    timestamp: Date,
    traceId: String,
    spanId: String,
    commit: String,
    metadata: {
        parentResourceId: String
    }
});

logSchema.index({
    'level': 1,
    'timestamp': -1
});

logSchema.index({
    'resourceId': 1,
    'traceId': 1,
    'spanId': 1,
    'commit': 1,
    'metadata.parentResourceId': 1,
});

logSchema.index({
    'message': "text"
})


const LogModel: Model<Log> = model<Log>('Log', logSchema);

export { LogModel }