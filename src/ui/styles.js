/**
 * CSS Stylesheet untuk Floating UI Discord Quest Assistant
 */
function createStyles(containerId) {
    return `
        #${containerId} {
            position: fixed;
            top: 50px;
            right: 30px;
            width: 440px;
            background: rgba(30, 31, 34, 0.95);
            backdrop-filter: blur(20px);
            -webkit-backdrop-filter: blur(20px);
            color: #dbdee1;
            border-radius: 14px;
            box-shadow: 0 16px 48px rgba(0, 0, 0, 0.75), 0 0 0 1px rgba(255, 255, 255, 0.08);
            font-family: "gg sans", "Noto Sans", "Helvetica Neue", Helvetica, Arial, sans-serif;
            font-size: 13px;
            z-index: 99999;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            user-select: none;
            transition: width 0.25s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.2s ease;
        }
        #${containerId}.minimized {
            width: 280px;
        }
        #${containerId} * {
            box-sizing: border-box;
        }
        .dqu-header {
            background: rgba(43, 45, 49, 0.9);
            padding: 12px 16px;
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
            letter-spacing: 0.2px;
        }
        .dqu-title svg {
            fill: #5865f2;
            width: 19px;
            height: 19px;
            filter: drop-shadow(0 0 6px rgba(88, 101, 242, 0.5));
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
            padding: 4px 6px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            transition: all 0.15s ease;
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
            padding: 12px 16px;
            display: flex;
            flex-direction: column;
            gap: 10px;
            max-height: 560px;
            overflow-y: auto;
        }
        .dqu-body::-webkit-scrollbar {
            width: 6px;
        }
        .dqu-body::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.12);
            border-radius: 3px;
        }
        .dqu-body::-webkit-scrollbar-thumb:hover {
            background: rgba(255, 255, 255, 0.25);
        }

        /* Stats Bar */
        .dqu-stats {
            background: rgba(43, 45, 49, 0.7);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px 12px;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .dqu-stats-item {
            display: flex;
            flex-direction: column;
        }
        .dqu-stats-label {
            font-size: 9.5px;
            text-transform: uppercase;
            letter-spacing: 0.6px;
            color: #949ba4;
            font-weight: 700;
        }
        .dqu-stats-val {
            font-weight: 700;
            font-size: 13.5px;
            color: #f2f3f5;
            display: flex;
            align-items: center;
            gap: 5px;
        }
        .dqu-dot {
            width: 7px;
            height: 7px;
            border-radius: 50%;
            display: inline-block;
        }
        .dqu-dot.green { background: #23a55a; box-shadow: 0 0 6px #23a55a; }
        .dqu-dot.blue { background: #5865f2; box-shadow: 0 0 6px #5865f2; }
        .dqu-dot.pulse { animation: dquPulse 1.5s infinite; }
        @keyframes dquPulse {
            0% { transform: scale(0.95); opacity: 0.7; }
            50% { transform: scale(1.15); opacity: 1; }
            100% { transform: scale(0.95); opacity: 0.7; }
        }

        /* Filter Section */
        .dqu-filter-box {
            display: flex;
            flex-direction: column;
            gap: 7px;
            background: rgba(43, 45, 49, 0.6);
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-radius: 8px;
            padding: 8px 10px;
        }
        .dqu-search-row {
            display: flex;
            gap: 6px;
            align-items: center;
        }
        .dqu-search-wrap {
            position: relative;
            flex: 1;
            display: flex;
            align-items: center;
        }
        .dqu-search-icon {
            position: absolute;
            left: 8px;
            color: #80848e;
            font-size: 11px;
            pointer-events: none;
        }
        .dqu-search-input {
            width: 100%;
            background: #1e1f22;
            color: #f2f3f5;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 6px 26px 6px 26px;
            font-size: 11.5px;
            font-family: inherit;
            outline: none;
            transition: border-color 0.15s, box-shadow 0.15s;
        }
        .dqu-search-input:focus {
            border-color: #5865f2;
            box-shadow: 0 0 0 1px #5865f2;
        }
        .dqu-search-input::placeholder {
            color: #80848e;
        }
        .dqu-search-clear {
            position: absolute;
            right: 6px;
            background: transparent;
            border: none;
            color: #80848e;
            cursor: pointer;
            font-size: 11px;
            padding: 2px 4px;
            border-radius: 50%;
            display: none;
        }
        .dqu-search-clear:hover {
            color: #f2f3f5;
            background: rgba(255, 255, 255, 0.1);
        }
        .dqu-status-select {
            background: #1e1f22;
            color: #dbdee1;
            border: 1px solid rgba(255, 255, 255, 0.08);
            border-radius: 6px;
            padding: 5px 8px;
            font-size: 11px;
            font-family: inherit;
            cursor: pointer;
            outline: none;
            transition: border-color 0.15s;
            width: 130px;
        }
        .dqu-status-select:focus, .dqu-status-select:hover {
            border-color: #5865f2;
        }

        /* Filter Pill Tabs */
        .dqu-pills-row {
            display: flex;
            gap: 5px;
            align-items: center;
            overflow-x: auto;
            padding-bottom: 2px;
        }
        .dqu-pills-row::-webkit-scrollbar {
            height: 3px;
        }
        .dqu-pills-row::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
        }
        .dqu-pill {
            background: rgba(255, 255, 255, 0.06);
            border: 1px solid rgba(255, 255, 255, 0.06);
            color: #b5bac1;
            font-size: 10.5px;
            font-weight: 600;
            padding: 3px 9px;
            border-radius: 12px;
            cursor: pointer;
            white-space: nowrap;
            transition: all 0.15s ease;
            display: inline-flex;
            align-items: center;
            gap: 4px;
        }
        .dqu-pill:hover {
            background: rgba(255, 255, 255, 0.12);
            color: #f2f3f5;
        }
        .dqu-pill.active {
            background: #5865f2;
            color: #ffffff;
            border-color: #5865f2;
            box-shadow: 0 2px 8px rgba(88, 101, 242, 0.4);
        }

        /* Filter Info Count */
        .dqu-filter-info {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 10.5px;
            color: #949ba4;
            padding: 0 2px;
        }
        .dqu-filter-reset {
            color: #5865f2;
            cursor: pointer;
            text-decoration: underline;
        }
        .dqu-filter-reset:hover {
            color: #7983f5;
        }

        /* Quest List */
        .dqu-quest-list {
            display: flex;
            flex-direction: column;
            gap: 8px;
            max-height: 280px;
            overflow-y: auto;
            padding-right: 2px;
        }
        .dqu-quest-list::-webkit-scrollbar {
            width: 5px;
        }
        .dqu-quest-list::-webkit-scrollbar-thumb {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 3px;
        }

        /* Quest Card */
        .dqu-quest-card {
            background: #2b2d31;
            border: 1px solid rgba(255, 255, 255, 0.05);
            border-left: 3.5px solid #5865f2;
            border-radius: 9px;
            padding: 10px 12px;
            display: flex;
            flex-direction: column;
            gap: 7px;
            transition: transform 0.15s ease, border-color 0.15s ease, box-shadow 0.15s ease;
        }
        .dqu-quest-card:hover {
            border-color: rgba(88, 101, 242, 0.4);
            transform: translateY(-1px);
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        }
        .dqu-quest-card.accent-orb { border-left-color: #9b59b6; }
        .dqu-quest-card.accent-border { border-left-color: #3498db; }
        .dqu-quest-card.accent-item { border-left-color: #2ecc71; }
        .dqu-quest-card.accent-nitro { border-left-color: #f1c40f; }
        .dqu-quest-card.active {
            border-color: #5865f2;
            background: rgba(88, 101, 242, 0.08);
        }

        .dqu-quest-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 8px;
        }
        .dqu-quest-title-wrap {
            flex: 1;
            min-width: 0;
        }
        .dqu-quest-name {
            font-weight: 700;
            color: #f2f3f5;
            font-size: 13px;
            line-height: 1.25;
            word-break: break-word;
        }
        .dqu-quest-tags {
            display: flex;
            gap: 5px;
            align-items: center;
            margin-top: 4px;
            flex-wrap: wrap;
        }
        .dqu-quest-badges {
            display: flex;
            gap: 4px;
            align-items: center;
            flex-wrap: wrap;
            justify-content: flex-end;
        }

        .dqu-badge {
            font-size: 9.5px;
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
            border: 1px solid rgba(35, 165, 90, 0.3);
        }
        .dqu-badge.active {
            background: rgba(88, 101, 242, 0.2);
            color: #5865f2;
            border: 1px solid rgba(88, 101, 242, 0.3);
        }

        .dqu-method-tag {
            font-size: 9.5px;
            font-weight: 700;
            padding: 2px 6px;
            border-radius: 4px;
            white-space: nowrap;
        }
        .dqu-method-tag.auto {
            background: rgba(88, 101, 242, 0.2);
            color: #7983f5;
            border: 1px solid rgba(88, 101, 242, 0.35);
        }
        .dqu-method-tag.manual {
            background: rgba(235, 69, 158, 0.2);
            color: #f47fff;
            border: 1px solid rgba(235, 69, 158, 0.35);
        }

        .dqu-reward-tag {
            font-size: 10.5px;
            font-weight: 600;
            padding: 2px 7px;
            border-radius: 4px;
            display: inline-flex;
            align-items: center;
            gap: 4px;
            white-space: nowrap;
        }
        .dqu-reward-tag.orb {
            background: rgba(155, 89, 182, 0.22);
            color: #d7aefb;
            border: 1px solid rgba(155, 89, 182, 0.45);
        }
        .dqu-reward-tag.border {
            background: rgba(52, 152, 219, 0.22);
            color: #70c5ff;
            border: 1px solid rgba(52, 152, 219, 0.45);
        }
        .dqu-reward-tag.item {
            background: rgba(46, 204, 113, 0.22);
            color: #57f287;
            border: 1px solid rgba(46, 204, 113, 0.45);
        }
        .dqu-reward-tag.nitro {
            background: rgba(241, 196, 15, 0.22);
            color: #f1c40f;
            border: 1px solid rgba(241, 196, 15, 0.45);
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
            background: linear-gradient(90deg, #5865f2, #7983f5);
            width: 0%;
            border-radius: 3px;
            transition: width 0.3s ease;
        }
        .dqu-progress-bar.done {
            background: linear-gradient(90deg, #23a55a, #2dc770);
        }

        .dqu-quest-footer {
            display: flex;
            justify-content: space-between;
            align-items: center;
            font-size: 11px;
            color: #949ba4;
        }

        /* Action Buttons */
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
            transition: all 0.15s ease;
            flex: 1;
        }
        .dqu-btn:hover:not(:disabled) {
            background: #4752c4;
            box-shadow: 0 2px 8px rgba(88, 101, 242, 0.4);
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

        /* Console Output */
        .dqu-console {
            background: #111214;
            border-radius: 6px;
            padding: 8px 10px;
            font-family: Consolas, monospace;
            font-size: 11px;
            color: #23a55a;
            height: 75px;
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
