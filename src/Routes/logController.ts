import { Request, Response, Router } from 'express'
import { LogModel } from '../Models/logSchema';
import { faker } from '@faker-js/faker';
const log = Router();

interface LogData {
    level: string;
    message: string;
    resourceId: string;
    timestamp: string;
    traceId: string;
    spanId: string;
    commit: string;
    metadata: {
        parentResourceId: string;
    };
}

function generateRandomLogs(count: number): LogData[] {
    const logs: LogData[] = [];

    for (let i = 0; i < count; i++) {
        const log: LogData = {
            level: faker.helpers.arrayElement(['error', 'info', 'warning']),
            message: faker.lorem.sentence(),
            resourceId: `server-${faker.string.numeric({ length: 6 })}`,
            timestamp: faker.date.past().toISOString(),
            traceId: faker.string.alphanumeric({ length: 10 }),
            spanId: `span-${faker.string.alphanumeric({ length: 6 })}`,
            commit: faker.string.alphanumeric({ length: 6 }),
            metadata: {
                parentResourceId: `server-${faker.string.numeric({ length: 6 })}`,
            },
        };
        logs.push(log);
    }
    return logs;
}

log.post("/", async (req: Request, res: Response) => {
    try {
        const logsData: LogData[] = req.body;
        const batchSize = 1000;
        const totalLogs = logsData.length;
        const totalBatches = Math.ceil(totalLogs / batchSize);

        for (let i = 0; i < totalBatches; i++) {
            const startIndex = i * batchSize;
            const endIndex = Math.min(startIndex + batchSize, totalLogs);
            const logs = logsData.slice(startIndex, endIndex);
            const logInstances = logs.map((log: LogData) => new LogModel(log));
            await LogModel.insertMany(logInstances);
        }
        res.status(201).send('Logs received and stored successfully');
    } catch (err) {
        console.error('Error storing log:', err);
        res.status(500).send('Error storing log data');
    }
})

log.get("/", async (req: Request, res: Response) => {
    try {
        const {
            level,
            message,
            startDate,
            endDate,
            resourceId,
            parentId,
            traceId,
            spanId,
            commit,
            page,
            limit
        } = req.query;

        const filter: any = {};
        if (level && ["error", "info", "warning"].includes(level as string)) {
            filter.level = level as string;
        }
        if (startDate && endDate) {
            filter.timestamp = {
                $gte: new Date(startDate as string),
                $lte: new Date(endDate as string)
            };
        }
        if (message) {
            const inputPhrase = message as string;
            const escapedPhrase = inputPhrase.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
            const regexPattern = `\\b${escapedPhrase}\\b`;
            filter.message = { $regex: new RegExp(regexPattern, 'i') };
        }
        if (resourceId) filter.resourceId = { $eq: resourceId as string };
        if (parentId) filter['metadata.parentResourceId'] = { $eq: parentId as string };
        if (traceId) filter.traceId = { $eq: traceId as string };
        if (spanId) filter.spanId = { $eq: spanId as string };
        if (commit) filter.commit = { $eq: commit as string };

        const pageNumber = parseInt(page as string) || 1;
        const pageSize = parseInt(limit as string) || 10;

        const query = LogModel.find(filter)
            .sort({ level: 1, timestamp: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize);

        const [logs, count] = await Promise.all([
            query.exec(),
            LogModel.countDocuments(filter)
        ]);

        res.status(200).json({ count, logs });
    } catch (error) {
        console.error('Error fetching logs:', error);
        res.status(500).send('Error fetching logs');
    }
});

log.post("/client/:count", async (req: Request, res: Response) => {
    try {
        const batchSize = 20000;
        const totalLogsToGenerate = parseInt(req.params.count);
        let logsInserted = 0;

        while (logsInserted < totalLogsToGenerate) {
            const logsRemaining = totalLogsToGenerate - logsInserted;
            const logsToGenerate = Math.min(batchSize, logsRemaining);

            const logsData: LogData[] = generateRandomLogs(logsToGenerate);
            const logInstances = logsData.map((log: LogData) => new LogModel(log));
            await LogModel.insertMany(logInstances);

            logsInserted += logsToGenerate;
        }

        res.status(201).send('Logs generated and stored successfully');
    } catch (err) {
        console.error('Error storing log:', err);
        res.status(500).send('Error storing log data');
    }
})

export default log;