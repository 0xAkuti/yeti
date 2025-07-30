import Database from 'better-sqlite3';
import { dirname } from 'path';
import { existsSync, mkdirSync } from 'fs';
import dotenv from 'dotenv';

dotenv.config();

class DatabaseConnection {
    private static instance: Database.Database | null = null;
    private static dbPath: string;

    static getConnection(): Database.Database {
        if (!this.instance) {
            this.dbPath = process.env.DATABASE_PATH || './data/orderbook.db';
            
            // Ensure directory exists
            const dbDir = dirname(this.dbPath);
            if (!existsSync(dbDir)) {
                mkdirSync(dbDir, { recursive: true });
            }

            this.instance = new Database(this.dbPath);
            
            // Enable WAL mode for better concurrency
            this.instance.pragma('journal_mode = WAL');
            
            // Enable foreign keys
            this.instance.pragma('foreign_keys = ON');
            
            console.log(`📁 Database connected: ${this.dbPath}`);
        }
        
        return this.instance;
    }

    static closeConnection(): void {
        if (this.instance) {
            this.instance.close();
            this.instance = null;
            console.log('📁 Database connection closed');
        }
    }

    static getDatabasePath(): string {
        return this.dbPath || process.env.DATABASE_PATH || './data/orderbook.db';
    }
}

export default DatabaseConnection;