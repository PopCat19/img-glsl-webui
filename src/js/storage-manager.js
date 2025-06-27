// ==================== STORAGE MANAGER ====================

/**
 * Storage manager for save slots and application state
 */

class StorageManager {
    constructor(logger) {
        this.log = logger || console.log;
        this.storagePrefix = 'glsl-webui-';
        this.maxSlots = 5;
        this.maxHistory = 50;
        this.activeSlot = null;
        this.slotCallbacks = [];
    }

    /**
     * Initialize storage manager and set up save slots
     */
    init() {
        this.setupSaveSlots();
        this.loadAppState();
    }

    /**
     * Setup save slot functionality
     */
    setupSaveSlots() {
        const slots = document.querySelectorAll('.save-slot');
        const unloadSlotBtn = document.getElementById('unloadSlot');

        slots.forEach(slot => {
            // Left-click handler - save/load
            slot.addEventListener('click', (e) => {
                e.preventDefault();
                this.handleSlotClick(slot);
            });

            // Right-click handler - clear slot
            slot.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                this.handleSlotRightClick(slot);
            });

            // Touch hold handler for mobile
            this.setupTouchHold(slot);
        });

        // Unload slot button
        if (unloadSlotBtn) {
            unloadSlotBtn.addEventListener('click', () => {
                if (this.activeSlot) {
                    this.unloadSlot();
                }
            });
        }

        // Load existing slots
        this.refreshSlotDisplay();
    }

    /**
     * Setup touch hold functionality for mobile
     */
    setupTouchHold(slot) {
        let touchTimer = null;
        let touchStarted = false;

        slot.addEventListener('touchstart', (e) => {
            touchStarted = true;
            touchTimer = setTimeout(() => {
                if (touchStarted) {
                    this.handleSlotRightClick(slot);
                    e.preventDefault();
                }
            }, 800); // 800ms hold
        });

        slot.addEventListener('touchend', (e) => {
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
            if (touchStarted) {
                touchStarted = false;
                // Regular tap behavior
                setTimeout(() => {
                    if (!touchStarted) {
                        this.handleSlotClick(slot);
                    }
                }, 50);
            }
        });

        slot.addEventListener('touchmove', () => {
            touchStarted = false;
            if (touchTimer) {
                clearTimeout(touchTimer);
            }
        });
    }

    /**
     * Handle save slot click (save/load)
     */
    handleSlotClick(slot) {
        const slotNumber = parseInt(slot.dataset.slot);
        const slotData = this.getSlot(slotNumber);

        if (slotData) {
            // Load existing slot
            this.loadSlot(slotNumber);
            this.log(`Loaded shader from slot ${slotNumber}`);
        } else {
            // Save to empty slot
            this.saveToSlot(slotNumber);
            this.log(`Saved shader to slot ${slotNumber}`);
        }
    }

    /**
     * Handle save slot right-click (clear)
     */
    handleSlotRightClick(slot) {
        const slotNumber = parseInt(slot.dataset.slot);
        const slotData = this.getSlot(slotNumber);

        if (slotData) {
            if (confirm(`Clear slot ${slotNumber}?`)) {
                this.clearSlot(slotNumber);
                this.log(`Cleared slot ${slotNumber}`);
            }
        }
    }

    /**
     * Save current state to a slot
     */
    saveToSlot(slotNumber) {
        const shaderCode = document.getElementById('shaderCode')?.value || '';

        if (!shaderCode.trim()) {
            this.log('No shader code to save', 'error');
            return false;
        }

        const slotData = {
            shaderCode: shaderCode,
            timestamp: Date.now(),
            name: this.generateSlotName(slotNumber)
        };

        this.setSlot(slotNumber, slotData);
        this.setActiveSlot(slotNumber);
        this.refreshSlotDisplay();
        this.notifySlotChange('save', slotNumber, slotData);

        return true;
    }

    /**
     * Load state from a slot
     */
    loadSlot(slotNumber) {
        const slotData = this.getSlot(slotNumber);

        if (!slotData) {
            this.log(`Slot ${slotNumber} is empty`, 'error');
            return false;
        }

        // Load shader code
        const shaderCodeEl = document.getElementById('shaderCode');
        if (shaderCodeEl) {
            shaderCodeEl.value = slotData.shaderCode;
        }

        this.setActiveSlot(slotNumber);
        this.refreshSlotDisplay();
        this.notifySlotChange('load', slotNumber, slotData);

        return true;
    }

    /**
     * Clear a slot
     */
    clearSlot(slotNumber) {
        localStorage.removeItem(`${this.storagePrefix}slot-${slotNumber}`);

        if (this.activeSlot === slotNumber) {
            this.activeSlot = null;
        }

        this.refreshSlotDisplay();
        this.notifySlotChange('clear', slotNumber, null);
    }

    /**
     * Unload the currently active slot
     */
    unloadSlot() {
        if (this.activeSlot) {
            const prevSlot = this.activeSlot;
            this.activeSlot = null;
            this.refreshSlotDisplay();
            this.notifySlotChange('unload', prevSlot, null);
            this.log(`Unloaded slot ${prevSlot}`);
        }
    }

    /**
     * Get slot data from localStorage
     */
    getSlot(slotNumber) {
        try {
            const data = localStorage.getItem(`${this.storagePrefix}slot-${slotNumber}`);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            this.log(`Error loading slot ${slotNumber}: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Set slot data in localStorage
     */
    setSlot(slotNumber, data) {
        try {
            localStorage.setItem(`${this.storagePrefix}slot-${slotNumber}`, JSON.stringify(data));
            return true;
        } catch (error) {
            this.log(`Error saving slot ${slotNumber}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Set the active slot
     */
    setActiveSlot(slotNumber) {
        this.activeSlot = slotNumber;
        this.saveAppState();
    }

    /**
     * Get the active slot
     */
    getActiveSlot() {
        return this.activeSlot;
    }

    /**
     * Refresh the visual display of save slots
     */
    refreshSlotDisplay() {
        const slots = document.querySelectorAll('.save-slot');
        const unloadBtn = document.getElementById('unloadSlot');

        slots.forEach(slot => {
            const slotNumber = parseInt(slot.dataset.slot);
            const slotData = this.getSlot(slotNumber);
            const isActive = this.activeSlot === slotNumber;

            // Update slot appearance
            slot.classList.toggle('active', isActive);

            if (slotData) {
                slot.textContent = slotData.name || `Slot ${slotNumber}`;
                slot.title = `Slot ${slotNumber}\nSaved: ${this.formatTimestamp(slotData.timestamp)}\nClick to load, right-click to clear`;
            } else {
                slot.textContent = `Slot ${slotNumber}`;
                slot.title = `Slot ${slotNumber} (Empty)\nClick to save current shader`;
            }
        });

        // Update unload button visibility
        if (unloadBtn) {
            unloadBtn.style.display = this.activeSlot ? 'inline-block' : 'none';
        }
    }

    /**
     * Generate a name for a slot based on shader content
     */
    generateSlotName(slotNumber) {
        const shaderCode = document.getElementById('shaderCode')?.value || '';

        // Try to extract a meaningful name from comments
        const commentMatch = shaderCode.match(/\/\/\s*(.+)/);
        if (commentMatch) {
            return commentMatch[1].substring(0, 20);
        }

        // Look for common shader patterns
        if (shaderCode.includes('sin(') || shaderCode.includes('cos(')) {
            return 'Wave Effect';
        }
        if (shaderCode.includes('noise') || shaderCode.includes('random')) {
            return 'Noise Effect';
        }
        if (shaderCode.includes('blur')) {
            return 'Blur Effect';
        }
        if (shaderCode.includes('distort')) {
            return 'Distortion';
        }

        return `Custom ${slotNumber}`;
    }

    /**
     * Format timestamp for display
     */
    formatTimestamp(timestamp) {
        const date = new Date(timestamp);
        return date.toLocaleString();
    }

    /**
     * Save application state
     */
    saveAppState() {
        const state = {
            activeSlot: this.activeSlot,
            lastSaved: Date.now()
        };

        try {
            localStorage.setItem(`${this.storagePrefix}app-state`, JSON.stringify(state));
        } catch (error) {
            this.log(`Error saving app state: ${error.message}`, 'error');
        }
    }

    /**
     * Load application state
     */
    loadAppState() {
        try {
            const data = localStorage.getItem(`${this.storagePrefix}app-state`);
            if (data) {
                const state = JSON.parse(data);
                this.activeSlot = state.activeSlot;
            }
        } catch (error) {
            this.log(`Error loading app state: ${error.message}`, 'error');
        }
    }

    /**
     * Save to history for undo/redo functionality
     */
    saveToHistory(state) {
        const historyKey = `${this.storagePrefix}history`;

        try {
            let history = [];
            const existingHistory = localStorage.getItem(historyKey);

            if (existingHistory) {
                history = JSON.parse(existingHistory);
            }

            // Add new state
            history.push({
                ...state,
                timestamp: Date.now()
            });

            // Limit history size
            if (history.length > this.maxHistory) {
                history = history.slice(-this.maxHistory);
            }

            localStorage.setItem(historyKey, JSON.stringify(history));
            return history.length - 1; // Return index of saved state

        } catch (error) {
            this.log(`Error saving to history: ${error.message}`, 'error');
            return -1;
        }
    }

    /**
     * Get history state by index
     */
    getHistoryState(index) {
        try {
            const history = this.getHistory();
            return history[index] || null;
        } catch (error) {
            this.log(`Error getting history state: ${error.message}`, 'error');
            return null;
        }
    }

    /**
     * Get full history
     */
    getHistory() {
        try {
            const data = localStorage.getItem(`${this.storagePrefix}history`);
            return data ? JSON.parse(data) : [];
        } catch (error) {
            this.log(`Error loading history: ${error.message}`, 'error');
            return [];
        }
    }

    /**
     * Clear all history
     */
    clearHistory() {
        try {
            localStorage.removeItem(`${this.storagePrefix}history`);
            this.log('History cleared');
        } catch (error) {
            this.log(`Error clearing history: ${error.message}`, 'error');
        }
    }

    /**
     * Export all slots as JSON
     */
    exportSlots() {
        const slots = {};

        for (let i = 1; i <= this.maxSlots; i++) {
            const slotData = this.getSlot(i);
            if (slotData) {
                slots[i] = slotData;
            }
        }

        const exportData = {
            slots: slots,
            exportDate: new Date().toISOString(),
            version: '1.0'
        };

        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `glsl-webui-slots-${Date.now()}.json`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        setTimeout(() => URL.revokeObjectURL(url), 1000);

        this.log('Slots exported successfully');
    }

    /**
     * Import slots from JSON
     */
    importSlots(jsonData) {
        try {
            const data = typeof jsonData === 'string' ? JSON.parse(jsonData) : jsonData;

            if (!data.slots) {
                throw new Error('Invalid import data format');
            }

            let importCount = 0;

            Object.entries(data.slots).forEach(([slotNumber, slotData]) => {
                const slot = parseInt(slotNumber);
                if (slot >= 1 && slot <= this.maxSlots) {
                    this.setSlot(slot, slotData);
                    importCount++;
                }
            });

            this.refreshSlotDisplay();
            this.log(`Imported ${importCount} slots successfully`);

            return importCount;

        } catch (error) {
            this.log(`Error importing slots: ${error.message}`, 'error');
            return 0;
        }
    }

    /**
     * Clear all slots
     */
    clearAllSlots() {
        if (confirm('Clear all save slots? This cannot be undone.')) {
            for (let i = 1; i <= this.maxSlots; i++) {
                this.clearSlot(i);
            }
            this.activeSlot = null;
            this.refreshSlotDisplay();
            this.log('All slots cleared');
        }
    }

    /**
     * Get storage usage statistics
     */
    getStorageStats() {
        let totalSize = 0;
        let slotCount = 0;

        for (let i = 1; i <= this.maxSlots; i++) {
            const slotData = this.getSlot(i);
            if (slotData) {
                totalSize += JSON.stringify(slotData).length;
                slotCount++;
            }
        }

        const historySize = JSON.stringify(this.getHistory()).length;

        return {
            usedSlots: slotCount,
            totalSlots: this.maxSlots,
            storageSize: totalSize + historySize,
            historyEntries: this.getHistory().length
        };
    }

    /**
     * Register callback for slot changes
     */
    onSlotChange(callback) {
        this.slotCallbacks.push(callback);
    }

    /**
     * Notify all registered callbacks of slot changes
     */
    notifySlotChange(action, slotNumber, data) {
        this.slotCallbacks.forEach(callback => {
            try {
                callback(action, slotNumber, data);
            } catch (error) {
                console.error('Error in slot change callback:', error);
            }
        });
    }

    /**
     * Check if localStorage is available
     */
    isStorageAvailable() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (error) {
            return false;
        }
    }
}
