type CacheValue<T = any> = {
    value: T;
    tags: string[];
};

export class TagStorage<T = any> {
    private data: Map<string, CacheValue<T>> = new Map();
    private tagMap: Map<string, Set<string>> = new Map();

    /**
     * Store or update a cache entry
     * @param uniqueId Unique identifier for the cache entry
     * @param value Any data to cache
     * @param tags List of tags for quick group invalidation
     */
    set(uniqueId: string, value: T, tags: string[] = []): void {
        // Remove old tags if updating existing entry
        if (this.data.has(uniqueId)) {
            const oldTags = this.data.get(uniqueId)!.tags;
            for (const tag of oldTags) {
                const ids = this.tagMap.get(tag);
                ids?.delete(uniqueId);
            }
        }

        // Store new entry
        this.data.set(uniqueId, { value, tags });

        // Map tags → uniqueId
        for (const tag of tags) {
            if (!this.tagMap.has(tag)) {
                this.tagMap.set(tag, new Set());
            }
            this.tagMap.get(tag)!.add(uniqueId);
        }
    }

    /**
     * Retrieve cached value by uniqueId
     */
    get(uniqueId: string): T | undefined {
        return this.data.get(uniqueId)?.value;
    }

    /**
     * Remove all entries that contain ANY of the given tags
     * Example: clearAll({ isViewed: 1, status: 1 })
     */
    clearAll(tagFilter: Record<string, any>): void {
        const tagsToClear = Object.keys(tagFilter);
        const idsToRemove = new Set<string>();

        // Collect IDs from all matching tags
        for (const tag of tagsToClear) {
            const ids = this.tagMap.get(tag);
            if (ids) {
                for (const id of ids) idsToRemove.add(id);
            }
        }

        // Delete all matching entries
        for (const id of idsToRemove) {
            const entry = this.data.get(id);
            if (!entry) continue;

            // Remove from reverse index
            for (const tag of entry.tags) {
                this.tagMap.get(tag)?.delete(id);
            }

            this.data.delete(id);
        }
    }

    /**
     * Completely clear all cache and tag mappings
     */
    clear(): void {
        this.data.clear();
        this.tagMap.clear();
    }

    /**
     * Return stats for debugging
     */
    stats(): { count: number; tags: number } {
        return {
            count: this.data.size,
            tags: this.tagMap.size,
        };
    }
}
