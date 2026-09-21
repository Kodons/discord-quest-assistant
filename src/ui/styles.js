/**
 * CSS Stylesheet untuk Floating UI Discord Quest Assistant
 */
function createStyles(containerId) {
    return `
        #${containerId} {
            position: fixed;
            top: 60px;
            right: 40px;
            width: 410px;
            background: #1e1f22;
            color: #dbdee1;
            border-radius: 12px;
            box-shadow: 0 12px 36px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.08);
            font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 13px;
            z-index: 99999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            user-select: none;
            transition: width 0.2s ease, opacity 0.2s ease;
        }
        #${containerId}.minimized {
            width: 260px;
        }
        #${containerId} * {
            box-sizing: border-box;
        }
        .dqu-header {
            background: #2b2d31;
            padding: 12px 14px;
            display: flex;
            align-items: center;
            justify-content: space-between;
            cursor: move;
            border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .dqu-title {
            font-weight: 700;
            color: #f2f3f5;
            display: flex;
            align-items: center;
            gap: 8px;
            font-size: 14px;
        }
        .dqu-title svg {
            fill: #5865f2;
            width: 18px;
            height: 18px;
        }
        .dqu-controls {
            display: flex;
            align-items: center;
            gap: 6px;
        }
        .dqu-btn-icon {
            background: transparent;
            border: none;
            color: #949ba4;
            cursor: pointer;
            padding: 4px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            transition: all 0.15s;
        }
        .dqu-btn-icon:hover {
            color: #f2f3f5;
            background: rgba(255, 255, 255, 0.1);
        }
        .dqu-btn-icon.close:hover {
            background: #f23f43;
            color: #ffffff;
        }
        .dqu-body {
            padding: 12px 14px;
            display: flex;
            flex-direction: column;
            gap: 12px;
            max-height: 520px;
            overflow-y: auto;
        }
        .dqu-body::-webkit-scrollbar {
            width: 6px;
        }
        .dqu-body::-webkit-scrollbar-thumb {
            background: #1a1b1e;
            border-radius: 3px;
        }
        .dqu-stats {
            background: #2b2d31;
            border-radius: 8px;
            padding: 10px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .dqu-stats-item {
            display: flex;
            flex-direction: column;
        }
        .dqu-stats-label {
            font-size: 10px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #949ba4;
            font-weight: 600;
        }
        .dqu-stats-val {
            font-weight: 700;
            font-size: 14px;
            color: #f2f3f5;
        }
        .dqu-filters {
            background: #2b2d31;
            border-radius: 8px;
            padding: 8px 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
        }
        .dqu-filter-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .dqu-select {
            background: #1e1f22;
            color: #dbdee1;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 5px 8px;
            font-size: 11px;
            font-family: inherit;
            cursor: pointer;
            flex: 1;
            outline: none;
            transition: border-color 0.15s;
        }
        .dqu-select:focus, .dqu-select:hover {
            border-color: #5865f2;
        }
        .dqu-search-input {
            background: #1e1f22;
            color: #f2f3f5;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 6px 10px;
            font-size: 11px;
            font-family: inherit;
            outline: none;
            width: 100%;
            transition: border-color 0.15s;
        }
        .dqu-search-input:focus {
            border-color: #5865f2;
        }
        .dqu-search-input::placeholder {
            color: #80848e;
        }
        .dqu-quest-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 250px;
            overflow-y: auto;
        }
        .dqu-quest-card {
            background: #2b2d31;
            border: 1px solid rgba(255, 255, 255, 0.04);
            border-radius: 8px;
            padding: 10px;
            display: flex;
            flex-direction: column;
            gap: 6px;
            transition: transform 0.15s, border-color 0.15s;
        }
        .dqu-quest-card:hover {
            border-color: rgba(88, 101, 242, 0.4);
        }
        .dqu-quest-card.active {
            border-color: #5865f2;
            background: rgba(88, 101, 242, 0.1);
        }
        .dqu-quest-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }
        .dqu-quest-name {
            font-weight: 600;
            color: #f2f3f5;
            font-size: 13px;
            line-height: 1.2;
        }
        .dqu-quest-badges {
            display: flex;
            gap: 4px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;
        }
        .dqu-badge {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            background: #383a40;
            color: #dbdee1;
            text-transform: uppercase;
            white-space: nowrap;
        }
        .dqu-badge.done {
            background: rgba(35, 165, 90, 0.2);
            color: #23a55a;
        }
        .dqu-badge.active {
            background: rgba(88, 101, 242, 0.2);
            color: #5865f2;
        }
        .dqu-badge.video {
            background: rgba(240, 178, 50, 0.2);
            color: #f0b232;
        }
        .dqu-method-tag {
            font-size: 10px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .dqu-method-tag.auto {
            background: rgba(88, 101, 242, 0.25);
            color: #5865f2;
            border: 1px solid rgba(88, 101, 242, 0.4);
        }
        .dqu-method-tag.manual {
            background: rgba(235, 69, 158, 0.2);
            color: #eb459e;
            border: 1px solid rgba(235, 69, 158, 0.4);
        }
        .dqu-reward-tag {
            font-size: 11px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        .dqu-reward-tag.orb {
            background: rgba(155, 89, 182, 0.2);
            color: #d7aefb;
            border: 1px solid rgba(155, 89, 182, 0.4);
        }
        .dqu-reward-tag.border {
            background: rgba(52, 152, 219, 0.2);
            color: #70c5ff;
            border: 1px solid rgba(52, 152, 219, 0.4);
        }
        .dqu-reward-tag.item {
            background: rgba(46, 204, 113, 0.2);
            color: #57f287;
            border: 1px solid rgba(46, 204, 113, 0.4);
        }
        .dqu-reward-tag.nitro {
            background: rgba(241, 196, 15, 0.2);
            color: #f1c40f;
            border: 1px solid rgba(241, 196, 15, 0.4);
        }
        .dqu-reward-tag.other {
            background: rgba(148, 155, 164, 0.15);
            color: #dbdee1;
            border: 1px solid rgba(148, 155, 164, 0.3);
        }
        .dqu-progress-wrap {
            height: 6px;
            background: #1e1f22;
            border-radius: 3px;
            overflow: hidden;
            position: relative;
        }
        .dqu-progress-bar {
            height: 100%;
            background: #5865f2;
            width: 0%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        .dqu-quest-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #949ba4;
        }
        .dqu-actions {
            display: flex;
            gap: 6px;
        }
        .dqu-btn {
            background: #5865f2;
            color: #ffffff;
            border: none;
            border-radius: 6px;
            padding: 8px 12px;
            font-weight: 600;
            font-size: 12px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            transition: background 0.15s, opacity 0.15s;
            flex: 1;
        }
        .dqu-btn:hover:not(:disabled) {
            background: #4752c4;
        }
        .dqu-btn:disabled {
            opacity: 0.5;
            cursor: not-allowed;
        }
        .dqu-btn.secondary {
            background: #4e5058;
            color: #ffffff;
        }
        .dqu-btn.secondary:hover:not(:disabled) {
            background: #6d6f78;
        }
        .dqu-btn.danger {
            background: #da373c;
            color: #ffffff;
        }
        .dqu-btn.danger:hover:not(:disabled) {
            background: #a1282c;
        }
        .dqu-btn.sm {
            padding: 4px 8px;
            font-size: 11px;
            flex: none;
        }
        .dqu-console {
            background: #111214;
            border-radius: 6px;
            padding: 8px;
            font-family: Consolas, monospace;
            font-size: 11px;
            color: #23a55a;
            height: 80px;
            overflow-y: auto;
            white-space: pre-wrap;
            border: 1px solid rgba(255, 255, 255, 0.05);
        }
        .dqu-console::-webkit-scrollbar {
            width: 4px;
        }
        .dqu-console::-webkit-scrollbar-thumb {
            background: #2b2d31;
        }
    `;
}

module.exports = {
    createStyles
};
