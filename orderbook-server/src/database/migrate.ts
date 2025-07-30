import { readFileSync, readdirSync } from 'fs';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import DatabaseConnection from './connection.js';
import type { Migration } from './types.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

class MigrationManager {
    private db: any;
    private migrationsPath: string;

    constructor() {
        this.db = DatabaseConnection.getConnection();
        this.migrationsPath = join(__dirname, 'migrations');
    }

    async runMigrations(reset: boolean = false): Promise<void> {
        console.log('🔄 Starting database migrations...');

        if (reset) {
            await this.resetDatabase();
        }

        // Ensure migrations table exists
        this.ensureMigrationsTable();

        // Get applied migrations
        const appliedMigrations = this.getAppliedMigrations();
        const appliedVersions = new Set(appliedMigrations.map(m => m.version));

        // Get available migration files
        const migrationFiles = this.getMigrationFiles();

        if (migrationFiles.length === 0) {
            console.log('📝 No migration files found');
            return;
        }

        // Apply pending migrations
        let appliedCount = 0;
        for (const file of migrationFiles) {
            const version = this.extractVersionFromFilename(file);
            
            if (!appliedVersions.has(version)) {
                await this.applyMigration(file, version);
                appliedCount++;
            }
        }

        if (appliedCount === 0) {
            console.log('✅ Database is up to date');
        } else {
            console.log(`✅ Applied ${appliedCount} migration(s)`);
        }
    }

    private ensureMigrationsTable(): void {
        // This will be created by the first migration, but we need it to track migrations
        const createMigrationsTable = `
            CREATE TABLE IF NOT EXISTS migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT UNIQUE NOT NULL,
                description TEXT NOT NULL,
                applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        `;
        this.db.exec(createMigrationsTable);
    }

    private getAppliedMigrations(): Migration[] {
        try {
            const stmt = this.db.prepare('SELECT version, description, applied_at FROM migrations ORDER BY version');
            return stmt.all();
        } catch (error) {
            // Table doesn't exist yet
            return [];
        }
    }

    private getMigrationFiles(): string[] {
        try {
            return readdirSync(this.migrationsPath)
                .filter(file => file.endsWith('.sql'))
                .sort();
        } catch (error) {
            console.error('❌ Failed to read migrations directory:', error);
            return [];
        }
    }

    private extractVersionFromFilename(filename: string): string {
        // Extract version from filename like "001_initial_schema.sql"
        const match = filename.match(/^(\d+)_/);
        return match ? match[1] : filename;
    }

    private async applyMigration(filename: string, version: string): Promise<void> {
        const filePath = join(this.migrationsPath, filename);
        
        try {
            console.log(`📝 Applying migration: ${filename}`);
            
            const sql = readFileSync(filePath, 'utf8');
            
            // Extract description from SQL comments
            const descriptionMatch = sql.match(/-- Description: (.+)/);
            const description = descriptionMatch ? descriptionMatch[1] : filename;

            // Begin transaction
            const transaction = this.db.transaction(() => {
                // Execute migration SQL
                this.db.exec(sql);
                
                // Record migration as applied
                const stmt = this.db.prepare(`
                    INSERT INTO migrations (version, description) 
                    VALUES (?, ?)
                `);
                stmt.run(version, description);
            });

            transaction();
            
            console.log(`✅ Migration ${filename} applied successfully`);
            
        } catch (error) {
            console.error(`❌ Failed to apply migration ${filename}:`, error);
            throw error;
        }
    }

    private async resetDatabase(): Promise<void> {
        console.log('🗑️  Resetting database...');
        
        try {
            // Get all table names
            const tables = this.db.prepare(`
                SELECT name FROM sqlite_master 
                WHERE type='table' AND name NOT LIKE 'sqlite_%'
            `).all();

            // Drop all tables
            for (const table of tables) {
                this.db.exec(`DROP TABLE IF EXISTS ${table.name}`);
            }

            console.log('✅ Database reset complete');
        } catch (error) {
            console.error('❌ Failed to reset database:', error);
            throw error;
        }
    }

    getStatus(): { applied: Migration[], pending: string[] } {
        const appliedMigrations = this.getAppliedMigrations();
        const appliedVersions = new Set(appliedMigrations.map(m => m.version));
        
        const migrationFiles = this.getMigrationFiles();
        const pendingMigrations = migrationFiles.filter(file => {
            const version = this.extractVersionFromFilename(file);
            return !appliedVersions.has(version);
        });

        return {
            applied: appliedMigrations,
            pending: pendingMigrations
        };
    }
}

// CLI interface
if (import.meta.url === `file://${process.argv[1]}`) {
    const reset = process.argv.includes('--reset');
    const status = process.argv.includes('--status');
    
    const migrationManager = new MigrationManager();
    
    try {
        if (status) {
            const { applied, pending } = migrationManager.getStatus();
            console.log('\n📊 Migration Status:');
            console.log('==================');
            console.log(`Applied: ${applied.length}`);
            console.log(`Pending: ${pending.length}`);
            
            if (applied.length > 0) {
                console.log('\n✅ Applied Migrations:');
                applied.forEach(m => console.log(`  ${m.version}: ${m.description} (${m.applied_at})`));
            }
            
            if (pending.length > 0) {
                console.log('\n⏳ Pending Migrations:');
                pending.forEach(f => console.log(`  ${f}`));
            }
        } else {
            await migrationManager.runMigrations(reset);
        }
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        DatabaseConnection.closeConnection();
    }
}

export default MigrationManager;