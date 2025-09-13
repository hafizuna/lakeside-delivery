"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Ensure environment variables are loaded
dotenv_1.default.config({ path: path_1.default.join(__dirname, '../../.env') });
// Singleton pattern for Prisma client
const prisma = globalThis.__prisma || new client_1.PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL || "mysql://root:@localhost:3306/lakeside_delivery"
        }
    },
    log: ['query', 'error', 'warn'],
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.__prisma = prisma;
}
// Graceful shutdown
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
exports.default = prisma;
//# sourceMappingURL=database.js.map